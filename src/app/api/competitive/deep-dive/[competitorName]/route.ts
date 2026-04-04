/**
 * Competitor Deep Dive API
 * GET /api/competitive/deep-dive/[competitorName] - Detailed competitor analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { brands, competitorSnapshots, competitorMentions, competitorScores } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import {
  calculateBrandScores,
  type BrandScoreResult,
  type CompetitorScoreResult,
} from "@/lib/competitive";

interface Params {
  params: Promise<{
    competitorName: string;
  }>;
}

export interface DeepDiveResponse {
  competitor: {
    name: string;
    domain?: string;
    scores: CompetitorScoreResult | null;
  };
  brand: {
    id: string;
    name: string;
    scores: BrandScoreResult;
  };
  headToHead: {
    geoComparison: ComparisonResult;
    seoComparison: ComparisonResult;
    aeoComparison: ComparisonResult;
    smoComparison: ComparisonResult;
    ppoComparison: ComparisonResult;
    overallWinner: "brand" | "competitor" | "tie";
    brandWinCount: number;
    competitorWinCount: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  actionPlan: string[];
  historicalTrend: {
    date: string;
    competitorScore?: number;
    brandScore?: number;
  }[];
}

interface ComparisonResult {
  category: string;
  brandScore: number;
  competitorScore: number;
  gap: number;
  winner: "brand" | "competitor" | "tie";
  insight: string;
}

/**
 * GET /api/competitive/deep-dive/[competitorName]
 * Get detailed analysis of a specific competitor
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitorName } = await params;
    const decodedName = decodeURIComponent(competitorName);

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get brand scores
    const brandScores = await calculateBrandScores(brandId);

    // Get competitor scores from database
    const storedScore = await db.query.competitorScores.findFirst({
      where: and(
        eq(competitorScores.brandId, brandId),
        eq(competitorScores.competitorName, decodedName)
      ),
    });

    // Convert stored score to CompetitorScoreResult format
    let competitorScore: CompetitorScoreResult | null = null;

    if (storedScore) {
      competitorScore = {
        competitorName: storedScore.competitorName,
        competitorDomain: storedScore.competitorDomain || undefined,
        geoScore: storedScore.geoScore,
        seoScore: storedScore.seoScore,
        aeoScore: storedScore.aeoScore,
        smoScore: storedScore.smoScore,
        ppoScore: storedScore.ppoScore,
        unifiedScore: storedScore.unifiedScore,
        grade: storedScore.grade,
        confidence: storedScore.confidence,
        dataSource: storedScore.dataSource as "scraped" | "estimated" | "manual",
        breakdown: {
          geo: storedScore.geoBreakdown as any,
          seo: storedScore.seoBreakdown as any,
          aeo: storedScore.aeoBreakdown as any,
          smo: storedScore.smoBreakdown as any,
          ppo: storedScore.ppoBreakdown as any,
        },
      };
    }

    // Build head-to-head comparison
    const headToHead = buildHeadToHead(brandScores, competitorScore);

    // Generate SWOT analysis
    const { strengths, weaknesses, opportunities, threats } = generateSWOT(
      brandScores,
      competitorScore,
      decodedName
    );

    // Generate action plan
    const actionPlan = generateActionPlan(brandScores, competitorScore, decodedName);

    // Get historical trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshots = await db.query.competitorSnapshots.findMany({
      where: and(
        eq(competitorSnapshots.brandId, brandId),
        eq(competitorSnapshots.competitorName, decodedName),
        gte(competitorSnapshots.createdAt, thirtyDaysAgo)
      ),
      orderBy: desc(competitorSnapshots.createdAt),
      limit: 30,
    });

    const historicalTrend = snapshots.map(s => ({
      date: s.snapshotDate,
      competitorScore: s.geoScore || undefined,
    }));

    const response: DeepDiveResponse = {
      competitor: {
        name: decodedName,
        domain: competitorScore?.competitorDomain,
        scores: competitorScore,
      },
      brand: {
        id: brandId,
        name: brand.name,
        scores: brandScores,
      },
      headToHead,
      strengths,
      weaknesses,
      opportunities,
      threats,
      actionPlan,
      historicalTrend,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in deep-dive GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitor analysis" },
      { status: 500 }
    );
  }
}

/**
 * Build head-to-head comparison between brand and competitor
 */
