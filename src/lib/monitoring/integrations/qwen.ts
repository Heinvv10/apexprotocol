import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * Qwen Integration
 *
 * Handles queries to Alibaba's Qwen platform via DashScope.
 * Leading Chinese AI model with strong enterprise adoption.
 */

/**
 * Query Qwen platform via DashScope
 */
export async function queryQwen(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return createErrorResult("qwen", integrationId, "DASHSCOPE_API_KEY not configured");
  }

  try {
    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-turbo",
          messages: [
            {
              role: "user",
              content: query,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResult(
        "qwen",
        integrationId,
        `DashScope API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "qwen",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "qwen",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
