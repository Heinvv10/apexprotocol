/**
 * Platform Gap Alerts
 * Identifies platforms where brand visibility is critically low
 */

import type { PlatformVisibilityScore } from "@/lib/db/schema/audits";

// Traffic share estimates for each AI platform (approximate)
const PLATFORM_TRAFFIC_SHARE: Record<string, string> = {
  chatgpt: "35%",
  claude: "15%",
  gemini: "20%",
  perplexity: "18%",
  grok: "5%",
  deepseek: "4%",
  copilot: "3%",
};

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
  deepseek: "DeepSeek",
  copilot: "Microsoft Copilot",
};

export interface PlatformGapAlert {
  platform: string;
  platformName: string;
  score: number;
  trafficShare: string;
  severity: "critical" | "warning";
  message: string;
}

/**
 * Generate platform gap alerts for low visibility scores
 *
 * @param scores - Array of platform visibility scores
 * @param lowScoreThreshold - Score below which to generate alerts (default: 20)
 * @returns Array of alert messages for platforms with low visibility
 */
export function generatePlatformGapAlerts(
  scores: PlatformVisibilityScore[],
  lowScoreThreshold: number = 20
): PlatformGapAlert[] {
  const alerts: PlatformGapAlert[] = [];

  for (const score of scores) {
    if (score.score < lowScoreThreshold) {
      const platformName = PLATFORM_NAMES[score.platform] || score.platform;
      const trafficShare = PLATFORM_TRAFFIC_SHARE[score.platform] || "N/A";
      const severity = score.score < 10 ? "critical" : "warning";

      alerts.push({
        platform: score.platform,
        platformName,
        score: score.score,
        trafficShare,
        severity,
        message: `Your brand is nearly invisible on ${platformName} (score: ${score.score}). This platform drives ${trafficShare} of AI-referred traffic.`,
      });
    }
  }

  // Sort by severity (critical first) then by score (lowest first)
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "critical" ? -1 : 1;
    }
    return a.score - b.score;
  });

  return alerts;
}

/**
 * Get simple alert messages (string array) for UI display
 */
export function getPlatformGapAlertMessages(
  scores: PlatformVisibilityScore[],
  lowScoreThreshold: number = 20
): string[] {
  const alerts = generatePlatformGapAlerts(scores, lowScoreThreshold);
  return alerts.map((alert) => alert.message);
}

/**
 * Check if any platform has critically low visibility
 */
export function hasVisibilityGaps(
  scores: PlatformVisibilityScore[],
  threshold: number = 20
): boolean {
  return scores.some((score) => score.score < threshold);
}

/**
 * Get the worst performing platforms
 */
export function getWorstPerformingPlatforms(
  scores: PlatformVisibilityScore[],
  limit: number = 3
): PlatformVisibilityScore[] {
  return [...scores]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * Detect platform gaps - simplified function matching task requirements
 * Returns alert messages for any score below threshold
 *
 * @param platformScores - Array of platform visibility scores
 * @param threshold - Score below which to alert (default: 20)
 * @returns Array of string alert messages
 */
export function detectPlatformGaps(
  platformScores: PlatformVisibilityScore[],
  threshold: number = 20
): string[] {
  return getPlatformGapAlertMessages(platformScores, threshold);
}
