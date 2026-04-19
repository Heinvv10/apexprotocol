/**
 * Insights API
 * 
 * "Why" analysis and content gap detection
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  analyzeVisibilityChange,
  batchAnalyzeVisibility,
  getInsightsSummary,
} from "@/lib/insights/why-analysis";
import {
  analyzeContentGaps,
  getQuickGapSummary,
} from "@/lib/insights/content-gaps";

// GET - Get insights for a brand
export async function GET(request: NextRequest) {
  try {
    const __session = await getSession();
  const { orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const type = searchParams.get("type") || "summary"; // summary, why, gaps
    const platform = searchParams.get("platform");
    const days = parseInt(searchParams.get("days") || "7");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Get brand details
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    switch (type) {
      case "summary": {
        const summary = await getInsightsSummary(brandId, brand.name, days);
        return NextResponse.json({
          success: true,
          data: summary,
        });
      }

      case "why": {
        if (platform) {
          // Single platform analysis
          const analysis = await analyzeVisibilityChange(
            brandId,
            brand.name,
            platform,
            days
          );
          return NextResponse.json({
            success: true,
            data: analysis,
          });
        } else {
          // All platforms
          const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok"];
          const analyses = await batchAnalyzeVisibility(
            brandId,
            brand.name,
            platforms,
            days
          );
          return NextResponse.json({
            success: true,
            data: analyses,
          });
        }
      }

      case "gaps": {
        const competitors = (brand.competitors as unknown as string[]) || [];
        if (competitors.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              gaps: [],
              summary: {
                totalGaps: 0,
                highPriority: 0,
                topCompetitors: [],
                topMissingTopics: [],
              },
              message: "No competitors configured for gap analysis",
            },
          });
        }

        const gaps = await analyzeContentGaps(
          brandId,
          brand.name,
          competitors,
          days
        );
        return NextResponse.json({
          success: true,
          data: gaps,
        });
      }

      case "quick-gaps": {
        const competitors = (brand.competitors as unknown as string[]) || [];
        const quickSummary = await getQuickGapSummary(
          brandId,
          brand.name,
          competitors
        );
        return NextResponse.json({
          success: true,
          data: quickSummary,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: summary, why, gaps, quick-gaps" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

// POST - Generate on-demand analysis
export async function POST(request: NextRequest) {
  try {
    const __session = await getSession();
  const { orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, type, platforms, competitors, days = 7 } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Get brand details
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    switch (type) {
      case "why-analysis": {
        const targetPlatforms = platforms || ["chatgpt", "claude", "gemini", "perplexity", "grok"];
        const analyses = await batchAnalyzeVisibility(
          brandId,
          brand.name,
          targetPlatforms,
          days
        );
        return NextResponse.json({
          success: true,
          data: analyses,
        });
      }

      case "content-gaps": {
        const targetCompetitors = competitors || (brand.competitors as unknown as string[]) || [];
        if (targetCompetitors.length === 0) {
          return NextResponse.json(
            { error: "No competitors provided for gap analysis" },
            { status: 400 }
          );
        }

        const gaps = await analyzeContentGaps(
          brandId,
          brand.name,
          targetCompetitors,
          days
        );
        return NextResponse.json({
          success: true,
          data: gaps,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: why-analysis, content-gaps" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
