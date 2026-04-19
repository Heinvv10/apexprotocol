/**
 * Competitive Snapshot Cron Endpoint
 * Phase 9.1: Daily competitor metrics capture
 *
 * This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
 * to capture daily snapshots of competitor metrics for all brands.
 *
 * Schedule: Daily at midnight UTC
 * Vercel cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/competitive-snapshot",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  captureAllBrandSnapshots,
  captureCompetitorSnapshots,
  cleanupOldSnapshots,
} from "@/lib/competitive/snapshot-service";
import { logger } from "@/lib/logger";

// Verify cron authorization
function verifyCronAuth(request: NextRequest): boolean {
  // Check for Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // For development/testing, allow if no secret is set
  if (process.env.NODE_ENV === "development" && !cronSecret) {
    return true;
  }

  // Vercel Cron jobs have a specific header
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (vercelCronHeader === "true") {
    return true;
  }

  return false;
}

/**
 * GET /api/cron/competitive-snapshot
 * Trigger snapshot capture for all brands
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    logger.info("[Cron] Starting competitive snapshot capture...");

    // Capture snapshots for all brands
    const result = await captureAllBrandSnapshots();

    logger.info(`[Cron] Completed: ${result.totalSnapshots} snapshots for ${result.totalBrands} brands`);

    // Clean up old snapshots (90 day retention)
    const cleaned = await cleanupOldSnapshots(90);

    return NextResponse.json({
      success: true,
      message: "Competitive snapshots captured successfully",
      summary: {
        brandsProcessed: result.totalBrands,
        snapshotsCreated: result.totalSnapshots,
        errors: result.errors.length,
        oldSnapshotsCleaned: cleaned,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error capturing competitive snapshots:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/competitive-snapshot
 * Trigger snapshot capture for a specific brand (manual trigger)
 */
export async function POST(request: NextRequest) {
  // For manual triggers, verify cron auth or use a different auth mechanism
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { brandId, cleanupDays } = body as {
      brandId?: string;
      cleanupDays?: number;
    };

    // If brandId provided, snapshot just that brand
    if (brandId) {
      logger.info(`[Cron] Manual snapshot trigger for brand ${brandId}`);

      const result = await captureCompetitorSnapshots(brandId);

      return NextResponse.json({
        success: true,
        message: `Snapshots captured for brand ${brandId}`,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    // If cleanupDays provided, run cleanup
    if (cleanupDays !== undefined) {
      logger.info(`[Cron] Running cleanup for snapshots older than ${cleanupDays} days`);

      const cleaned = await cleanupOldSnapshots(cleanupDays);

      return NextResponse.json({
        success: true,
        message: `Cleaned up old snapshots`,
        cleaned,
        timestamp: new Date().toISOString(),
      });
    }

    // Default: run full snapshot for all brands
    const result = await captureAllBrandSnapshots();

    return NextResponse.json({
      success: true,
      message: "Competitive snapshots captured successfully",
      summary: {
        brandsProcessed: result.totalBrands,
        snapshotsCreated: result.totalSnapshots,
        errors: result.errors.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error in manual snapshot trigger:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
