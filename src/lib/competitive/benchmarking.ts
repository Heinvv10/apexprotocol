/**
 * Competitive Benchmarking Service
 * Phase 9.1: Compare brand metrics against competitors
 *
 * Metrics compared:
 * - GEO Score (AI visibility)
 * - SMO Score (Social media presence)
 * - PPO Score (People/Leadership visibility)
 * - Content Volume
 * - Technical Score (Schema, structured data)
 */

import { db } from "@/lib/db";
import {
  brands,
  brandMentions,
  socialScores,
  peopleScores,
  audits,
  competitorSnapshots,
  type Brand,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import { calculateGEOScore, type GEOScoreInput } from "@/lib/scoring";

// Types
export interface BenchmarkMetric {
  name: string;
  brandValue: number;
  competitorAverage: number;
  competitorValues: { name: string; value: number }[];
  delta: number;
  percentile: number;
  status: "leading" | "competitive" | "lagging";
}

export interface BenchmarkResult {
  brandId: string;
  brandName: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    geoScore: BenchmarkMetric;
    smoScore: BenchmarkMetric;
    ppoScore: BenchmarkMetric;
    contentVolume: BenchmarkMetric;
    technicalScore: BenchmarkMetric;
  };
  overallPosition: number; // 1-based rank among competitors
  competitorCount: number;
  radarData: RadarChartData;
  insights: string[];
}

export interface RadarChartData {
  labels: string[];
  brandData: number[];
  averageData: number[];
  competitorData: { name: string; data: number[] }[];
}

export interface CompetitorBenchmarkData {
  name: string;
  domain?: string;
  geoScore: number;
  smoScore: number;
  ppoScore: number;
  contentVolume: number;
  technicalScore: number;
}

// Benchmark calculation options
export interface BenchmarkOptions {
  lookbackDays?: number;
  includeHistorical?: boolean;
  competitorIds?: string[];
}

/**
 * Calculate benchmark metrics for a brand against its competitors
 */
export async function calculateBenchmark(
  brandId: string,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const { lookbackDays = 30, includeHistorical = false } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  // Get brand data
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Get competitors from brand
  const competitors = (brand.competitors || []) as Array<{
    name: string;
    url?: string;
  }>;

  // Calculate brand metrics
  const brandMetrics = await calculateBrandMetrics(brandId, startDate);

  // Calculate competitor metrics (from snapshots or estimates)
  const competitorMetrics = await calculateCompetitorMetrics(
    brandId,
    competitors,
    startDate
  );

  // Build benchmark metrics
  const metrics = buildBenchmarkMetrics(brandMetrics, competitorMetrics);

  // Calculate overall position
  const allScores = [
    brandMetrics.overallScore,
    ...competitorMetrics.map((c) => c.overallScore),
  ].sort((a, b) => b - a);
  const overallPosition = allScores.indexOf(brandMetrics.overallScore) + 1;

  // Build radar chart data
  const radarData = buildRadarChartData(brandMetrics, competitorMetrics);

  // Generate insights
  const insights = generateBenchmarkInsights(metrics, overallPosition, competitorMetrics.length);

  return {
    brandId,
    brandName: brand.name,
    period: {
      start: startDate,
      end: new Date(),
    },
    metrics,
    overallPosition,
    competitorCount: competitorMetrics.length,
    radarData,
    insights,
  };
}

/**
 * Calculate metrics for the brand
 */
async function calculateBrandMetrics(
  brandId: string,
  startDate: Date
): Promise<{
  geoScore: number;
  smoScore: number;
  ppoScore: number;
  contentVolume: number;
  technicalScore: number;
  overallScore: number;
}> {
  // Get brand mentions for GEO score calculation
  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, startDate)
    ),
  });

  // Calculate GEO score
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

  // Get latest SMO score
  const latestSmo = await db.query.socialScores.findFirst({
    where: eq(socialScores.brandId, brandId),
    orderBy: desc(socialScores.createdAt),
  });
  const smoScore = latestSmo?.overallScore || 0;

  // Get latest PPO score
  const latestPpo = await db.query.peopleScores.findFirst({
    where: eq(peopleScores.brandId, brandId),
    orderBy: desc(peopleScores.createdAt),
  });
  const ppoScore = latestPpo?.overallScore || 0;

  // Estimate content volume from audits
  const latestAudit = await db.query.audits.findFirst({
    where: eq(audits.brandId, brandId),
    orderBy: desc(audits.createdAt),
  });
  const auditMetadata = latestAudit?.metadata as any;
  const contentVolume = Math.min(
    100,
    (Number(auditMetadata?.pageInfo?.wordCount) || 500) / 50
  );

  // Technical score from audit
  const technicalScore = latestAudit?.overallScore || 50;

  // Calculate overall score
  const overallScore =
    geoScore * 0.3 +
    smoScore * 0.25 +
    ppoScore * 0.15 +
    contentVolume * 0.15 +
    technicalScore * 0.15;

  return {
    geoScore,
    smoScore,
    ppoScore,
    contentVolume,
    technicalScore,
    overallScore: Math.round(overallScore),
  };
}

