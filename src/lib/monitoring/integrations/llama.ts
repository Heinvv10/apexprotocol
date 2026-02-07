import { MultiPlatformQueryResult } from "../multi-platform-query";
import { getPlatformByName } from "../platform-registry";
import { VisibilityMetrics } from "@/lib/db/schema/platform-registry";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Llama Integration
 *
 * Handles queries to Meta's Llama platform (via various inference providers).
 * Llama is the most widely used open-source LLM with broad adoption.
 */

interface LlamaResponse {
  content: string;
  mentions: Array<{
    text: string;
    context: string;
    score: number;
  }>;
  relevance_score?: number;
  processing_time_ms?: number;
}

/**
 * Query Llama platform
 */
export async function queryLlama(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const platform = await getPlatformByName("llama");
  if (!platform) {
    throw new Error("Llama platform not configured");
  }

  const response = await executeLlamaQuery(query, brandContext, platform);
  const metrics = parseLlamaResponse(response, brandId, query);

  return {
    platformName: "llama",
    platformId: integrationId,
    status: "success",
    response: JSON.stringify(response),
    metrics,
    responseTimeMs: response.processing_time_ms || 0,
  };
}

/**
 * Execute the actual Llama query
 */
async function executeLlamaQuery(
  query: string,
  brandContext: string | undefined,
  platform: any
): Promise<LlamaResponse> {
  // In MVP, return mock response structure
  // In production, call: platform.apiEndpoint with platform.credentials
  const mockResponse: LlamaResponse = {
    content: `Llama analysis for: "${query}"`,
    mentions: [
      {
        text: "First mention context",
        context: `Context containing query "${query}" with brand relevance`,
        score: 0.88,
      },
      {
        text: "Second mention context",
        context: `Additional context about "${query}" topic`,
        score: 0.75,
      },
      {
        text: "Third mention context",
        context: `Further information related to query`,
        score: 0.62,
      },
    ],
    relevance_score: 0.82,
    processing_time_ms: 650,
  };

  return mockResponse;
}

/**
 * Parse Llama response to extract visibility metrics
 */
function parseLlamaResponse(
  response: LlamaResponse,
  brandId: string,
  query: string
): VisibilityMetrics {
  if (!response.mentions || response.mentions.length === 0) {
    return {
      visibility: 0,
      position: null,
      confidence: 0,
    };
  }

  const topMention = response.mentions[0];
  const visibilityScore = Math.round((topMention.score || 0.5) * 100);

  return {
    visibility: visibilityScore,
    position: 1,
    confidence: Math.round((response.relevance_score || 0.75) * 100),
    citationCount: response.mentions.length,
  };
}

/**
 * Extract mentions from Llama response
 */
export function extractLlamaMentions(
  response: LlamaResponse
): Array<{ text: string; context: string; score: number }> {
  return response.mentions.map((mention) => ({
    text: mention.text,
    context: mention.context,
    score: mention.score,
  }));
}

/**
 * Calculate Share of Voice from Llama queries
 */
export function calculateLlamaSOV(
  brandMetrics: VisibilityMetrics[],
  competitorMetrics: VisibilityMetrics[]
): number {
  const totalBrandVisibility = brandMetrics.reduce(
    (sum, m) => sum + m.visibility,
    0
  );
  const totalCompetitorVisibility = competitorMetrics.reduce(
    (sum, m) => sum + m.visibility,
    0
  );

  if (totalBrandVisibility + totalCompetitorVisibility === 0) {
    return 0;
  }

  return Math.round(
    (totalBrandVisibility /
      (totalBrandVisibility + competitorVisibility)) *
      100
  );
}
