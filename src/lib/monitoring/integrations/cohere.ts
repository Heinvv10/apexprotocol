import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Cohere Integration
 *
 * Uses Cohere's language models for context extraction and sentiment analysis.
 */

export async function queryCohere(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    return createErrorResult("cohere", integrationId, "COHERE_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "command-r-plus",
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
        "cohere",
        integrationId,
        `Cohere API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.message?.content?.[0]?.text || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "cohere",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "cohere",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
