/**
 * Recommendation Engine for AI Platform Insights
 *
 * Generates 3-5 actionable, platform-specific recommendations to improve
 * brand visibility on AI platforms (ChatGPT, Claude, Gemini, Perplexity).
 *
 * The engine analyzes visibility scores, citation patterns, and content type
 * performance to select the most relevant recommendations from a template library.
 */

import type {
  Recommendation,
  PlatformAnalysis,
  VisibilityScore,
  ContentTypePerformance,
  AIPlatform,
  ContentType,
} from "./types";
import {
  generateRecommendations as generateFromTemplates,
  selectTemplates,
  type TemplateSelectionContext,
  type RecommendationTemplate,
} from "./recommendation-templates";
import {
  enrichRecommendation,
  enrichRecommendations,
  generateStepsForTemplate,
  getPlatformRelevance,
  getEstimatedTimeForTemplate,
  getExpectedScoreImpact,
  generateSchemaForTemplate,
  type EnrichedRecommendation,
} from "./step-generator";
import type { BrandSchemaData } from "../reports/schema-generator";

/**
 * Configuration for recommendation generation
 */
export interface RecommendationEngineOptions {
  /** Minimum number of recommendations to generate (default: 3) */
  minRecommendations?: number;
  /** Maximum number of recommendations to generate (default: 5) */
  maxRecommendations?: number;
  /** Brand name for personalization */
  brandName?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Recommendation generation context
 */
export interface RecommendationContext {
  /** Platform being analyzed */
  platform: AIPlatform;
  /** Visibility score breakdown */
  visibilityScore: VisibilityScore;
  /** Content type performance data */
  contentTypePerformance: ContentTypePerformance;
  /** Brand name for personalization */
  brandName?: string;
}

/**
 * Recommendation Engine Class
 *
 * Analyzes platform performance metrics and generates tailored recommendations
 * to improve brand visibility. Uses a template-based approach with intelligent
 * selection based on visibility scores, citation patterns, and content performance.
 */
export class RecommendationEngine {
  private options: Required<RecommendationEngineOptions>;

  constructor(options: RecommendationEngineOptions = {}) {
    this.options = {
      minRecommendations: options.minRecommendations || 3,
      maxRecommendations: options.maxRecommendations || 5,
      brandName: options.brandName || "",
      debug: options.debug || false,
    };
  }

  /**
   * Generate recommendations from a complete platform analysis
   *
   * @param analysis - Complete platform analysis with scores and metrics
   * @returns Array of 3-5 actionable recommendations
   *
   * @example
   * ```typescript
   * const engine = new RecommendationEngine({ brandName: "Acme Corp" });
   * const recommendations = engine.generateFromAnalysis(platformAnalysis);
   * console.log(`Generated ${recommendations.length} recommendations`);
   * recommendations.forEach(rec => {
   *   console.log(`${rec.priority}: ${rec.title}`);
   * });
   * ```
   */
  generateFromAnalysis(analysis: PlatformAnalysis): Recommendation[] {
    return this.generate({
      platform: analysis.platform,
      visibilityScore: analysis.visibilityScore,
      contentTypePerformance: analysis.contentTypePerformance,
      brandName: this.options.brandName,
    });
  }

