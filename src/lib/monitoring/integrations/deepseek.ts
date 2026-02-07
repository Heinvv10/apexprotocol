/**
 * DeepSeek Integration
 * 
 * Query DeepSeek API to check brand visibility in AI responses
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * Query DeepSeek for brand mentions
 */
export async function queryDeepSeek(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  if (!DEEPSEEK_API_KEY) {
    return createErrorResult("deepseek", integrationId, "DeepSeek API key not configured");
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return createErrorResult("deepseek", integrationId, `API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext, { confidence: 80 });

    return {
      platformName: "deepseek",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult("deepseek", integrationId, error instanceof Error ? error.message : "Unknown error");
  }
}

