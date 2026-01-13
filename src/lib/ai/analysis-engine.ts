/**
 * Analysis Engine for AI Platform Algorithm Insights
 *
 * Main orchestrator that coordinates platform queries, citation parsing,
 * visibility scoring, content analysis, and recommendation generation across
 * all AI platforms (ChatGPT, Claude, Gemini, Perplexity).
 *
 * The engine provides a unified interface for analyzing brand visibility
 * across the AI ecosystem and generates actionable recommendations for
 * improving platform-specific performance.
 */

import { createId } from "@paralleldrive/cuid2";
import type {
  AIPlatform,
  PlatformResponse,
  PlatformAnalysis,
  MultiPlatformAnalysis,
  VisibilityScore,
  ContentTypePerformance,
  Recommendation,
  AnalysisOptions,
  QueryStatus,
} from "./types";
import {
  createAllPlatformAdapters,
  createPlatformAdapter,
  getSupportedPlatforms,
} from "./adapters";
import { CitationParser } from "./citation-parser";
import { VisibilityScorer } from "./visibility-scorer";
import { ContentTypeAnalyzer } from "./content-type-analyzer";
import { RecommendationEngine } from "./recommendation-engine";

/**
 * Configuration for the analysis engine
 */
export interface AnalysisEngineOptions {
  /** Brand name for visibility scoring and personalization */
  brandName?: string;
  /** Brand-related keywords for analysis */
  brandKeywords?: string[];
  /** Platforms to analyze (default: all platforms) */
  platforms?: AIPlatform[];
  /** Timeout for each platform query in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of recommendations to generate per platform (default: 3-5) */
  recommendationCount?: { min: number; max: number };
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Request parameters for analysis
 */
export interface AnalysisRequest {
  /** User ID requesting the analysis */
  userId: string;
  /** Brand ID being analyzed */
  brandId: string;
  /** Query to ask AI platforms */
  query: string;
  /** Context about the brand */
  brandContext: string;
  /** Optional analysis options */
  options?: AnalysisOptions;
}

/**
 * Single platform analysis result with error handling
 */
interface PlatformAnalysisResult {
  platform: AIPlatform;
  analysis: PlatformAnalysis | null;
  error?: string;
}

/**
 * Analysis Engine Class
 *
 * Orchestrates the complete analysis flow:
 * 1. Query all AI platforms in parallel
 * 2. Parse citations from responses
 * 3. Calculate visibility scores
 * 4. Analyze content type performance
 * 5. Generate platform-specific recommendations
 * 6. Aggregate results across platforms
 */
export class AnalysisEngine {
  private options: Required<AnalysisEngineOptions>;
  private citationParser: CitationParser;
  private visibilityScorer: VisibilityScorer;
  private contentAnalyzer: ContentTypeAnalyzer;
  private recommendationEngine: RecommendationEngine;

  constructor(options: AnalysisEngineOptions = {}) {
    this.options = {
      brandName: options.brandName || "",
      brandKeywords: options.brandKeywords || [],
      platforms: options.platforms || getSupportedPlatforms(),
      timeout: options.timeout || 30000,
      recommendationCount: options.recommendationCount || { min: 3, max: 5 },
      debug: options.debug || false,
    };

    // Initialize analysis components
    this.citationParser = new CitationParser({
      brandName: this.options.brandName,
      brandKeywords: this.options.brandKeywords,
      debug: this.options.debug,
    });

    this.visibilityScorer = new VisibilityScorer({
      brandName: this.options.brandName,
      brandKeywords: this.options.brandKeywords,
      debug: this.options.debug,
    });

    this.contentAnalyzer = new ContentTypeAnalyzer({
      debug: this.options.debug,
    });

    this.recommendationEngine = new RecommendationEngine({
      minRecommendations: this.options.recommendationCount.min,
      maxRecommendations: this.options.recommendationCount.max,
      brandName: this.options.brandName,
      debug: this.options.debug,
    });
  }

