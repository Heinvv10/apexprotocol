/**
 * Visibility Scorer for AI Platform Responses
 *
 * Calculates brand visibility scores (0-100) based on mention frequency,
 * citation quality, and prominence in AI platform responses.
 */

import type {
  VisibilityScore,
  Citation,
  ParsedCitation,
  PlatformResponse,
} from "./types";

/**
 * Configuration for visibility scoring
 */
export interface VisibilityScorerOptions {
  /** Brand name to identify mentions */
  brandName?: string;
  /** Brand-related keywords for mention detection */
  brandKeywords?: string[];
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Visibility Scorer Class
 *
 * Analyzes platform responses to calculate comprehensive visibility scores.
 * Scores are based on three key factors:
 * - Mention frequency (0-40 points): How often the brand is mentioned
 * - Citation quality (0-30 points): Quality and relevance of citations
 * - Prominence (0-30 points): Position and emphasis of brand mentions
 */
export class VisibilityScorer {
  private options: Required<VisibilityScorerOptions>;

  constructor(options: VisibilityScorerOptions = {}) {
    this.options = {
      brandName: options.brandName || "",
      brandKeywords: options.brandKeywords || [],
      debug: options.debug || false,
    };
  }

  /**
   * Calculate visibility score for a platform response
   *
   * @param content - The response text from an AI platform
   * @param citations - Citations extracted from the response
   * @param platform - The platform that generated the response (optional, for logging)
   * @returns VisibilityScore with total score, breakdown, and metrics
   *
   * @example
   * ```typescript
   * const scorer = new VisibilityScorer({ brandName: "Acme Corp" });
   * const score = scorer.calculate(responseContent, citations);
   * console.log(`Visibility Score: ${score.total}/100`);
   * ```
   */
  calculate(
    content: string,
    citations: Citation[],
    platform?: string
  ): VisibilityScore {
    // Count brand mentions in content
    const totalMentions = this.countBrandMentions(content);

    // Calculate average relevance score from citations
    const avgRelevanceScore = this.calculateAverageRelevance(citations);

    // Find position of first brand mention
    const firstMentionPosition = this.findFirstMentionPosition(content);

    // Calculate total citations count
    const totalCitations = citations.length;

    // Calculate score components
    const mentionCountScore = this.scoreMentionCount(totalMentions);
    const citationQualityScore = this.scoreCitationQuality(
      totalCitations,
      avgRelevanceScore
    );
    const prominenceScore = this.scoreProminence(
      firstMentionPosition,
      content.length,
      totalMentions
    );

    // Calculate total score
    const totalScore = Math.round(
      mentionCountScore + citationQualityScore + prominenceScore
    );

    if (this.options.debug) {
      console.log(
        `[VisibilityScorer${platform ? ` - ${platform}` : ""}] Score: ${totalScore}/100 (Mentions: ${mentionCountScore}, Quality: ${citationQualityScore}, Prominence: ${prominenceScore})`
      );
    }

    return {
      total: totalScore,
      breakdown: {
        mentionCount: Math.round(mentionCountScore),
        citationQuality: Math.round(citationQualityScore),
        prominence: Math.round(prominenceScore),
      },
      metrics: {
        totalMentions,
        totalCitations,
        avgRelevanceScore,
        firstMentionPosition,
      },
    };
  }

  /**
   * Calculate visibility score from a PlatformResponse
   *
   * @param response - Complete platform response with content and citations
   * @returns VisibilityScore with total score, breakdown, and metrics
   */
  calculateFromResponse(response: PlatformResponse): VisibilityScore {
    return this.calculate(response.content, response.citations, response.platform);
  }

  /**
   * Count brand mentions in content
   *
   * Counts both exact brand name matches and keyword matches.
   * Case-insensitive matching is used for accuracy.
   *
   * @param content - The response text to analyze
   * @returns Number of brand mentions found
   */
  private countBrandMentions(content: string): number {
    if (!content) return 0;

    let count = 0;
    const lowerContent = content.toLowerCase();

    // Count exact brand name mentions
    if (this.options.brandName) {
      const brandPattern = new RegExp(
        `\\b${this.escapeRegex(this.options.brandName)}\\b`,
        "gi"
      );
      const matches = content.match(brandPattern);
      count += matches ? matches.length : 0;
    }

    // Count keyword mentions (each unique keyword counted once per occurrence)
    if (this.options.brandKeywords.length > 0) {
      for (const keyword of this.options.brandKeywords) {
        const keywordPattern = new RegExp(
          `\\b${this.escapeRegex(keyword)}\\b`,
          "gi"
        );
        const matches = content.match(keywordPattern);
        if (matches) {
          // Weight keyword mentions less than brand name mentions
          count += matches.length * 0.5;
        }
      }
    }

    return Math.round(count);
  }

  /**
   * Calculate average relevance score from citations
   *
   * @param citations - Array of citations with relevance scores
   * @returns Average relevance score (0-100), or 0 if no citations
   */
  private calculateAverageRelevance(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const totalRelevance = citations.reduce((sum, citation) => {
      return sum + (citation.relevanceScore || 0);
    }, 0);

    return Math.round(totalRelevance / citations.length);
  }

