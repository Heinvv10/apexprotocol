/**
 * Competitor Scoring Service
 * Calculate 5-score breakdown (GEO, SEO, AEO, SMO, PPO) for competitors
 * Part of Enhanced Competitive Intelligence feature
 */

import { db } from "@/lib/db";
import {
  brands,
  brandMentions,
  competitorSnapshots,
  competitorScores,
  socialScores,
  peopleScores,
  audits,
  type ScoreBreakdown,
  type CompetitorScoreRecord,
  type NewCompetitorScoreRecord,
} from "@/lib/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { calculateGEOScore, type GEOScoreInput } from "@/lib/scoring";

// Score category definitions
export interface CompetitorScoreResult {
  competitorName: string;
  competitorDomain?: string;
  geoScore: number;
  seoScore: number;
  aeoScore: number;
  smoScore: number;
  ppoScore: number;
  unifiedScore: number;
  grade: string;
  confidence: number;
  dataSource: "scraped" | "estimated" | "manual";
  breakdown: {
    geo: ScoreBreakdown;
    seo: ScoreBreakdown;
    aeo: ScoreBreakdown;
    smo: ScoreBreakdown;
    ppo: ScoreBreakdown;
  };
}

export interface BrandScoreResult extends CompetitorScoreResult {
  brandId: string;
  isBrand: true;
}

export interface GapAnalysis {
  brandScore: BrandScoreResult;
  competitorScores: CompetitorScoreResult[];
  gaps: {
    competitorName: string;
    geoGap: number;
    seoGap: number;
    aeoGap: number;
    smoGap: number;
    ppoGap: number;
    unifiedGap: number;
    leadingAreas: string[];
    laggingAreas: string[];
  }[];
  averageCompetitorScore: number;
  brandRank: number;
  recommendations: string[];
}

// Score weights for unified score calculation
const SCORE_WEIGHTS = {
  geo: 0.25,
  seo: 0.25,
  aeo: 0.20,
  smo: 0.15,
  ppo: 0.15,
};

/**
 * Calculate grade from unified score
 */
function calculateGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Calculate unified score from 5 individual scores
 */
function calculateUnifiedScore(scores: {
  geo: number;
  seo: number;
  aeo: number;
  smo: number;
  ppo: number;
}): number {
  return Math.round(
    scores.geo * SCORE_WEIGHTS.geo +
    scores.seo * SCORE_WEIGHTS.seo +
    scores.aeo * SCORE_WEIGHTS.aeo +
    scores.smo * SCORE_WEIGHTS.smo +
    scores.ppo * SCORE_WEIGHTS.ppo
  );
}

/**
 * Calculate brand's 5-score breakdown
 */