/**
 * Calculate metrics for competitors
 * Uses snapshots if available, otherwise estimates
 */
async function calculateCompetitorMetrics(
  brandId: string,
  competitors: Array<{ name: string; url?: string }>,
  startDate: Date
): Promise<
  Array<{
    name: string;
    domain?: string;
    geoScore: number;
    smoScore: number;
    ppoScore: number;
    contentVolume: number;
    technicalScore: number;
    overallScore: number;
  }>
> {
  const results = [];

  for (const competitor of competitors) {
    // Try to get from snapshots first
    const snapshot = await db.query.competitorSnapshots.findFirst({
      where: and(
        eq(competitorSnapshots.brandId, brandId),
        eq(competitorSnapshots.competitorName, competitor.name)
      ),
      orderBy: desc(competitorSnapshots.createdAt),
    });

    if (snapshot) {
      const overallScore =
        (snapshot.geoScore || 0) * 0.3 +
        (snapshot.socialFollowers ? Math.min(100, snapshot.socialFollowers / 1000) : 50) * 0.25 +
        50 * 0.15 + // PPO estimate
        (snapshot.contentPageCount ? Math.min(100, snapshot.contentPageCount * 2) : 50) * 0.15 +
        (snapshot.structuredDataScore || 50) * 0.15;

      results.push({
        name: competitor.name,
        domain: competitor.url,
        geoScore: snapshot.geoScore || 50,
        smoScore: snapshot.socialFollowers ? Math.min(100, snapshot.socialFollowers / 1000) : 50,
        ppoScore: 50, // Default PPO
        contentVolume: snapshot.contentPageCount ? Math.min(100, snapshot.contentPageCount * 2) : 50,
        technicalScore: snapshot.structuredDataScore || 50,
        overallScore: Math.round(overallScore),
      });
    } else {
      // Estimate based on brand mentions of competitor
      const competitorMentionsInBrand = await db.query.brandMentions.findMany({
        where: and(
          eq(brandMentions.brandId, brandId),
          gte(brandMentions.timestamp, startDate)
        ),
      });

      // Count competitor mentions
      let competitorMentionCount = 0;
      for (const mention of competitorMentionsInBrand) {
        const comps = mention.competitors || [];
        if (comps.some((c) => c.name.toLowerCase() === competitor.name.toLowerCase())) {
          competitorMentionCount++;
        }
      }

      // Estimate scores based on mention frequency relative to brand
      const brandMentionCount = competitorMentionsInBrand.length;
      const mentionRatio = brandMentionCount > 0
        ? competitorMentionCount / brandMentionCount
        : 0.5;

      const estimatedGeo = Math.round(50 + mentionRatio * 30);
      const estimatedSmo = 50; // Default
      const estimatedPpo = 50; // Default
      const estimatedContent = 50; // Default
      const estimatedTech = 50; // Default

      const overallScore =
        estimatedGeo * 0.3 +
        estimatedSmo * 0.25 +
        estimatedPpo * 0.15 +
        estimatedContent * 0.15 +
        estimatedTech * 0.15;

      results.push({
        name: competitor.name,
        domain: competitor.url,
        geoScore: estimatedGeo,
        smoScore: estimatedSmo,
        ppoScore: estimatedPpo,
        contentVolume: estimatedContent,
        technicalScore: estimatedTech,
        overallScore: Math.round(overallScore),
      });
    }
  }

  return results;
}

/**
 * Build benchmark metrics from brand and competitor data
 */
function buildBenchmarkMetrics(
  brandMetrics: {
    geoScore: number;
    smoScore: number;
    ppoScore: number;
    contentVolume: number;
    technicalScore: number;
  },
  competitorMetrics: Array<{
    name: string;
    geoScore: number;
    smoScore: number;
    ppoScore: number;
    contentVolume: number;
    technicalScore: number;
  }>
): BenchmarkResult["metrics"] {
  const buildMetric = (
    name: string,
    brandValue: number,
    competitorKey: keyof typeof competitorMetrics[0]
  ): BenchmarkMetric => {
    const competitorValues = competitorMetrics.map((c) => ({
      name: c.name,
      value: c[competitorKey] as number,
    }));

    const values = competitorValues.map((c) => c.value);
    const competitorAverage = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

    const delta = brandValue - competitorAverage;

    // Calculate percentile
    const allValues = [brandValue, ...values].sort((a, b) => a - b);
    const rank = allValues.indexOf(brandValue) + 1;
    const percentile = Math.round((rank / allValues.length) * 100);

    // Determine status
    let status: BenchmarkMetric["status"] = "competitive";
    if (delta > 10) status = "leading";
    else if (delta < -10) status = "lagging";

    return {
      name,
      brandValue,
      competitorAverage: Math.round(competitorAverage),
      competitorValues,
      delta: Math.round(delta),
      percentile,
      status,
    };
  };

  return {
    geoScore: buildMetric("GEO Score", brandMetrics.geoScore, "geoScore"),
    smoScore: buildMetric("SMO Score", brandMetrics.smoScore, "smoScore"),
    ppoScore: buildMetric("PPO Score", brandMetrics.ppoScore, "ppoScore"),
    contentVolume: buildMetric("Content", brandMetrics.contentVolume, "contentVolume"),
    technicalScore: buildMetric("Technical", brandMetrics.technicalScore, "technicalScore"),
  };
}

