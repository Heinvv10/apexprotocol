/**
 * Effectiveness Calculation Module
 * Calculate recommendation effectiveness scores based on GEO score improvements
 */

// Types for effectiveness calculation inputs/outputs

export type RecommendationPriority = "high" | "medium" | "low";

export interface EffectivenessInput {
  baselineScore: number;
  postImplementationScore: number;
  implementationDays: number;
  priority: RecommendationPriority;
}

export interface EffectivenessResult {
  effectivenessScore: number;
  scoreImprovement: number;
  improvementPercentage: number;
  timeEfficiencyScore: number;
  priorityBonus: number;
  details: {
    maxPossibleImprovement: number;
    expectedDays: number;
    wasCompletedOnTime: boolean;
  };
}

export interface AggregateMetrics {
  totalCompleted: number;
  averageEffectiveness: number;
  averageScoreImprovement: number;
  totalPositiveImprovements: number;
  totalNegativeImprovements: number;
}

// Default expected implementation days by priority
export const DEFAULT_EXPECTED_DAYS: Record<RecommendationPriority, number> = {
  high: 7,
  medium: 14,
  low: 30,
};

// Priority bonus scores (10% weight)
export const PRIORITY_BONUS: Record<RecommendationPriority, number> = {
  high: 10,
  medium: 6,
  low: 3,
};

// Weight configuration for effectiveness calculation
export const EFFECTIVENESS_WEIGHTS = {
  scoreImprovement: 0.70, // 70%
  timeEfficiency: 0.20,   // 20%
  priorityBonus: 0.10,    // 10%
};

/**
 * Calculate the score improvement (delta) between baseline and post-implementation scores
 * Can be negative if the score decreased after implementation
 */
export function calculateScoreImprovement(
  postImplementationScore: number,
  baselineScore: number
): number {
  // Validate inputs
  if (!isValidScore(postImplementationScore) || !isValidScore(baselineScore)) {
    return 0;
  }

  return postImplementationScore - baselineScore;
}

/**
 * Calculate the improvement percentage relative to baseline
 * Returns 0 if baseline is 0 to avoid division by zero
 */
export function calculateImprovementPercentage(
  scoreImprovement: number,
  baselineScore: number
): number {
  if (baselineScore === 0) {
    // If baseline was 0 and we improved, return 100%; otherwise 0%
    return scoreImprovement > 0 ? 100 : 0;
  }

  return Math.round((scoreImprovement / baselineScore) * 100 * 100) / 100;
}

/**
 * Calculate the time efficiency score based on implementation speed
 * Faster implementation = higher score
 */
export function calculateTimeEfficiencyScore(
  implementationDays: number,
  priority: RecommendationPriority
): number {
  const expectedDays = DEFAULT_EXPECTED_DAYS[priority];

  // Handle edge case: implementation took 0 or negative days
  if (implementationDays <= 0) {
    implementationDays = 1; // Minimum 1 day
  }

  // Calculate time efficiency (faster = higher score)
  // If completed in expected time or less, get full/bonus points
  // If completed slower, score decreases but stays non-negative
  const efficiency = (expectedDays - implementationDays) / expectedDays;

  // Scale to 0-20 range (20% weight)
  const score = efficiency * 20;

  // Clamp to 0-20 range
  return Math.max(0, Math.min(20, Math.round(score * 100) / 100));
}

/**
 * Calculate the full effectiveness score for a recommendation
 * Formula:
 * - 70% based on score improvement relative to max possible improvement
 * - 20% based on time efficiency (faster implementation = higher score)
 * - 10% based on priority bonus
 *
 * Returns a score from 0-100
 */
export function calculateEffectivenessScore(
  baselineScore: number,
  postImplementationScore: number,
  implementationDays: number,
  priority: RecommendationPriority
): number {
  // Validate inputs
  if (!isValidScore(baselineScore) || !isValidScore(postImplementationScore)) {
    return 0;
  }

  // Calculate score improvement
  const scoreImprovement = calculateScoreImprovement(postImplementationScore, baselineScore);

  // If score decreased, effectiveness is 0
  if (scoreImprovement < 0) {
    return 0;
  }

  // Calculate improvement score (70% weight)
  const maxPossibleImprovement = 100 - baselineScore;
  let improvementScore = 0;

  if (maxPossibleImprovement > 0) {
    // Scale actual improvement to the max possible improvement
    improvementScore = (scoreImprovement / maxPossibleImprovement) * 70;
  } else if (baselineScore === 100 && postImplementationScore === 100) {
    // Already at max, give partial credit for maintaining
    improvementScore = 35; // 50% of the improvement weight
  }

  // Calculate time efficiency score (20% weight)
  const timeScore = calculateTimeEfficiencyScore(implementationDays, priority);

  // Get priority bonus (10% weight)
  const priorityBonus = PRIORITY_BONUS[priority];

  // Sum all components
  const totalScore = improvementScore + timeScore + priorityBonus;

  // Clamp to 0-100 range and round
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}