  /**
   * Find position of first brand mention in content
   *
   * @param content - The response text to analyze
   * @returns Character position of first mention, or -1 if not found
   */
  private findFirstMentionPosition(content: string): number {
    if (!content || !this.options.brandName) return -1;

    const lowerContent = content.toLowerCase();
    const lowerBrand = this.options.brandName.toLowerCase();

    // Find first occurrence of brand name
    const brandIndex = lowerContent.indexOf(lowerBrand);

    // Check keywords if brand name not found
    if (brandIndex === -1 && this.options.brandKeywords.length > 0) {
      let firstKeywordIndex = -1;
      for (const keyword of this.options.brandKeywords) {
        const keywordIndex = lowerContent.indexOf(keyword.toLowerCase());
        if (
          keywordIndex !== -1 &&
          (firstKeywordIndex === -1 || keywordIndex < firstKeywordIndex)
        ) {
          firstKeywordIndex = keywordIndex;
        }
      }
      return firstKeywordIndex;
    }

    return brandIndex;
  }

  /**
   * Score based on mention count (0-40 points)
   *
   * Scoring scale:
   * - 0 mentions: 0 points
   * - 1-2 mentions: 10-20 points
   * - 3-5 mentions: 25-35 points
   * - 6+ mentions: 40 points (maximum)
   *
   * @param mentionCount - Number of brand mentions
   * @returns Score from 0-40
   */
  private scoreMentionCount(mentionCount: number): number {
    if (mentionCount === 0) return 0;
    if (mentionCount === 1) return 10;
    if (mentionCount === 2) return 20;
    if (mentionCount === 3) return 25;
    if (mentionCount === 4) return 30;
    if (mentionCount === 5) return 35;
    return 40; // 6+ mentions gets maximum score
  }

  /**
   * Score based on citation quality (0-30 points)
   *
   * Considers both citation count and average relevance score.
   * High-quality citations (high relevance) are weighted more heavily.
   *
   * Scoring scale:
   * - No citations: 0 points
   * - Low relevance (<50): Up to 15 points based on count
   * - Medium relevance (50-79): Up to 22 points based on count
   * - High relevance (80+): Up to 30 points based on count
   *
   * @param citationCount - Number of citations
   * @param avgRelevance - Average relevance score (0-100)
   * @returns Score from 0-30
   */
  private scoreCitationQuality(
    citationCount: number,
    avgRelevance: number
  ): number {
    if (citationCount === 0) return 0;

    // Base score from citation count (0-15 points)
    let countScore = Math.min(citationCount * 3, 15);

    // Relevance multiplier based on average relevance score
    let relevanceMultiplier = 1.0;
    if (avgRelevance >= 80) {
      relevanceMultiplier = 2.0; // High relevance: double the score
    } else if (avgRelevance >= 50) {
      relevanceMultiplier = 1.5; // Medium relevance: 1.5x score
    } else {
      relevanceMultiplier = 1.0; // Low relevance: no multiplier
    }

    const qualityScore = countScore * relevanceMultiplier;

    // Cap at 30 points
    return Math.min(qualityScore, 30);
  }

  /**
   * Score based on prominence (0-30 points)
   *
   * Prominence is determined by:
   * - Position of first mention (earlier is better)
   * - Frequency of mentions throughout the response
   * - Distribution of mentions (spread vs. clustered)
   *
   * Scoring scale:
   * - No mentions: 0 points
   * - First mention in first 10%: +15 points
   * - First mention in first 25%: +10 points
   * - First mention in first 50%: +5 points
   * - First mention after 50%: +2 points
   * - High mention frequency (5+): +15 points
   * - Medium frequency (3-4): +10 points
   * - Low frequency (1-2): +5 points
   *
   * @param firstMentionPosition - Character position of first mention
   * @param contentLength - Total length of content
   * @param mentionCount - Total number of mentions
   * @returns Score from 0-30
   */
  private scoreProminence(
    firstMentionPosition: number,
    contentLength: number,
    mentionCount: number
  ): number {
    let score = 0;

    // No mentions = no prominence score
    if (mentionCount === 0 || firstMentionPosition === -1) return 0;

    // Score based on position of first mention (0-15 points)
    const positionRatio = firstMentionPosition / contentLength;
    if (positionRatio <= 0.1) {
      // First 10% of content
      score += 15;
    } else if (positionRatio <= 0.25) {
      // First 25% of content
      score += 10;
    } else if (positionRatio <= 0.5) {
      // First 50% of content
      score += 5;
    } else {
      // After 50% of content
      score += 2;
    }

    // Score based on mention frequency (0-15 points)
    if (mentionCount >= 5) {
      score += 15; // High frequency
    } else if (mentionCount >= 3) {
      score += 10; // Medium frequency
    } else {
      score += 5; // Low frequency (1-2 mentions)
    }

    // Cap at 30 points
    return Math.min(score, 30);
  }

