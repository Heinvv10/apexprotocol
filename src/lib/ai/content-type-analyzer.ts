/**
 * Content Type Analyzer for AI Platform Responses
 *
 * Identifies which content types (blog posts, documentation, case studies, etc.)
 * perform best on each AI platform based on citation patterns and visibility metrics.
 */

import type {
  Citation,
  ContentType,
  ContentTypePerformance,
  PlatformResponse,
  AIPlatform,
} from "./types";
import { logger } from "@/lib/logger";

/**
 * Configuration for content type analysis
 */
export interface ContentTypeAnalyzerOptions {
  /** Minimum citations required for a content type to be considered significant */
  minCitationsThreshold?: number;
  /** Whether to include unknown content types in analysis */
  includeUnknown?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Detailed content type metrics
 */
export interface ContentTypeMetrics {
  /** Content type */
  type: ContentType;
  /** Number of citations of this content type */
  count: number;
  /** Percentage of total citations */
  percentage: number;
  /** Average relevance score for this content type */
  avgRelevance: number;
  /** Average position in responses (0-1, where 0 is start) */
  avgPosition: number;
  /** Citation types distribution (direct_quote, paraphrase, link, reference) */
  citationTypes: {
    direct_quote: number;
    paraphrase: number;
    link: number;
    reference: number;
  };
}

/**
 * Content type analysis result
 */
export interface ContentTypeAnalysisResult {
  /** Performance metrics (citation counts per content type) */
  performance: ContentTypePerformance;
  /** Detailed metrics for each content type */
  metrics: ContentTypeMetrics[];
  /** Best performing content type */
  bestPerformer?: ContentType;
  /** Worst performing content type (excluding unknown) */
  worstPerformer?: ContentType;
  /** Total citations analyzed */
  totalCitations: number;
  /** Number of unique content types found */
  uniqueContentTypes: number;
  /** Insights about content performance */
  insights: string[];
}

/**
 * Multi-platform content type comparison
 */
export interface MultiPlatformContentAnalysis {
  /** Analysis per platform */
  platforms: Map<AIPlatform, ContentTypeAnalysisResult>;
  /** Aggregate performance across all platforms */
  aggregate: ContentTypePerformance;
  /** Content types that perform best overall */
  topPerformers: ContentType[];
  /** Content types that perform poorly overall */
  underperformers: ContentType[];
  /** Platform-specific recommendations */
  recommendations: Map<AIPlatform, string[]>;
}

/**
 * Content Type Analyzer Class
 *
 * Analyzes citations to identify which content types perform best per platform.
 * Provides detailed metrics, performance comparisons, and actionable insights.
 */
export class ContentTypeAnalyzer {
  private options: Required<ContentTypeAnalyzerOptions>;

  constructor(options: ContentTypeAnalyzerOptions = {}) {
    this.options = {
      minCitationsThreshold: options.minCitationsThreshold || 2,
      includeUnknown: options.includeUnknown || false,
      debug: options.debug || false,
    };
  }

  /**
   * Analyze citations to identify content type performance
   *
   * @param citations - Citations extracted from platform response
   * @param platform - The platform being analyzed (optional, for logging)
   * @returns ContentTypeAnalysisResult with performance metrics and insights
   *
   * @example
   * ```typescript
   * const analyzer = new ContentTypeAnalyzer();
   * const result = analyzer.analyze(citations, "chatgpt");
   * logger.info(`Best performer: ${result.bestPerformer}`);
   * ```
   */
  analyze(
    citations: Citation[],
    platform?: AIPlatform
  ): ContentTypeAnalysisResult {
    if (citations.length === 0) {
      return this.emptyResult();
    }

    // Filter out unknown content types if configured
    const filteredCitations = this.options.includeUnknown
      ? citations
      : citations.filter((c) => c.contentType !== "unknown");

    // Group citations by content type
    const groupedCitations = this.groupByContentType(filteredCitations);

    // Calculate performance metrics
    const performance = this.calculatePerformance(groupedCitations);

    // Calculate detailed metrics for each content type
    const metrics = this.calculateDetailedMetrics(
      groupedCitations,
      filteredCitations.length
    );

    // Identify best and worst performers
    const bestPerformer = this.identifyBestPerformer(metrics);
    const worstPerformer = this.identifyWorstPerformer(metrics);

    // Generate insights
    const insights = this.generateInsights(metrics, bestPerformer, worstPerformer);

    if (this.options.debug) {
      logger.info(
        `[ContentTypeAnalyzer${platform ? ` - ${platform}` : ""}] Analyzed ${
          filteredCitations.length
        } citations across ${metrics.length} content types`
      );
    }

    return {
      performance,
      metrics,
      bestPerformer,
      worstPerformer,
      totalCitations: filteredCitations.length,
      uniqueContentTypes: metrics.length,
      insights,
    };
  }

