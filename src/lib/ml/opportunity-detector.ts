/**
 * Emerging Opportunity Detection Algorithm
 * Identifies keywords and topics with predicted upward trends
 */

import type { ForecastPrediction } from "./forecaster";

/**
 * Entity types that can be analyzed for opportunities
 */
export type EntityType = "brand" | "keyword" | "topic" | "platform";

/**
 * Input entity with current score and predictions
 */
export interface OpportunityEntity {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  currentScore: number;
  predictions: ForecastPrediction[];
}

/**
 * Detected opportunity with impact and confidence scores
 */
export interface DetectedOpportunity {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  currentScore: number;
  predictedScore: number;
  impact: number; // Percentage change
  confidence: number; // 0-1 scale
  timeframe: number; // Days to predicted score
  targetDate: Date;
  trend: "increasing" | "decreasing" | "stable";
  explanation: string;
}

/**
 * Configuration for opportunity detection
 */
export interface OpportunityDetectionConfig {
  minConfidence?: number; // Minimum confidence threshold (default: 0.7)
  minImpact?: number; // Minimum impact percentage (default: 10%)
  maxResults?: number; // Maximum number of opportunities to return (default: 10)
  timeframePreference?: "short" | "medium" | "long"; // Prefer opportunities in certain timeframe
}

const DEFAULT_CONFIG: Required<OpportunityDetectionConfig> = {
  minConfidence: 0.7,
  minImpact: 10,
  maxResults: 10,
  timeframePreference: "medium",
};

/**
 * Calculate trend direction from current to predicted score
 *
 * @param currentScore - Current GEO score
 * @param predictedScore - Predicted GEO score
 * @returns Trend direction
 */
function calculateTrend(
  currentScore: number,
  predictedScore: number
): "increasing" | "decreasing" | "stable" {
  const percentChange = ((predictedScore - currentScore) / currentScore) * 100;

  // Threshold for "stable" is Â±5%
  if (Math.abs(percentChange) < 5) {
    return "stable";
  }

  return predictedScore > currentScore ? "increasing" : "decreasing";
}

/**
 * Generate explanation for why this is an opportunity
 *
 * @param opportunity - Detected opportunity
 * @returns Human-readable explanation
 */
function generateOpportunityExplanation(
  opportunity: Pick<
    DetectedOpportunity,
    "entityName" | "impact" | "confidence" | "timeframe" | "trend"
  >
): string {
  const { entityName, impact, confidence, timeframe, trend } = opportunity;

  if (trend !== "increasing") {
    return `${entityName} shows a ${trend} trend with ${impact.toFixed(1)}% change over ${timeframe} days.`;
  }

  const confidencePercent = (confidence * 100).toFixed(0);
  const timeframeDesc =
    timeframe <= 30 ? "short term" : timeframe <= 60 ? "medium term" : "long term";

  return `${entityName} shows strong ${timeframeDesc} growth potential with predicted ${impact.toFixed(1)}% increase over ${timeframe} days (${confidencePercent}% confidence).`;
}

/**
 * Detect emerging opportunities from entity predictions
 *
 * Algorithm:
 * 1. Run predictions for all tracked keywords/topics
 * 2. Filter for upward trend (predicted_value > current_value)
 * 3. Filter confidence >70%
 * 4. Rank by impact (magnitude * confidence)
 * 5. Return top 10
 *
 * @param entities - Array of entities with predictions
 * @param config - Detection configuration
 * @returns Detected opportunities ranked by impact
 */
