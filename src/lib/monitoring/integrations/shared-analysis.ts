/**
 * Shared Analysis Utilities for Platform Integrations
 *
 * Common brand visibility analysis logic extracted from individual integrations
 * to eliminate duplication (~35 lines duplicated across 16 files).
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { VisibilityMetrics } from "@/lib/db/schema/platform-registry";

export interface AnalyzeOptions {
  /** Default confidence score for this platform (0-100) */
  confidence?: number;
  /** Bonus visibility for citation matches (e.g. Perplexity) */
  citationBonus?: number;
}

/**
 * Analyze an AI response for brand visibility metrics.
 *
 * Shared across all platform integrations. Calculates:
 * - Whether the brand is mentioned
 * - Position in the response (1-10, earlier = better)
 * - Mention count
 * - Visibility score (0-100)
 *
 * @param response - The AI platform's text response
 * @param brandContext - The brand name to search for
 * @param options - Platform-specific options (confidence, citationBonus)
 */
export function analyzeResponseForBrand(
  response: string,
  brandContext?: string,
  options: AnalyzeOptions = {}
): VisibilityMetrics {
  const { confidence = 85, citationBonus = 0 } = options;

  const lowerResponse = response.toLowerCase();
  const brandName = brandContext?.toLowerCase() || "";

  // Check if brand is mentioned
  const isMentioned = brandName && lowerResponse.includes(brandName);

  // Calculate position (where in response brand appears)
  let position: number | null = null;
  if (isMentioned && brandName) {
    const firstMentionIndex = lowerResponse.indexOf(brandName);
    const responseLength = response.length;
    position = Math.ceil((firstMentionIndex / responseLength) * 10) || 1;
  }

  // Count mentions
  const mentionCount = brandName
    ? (lowerResponse.match(new RegExp(brandName, "gi")) || []).length
    : 0;

  // Calculate visibility score (0-100)
  let visibility = 0;
  if (isMentioned) {
    visibility = 50; // Base score for being mentioned
    visibility += Math.min(mentionCount * 10, 30); // Up to 30 for multiple mentions
    visibility += citationBonus; // Platform-specific bonus
    visibility +=
      position && position <= 3 ? 20 : position && position <= 5 ? 10 : 0; // Position bonus
  }

  return {
    visibility: Math.min(visibility, 100),
    position,
    confidence,
    citationCount: mentionCount + (citationBonus > 0 ? 1 : 0),
  };
}

/**
 * Create a standardized error result for a failed platform query.
 *
 * @param platform - Platform name (e.g. "chatgpt", "claude")
 * @param integrationId - The integration record ID
 * @param error - Error message
 */
export function createErrorResult(
  platform: string,
  integrationId: string,
  error: string
): MultiPlatformQueryResult {
  return {
    platformName: platform,
    platformId: integrationId,
    status: "failed",
    response: "",
    metrics: { visibility: 0, position: null, confidence: 0 },
    responseTimeMs: 0,
    error,
  };
}
