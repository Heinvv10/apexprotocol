/**
 * Predictive Alerts System
 *
 * Analyzes brand performance metrics and generates intelligent alerts
 * for significant changes or trends that require attention.
 */

import type { Brand } from "@/stores";

// Types
export interface PredictiveAlertContext {
  brandId: string;
  brandName: string;
  currentScore: number;
  previousScore: number;
  scoreChange: number;
  changePercentage: number;
  trendDirection: "up" | "down" | "stable";
  timeframe: string;
  metadata?: Record<string, any>;
}

export interface AlertRecommendation {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  actionItems: string[];
  estimatedImpact?: string;
}

// Constants
const ALERT_THRESHOLDS = {
  SCORE_CHANGE_MIN: 5, // Minimum points change to trigger alert
  PERCENTAGE_CHANGE_MIN: 10, // Minimum % change to trigger alert
  CRITICAL_THRESHOLD: 20, // Points change that triggers critical alert
  HIGH_THRESHOLD: 15,
  MEDIUM_THRESHOLD: 10,
};

/**
 * Determines if a predictive alert should be triggered based on score changes
 */
export function shouldTriggerPredictiveAlert(
  context: PredictiveAlertContext
): boolean {
  const { scoreChange, changePercentage } = context;

  // Check if change exceeds minimum thresholds
  const exceedsPointThreshold = Math.abs(scoreChange) >= ALERT_THRESHOLDS.SCORE_CHANGE_MIN;
  const exceedsPercentageThreshold = Math.abs(changePercentage) >= ALERT_THRESHOLDS.PERCENTAGE_CHANGE_MIN;

  return exceedsPointThreshold || exceedsPercentageThreshold;
}

/**
 * Generates an alert title based on the context
 */
export function generateAlertTitle(context: PredictiveAlertContext): string {
  const { brandName, trendDirection, scoreChange } = context;
  const direction = trendDirection === "up" ? "Increased" : "Decreased";
  const magnitude = Math.abs(scoreChange);

  if (magnitude >= ALERT_THRESHOLDS.CRITICAL_THRESHOLD) {
    return `🚨 Critical: ${brandName} GEO Score ${direction} by ${magnitude} Points`;
  } else if (magnitude >= ALERT_THRESHOLDS.HIGH_THRESHOLD) {
    return `⚠️ Alert: ${brandName} GEO Score ${direction} by ${magnitude} Points`;
  } else {
    return `📊 Notice: ${brandName} GEO Score ${direction} by ${magnitude} Points`;
  }
}

/**
 * Generates a detailed alert message
 */
export function generateAlertMessage(context: PredictiveAlertContext): string {
  const {
    brandName,
    currentScore,
    previousScore,
    scoreChange,
    changePercentage,
    trendDirection,
    timeframe,
  } = context;

  const direction = trendDirection === "up" ? "increased" : "decreased";
  const trend = trendDirection === "up" ? "positive" : "negative";

  return `Your brand "${brandName}" has shown a ${trend} trend over the ${timeframe}.

Current GEO Score: ${currentScore}
Previous Score: ${previousScore}
Change: ${scoreChange > 0 ? '+' : ''}${scoreChange} points (${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%)

The GEO score has ${direction} significantly, which may indicate changes in:
- AI platform visibility
- Brand mentions and citations
- Competitive positioning
- Content effectiveness

Review the detailed analytics to understand the factors driving this change.`;
}

/**
 * Generates action recommendations based on the alert context
 */
export function generateActionRecommendation(
  context: PredictiveAlertContext
): AlertRecommendation {
  const { scoreChange, trendDirection, changePercentage } = context;
  const magnitude = Math.abs(scoreChange);

  // Determine priority
  let priority: AlertRecommendation["priority"] = "low";
  if (magnitude >= ALERT_THRESHOLDS.CRITICAL_THRESHOLD) {
    priority = "critical";
  } else if (magnitude >= ALERT_THRESHOLDS.HIGH_THRESHOLD) {
    priority = "high";
  } else if (magnitude >= ALERT_THRESHOLDS.MEDIUM_THRESHOLD) {
    priority = "medium";
  }

  // Generate recommendations based on trend direction
  if (trendDirection === "down") {
    return {
      title: "Visibility Declining - Action Required",
      description: `Your GEO score has decreased by ${Math.abs(changePercentage).toFixed(1)}%, indicating reduced AI platform visibility.`,
      priority,
      actionItems: [
        "Review recent content changes that may have affected visibility",
        "Check competitor activity and positioning",
        "Analyze which AI platforms show the largest decline",
        "Update GEO keywords to better align with current search trends",
        "Increase content frequency and quality across monitored platforms",
        "Review and refresh brand value propositions",
      ],
      estimatedImpact: "Implementing these recommendations could recover 50-70% of lost visibility within 2-4 weeks",
    };
  } else {
    return {
      title: "Visibility Improving - Maintain Momentum",
      description: `Your GEO score has increased by ${changePercentage.toFixed(1)}%, showing positive brand momentum.`,
      priority,
      actionItems: [
        "Identify which strategies are driving the improvement",
        "Double down on successful content themes and formats",
        "Analyze which AI platforms are responding best",
        "Document successful tactics for future campaigns",
        "Consider expanding to additional AI platforms",
        "Monitor competitors to maintain competitive advantage",
      ],
      estimatedImpact: "Sustaining current strategies could lead to continued 10-15% monthly growth",
    };
  }
}

/**
 * Calculates alert priority based on multiple factors
 */
export function calculateAlertPriority(
  context: PredictiveAlertContext
): "low" | "medium" | "high" | "critical" {
  const magnitude = Math.abs(context.scoreChange);

  if (magnitude >= ALERT_THRESHOLDS.CRITICAL_THRESHOLD) {
    return "critical";
  } else if (magnitude >= ALERT_THRESHOLDS.HIGH_THRESHOLD) {
    return "high";
  } else if (magnitude >= ALERT_THRESHOLDS.MEDIUM_THRESHOLD) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Generates a complete alert object ready for notification system
 */
export function generatePredictiveAlert(context: PredictiveAlertContext) {
  if (!shouldTriggerPredictiveAlert(context)) {
    return null;
  }

  return {
    title: generateAlertTitle(context),
    message: generateAlertMessage(context),
    recommendation: generateActionRecommendation(context),
    priority: calculateAlertPriority(context),
    context,
    timestamp: new Date().toISOString(),
  };
}
