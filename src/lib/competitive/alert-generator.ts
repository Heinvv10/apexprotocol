/**
 * Competitive Alert Generator
 *
 * Analyzes competitive data snapshots and generates alerts for significant changes.
 * Called by the cron job after collecting monitoring data.
 */

import { db } from "@/lib/db";
import {
  competitiveAlerts,
  shareOfVoice,
  brands,
  type NewCompetitiveAlert,
} from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import type { SOVSnapshot } from "./share-of-voice";

// Alert thresholds
const THRESHOLDS = {
  SOV_DROP_MINOR: 5,    // 5% drop triggers low severity
  SOV_DROP_MAJOR: 10,   // 10% drop triggers medium severity
  SOV_DROP_CRITICAL: 20, // 20% drop triggers critical severity
  POSITION_DROP: 2,      // Position drop of 2+ triggers alert
  COMPETITOR_SURGE: 15,  // Competitor gaining 15%+ triggers alert
  NEW_COMPETITOR: 10,    // New competitor with 10%+ SOV triggers alert
};

export interface GeneratedAlert {
  alertType: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  competitorName?: string;
  platform?: string;
  previousValue?: number;
  currentValue?: number;
}

/**
 * Generate competitive alerts based on SOV snapshot comparison
 */
export async function generateCompetitiveAlerts(
  brandId: string,
  currentSnapshot: SOVSnapshot
): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];

  // Get previous day's snapshot for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const previousSOV = await db.query.shareOfVoice.findFirst({
    where: and(
      eq(shareOfVoice.brandId, brandId),
      eq(shareOfVoice.platform, "all"),
      eq(shareOfVoice.date, yesterdayStr)
    ),
  });

  // Get 7-day old snapshot for trend comparison
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const weekAgoSOV = await db.query.shareOfVoice.findFirst({
    where: and(
      eq(shareOfVoice.brandId, brandId),
      eq(shareOfVoice.platform, "all"),
      eq(shareOfVoice.date, weekAgoStr)
    ),
  });

  // Check for SOV drops
  if (previousSOV) {
    const previousValue = parseFloat(previousSOV.sovPercentage || "0");
    const drop = previousValue - currentSnapshot.overall;

    if (drop >= THRESHOLDS.SOV_DROP_CRITICAL) {
      alerts.push({
        alertType: "sov_drop_critical",
        title: "Critical: Share of Voice Dropped Significantly",
        description: `Your overall share of voice dropped from ${previousValue.toFixed(1)}% to ${currentSnapshot.overall.toFixed(1)}% (${drop.toFixed(1)}% decrease) in the last 24 hours.`,
        severity: "critical",
        previousValue,
        currentValue: currentSnapshot.overall,
      });
    } else if (drop >= THRESHOLDS.SOV_DROP_MAJOR) {
      alerts.push({
        alertType: "sov_drop_major",
        title: "Share of Voice Decreased",
        description: `Your share of voice dropped by ${drop.toFixed(1)}% in the last 24 hours (${previousValue.toFixed(1)}% → ${currentSnapshot.overall.toFixed(1)}%).`,
        severity: "medium",
        previousValue,
        currentValue: currentSnapshot.overall,
      });
    } else if (drop >= THRESHOLDS.SOV_DROP_MINOR) {
      alerts.push({
        alertType: "sov_drop_minor",
        title: "Slight Share of Voice Decline",
        description: `Your share of voice decreased by ${drop.toFixed(1)}% since yesterday.`,
        severity: "low",
        previousValue,
        currentValue: currentSnapshot.overall,
      });
    }
  }

  // Check for weekly trend decline
  if (weekAgoSOV) {
    const weekAgoValue = parseFloat(weekAgoSOV.sovPercentage || "0");
    const weeklyDrop = weekAgoValue - currentSnapshot.overall;

    if (weeklyDrop >= THRESHOLDS.SOV_DROP_MAJOR) {
      alerts.push({
        alertType: "sov_weekly_decline",
        title: "Weekly Visibility Trend Down",
        description: `Your share of voice has declined ${weeklyDrop.toFixed(1)}% over the past 7 days (${weekAgoValue.toFixed(1)}% → ${currentSnapshot.overall.toFixed(1)}%).`,
        severity: weeklyDrop >= THRESHOLDS.SOV_DROP_CRITICAL ? "high" : "medium",
        previousValue: weekAgoValue,
        currentValue: currentSnapshot.overall,
      });
    }
  }

  // Check for competitor changes
  const previousCompetitors = previousSOV?.competitorBreakdown as Array<{
    name: string;
    sovPercentage: number;
  }> || [];

  const previousCompMap = new Map(
    previousCompetitors.map((c) => [c.name.toLowerCase(), c.sovPercentage])
  );

  for (const competitor of currentSnapshot.competitors) {
    const prevSOV = previousCompMap.get(competitor.name.toLowerCase());

    if (prevSOV === undefined) {
      // New competitor appearing
      if (competitor.sovPercentage >= THRESHOLDS.NEW_COMPETITOR) {
        alerts.push({
          alertType: "new_competitor",
          title: "New Competitor Detected",
          description: `${competitor.name} has appeared in AI responses with ${competitor.sovPercentage.toFixed(1)}% share of voice.`,
          severity: competitor.sovPercentage >= 20 ? "high" : "medium",
          competitorName: competitor.name,
          currentValue: competitor.sovPercentage,
        });
      }
    } else {
      // Existing competitor gaining ground
      const gain = competitor.sovPercentage - prevSOV;
      if (gain >= THRESHOLDS.COMPETITOR_SURGE) {
        alerts.push({
          alertType: "competitor_surge",
          title: "Competitor Gaining Visibility",
          description: `${competitor.name} increased their AI visibility by ${gain.toFixed(1)}% (${prevSOV.toFixed(1)}% → ${competitor.sovPercentage.toFixed(1)}%).`,
          severity: gain >= 25 ? "high" : "medium",
          competitorName: competitor.name,
          previousValue: prevSOV,
          currentValue: competitor.sovPercentage,
        });
      }
    }
  }

  // Check for platform-specific issues
  for (const platform of currentSnapshot.platforms) {
    // Low visibility on specific platforms
    if (platform.percentage < 10 && platform.totalMentions > 5) {
      alerts.push({
        alertType: "low_platform_visibility",
        title: `Low Visibility on ${capitalizeFirst(platform.platform)}`,
        description: `Your share of voice on ${platform.platform} is only ${platform.percentage.toFixed(1)}% with ${platform.totalMentions} total mentions tracked.`,
        severity: "low",
        platform: platform.platform,
        currentValue: platform.percentage,
      });
    }

    // High negative sentiment on platform
    const totalSentiment =
      platform.sentimentBreakdown.positive +
      platform.sentimentBreakdown.neutral +
      platform.sentimentBreakdown.negative;

    if (totalSentiment > 0) {
      const negativeRatio = platform.sentimentBreakdown.negative / totalSentiment;
      if (negativeRatio > 0.3) {
        alerts.push({
          alertType: "negative_sentiment",
          title: `Negative Sentiment Alert on ${capitalizeFirst(platform.platform)}`,
          description: `${(negativeRatio * 100).toFixed(0)}% of your mentions on ${platform.platform} have negative sentiment.`,
          severity: negativeRatio > 0.5 ? "high" : "medium",
          platform: platform.platform,
          currentValue: negativeRatio * 100,
        });
      }
    }

    // Position drop
    if (platform.avgPosition > 5 && platform.brandMentions > 0) {
      alerts.push({
        alertType: "position_warning",
        title: `Low Position on ${capitalizeFirst(platform.platform)}`,
        description: `Your average position on ${platform.platform} is ${platform.avgPosition.toFixed(1)}. Aim for positions 1-3.`,
        severity: "low",
        platform: platform.platform,
        currentValue: platform.avgPosition,
      });
    }
  }

  // Save alerts to database
  for (const alert of alerts) {
    // Check if similar alert exists in the last 24 hours to avoid duplicates
    const existingAlert = await db.query.competitiveAlerts.findFirst({
      where: and(
        eq(competitiveAlerts.brandId, brandId),
        eq(competitiveAlerts.alertType, alert.alertType),
        gte(competitiveAlerts.triggeredAt, yesterday)
      ),
    });

    if (!existingAlert) {
      const newAlert: NewCompetitiveAlert = {
        brandId,
        alertType: alert.alertType,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        competitorName: alert.competitorName,
        platform: alert.platform,
        previousValue: alert.previousValue?.toString(),
        currentValue: alert.currentValue?.toString(),
      };

      await db.insert(competitiveAlerts).values(newAlert);
    }
  }

  console.log(`[Alert Generator] Generated ${alerts.length} alerts for brand ${brandId}`);

  return alerts;
}

/**
 * Get recent alerts for a brand
 */
export async function getRecentAlerts(
  brandId: string,
  days: number = 7
): Promise<GeneratedAlert[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const alerts = await db.query.competitiveAlerts.findMany({
    where: and(
      eq(competitiveAlerts.brandId, brandId),
      gte(competitiveAlerts.triggeredAt, startDate)
    ),
    orderBy: desc(competitiveAlerts.triggeredAt),
  });

  return alerts.map((a) => ({
    alertType: a.alertType,
    title: a.title,
    description: a.description,
    severity: a.severity as "low" | "medium" | "high" | "critical",
    competitorName: a.competitorName || undefined,
    platform: a.platform || undefined,
    previousValue: a.previousValue ? parseFloat(a.previousValue) : undefined,
    currentValue: a.currentValue ? parseFloat(a.currentValue) : undefined,
  }));
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string): Promise<void> {
  await db
    .update(competitiveAlerts)
    .set({ isDismissed: true })
    .where(eq(competitiveAlerts.id, alertId));
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