  /**
   * Analyze content type performance from a PlatformResponse
   *
   * @param response - Complete platform response with citations
   * @returns ContentTypeAnalysisResult
   */
  analyzeFromResponse(response: PlatformResponse): ContentTypeAnalysisResult {
    return this.analyze(response.citations, response.platform);
  }

  /**
   * Compare content type performance across multiple platforms
   *
   * @param responses - Array of platform responses to compare
   * @returns MultiPlatformContentAnalysis with cross-platform insights
   *
   * @example
   * ```typescript
   * const analyzer = new ContentTypeAnalyzer();
   * const comparison = analyzer.compareAcrossPlatforms([
   *   chatgptResponse,
   *   claudeResponse,
   *   geminiResponse,
   *   perplexityResponse
   * ]);
   * ```
   */
  compareAcrossPlatforms(
    responses: PlatformResponse[]
  ): MultiPlatformContentAnalysis {
    const platforms = new Map<AIPlatform, ContentTypeAnalysisResult>();

    // Analyze each platform
    for (const response of responses) {
      const analysis = this.analyzeFromResponse(response);
      platforms.set(response.platform, analysis);
    }

    // Calculate aggregate performance
    const aggregate = this.calculateAggregatePerformance(platforms);

    // Identify top performers and underperformers
    const topPerformers = this.identifyTopPerformersAcrossPlatforms(platforms);
    const underperformers = this.identifyUnderperformersAcrossPlatforms(platforms);

    // Generate platform-specific recommendations
    const recommendations = this.generatePlatformRecommendations(
      platforms,
      topPerformers
    );

    return {
      platforms,
      aggregate,
      topPerformers,
      underperformers,
      recommendations,
    };
  }

  /**
   * Group citations by content type
   *
   * @param citations - Citations to group
   * @returns Map of content type to citations
   */
  private groupByContentType(
    citations: Citation[]
  ): Map<ContentType, Citation[]> {
    const groups = new Map<ContentType, Citation[]>();

    for (const citation of citations) {
      const contentType = citation.contentType || "unknown";
      const existing = groups.get(contentType) || [];
      existing.push(citation);
      groups.set(contentType, existing);
    }

    return groups;
  }

  /**
   * Calculate performance metrics (citation counts per content type)
   *
   * @param groupedCitations - Citations grouped by content type
   * @returns ContentTypePerformance with counts
   */
  private calculatePerformance(
    groupedCitations: Map<ContentType, Citation[]>
  ): ContentTypePerformance {
    const performance: ContentTypePerformance = {};

    for (const [contentType, citations] of groupedCitations.entries()) {
      if (contentType !== "unknown" || this.options.includeUnknown) {
        performance[contentType] = citations.length;
      }
    }

    return performance;
  }

