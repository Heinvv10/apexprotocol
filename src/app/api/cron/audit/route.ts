/**
 * Cron API - Audit Worker
 * Processes pending audit jobs
 * Called by Vercel Cron or external scheduler
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { runAuditWorker, getAuditWorkerStatus } from "@/lib/queue/workers/audit-worker";
import { auditQueue } from "@/lib/queue";

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

    const status = await getAuditWorkerStatus();

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

    // Resurrect any jobs stuck in the 'active' state past the timeout —
    // typically orphaned by a dev server restart or a worker crash. Without
    // this, a killed worker leaves jobs claimed indefinitely.
    let staleCleaned = 0;
    try {
      staleCleaned = await auditQueue.cleanStaleJobs(60 * 60 * 1000);
    } catch (err) {
      // cleanStaleJobs is best-effort — don't block the worker on cleanup.
      console.error("[Audit Cron] cleanStaleJobs failed:", err);
    }

    const result = await runAuditWorker();

    return NextResponse.json({
      success: true,
      staleCleaned,
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
