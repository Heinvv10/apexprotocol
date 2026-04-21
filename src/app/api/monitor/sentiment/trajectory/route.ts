/**
 * Sentiment Trajectory API (Phase 5.2)
 * GET /api/monitor/sentiment/trajectory?brandId=...&granularity=day|week&windowDays=90
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { buildSentimentTrajectory } from "@/lib/monitor/sentiment-trajectory";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 },
      );
    }

    const granularityParam = searchParams.get("granularity");
    const granularity =
      granularityParam === "week" ? "week" : "day";
    const windowDaysParam = searchParams.get("windowDays");
    const windowDays = windowDaysParam
      ? Math.min(365, Math.max(7, parseInt(windowDaysParam, 10) || 90))
      : 90;

    const result = await buildSentimentTrajectory(brandId, {
      granularity,
      windowDays,
    });

    return NextResponse.json({
      success: true,
      trajectory: {
        ...result,
        windowStart: result.windowStart.toISOString(),
        windowEnd: result.windowEnd.toISOString(),
        buckets: result.buckets.map((b) => ({
          ...b,
          periodStart: b.periodStart.toISOString(),
          periodEnd: b.periodEnd.toISOString(),
        })),
        triggers: result.triggers.map((t) => ({
          ...t,
          periodStart: t.periodStart.toISOString(),
        })),
        forecast: result.forecast
          ? {
              predictions: result.forecast.predictions.map((p) => ({
                ...p,
                date: p.date.toISOString(),
              })),
              isReliable: result.forecast.isReliable,
              rSquared: result.forecast.modelMetadata.rSquared,
              warnings: result.forecast.warnings,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute sentiment trajectory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
