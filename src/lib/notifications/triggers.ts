/**
 * Notification Triggers
 * Phase 2.2: Integration hooks for mention and score change events
 *
 * This module provides trigger functions that create notifications when:
 * - New brand mentions are detected across AI platforms
 * - GEO scores change by significant thresholds (Â±5 points)
 */

import { db } from "@/lib/db";
import {
  brandMentions,
  type BrandMention,
} from "@/lib/db/schema/mentions";
import {
  geoScoreHistory,
  type GeoScoreHistory,
} from "@/lib/db/schema/feedback";
import { brands } from "@/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { createNotification } from "./service";

// Constants
const SCORE_CHANGE_THRESHOLD = 5; // Minimum score change to trigger notification
const SCORE_CHANGE_RATE_LIMIT_HOURS = 1; // Max 1 score change notification per hour per brand

// Types
export interface MentionTriggerInput {
  mention: BrandMention;
  userId: string;
  organizationId: string;
}

export interface ScoreChangeTriggerInput {
  scoreHistory: GeoScoreHistory;
  userId: string;
  organizationId: string;
}

export interface TriggerResult {
  success: boolean;
  notificationId?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Format sentiment for display
 */
function formatSentiment(sentiment: string): string {
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
}

/**
 * Get platform display name
 */
function getPlatformDisplayName(platform: string): string {
  const platformNames: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    grok: "Grok",
    deepseek: "DeepSeek",
    copilot: "Copilot",
  };

  return platformNames[platform] || platform;
}

/**
 * Trigger notification when a new brand mention is created
 *
 * Creates a notification with mention details including platform, query,
 * sentiment, and position information.
 *
 * @param input - Mention trigger input with mention data and user info
 * @returns Result indicating success, notification ID, or skip reason
 */
export async function onMentionCreated(
  input: MentionTriggerInput
): Promise<TriggerResult> {
  try {
    const { mention, userId, organizationId } = input;

    // Get brand details for context
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, mention.brandId),
    });

    if (!brand) {
      console.error(
        `[NotificationTriggers] Brand not found for mention: ${mention.brandId}`
      );
      return {
        success: false,
        reason: "Brand not found",
      };
    }

    // Build notification title based on sentiment and position
    let title = `New ${formatSentiment(mention.sentiment)} mention`;
    if (mention.position !== null && mention.position !== undefined) {
      title += ` (#${mention.position})`;
    }

    // Build notification message
    const platformName = getPlatformDisplayName(mention.platform);
    let message = `${brand.name} was mentioned on ${platformName}`;

    if (mention.query) {
      message += ` in response to: "${mention.query}"`;
    }

    // Create notification
    const result = await createNotification({
      userId,
      organizationId,
      type: "mention",
      title,
      message,
      metadata: {
        brandId: mention.brandId,
        brandName: brand.name,
        mentionId: mention.id,
        platform: mention.platform,
        query: mention.query,
        sentiment: mention.sentiment,
        position: mention.position ?? undefined,
        linkUrl: `/dashboard/brands/${mention.brandId}/mentions/${mention.id}`,
        linkText: "View mention details",
      },
    });

    if (result.deduplicated) {
      return {
        success: true,
        skipped: true,
        reason: "Duplicate notification within deduplication window",
      };
    }

    return {
      success: true,
      notificationId: result.id,
    };
  } catch (error) {
    console.error("[NotificationTriggers] Error in onMentionCreated:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger notification when GEO score changes significantly
 *
 * Creates a notification when score changes by Â±5 points or more.
 * Rate limited to max 1 notification per hour per brand.
 *
 * @param input - Score change trigger input with score history and user info
 * @returns Result indicating success, notification ID, or skip reason
 */
export async function onScoreChange(
  input: ScoreChangeTriggerInput
): Promise<TriggerResult> {
  try {
    const { scoreHistory, userId, organizationId } = input;

    // Check if score change meets threshold
    const scoreChange = scoreHistory.scoreChange ?? 0;
    const absChange = Math.abs(scoreChange);

    if (absChange < SCORE_CHANGE_THRESHOLD) {
      return {
        success: true,
        skipped: true,
        reason: `Score change (${scoreChange.toFixed(1)}) below threshold (${SCORE_CHANGE_THRESHOLD})`,
      };
    }

    // Get brand details
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, scoreHistory.brandId),
    });

    if (!brand) {
      console.error(
        `[NotificationTriggers] Brand not found for score change: ${scoreHistory.brandId}`
      );
      return {
        success: false,
        reason: "Brand not found",
      };
    }

    // Determine trend and format message
    const direction = scoreChange > 0 ? "increased" : "decreased";
    const emoji = scoreChange > 0 ? "ðŸ“ˆ" : "ðŸ“‰";
    const oldScore = scoreHistory.previousScore ?? 0;
    const newScore = scoreHistory.overallScore;

    // Build notification title
    const title = `${emoji} GEO Score ${direction} by ${absChange.toFixed(1)} points`;

    // Build notification message
    const message = `${brand.name}'s GEO score ${direction} from ${oldScore.toFixed(1)} to ${newScore.toFixed(1)}`;

    // Add context about which components changed
    const components: string[] = [];
    if (scoreHistory.visibilityScore) {
      components.push(
        `Visibility: ${scoreHistory.visibilityScore.toFixed(1)}`
      );
    }
    if (scoreHistory.sentimentScore) {
      components.push(`Sentiment: ${scoreHistory.sentimentScore.toFixed(1)}`);
    }
    if (scoreHistory.recommendationScore) {
      components.push(
        `Recommendations: ${scoreHistory.recommendationScore.toFixed(1)}`
      );
    }

    // Create notification
    const result = await createNotification({
      userId,
      organizationId,
      type: "score_change",
      title,
      message,
      metadata: {
        brandId: scoreHistory.brandId,
        brandName: brand.name,
        oldScore,
        newScore,
        scoreChange,
        metric: "geo_score",
        visibilityScore: scoreHistory.visibilityScore,
        sentimentScore: scoreHistory.sentimentScore,
        recommendationScore: scoreHistory.recommendationScore,
        trend: scoreHistory.trend,
        components,
        linkUrl: `/dashboard/brands/${scoreHistory.brandId}/analytics`,
        linkText: "View analytics",
      },
    });

    if (result.deduplicated) {
      return {
        success: true,
        skipped: true,
        reason: "Duplicate notification within deduplication window (rate limited)",
      };
    }

    return {
      success: true,
      notificationId: result.id,
    };
  } catch (error) {
    console.error("[NotificationTriggers] Error in onScoreChange:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch trigger for multiple mentions
 * Useful for bulk import or monitoring operations
 */
export async function onMentionsCreated(
  mentions: BrandMention[],
  userId: string,
  organizationId: string
): Promise<TriggerResult[]> {
  const results: TriggerResult[] = [];

  for (const mention of mentions) {
    const result = await onMentionCreated({
      mention,
      userId,
      organizationId,
    });
    results.push(result);
  }

  return results;
}

/**
 * Batch trigger for multiple score changes
 * Useful for bulk analytics updates
 */
export async function onScoreChanges(
  scoreHistories: GeoScoreHistory[],
  userId: string,
  organizationId: string
): Promise<TriggerResult[]> {
  const results: TriggerResult[] = [];

  for (const scoreHistory of scoreHistories) {
    const result = await onScoreChange({
      scoreHistory,
      userId,
      organizationId,
    });
    results.push(result);
  }

  return results;
}

// Export singleton interface
export const NotificationTriggers = {
  onMentionCreated,
  onScoreChange,
  onMentionsCreated,
  onScoreChanges,
};
