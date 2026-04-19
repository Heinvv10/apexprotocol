/**
 * Competitive Scores API
 * GET /api/competitive/scores - Get all competitor scores with 5-score breakdown
 * POST /api/competitive/scores - Calculate/refresh competitor scores
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateBrandScores,
  calculateCompetitorScores,
  getCompetitorScores,
  refreshAllCompetitorScores,
  calculateGapAnalysis,
  type BrandScoreResult,
  type CompetitorScoreResult,
  type GapAnalysis,
} from "@/lib/competitive";

export interface ScoresResponse {
  brandId: string;
  brandName: string;
  brandScore: BrandScoreResult;
  competitorScores: CompetitorScoreResult[];
  ranking: {
    position: number;
    total: number;
    percentile: number;
  };
  lastUpdated: string;
}

export interface ScoresWithGapResponse extends ScoresResponse {
  gapAnalysis: GapAnalysis;
}

/**
 * GET /api/competitive/scores
 * Get competitor scores for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const includeGapAnalysis = searchParams.get("includeGapAnalysis") === "true";
    const useCache = searchParams.get("useCache") !== "false";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Try to get cached scores if useCache is true
    let competitorScores: CompetitorScoreResult[];

    if (useCache) {
      try {
        const cachedScores = await getCompetitorScores(brandId);
        if (cachedScores.length > 0) {
          competitorScores = cachedScores.map(score => ({
            competitorName: score.competitorName,
            competitorDomain: score.competitorDomain || undefined,
            geoScore: score.geoScore,
            seoScore: score.seoScore,
            aeoScore: score.aeoScore,
            smoScore: score.smoScore,
            ppoScore: score.ppoScore,
            unifiedScore: score.unifiedScore,
            grade: score.grade,
            confidence: score.confidence,
            dataSource: score.dataSource as "scraped" | "estimated" | "manual",
            breakdown: {
              geo: score.geoBreakdown as any,
              seo: score.seoBreakdown as any,
              aeo: score.aeoBreakdown as any,
              smo: score.smoBreakdown as any,
              ppo: score.ppoBreakdown as any,
            },
          }));
        } else {
          competitorScores = await calculateCompetitorScores(brandId);
        }
      } catch (cacheError) {
        // Cache lookup failed (table might not exist), fall back to calculation
        console.warn("Cache lookup failed, calculating scores:", cacheError);
        competitorScores = await calculateCompetitorScores(brandId);
      }
    } else {
      competitorScores = await calculateCompetitorScores(brandId);
    }

    // Calculate brand score
    const brandScore = await calculateBrandScores(brandId);

    // Calculate ranking
    const allScores = [
      brandScore.unifiedScore,
      ...competitorScores.map(c => c.unifiedScore),
    ].sort((a, b) => b - a);

    const position = allScores.indexOf(brandScore.unifiedScore) + 1;
    const total = allScores.length;
    // When total === 1 (no competitors), the (total-1) divisor is 0. Guard
    // that case separately — otherwise the old `|| 100` fallback also
    // triggered for valid worst-position=0 percentile, making the UI say
    // "#N of N (100th percentile)" for last place.
    const percentile =
      total <= 1
        ? 100
        : Math.round(((total - position) / (total - 1)) * 100);

    const response: ScoresResponse = {
      brandId,
      brandName: brand.name,
      brandScore,
      competitorScores,
      ranking: {
        position,
        total,
        percentile,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Include gap analysis if requested
    if (includeGapAnalysis) {
      const gapAnalysis = await calculateGapAnalysis(brandId);
      return NextResponse.json({
        ...response,
        gapAnalysis,
      } as ScoresWithGapResponse);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in competitive scores GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitive scores" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitive/scores
 * Calculate/refresh competitor scores
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, action = "refresh" } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    switch (action) {
      case "refresh":
        // Refresh all competitor scores
        const refreshedScores = await refreshAllCompetitorScores(brandId);
        const brandScore = await calculateBrandScores(brandId);

        return NextResponse.json({
          success: true,
          brandScore,
          competitorScores: refreshedScores,
          message: "Scores refreshed successfully",
        });

      case "calculate":
        // Calculate scores without saving
        const calculatedScores = await calculateCompetitorScores(brandId);
        const calculatedBrandScore = await calculateBrandScores(brandId);

        return NextResponse.json({
          success: true,
          brandScore: calculatedBrandScore,
          competitorScores: calculatedScores,
          message: "Scores calculated (not saved)",
        });

      case "gapAnalysis":
        // Run full gap analysis
        const gapAnalysis = await calculateGapAnalysis(brandId);
        return NextResponse.json({
          success: true,
          gapAnalysis,
          message: "Gap analysis completed",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'refresh', 'calculate', or 'gapAnalysis'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in competitive scores POST:", error);
    return NextResponse.json(
      { error: "Failed to process scores request" },
      { status: 500 }
    );
  }
}