  /**
   * Escape special regex characters in a string
   *
   * @param str - String to escape
   * @returns Escaped string safe for use in RegExp
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Get visibility tier based on score
   *
   * @param score - Visibility score (0-100)
   * @returns Tier name
   */
  static getVisibilityTier(
    score: number
  ): "excellent" | "good" | "fair" | "poor" | "none" {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "fair";
    if (score >= 20) return "poor";
    return "none";
  }

  /**
   * Compare two visibility scores
   *
   * @param score1 - First visibility score
   * @param score2 - Second visibility score
   * @returns Comparison result with difference and winner
   */
  static compareScores(
    score1: VisibilityScore,
    score2: VisibilityScore
  ): {
    difference: number;
    winner: "score1" | "score2" | "tie";
    breakdown: {
      mentionCountDiff: number;
      citationQualityDiff: number;
      prominenceDiff: number;
    };
  } {
    const difference = score1.total - score2.total;
    const winner =
      difference > 0 ? "score1" : difference < 0 ? "score2" : "tie";

    return {
      difference: Math.abs(difference),
      winner,
      breakdown: {
        mentionCountDiff:
          score1.breakdown.mentionCount - score2.breakdown.mentionCount,
        citationQualityDiff:
          score1.breakdown.citationQuality - score2.breakdown.citationQuality,
        prominenceDiff: score1.breakdown.prominence - score2.breakdown.prominence,
      },
    };
  }

  /**
   * Get insights about a visibility score
   *
   * @param score - Visibility score to analyze
   * @returns Array of insights about the score
   */
  static getScoreInsights(score: VisibilityScore): string[] {
    const insights: string[] = [];
    const tier = this.getVisibilityTier(score.total);

    // Overall tier insight
    insights.push(`Overall visibility is ${tier} (${score.total}/100)`);

    // Mention count insights
    if (score.breakdown.mentionCount < 10) {
      insights.push(
        `Low mention frequency (${score.metrics.totalMentions} mentions) - consider creating more brand-relevant content`
      );
    } else if (score.breakdown.mentionCount >= 35) {
      insights.push(
        `Excellent mention frequency (${score.metrics.totalMentions} mentions)`
      );
    }

    // Citation quality insights
    if (score.breakdown.citationQuality < 10) {
      insights.push(
        "Few or low-quality citations - focus on creating authoritative, citable content"
      );
    } else if (score.breakdown.citationQuality >= 25) {
      insights.push(
        `High-quality citations (avg relevance: ${score.metrics.avgRelevanceScore})`
      );
    }

    // Prominence insights
    if (score.breakdown.prominence < 10) {
      insights.push(
        "Brand appears late in responses - optimize for earlier visibility"
      );
    } else if (score.breakdown.prominence >= 25) {
      insights.push("Brand appears prominently in responses");
    }

    // No visibility insight
    if (score.total === 0) {
      insights.push("No brand visibility detected in this response");
    }

    return insights;
  }
}

/**
 * Calculate visibility score from response content and citations (convenience function)
 *
 * @param content - The response text to analyze
 * @param citations - Citations extracted from the response
 * @param options - Scorer options
 * @returns VisibilityScore with total score, breakdown, and metrics
 *
 * @example
 * ```typescript
 * const score = calculateVisibilityScore(
 *   responseContent,
 *   citations,
 *   { brandName: "Acme Corp" }
 * );
 * console.log(`Score: ${score.total}/100`);
 * ```
 */
export function calculateVisibilityScore(
  content: string,
  citations: Citation[],
  options?: VisibilityScorerOptions
): VisibilityScore {
  const scorer = new VisibilityScorer(options);
  return scorer.calculate(content, citations);
}

/**
 * Calculate visibility score from a PlatformResponse (convenience function)
 *
 * @param response - Complete platform response
 * @param options - Scorer options
 * @returns VisibilityScore with total score, breakdown, and metrics
 *
 * @example
 * ```typescript
 * const response = await adapter.analyze(query, brandContext);
 * const score = calculateVisibilityScoreFromResponse(
 *   response,
 *   { brandName: "Acme Corp" }
 * );
 * ```
 */
export function calculateVisibilityScoreFromResponse(
  response: PlatformResponse,
  options?: VisibilityScorerOptions
): VisibilityScore {
  const scorer = new VisibilityScorer(options);
  return scorer.calculateFromResponse(response);
}

/**
 * Batch calculate visibility scores for multiple platforms
 *
 * @param responses - Array of platform responses
 * @param options - Scorer options
 * @returns Map of platform to visibility score
 *
 * @example
 * ```typescript
 * const responses = await Promise.all([
 *   chatgptAdapter.analyze(query, brandContext),
 *   claudeAdapter.analyze(query, brandContext),
 * ]);
 * const scores = batchCalculateScores(responses, { brandName: "Acme Corp" });
 * ```
 */
export function batchCalculateScores(
  responses: PlatformResponse[],
  options?: VisibilityScorerOptions
): Map<string, VisibilityScore> {
  const scorer = new VisibilityScorer(options);
  const scores = new Map<string, VisibilityScore>();

  for (const response of responses) {
    scores.set(response.platform, scorer.calculateFromResponse(response));
  }

  return scores;
}