  /**
   * Calculate detailed metrics for each content type
   *
   * @param groupedCitations - Citations grouped by content type
   * @param totalCitations - Total number of citations
   * @returns Array of ContentTypeMetrics
   */
  private calculateDetailedMetrics(
    groupedCitations: Map<ContentType, Citation[]>,
    totalCitations: number
  ): ContentTypeMetrics[] {
    const metrics: ContentTypeMetrics[] = [];

    for (const [contentType, citations] of groupedCitations.entries()) {
      // Skip unknown if not included
      if (contentType === "unknown" && !this.options.includeUnknown) {
        continue;
      }

      // Skip content types below threshold
      if (citations.length < this.options.minCitationsThreshold) {
        continue;
      }

      // Calculate average relevance
      const avgRelevance =
        citations.reduce((sum, c) => sum + (c.relevanceScore || 0), 0) /
        citations.length;

      // Calculate average position (normalized 0-1)
      const avgPosition =
        citations.reduce((sum, c) => sum + (c.position || 0), 0) /
        citations.length;

      // Calculate citation types distribution
      const citationTypes = {
        direct_quote: citations.filter((c) => c.type === "direct_quote").length,
        paraphrase: citations.filter((c) => c.type === "paraphrase").length,
        link: citations.filter((c) => c.type === "link").length,
        reference: citations.filter((c) => c.type === "reference").length,
      };

      metrics.push({
        type: contentType,
        count: citations.length,
        percentage: (citations.length / totalCitations) * 100,
        avgRelevance: Math.round(avgRelevance),
        avgPosition: avgPosition,
        citationTypes,
      });
    }

    // Sort by count descending
    return metrics.sort((a, b) => b.count - a.count);
  }

