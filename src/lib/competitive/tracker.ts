/**
 * Competitive Intelligence Tracker
 * Phase 5: Competitor tracking, share of voice, gap analysis
 *
 * Monitors competitor visibility across AI platforms and identifies opportunities.
 */

import { db } from "@/lib/db";
import {
  brandMentions,
  brands,
  competitorMentions,
  shareOfVoice,
  competitiveGaps,
  competitiveAlerts,
  type CompetitorSOV,
  type BrandMention,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

// Types
export interface CompetitorAnalysis {
  competitor: {
    name: string;
    domain?: string;
  };
  metrics: {
    totalMentions: number;
    avgPosition: number;
    sovPercentage: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  platforms: PlatformBreakdown[];
  trend: "rising" | "stable" | "declining";
  topQueries: string[];
}

export interface PlatformBreakdown {
  platform: string;
  mentions: number;
  avgPosition: number;
  sentiment: "positive" | "neutral" | "negative";
}

export interface ShareOfVoiceResult {
  brandId: string;
  brandName: string;
  period: {
    start: Date;
    end: Date;
  };
  overallSOV: number;
  platformSOV: Record<string, number>;
  competitorSOV: CompetitorSOV[];
  trend: {
    change: number;
    direction: "up" | "down" | "stable";
  };
}

export interface GapAnalysisResult {
  gaps: CompetitiveGapItem[];
  totalGaps: number;
  highPriorityGaps: number;
  opportunities: {
    keywords: string[];
    topics: string[];
    schemas: string[];
  };
}

export interface CompetitiveGapItem {
  type: "keyword" | "topic" | "schema" | "content";
  description: string;
  competitor: string;
  competitorPosition?: number;
  opportunity: number; // 1-100
  searchVolume?: number;
  difficulty?: number;
}

export interface CompetitiveIntelligence {
  brandId: string;
  shareOfVoice: ShareOfVoiceResult;
  competitors: CompetitorAnalysis[];
  gaps: GapAnalysisResult;
  alerts: CompetitiveAlertItem[];
  insights: string[];
}

export interface CompetitiveAlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  competitor?: string;
  platform?: string;
  triggeredAt: Date;
}

/**
 * Main class for competitive intelligence tracking
 */
export class CompetitiveTracker {
  private brandId: string;
  private orgId: string;

  constructor(brandId: string, orgId: string) {
    this.brandId = brandId;
    this.orgId = orgId;
  }

  /**
   * Get comprehensive competitive intelligence for a brand
   */
  async getCompetitiveIntelligence(
    days: number = 30
  ): Promise<CompetitiveIntelligence> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get brand info with competitors
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, this.brandId),
    });

    if (!brand) {
      throw new Error("Brand not found");
    }

    const competitors = (brand.competitors || []) as Array<{
      name: string;
      url: string;
    }>;

    // Run parallel queries for efficiency
    const [sovResult, competitorAnalyses, gapsResult, alertsResult] =
      await Promise.all([
        this.calculateShareOfVoice(startDate, new Date()),
        this.analyzeCompetitors(competitors, startDate),
        this.findCompetitiveGaps(competitors),
        this.getActiveAlerts(),
      ]);

    // Generate insights from the data
    const insights = this.generateInsights(
      sovResult,
      competitorAnalyses,
      gapsResult
    );

    return {
      brandId: this.brandId,
      shareOfVoice: sovResult,
      competitors: competitorAnalyses,
      gaps: gapsResult,
      alerts: alertsResult,
      insights,
    };
  }

  /**
   * Calculate Share of Voice for the brand vs competitors
   */
  async calculateShareOfVoice(
    startDate: Date,
    endDate: Date
  ): Promise<ShareOfVoiceResult> {
    // Get brand info
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, this.brandId),
    });

    if (!brand) {
      throw new Error("Brand not found");
    }

    // Get all brand mentions in the period
    const mentions = await db.query.brandMentions.findMany({
      where: and(
        eq(brandMentions.brandId, this.brandId),
        gte(brandMentions.timestamp, startDate),
        lte(brandMentions.timestamp, endDate)
      ),
    });

    // Calculate brand's own mentions
    const brandMentionCount = mentions.length;

    // Extract competitor mentions from the brand mentions data
    const competitorData = new Map<
      string,
      { mentions: number; positions: number[]; sentiments: string[] }
    >();

    for (const mention of mentions) {
      const competitorMentionsList = mention.competitors || [];
      for (const comp of competitorMentionsList) {
        const existing = competitorData.get(comp.name) || {
          mentions: 0,
          positions: [],
          sentiments: [],
        };
        existing.mentions++;
        if (comp.position) {
          existing.positions.push(comp.position);
        }
        existing.sentiments.push(comp.sentiment);
        competitorData.set(comp.name, existing);
      }
    }

    // Calculate total mentions (brand + all competitors)
    let totalMentions = brandMentionCount;
    for (const [, data] of competitorData) {
      totalMentions += data.mentions;
    }

    // Calculate SOV percentage
    const overallSOV =
      totalMentions > 0 ? (brandMentionCount / totalMentions) * 100 : 0;

    // Calculate platform-level SOV
    const platformMentions = new Map<string, { brand: number; total: number }>();
    for (const mention of mentions) {
      const platform = mention.platform;
      const existing = platformMentions.get(platform) || { brand: 0, total: 0 };
      existing.brand++;
      existing.total++;
      platformMentions.set(platform, existing);
    }

    const platformSOV: Record<string, number> = {};
    for (const [platform, data] of platformMentions) {
      platformSOV[platform] = data.total > 0 ? (data.brand / data.total) * 100 : 0;
    }

    // Calculate competitor SOV
    const competitorSOV: CompetitorSOV[] = [];
    for (const [name, data] of competitorData) {
      const avgPosition =
        data.positions.length > 0
          ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
          : 0;

      const sentimentCounts = {
        positive: data.sentiments.filter((s) => s === "positive").length,
        neutral: data.sentiments.filter((s) => s === "neutral").length,
        negative: data.sentiments.filter((s) => s === "negative").length,
      };

      competitorSOV.push({
        name,
        mentions: data.mentions,
        sovPercentage: totalMentions > 0 ? (data.mentions / totalMentions) * 100 : 0,
        avgPosition,
        sentiment: sentimentCounts,
      });
    }

    // Sort by SOV descending
    competitorSOV.sort((a, b) => b.sovPercentage - a.sovPercentage);

    // Calculate trend (compare to previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const previousMentions = await db.query.brandMentions.findMany({
      where: and(
        eq(brandMentions.brandId, this.brandId),
        gte(brandMentions.timestamp, previousPeriodStart),
        lte(brandMentions.timestamp, startDate)
      ),
    });

    const previousCount = previousMentions.length;
    const change = previousCount > 0
      ? ((brandMentionCount - previousCount) / previousCount) * 100
      : 0;

    return {
      brandId: this.brandId,
      brandName: brand.name,
      period: {
        start: startDate,
        end: endDate,
      },
      overallSOV: Math.round(overallSOV * 100) / 100,
      platformSOV,
      competitorSOV,
      trend: {
        change: Math.round(change * 100) / 100,
        direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
      },
    };
  }

  /**
   * Analyze individual competitors
   */
  async analyzeCompetitors(
    competitors: Array<{ name: string; url: string }>,
    startDate: Date
  ): Promise<CompetitorAnalysis[]> {
    const analyses: CompetitorAnalysis[] = [];

    // Get all brand mentions to extract competitor data
    const mentions = await db.query.brandMentions.findMany({
      where: and(
        eq(brandMentions.brandId, this.brandId),
        gte(brandMentions.timestamp, startDate)
      ),
    });

    for (const competitor of competitors) {
      // Aggregate competitor data from mentions
      const competitorMentionsList: Array<{
        platform: string;
        position: number;
        sentiment: string;
        query: string;
      }> = [];

      for (const mention of mentions) {
        const compMentions = mention.competitors || [];
        const compMention = compMentions.find(
          (c) => c.name.toLowerCase() === competitor.name.toLowerCase()
        );
        if (compMention) {
          competitorMentionsList.push({
            platform: mention.platform,
            position: compMention.position,
            sentiment: compMention.sentiment,
            query: mention.query,
          });
        }
      }

      if (competitorMentionsList.length === 0) {
        continue;
      }

      // Calculate metrics
      const totalMentions = competitorMentionsList.length;
      const avgPosition =
        competitorMentionsList.reduce((sum, m) => sum + (m.position || 0), 0) /
        totalMentions;

      const sentimentCounts = {
        positive: competitorMentionsList.filter((m) => m.sentiment === "positive").length,
        neutral: competitorMentionsList.filter((m) => m.sentiment === "neutral").length,
        negative: competitorMentionsList.filter((m) => m.sentiment === "negative").length,
      };

      // Platform breakdown
      const platformMap = new Map<
        string,
        { mentions: number; positions: number[]; sentiments: string[] }
      >();
      for (const m of competitorMentionsList) {
        const existing = platformMap.get(m.platform) || {
          mentions: 0,
          positions: [],
          sentiments: [],
        };
        existing.mentions++;
        if (m.position) existing.positions.push(m.position);
        existing.sentiments.push(m.sentiment);
        platformMap.set(m.platform, existing);
      }

      const platforms: PlatformBreakdown[] = [];
      for (const [platform, data] of platformMap) {
        const mostCommonSentiment = [
          { type: "positive", count: data.sentiments.filter((s) => s === "positive").length },
          { type: "neutral", count: data.sentiments.filter((s) => s === "neutral").length },
          { type: "negative", count: data.sentiments.filter((s) => s === "negative").length },
        ].sort((a, b) => b.count - a.count)[0].type as "positive" | "neutral" | "negative";

        platforms.push({
          platform,
          mentions: data.mentions,
          avgPosition:
            data.positions.length > 0
              ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
              : 0,
          sentiment: mostCommonSentiment,
        });
      }

      // Get top queries
      const queryCount = new Map<string, number>();
      for (const m of competitorMentionsList) {
        queryCount.set(m.query, (queryCount.get(m.query) || 0) + 1);
      }
      const topQueries = [...queryCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([query]) => query);

      // Determine trend (simple heuristic based on recent vs older mentions)
      const midPoint = new Date(
        (startDate.getTime() + Date.now()) / 2
      );
      const recentMentions = competitorMentionsList.filter(
        (m) => new Date(m.query) > midPoint
      ).length;
      const olderMentions = totalMentions - recentMentions;
      const trend: "rising" | "stable" | "declining" =
        recentMentions > olderMentions * 1.2
          ? "rising"
          : recentMentions < olderMentions * 0.8
          ? "declining"
          : "stable";

      analyses.push({
        competitor: {
          name: competitor.name,
          domain: competitor.url,
        },
        metrics: {
          totalMentions,
          avgPosition: Math.round(avgPosition * 100) / 100,
          sovPercentage: 0, // Will be calculated with full context
          sentiment: sentimentCounts,
        },
        platforms,
        trend,
        topQueries,
      });
    }

    return analyses;
  }

  /**
   * Find competitive gaps (areas where competitors rank but brand doesn't)
   */
  async findCompetitiveGaps(
    competitors: Array<{ name: string; url: string }>
  ): Promise<GapAnalysisResult> {
    // Get brand mentions to understand current coverage
    const brandMentionsList = await db.query.brandMentions.findMany({
      where: eq(brandMentions.brandId, this.brandId),
      orderBy: desc(brandMentions.timestamp),
      limit: 500,
    });

    // Extract topics/queries where brand appears
    const brandTopics = new Set<string>();
    for (const mention of brandMentionsList) {
      brandTopics.add(mention.query.toLowerCase());
      const topics = mention.topics || [];
      for (const topic of topics) {
        brandTopics.add(topic.toLowerCase());
      }
    }

    // Find gaps - topics where competitors appear but brand doesn't
    const gaps: CompetitiveGapItem[] = [];
    const competitorTopics = new Map<string, Set<string>>();

    for (const mention of brandMentionsList) {
      const compMentions = mention.competitors || [];
      for (const comp of compMentions) {
        const existing = competitorTopics.get(comp.name) || new Set();
        existing.add(mention.query.toLowerCase());
        competitorTopics.set(comp.name, existing);
      }
    }

    // Identify gaps
    for (const [competitorName, topics] of competitorTopics) {
      for (const topic of topics) {
        // Check if this is a gap (competitor has it, brand doesn't)
        if (!brandTopics.has(topic)) {
          gaps.push({
            type: "keyword",
            description: `Competitor "${competitorName}" ranks for "${topic}" but you don't`,
            competitor: competitorName,
            opportunity: 70, // Default opportunity score
          });
        }
      }
    }

    // Deduplicate and prioritize
    const uniqueGaps = gaps.slice(0, 20); // Limit to top 20

    // Group by type for opportunities summary
    const keywordGaps = uniqueGaps
      .filter((g) => g.type === "keyword")
      .map((g) => g.description.match(/"([^"]+)"/)?.[ 1] || "")
      .filter(Boolean);

    return {
      gaps: uniqueGaps,
      totalGaps: uniqueGaps.length,
      highPriorityGaps: uniqueGaps.filter((g) => g.opportunity >= 70).length,
      opportunities: {
        keywords: keywordGaps.slice(0, 10),
        topics: [],
        schemas: [],
      },
    };
  }

  /**
   * Get active competitive alerts
   */
  async getActiveAlerts(): Promise<CompetitiveAlertItem[]> {
    const alerts = await db.query.competitiveAlerts.findMany({
      where: and(
        eq(competitiveAlerts.brandId, this.brandId),
        eq(competitiveAlerts.isDismissed, false)
      ),
      orderBy: desc(competitiveAlerts.triggeredAt),
      limit: 10,
    });

    return alerts.map((alert) => ({
      id: alert.id,
      type: alert.alertType,
      title: alert.title,
      description: alert.description,
      severity: alert.severity as "low" | "medium" | "high" | "critical",
      competitor: alert.competitorName || undefined,
      platform: alert.platform || undefined,
      triggeredAt: alert.triggeredAt,
    }));
  }

  /**
   * Generate AI-powered insights from competitive data
   */
  private generateInsights(
    sov: ShareOfVoiceResult,
    competitors: CompetitorAnalysis[],
    gaps: GapAnalysisResult
  ): string[] {
    const insights: string[] = [];

    // SOV insights
    if (sov.overallSOV < 20) {
      insights.push(
        `Your share of voice (${sov.overallSOV.toFixed(1)}%) is below average. Focus on increasing brand visibility across AI platforms.`
      );
    } else if (sov.overallSOV > 50) {
      insights.push(
        `Strong share of voice at ${sov.overallSOV.toFixed(1)}%. Maintain visibility while monitoring competitor movements.`
      );
    }

    // Trend insights
    if (sov.trend.direction === "down" && Math.abs(sov.trend.change) > 10) {
      insights.push(
        `Your visibility has dropped ${Math.abs(sov.trend.change).toFixed(1)}% compared to the previous period. Investigate potential causes.`
      );
    } else if (sov.trend.direction === "up" && sov.trend.change > 10) {
      insights.push(
        `Great progress! Your visibility increased ${sov.trend.change.toFixed(1)}% compared to the previous period.`
      );
    }

    // Competitor insights
    const risingCompetitors = competitors.filter((c) => c.trend === "rising");
    if (risingCompetitors.length > 0) {
      insights.push(
        `Watch out: ${risingCompetitors.map((c) => c.competitor.name).join(", ")} ${
          risingCompetitors.length === 1 ? "is" : "are"
        } gaining visibility.`
      );
    }

    // Gap insights
    if (gaps.highPriorityGaps > 5) {
      insights.push(
        `Found ${gaps.highPriorityGaps} high-priority competitive gaps. These represent opportunities to expand your AI visibility.`
      );
    }

    // Platform-specific insights
    const lowPlatforms = Object.entries(sov.platformSOV)
      .filter(([, sov]) => sov < 15)
      .map(([platform]) => platform);
    if (lowPlatforms.length > 0) {
      insights.push(
        `Consider improving visibility on ${lowPlatforms.join(", ")} where your share of voice is below 15%.`
      );
    }

    return insights;
  }

  /**
   * Create a competitive alert
   */
  async createAlert(
    alertType: string,
    title: string,
    description: string,
    severity: "low" | "medium" | "high" | "critical",
    options?: {
      competitorName?: string;
      platform?: string;
      keyword?: string;
      previousValue?: number;
      currentValue?: number;
    }
  ): Promise<void> {
    await db.insert(competitiveAlerts).values({
      brandId: this.brandId,
      alertType,
      title,
      description,
      severity,
      competitorName: options?.competitorName,
      platform: options?.platform,
      keyword: options?.keyword,
      previousValue: options?.previousValue?.toString(),
      currentValue: options?.currentValue?.toString(),
    });
  }
}

/**
 * Factory function to create a competitive tracker
 */
export function createCompetitiveTracker(
  brandId: string,
  orgId: string
): CompetitiveTracker {
  return new CompetitiveTracker(brandId, orgId);
}

/**
 * Quick SOV calculation without full analysis
 */
export async function getQuickSOV(
  brandId: string,
  days: number = 7
): Promise<{ sov: number; trend: "up" | "down" | "stable" }> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, startDate)
    ),
  });

  const brandCount = mentions.length;
  let totalCount = brandCount;

  for (const mention of mentions) {
    totalCount += (mention.competitors || []).length;
  }

  const sov = totalCount > 0 ? (brandCount / totalCount) * 100 : 0;

  // Simple trend calculation
  const midPoint = new Date((startDate.getTime() + Date.now()) / 2);
  const recentMentions = mentions.filter(
    (m) => m.timestamp > midPoint
  ).length;
  const olderMentions = brandCount - recentMentions;

  const trend: "up" | "down" | "stable" =
    recentMentions > olderMentions * 1.1
      ? "up"
      : recentMentions < olderMentions * 0.9
      ? "down"
      : "stable";

  return { sov: Math.round(sov * 100) / 100, trend };
}
