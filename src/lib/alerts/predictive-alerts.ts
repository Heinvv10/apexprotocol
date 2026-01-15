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

/**
 * Prediction object from database
 */
export interface Prediction {
  id: string;
  brandId: string;
  targetDate: Date;
  predictedValue: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidence: number;
  modelVersion: string;
}

/**
 * Result of evaluating whether a prediction should trigger an alert
 */
export interface PredictionAlertEvaluation {
  trigger: boolean;
  severity?: "info" | "warning" | "critical";
  leadTime?: number;
  reason?: string;
  percentageChange?: number;
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
 * Thresholds for prediction-based alerts
 */
const PREDICTION_THRESHOLDS = {
  MIN_CONFIDENCE: 0.70, // 70% confidence required
  CRITICAL_DROP: 30, // 30%+ drop = critical
  WARNING_DROP: 20, // 20-30% drop = warning
  MIN_DROP: 20, // Below 20% = no alert
};

/**
 * Evaluates a prediction to determine if it should trigger an alert
 */
function evaluatePredictionAlert(
  prediction: Prediction,
  currentScore: number
): PredictionAlertEvaluation {
  const { predictedValue, confidence, targetDate } = prediction;

  // Calculate percentage change
  const percentageChange = ((predictedValue - currentScore) / currentScore) * 100;
  const percentageDrop = -percentageChange; // Positive value for drops

  // Calculate lead time in days
  const now = new Date();
  const leadTime = Math.ceil(
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check confidence threshold
  if (confidence < PREDICTION_THRESHOLDS.MIN_CONFIDENCE) {
    return {
      trigger: false,
      reason: `Confidence ${(confidence * 100).toFixed(0)}% is below threshold`,
      percentageChange,
    };
  }

  // Check if drop is below minimum threshold
  if (percentageDrop < PREDICTION_THRESHOLDS.MIN_DROP) {
    return {
      trigger: false,
      reason: `Drop ${percentageDrop.toFixed(1)}% is below threshold`,
      percentageChange,
    };
  }

  // Determine severity based on drop magnitude
  let severity: "warning" | "critical";
  if (percentageDrop >= PREDICTION_THRESHOLDS.CRITICAL_DROP) {
    severity = "critical";
  } else {
    severity = "warning";
  }

  return {
    trigger: true,
    severity,
    leadTime,
    percentageChange,
  };
}

/**
 * Determines if a predictive alert should be triggered.
 *
 * Supports both:
 * 1. PredictiveAlertContext (for general alerts based on score changes)
 * 2. { prediction, currentScore } (for prediction-based alerts from database)
 */
export function shouldTriggerPredictiveAlert(
  input: PredictiveAlertContext | { prediction: Prediction; currentScore: number }
): boolean | PredictionAlertEvaluation {
  // Check if this is a prediction-based input
  if ("prediction" in input && "currentScore" in input) {
    return evaluatePredictionAlert(input.prediction, input.currentScore);
  }

  // Original behavior for PredictiveAlertContext
  const context = input as PredictiveAlertContext;
  const { scoreChange, changePercentage } = context;

  // Check if change exceeds minimum thresholds
  const exceedsPointThreshold = Math.abs(scoreChange) >= ALERT_THRESHOLDS.SCORE_CHANGE_MIN;
  const exceedsPercentageThreshold = Math.abs(changePercentage) >= ALERT_THRESHOLDS.PERCENTAGE_CHANGE_MIN;

  return exceedsPointThreshold || exceedsPercentageThreshold;
}

/**
 * Generates an alert title based on the context or evaluation
 */
export function generateAlertTitle(
  input: PredictiveAlertContext | PredictionAlertEvaluation
): string {
  // Check if this is a PredictionAlertEvaluation
  if ("trigger" in input) {
    const evaluation = input as PredictionAlertEvaluation;
    const severityEmoji = evaluation.severity === "critical" ? "🚨" : "⚠️";
    const severityText = evaluation.severity === "critical" ? "Critical" : "Warning";
    return `${severityEmoji} ${severityText}: Predicted GEO Score Drop`;
  }

  // Original behavior for PredictiveAlertContext
  const context = input as PredictiveAlertContext;
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
 *
 * Supports both:
 * 1. PredictiveAlertContext (single argument)
 * 2. (brandName, currentScore, prediction, evaluation) - for prediction-based alerts
 */
export function generateAlertMessage(
  inputOrBrandName: PredictiveAlertContext | string,
  currentScore?: number,
  prediction?: Prediction,
  evaluation?: PredictionAlertEvaluation
): string {
  // Check if this is a prediction-based call with multiple arguments
  if (typeof inputOrBrandName === "string" && currentScore !== undefined && prediction && evaluation) {
    const brandName = inputOrBrandName;
    const { predictedValue, targetDate } = prediction;
    const { severity, leadTime, percentageChange } = evaluation;

    const severityText = severity === "critical" ? "URGENT" : "Important";
    const formattedDate = targetDate.toLocaleDateString();

    return `${severityText}: Your brand "${brandName}" is predicted to experience a significant GEO score change.

Current Score: ${currentScore.toFixed(1)}
Predicted Score: ${predictedValue.toFixed(1)}
Expected Change: ${percentageChange?.toFixed(1)}%
Predicted Date: ${formattedDate}
Lead Time: ${leadTime} days

This prediction is based on trend analysis and historical patterns. Review your brand's performance metrics to prepare for this change.`;
  }

  // Original behavior for PredictiveAlertContext
  const context = inputOrBrandName as PredictiveAlertContext;
  const {
    brandName,
    currentScore: ctxCurrentScore,
    previousScore,
    scoreChange,
    changePercentage,
    trendDirection,
    timeframe,
  } = context;

  const direction = trendDirection === "up" ? "increased" : "decreased";
  const trend = trendDirection === "up" ? "positive" : "negative";

  return `Your brand "${brandName}" has shown a ${trend} trend over the ${timeframe}.

Current GEO Score: ${ctxCurrentScore}
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
 * Generates action recommendations based on alert context or evaluation
 */
export function generateActionRecommendation(
  input: PredictiveAlertContext | PredictionAlertEvaluation
): AlertRecommendation | string {
  // Check if this is a PredictionAlertEvaluation
  if ("trigger" in input) {
    const evaluation = input as PredictionAlertEvaluation;
    const isUrgent = evaluation.severity === "critical";
    return isUrgent
      ? "URGENT: Immediate action recommended. Review brand performance and implement optimization strategies."
      : "Important: Monitor closely and prepare optimization strategies.";
  }

  // Original behavior for PredictiveAlertContext
  const context = input as PredictiveAlertContext;
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
  const shouldTrigger = shouldTriggerPredictiveAlert(context);
  if (typeof shouldTrigger === "boolean" && !shouldTrigger) {
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
