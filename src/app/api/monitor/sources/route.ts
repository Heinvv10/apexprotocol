/**
 * Source Attribution API (Phase 5.1)
 * GET /api/monitor/sources?brandId=...&windowDays=90&limit=50
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { analyzeBrandSources } from "@/lib/monitor/source-attribution";

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
      365,
      Math.max(7, parseInt(searchParams.get("windowDays") ?? "90", 10) || 90),
    );
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50),
    );

    const result = await analyzeBrandSources(brandId, { windowDays, limit });

    return NextResponse.json({
      success: true,
      ...result,
      sources: result.sources.map((s) => ({
        ...s,
        firstCitedAt: s.firstCitedAt.toISOString(),
        lastCitedAt: s.lastCitedAt.toISOString(),
        urls: s.urls.map((u) => ({
          ...u,
          lastCitedAt: u.lastCitedAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to analyze sources",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
