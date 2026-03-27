import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Bing Copilot Integration
 *
 * Uses Bing Search API to analyze brand visibility in search results.
 */

export async function queryBingCopilot(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) {
    return createErrorResult("bing_copilot", integrationId, "BING_SEARCH_API_KEY not configured");
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: "10",
      responseFilter: "Webpages",
    });

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResult(
        "bing_copilot",
        integrationId,
        `Bing API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const snippets = data.webPages?.value?.map((page: { snippet: string }) => page.snippet) || [];
    const content = snippets.join(" ");
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "bing_copilot",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "bing_copilot",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
