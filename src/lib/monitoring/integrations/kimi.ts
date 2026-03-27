import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Kimi Integration
 *
 * Handles queries to Moonshot's Kimi platform.
 * Popular in China with fast-growing market share.
 */

/**
 * Query Kimi platform via Moonshot API
 */
export async function queryKimi(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    return createErrorResult("kimi", integrationId, "MOONSHOT_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
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
        "kimi",
        integrationId,
        `Moonshot API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "kimi",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "kimi",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
