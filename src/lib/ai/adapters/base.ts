/**
 * AI Platform Adapter Base Types
 * Defines common interfaces for AI platform adapters (ChatGPT, Claude, Gemini, Perplexity)
 */

/**
 * Supported AI platforms for brand analysis
 */
export type AIPlatform = "chatgpt" | "claude" | "gemini" | "perplexity";

/**
 * Citation type - how the platform referenced the brand
 */
export type CitationType = "direct_quote" | "paraphrase" | "link" | "reference";

/**
 * Citation extracted from a platform response
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
  contentType?: string;
  /** Relevance score (0-100) */
  relevanceScore?: number;
}

/**
 * Normalized response from any AI platform
 */
export interface PlatformResponse {
  /** Platform that generated this response */
  platform: AIPlatform;
  /** The text content of the response */
  content: string;
  /** Citations extracted from the response */
  citations: Citation[];
  /** Platform-specific metadata (model, usage, timing, etc.) */
  metadata: Record<string, any>;
}

/**
 * Base interface that all AI platform adapters must implement
 * Provides a normalized way to query different AI platforms and analyze their responses
 */
export interface PlatformAdapter {
  /** The platform this adapter handles */
  readonly platform: AIPlatform;

  /**
   * Analyze how this platform responds to a brand-related query
   *
   * @param query - The search query or question to ask the platform
   * @param brandContext - Context about the brand to help the platform understand what to look for
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
   * console.log(`Visibility score: ${response.citations.length}`);
   * ```
   */
  analyze(query: string, brandContext: string): Promise<PlatformResponse>;
}

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
}