/**
 * Build radar chart data for visualization
 */
function buildRadarChartData(
  brandMetrics: {
    geoScore: number;
    smoScore: number;
    ppoScore: number;
    contentVolume: number;
    technicalScore: number;
  },
  competitorMetrics: Array<{
    name: string;
    geoScore: number;
    smoScore: number;
    ppoScore: number;
    contentVolume: number;
    technicalScore: number;
  }>
): RadarChartData {
  const labels = ["GEO", "SMO", "PPO", "Content", "Technical"];

  const brandData = [
    brandMetrics.geoScore,
    brandMetrics.smoScore,
    brandMetrics.ppoScore,
    brandMetrics.contentVolume,
    brandMetrics.technicalScore,
  ];

  // Calculate average
  const avgGeo = competitorMetrics.length > 0
    ? competitorMetrics.reduce((sum, c) => sum + c.geoScore, 0) / competitorMetrics.length
    : 50;
  const avgSmo = competitorMetrics.length > 0
    ? competitorMetrics.reduce((sum, c) => sum + c.smoScore, 0) / competitorMetrics.length
    : 50;
  const avgPpo = competitorMetrics.length > 0
    ? competitorMetrics.reduce((sum, c) => sum + c.ppoScore, 0) / competitorMetrics.length
    : 50;
  const avgContent = competitorMetrics.length > 0
    ? competitorMetrics.reduce((sum, c) => sum + c.contentVolume, 0) / competitorMetrics.length
    : 50;
  const avgTech = competitorMetrics.length > 0
    ? competitorMetrics.reduce((sum, c) => sum + c.technicalScore, 0) / competitorMetrics.length
    : 50;

  const averageData = [avgGeo, avgSmo, avgPpo, avgContent, avgTech].map(Math.round);

  const competitorData = competitorMetrics.map((c) => ({
    name: c.name,
    data: [c.geoScore, c.smoScore, c.ppoScore, c.contentVolume, c.technicalScore],
  }));

  return {
    labels,
    brandData,
    averageData,
    competitorData,
  };
}

/**
 * Generate insights from benchmark data
 */
function generateBenchmarkInsights(
  metrics: BenchmarkResult["metrics"],
  position: number,
  competitorCount: number
): string[] {
  const insights: string[] = [];

  // Position insight
  if (position === 1) {
    insights.push(`You're leading the pack! Ranked #1 among ${competitorCount + 1} brands.`);
  } else if (position <= Math.ceil((competitorCount + 1) / 3)) {
    insights.push(`Strong position at #${position} out of ${competitorCount + 1} brands.`);
  } else {
    insights.push(`Currently ranked #${position} of ${competitorCount + 1}. There's room to improve.`);
  }

  // Leading areas
  const leadingMetrics = Object.entries(metrics)
    .filter(([_, m]) => m.status === "leading")
    .map(([key, m]) => m.name);
  if (leadingMetrics.length > 0) {
    insights.push(`Leading in: ${leadingMetrics.join(", ")}`);
  }

  // Lagging areas
  const laggingMetrics = Object.entries(metrics)
    .filter(([_, m]) => m.status === "lagging")
    .map(([key, m]) => m.name);
  if (laggingMetrics.length > 0) {
    insights.push(`Focus areas: ${laggingMetrics.join(", ")}`);
  }

  // Specific insights
  if (metrics.geoScore.delta < -15) {
    insights.push("AI visibility significantly trails competitors. Prioritize GEO optimization.");
  }
  if (metrics.smoScore.delta < -15) {
    insights.push("Social presence needs attention. Competitors have stronger social signals.");
  }
  if (metrics.technicalScore.delta < -15) {
    insights.push("Technical SEO gaps detected. Review structured data implementation.");
  }

  return insights.slice(0, 5);
}

/**
 * Get quick benchmark summary (lighter weight)
 */
export async function getQuickBenchmarkSummary(
  brandId: string
): Promise<{
  position: number;
  competitorCount: number;
  geoScore: number;
  avgCompetitorGeo: number;
  delta: number;
  status: "leading" | "competitive" | "lagging";
}> {
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Get recent mentions for GEO
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

  const competitors = (brand.competitors || []) as Array<{ name: string }>;
  const competitorCount = competitors.length;

  // Estimate competitor average (simplified)
  const avgCompetitorGeo = competitorCount > 0 ? 55 : 0; // Default estimate

  const delta = geoScore - avgCompetitorGeo;
  let status: "leading" | "competitive" | "lagging" = "competitive";
  if (delta > 10) status = "leading";
  else if (delta < -10) status = "lagging";

  // Simple position estimate
  const position = delta >= 0 ? 1 : Math.ceil(competitorCount / 2) + 1;

  return {
    position,
    competitorCount,
    geoScore,
    avgCompetitorGeo,
    delta: Math.round(delta),
    status,
  };
}