export async function calculateBrandScores(brandId: string): Promise<BrandScoreResult> {
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Calculate GEO Score from brand mentions
  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, thirtyDaysAgo)
    ),
  });

  const geoInput: GEOScoreInput = {
    totalMentions: mentions.length,
    positiveMentions: mentions.filter((m) => m.sentiment === "positive").length,
    neutralMentions: mentions.filter((m) => m.sentiment === "neutral").length,
    negativeMentions: mentions.filter((m) => m.sentiment === "negative").length,
    citationCount: mentions.filter((m) => m.citationUrl).length,
    platformCount: new Set(mentions.map((m) => m.platform)).size,
    uniquePlatforms: [...new Set(mentions.map((m) => m.platform))],
  };
  const geoResult = calculateGEOScore(geoInput);
  const geoScore = geoResult.score;

  // Get SEO score from latest audit
  const latestAudit = await db.query.audits.findFirst({
    where: eq(audits.brandId, brandId),
    orderBy: desc(audits.createdAt),
  });
  const seoScore = latestAudit?.overallScore || 50;

  // Calculate AEO score (Answer Engine Optimization) - based on citation rate and positions
  const citationRate = mentions.length > 0
    ? (mentions.filter((m) => m.citationUrl).length / mentions.length) * 100
    : 0;
  const avgPosition = mentions.filter(m => m.position).length > 0
    ? mentions.filter(m => m.position).reduce((sum, m) => sum + (m.position || 0), 0) /
      mentions.filter(m => m.position).length
    : 5;
  const aeoScore = Math.min(100, Math.round(
    citationRate * 0.4 +
    Math.max(0, (10 - avgPosition) * 10) * 0.3 +
    Math.min(100, mentions.length * 2) * 0.3
  ));

  // Get SMO score from social scores
  const latestSmo = await db.query.socialScores.findFirst({
    where: eq(socialScores.brandId, brandId),
    orderBy: desc(socialScores.createdAt),
  });
  const smoScore = latestSmo?.overallScore || 50;

  // Get PPO score from people scores
  const latestPpo = await db.query.peopleScores.findFirst({
    where: eq(peopleScores.brandId, brandId),
    orderBy: desc(peopleScores.createdAt),
  });
  const ppoScore = latestPpo?.overallScore || 50;

  const unifiedScore = calculateUnifiedScore({
    geo: geoScore,
    seo: seoScore,
    aeo: aeoScore,
    smo: smoScore,
    ppo: ppoScore,
  });

  return {
    brandId,
    isBrand: true,
    competitorName: brand.name,
    competitorDomain: brand.domain || undefined,
    geoScore,
    seoScore,
    aeoScore,
    smoScore,
    ppoScore,
    unifiedScore,
    grade: calculateGrade(unifiedScore),
    confidence: 90, // High confidence for brand data
    dataSource: "scraped",
    breakdown: {
      geo: buildGeoBreakdown(geoResult, mentions.length),
      seo: buildSeoBreakdown(seoScore, latestAudit),
      aeo: buildAeoBreakdown(aeoScore, citationRate, avgPosition),
      smo: buildSmoBreakdown(smoScore, latestSmo),
      ppo: buildPpoBreakdown(ppoScore, latestPpo),
    },
  };
}

/**
 * Calculate competitor scores for a brand
 */