  /**
   * Identify the best performing content type
   *
   * @param metrics - Content type metrics
   * @returns Best performing content type, or undefined if none
   */
  private identifyBestPerformer(
    metrics: ContentTypeMetrics[]
  ): ContentType | undefined {
    if (metrics.length === 0) return undefined;

    // Best performer is the one with highest count and relevance
    // Weight: 70% count, 30% relevance
    const scored = metrics.map((m) => ({
      type: m.type,
      score: m.count * 0.7 + (m.avgRelevance / 100) * 0.3,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].type;
  }

  /**
   * Identify the worst performing content type
   *
   * @param metrics - Content type metrics
   * @returns Worst performing content type, or undefined if none
   */
  private identifyWorstPerformer(
    metrics: ContentTypeMetrics[]
  ): ContentType | undefined {
    if (metrics.length === 0) return undefined;

    // Filter out unknown
    const filtered = metrics.filter((m) => m.type !== "unknown");
    if (filtered.length === 0) return undefined;

    // Worst performer is the one with lowest count and relevance
    // Weight: 70% count, 30% relevance
    const scored = filtered.map((m) => ({
      type: m.type,
      score: m.count * 0.7 + (m.avgRelevance / 100) * 0.3,
    }));

    scored.sort((a, b) => a.score - b.score);
    return scored[0].type;
  }

  /**
   * Generate insights about content type performance
   *
   * @param metrics - Content type metrics
   * @param bestPerformer - Best performing content type
   * @param worstPerformer - Worst performing content type
   * @returns Array of insight strings
   */
  private generateInsights(
    metrics: ContentTypeMetrics[],
    bestPerformer?: ContentType,
    worstPerformer?: ContentType
  ): string[] {
    const insights: string[] = [];

    if (metrics.length === 0) {
      insights.push("No content types identified in citations");
      return insights;
    }

    // Best performer insight
    if (bestPerformer) {
      const bestMetrics = metrics.find((m) => m.type === bestPerformer);
      if (bestMetrics) {
        insights.push(
          `${this.formatContentType(bestPerformer)} performs best with ${
            bestMetrics.count
          } citations (${Math.round(bestMetrics.percentage)}% of total)`
        );
      }
    }

    // Worst performer insight
    if (worstPerformer && metrics.length > 1) {
      const worstMetrics = metrics.find((m) => m.type === worstPerformer);
      if (worstMetrics) {
        insights.push(
          `${this.formatContentType(worstPerformer)} has lowest performance with ${
            worstMetrics.count
          } citations (${Math.round(worstMetrics.percentage)}% of total)`
        );
      }
    }

    // Diversity insight
    if (metrics.length >= 3) {
      insights.push(
        `Good content diversity with ${metrics.length} different content types cited`
      );
    } else if (metrics.length === 1) {
      insights.push(
        "Limited content diversity - consider creating varied content types"
      );
    }

    // Relevance insight
    const avgRelevance =
      metrics.reduce((sum, m) => sum + m.avgRelevance, 0) / metrics.length;
    if (avgRelevance >= 80) {
      insights.push(
        `High relevance across content types (avg: ${Math.round(avgRelevance)})`
      );
    } else if (avgRelevance < 50) {
      insights.push(
        `Low relevance across content types (avg: ${Math.round(
          avgRelevance
        )}) - focus on brand-relevant content`
      );
    }

    return insights;
  }

  /**
   * Calculate aggregate performance across all platforms
   *
   * @param platforms - Map of platform to analysis results
   * @returns Aggregate ContentTypePerformance
   */
  private calculateAggregatePerformance(
    platforms: Map<AIPlatform, ContentTypeAnalysisResult>
  ): ContentTypePerformance {
    const aggregate: ContentTypePerformance = {};

    for (const [_, analysis] of platforms) {
      for (const [contentType, count] of Object.entries(analysis.performance)) {
        if (count !== undefined) {
          aggregate[contentType] = (aggregate[contentType] || 0) + count;
        }
      }
    }

    return aggregate;
  }

  /**
   * Identify top performing content types across all platforms
   *
   * @param platforms - Map of platform to analysis results
   * @returns Array of top performing content types
   */
  private identifyTopPerformersAcrossPlatforms(
    platforms: Map<AIPlatform, ContentTypeAnalysisResult>
  ): ContentType[] {
    const aggregate = this.calculateAggregatePerformance(platforms);

    // Get top 3 content types by total count
    const sorted = Object.entries(aggregate)
      .filter(([type, _]) => type !== "unknown")
      .sort(([_, countA], [__, countB]) => (countB || 0) - (countA || 0))
      .slice(0, 3)
      .map(([type, _]) => type as ContentType);

    return sorted;
  }

  /**
   * Identify underperforming content types across all platforms
   *
   * @param platforms - Map of platform to analysis results
   * @returns Array of underperforming content types
   */
  private identifyUnderperformersAcrossPlatforms(
    platforms: Map<AIPlatform, ContentTypeAnalysisResult>
  ): ContentType[] {
    const aggregate = this.calculateAggregatePerformance(platforms);

    // Get bottom 2 content types by total count (excluding unknown)
    const sorted = Object.entries(aggregate)
      .filter(([type, count]) => type !== "unknown" && (count || 0) > 0)
      .sort(([_, countA], [__, countB]) => (countA || 0) - (countB || 0))
      .slice(0, 2)
      .map(([type, _]) => type as ContentType);

    return sorted;
  }

  /**
   * Generate platform-specific recommendations
   *
   * @param platforms - Map of platform to analysis results
   * @param topPerformers - Top performing content types overall
   * @returns Map of platform to recommendations
   */
  private generatePlatformRecommendations(
    platforms: Map<AIPlatform, ContentTypeAnalysisResult>,
    topPerformers: ContentType[]
  ): Map<AIPlatform, string[]> {
    const recommendations = new Map<AIPlatform, string[]>();

    for (const [platform, analysis] of platforms) {
      const recs: string[] = [];

      // Recommend creating more of best performer if not already top
      if (analysis.bestPerformer) {
        recs.push(
          `Create more ${this.formatContentType(
            analysis.bestPerformer
          )} - it performs best on ${platform}`
        );
      }

      // Recommend leveraging top performers if not being used
      for (const topPerformer of topPerformers) {
        const count = analysis.performance[topPerformer] || 0;
        if (count === 0) {
          recs.push(
            `Consider creating ${this.formatContentType(
              topPerformer
            )} - it performs well on other platforms`
          );
        }
      }

      // Recommend diversifying if low content type count
      if (analysis.uniqueContentTypes < 3) {
        recs.push(
          "Diversify content types to improve visibility across different citation contexts"
        );
      }

      recommendations.set(platform, recs);
    }

    return recommendations;
  }

  /**
   * Format content type for display
   *
   * @param contentType - Content type to format
   * @returns Formatted string
   */
  private formatContentType(contentType: ContentType): string {
    return contentType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Return empty analysis result
   *
   * @returns Empty ContentTypeAnalysisResult
   */
  private emptyResult(): ContentTypeAnalysisResult {
    return {
      performance: {},
      metrics: [],
      totalCitations: 0,
      uniqueContentTypes: 0,
      insights: ["No citations to analyze"],
    };
  }

  /**
   * Filter metrics by minimum count threshold
   *
   * @param metrics - Content type metrics to filter
   * @param minCount - Minimum citation count
   * @returns Filtered metrics
   */
  static filterByMinCount(
    metrics: ContentTypeMetrics[],
    minCount: number
  ): ContentTypeMetrics[] {
    return metrics.filter((m) => m.count >= minCount);
  }

  /**
   * Filter metrics by content type
   *
   * @param metrics - Content type metrics to filter
   * @param contentTypes - Content types to include
   * @returns Filtered metrics
   */
  static filterByContentTypes(
    metrics: ContentTypeMetrics[],
    contentTypes: ContentType[]
  ): ContentTypeMetrics[] {
    return metrics.filter((m) => contentTypes.includes(m.type));
  }

  /**
   * Get top N performing content types
   *
   * @param metrics - Content type metrics
   * @param n - Number of top performers to return
   * @returns Top N content types
   */
  static getTopN(metrics: ContentTypeMetrics[], n: number): ContentType[] {
    return metrics.slice(0, n).map((m) => m.type);
  }

  /**
   * Calculate performance ratio between two content types
   *
   * @param metrics - Content type metrics
   * @param type1 - First content type
   * @param type2 - Second content type
   * @returns Ratio of type1 to type2 performance, or null if either not found
   */
  static compareContentTypes(
    metrics: ContentTypeMetrics[],
    type1: ContentType,
    type2: ContentType
  ): number | null {
    const metrics1 = metrics.find((m) => m.type === type1);
    const metrics2 = metrics.find((m) => m.type === type2);

    if (!metrics1 || !metrics2 || metrics2.count === 0) {
      return null;
    }

    return metrics1.count / metrics2.count;
  }
}

/**
 * Analyze content type performance from citations (convenience function)
 *
 * @param citations - Citations to analyze
 * @param options - Analyzer options
 * @returns ContentTypeAnalysisResult
 *
 * @example
 * ```typescript
 * const result = analyzeContentTypes(citations);
 * logger.info(`Best performer: ${result.bestPerformer}`);
 * ```
 */
export function analyzeContentTypes(
  citations: Citation[],
  options?: ContentTypeAnalyzerOptions
): ContentTypeAnalysisResult {
  const analyzer = new ContentTypeAnalyzer(options);
  return analyzer.analyze(citations);
}

/**
 * Analyze content type performance from a platform response (convenience function)
 *
 * @param response - Platform response to analyze
 * @param options - Analyzer options
 * @returns ContentTypeAnalysisResult
 *
 * @example
 * ```typescript
 * const response = await adapter.analyze(query, brandContext);
 * const result = analyzeContentTypesFromResponse(response);
 * ```
 */
export function analyzeContentTypesFromResponse(
  response: PlatformResponse,
  options?: ContentTypeAnalyzerOptions
): ContentTypeAnalysisResult {
  const analyzer = new ContentTypeAnalyzer(options);
  return analyzer.analyzeFromResponse(response);
}

/**
 * Compare content type performance across multiple platforms (convenience function)
 *
 * @param responses - Array of platform responses
 * @param options - Analyzer options
 * @returns MultiPlatformContentAnalysis
 *
 * @example
 * ```typescript
 * const responses = await Promise.all([
 *   chatgptAdapter.analyze(query, brandContext),
 *   claudeAdapter.analyze(query, brandContext),
 *   geminiAdapter.analyze(query, brandContext),
 *   perplexityAdapter.analyze(query, brandContext),
 * ]);
 * const comparison = compareContentTypesAcrossPlatforms(responses);
 * logger.info(`Top performers: ${comparison.topPerformers.join(', ')}`);
 * ```
 */
export function compareContentTypesAcrossPlatforms(
  responses: PlatformResponse[],
  options?: ContentTypeAnalyzerOptions
): MultiPlatformContentAnalysis {
  const analyzer = new ContentTypeAnalyzer(options);
  return analyzer.compareAcrossPlatforms(responses);
}
