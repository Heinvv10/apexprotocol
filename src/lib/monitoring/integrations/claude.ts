/**
 * Claude Integration
 * 
 * Query Anthropic's Claude API to check brand visibility in AI responses
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Query Claude for brand mentions
 */
export async function queryClaude(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  if (!ANTHROPIC_API_KEY) {
    return createErrorResult("claude", integrationId, "Anthropic API key not configured");
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: query
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return createErrorResult("claude", integrationId, `API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "claude",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult("claude", integrationId, error instanceof Error ? error.message : "Unknown error");
  }
}