  /**
   * Generate recommendations from individual components
   *
   * @param context - Recommendation context with platform and metrics
   * @returns Array of 3-5 actionable recommendations
   *
   * @example
   * ```typescript
   * const engine = new RecommendationEngine();
   * const recommendations = engine.generate({
   *   platform: 'chatgpt',
   *   visibilityScore: myVisibilityScore,
   *   contentTypePerformance: myContentPerformance,
   *   brandName: 'Acme Corp'
   * });
   * ```
   */
  generate(context: RecommendationContext): Recommendation[] {
    const { platform, visibilityScore, contentTypePerformance, brandName } =
      context;

    // Extract metrics from visibility score
    const mentionCount = visibilityScore.metrics.totalMentions;
    const citationCount = visibilityScore.metrics.totalCitations;
    const prominence = visibilityScore.breakdown.prominence;

    // Determine best and worst performing content types
    const bestContentType = this.findBestContentType(contentTypePerformance);
    const worstContentType = this.findWorstContentType(contentTypePerformance);

    // Build template selection context
    const templateContext: TemplateSelectionContext = {
      platform,
      visibilityScore: visibilityScore.total,
      mentionCount,
      citationCount,
      prominence,
      bestContentType,
      worstContentType,
    };

    if (this.options.debug) {
      console.log(
        `[RecommendationEngine - ${platform}] Generating recommendations...`
      );
      console.log(
        `  Visibility: ${visibilityScore.total}/100 | Mentions: ${mentionCount} | Citations: ${citationCount}`
      );
      console.log(
        `  Best content type: ${bestContentType || "none"} | Worst: ${worstContentType || "none"}`
      );
    }

    // Generate recommendations from templates
    let recommendations = generateFromTemplates(
      templateContext,
      this.options.maxRecommendations
    );

    // Personalize recommendations with brand name if provided
    if (brandName) {
      recommendations = this.personalizeRecommendations(
        recommendations,
        brandName
      );
    }

    // Ensure we have minimum number of recommendations
    if (
      recommendations.length < this.options.minRecommendations &&
      this.options.debug
    ) {
      console.warn(
        `[RecommendationEngine - ${platform}] Only generated ${recommendations.length} recommendations (min: ${this.options.minRecommendations})`
      );
    }

    if (this.options.debug) {
      console.log(
        `[RecommendationEngine - ${platform}] Generated ${recommendations.length} recommendations`
      );
      recommendations.forEach((rec, i) => {
        console.log(
          `  ${i + 1}. [P${rec.priority}] ${rec.title} (${rec.impact} impact, ${rec.difficulty} difficulty)`
        );
      });
    }

    return recommendations;
  }

  /**
   * Find the best performing content type based on citation count
   *
   * @param performance - Content type performance data
   * @returns Best performing content type, or undefined if none found
   */
  private findBestContentType(
    performance: ContentTypePerformance
  ): ContentType | undefined {
    const entries = Object.entries(performance) as [ContentType, number][];

    if (entries.length === 0) {
      return undefined;
    }

    // Filter out unknown and sort by count
    const validEntries = entries
      .filter(([type]) => type !== "unknown")
      .sort(([, a], [, b]) => b - a);

    return validEntries.length > 0 ? validEntries[0][0] : undefined;
  }

  /**
   * Find the worst performing content type based on citation count
   *
   * @param performance - Content type performance data
   * @returns Worst performing content type, or undefined if none found
   */
  private findWorstContentType(
    performance: ContentTypePerformance
  ): ContentType | undefined {
    const entries = Object.entries(performance) as [ContentType, number][];

    if (entries.length === 0) {
      return undefined;
    }

    // Filter out unknown, exclude zero counts, and sort by count ascending
    const validEntries = entries
      .filter(([type, count]) => type !== "unknown" && count > 0)
      .sort(([, a], [, b]) => a - b);

    return validEntries.length > 0 ? validEntries[0][0] : undefined;
  }

  /**
   * Personalize recommendations by replacing brand placeholders
   *
   * @param recommendations - Array of recommendations
   * @param brandName - Brand name to use for personalization
   * @returns Personalized recommendations
   */
  private personalizeRecommendations(
    recommendations: Recommendation[],
    brandName: string
  ): Recommendation[] {
    return recommendations.map((rec) => ({
      ...rec,
      description: rec.description.replace(/\[Brand\]/g, brandName),
      actionItems: rec.actionItems?.map((item) =>
        item.replace(/\[Brand\]/g, brandName)
      ),
      examples: rec.examples?.map((example) =>
        example.replace(/\[Brand\]/g, brandName)
      ),
    }));
  }