  /**
   * Analyze brand visibility across all AI platforms
   *
   * @param request - Analysis request with query and brand context
   * @returns Promise resolving to complete multi-platform analysis
   *
   * @example
   * ```typescript
   * const engine = new AnalysisEngine({ brandName: "Acme Corp" });
   * const analysis = await engine.analyze({
   *   userId: "user_123",
   *   brandId: "brand_456",
   *   query: "What are the best project management tools?",
   *   brandContext: "Acme Corp is a project management software company known for innovative features"
   * });
   * console.log(`Average visibility: ${analysis.aggregate.avgVisibilityScore}/100`);
   * console.log(`Best platform: ${analysis.aggregate.bestPlatform}`);
   * ```
   */
  async analyze(request: AnalysisRequest): Promise<MultiPlatformAnalysis> {
    const startTime = Date.now();

    if (this.options.debug) {
      console.log(
        `[AnalysisEngine] Starting multi-platform analysis for query: "${request.query}"`
      );
    }

    // Create multi-platform analysis container
    const analysis: MultiPlatformAnalysis = {
      id: createId(),
      userId: request.userId,
      brandId: request.brandId,
      query: request.query,
      brandContext: request.brandContext,
      platforms: {},
      aggregate: {
        avgVisibilityScore: 0,
        totalCitations: 0,
        totalMentions: 0,
      },
      createdAt: new Date(),
      status: "pending",
    };

    try {
      // Query all platforms in parallel (per spec requirement)
      const platformResults = await this.queryAllPlatforms(
        request.query,
        request.brandContext,
        request.options
      );

      // Process each platform result
      for (const result of platformResults) {
        if (result.analysis) {
          analysis.platforms[result.platform] = result.analysis;
        } else if (this.options.debug && result.error) {
          console.error(
            `[AnalysisEngine] Platform ${result.platform} failed: ${result.error}`
          );
        }
      }

      // Calculate aggregate statistics
      analysis.aggregate = this.calculateAggregateStats(analysis.platforms);

      // Determine overall status
      const successCount = Object.keys(analysis.platforms).length;
      if (successCount === 0) {
        analysis.status = "failed";
      } else if (successCount < this.options.platforms.length) {
        analysis.status = "partial";
      } else {
        analysis.status = "completed";
      }

      analysis.completedAt = new Date();

      if (this.options.debug) {
        const duration = Date.now() - startTime;
        console.log(
          `[AnalysisEngine] Analysis completed in ${duration}ms - Status: ${analysis.status}, Platforms: ${successCount}/${this.options.platforms.length}`
        );
      }

      return analysis;
    } catch (error) {
      // Handle catastrophic failures
      analysis.status = "failed";
      analysis.completedAt = new Date();

      if (this.options.debug) {
        console.error(`[AnalysisEngine] Analysis failed:`, error);
      }

      throw new Error(
        `Multi-platform analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Analyze brand visibility on a single platform
   *
   * @param platform - The platform to analyze
   * @param query - Query to ask the platform
   * @param brandContext - Context about the brand
   * @param options - Optional analysis options
   * @returns Promise resolving to platform analysis
   *
   * @example
   * ```typescript
   * const engine = new AnalysisEngine({ brandName: "Acme Corp" });
   * const analysis = await engine.analyzePlatform(
   *   "chatgpt",
   *   "What are the best project management tools?",
   *   "Acme Corp is a project management software company"
   * );
   * console.log(`ChatGPT visibility: ${analysis.visibilityScore.total}/100`);
   * ```
   */
  async analyzePlatform(
    platform: AIPlatform,
    query: string,
    brandContext: string,
    options?: AnalysisOptions
  ): Promise<PlatformAnalysis> {
    const startTime = Date.now();

    if (this.options.debug) {
      console.log(`[AnalysisEngine] Analyzing platform: ${platform}`);
    }

    try {
      // Get platform adapter
      const adapter = createPlatformAdapter(platform);

      // Query the platform
      const response = await this.queryPlatformWithTimeout(
        adapter.analyze(query, brandContext, options),
        platform
      );

      // Analyze the response
      const analysis = this.analyzePlatformResponse(
        platform,
        query,
        brandContext,
        response
      );

      if (this.options.debug) {
        const duration = Date.now() - startTime;
        console.log(
          `[AnalysisEngine] Platform ${platform} analyzed in ${duration}ms - Score: ${analysis.visibilityScore.total}/100`
        );
      }

      return analysis;
    } catch (error) {
      if (this.options.debug) {
        console.error(
          `[AnalysisEngine] Platform ${platform} analysis failed:`,
          error
        );
      }

      // Return failed analysis
      return {
        platform,
        query,
        brandContext,
        response: {
          platform,
          content: "",
          citations: [],
          metadata: {},
        },
        visibilityScore: {
          total: 0,
          breakdown: {
            mentionCount: 0,
            citationQuality: 0,
            prominence: 0,
          },
          metrics: {
            totalMentions: 0,
            totalCitations: 0,
            avgRelevanceScore: 0,
            firstMentionPosition: -1,
          },
        },
        contentTypePerformance: {},
        recommendations: [],
        analyzedAt: new Date(),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Query all platforms in parallel
   *
   * @private
   */
  private async queryAllPlatforms(
    query: string,
    brandContext: string,
    options?: AnalysisOptions
  ): Promise<PlatformAnalysisResult[]> {
    // Query all platforms in parallel using Promise.allSettled for graceful degradation
    // Note: Adapter creation is inside the async callback so individual adapter failures
    // (e.g., missing API keys) don't crash the entire analysis
    const results = await Promise.allSettled(
      this.options.platforms.map(async (platform) => {
        // Create adapter inside Promise.allSettled so failures are handled gracefully
        const adapter = createPlatformAdapter(platform);
        const response = await this.queryPlatformWithTimeout(
          adapter.analyze(query, brandContext, options),
          platform
        );
        const analysis = this.analyzePlatformResponse(
          platform,
          query,
          brandContext,
          response
        );
        return { platform, analysis };
      })
    );

    // Convert results to PlatformAnalysisResult format
    return results.map((result, index) => {
      const platform = this.options.platforms[index];

      if (result.status === "fulfilled") {
        return {
          platform,
          analysis: result.value.analysis,
        };
      } else {
        return {
          platform,
          analysis: null,
          error: result.reason?.message || "Unknown error",
        };
      }
    });
  }

  /**
   * Add timeout to platform query
   *
   * @private
   */
  private async queryPlatformWithTimeout<T>(
    promise: Promise<T>,
    platform: AIPlatform
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Platform ${platform} query timed out after ${this.options.timeout}ms`)
            ),
          this.options.timeout
        )
      ),
    ]);
  }

  /**
   * Analyze a platform response
   *
   * @private
   */
  private analyzePlatformResponse(
    platform: AIPlatform,
    query: string,
    brandContext: string,
    response: PlatformResponse
  ): PlatformAnalysis {
    // Parse citations from response
    const parsedCitations = this.citationParser.parse(
      response.content,
      platform
    );

    // Update response citations with parsed results
    response.citations = parsedCitations.map((pc) => ({
      type: pc.type,
      text: pc.text,
      sourceUrl: pc.sourceUrl,
      sourceTitle: pc.sourceTitle,
      position: pc.position,
      context: pc.context,
      contentType: pc.contentType,
      relevanceScore: pc.relevanceScore,
    }));

    // Calculate visibility score
    const visibilityScore = this.visibilityScorer.calculate(
      response.content,
      response.citations,
      platform
    );

    // Analyze content type performance
    const contentAnalysisResult = this.contentAnalyzer.analyzeFromResponse(
      response
    );
    const contentTypePerformance = contentAnalysisResult.performance;

    // Generate recommendations
    const recommendations = this.recommendationEngine.generate({
      platform,
      visibilityScore,
      contentTypePerformance,
      brandName: this.options.brandName,
    });

    return {
      platform,
      query,
      brandContext,
      response,
      visibilityScore,
      contentTypePerformance,
      recommendations,
      analyzedAt: new Date(),
      status: "success",
    };
  }

  /**
   * Calculate aggregate statistics across all platforms
   *
   * @private
   */
  private calculateAggregateStats(platforms: {
    chatgpt?: PlatformAnalysis;
    claude?: PlatformAnalysis;
    gemini?: PlatformAnalysis;
    perplexity?: PlatformAnalysis;
  }): MultiPlatformAnalysis["aggregate"] {
    const platformAnalyses = Object.values(platforms).filter(
      (p): p is PlatformAnalysis => p !== undefined && p.status === "success"
    );

    if (platformAnalyses.length === 0) {
      return {
        avgVisibilityScore: 0,
        totalCitations: 0,
        totalMentions: 0,
      };
    }

    // Calculate totals
    let totalVisibilityScore = 0;
    let totalCitations = 0;
    let totalMentions = 0;
    let bestPlatform: AIPlatform | undefined;
    let bestScore = -1;
    let worstPlatform: AIPlatform | undefined;
    let worstScore = 101;

    for (const analysis of platformAnalyses) {
      const score = analysis.visibilityScore.total;
      totalVisibilityScore += score;
      totalCitations += analysis.visibilityScore.metrics.totalCitations;
      totalMentions += analysis.visibilityScore.metrics.totalMentions;

      // Track best and worst platforms
      if (score > bestScore) {
        bestScore = score;
        bestPlatform = analysis.platform;
      }
      if (score < worstScore) {
        worstScore = score;
        worstPlatform = analysis.platform;
      }
    }

    return {
      avgVisibilityScore: Math.round(
        totalVisibilityScore / platformAnalyses.length
      ),
      totalCitations,
      totalMentions,
      bestPlatform,
      worstPlatform,
    };
  }

  /**
   * Get configuration summary
   *
   * @returns Object with current configuration
   */
  getConfig(): AnalysisEngineOptions {
    return { ...this.options };
  }

  /**
   * Update brand name and keywords for analysis
   *
   * @param brandName - New brand name
   * @param brandKeywords - New brand keywords
   */
  updateBrandInfo(brandName: string, brandKeywords: string[] = []): void {
    this.options.brandName = brandName;
    this.options.brandKeywords = brandKeywords;

    // Reinitialize components with new brand info
    this.citationParser = new CitationParser({
      brandName,
      brandKeywords,
      debug: this.options.debug,
    });

    this.visibilityScorer = new VisibilityScorer({
      brandName,
      brandKeywords,
      debug: this.options.debug,
    });

    this.recommendationEngine = new RecommendationEngine({
      minRecommendations: this.options.recommendationCount.min,
      maxRecommendations: this.options.recommendationCount.max,
      brandName,
      debug: this.options.debug,
    });
  }
}

