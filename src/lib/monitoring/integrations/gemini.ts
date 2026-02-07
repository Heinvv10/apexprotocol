/**
 * Gemini Integration
 * 
 * Query Google's Gemini API to check brand visibility in AI responses
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { analyzeResponseForBrand, createErrorResult } from "./shared-analysis";

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Query Gemini for brand mentions
 */
export async function queryGemini(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  if (!GOOGLE_AI_KEY) {
    return createErrorResult("gemini", integrationId, "Google AI API key not configured");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: query }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return createErrorResult("gemini", integrationId, `API error: ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const metrics = analyzeResponseForBrand(content, brandContext);

    return {
      platformName: "gemini",
      platformId: integrationId,
      status: "success",
      response: content,
      metrics,
      responseTimeMs: 0,
    };
  } catch (error) {
    return createErrorResult("gemini", integrationId, error instanceof Error ? error.message : "Unknown error");
  }
}

