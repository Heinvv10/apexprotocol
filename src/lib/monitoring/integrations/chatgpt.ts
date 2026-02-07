/**
 * ChatGPT Integration
 * 
 * Query OpenAI's ChatGPT API to check brand visibility in AI responses
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Query ChatGPT for brand mentions
 */
export async function queryChatGPT(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  if (!OPENAI_API_KEY) {
    return createErrorResult("chatgpt", integrationId, "OpenAI API key not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Provide accurate, factual responses."
          },
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
      return createErrorResult("chatgpt", integrationId, `API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "chatgpt",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult("chatgpt", integrationId, error instanceof Error ? error.message : "Unknown error");
  }
}

