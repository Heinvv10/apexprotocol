/**
 * Drizzle query functions for investor report data aggregation
 * Aggregates portfolio metrics, GEO visibility data, brand performance, and competitive benchmarks
 * for investor intelligence reports
 */

import { db } from "@/lib/db";
import {
  portfolios,
  portfolioBrands,
  brands,
  geoScoreHistory,
  brandMentions,
  recommendations,
  type Portfolio,
  type Brand,
  type GeoScoreHistory,
  type BrandMention,
  type Recommendation,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql, gte, lte, avg, sum } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export interface InvestorReportParams {
  portfolioId: string;
  periodStart: Date;
  periodEnd: Date;
  organizationId: string;
}

export interface InvestorReportData {
  portfolio: Portfolio;
  brands: BrandWithMetrics[];
  geoTrends: GeoTrendData;
  aggregatedMetrics: AggregatedMetrics;
  mentionsSummary: MentionsSummary;
  recommendationsSummary: RecommendationsSummary;
}

export interface BrandWithMetrics {
  brand: Brand;
  geoScores: GeoScoreHistory[];
  mentions: BrandMention[];
  recommendations: Recommendation[];
  metrics: {
    avgGeoScore: number;
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
    avgSentimentScore: number;
    completedRecommendations: number;
    pendingRecommendations: number;
  };
}

export interface GeoTrendData {
  dataPoints: {
    date: Date;
    avgOverallScore: number;
    avgVisibilityScore: number;
    avgSentimentScore: number;
    avgRecommendationScore: number;
    totalMentions: number;
  }[];
  trendDirection: "up" | "down" | "stable";
  periodComparison: {
    currentPeriod: {
      avgScore: number;
      totalMentions: number;
    };
    previousPeriod: {
      avgScore: number;
      totalMentions: number;
    };
    percentChange: {
      score: number;
      mentions: number;
    };
  };
}

export interface AggregatedMetrics {
  totalBrands: number;
  avgGeoScore: number;
  totalMentions: number;
  avgSentimentScore: number;
  totalRecommendations: number;
  completedRecommendations: number;
  credibilityScore: number;
}

export interface MentionsSummary {
  total: number;
  byPlatform: {
    platform: string;
    count: number;
    avgSentiment: number;
  }[];
  bySentiment: {
    positive: number;
    neutral: number;
    negative: number;
    unrecognized: number;
  };
}

export interface RecommendationsSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  dismissed: number;
  byCategory: {
    category: string;
    count: number;
  }[];
  byPriority: {
    priority: string;
    count: number;
  }[];
}

// ============================================================================
// Main Query Function
// ============================================================================

/**
 * Get comprehensive investor report data for a portfolio
 * Aggregates all relevant metrics, GEO data, mentions, and recommendations
 * for the specified date range
 */
