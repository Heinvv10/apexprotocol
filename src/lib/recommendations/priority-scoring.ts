/**
 * Priority Scoring Module (F107)
 * Score recommendations by impact (40%), effort (30%), urgency (20%), confidence (10%)
 */

import {
  Recommendation,
  PriorityWeights,
  PriorityLevel,
  RecommendationImpact,
  RecommendationEffort,
} from "./types";

// Default weights as specified in F107
export const DEFAULT_WEIGHTS: PriorityWeights = {
  impact: 0.40,    // 40%
  effort: 0.30,    // 30%
  urgency: 0.20,   // 20%
  confidence: 0.10, // 10%
};

/**
 * Calculate priority score for a recommendation
 * Higher score = higher priority
 */
export function calculatePriorityScore(
  impact: number,
  effort: number,
  urgency: number,
  confidence: number,
  weights: PriorityWeights = DEFAULT_WEIGHTS
): number {
  // Normalize all scores to 0-100
  const normalizedImpact = Math.min(100, Math.max(0, impact));
  const normalizedEffort = Math.min(100, Math.max(0, 100 - effort)); // Invert: lower effort = higher score
  const normalizedUrgency = Math.min(100, Math.max(0, urgency));
  const normalizedConfidence = Math.min(100, Math.max(0, confidence));

  // Calculate weighted score
  const score =
    normalizedImpact * weights.impact +
    normalizedEffort * weights.effort +
    normalizedUrgency * weights.urgency +
    normalizedConfidence * weights.confidence;

  return Math.round(score * 100) / 100;
}

/**
 * Determine priority level based on score
 */
export function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

/**
 * Calculate impact score from various factors
 */
export function calculateImpactScore(factors: {
  reachPercentage?: number; // Percentage of users affected
  severityLevel?: "critical" | "high" | "medium" | "low";
  aiPlatformCount?: number; // Number of AI platforms affected
  potentialTrafficGain?: number; // Estimated traffic improvement %
  competitiveGap?: number; // Gap vs competitors (0-100)
}): RecommendationImpact {
  let score = 50; // Base score

  // Adjust for reach (how many users affected)
  if (factors.reachPercentage !== undefined) {
    score += (factors.reachPercentage / 100) * 20;
  }

  // Adjust for severity
  if (factors.severityLevel) {
    const severityBonus = {
      critical: 25,
      high: 15,
      medium: 5,
      low: 0,
    };
    score += severityBonus[factors.severityLevel];
  }

  // Adjust for AI platform coverage
  if (factors.aiPlatformCount !== undefined) {
    score += Math.min(factors.aiPlatformCount * 5, 15); // Max 15 points for 3+ platforms
  }

  // Adjust for potential traffic gain
  if (factors.potentialTrafficGain !== undefined) {
    score += Math.min(factors.potentialTrafficGain / 10, 10); // Max 10 points
  }

  // Adjust for competitive gap
  if (factors.competitiveGap !== undefined) {
    score += (factors.competitiveGap / 100) * 10;
  }

  score = Math.min(100, Math.max(0, score));

  const affectedMetrics: string[] = [];
  if (factors.aiPlatformCount && factors.aiPlatformCount > 0) {
    affectedMetrics.push("ai_visibility");
  }
  if (factors.potentialTrafficGain && factors.potentialTrafficGain > 0) {
    affectedMetrics.push("organic_traffic");
  }
  if (factors.competitiveGap && factors.competitiveGap > 0) {
    affectedMetrics.push("competitive_position");
  }

  return {
    score: Math.round(score),
    description: getImpactDescription(score),
    expectedOutcome: getExpectedOutcome(score, factors),
    affectedMetrics,
  };
}

/**
 * Calculate effort score from various factors
 */
export function calculateEffortScore(factors: {
  technicalComplexity?: "simple" | "moderate" | "complex" | "expert";
  timeRequirement?: "minutes" | "hours" | "days" | "weeks";
  requiredResources?: string[];
  automationPossible?: boolean;
  codeChangesRequired?: boolean;
}): RecommendationEffort {
  let score = 50; // Base score (50 = moderate effort)

  // Adjust for technical complexity
  if (factors.technicalComplexity) {
    const complexityScores = {
      simple: 20,
      moderate: 50,
      complex: 75,
      expert: 95,
    };
    score = complexityScores[factors.technicalComplexity];
  }

  // Adjust for time requirement
  if (factors.timeRequirement) {
    const timeBonus = {
      minutes: -20,
      hours: 0,
      days: 15,
      weeks: 30,
    };
    score += timeBonus[factors.timeRequirement];
  }

  // Adjust for automation
  if (factors.automationPossible === true) {
    score -= 15; // Easier if automated
  }

  // Adjust for code changes
  if (factors.codeChangesRequired === true) {
    score += 10; // Harder if code changes needed
  }

  score = Math.min(100, Math.max(0, score));

  const requiredSkills = factors.requiredResources || [];
  if (factors.codeChangesRequired && !requiredSkills.includes("developer")) {
    requiredSkills.push("developer");
  }

  return {
    score: Math.round(score),
    description: getEffortDescription(score),
    estimatedTime: factors.timeRequirement || "hours",
    requiredSkills,
  };
}