// ============================================================================
// Standalone Utility Functions
// ============================================================================

/**
 * Analyze brand visibility across all platforms (convenience function)
 *
 * @param request - Analysis request
 * @param options - Optional engine configuration
 * @returns Promise resolving to multi-platform analysis
 *
 * @example
 * ```typescript
 * const analysis = await analyzeAllPlatforms({
 *   userId: "user_123",
 *   brandId: "brand_456",
 *   query: "What are the best project management tools?",
 *   brandContext: "Acme Corp is a project management software company"
 * }, {
 *   brandName: "Acme Corp"
 * });
 * ```
 */
export async function analyzeAllPlatforms(
  request: AnalysisRequest,
  options?: AnalysisEngineOptions
): Promise<MultiPlatformAnalysis> {
  const engine = new AnalysisEngine(options);
  return engine.analyze(request);
}

/**
 * Analyze brand visibility on a single platform (convenience function)
 *
 * @param platform - Platform to analyze
 * @param query - Query to ask the platform
 * @param brandContext - Context about the brand
 * @param brandName - Brand name for analysis
 * @param options - Optional analysis options
 * @returns Promise resolving to platform analysis
 *
 * @example
 * ```typescript
 * const analysis = await analyzeSinglePlatform(
 *   "chatgpt",
 *   "What are the best project management tools?",
 *   "Acme Corp is a project management software company",
 *   "Acme Corp"
 * );
 * ```
 */
