import { logger } from "@/lib/logger";
/**
 * AI Platform Algorithm Insights - Core Type Definitions
 *
 * This file contains all TypeScript types and interfaces used across the AI Platform Insights feature.
 * These types ensure type safety and consistency across adapters, parsers, scorers, and the analysis engine.
 */

// ============================================================================
// Platform Types
// ============================================================================

/**
 * Supported AI platforms for brand analysis
 */
export type AIPlatform = "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "copilot";

/**
 * Platform query status
 */
export type QueryStatus = "pending" | "completed" | "failed" | "partial";

// ============================================================================
// Citation Types
// ============================================================================

/**
 * Citation type - categorizes how the platform referenced the brand
 *
 * - direct_quote: Platform directly quoted brand content
 * - paraphrase: Platform paraphrased brand content
 * - link: Platform provided a link to brand content
 * - reference: Platform mentioned brand without specific citation
 */
export type CitationType = "direct_quote" | "paraphrase" | "link" | "reference";

/**
 * Citation extracted from a platform response
 *
 * Represents a single citation or reference to brand content found in an AI platform's response.
 * Citations are used to calculate visibility scores and analyze content performance.
 */
export interface Citation {
  /** Type of citation */
  type: CitationType;

  /** The actual quoted or paraphrased text */
  text?: string;

  /** URL of the cited source */
  sourceUrl?: string;

  /** Title of the cited source */
  sourceTitle?: string;

  /** Position in the response (0-based index) */
  position?: number;

  /** Surrounding context of the citation */
  context?: string;

  /** Content type (blog_post, documentation, case_study, etc.) */
  contentType?: ContentType;

  /** Relevance score (0-100) */
  relevanceScore?: number;
}

// ============================================================================
// Content Types
// ============================================================================

/**
 * Content types that can be cited by AI platforms
 */
export type ContentType =
  | "blog_post"
  | "documentation"
  | "case_study"
  | "press_release"
  | "social_media"
  | "video"
  | "podcast"
  | "whitepaper"
  | "tutorial"
  | "faq"
  | "product_page"
  | "landing_page"
  | "unknown";

/**
 * Content type performance metrics
 *
 * Tracks how many times each content type was cited by a platform.
 * Higher numbers indicate that content type performs well on that platform.
 */
export interface ContentTypePerformance {
  blog_post?: number;
  documentation?: number;
  case_study?: number;
  press_release?: number;
  social_media?: number;
  video?: number;
  podcast?: number;
  whitepaper?: number;
  tutorial?: number;
  faq?: number;
  product_page?: number;
  landing_page?: number;
  [key: string]: number | undefined;
}

// ============================================================================
// Platform Response Types
// ============================================================================

/**
 * Normalized response from any AI platform
 *
 * All platform adapters return this standardized format, allowing the analysis engine
 * to process responses uniformly regardless of which platform generated them.
 */
export interface PlatformResponse {
  /** Platform that generated this response */
  platform: AIPlatform;

  /** The text content of the response */
  content: string;

  /** Citations extracted from the response */
  citations: Citation[];

  /** Platform-specific metadata (model, usage, timing, etc.) */
  metadata: PlatformMetadata;
}

/**
 * Metadata about a platform response
 */
export interface PlatformMetadata {
  /** Model name/version used */
  model?: string;

  /** Model version */
  modelVersion?: string;

  /** Temperature setting used */
  temperature?: number;

  /** Number of tokens used (input + output) */
  tokensUsed?: number;

  /** Response time in milliseconds */
  responseTime?: number;

  /** Search results (Perplexity-specific) */
  searchResults?: SearchResult[];

  /** Raw response from the platform API */
  rawResponse?: any;

  /** Additional platform-specific metadata */
  [key: string]: any;
}

/**
 * Search result from Perplexity API
 */
export interface SearchResult {
  url: string;
  title?: string;
  snippet?: string;
}

// ============================================================================
// Analysis Types
// ============================================================================

/**
 * Visibility score breakdown
 *
 * Provides detailed scoring information for brand visibility on a platform.
 * Total score is 0-100, with higher scores indicating better visibility.
 */
export interface VisibilityScore {
  /** Total visibility score (0-100) */
  total: number;

  /** Score breakdown by component */
  breakdown: {
    /** Score based on number of mentions (0-40) */
    mentionCount: number;

    /** Score based on citation quality (0-30) */
    citationQuality: number;

    /** Score based on prominence in response (0-30) */
    prominence: number;
  };

  /** Raw metrics used for scoring */
  metrics: {
    /** Total number of brand mentions */
    totalMentions: number;

    /** Number of citations */
    totalCitations: number;

    /** Average citation relevance score */
    avgRelevanceScore: number;

    /** Position of first mention (0-based) */
    firstMentionPosition: number;
  };
}

/**
 * Recommendation for improving platform visibility
 */
export interface Recommendation {
  /** Unique identifier for the recommendation type */
  id: string;

  /** Title of the recommendation */
  title: string;

  /** Detailed description of the recommendation */
  description: string;

  /** Priority level (1-5, with 1 being highest) */
  priority: 1 | 2 | 3 | 4 | 5;

  /** Expected impact (high, medium, low) */
  impact: "high" | "medium" | "low";

