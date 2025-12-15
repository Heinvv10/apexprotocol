/**
 * Cron API - Job Scheduler
 * Processes due scheduled jobs and creates new jobs
 * Called by Vercel Cron or external scheduler
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  processDueSchedules,
  getSchedulerStatus,
  syncSchedulesFromDatabase,
} from "@/lib/queue/scheduler";

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
 * GET - Get scheduler status
 */
export async function GET() {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getSchedulerStatus();

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
 * POST - Process due schedules
 */
export async function POST() {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First sync schedules from database to Redis
    await syncSchedulesFromDatabase();

    // Process due schedules
    const result = await processDueSchedules();

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
