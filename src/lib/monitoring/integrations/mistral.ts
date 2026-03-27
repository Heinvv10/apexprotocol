import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Mistral Integration
 *
 * Handles queries to Mistral AI platform for brand visibility monitoring.
 * Mistral is a leading French LLM provider with strong European market presence.
 */

/**
 * Query Mistral platform
 */
export async function queryMistral(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return createErrorResult("mistral", integrationId, "MISTRAL_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
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
        "mistral",
        integrationId,
        `Mistral API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "mistral",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "mistral",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
