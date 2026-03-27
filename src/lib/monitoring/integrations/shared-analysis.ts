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

  const brandName = brandContext || "";

  // Escape special regex characters in brand name
  const escapedBrandName = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Use word-boundary regex for accurate brand detection
  const brandRegex = escapedBrandName
    ? new RegExp(`\\b${escapedBrandName}\\b`, "gi")
    : null;

  // Check if brand is mentioned using word boundary
  const isMentioned = brandRegex ? brandRegex.test(response) : false;

  // Calculate position based on which quarter of response first mention falls in
  let position: number | null = null;
  if (isMentioned && brandRegex) {
    // Reset regex lastIndex for fresh search
    brandRegex.lastIndex = 0;
    const match = brandRegex.exec(response);
    if (match) {
      const firstMentionIndex = match.index;
      const responseLength = response.length;
      const percentPosition = firstMentionIndex / responseLength;

      // Position: 0-25% = 1, 25-50% = 3, 50-75% = 6, 75-100% = 9
      if (percentPosition < 0.25) {
        position = 1;
      } else if (percentPosition < 0.5) {
        position = 3;
      } else if (percentPosition < 0.75) {
        position = 6;
      } else {
        position = 9;
      }
    }
  }

  // Count mentions using word-boundary regex
  const mentionCount = escapedBrandName
    ? (response.match(new RegExp(`\\b${escapedBrandName}\\b`, "gi")) || []).length
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
