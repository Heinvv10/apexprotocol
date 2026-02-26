/**
 * Cron API - Monitor Worker
 * Processes pending monitoring jobs and queues new jobs for active brands
 * Called by Vercel Cron or external scheduler
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { runMonitorWorker, getMonitorWorkerStatus } from "@/lib/queue/workers/monitor-worker";
import { addMonitorJob } from "@/lib/queue";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Verify cron secret for security
async function verifyCronSecret(): Promise<boolean> {
  const headersList = await headers();
  const cronSecret = headersList.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  // Allow in development without secret
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return cronSecret === expectedSecret;
}

/**
 * GET - Get worker status
 */
export async function GET() {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getMonitorWorkerStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Queue monitoring jobs for ALL active brands and process pending jobs
 *
 * Query params:
 * - action=queue: Only queue jobs (don't process)
 * - action=process: Only process pending jobs (don't queue new)
 * - (default): Queue jobs for all active brands AND process pending jobs
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Action: only queue jobs for all active brands
    if (action === "queue") {
      return await queueAllActiveBrands();
    }

    // Action: only process pending jobs
    if (action === "process") {
      const result = await runMonitorWorker();
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Default: queue jobs for ALL active brands AND process pending jobs
    // Step 1: Queue jobs for all active brands
    const queueResult = await queueJobsForActiveBrands();

    // Step 2: Process pending jobs
    const processResult = await runMonitorWorker();

    return NextResponse.json({
      success: true,
      queued: queueResult,
      processed: processResult,
    });
  } catch (error) {
    logger.error("[CronMonitor] Cron job failed", { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Result type for queuing jobs
interface QueueResult {
  total: number;
  succeeded: number;
  failed: number;
  jobs: Array<{ brandId: string; brandName: string; jobId: string }>;
  errors?: Array<{ brandId: string; error: string }>;
}

/**
 * Queue monitoring jobs for ALL active brands (internal helper)
 * Returns result object for use in combined endpoint
 */
async function queueJobsForActiveBrands(): Promise<QueueResult> {
  // Fetch all active brands with monitoring enabled
  const activeBrands = await db
    .select({
      id: brands.id,
      name: brands.name,
      organizationId: brands.organizationId,
      monitoringPlatforms: brands.monitoringPlatforms,
    })
    .from(brands)
    .where(
      and(
        eq(brands.isActive, true),
        eq(brands.monitoringEnabled, true)
      )
    );

  if (activeBrands.length === 0) {
    return {
      total: 0,
      succeeded: 0,
      failed: 0,
      jobs: [],
    };
  }

  // Queue a monitoring job for each brand
  const queuedJobs: Array<{ brandId: string; brandName: string; jobId: string }> = [];
  const errors: Array<{ brandId: string; error: string }> = [];

  for (const brand of activeBrands) {
    try {
      const job = await addMonitorJob(
        brand.id,
        brand.organizationId,
        {
          platforms: brand.monitoringPlatforms as string[] | undefined,
        }
      );

      queuedJobs.push({
        brandId: brand.id,
        brandName: brand.name,
        jobId: job.id,
      });

      logger.info("[CronMonitor] Queued monitoring job", {
        brandId: brand.id,
        brandName: brand.name,
        jobId: job.id,
      });
    } catch (jobError) {
      errors.push({
        brandId: brand.id,
        error: jobError instanceof Error ? jobError.message : String(jobError),
      });

      logger.error("[CronMonitor] Failed to queue job", {
        brandId: brand.id,
        error: jobError,
      });
    }
  }

  return {
    total: activeBrands.length,
    succeeded: queuedJobs.length,
    failed: errors.length,
    jobs: queuedJobs,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Queue monitoring jobs for ALL active brands with monitoring enabled
 * Returns NextResponse for direct endpoint use
 */
async function queueAllActiveBrands(): Promise<NextResponse> {
  try {
    const result = await queueJobsForActiveBrands();

    if (result.total === 0) {
      return NextResponse.json({
        success: true,
        message: "No active brands with monitoring enabled",
        queued: result,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${result.succeeded} monitoring jobs`,
      queued: result,
    });
  } catch (error) {
    logger.error("[CronMonitor] Failed to queue all brands", { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