  /** Difficulty to implement (easy, moderate, hard) */
  difficulty: "easy" | "moderate" | "hard";

  /** Specific action items */
  actionItems?: string[];

  /** Examples or templates */
  examples?: string[];
}

/**
 * Platform-specific analysis result
 *
 * Contains all analysis data for a single platform: visibility scores,
 * citations, content performance, and recommendations.
 */
export interface PlatformAnalysis {
  /** Platform that was analyzed */
  platform: AIPlatform;

  /** The original query */
  query: string;

  /** Brand context provided */
  brandContext: string;

  /** Raw response from the platform */
  response: PlatformResponse;

  /** Visibility score analysis */
  visibilityScore: VisibilityScore;

  /** Content type performance */
  contentTypePerformance: ContentTypePerformance;

  /** Platform-specific recommendations */
  recommendations: Recommendation[];

  /** Timestamp of analysis */
  analyzedAt: Date;

  /** Analysis status */
  status: "success" | "failed" | "partial";

  /** Error message if analysis failed */
  error?: string;
}

/**
 * Complete multi-platform analysis result
 *
 * Aggregates analysis results from all platforms, providing a comprehensive
 * view of brand visibility across the AI ecosystem.
 */
export interface MultiPlatformAnalysis {
  /** Unique identifier for this analysis */
  id: string;

  /** User who requested the analysis */
  userId: string;

  /** Brand being analyzed */
  brandId: string;

  /** The query used for analysis */
  query: string;

  /** Brand context provided */
  brandContext: string;

  /** Analysis results per platform */
  platforms: {
    chatgpt?: PlatformAnalysis;
    claude?: PlatformAnalysis;
    gemini?: PlatformAnalysis;
    perplexity?: PlatformAnalysis;
    grok?: PlatformAnalysis;
    deepseek?: PlatformAnalysis;
    copilot?: PlatformAnalysis;
  };

  /** Aggregate statistics */
  aggregate: {
    /** Average visibility score across all platforms */
    avgVisibilityScore: number;

    /** Total number of citations across all platforms */
    totalCitations: number;

    /** Total number of mentions across all platforms */
    totalMentions: number;

    /** Best performing platform */
    bestPlatform?: AIPlatform;

    /** Worst performing platform */
    worstPlatform?: AIPlatform;
  };

  /** Timestamp when analysis was created */
  createdAt: Date;

  /** Timestamp when analysis completed */
  completedAt?: Date;

  /** Overall analysis status */
  status: QueryStatus;
}

// ============================================================================
// Adapter Types
// ============================================================================

/**
 * Options for customizing platform analysis behavior
 */
export interface AnalysisOptions {
  /** Model to use (platform-specific) */
  model?: string;

  /** Temperature for response generation (0-1) */
  temperature?: number;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Whether to extract citations (default: true) */
  extractCitations?: boolean;

  /** Whether to calculate visibility scores (default: true) */
  calculateVisibility?: boolean;
}

/**
 * Base interface that all AI platform adapters must implement
 *
 * Provides a normalized way to query different AI platforms and analyze their responses.
 */
export interface PlatformAdapter {
  /** The platform this adapter handles */
  readonly platform: AIPlatform;

  /**
   * Analyze how this platform responds to a brand-related query
   *
   * @param query - The search query or question to ask the platform
   * @param brandContext - Context about the brand to help the platform understand what to look for
   * @param options - Optional configuration for the analysis
   * @returns Promise resolving to normalized platform response with citations
   *
   * @throws Error if API key is missing or API call fails
   *
   * @example
   * ```typescript
   * const adapter = new ChatGPTAdapter();
   * const response = await adapter.analyze(
   *   "What are the best project management tools?",
   *   "Acme Corp is a project management software company"
   * );
   * logger.info(`Citations found: ${response.citations.length}`);
   * ```
   */
  analyze(
    query: string,
    brandContext: string,
    options?: AnalysisOptions
  ): Promise<PlatformResponse>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Platform API error categories
 */
export type PlatformErrorType =
  | "authentication" // Invalid or missing API key
  | "rate_limit" // Rate limit exceeded
  | "timeout" // Request timed out
  | "invalid_request" // Malformed request
  | "server_error" // Platform API server error
  | "network_error" // Network connectivity issue
  | "unknown"; // Unknown error

/**
 * Platform API error
 */
export interface PlatformError extends Error {
  /** Platform that generated the error */
  platform: AIPlatform;

  /** Error type category */
  type: PlatformErrorType;

  /** HTTP status code (if applicable) */
  statusCode?: number;

  /** Whether the error is retryable */
  retryable: boolean;

  /** Suggested retry delay in milliseconds */
  retryAfter?: number;
}

// ============================================================================
// Parser Types
// ============================================================================

/**
 * Citation pattern for parsing
 */
export interface CitationPattern {
  /** Regular expression to match citations */
  pattern: RegExp;

  /** Citation type this pattern matches */
  type: CitationType;

  /** Priority for pattern matching (higher = checked first) */
  priority: number;
}

/**
 * Parsed citation result
 */
export interface ParsedCitation extends Citation {
  /** Raw matched text */
  rawMatch: string;

  /** Confidence score (0-1) */
  confidence: number;
}