export async function calculateCompetitorScores(
  brandId: string
): Promise<CompetitorScoreResult[]> {
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const competitors = (brand.competitors || []) as Array<{
    name: string;
    url?: string;
  }>;

  const results: CompetitorScoreResult[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const competitor of competitors) {
    // Try to get snapshot data first
    const snapshot = await db.query.competitorSnapshots.findFirst({
      where: and(
        eq(competitorSnapshots.brandId, brandId),
        eq(competitorSnapshots.competitorName, competitor.name)
      ),
      orderBy: desc(competitorSnapshots.createdAt),
    });

    if (snapshot) {
      // Use snapshot data (higher confidence)
      const geoScore = snapshot.geoScore || 50;
      const seoScore = snapshot.structuredDataScore || 50;
      const smoScore = snapshot.socialFollowers
        ? Math.min(100, Math.round(snapshot.socialFollowers / 100))
        : 50;
      const ppoScore = 50; // Default for competitors
      const aeoScore = Math.min(100, Math.round(
        (snapshot.aiMentionCount || 0) * 5 +
        Math.max(0, (10 - (snapshot.avgMentionPosition || 5)) * 10)
      ));

      const unifiedScore = calculateUnifiedScore({
        geo: geoScore,
        seo: seoScore,
        aeo: aeoScore,
        smo: smoScore,
        ppo: ppoScore,
      });

      results.push({
        competitorName: competitor.name,
        competitorDomain: competitor.url,
        geoScore,
        seoScore,
        aeoScore,
        smoScore,
        ppoScore,
        unifiedScore,
        grade: calculateGrade(unifiedScore),
        confidence: 70,
        dataSource: "scraped",
        breakdown: {
          geo: buildEstimatedBreakdown("GEO", geoScore),
          seo: buildEstimatedBreakdown("SEO", seoScore),
          aeo: buildEstimatedBreakdown("AEO", aeoScore),
          smo: buildEstimatedBreakdown("SMO", smoScore),
          ppo: buildEstimatedBreakdown("PPO", ppoScore),
        },
      });
    } else {
      // Estimate from brand mentions that reference competitors
      const mentions = await db.query.brandMentions.findMany({
        where: and(
          eq(brandMentions.brandId, brandId),
          gte(brandMentions.timestamp, thirtyDaysAgo)
        ),
      });

      // Count mentions where competitor appears
      let competitorMentionCount = 0;
      for (const mention of mentions) {
        const comps = mention.competitors || [];
        if (comps.some((c) => c.name.toLowerCase() === competitor.name.toLowerCase())) {
          competitorMentionCount++;
        }
      }

      // Estimate scores based on competitive presence
      const mentionRatio = mentions.length > 0
        ? competitorMentionCount / mentions.length
        : 0.5;

      const geoScore = Math.round(45 + mentionRatio * 35);
      const seoScore = 50; // Default estimate
      const aeoScore = Math.round(40 + mentionRatio * 40);
      const smoScore = 50; // Default estimate
      const ppoScore = 50; // Default estimate

      const unifiedScore = calculateUnifiedScore({
        geo: geoScore,
        seo: seoScore,
        aeo: aeoScore,
        smo: smoScore,
        ppo: ppoScore,
      });

      results.push({
        competitorName: competitor.name,
        competitorDomain: competitor.url,
        geoScore,
        seoScore,
        aeoScore,
        smoScore,
        ppoScore,
        unifiedScore,
        grade: calculateGrade(unifiedScore),
        confidence: 40, // Lower confidence for estimates
        dataSource: "estimated",
        breakdown: {
          geo: buildEstimatedBreakdown("GEO", geoScore),
          seo: buildEstimatedBreakdown("SEO", seoScore),
          aeo: buildEstimatedBreakdown("AEO", aeoScore),
          smo: buildEstimatedBreakdown("SMO", smoScore),
          ppo: buildEstimatedBreakdown("PPO", ppoScore),
        },
      });
    }
  }

  return results;
}

/**
 * Save competitor scores to database
 */
export async function saveCompetitorScores(
  brandId: string,
  scores: CompetitorScoreResult[]
): Promise<void> {
  for (const score of scores) {
    const existing = await db
      .select()
      .from(competitorScores)
      .where(
        and(
          eq(competitorScores.brandId, brandId),
          eq(competitorScores.competitorName, score.competitorName)
        )
      )
      .limit(1);

    const data: NewCompetitorScoreRecord = {
      brandId,
      competitorName: score.competitorName,
      competitorDomain: score.competitorDomain,
      geoScore: score.geoScore,
      seoScore: score.seoScore,
      aeoScore: score.aeoScore,
      smoScore: score.smoScore,
      ppoScore: score.ppoScore,
      unifiedScore: score.unifiedScore,
      grade: score.grade,
      confidence: score.confidence,
      dataSource: score.dataSource,
      geoBreakdown: score.breakdown.geo,
      seoBreakdown: score.breakdown.seo,
      aeoBreakdown: score.breakdown.aeo,
      smoBreakdown: score.breakdown.smo,
      ppoBreakdown: score.breakdown.ppo,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(competitorScores)
        .set(data)
        .where(eq(competitorScores.id, existing[0].id));
    } else {
      await db.insert(competitorScores).values({
        id: createId(),
        ...data,
        createdAt: new Date(),
      });
    }
  }
}

/**
 * Get all competitor scores from database
 */
export async function getCompetitorScores(
  brandId: string
): Promise<CompetitorScoreRecord[]> {
  return db.query.competitorScores.findMany({
    where: eq(competitorScores.brandId, brandId),
    orderBy: desc(competitorScores.unifiedScore),
  });
}

