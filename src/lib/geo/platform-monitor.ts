/**
 * Platform Behavior Monitor
 *
 * Detects changes in AI platform behavior by analyzing citation patterns,
 * content preferences, and feature updates across all monitored platforms.
 */

import { db } from "@/lib/db";
import { brandMentions, aiPlatformEnum } from "@/lib/db/schema/mentions";
import { citationRecords, platformInsights } from "@/lib/db/schema/ai-platform-insights";
import {
  platformChanges,
  geoBestPractices,
  type NewPlatformChange,
} from "@/lib/db/schema/geo-knowledge-base";
import { eq, and, gte, sql, desc, count } from "drizzle-orm";
import { recordPlatformChange, logKnowledgeBaseUpdate } from "./knowledge-base";

// Type for valid AI platform names
export type AIPlatform = (typeof aiPlatformEnum.enumValues)[number];

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformBehaviorSignal {
  platform: string;
  detectedAt: Date;
  changeType:
    | "citation_pattern"
    | "content_preference"
    | "feature_update"
    | "algorithm_change";
  confidence: number; // 0-100
  details: string;
  metrics: {
    before: number;
    after: number;
    percentChange: number;
  };
  recommendedAction: string;
}

export interface CitationPatternAnalysis {
  platform: string;
  period: "week" | "month";
  schemaTypeCitations: Record<string, number>;
  contentTypeCitations: Record<string, number>;
  averagePosition: number;
  totalCitations: number;
}

export interface PlatformMetrics {
  platform: string;
  mentionCount: number;
  citationRate: number;
  averageSentiment: number;
  topContentTypes: string[];
  schemaUsage: Record<string, number>;
}

// ============================================================================
// SUPPORTED PLATFORMS
// ============================================================================

export const MONITORED_PLATFORMS = [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
] as const;

export type MonitoredPlatform = (typeof MONITORED_PLATFORMS)[number];

// ============================================================================
// CITATION PATTERN ANALYSIS
// ============================================================================

/**
 * Analyze citation patterns for a specific platform over a time period
 */
export async function analyzeCitationPatterns(
  platform: AIPlatform,
  daysBack: number = 7
): Promise<CitationPatternAnalysis> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get citation records for the platform by joining with platformInsights
  const citations = await db
    .select({
      citationType: citationRecords.citationType,
      position: citationRecords.position,
      contentType: citationRecords.contentType,
      platform: platformInsights.platform,
    })
    .from(citationRecords)
    .innerJoin(platformInsights, eq(citationRecords.insightId, platformInsights.id))
    .where(
      and(
        eq(platformInsights.platform, platform),
        gte(citationRecords.createdAt, startDate)
      )
    );

  // Analyze schema type citations
  const schemaTypeCitations: Record<string, number> = {};
  const contentTypeCitations: Record<string, number> = {};
  let totalPosition = 0;

  for (const citation of citations) {
    // Track content types from the contentType field
    const contentType = citation.contentType;
    if (contentType) {
      schemaTypeCitations[contentType] = (schemaTypeCitations[contentType] || 0) + 1;
    }

    // Track citation types
    const citationType = citation.citationType;
    contentTypeCitations[citationType] = (contentTypeCitations[citationType] || 0) + 1;

    // Track position
    totalPosition += citation.position || 0;
  }

  return {
    platform,
    period: daysBack <= 7 ? "week" : "month",
    schemaTypeCitations,
    contentTypeCitations,
    averagePosition: citations.length > 0 ? totalPosition / citations.length : 0,
    totalCitations: citations.length,
  };
}

/**
 * Compare citation patterns between two time periods to detect changes
 */
