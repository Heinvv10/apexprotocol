/**
 * Why Analysis API (Phase 2.1)
 * GET /api/monitor/why-analysis?brandId=...&windowDays=30
 *
 * Root-cause attribution for visibility changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { analyzeWhy } from "@/lib/ml/why-analysis";

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

    const windowDays = Math.min(
      180,
      Math.max(7, parseInt(searchParams.get("windowDays") ?? "30", 10) || 30),
    );
    const gapDays = Math.max(
      0,
      parseInt(searchParams.get("gapDays") ?? "0", 10) || 0,
    );

    const result = await analyzeWhy(brandId, { windowDays, gapDays });

    return NextResponse.json({
      success: true,
      analysis: {
        ...result,
        currentWindow: {
          start: result.currentWindow.start.toISOString(),
          end: result.currentWindow.end.toISOString(),
        },
        baselineWindow: {
          start: result.baselineWindow.start.toISOString(),
          end: result.baselineWindow.end.toISOString(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to run why-analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
