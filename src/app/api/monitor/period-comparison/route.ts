/**
 * Period-over-period comparison API (Phase 1.3)
 * GET /api/monitor/period-comparison?brandId=...&period=mom|qoq|yoy|all
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import {
  compareBrandAllPeriods,
  compareBrandPeriods,
  type ComparisonPeriod,
  type PeriodComparisonResult,
} from "@/lib/monitor/period-comparison";

function serialize(result: PeriodComparisonResult) {
  return {
    ...result,
    currentPeriod: {
      ...result.currentPeriod,
      start: result.currentPeriod.start.toISOString(),
      end: result.currentPeriod.end.toISOString(),
    },
    previousPeriod: {
      ...result.previousPeriod,
      start: result.previousPeriod.start.toISOString(),
      end: result.previousPeriod.end.toISOString(),
    },
  };
}

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

    const period = (searchParams.get("period") ?? "all").toLowerCase();

    if (period === "all") {
      const all = await compareBrandAllPeriods(brandId);
      return NextResponse.json({
        success: true,
        comparisons: {
          mom: serialize(all.mom),
          qoq: serialize(all.qoq),
          yoy: serialize(all.yoy),
        },
      });
    }

    if (period !== "mom" && period !== "qoq" && period !== "yoy") {
      return NextResponse.json(
        { error: "period must be mom, qoq, yoy, or all" },
        { status: 400 },
      );
    }

    const result = await compareBrandPeriods(
      brandId,
      period as ComparisonPeriod,
    );

    return NextResponse.json({
      success: true,
      comparison: serialize(result),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute period comparison",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