export async function detectCitationPatternChanges(
  platform: AIPlatform
): Promise<PlatformBehaviorSignal | null> {
  // Analyze current week
  const currentWeek = await analyzeCitationPatterns(platform, 7);
  // Analyze previous week
  const previousWeek = await analyzeCitationPatterns(platform, 14);

  // Adjust previous week to only count days 8-14
  const previousWeekAdjusted = {
    ...previousWeek,
    totalCitations: Math.max(0, previousWeek.totalCitations - currentWeek.totalCitations),
  };

  // Calculate change in total citations
  const before = previousWeekAdjusted.totalCitations;
  const after = currentWeek.totalCitations;

  if (before === 0 && after === 0) {
    return null;
  }

  const percentChange = before > 0 ? ((after - before) / before) * 100 : after > 0 ? 100 : 0;

  // Detect significant changes (> 20% shift)
  if (Math.abs(percentChange) >= 20) {
    // Analyze which content types changed most
    const schemaChanges: string[] = [];
    for (const [schemaType, count] of Object.entries(currentWeek.schemaTypeCitations)) {
      const prevCount = previousWeek.schemaTypeCitations[schemaType] || 0;
      const schemaChange = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 100;
      if (Math.abs(schemaChange) >= 30) {
        schemaChanges.push(
          `${schemaType}: ${schemaChange > 0 ? "+" : ""}${schemaChange.toFixed(0)}%`
        );
      }
    }

    const details =
      schemaChanges.length > 0
        ? `Citation pattern shift detected. Schema changes: ${schemaChanges.join(", ")}`
        : `Overall citation volume ${percentChange > 0 ? "increased" : "decreased"} by ${Math.abs(percentChange).toFixed(0)}%`;

    return {
      platform,
      detectedAt: new Date(),
      changeType: "citation_pattern",
      confidence: Math.min(90, 50 + Math.abs(percentChange)),
      details,
      metrics: {
        before,
        after,
        percentChange,
      },
      recommendedAction:
        percentChange > 0
          ? `Continue current ${platform} optimization strategy - citations are increasing`
          : `Review ${platform} content strategy - citations are declining. Consider updating schema markup and content freshness.`,
    };
  }

  return null;
}

// ============================================================================
// CONTENT PREFERENCE ANALYSIS
// ============================================================================

/**
 * Analyze which content types a platform prefers citing
 */
export async function analyzeContentPreferences(
  platform: AIPlatform,
  daysBack: number = 30
): Promise<{ contentType: string; count: number; percentage: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const results = await db
    .select({
      contentType: citationRecords.citationType,
      count: count(),
    })
    .from(citationRecords)
    .innerJoin(platformInsights, eq(citationRecords.insightId, platformInsights.id))
    .where(
      and(
        eq(platformInsights.platform, platform),
        gte(citationRecords.createdAt, startDate)
      )
    )
    .groupBy(citationRecords.citationType)
    .orderBy(desc(count()));

  const total = results.reduce((sum, r) => sum + Number(r.count), 0);

  return results.map((r) => ({
    contentType: r.contentType,
    count: Number(r.count),
    percentage: total > 0 ? (Number(r.count) / total) * 100 : 0,
  }));
}

/**
 * Detect shifts in content preferences
 */
export async function detectContentPreferenceChanges(
  platform: AIPlatform
): Promise<PlatformBehaviorSignal | null> {
  const currentPrefs = await analyzeContentPreferences(platform, 14);
  const previousPrefs = await analyzeContentPreferences(platform, 28);

  // Compare top content types
  const currentTop = currentPrefs[0];
  const previousTop = previousPrefs[0];

  if (!currentTop || !previousTop) {
    return null;
  }

  // Check if top content type changed
  if (currentTop.contentType !== previousTop.contentType) {
    return {
      platform,
      detectedAt: new Date(),
      changeType: "content_preference",
      confidence: 75,
      details: `${platform} shifted content preference from "${previousTop.contentType}" to "${currentTop.contentType}"`,
      metrics: {
        before: previousTop.percentage,
        after: currentTop.percentage,
        percentChange:
          ((currentTop.percentage - previousTop.percentage) / previousTop.percentage) * 100,
      },
      recommendedAction: `Update content strategy to focus more on ${currentTop.contentType} content for ${platform} visibility`,
    };
  }

  return null;
}

// ============================================================================
// PLATFORM-WIDE MONITORING
// ============================================================================

/**
 * Get current metrics for a platform
 */
export async function getPlatformMetrics(
  platform: AIPlatform,
  daysBack: number = 30
): Promise<PlatformMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get mention count
  const mentionResult = await db
    .select({ count: count() })
    .from(brandMentions)
    .where(
      and(
        eq(brandMentions.platform, platform),
        gte(brandMentions.timestamp, startDate)
      )
    );

  // Get citation data
  const citationData = await analyzeCitationPatterns(platform, daysBack);
  const contentPrefs = await analyzeContentPreferences(platform, daysBack);

  // Calculate citation rate (citations per mention)
  const mentionCount = Number(mentionResult[0]?.count || 0);
  const citationRate =
    mentionCount > 0 ? citationData.totalCitations / mentionCount : 0;

  return {
    platform,
    mentionCount,
    citationRate,
    averageSentiment: 0, // Would need sentiment analysis
    topContentTypes: contentPrefs.slice(0, 3).map((p) => p.contentType),
    schemaUsage: citationData.schemaTypeCitations,
  };
}

/**
 * Run full platform behavior analysis across all monitored platforms
 */