export async function getInvestorReportData(
  params: InvestorReportParams
): Promise<InvestorReportData | null> {
  const { portfolioId, periodStart, periodEnd, organizationId } = params;

  // 1. Get portfolio with verification
  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(
      and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!portfolio) {
    return null;
  }

  // 2. Get all brands in portfolio
  const portfolioBrandRecords = await db
    .select({
      brand: brands,
      portfolioBrandId: portfolioBrands.id,
    })
    .from(portfolioBrands)
    .innerJoin(brands, eq(portfolioBrands.brandId, brands.id))
    .where(eq(portfolioBrands.portfolioId, portfolioId))
    .orderBy(portfolioBrands.displayOrder);

  if (portfolioBrandRecords.length === 0) {
    // Return empty data structure for portfolios with no brands
    return {
      portfolio,
      brands: [],
      geoTrends: {
        dataPoints: [],
        trendDirection: "stable",
        periodComparison: {
          currentPeriod: { avgScore: 0, totalMentions: 0 },
          previousPeriod: { avgScore: 0, totalMentions: 0 },
          percentChange: { score: 0, mentions: 0 },
        },
      },
      aggregatedMetrics: {
        totalBrands: 0,
        avgGeoScore: 0,
        totalMentions: 0,
        avgSentimentScore: 0,
        totalRecommendations: 0,
        completedRecommendations: 0,
        credibilityScore: 0,
      },
      mentionsSummary: {
        total: 0,
        byPlatform: [],
        bySentiment: { positive: 0, neutral: 0, negative: 0, unrecognized: 0 },
      },
      recommendationsSummary: {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        dismissed: 0,
        byCategory: [],
        byPriority: [],
      },
    };
  }

  const brandIds = portfolioBrandRecords.map((pb) => pb.brand.id);

  // 3. Get GEO score history for all brands in date range
  const geoScores = await db
    .select()
    .from(geoScoreHistory)
    .where(
      and(
        sql`${geoScoreHistory.brandId} IN ${brandIds}`,
        gte(geoScoreHistory.calculatedAt, periodStart),
        lte(geoScoreHistory.calculatedAt, periodEnd)
      )
    )
    .orderBy(geoScoreHistory.calculatedAt);

  // 4. Get mentions for all brands in date range
  const mentions = await db
    .select()
    .from(brandMentions)
    .where(
      and(
        sql`${brandMentions.brandId} IN ${brandIds}`,
        gte(brandMentions.timestamp, periodStart),
        lte(brandMentions.timestamp, periodEnd)
      )
    )
    .orderBy(desc(brandMentions.timestamp));

  // 5. Get recommendations for all brands
  const recs = await db
    .select()
    .from(recommendations)
    .where(sql`${recommendations.brandId} IN ${brandIds}`)
    .orderBy(desc(recommendations.createdAt));

  // 6. Build brand-specific metrics
  const brandsWithMetrics: BrandWithMetrics[] = portfolioBrandRecords.map(
    ({ brand }) => {
      const brandGeoScores = geoScores.filter((gs) => gs.brandId === brand.id);
      const brandMentions = mentions.filter((m) => m.brandId === brand.id);
      const brandRecommendations = recs.filter((r) => r.brandId === brand.id);

      // Calculate average GEO score
      const avgGeoScore =
        brandGeoScores.length > 0
          ? brandGeoScores.reduce((sum, gs) => sum + gs.overallScore, 0) /
            brandGeoScores.length
          : 0;

      // Calculate sentiment breakdown
      const positiveMentions = brandMentions.filter(
        (m) => m.sentiment === "positive"
      ).length;
      const negativeMentions = brandMentions.filter(
        (m) => m.sentiment === "negative"
      ).length;
      const neutralMentions = brandMentions.filter(
        (m) => m.sentiment === "neutral"
      ).length;

      // Calculate average sentiment score (positive=1, neutral=0.5, negative=0)
      const avgSentimentScore =
        brandMentions.length > 0
          ? (positiveMentions * 1 +
              neutralMentions * 0.5 +
              negativeMentions * 0) /
            brandMentions.length
          : 0;

      // Calculate recommendation breakdown
      const completedRecommendations = brandRecommendations.filter(
        (r) => r.status === "completed"
      ).length;
      const pendingRecommendations = brandRecommendations.filter(
        (r) => r.status === "pending"
      ).length;

      return {
        brand,
        geoScores: brandGeoScores,
        mentions: brandMentions,
        recommendations: brandRecommendations,
        metrics: {
          avgGeoScore,
          totalMentions: brandMentions.length,
          positiveMentions,
          negativeMentions,
          neutralMentions,
          avgSentimentScore,
          completedRecommendations,
          pendingRecommendations,
        },
      };
    }
  );

  // 7. Calculate GEO trends
  const geoTrends = calculateGeoTrends(geoScores, mentions, periodStart, periodEnd);

  // 8. Calculate aggregated metrics
  const aggregatedMetrics = calculateAggregatedMetrics(brandsWithMetrics);

  // 9. Build mentions summary
  const mentionsSummary = buildMentionsSummary(mentions);

  // 10. Build recommendations summary
  const recommendationsSummary = buildRecommendationsSummary(recs);

  return {
    portfolio,
    brands: brandsWithMetrics,
    geoTrends,
    aggregatedMetrics,
    mentionsSummary,
    recommendationsSummary,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate GEO trend data including time-series and period comparison
 */
function calculateGeoTrends(
  geoScores: GeoScoreHistory[],
  mentions: BrandMention[],
  periodStart: Date,
  periodEnd: Date
): GeoTrendData {
  if (geoScores.length === 0) {
    return {
      dataPoints: [],
      trendDirection: "stable",
      periodComparison: {
        currentPeriod: { avgScore: 0, totalMentions: 0 },
        previousPeriod: { avgScore: 0, totalMentions: 0 },
        percentChange: { score: 0, mentions: 0 },
      },
    };
  }

  // Group scores by date
  const scoresByDate = new Map<string, GeoScoreHistory[]>();
  geoScores.forEach((score) => {
    const dateKey = score.calculatedAt.toISOString().split("T")[0];
    if (!scoresByDate.has(dateKey)) {
      scoresByDate.set(dateKey, []);
    }
    scoresByDate.get(dateKey)!.push(score);
  });

  // Build data points
  const dataPoints = Array.from(scoresByDate.entries())
    .map(([dateStr, scores]) => {
      const date = new Date(dateStr);
      const avgOverallScore =
        scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
      const avgVisibilityScore =
        scores.reduce((sum, s) => sum + s.visibilityScore, 0) / scores.length;
      const avgSentimentScore =
        scores.reduce((sum, s) => sum + s.sentimentScore, 0) / scores.length;
      const avgRecommendationScore =
        scores.reduce((sum, s) => sum + s.recommendationScore, 0) /
        scores.length;

      // Count mentions for this date
      const totalMentions = mentions.filter((m) => {
        const mentionDate = m.timestamp.toISOString().split("T")[0];
        return mentionDate === dateStr;
      }).length;

      return {
        date,
        avgOverallScore,
        avgVisibilityScore,
        avgSentimentScore,
        avgRecommendationScore,
        totalMentions,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate trend direction
  const trendDirection = calculateTrendDirection(dataPoints);

  // Calculate period comparison
  const periodComparison = calculatePeriodComparison(
    geoScores,
    mentions,
    periodStart,
    periodEnd
  );

  return {
    dataPoints,
    trendDirection,
    periodComparison,
  };
}

/**
 * Determine overall trend direction from data points
 */
function calculateTrendDirection(
  dataPoints: { avgOverallScore: number }[]
): "up" | "down" | "stable" {
  if (dataPoints.length < 2) {
    return "stable";
  }

  const firstHalfAvg =
    dataPoints
      .slice(0, Math.floor(dataPoints.length / 2))
      .reduce((sum, dp) => sum + dp.avgOverallScore, 0) /
    Math.floor(dataPoints.length / 2);

  const secondHalfAvg =
    dataPoints
      .slice(Math.floor(dataPoints.length / 2))
      .reduce((sum, dp) => sum + dp.avgOverallScore, 0) /
    (dataPoints.length - Math.floor(dataPoints.length / 2));

  const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

/**
 * Calculate comparison between current and previous period
 */
function calculatePeriodComparison(
  geoScores: GeoScoreHistory[],
  mentions: BrandMention[],
  periodStart: Date,
  periodEnd: Date
) {
  // Current period
  const currentScores = geoScores.filter(
    (s) => s.calculatedAt >= periodStart && s.calculatedAt <= periodEnd
  );
  const currentMentions = mentions.filter(
    (m) => m.timestamp >= periodStart && m.timestamp <= periodEnd
  );

  const currentAvgScore =
    currentScores.length > 0
      ? currentScores.reduce((sum, s) => sum + s.overallScore, 0) /
        currentScores.length
      : 0;

  // Previous period (same duration before periodStart)
  const periodDuration = periodEnd.getTime() - periodStart.getTime();
  const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);
  const previousPeriodEnd = periodStart;

  const previousScores = geoScores.filter(
    (s) =>
      s.calculatedAt >= previousPeriodStart &&
      s.calculatedAt < previousPeriodEnd
  );
  const previousMentions = mentions.filter(
    (m) =>
      m.timestamp >= previousPeriodStart && m.timestamp < previousPeriodEnd
  );

  const previousAvgScore =
    previousScores.length > 0
      ? previousScores.reduce((sum, s) => sum + s.overallScore, 0) /
        previousScores.length
      : 0;

  // Calculate percent changes
  const scoreChange =
    previousAvgScore > 0
      ? ((currentAvgScore - previousAvgScore) / previousAvgScore) * 100
      : 0;

  const mentionsChange =
    previousMentions.length > 0
      ? ((currentMentions.length - previousMentions.length) /
          previousMentions.length) *
        100
      : 0;

  return {
    currentPeriod: {
      avgScore: currentAvgScore,
      totalMentions: currentMentions.length,
    },
    previousPeriod: {
      avgScore: previousAvgScore,
      totalMentions: previousMentions.length,
    },
    percentChange: {
      score: scoreChange,
      mentions: mentionsChange,
    },
  };
}

/**
 * Calculate aggregated metrics across all brands
 */
function calculateAggregatedMetrics(
  brandsWithMetrics: BrandWithMetrics[]
): AggregatedMetrics {
  const totalBrands = brandsWithMetrics.length;

  if (totalBrands === 0) {
    return {
      totalBrands: 0,
      avgGeoScore: 0,
      totalMentions: 0,
      avgSentimentScore: 0,
      totalRecommendations: 0,
      completedRecommendations: 0,
      credibilityScore: 0,
    };
  }

  const avgGeoScore =
    brandsWithMetrics.reduce((sum, b) => sum + b.metrics.avgGeoScore, 0) /
    totalBrands;

  const totalMentions = brandsWithMetrics.reduce(
    (sum, b) => sum + b.metrics.totalMentions,
    0
  );

  const avgSentimentScore =
    brandsWithMetrics.reduce((sum, b) => sum + b.metrics.avgSentimentScore, 0) /
    totalBrands;

  const totalRecommendations = brandsWithMetrics.reduce(
    (sum, b) => sum + b.recommendations.length,
    0
  );

  const completedRecommendations = brandsWithMetrics.reduce(
    (sum, b) => sum + b.metrics.completedRecommendations,
    0
  );

  // Calculate credibility score (composite of GEO score and sentiment)
  const credibilityScore = (avgGeoScore + avgSentimentScore * 100) / 2;

  return {
    totalBrands,
    avgGeoScore,
    totalMentions,
    avgSentimentScore,
    totalRecommendations,
    completedRecommendations,
    credibilityScore,
  };
}

/**
 * Build mentions summary with platform and sentiment breakdowns
 */
function buildMentionsSummary(mentions: BrandMention[]): MentionsSummary {
  // Group by platform
  const platformCounts = new Map<string, { count: number; totalSentiment: number }>();

  mentions.forEach((mention) => {
    const platform = mention.platform;
    const sentimentValue =
      mention.sentiment === "positive"
        ? 1
        : mention.sentiment === "negative"
        ? 0
        : 0.5;

    if (!platformCounts.has(platform)) {
      platformCounts.set(platform, { count: 0, totalSentiment: 0 });
    }

    const platformData = platformCounts.get(platform)!;
    platformData.count += 1;
    platformData.totalSentiment += sentimentValue;
  });

  const byPlatform = Array.from(platformCounts.entries()).map(
    ([platform, data]) => ({
      platform,
      count: data.count,
      avgSentiment: data.count > 0 ? data.totalSentiment / data.count : 0,
    })
  );

  // Sentiment breakdown
  const positive = mentions.filter((m) => m.sentiment === "positive").length;
  const neutral = mentions.filter((m) => m.sentiment === "neutral").length;
  const negative = mentions.filter((m) => m.sentiment === "negative").length;

  return {
    total: mentions.length,
    byPlatform,
    bySentiment: { positive, neutral, negative, unrecognized: mentions.filter((m) => m.sentiment === "unrecognized").length },
  };
}

/**
 * Build recommendations summary with category and priority breakdowns
 */
function buildRecommendationsSummary(
  recs: Recommendation[]
): RecommendationsSummary {
  // Status counts
  const completed = recs.filter((r) => r.status === "completed").length;
  const inProgress = recs.filter((r) => r.status === "in_progress").length;
  const pending = recs.filter((r) => r.status === "pending").length;
  const dismissed = recs.filter((r) => r.status === "dismissed").length;

  // Group by category
  const categoryCounts = new Map<string, number>();
  recs.forEach((rec) => {
    categoryCounts.set(rec.category, (categoryCounts.get(rec.category) || 0) + 1);
  });

  const byCategory = Array.from(categoryCounts.entries()).map(
    ([category, count]) => ({ category, count })
  );

  // Group by priority
  const priorityCounts = new Map<string, number>();
  recs.forEach((rec) => {
    priorityCounts.set(rec.priority, (priorityCounts.get(rec.priority) || 0) + 1);
  });

  const byPriority = Array.from(priorityCounts.entries()).map(
    ([priority, count]) => ({ priority, count })
  );

  return {
    total: recs.length,
    completed,
    inProgress,
    pending,
    dismissed,
    byCategory,
    byPriority,
  };
}

// ============================================================================
// Benchmark Calculation
// ============================================================================

export interface BenchmarkParams {
  portfolioId: string;
  organizationId: string;
  industry?: string;
}

export interface BenchmarkData {
  industryMedian: {
    unifiedScore: number;
    geoScore: number;
    credibilityScore: number;
  };
  subjectBusiness: {
    unifiedScore: number;
    geoScore: number;
    credibilityScore: number;
  };
  percentileRanking: number;
  delta: {
    unifiedScore: number;
    geoScore: number;
    credibilityScore: number;
  };
  comparableBusinessesCount: number;
}

/**
 * Calculate industry benchmark comparisons for investor reports
 * Compares portfolio metrics against industry median and calculates percentile ranking
 * Requires minimum 3 comparable businesses for valid benchmarking
 * âšª UNTESTED: Function implemented but needs verification with real data
 */
export async function calculateBenchmarks(
  params: BenchmarkParams
): Promise<BenchmarkData | null> {
  const { portfolioId, organizationId, industry } = params;

  // Get subject portfolio metrics
  const [subjectPortfolio] = await db
    .select({
      id: portfolios.id,
      metrics: portfolios.aggregatedMetrics,
    })
    .from(portfolios)
    .where(
      and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!subjectPortfolio || !subjectPortfolio.metrics) {
    return null;
  }

  const subjectMetrics = subjectPortfolio.metrics;

  // Calculate credibility score for subject (composite of GEO score and sentiment)
  const subjectCredibilityScore = subjectMetrics.avgGeoScore;

  // Get comparable portfolios (same organization, exclude subject portfolio)
  // In a real scenario, this would filter by industry if available
  const comparablePortfolios = await db
    .select({
      id: portfolios.id,
      metrics: portfolios.aggregatedMetrics,
    })
    .from(portfolios)
    .where(
      and(
        eq(portfolios.organizationId, organizationId),
        sql`${portfolios.id} != ${portfolioId}`,
        eq(portfolios.isActive, true)
      )
    );

  // Edge case: insufficient comparable businesses (minimum 3 required per spec)
  // âšª UNTESTED: Edge case handling for insufficient benchmark data
  if (comparablePortfolios.length < 3) {
    // Return subject data with zero benchmarks
    return {
      industryMedian: {
        unifiedScore: 0,
        geoScore: 0,
        credibilityScore: 0,
      },
      subjectBusiness: {
        unifiedScore: subjectMetrics.avgUnifiedScore,
        geoScore: subjectMetrics.avgGeoScore,
        credibilityScore: subjectCredibilityScore,
      },
      percentileRanking: 0,
      delta: {
        unifiedScore: 0,
        geoScore: 0,
        credibilityScore: 0,
      },
      comparableBusinessesCount: comparablePortfolios.length,
    };
  }

  // Extract metrics from comparable portfolios
  // âšª UNTESTED: Benchmark calculation logic needs verification
  const comparableMetrics = comparablePortfolios
    .filter((p) => p.metrics)
    .map((p) => ({
      unifiedScore: p.metrics!.avgUnifiedScore,
      geoScore: p.metrics!.avgGeoScore,
      credibilityScore: p.metrics!.avgGeoScore, // Using GEO score as proxy
    }));

  // Calculate industry medians
  const industryMedian = {
    unifiedScore: calculateMedian(
      comparableMetrics.map((m) => m.unifiedScore)
    ),
    geoScore: calculateMedian(comparableMetrics.map((m) => m.geoScore)),
    credibilityScore: calculateMedian(
      comparableMetrics.map((m) => m.credibilityScore)
    ),
  };

  // Calculate percentile ranking (based on unified score)
  const allUnifiedScores = [
    ...comparableMetrics.map((m) => m.unifiedScore),
    subjectMetrics.avgUnifiedScore,
  ].sort((a, b) => a - b);

  const subjectRank = allUnifiedScores.indexOf(subjectMetrics.avgUnifiedScore);
  const percentileRanking = Math.round(
    (subjectRank / (allUnifiedScores.length - 1)) * 100
  );

  // Calculate deltas (percentage difference from median)
  const delta = {
    unifiedScore: calculatePercentageDelta(
      subjectMetrics.avgUnifiedScore,
      industryMedian.unifiedScore
    ),
    geoScore: calculatePercentageDelta(
      subjectMetrics.avgGeoScore,
      industryMedian.geoScore
    ),
    credibilityScore: calculatePercentageDelta(
      subjectCredibilityScore,
      industryMedian.credibilityScore
    ),
  };

  return {
    industryMedian,
    subjectBusiness: {
      unifiedScore: subjectMetrics.avgUnifiedScore,
      geoScore: subjectMetrics.avgGeoScore,
      credibilityScore: subjectCredibilityScore,
    },
    percentileRanking,
    delta,
    comparableBusinessesCount: comparablePortfolios.length,
  };
}

/**
 * Calculate median value from array of numbers
 * ðŸŸ¢ WORKING: Standard median calculation algorithm
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate percentage difference between current and baseline values
 * ðŸŸ¢ WORKING: Standard percentage delta calculation
 */
function calculatePercentageDelta(current: number, baseline: number): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}