function buildHeadToHead(
  brandScores: BrandScoreResult,
  competitorScores: CompetitorScoreResult | null
): DeepDiveResponse["headToHead"] {
  const defaultCompetitorScore = competitorScores || {
    geoScore: 50,
    seoScore: 50,
    aeoScore: 50,
    smoScore: 50,
    ppoScore: 50,
  };

  const buildComparison = (
    category: string,
    brandScore: number,
    competitorScore: number
  ): ComparisonResult => {
    const gap = brandScore - competitorScore;
    let winner: "brand" | "competitor" | "tie" = "tie";
    let insight = "";

    if (gap > 5) {
      winner = "brand";
      insight = `You're ahead by ${gap} points in ${category}. Maintain this advantage.`;
    } else if (gap < -5) {
      winner = "competitor";
      insight = `Competitor leads by ${Math.abs(gap)} points in ${category}. Focus on improvement here.`;
    } else {
      insight = `Scores are competitive in ${category}. Small improvements can make a difference.`;
    }

    return { category, brandScore, competitorScore, gap, winner, insight };
  };

  const geoComparison = buildComparison("GEO", brandScores.geoScore, defaultCompetitorScore.geoScore);
  const seoComparison = buildComparison("SEO", brandScores.seoScore, defaultCompetitorScore.seoScore);
  const aeoComparison = buildComparison("AEO", brandScores.aeoScore, defaultCompetitorScore.aeoScore);
  const smoComparison = buildComparison("SMO", brandScores.smoScore, defaultCompetitorScore.smoScore);
  const ppoComparison = buildComparison("PPO", brandScores.ppoScore, defaultCompetitorScore.ppoScore);

  const comparisons = [geoComparison, seoComparison, aeoComparison, smoComparison, ppoComparison];
  const brandWinCount = comparisons.filter(c => c.winner === "brand").length;
  const competitorWinCount = comparisons.filter(c => c.winner === "competitor").length;

  let overallWinner: "brand" | "competitor" | "tie" = "tie";
  if (brandWinCount > competitorWinCount) {
    overallWinner = "brand";
  } else if (competitorWinCount > brandWinCount) {
    overallWinner = "competitor";
  }

  return {
    geoComparison,
    seoComparison,
    aeoComparison,
    smoComparison,
    ppoComparison,
    overallWinner,
    brandWinCount,
    competitorWinCount,
  };
}

/**
 * Generate SWOT analysis
 */
