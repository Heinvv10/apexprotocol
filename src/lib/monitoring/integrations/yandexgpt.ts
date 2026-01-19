import { MultiPlatformQueryResult } from "../multi-platform-query";
import { getPlatformByName } from "../platform-registry";
import { VisibilityMetrics } from "@/lib/db/schema/platform-registry";

/**
 * YandexGPT Integration
 *
 * Handles queries to Yandex's GPT platform (Yandex Gigachat).
 * Strong in Russian and Eastern European markets.
 */

interface YandexGPTResponse {
  response_text: string;
  mentions: Array<{
    mention: string;
    relevance: number;
  }>;
  context_quality?: number;
  language?: string;
}

/**
 * Query YandexGPT platform
 */
export async function queryYandexGPT(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const platform = await getPlatformByName("yandexgpt");
  if (!platform) {
    throw new Error("YandexGPT platform not configured");
  }

  const response = await executeYandexGPTQuery(query, brandContext, platform);
  const metrics = parseYandexGPTResponse(response, brandId, query);

  return {
    platformName: "yandexgpt",
    platformId: integrationId,
    status: "success",
    response: JSON.stringify(response),
    metrics,
    responseTimeMs: 0,
  };
}

/**
 * Execute the actual YandexGPT query
 */
async function executeYandexGPTQuery(
  query: string,
  brandContext: string | undefined,
  platform: any
): Promise<YandexGPTResponse> {
  // In MVP, return mock response structure
  // In production, call: platform.apiEndpoint with platform.credentials
  const mockResponse: YandexGPTResponse = {
    response_text: `YandexGPT response to: "${query}"`,
    mentions: [
      {
        mention: "Primary mention context",
        relevance: 0.89,
      },
      {
        mention: "Secondary mention context",
        relevance: 0.76,
      },
      {
        mention: "Additional mention context",
        relevance: 0.64,
      },
    ],
    context_quality: 0.83,
    language: "ru",
  };

  return mockResponse;
}

/**
 * Parse YandexGPT response to extract visibility metrics
 */
function parseYandexGPTResponse(
  response: YandexGPTResponse,
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
  const visibilityScore = Math.round(topMention.relevance * 100);

  return {
    visibility: visibilityScore,
    position: 1,
    confidence: Math.round((response.context_quality || 0.75) * 100),
    citationCount: response.mentions.length,
  };
}

/**
 * Extract mentions from YandexGPT response
 */
export function extractYandexGPTMentions(
  response: YandexGPTResponse
): Array<{ mention: string; relevance: number }> {
  return response.mentions.map((mention) => ({
    mention: mention.mention,
    relevance: mention.relevance,
  }));
}

/**
 * Calculate Share of Voice from YandexGPT queries
 */
export function calculateYandexGPTSOV(
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
