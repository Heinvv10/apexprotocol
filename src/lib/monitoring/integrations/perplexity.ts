/**
 * Perplexity Integration
 * 
 * Query Perplexity API to check brand visibility in AI search responses
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Query Perplexity for brand mentions
 */
export async function queryPerplexity(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  if (!PERPLEXITY_API_KEY) {
    return createErrorResult("perplexity", integrationId, "Perplexity API key not configured");
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return createErrorResult("perplexity", integrationId, `API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations: string[] = data.citations || [];
    const citationBonus = citations.some(c => c.toLowerCase().includes(brandContext?.toLowerCase() || "")) ? 15 : 0;
    const metrics = analyzeResponseForBrand(content, brandContext, { confidence: 90, citationBonus });

    return {
      platformName: "perplexity",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult("perplexity", integrationId, error instanceof Error ? error.message : "Unknown error");
  }
}

