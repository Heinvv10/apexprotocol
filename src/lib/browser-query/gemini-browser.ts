/**
 * Gemini Browser Integration Hook
 *
 * Provides a simple integration point for Gemini browser queries
 * compatible with the multi-platform query system.
 */

import { getGeminiExecutor, cleanupGeminiExecutor } from "./gemini-browser-query";
import { BrowserQueryResult, BrowserQueryOptions } from "./types";
import { MultiPlatformQueryResult } from "../monitoring/multi-platform-query";
import type { VisibilityMetrics } from "@/lib/db/schema/platform-registry";

/**
 * Execute a query against Gemini via browser automation
 *
 * @param query - The search query or question
 * @param integrationId - Integration identifier for tracking
 * @param options - Query execution options
 * @returns Result with extracted content and metrics
 */
export async function queryGeminiBrowser(
  query: string,
  integrationId: string = "gemini-browser-default",
  options: BrowserQueryOptions = {}
): Promise<MultiPlatformQueryResult> {
  const executor = getGeminiExecutor();

  try {
    const result = await executor.executeQuery(query, integrationId, {
      ...options,
      captureScreenshot: options.captureScreenshot ?? false,
      timeoutMs: options.timeoutMs ?? 30000,
      maxRetries: options.maxRetries ?? 2,
    });

    return convertBrowserResultToMultiPlatform(result);
  } catch (error) {
    return {
      platformName: "gemini_browser",
      platformId: integrationId,
      status: "failed",
      response: "",
      metrics: {
        visibility: 0,
        position: null,
        confidence: 0,
        sentiment: "neutral",
      } as VisibilityMetrics,
      responseTimeMs: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert browser query result to multi-platform format
 */
function convertBrowserResultToMultiPlatform(
  result: BrowserQueryResult
): MultiPlatformQueryResult {
  const visibility = calculateVisibility(result);
  const citations = result.extractedData.citations?.length || 0;

  return {
    platformName: result.platformName,
    platformId: result.platformId,
    status: result.status,
    response: result.rawContent,
    metrics: {
      visibility,
      position: null,
      confidence: visibility > 0 ? 85 : 0,
      sentiment: "neutral",
      citationCount: citations,
    } as VisibilityMetrics,
    responseTimeMs: result.extractedData.responseTime || 0,
    error: result.error,
  };
}

/**
 * Calculate visibility score from browser result
 */
function calculateVisibility(result: BrowserQueryResult): number {
  if (result.status === "failed") {
    return 0;
  }

  // Simple heuristic: check presence and citation count
  const contentPresent = result.rawContent.length > 0 ? 50 : 0;
  const citationBonus = (result.extractedData.citations?.length || 0) * 5;
  const relatedBonus = (result.extractedData.relatedQueries?.length || 0) * 2;

  return Math.min(100, contentPresent + citationBonus + relatedBonus);
}

/**
 * Cleanup Gemini executor resources
 */
export async function cleanupGemini(): Promise<void> {
  await cleanupGeminiExecutor();
}
