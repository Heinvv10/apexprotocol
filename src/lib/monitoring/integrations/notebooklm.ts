import { MultiPlatformQueryResult } from "../multi-platform-query";
import { getPlatformByName } from "../platform-registry";
import { VisibilityMetrics } from "@/lib/db/schema/platform-registry";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Google NotebookLM Integration
 *
 * Focuses on academic and research visibility.
 */

interface NotebookLMResponse {
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    content: string;
    relevance: number;
  }>;
  academicScore?: number;
  isAcademic?: boolean;
}

export async function queryNotebookLM(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const platform = await getPlatformByName("notebooklm");
  if (!platform) {
    throw new Error("NotebookLM platform not configured");
  }

  const response = await executeNotebookLMQuery(
    query,
    brandContext,
    platform
  );
  const metrics = parseNotebookLMResponse(response, brandId, query);

  return {
    platformName: "notebooklm",
    platformId: integrationId,
    status: "success",
    response: JSON.stringify(response),
    metrics,
    responseTimeMs: 0,
  };
}

async function executeNotebookLMQuery(
  query: string,
  brandContext: string | undefined,
  platform: any
): Promise<NotebookLMResponse> {
  const mockResponse: NotebookLMResponse = {
    summary: `Research summary for "${query}"`,
    sources: [
      {
        title: "Academic Source 1",
        url: "https://research1.edu",
        content: "Research findings related to query",
        relevance: 0.94,
      },
      {
        title: "Academic Source 2",
        url: "https://research2.edu",
        content: "Related academic content",
        relevance: 0.87,
      },
    ],
    academicScore: 0.88,
    isAcademic: true,
  };

  return mockResponse;
}

function parseNotebookLMResponse(
  response: NotebookLMResponse,
  brandId: string,
  query: string
): VisibilityMetrics {
  if (!response.sources || response.sources.length === 0) {
    return {
      visibility: 0,
      position: null,
      confidence: 0,
    };
  }

  const visibilityScore = Math.round((response.academicScore || 0.5) * 100);

  return {
    visibility: visibilityScore,
    position: 1,
    confidence: visibilityScore,
    citationCount: response.sources.length,
  };
}
