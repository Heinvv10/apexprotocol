/**
 * AI Platform Insights - Validation Schemas
 *
 * This file contains all Zod validation schemas for the AI Insights API endpoints.
 * These schemas ensure type-safe request/response validation across the API layer.
 *
 * @module validation
 */

import { z } from "zod";

// ============================================================================
// Platform Validation
// ============================================================================

/**
 * Valid AI platforms for analysis
 */
export const aiPlatformSchema = z.enum([
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
]);

/**
 * Array of AI platforms (for multi-platform queries)
 */
export const aiPlatformsArraySchema = z
  .array(aiPlatformSchema)
  .min(1, "At least one platform is required")
  .max(4, "Maximum of 4 platforms allowed");

/**
 * Platform validation with default to all platforms
 */
export const aiPlatformsWithDefaultSchema = z
  .array(aiPlatformSchema)
  .optional()
  .default(["chatgpt", "claude", "gemini", "perplexity"]);

// ============================================================================
// Pagination Validation
// ============================================================================

/**
 * Pagination parameters for list endpoints
 */
export const paginationParamsSchema = z.object({
  /**
   * Number of records to return (1-100)
   * @default 10
   */
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),

  /**
   * Number of records to skip
   * @default 0
   */
  offset: z
    .number()
    .int()
    .min(0, "Offset must be non-negative")
    .optional()
    .default(0),
});

/**
 * Pagination response metadata
 */
export const paginationResponseSchema = z.object({
  limit: z.number().int(),
  offset: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * POST /api/ai-insights/analyze request body
 *
 * Analyzes brand visibility across AI platforms
 */
export const analyzeRequestSchema = z.object({
  /**
   * The query text to analyze (e.g., "What is Acme Corp?")
   */
  queryText: z
    .string()
    .min(1, "Query text is required")
    .max(1000, "Query text cannot exceed 1000 characters"),

  /**
   * Optional brand context for better analysis
   */
  brandContext: z
    .string()
    .max(2000, "Brand context cannot exceed 2000 characters")
    .optional(),

  /**
   * Brand ID to associate the analysis with
   */
  brandId: z.string().min(1, "Brand ID is required"),

  /**
   * Brand name for mention detection
   */
  brandName: z.string().min(1, "Brand name is required"),

  /**
   * Optional brand keywords for improved detection
   */
  brandKeywords: z.array(z.string()).optional().default([]),

  /**
   * Platforms to analyze (defaults to all)
   */
  platforms: aiPlatformsWithDefaultSchema,
});

/**
 * GET /api/ai-insights/history query parameters
 *
 * Retrieves historical analysis results with pagination
 */
export const historyQueryParamsSchema = z.object({
  /**
   * Optional brand ID to filter results
   */
  brandId: z.string().optional(),

  /**
   * Pagination: number of records to return (1-100)
   */
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),

  /**
   * Pagination: number of records to skip
   */
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
});

/**
 * GET /api/ai-insights/[platform] path and query parameters
 *
 * Retrieves platform-specific insights with pagination
 */
export const platformQueryParamsSchema = z.object({
  /**
   * Platform name (from path parameter)
   */
  platform: aiPlatformSchema,

  /**
   * Optional brand ID to filter results
   */
  brandId: z.string().optional(),

  /**
   * Pagination: number of records to return (1-100)
   */
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),

  /**
   * Pagination: number of records to skip
   */
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Citation response schema
 */
export const citationResponseSchema = z.object({
  type: z.enum(["direct_quote", "paraphrase", "link", "reference"]),
  text: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceTitle: z.string().nullable().optional(),
  position: z.number().int().nullable().optional(),
  context: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  relevanceScore: z.number().min(0).max(100).nullable().optional(),
});

/**
 * Visibility score response schema
 */
export const visibilityScoreResponseSchema = z.object({
  total: z.number().min(0).max(100),
  breakdown: z.object({
    mentionCount: z.number().min(0).max(40),
    citationQuality: z.number().min(0).max(30),
    prominence: z.number().min(0).max(30),
  }),
  metrics: z.object({
    totalMentions: z.number().int().min(0),
    averageCitationRelevance: z.number().min(0).max(100),
    firstMentionPosition: z.number().int().min(0).nullable(),
  }),
});

/**
 * Content type performance response schema
 */
export const contentTypePerformanceResponseSchema = z.record(
  z.string(),
  z.number().int().min(0)
);

/**
 * Recommendation response schema
 */
export const recommendationResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.number().int().min(1).max(5),
  impact: z.enum(["high", "medium", "low"]),
  difficulty: z.enum(["easy", "moderate", "hard"]),
  actionItems: z.array(z.string()),
  examples: z.array(z.string()).optional(),
});

