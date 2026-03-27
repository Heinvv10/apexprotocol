import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Llama Integration
 *
 * Handles queries to Meta's Llama platform via Together AI.
 * Llama is the most widely used open-source LLM with broad adoption.
 */

/**
 * Query Llama platform via Together AI
 */
export async function queryLlama(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return createErrorResult("llama", integrationId, "TOGETHER_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
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
        "llama",
        integrationId,
        `Together API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "llama",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "llama",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