/**
 * Calculate urgency score from time-sensitive factors
 */
export function calculateUrgencyScore(factors: {
  isTimeSensitive?: boolean;
  competitorActivity?: boolean;
  trendingTopic?: boolean;
  algorithmUpdate?: boolean;
  seasonalRelevance?: number; // 0-100
  daysSinceDetected?: number;
}): number {
  let score = 30; // Base urgency

  // Time sensitivity
  if (factors.isTimeSensitive) {
    score += 25;
  }

  // Competitor activity
  if (factors.competitorActivity) {
    score += 20;
  }

  // Trending topic
  if (factors.trendingTopic) {
    score += 15;
  }

  // Algorithm update
  if (factors.algorithmUpdate) {
    score += 20;
  }

  // Seasonal relevance
  if (factors.seasonalRelevance !== undefined) {
    score += (factors.seasonalRelevance / 100) * 15;
  }

  // Decay based on age (older issues may be less urgent)
  if (factors.daysSinceDetected !== undefined) {
    if (factors.daysSinceDetected < 1) {
      score += 10; // Very recent
    } else if (factors.daysSinceDetected > 30) {
      score -= 10; // Old issue
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculate confidence score based on data quality
 */
export function calculateConfidenceScore(factors: {
  dataPoints?: number;
  dataRecency?: "realtime" | "daily" | "weekly" | "monthly";
  sourceReliability?: number; // 0-100
  crossValidated?: boolean;
  historicalAccuracy?: number; // 0-100
}): number {
  let score = 50; // Base confidence

  // More data points = higher confidence
  if (factors.dataPoints !== undefined) {
    if (factors.dataPoints >= 100) score += 20;
    else if (factors.dataPoints >= 50) score += 15;
    else if (factors.dataPoints >= 10) score += 10;
    else score += 5;
  }

  // Data recency
  if (factors.dataRecency) {
    const recencyBonus = {
      realtime: 15,
      daily: 10,
      weekly: 5,
      monthly: 0,
    };
    score += recencyBonus[factors.dataRecency];
  }

  // Source reliability
  if (factors.sourceReliability !== undefined) {
    score += (factors.sourceReliability / 100) * 10;
  }

  // Cross validation
  if (factors.crossValidated === true) {
    score += 10;
  }

  // Historical accuracy
  if (factors.historicalAccuracy !== undefined) {
    score += (factors.historicalAccuracy / 100) * 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Sort recommendations by priority score
 */
export function sortByPriority(
  recommendations: Recommendation[],
  weights?: PriorityWeights
): Recommendation[] {
  return [...recommendations].sort((a, b) => {
    const scoreA = calculatePriorityScore(
      a.impact.score,
      a.effort.score,
      a.urgency,
      a.confidence,
      weights
    );
    const scoreB = calculatePriorityScore(
      b.impact.score,
      b.effort.score,
      b.urgency,
      b.confidence,
      weights
    );
    return scoreB - scoreA; // Descending order
  });
}

/**
 * Filter recommendations by minimum priority level
 */
export function filterByPriorityLevel(
  recommendations: Recommendation[],
  minLevel: PriorityLevel
): Recommendation[] {
  const levelOrder: Record<PriorityLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const minOrder = levelOrder[minLevel];
  return recommendations.filter((r) => levelOrder[r.priority] >= minOrder);
}

/**
 * Group recommendations by priority level
 */
export function groupByPriority(
  recommendations: Recommendation[]
): Record<PriorityLevel, Recommendation[]> {
  const groups: Record<PriorityLevel, Recommendation[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const rec of recommendations) {
    groups[rec.priority].push(rec);
  }

  // Sort within each group
  for (const level of Object.keys(groups) as PriorityLevel[]) {
    groups[level].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  return groups;
}

// Helper functions

function getImpactDescription(score: number): string {
  if (score >= 80) return "Critical impact on AI visibility and brand presence";
  if (score >= 60) return "High impact on search performance and user engagement";
  if (score >= 40) return "Moderate impact on content optimization";
  return "Low impact but contributes to overall optimization";
}

function getExpectedOutcome(
  score: number,
  factors: {
    potentialTrafficGain?: number;
    aiPlatformCount?: number;
  }
): string {
  const outcomes: string[] = [];

  if (factors.potentialTrafficGain && factors.potentialTrafficGain > 0) {
    outcomes.push(`Up to ${factors.potentialTrafficGain}% improvement in traffic`);
  }

  if (factors.aiPlatformCount && factors.aiPlatformCount > 0) {
    outcomes.push(`Better visibility on ${factors.aiPlatformCount} AI platforms`);
  }

  if (score >= 80) {
    outcomes.push("Significant improvement in AI search rankings");
  } else if (score >= 60) {
    outcomes.push("Notable improvement in content discoverability");
  }

  return outcomes.length > 0 ? outcomes.join(". ") : "General optimization benefits";
}

function getEffortDescription(score: number): string {
  if (score >= 80) return "Complex implementation requiring expert resources";
  if (score >= 60) return "Moderate effort with technical requirements";
  if (score >= 40) return "Reasonable effort for most teams";
  if (score >= 20) return "Quick implementation with minimal effort";
  return "Simple task that can be completed quickly";
}