export async function analyzeSinglePlatform(
  platform: AIPlatform,
  query: string,
  brandContext: string,
  brandName?: string,
  options?: AnalysisOptions
): Promise<PlatformAnalysis> {
  const engine = new AnalysisEngine({ brandName });
  return engine.analyzePlatform(platform, query, brandContext, options);
}

/**
 * Get visibility comparison across platforms
 *
 * @param analysis - Multi-platform analysis result
 * @returns Array of platforms sorted by visibility score (best to worst)
 *
 * @example
 * ```typescript
 * const comparison = getVisibilityComparison(analysis);
 * console.log(`Best platform: ${comparison[0].platform} (${comparison[0].score}/100)`);
 * ```
 */
export function getVisibilityComparison(
  analysis: MultiPlatformAnalysis
): Array<{ platform: AIPlatform; score: number }> {
  return Object.entries(analysis.platforms)
    .filter(([_, p]) => p !== undefined && p.status === "success")
    .map(([platform, p]) => ({
      platform: platform as AIPlatform,
      score: p!.visibilityScore.total,
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get top recommendations across all platforms
 *
 * @param analysis - Multi-platform analysis result
 * @param limit - Maximum number of recommendations to return (default: 10)
 * @returns Array of recommendations sorted by priority and impact
 *
 * @example
 * ```typescript
 * const topRecommendations = getTopRecommendations(analysis, 5);
 * topRecommendations.forEach(rec => {
 *   console.log(`[${rec.platform}] ${rec.recommendation.title}`);
 * });
 * ```
 */
export function getTopRecommendations(
  analysis: MultiPlatformAnalysis,
  limit: number = 10
): Array<{ platform: AIPlatform; recommendation: Recommendation }> {
  const allRecommendations: Array<{
    platform: AIPlatform;
    recommendation: Recommendation;
  }> = [];

  // Collect recommendations from all platforms
  for (const [platform, platformAnalysis] of Object.entries(
    analysis.platforms
  )) {
    if (platformAnalysis && platformAnalysis.status === "success") {
      for (const recommendation of platformAnalysis.recommendations) {
        allRecommendations.push({
          platform: platform as AIPlatform,
          recommendation,
        });
      }
    }
  }

  // Sort by priority (1 is highest) then by impact
  const impactScore = { high: 3, medium: 2, low: 1 };
  allRecommendations.sort((a, b) => {
    // First sort by priority (lower number = higher priority)
    if (a.recommendation.priority !== b.recommendation.priority) {
      return a.recommendation.priority - b.recommendation.priority;
    }
    // Then sort by impact
    return (
      impactScore[b.recommendation.impact] - impactScore[a.recommendation.impact]
    );
  });

  return allRecommendations.slice(0, limit);
}

/**
 * Get analysis summary for display
 *
 * @param analysis - Multi-platform analysis result
 * @returns Human-readable summary object
 *
 * @example
 * ```typescript
 * const summary = getAnalysisSummary(analysis);
 * console.log(`Status: ${summary.status}`);
 * console.log(`Average Score: ${summary.avgScore}/100`);
 * console.log(`Best Platform: ${summary.bestPlatform}`);
 * ```
 */
export function getAnalysisSummary(analysis: MultiPlatformAnalysis): {
  id: string;
  status: QueryStatus;
  platformsAnalyzed: number;
  platformsTotal: number;
  avgScore: number;
  totalCitations: number;
  totalMentions: number;
  bestPlatform?: AIPlatform;
  worstPlatform?: AIPlatform;
  completedAt?: Date;
} {
  const platformsAnalyzed = Object.keys(analysis.platforms).length;
  const platformsTotal = getSupportedPlatforms().length;

  return {
    id: analysis.id,
    status: analysis.status,
    platformsAnalyzed,
    platformsTotal,
    avgScore: analysis.aggregate.avgVisibilityScore,
    totalCitations: analysis.aggregate.totalCitations,
    totalMentions: analysis.aggregate.totalMentions,
    bestPlatform: analysis.aggregate.bestPlatform,
    worstPlatform: analysis.aggregate.worstPlatform,
    completedAt: analysis.completedAt,
  };
}