/**
 * Platform analysis response schema
 */
export const platformAnalysisResponseSchema = z.object({
  platform: aiPlatformSchema,
  status: z.enum(["pending", "completed", "failed", "partial"]),
  error: z.string().nullable().optional(),
  analysis: z
    .object({
      visibilityScore: visibilityScoreResponseSchema,
      citations: z.array(citationResponseSchema),
      contentTypePerformance: contentTypePerformanceResponseSchema,
      recommendations: z.array(recommendationResponseSchema),
    })
    .nullable()
    .optional(),
});

/**
 * Aggregate statistics response schema
 */
export const aggregateStatsResponseSchema = z.object({
  averageVisibilityScore: z.number().min(0).max(100),
  totalCitations: z.number().int().min(0),
  totalMentions: z.number().int().min(0),
  platformsAnalyzed: z.number().int().min(0),
  platformsRequested: z.number().int().min(0),
  bestPlatform: aiPlatformSchema.nullable().optional(),
  worstPlatform: aiPlatformSchema.nullable().optional(),
});

/**
 * POST /api/ai-insights/analyze response
 */
export const analyzeResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      queryId: z.string(),
      status: z.enum(["completed", "partial", "failed"]),
      analysis: z.object({
        summary: aggregateStatsResponseSchema,
        platforms: z.array(platformAnalysisResponseSchema),
      }),
    })
    .optional(),
  error: z.string().optional(),
  details: z.any().optional(),
});

/**
 * Brand summary in history responses
 */
export const brandSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  logoUrl: z.string().nullable().optional(),
});

/**
 * Query summary in history responses
 */
export const querySummarySchema = z.object({
  platformsAnalyzed: z.number().int().min(0),
  averageVisibilityScore: z.number().min(0).max(100),
  totalCitations: z.number().int().min(0),
  totalMentions: z.number().int().min(0),
});

/**
 * Platform breakdown in history responses
 */
export const platformBreakdownSchema = z.object({
  platform: aiPlatformSchema,
  visibilityScore: z.number().min(0).max(100).nullable(),
  citationCount: z.number().int().min(0).nullable(),
  mentionCount: z.number().int().min(0).nullable(),
  prominenceScore: z.number().min(0).max(30).nullable(),
  topCitations: z.array(
    z.object({
      type: z.enum(["direct_quote", "paraphrase", "link", "reference"]),
      text: z.string().nullable(),
      sourceUrl: z.string().nullable(),
      sourceTitle: z.string().nullable(),
      relevanceScore: z.number().int().min(0).max(100).nullable(),
    })
  ),
});

/**
 * History item schema
 */
export const historyItemSchema = z.object({
  id: z.string(),
  queryText: z.string(),
  brandContext: z.string().nullable(),
  platforms: z.array(aiPlatformSchema),
  status: z.enum(["pending", "completed", "failed", "partial"]),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  brand: brandSummarySchema,
  summary: querySummarySchema,
  platformBreakdown: z.array(platformBreakdownSchema),
});

/**
 * GET /api/ai-insights/history response
 */
export const historyResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      history: z.array(historyItemSchema),
      pagination: paginationResponseSchema,
    })
    .optional(),
  error: z.string().optional(),
  details: z.string().optional(),
});

