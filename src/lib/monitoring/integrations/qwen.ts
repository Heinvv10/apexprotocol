import { MultiPlatformQueryResult } from "../multi-platform-query";
import { getPlatformByName } from "../platform-registry";
import { VisibilityMetrics } from "@/lib/db/schema/platform-registry";

/**
 * Qwen Integration
 *
 * Handles queries to Alibaba's Qwen platform.
 * Leading Chinese AI model with strong enterprise adoption.
 */

interface QwenResponse {
  text: string;
  knowledge_items: Array<{
    content: string;
    source?: string;
    confidence: number;
  }>;
  overall_confidence?: number;
  language?: string;
}

/**
 * Query Qwen platform
 */
export async function queryQwen(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const platform = await getPlatformByName("qwen");
  if (!platform) {
    throw new Error("Qwen platform not configured");
  }

  const response = await executeQwenQuery(query, brandContext, platform);
  const metrics = parseQwenResponse(response, brandId, query);

  return {
    platformName: "qwen",
    platformId: integrationId,
    status: "success",
    response: JSON.stringify(response),
    metrics,
    responseTimeMs: 0,
  };
}

/**
 * Execute the actual Qwen query
 */
async function executeQwenQuery(
  query: string,
  brandContext: string | undefined,
  platform: any
): Promise<QwenResponse> {
  // In MVP, return mock response structure
  // In production, call: platform.apiEndpoint with platform.credentials
  const mockResponse: QwenResponse = {
    text: `Qwen's response to query: "${query}"`,
    knowledge_items: [
      {
        content: "Primary knowledge item about query",
        source: "qwen_knowledge_base_1",
        confidence: 0.90,
      },
      {
        content: "Secondary knowledge item related to query",
        source: "qwen_knowledge_base_2",
        confidence: 0.77,
      },
      {
        content: "Tertiary knowledge item for additional context",
        source: "qwen_knowledge_base_3",
        confidence: 0.63,
      },
    ],
    overall_confidence: 0.84,
    language: "zh",
  };

  return mockResponse;
}

/**
 * Parse Qwen response to extract visibility metrics
 */
function parseQwenResponse(
  response: QwenResponse,
  brandId: string,
  query: string
): VisibilityMetrics {
  if (!response.knowledge_items || response.knowledge_items.length === 0) {
    return {
      visibility: 0,
      position: null,
      confidence: 0,
    };
  }

  const topItem = response.knowledge_items[0];
  const visibilityScore = Math.round(topItem.confidence * 100);

  return {
    visibility: visibilityScore,
    position: 1,
    confidence: Math.round((response.overall_confidence || 0.75) * 100),
    citationCount: response.knowledge_items.length,
  };
}

/**
 * Extract knowledge items from Qwen response
 */
export function extractQwenKnowledgeItems(
  response: QwenResponse
): Array<{ content: string; source?: string; confidence: number }> {
  return response.knowledge_items.map((item) => ({
    content: item.content,
    source: item.source,
    confidence: item.confidence,
  }));
}

/**
 * Calculate Share of Voice from Qwen queries
 */
export function calculateQwenSOV(
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
      (totalBrandVisibility + totalCompetitorVisibility)) *
      100
  );
}
