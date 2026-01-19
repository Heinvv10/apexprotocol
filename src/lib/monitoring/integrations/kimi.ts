import { MultiPlatformQueryResult } from "../multi-platform-query";
import { getPlatformByName } from "../platform-registry";
import { VisibilityMetrics } from "@/lib/db/schema/platform-registry";

/**
 * Kimi Integration
 *
 * Handles queries to Moonshot's Kimi platform.
 * Popular in China with fast-growing market share.
 */

interface KimiResponse {
  answer: string;
  references: Array<{
    title: string;
    url?: string;
    relevance_score: number;
  }>;
  answer_quality?: number;
  response_time_ms?: number;
}

/**
 * Query Kimi platform
 */
export async function queryKimi(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const platform = await getPlatformByName("kimi");
  if (!platform) {
    throw new Error("Kimi platform not configured");
  }

  const response = await executeKimiQuery(query, brandContext, platform);
  const metrics = parseKimiResponse(response, brandId, query);

  return {
    platformName: "kimi",
    platformId: integrationId,
    status: "success",
    response: JSON.stringify(response),
    metrics,
    responseTimeMs: response.response_time_ms || 0,
  };
}

/**
 * Execute the actual Kimi query
 */
async function executeKimiQuery(
  query: string,
  brandContext: string | undefined,
  platform: any
): Promise<KimiResponse> {
  // In MVP, return mock response structure
  // In production, call: platform.apiEndpoint with platform.credentials
  const mockResponse: KimiResponse = {
    answer: `Kimi's comprehensive answer to: "${query}"`,
    references: [
      {
        title: "Reference 1 - Highly relevant",
        url: "https://kimi-ref1.com",
        relevance_score: 0.91,
      },
      {
        title: "Reference 2 - Moderately relevant",
        url: "https://kimi-ref2.com",
        relevance_score: 0.78,
      },
      {
        title: "Reference 3 - Supplementary",
        url: "https://kimi-ref3.com",
        relevance_score: 0.65,
      },
    ],
    answer_quality: 0.85,
    response_time_ms: 580,
  };

  return mockResponse;
}

/**
 * Parse Kimi response to extract visibility metrics
 */
function parseKimiResponse(
  response: KimiResponse,
  brandId: string,
  query: string
): VisibilityMetrics {
  if (!response.references || response.references.length === 0) {
    return {
      visibility: 0,
      position: null,
      confidence: 0,
    };
  }

  const topReference = response.references[0];
  const visibilityScore = Math.round(topReference.relevance_score * 100);

  return {
    visibility: visibilityScore,
    position: 1,
    confidence: Math.round((response.answer_quality || 0.8) * 100),
    citationCount: response.references.length,
  };
}

/**
 * Extract references from Kimi response
 */
export function extractKimiReferences(
  response: KimiResponse
): Array<{ title: string; url?: string; score: number }> {
  return response.references.map((ref) => ({
    title: ref.title,
    url: ref.url,
    score: ref.relevance_score,
  }));
}

/**
 * Calculate Share of Voice from Kimi queries
 */
export function calculateKimiSOV(
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