/**
 * Refresh all competitor scores for a brand
 */
export async function refreshAllCompetitorScores(
  brandId: string
): Promise<CompetitorScoreResult[]> {
  const scores = await calculateCompetitorScores(brandId);
  await saveCompetitorScores(brandId, scores);
  return scores;
}

/**
 * Calculate gap analysis between brand and competitors
 */
export async function calculateGapAnalysis(brandId: string): Promise<GapAnalysis> {
  const brandScore = await calculateBrandScores(brandId);
  const competitorScores = await calculateCompetitorScores(brandId);

  const gaps = competitorScores.map((comp) => {
    const geoGap = brandScore.geoScore - comp.geoScore;
    const seoGap = brandScore.seoScore - comp.seoScore;
    const aeoGap = brandScore.aeoScore - comp.aeoScore;
    const smoGap = brandScore.smoScore - comp.smoScore;
    const ppoGap = brandScore.ppoScore - comp.ppoScore;
    const unifiedGap = brandScore.unifiedScore - comp.unifiedScore;

    const leadingAreas: string[] = [];
    const laggingAreas: string[] = [];

    if (geoGap > 5) leadingAreas.push("GEO");
    else if (geoGap < -5) laggingAreas.push("GEO");

    if (seoGap > 5) leadingAreas.push("SEO");
    else if (seoGap < -5) laggingAreas.push("SEO");

    if (aeoGap > 5) leadingAreas.push("AEO");
    else if (aeoGap < -5) laggingAreas.push("AEO");

    if (smoGap > 5) leadingAreas.push("SMO");
    else if (smoGap < -5) laggingAreas.push("SMO");

    if (ppoGap > 5) leadingAreas.push("PPO");
    else if (ppoGap < -5) laggingAreas.push("PPO");

    return {
      competitorName: comp.competitorName,
      geoGap,
      seoGap,
      aeoGap,
      smoGap,
      ppoGap,
      unifiedGap,
      leadingAreas,
      laggingAreas,
    };
  });

  // Calculate average competitor score
  const averageCompetitorScore = competitorScores.length > 0
    ? Math.round(
        competitorScores.reduce((sum, c) => sum + c.unifiedScore, 0) /
        competitorScores.length
      )
    : 0;

  // Calculate brand rank
  const allScores = [
    brandScore.unifiedScore,
    ...competitorScores.map((c) => c.unifiedScore),
  ].sort((a, b) => b - a);
  const brandRank = allScores.indexOf(brandScore.unifiedScore) + 1;

  // Generate recommendations based on gaps
  const recommendations = generateGapRecommendations(brandScore, competitorScores, gaps);

  return {
    brandScore,
    competitorScores,
    gaps,
    averageCompetitorScore,
    brandRank,
    recommendations,
  };
}

// Helper functions for building score breakdowns

