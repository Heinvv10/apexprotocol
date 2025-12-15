/**
 * Cron API - Monitor Worker
 * Processes pending monitoring jobs
 * Called by Vercel Cron or external scheduler
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { runMonitorWorker, getMonitorWorkerStatus } from "@/lib/queue/workers/monitor-worker";

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
 * POST - Run worker to process pending jobs
 */
export async function POST() {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runMonitorWorker();

    return NextResponse.json({
      success: true,
      ...result,
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
