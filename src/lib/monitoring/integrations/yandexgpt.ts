import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

/**
 * YandexGPT Integration
 *
 * Handles queries to Yandex's GPT platform.
 * Strong in Russian and Eastern European markets.
 */

/**
 * Query YandexGPT platform
 */
export async function queryYandexGPT(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const apiKey = process.env.YANDEX_API_KEY;
  if (!apiKey) {
    return createErrorResult("yandexgpt", integrationId, "YANDEX_API_KEY not configured");
  }

  try {
    const response = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          modelUri: "gpt://b1g02ijsc1jb8s3uiavg/yandexgpt-lite",
          completionOptions: {
            maxTokens: 1000,
          },
          messages: [
            {
              role: "user",
              text: query,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResult(
        "yandexgpt",
        integrationId,
        `Yandex API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const content = data.result?.alternatives?.[0]?.message?.text || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "yandexgpt",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult(
      "yandexgpt",
      integrationId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