function buildGeoBreakdown(geoResult: ReturnType<typeof calculateGEOScore>, mentionCount: number): ScoreBreakdown {
  return {
    total: geoResult.score,
    factors: [
      { name: "AI Visibility", score: Math.round(geoResult.score * 0.4), weight: 0.4, description: "Presence across AI platforms" },
      { name: "Citation Quality", score: Math.round(geoResult.score * 0.3), weight: 0.3, description: "Quality of citations received" },
      { name: "Platform Coverage", score: Math.round(geoResult.score * 0.3), weight: 0.3, description: "Coverage across different AI platforms" },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function buildSeoBreakdown(score: number, audit: any): ScoreBreakdown {
  return {
    total: score,
    factors: [
      { name: "Technical SEO", score: Math.round(score * 0.35), weight: 0.35, description: "Site structure and performance" },
      { name: "On-Page SEO", score: Math.round(score * 0.35), weight: 0.35, description: "Content optimization and meta tags" },
      { name: "Schema Markup", score: Math.round(score * 0.30), weight: 0.30, description: "Structured data implementation" },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function buildAeoBreakdown(score: number, citationRate: number, avgPosition: number): ScoreBreakdown {
  return {
    total: score,
    factors: [
      { name: "Citation Rate", score: Math.round(citationRate), weight: 0.4, description: "Percentage of mentions with citations" },
      { name: "Position Quality", score: Math.round(Math.max(0, (10 - avgPosition) * 10)), weight: 0.3, description: "Average position in AI responses" },
      { name: "Response Inclusion", score: Math.round(score * 0.3), weight: 0.3, description: "Frequency of inclusion in AI answers" },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function buildSmoBreakdown(score: number, socialData: any): ScoreBreakdown {
  return {
    total: score,
    factors: [
      { name: "Engagement Rate", score: Math.round(score * 0.35), weight: 0.35, description: "Social media engagement metrics" },
      { name: "Follower Growth", score: Math.round(score * 0.30), weight: 0.30, description: "Audience growth rate" },
      { name: "Content Performance", score: Math.round(score * 0.35), weight: 0.35, description: "Social content effectiveness" },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function buildPpoBreakdown(score: number, peopleData: any): ScoreBreakdown {
  return {
    total: score,
    factors: [
      { name: "Leadership Visibility", score: Math.round(score * 0.40), weight: 0.40, description: "Executive/leadership AI presence" },
      { name: "Thought Leadership", score: Math.round(score * 0.35), weight: 0.35, description: "Content and speaking contributions" },
      { name: "Personal Branding", score: Math.round(score * 0.25), weight: 0.25, description: "Individual brand strength" },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function buildEstimatedBreakdown(category: string, score: number): ScoreBreakdown {
  return {
    total: score,
    factors: [
      { name: `${category} Factor 1`, score: Math.round(score * 0.35), weight: 0.35, description: "Estimated factor" },
      { name: `${category} Factor 2`, score: Math.round(score * 0.35), weight: 0.35, description: "Estimated factor" },
      { name: `${category} Factor 3`, score: Math.round(score * 0.30), weight: 0.30, description: "Estimated factor" },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function generateGapRecommendations(
  brandScore: BrandScoreResult,
  competitorScores: CompetitorScoreResult[],
  gaps: GapAnalysis["gaps"]
): string[] {
  const recommendations: string[] = [];

  // Find areas where brand is lagging most competitors
  const laggingCounts = { geo: 0, seo: 0, aeo: 0, smo: 0, ppo: 0 };

  for (const gap of gaps) {
    if (gap.geoGap < -5) laggingCounts.geo++;
    if (gap.seoGap < -5) laggingCounts.seo++;
    if (gap.aeoGap < -5) laggingCounts.aeo++;
    if (gap.smoGap < -5) laggingCounts.smo++;
    if (gap.ppoGap < -5) laggingCounts.ppo++;
  }

  // Generate recommendations based on lagging areas
  const competitorCount = competitorScores.length;

  if (laggingCounts.geo > competitorCount / 2) {
    recommendations.push(
      "Improve AI visibility by adding comprehensive FAQ schema and Q&A content"
    );
  }

  if (laggingCounts.seo > competitorCount / 2) {
    recommendations.push(
      "Focus on technical SEO improvements including schema markup and site speed"
    );
  }

  if (laggingCounts.aeo > competitorCount / 2) {
    recommendations.push(
      "Increase citation rates by creating authoritative content and building backlinks"
    );
  }

  if (laggingCounts.smo > competitorCount / 2) {
    recommendations.push(
      "Strengthen social media presence with consistent posting and engagement"
    );
  }

  if (laggingCounts.ppo > competitorCount / 2) {
    recommendations.push(
      "Boost leadership visibility through thought leadership content and speaking opportunities"
    );
  }

  // Add general recommendations if no specific gaps
  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain competitive advantage by continuing current optimization efforts"
    );
  }

  return recommendations.slice(0, 5);
}