export function detectOpportunities(
  entities: OpportunityEntity[],
  config: OpportunityDetectionConfig = {}
): DetectedOpportunity[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const opportunities: DetectedOpportunity[] = [];

  // Process each entity
  for (const entity of entities) {
    if (entity.predictions.length === 0) {
      continue;
    }

    // Determine which prediction to use based on timeframe preference
    let targetPrediction: ForecastPrediction;
    let timeframe: number;

    if (mergedConfig.timeframePreference === "short") {
      // Use 30-day prediction (or closest available)
      const index = Math.min(29, entity.predictions.length - 1);
      targetPrediction = entity.predictions[index];
      timeframe = index + 1;
    } else if (mergedConfig.timeframePreference === "long") {
      // Use final prediction
      targetPrediction = entity.predictions[entity.predictions.length - 1];
      timeframe = entity.predictions.length;
    } else {
      // Use 60-day prediction (or closest available)
      const index = Math.min(59, entity.predictions.length - 1);
      targetPrediction = entity.predictions[index];
      timeframe = index + 1;
    }

    const predictedScore = targetPrediction.predictedValue;
    const confidence = targetPrediction.confidence;

    // Step 1: Filter for upward trend
    const isUpwardTrend = predictedScore > entity.currentScore;
    if (!isUpwardTrend) {
      continue;
    }

    // Step 2: Filter for minimum confidence
    if (confidence < mergedConfig.minConfidence) {
      continue;
    }

    // Calculate impact (percentage change)
    const impact = ((predictedScore - entity.currentScore) / entity.currentScore) * 100;

    // Step 3: Filter for minimum impact
    if (impact < mergedConfig.minImpact) {
      continue;
    }

    // Calculate trend
    const trend = calculateTrend(entity.currentScore, predictedScore);

    // Create opportunity
    const opportunity: DetectedOpportunity = {
      entityType: entity.entityType,
      entityId: entity.entityId,
      entityName: entity.entityName,
      currentScore: entity.currentScore,
      predictedScore,
      impact,
      confidence,
      timeframe,
      targetDate: targetPrediction.date,
      trend,
      explanation: "", // Will be filled after
    };

    // Generate explanation
    opportunity.explanation = generateOpportunityExplanation(opportunity);

    opportunities.push(opportunity);
  }

  // Step 4: Rank by impact score (impact * confidence)
  opportunities.sort((a, b) => {
    const scoreA = a.impact * a.confidence;
    const scoreB = b.impact * b.confidence;
    return scoreB - scoreA; // Descending order
  });

  // Step 5: Return top N opportunities
  return opportunities.slice(0, mergedConfig.maxResults);
}

/**
 * Filter opportunities by entity type
 *
 * @param opportunities - Detected opportunities
 * @param entityType - Entity type to filter by
 * @returns Filtered opportunities
 */
export function filterByEntityType(
  opportunities: DetectedOpportunity[],
  entityType: EntityType
): DetectedOpportunity[] {
  return opportunities.filter((opp) => opp.entityType === entityType);
}

/**
 * Get opportunity summary statistics
 *
 * @param opportunities - Detected opportunities
 * @returns Summary statistics
 */
export function getOpportunitySummary(opportunities: DetectedOpportunity[]): {
  totalOpportunities: number;
  averageImpact: number;
  averageConfidence: number;
  byEntityType: Record<EntityType, number>;
  topOpportunity: DetectedOpportunity | null;
} {
  if (opportunities.length === 0) {
    return {
      totalOpportunities: 0,
      averageImpact: 0,
      averageConfidence: 0,
      byEntityType: {
        brand: 0,
        keyword: 0,
        topic: 0,
        platform: 0,
      },
      topOpportunity: null,
    };
  }

  const impacts = opportunities.map((o) => o.impact);
  const confidences = opportunities.map((o) => o.confidence);

  const averageImpact = impacts.reduce((a, b) => a + b, 0) / impacts.length;
  const averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const byEntityType: Record<EntityType, number> = {
    brand: 0,
    keyword: 0,
    topic: 0,
    platform: 0,
  };

  for (const opp of opportunities) {
    byEntityType[opp.entityType]++;
  }

  return {
    totalOpportunities: opportunities.length,
    averageImpact,
    averageConfidence,
    byEntityType,
    topOpportunity: opportunities[0] || null,
  };
}

/**
 * Calculate combined opportunity score (impact * confidence)
 *
 * @param opportunity - Detected opportunity
 * @returns Combined score
 */
export function calculateOpportunityScore(opportunity: DetectedOpportunity): number {
  return opportunity.impact * opportunity.confidence;
}

/**
 * Check if an opportunity meets quality threshold
 *
 * @param opportunity - Detected opportunity
 * @param minConfidence - Minimum confidence threshold
 * @param minImpact - Minimum impact threshold
 * @returns Whether opportunity meets thresholds
 */
export function isHighQualityOpportunity(
  opportunity: DetectedOpportunity,
  minConfidence: number = 0.7,
  minImpact: number = 10
): boolean {
  return opportunity.confidence >= minConfidence && opportunity.impact >= minImpact;
}