  /**
   * Generate recommendations for multiple platforms
   *
   * @param analyses - Array of platform analyses
   * @returns Map of platform to recommendations
   *
   * @example
   * ```typescript
   * const engine = new RecommendationEngine({ brandName: "Acme Corp" });
   * const allRecommendations = engine.generateForMultiplePlatforms([
   *   chatgptAnalysis,
   *   claudeAnalysis,
   *   geminiAnalysis,
   *   perplexityAnalysis
   * ]);
   * allRecommendations.forEach((recs, platform) => {
   *   console.log(`${platform}: ${recs.length} recommendations`);
   * });
   * ```
   */
  generateForMultiplePlatforms(
    analyses: PlatformAnalysis[]
  ): Map<AIPlatform, Recommendation[]> {
    const recommendations = new Map<AIPlatform, Recommendation[]>();

    for (const analysis of analyses) {
      if (analysis.status === "success" || analysis.status === "partial") {
        const platformRecs = this.generateFromAnalysis(analysis);
        recommendations.set(analysis.platform, platformRecs);
      } else if (this.options.debug) {
        console.warn(
          `[RecommendationEngine] Skipping failed analysis for ${analysis.platform}`
        );
      }
    }

    return recommendations;
  }

  /**
   * Get recommendation summary statistics
   *
   * @param recommendations - Array of recommendations
   * @returns Summary statistics object
   */
  getSummary(recommendations: Recommendation[]): {
    total: number;
    byPriority: Record<number, number>;
    byImpact: Record<string, number>;
    byDifficulty: Record<string, number>;
    highPriorityCount: number;
    quickWinsCount: number;
  } {
    const summary = {
      total: recommendations.length,
      byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byImpact: { high: 0, medium: 0, low: 0 },
      byDifficulty: { easy: 0, moderate: 0, hard: 0 },
      highPriorityCount: 0,
      quickWinsCount: 0,
    };

    for (const rec of recommendations) {
      summary.byPriority[rec.priority]++;
      summary.byImpact[rec.impact]++;
      summary.byDifficulty[rec.difficulty]++;

      if (rec.priority <= 2) {
        summary.highPriorityCount++;
      }

      // Quick wins = high impact + easy difficulty
      if (rec.impact === "high" && rec.difficulty === "easy") {
        summary.quickWinsCount++;
      }
    }

    return summary;
  }

  /**
   * Generate enriched recommendations with full implementation steps
   *
   * This method returns recommendations with rich step-by-step instructions,
   * platform relevance scores, schema code, and expected score impacts.
   *
   * @param analysis - Complete platform analysis
   * @param brandData - Brand data for schema generation and personalization
   * @returns Array of enriched recommendations with implementation details
   *
   * @example
   * ```typescript
   * const engine = new RecommendationEngine({ brandName: "Acme Corp" });
   * const enrichedRecs = engine.generateEnrichedRecommendations(
   *   platformAnalysis,
   *   { name: "Acme Corp", url: "https://acme.com", description: "..." }
   * );
   * enrichedRecs.forEach(rec => {
   *   console.log(`${rec.title}: ${rec.steps.length} steps`);
   *   console.log(`Expected score impact: +${rec.expectedScoreImpact} points`);
   * });
   * ```
   */
  generateEnrichedRecommendations(
    analysis: PlatformAnalysis,
    brandData?: BrandSchemaData
  ): EnrichedRecommendation[] {
    // Get template selection context
    const visibilityScore = analysis.visibilityScore;
    const contentTypePerformance = analysis.contentTypePerformance;

    const templateContext: TemplateSelectionContext = {
      platform: analysis.platform,
      visibilityScore: visibilityScore.total,
      mentionCount: visibilityScore.metrics.totalMentions,
      citationCount: visibilityScore.metrics.totalCitations,
      prominence: visibilityScore.breakdown.prominence,
      bestContentType: this.findBestContentType(contentTypePerformance),
      worstContentType: this.findWorstContentType(contentTypePerformance),
    };

    // Select applicable templates
    const templates = selectTemplates(templateContext, this.options.maxRecommendations);

    // Enrich templates with implementation steps
    const enrichedRecs = enrichRecommendations(templates, brandData);

    if (this.options.debug) {
      console.log(
        `[RecommendationEngine - ${analysis.platform}] Generated ${enrichedRecs.length} enriched recommendations`
      );
      enrichedRecs.forEach((rec, i) => {
        console.log(
          `  ${i + 1}. ${rec.title}: ${rec.steps.length} steps, +${rec.expectedScoreImpact} expected points`
        );
      });
    }

    return enrichedRecs;
  }