function generateSWOT(
  brandScores: BrandScoreResult,
  competitorScores: CompetitorScoreResult | null,
  competitorName: string
): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  const compScores = competitorScores || {
    geoScore: 50,
    seoScore: 50,
    aeoScore: 50,
    smoScore: 50,
    ppoScore: 50,
  };

  // Strengths - where brand leads
  if (brandScores.geoScore > compScores.geoScore + 5) {
    strengths.push(`Strong AI visibility compared to ${competitorName}`);
  }
  if (brandScores.seoScore > compScores.seoScore + 5) {
    strengths.push(`Better technical SEO foundation`);
  }
  if (brandScores.aeoScore > compScores.aeoScore + 5) {
    strengths.push(`Higher citation rate in AI responses`);
  }
  if (brandScores.smoScore > compScores.smoScore + 5) {
    strengths.push(`Stronger social media presence`);
  }
  if (brandScores.ppoScore > compScores.ppoScore + 5) {
    strengths.push(`Better leadership visibility`);
  }

  // Weaknesses - where competitor leads
  if (compScores.geoScore > brandScores.geoScore + 5) {
    weaknesses.push(`Lower AI visibility than ${competitorName}`);
  }
  if (compScores.seoScore > brandScores.seoScore + 5) {
    weaknesses.push(`Technical SEO needs improvement`);
  }
  if (compScores.aeoScore > brandScores.aeoScore + 5) {
    weaknesses.push(`Less frequently cited in AI responses`);
  }
  if (compScores.smoScore > brandScores.smoScore + 5) {
    weaknesses.push(`Social media engagement trailing competitor`);
  }
  if (compScores.ppoScore > brandScores.ppoScore + 5) {
    weaknesses.push(`Leadership visibility below competitor`);
  }

  // Opportunities - areas with room to improve
  if (brandScores.geoScore < 70) {
    opportunities.push("Significant room for AI visibility growth");
  }
  if (brandScores.aeoScore < 70) {
    opportunities.push("Potential to improve citation rates with better content");
  }
  if (brandScores.smoScore < 70) {
    opportunities.push("Social media expansion could increase brand signals");
  }
  if (brandScores.ppoScore < 70) {
    opportunities.push("Thought leadership content could boost credibility");
  }

  // Threats - where competitor is strong
  if (compScores.geoScore > 80) {
    threats.push(`${competitorName} has established AI presence`);
  }
  if ((competitorScores?.unifiedScore ?? 0) > brandScores.unifiedScore + 10) {
    threats.push(`Significant overall gap with ${competitorName}`);
  }

  // Add defaults if empty
  if (strengths.length === 0) {
    strengths.push("Competitive positioning across most metrics");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("No major weaknesses identified");
  }
  if (opportunities.length === 0) {
    opportunities.push("Continue current optimization efforts");
  }
  if (threats.length === 0) {
    threats.push("Monitor competitor activities regularly");
  }

  return { strengths, weaknesses, opportunities, threats };
}

/**
 * Generate action plan to beat competitor
 */
function generateActionPlan(
  brandScores: BrandScoreResult,
  competitorScores: CompetitorScoreResult | null,
  competitorName: string
): string[] {
  const actionPlan: string[] = [];
  const compScores = competitorScores || {
    geoScore: 50,
    seoScore: 50,
    aeoScore: 50,
    smoScore: 50,
    ppoScore: 50,
  };

  // Find biggest gaps and prioritize
  const gaps = [
    { category: "GEO", gap: compScores.geoScore - brandScores.geoScore },
    { category: "SEO", gap: compScores.seoScore - brandScores.seoScore },
    { category: "AEO", gap: compScores.aeoScore - brandScores.aeoScore },
    { category: "SMO", gap: compScores.smoScore - brandScores.smoScore },
    { category: "PPO", gap: compScores.ppoScore - brandScores.ppoScore },
  ].sort((a, b) => b.gap - a.gap);

  for (const { category, gap } of gaps) {
    if (gap > 5) {
      switch (category) {
        case "GEO":
          actionPlan.push(`Implement FAQ schema and Q&A content to close ${gap}-point GEO gap`);
          break;
        case "SEO":
          actionPlan.push(`Fix technical SEO issues and add structured data to close ${gap}-point SEO gap`);
          break;
        case "AEO":
          actionPlan.push(`Create authoritative, citable content to close ${gap}-point AEO gap`);
          break;
        case "SMO":
          actionPlan.push(`Increase social posting frequency and engagement to close ${gap}-point SMO gap`);
          break;
        case "PPO":
          actionPlan.push(`Boost leadership visibility through LinkedIn content to close ${gap}-point PPO gap`);
          break;
      }
    }
  }

  // Add general improvement advice
  if (actionPlan.length < 3) {
    actionPlan.push("Maintain consistent content publishing schedule");
    actionPlan.push("Monitor competitor activities and adapt strategy");
    actionPlan.push("Track progress weekly and adjust priorities");
  }

  return actionPlan.slice(0, 5);
}
