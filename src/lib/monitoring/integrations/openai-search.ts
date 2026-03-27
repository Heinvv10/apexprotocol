import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * OpenAI Search Integration
 *
 * Handles queries to OpenAI's Search platform for brand visibility monitoring.
 * Extracts visibility metrics, citation information, and position tracking.
 */

/**
 * Query OpenAI Search platform
 */
export async function queryOpenAISearch(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return createErrorResult("openai_search", integrationId, "OPENAI_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResult(
        "openai_search",
        integrationId,
        `OpenAI Search API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext, { citationBonus: 10 });

    return {
      platformName: "openai_search",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "openai_search",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
