/**
 * Retention Purge Cron Job (Phase 1.3)
 *
 * Purges historical data beyond each organization's plan-tier retention
 * window. Intended to run daily via Vercel Cron.
 *
 * Schedule: daily at 03:00 UTC (configure in vercel.json).
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { runRetentionPurge } from "@/lib/retention/retention-policy";
import { logger } from "@/lib/logger";

async function verifyCronSecret(_request: Request): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "development") return true;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  return false;
}

export async function GET(request: Request) {
  if (!(await verifyCronSecret(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "true";

  try {
    const summary = await runRetentionPurge({ dryRun });
    logger.info("cron.retention_purge_done", {
      dryRun,
      organizationsProcessed: summary.organizationsProcessed,
      totalPurgedMentions: summary.totalPurgedMentions,
      totalPurgedAudits: summary.totalPurgedAudits,
      durationMs: summary.durationMs,
    });
    return NextResponse.json({
      success: true,
      ...summary,
      startedAt: summary.startedAt.toISOString(),
      finishedAt: summary.finishedAt.toISOString(),
      results: summary.results.map((r) => ({
        ...r,
        cutoffDate: r.cutoffDate.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("cron.retention_purge_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