export async function runFullPlatformAnalysis(): Promise<{
  signals: PlatformBehaviorSignal[];
  platformMetrics: Record<string, PlatformMetrics>;
  summary: {
    totalSignals: number;
    criticalSignals: number;
    platformsAnalyzed: number;
  };
}> {
  const signals: PlatformBehaviorSignal[] = [];
  const platformMetrics: Record<string, PlatformMetrics> = {};

  for (const platform of MONITORED_PLATFORMS) {
    try {
      // Get platform metrics
      platformMetrics[platform] = await getPlatformMetrics(platform);

      // Check for citation pattern changes
      const citationSignal = await detectCitationPatternChanges(platform);
      if (citationSignal) {
        signals.push(citationSignal);
      }

      // Check for content preference changes
      const contentSignal = await detectContentPreferenceChanges(platform);
      if (contentSignal) {
        signals.push(contentSignal);
      }
    } catch (error) {
      console.error(`Error analyzing platform ${platform}:`, error);
    }
  }

  return {
    signals,
    platformMetrics,
    summary: {
      totalSignals: signals.length,
      criticalSignals: signals.filter((s) => s.confidence >= 80).length,
      platformsAnalyzed: MONITORED_PLATFORMS.length,
    },
  };
}

// ============================================================================
// CHANGE RECORDING & ALERTING
// ============================================================================

/**
 * Process detected signals and record as platform changes
 */
export async function processAndRecordSignals(
  signals: PlatformBehaviorSignal[]
): Promise<{ recorded: number; errors: number }> {
  let recorded = 0;
  let errors = 0;

  for (const signal of signals) {
    try {
      // Only record high-confidence signals
      if (signal.confidence < 60) {
        continue;
      }

      // Find affected best practices
      const affectedPractices = await db
        .select({ id: geoBestPractices.id })
        .from(geoBestPractices)
        .where(eq(geoBestPractices.platform, signal.platform));

      const change: NewPlatformChange = {
        platform: signal.platform,
        changeDetected: signal.detectedAt,
        changeType: signal.changeType,
        description: signal.details,
        impactAssessment: `${signal.metrics.percentChange > 0 ? "Positive" : "Negative"} impact: ${Math.abs(signal.metrics.percentChange).toFixed(0)}% change in ${signal.changeType}`,
        recommendedResponse: signal.recommendedAction,
        confidenceScore: signal.confidence,
        source: "automated_test",
        affectedRecommendations: affectedPractices.map((p) => p.id),
      };

      await recordPlatformChange(change);
      recorded++;
    } catch (error) {
      console.error(`Error recording signal:`, error);
      errors++;
    }
  }

  // Log the update
  if (recorded > 0) {
    await logKnowledgeBaseUpdate({
      updateType: "platform_changes",
      description: `Recorded ${recorded} platform behavior changes from automated analysis`,
      itemsAdded: recorded,
      affectedPlatforms: [...new Set(signals.map((s) => s.platform))],
      dataSource: "automated_test",
      success: errors === 0,
      errorMessage: errors > 0 ? `${errors} signals failed to record` : undefined,
    });
  }

  return { recorded, errors };
}

// ============================================================================
// SCHEDULED MONITORING
// ============================================================================

/**
 * Run scheduled platform monitoring job
 * Should be called by cron job (e.g., weekly)
 */
export async function runScheduledMonitoring(): Promise<{
  success: boolean;
  signalsDetected: number;
  changesRecorded: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Run full analysis
    const analysis = await runFullPlatformAnalysis();

    // Process and record signals
    const recordResult = await processAndRecordSignals(analysis.signals);

    // Log completion
    await logKnowledgeBaseUpdate({
      updateType: "platform_changes",
      description: `Scheduled monitoring completed. Analyzed ${analysis.summary.platformsAnalyzed} platforms, detected ${analysis.summary.totalSignals} signals.`,
      itemsAdded: recordResult.recorded,
      affectedPlatforms: MONITORED_PLATFORMS.slice(),
      dataSource: "scheduled_monitoring",
      success: true,
    });

    return {
      success: true,
      signalsDetected: analysis.summary.totalSignals,
      changesRecorded: recordResult.recorded,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMessage);

    await logKnowledgeBaseUpdate({
      updateType: "platform_changes",
      description: `Scheduled monitoring failed: ${errorMessage}`,
      affectedPlatforms: MONITORED_PLATFORMS.slice(),
      dataSource: "scheduled_monitoring",
      success: false,
      errorMessage,
    });

    return {
      success: false,
      signalsDetected: 0,
      changesRecorded: 0,
      errors,
    };
  }
}