/**
 * Calculate full effectiveness result with detailed breakdown
 */
export function calculateEffectivenessResult(
  input: EffectivenessInput
): EffectivenessResult {
  const { baselineScore, postImplementationScore, implementationDays, priority } = input;

  const scoreImprovement = calculateScoreImprovement(postImplementationScore, baselineScore);
  const improvementPercentage = calculateImprovementPercentage(scoreImprovement, baselineScore);
  const timeEfficiencyScore = calculateTimeEfficiencyScore(implementationDays, priority);
  const priorityBonus = PRIORITY_BONUS[priority];
  const effectivenessScore = calculateEffectivenessScore(
    baselineScore,
    postImplementationScore,
    implementationDays,
    priority
  );

  const expectedDays = DEFAULT_EXPECTED_DAYS[priority];
  const maxPossibleImprovement = 100 - baselineScore;

  return {
    effectivenessScore,
    scoreImprovement,
    improvementPercentage,
    timeEfficiencyScore,
    priorityBonus,
    details: {
      maxPossibleImprovement,
      expectedDays,
      wasCompletedOnTime: implementationDays <= expectedDays,
    },
  };
}

/**
 * Calculate aggregate metrics from multiple recommendations
 */
export function calculateAggregateMetrics(
  recommendations: Array<{
    effectivenessScore: number | null;
    scoreImprovement: number | null;
  }>
): AggregateMetrics {
  const completed = recommendations.filter(
    (r) => r.effectivenessScore !== null && r.scoreImprovement !== null
  );

  if (completed.length === 0) {
    return {
      totalCompleted: 0,
      averageEffectiveness: 0,
      averageScoreImprovement: 0,
      totalPositiveImprovements: 0,
      totalNegativeImprovements: 0,
    };
  }

  const totalEffectiveness = completed.reduce(
    (sum, r) => sum + (r.effectivenessScore || 0),
    0
  );
  const totalImprovement = completed.reduce(
    (sum, r) => sum + (r.scoreImprovement || 0),
    0
  );

  const positiveImprovements = completed.filter(
    (r) => (r.scoreImprovement || 0) > 0
  ).length;
  const negativeImprovements = completed.filter(
    (r) => (r.scoreImprovement || 0) < 0
  ).length;

  return {
    totalCompleted: completed.length,
    averageEffectiveness: Math.round((totalEffectiveness / completed.length) * 10) / 10,
    averageScoreImprovement: Math.round((totalImprovement / completed.length) * 10) / 10,
    totalPositiveImprovements: positiveImprovements,
    totalNegativeImprovements: negativeImprovements,
  };
}

/**
 * Get effectiveness level description based on score
 */
export function getEffectivenessLevel(
  score: number
): "excellent" | "good" | "moderate" | "poor" | "ineffective" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "moderate";
  if (score >= 20) return "poor";
  return "ineffective";
}

/**
 * Get human-readable effectiveness description
 */
export function getEffectivenessDescription(score: number): string {
  if (score >= 80) {
    return "Excellent effectiveness - recommendation significantly improved GEO score";
  }
  if (score >= 60) {
    return "Good effectiveness - recommendation provided solid improvements";
  }
  if (score >= 40) {
    return "Moderate effectiveness - recommendation had some positive impact";
  }
  if (score >= 20) {
    return "Poor effectiveness - recommendation had limited impact";
  }
  return "Ineffective - recommendation did not improve GEO score";
}

// Helper functions

/**
 * Validate that a score is within valid range (0-100)
 */
function isValidScore(score: number): boolean {
  return (
    typeof score === "number" &&
    !isNaN(score) &&
    isFinite(score) &&
    score >= 0 &&
    score <= 100
  );
}

/**
 * Clamp a value to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
