import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Janus (Claude API) Integration
 *
 * Uses Anthropic's Claude API for advanced brand analysis and context extraction.
 */

export async function queryJanus(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return createErrorResult("janus", integrationId, "ANTHROPIC_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system:
          "You are an AI visibility analyst providing objective brand mention analysis.",
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
        "janus",
        integrationId,
        `Anthropic API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "janus",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "janus",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