  /**
   * Generate enriched recommendations for multiple platforms
   *
   * @param analyses - Array of platform analyses
   * @param brandData - Brand data for schema generation
   * @returns Map of platform to enriched recommendations
   */
  generateEnrichedForMultiplePlatforms(
    analyses: PlatformAnalysis[],
    brandData?: BrandSchemaData
  ): Map<AIPlatform, EnrichedRecommendation[]> {
    const recommendations = new Map<AIPlatform, EnrichedRecommendation[]>();

    for (const analysis of analyses) {
      if (analysis.status === "success" || analysis.status === "partial") {
        const platformRecs = this.generateEnrichedRecommendations(analysis, brandData);
        recommendations.set(analysis.platform, platformRecs);
      }
    }

    return recommendations;
  }
}

// ============================================================================
// Standalone Utility Functions
// ============================================================================

/**
 * Generate recommendations from a platform analysis
 *
 * Convenience function for quick recommendation generation without instantiating a class.
 *
 * @param analysis - Complete platform analysis
 * @param options - Optional configuration
 * @returns Array of 3-5 recommendations
 *
 * @example
 * ```typescript
 * const recommendations = generateRecommendations(platformAnalysis, {
 *   brandName: "Acme Corp",
 *   maxRecommendations: 5
 * });
 * ```
 */
export function generateRecommendations(
  analysis: PlatformAnalysis,
  options?: RecommendationEngineOptions
): Recommendation[] {
  const engine = new RecommendationEngine(options);
  return engine.generateFromAnalysis(analysis);
}

/**
 * Generate recommendations from individual components
 *
 * @param context - Recommendation context with platform and metrics
 * @param options - Optional configuration
 * @returns Array of 3-5 recommendations
 *
 * @example
 * ```typescript
 * const recommendations = generateRecommendationsFromContext({
 *   platform: 'claude',
 *   visibilityScore: score,
 *   contentTypePerformance: performance,
 *   brandName: 'Acme Corp'
 * });
 * ```
 */
export function generateRecommendationsFromContext(
  context: RecommendationContext,
  options?: RecommendationEngineOptions
): Recommendation[] {
  const engine = new RecommendationEngine(options);
  return engine.generate(context);
}

/**
 * Generate recommendations for multiple platforms
 *
 * @param analyses - Array of platform analyses
 * @param options - Optional configuration
 * @returns Map of platform to recommendations
 *
 * @example
 * ```typescript
 * const allRecommendations = batchGenerateRecommendations([
 *   chatgptAnalysis,
 *   claudeAnalysis,
 *   geminiAnalysis,
 *   perplexityAnalysis
 * ], { brandName: "Acme Corp" });
 * ```
 */
export function batchGenerateRecommendations(
  analyses: PlatformAnalysis[],
  options?: RecommendationEngineOptions
): Map<AIPlatform, Recommendation[]> {
  const engine = new RecommendationEngine(options);
  return engine.generateForMultiplePlatforms(analyses);
}

/**
 * Get quick summary of recommendations
 *
 * @param recommendations - Array of recommendations
 * @returns Summary statistics
 *
 * @example
 * ```typescript
 * const summary = getRecommendationSummary(recommendations);
 * console.log(`Total: ${summary.total}, High Priority: ${summary.highPriorityCount}, Quick Wins: ${summary.quickWinsCount}`);
 * ```
 */
export function getRecommendationSummary(recommendations: Recommendation[]): {
  total: number;
  byPriority: Record<number, number>;
  byImpact: Record<string, number>;
  byDifficulty: Record<string, number>;
  highPriorityCount: number;
  quickWinsCount: number;
} {
  const engine = new RecommendationEngine();
  return engine.getSummary(recommendations);
}

/**
 * Filter recommendations by priority
 *
 * @param recommendations - Array of recommendations
 * @param maxPriority - Maximum priority level to include (1-5)
 * @returns Filtered recommendations
 *
 * @example
 * ```typescript
 * // Get only high priority recommendations (priority 1 and 2)
 * const highPriority = filterByPriority(recommendations, 2);
 * ```
 */
export function filterByPriority(
  recommendations: Recommendation[],
  maxPriority: 1 | 2 | 3 | 4 | 5
): Recommendation[] {
  return recommendations.filter((rec) => rec.priority <= maxPriority);
}

/**
 * Filter recommendations by impact level
 *
 * @param recommendations - Array of recommendations
 * @param impacts - Impact levels to include
 * @returns Filtered recommendations
 *
 * @example
 * ```typescript
 * // Get only high and medium impact recommendations
 * const impactful = filterByImpact(recommendations, ["high", "medium"]);
 * ```
 */
export function filterByImpact(
  recommendations: Recommendation[],
  impacts: Array<"high" | "medium" | "low">
): Recommendation[] {
  return recommendations.filter((rec) => impacts.includes(rec.impact));
}

/**
 * Filter recommendations by difficulty level
 *
 * @param recommendations - Array of recommendations
 * @param difficulties - Difficulty levels to include
 * @returns Filtered recommendations
 *
 * @example
 * ```typescript
 * // Get only easy and moderate difficulty recommendations
 * const achievable = filterByDifficulty(recommendations, ["easy", "moderate"]);
 * ```
 */
export function filterByDifficulty(
  recommendations: Recommendation[],
  difficulties: Array<"easy" | "moderate" | "hard">
): Recommendation[] {
  return recommendations.filter((rec) => difficulties.includes(rec.difficulty));
}

/**
 * Get quick wins (high impact + easy difficulty)
 *
 * @param recommendations - Array of recommendations
 * @returns Recommendations that are quick wins
 *
 * @example
 * ```typescript
 * const quickWins = getQuickWins(recommendations);
 * console.log(`Found ${quickWins.length} quick win opportunities`);
 * ```
 */
export function getQuickWins(recommendations: Recommendation[]): Recommendation[] {
  return recommendations.filter(
    (rec) => rec.impact === "high" && rec.difficulty === "easy"
  );
}

/**
 * Sort recommendations by priority and impact
 *
 * @param recommendations - Array of recommendations
 * @returns Sorted recommendations (priority first, then impact)
 *
 * @example
 * ```typescript
 * const sorted = sortRecommendations(recommendations);
 * // First recommendation will be highest priority + highest impact
 * ```
 */
export function sortRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  const impactScore = { high: 3, medium: 2, low: 1 };

