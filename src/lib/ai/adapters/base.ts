/**
 * AI Platform Adapter Base Types
 * Re-exports core types from the main types module for consistency
 */

import type {
  AIPlatform,
  CitationType,
  Citation,
  PlatformResponse,
  ContentType,
  ContentTypePerformance,
  PlatformMetadata,
  SearchResult,
  VisibilityScore,
  Recommendation,
  PlatformAnalysis,
  MultiPlatformAnalysis,
  QueryStatus,
  AnalysisOptions as BaseAnalysisOptions,
  PlatformAdapter as BasePlatformAdapter,
  PlatformErrorType,
  PlatformError,
  CitationPattern,
  ParsedCitation,
} from '../types';

// Re-export for backward compatibility
export type {
  AIPlatform,
  CitationType,
  Citation,
  PlatformResponse,
  ContentType,
  ContentTypePerformance,
  PlatformMetadata,
  SearchResult,
  VisibilityScore,
  Recommendation,
  PlatformAnalysis,
  MultiPlatformAnalysis,
  QueryStatus,
  BaseAnalysisOptions,
  BasePlatformAdapter,
  PlatformErrorType,
  PlatformError,
  CitationPattern,
  ParsedCitation,
};

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
   * console.log(`Visibility score: ${response.citations.length}`);
   * ```
   */
  analyze(query: string, brandContext: string, options?: AnalysisOptions): Promise<PlatformResponse>;
}
