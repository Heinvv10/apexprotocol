/**
 * Grok Integration
 * 
 * Query xAI's Grok API to check brand visibility in AI responses
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

const XAI_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

/**
 * Query Grok for brand mentions
 */
export async function queryGrok(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  if (!XAI_API_KEY) {
    return createErrorResult("grok", integrationId, "xAI API key not configured");
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-beta",
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
      return createErrorResult("grok", integrationId, `API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext, { confidence: 80 });

    return {
      platformName: "grok",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult("grok", integrationId, error instanceof Error ? error.message : "Unknown error");
  }
}