  return [...recommendations].sort((a, b) => {
    // First sort by priority (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then sort by impact (higher impact first)
    return impactScore[b.impact] - impactScore[a.impact];
  });
}

// ============================================================================
// Enriched Recommendation Functions
// ============================================================================

/**
 * Generate enriched recommendations with full implementation steps
 *
 * @param analysis - Complete platform analysis
 * @param brandData - Brand data for schema generation
 * @param options - Engine options
 * @returns Array of enriched recommendations with steps
 *
 * @example
 * ```typescript
 * const enrichedRecs = generateEnrichedRecommendations(
 *   platformAnalysis,
 *   { name: "Acme Corp", url: "https://acme.com" },
 *   { maxRecommendations: 5 }
 * );
 * ```
 */
export function generateEnrichedRecommendations(
  analysis: PlatformAnalysis,
  brandData?: BrandSchemaData,
  options?: RecommendationEngineOptions
): EnrichedRecommendation[] {
  const engine = new RecommendationEngine(options);
  return engine.generateEnrichedRecommendations(analysis, brandData);
}

/**
 * Generate enriched recommendations for multiple platforms
 *
 * @param analyses - Array of platform analyses
 * @param brandData - Brand data for schema generation
 * @param options - Engine options
 * @returns Map of platform to enriched recommendations
 */
export function batchGenerateEnrichedRecommendations(
  analyses: PlatformAnalysis[],
  brandData?: BrandSchemaData,
  options?: RecommendationEngineOptions
): Map<AIPlatform, EnrichedRecommendation[]> {
  const engine = new RecommendationEngine(options);
  return engine.generateEnrichedForMultiplePlatforms(analyses, brandData);
}

// Re-export EnrichedRecommendation type for consumers
export type { EnrichedRecommendation };

// Re-export step generator utilities for direct use
export {
  generateStepsForTemplate,
  getPlatformRelevance,
  getEstimatedTimeForTemplate,
  getExpectedScoreImpact,
  generateSchemaForTemplate,
  enrichRecommendation,
  enrichRecommendations,
};
