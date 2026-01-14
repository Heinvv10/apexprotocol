/**
 * GEO Best Practices API
 *
 * GET /api/geo/best-practices - Get all active best practices
 * GET /api/geo/best-practices?platform=chatgpt - Filter by platform
 * GET /api/geo/best-practices?category=schema - Filter by category
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  getActiveBestPractices,
  getBestPracticesByPlatform,
  getHighImpactPractices,
  getKnowledgeBaseSummary,
} from "@/lib/geo/knowledge-base";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const category = searchParams.get("category");
    const highImpactOnly = searchParams.get("high-impact") === "true";
    const includeSummary = searchParams.get("summary") === "true";

    let practices;
    if (highImpactOnly) {
      practices = await getHighImpactPractices();
    } else if (platform) {
      practices = await getBestPracticesByPlatform(platform);
    } else {
      practices = await getActiveBestPractices(
        platform || undefined,
        category || undefined
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      data: practices,
      metadata: {
        total: practices.length,
        filters: { platform, category, highImpactOnly },
        generatedAt: new Date().toISOString(),
      },
    };

    if (includeSummary) {
      response.summary = await getKnowledgeBaseSummary();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("GEO Best Practices API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch best practices",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