/**
 * Platform-specific insight schema
 */
export const platformInsightSchema = z.object({
  id: z.string(),
  queryId: z.string(),
  platform: aiPlatformSchema,
  visibilityScore: z.number().min(0).max(100).nullable(),
  citationCount: z.number().int().min(0).nullable(),
  mentionCount: z.number().int().min(0).nullable(),
  prominenceScore: z.number().min(0).max(30).nullable(),
  contentTypePerformance: contentTypePerformanceResponseSchema.nullable(),
  recommendations: z.array(z.string()).nullable(),
  metadata: z.any().nullable(),
  createdAt: z.date(),
  query: z.object({
    id: z.string(),
    queryText: z.string(),
    brandContext: z.string().nullable(),
    platforms: z.array(aiPlatformSchema),
    status: z.enum(["pending", "completed", "failed", "partial"]),
    createdAt: z.date(),
    completedAt: z.date().nullable(),
  }),
  brand: brandSummarySchema,
  citations: z.array(citationResponseSchema),
});

/**
 * Platform-specific aggregate stats schema
 */
export const platformAggregateStatsSchema = z.object({
  averageVisibilityScore: z.number().min(0).max(100),
  totalCitations: z.number().int().min(0),
  totalMentions: z.number().int().min(0),
  totalAnalyses: z.number().int().min(0),
  averageProminenceScore: z.number().min(0).max(30),
});

/**
 * GET /api/ai-insights/[platform] response
 */
export const platformResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      platform: aiPlatformSchema,
      insights: z.array(platformInsightSchema),
      aggregateStats: platformAggregateStatsSchema,
      pagination: paginationResponseSchema,
    })
    .optional(),
  error: z.string().optional(),
  details: z.string().optional(),
});

// ============================================================================
// Error Response Schema
// ============================================================================

/**
 * Standard error response
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

// Request types
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type HistoryQueryParams = z.infer<typeof historyQueryParamsSchema>;
export type PlatformQueryParams = z.infer<typeof platformQueryParamsSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;

// Response types
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
export type PlatformResponse = z.infer<typeof platformResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Component types
export type CitationResponse = z.infer<typeof citationResponseSchema>;
export type VisibilityScoreResponse = z.infer<typeof visibilityScoreResponseSchema>;
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
export type PlatformAnalysisResponse = z.infer<typeof platformAnalysisResponseSchema>;
export type AggregateStatsResponse = z.infer<typeof aggregateStatsResponseSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type PlatformInsight = z.infer<typeof platformInsightSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates if a string is a valid AI platform
 */
export function isValidPlatform(platform: string): boolean {
  return aiPlatformSchema.safeParse(platform).success;
}

/**
 * Validates pagination parameters from query string
 */
export function validatePaginationParams(params: {
  limit?: string;
  offset?: string;
}): { limit: number; offset: number } {
  const limit = Math.min(
    parseInt(params.limit || "10", 10),
    100
  );
  const offset = Math.max(parseInt(params.offset || "0", 10), 0);

  return { limit, offset };
}

/**
 * Parses and validates history query parameters
 */
export function parseHistoryQueryParams(searchParams: URLSearchParams) {
  return historyQueryParamsSchema.parse({
    brandId: searchParams.get("brandId") || undefined,
    limit: searchParams.get("limit") || undefined,
    offset: searchParams.get("offset") || undefined,
  });
}

/**
 * Parses and validates platform query parameters
 */
export function parsePlatformQueryParams(
  platform: string,
  searchParams: URLSearchParams
) {
  return platformQueryParamsSchema.parse({
    platform,
    brandId: searchParams.get("brandId") || undefined,
    limit: searchParams.get("limit") || undefined,
    offset: searchParams.get("offset") || undefined,
  });
}

/**
 * Creates a standard success response
 */
export function successResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

/**
 * Creates a standard error response
 */
export function errorResponse(error: string, details?: any) {
  return {
    success: false as const,
    error,
    ...(details && { details }),
  };
}
