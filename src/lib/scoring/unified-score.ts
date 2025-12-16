/**
 * Unified Digital Presence Score Calculator
 * Combines SEO + GEO + AEO into a single comprehensive score
 *
 * Formula: Digital Presence Score = (SEO * 0.4) + (GEO * 0.35) + (AEO * 0.25)
 */

import { calculateSEOScore, SEOScoreInput, SEOScoreResult } from "./seo-score";
import { calculateAEOScore, AEOScoreInput, AEOScoreResult } from "./aeo-score";

export interface GEOScoreInput {
  totalMentions: number;
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
  citationCount: number;
  platformCount: number;
  uniquePlatforms: string[];
}

export interface GEOScoreResult {
  score: number;
  breakdown: {
    visibility: number;
    sentiment: number;
    citations: number;
    coverage: number;
  };
  recommendations: string[];
}

export interface UnifiedScoreInput {
  seo: SEOScoreInput;
  geo: GEOScoreInput;
  aeo: AEOScoreInput;
}

export interface UnifiedScoreResult {
  overall: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  trend: "up" | "down" | "stable";
  change: number;
  components: {
    seo: SEOScoreResult;
    geo: GEOScoreResult;
    aeo: AEOScoreResult;
  };
  weights: {
    seo: number;
    geo: number;
    aeo: number;
  };
  insights: string[];
  priorityActions: string[];
}

// Score weights
const WEIGHTS = {
  seo: 0.4,
  geo: 0.35,
  aeo: 0.25,
};

// Grade thresholds
const GRADE_THRESHOLDS = {
  "A+": 95,
  A: 85,
  B: 70,
  C: 55,
  D: 40,
  F: 0,
};

/**
 * Calculate GEO (Generative Engine Optimization) Score
 * Based on AI platform mentions, sentiment, and citations
 */
export function calculateGEOScore(input: GEOScoreInput): GEOScoreResult {
  const {
    totalMentions,
    positiveMentions,
    neutralMentions,
    negativeMentions,
    citationCount,
    platformCount,
    uniquePlatforms,
  } = input;

  // Visibility Score (0-100): Based on total mentions
  // Logarithmic scale: 100 mentions = 100 score
  const visibilityScore = Math.min(
    100,
    totalMentions > 0 ? Math.round(Math.log10(totalMentions + 1) * 50) : 0
  );

  // Sentiment Score (0-100): Weighted sentiment analysis
  const totalSentimentMentions = positiveMentions + neutralMentions + negativeMentions;
  let sentimentScore = 50; // Default neutral
  if (totalSentimentMentions > 0) {
    const positiveWeight = 1.0;
    const neutralWeight = 0.5;
    const negativeWeight = 0.0;
    sentimentScore = Math.round(
      ((positiveMentions * positiveWeight +
        neutralMentions * neutralWeight +
        negativeMentions * negativeWeight) /
        totalSentimentMentions) *
        100
    );
  }

  // Citation Score (0-100): Based on citation rate
  const citationRate = totalMentions > 0 ? citationCount / totalMentions : 0;
  const citationScore = Math.min(100, Math.round(citationRate * 100) + 20);

  // Coverage Score (0-100): Based on platform diversity
  // 7 platforms max (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot)
  const maxPlatforms = 7;
  const coverageScore = Math.min(100, Math.round((platformCount / maxPlatforms) * 100));

  // Combined GEO Score (weighted average)
  const geoScore = Math.round(
    visibilityScore * 0.25 +
    sentimentScore * 0.35 +
    citationScore * 0.25 +
    coverageScore * 0.15
  );

  // Generate recommendations
  const recommendations: string[] = [];
  if (visibilityScore < 50) {
    recommendations.push("Increase brand presence across AI platforms through content optimization");
  }
  if (sentimentScore < 60) {
    recommendations.push("Address negative mentions and improve brand messaging");
  }
  if (citationScore < 50) {
    recommendations.push("Create more citeable content with authoritative sources");
  }
  if (coverageScore < 70) {
    const missingPlatforms = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok", "DeepSeek", "Copilot"]
      .filter(p => !uniquePlatforms.includes(p.toLowerCase()));
    if (missingPlatforms.length > 0) {
      recommendations.push(`Expand presence to: ${missingPlatforms.slice(0, 3).join(", ")}`);
    }
  }

  return {
    score: geoScore,
    breakdown: {
      visibility: visibilityScore,
      sentiment: sentimentScore,
      citations: citationScore,
      coverage: coverageScore,
    },
    recommendations,
  };
}

/**
 * Calculate the Unified Digital Presence Score
 */
export function calculateUnifiedScore(
  input: UnifiedScoreInput,
  previousScore?: number
): UnifiedScoreResult {
  // Calculate individual scores
  const seoResult = calculateSEOScore(input.seo);
  const geoResult = calculateGEOScore(input.geo);
  const aeoResult = calculateAEOScore(input.aeo);

  // Calculate weighted overall score
  const overall = Math.round(
    seoResult.score * WEIGHTS.seo +
    geoResult.score * WEIGHTS.geo +
    aeoResult.score * WEIGHTS.aeo
  );

  // Determine grade
  let grade: UnifiedScoreResult["grade"] = "F";
  for (const [g, threshold] of Object.entries(GRADE_THRESHOLDS)) {
    if (overall >= threshold) {
      grade = g as UnifiedScoreResult["grade"];
      break;
    }
  }

  // Calculate trend
  const change = previousScore !== undefined ? overall - previousScore : 0;
  let trend: UnifiedScoreResult["trend"] = "stable";
  if (change > 2) trend = "up";
  else if (change < -2) trend = "down";

  // Generate insights
  const insights: string[] = [];

  // Identify strongest component
  const scores = { seo: seoResult.score, geo: geoResult.score, aeo: aeoResult.score };
  const strongest = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
  const weakest = Object.entries(scores).reduce((a, b) => (a[1] < b[1] ? a : b));

  insights.push(`Strongest area: ${strongest[0].toUpperCase()} (${strongest[1]})`);
  insights.push(`Area needing attention: ${weakest[0].toUpperCase()} (${weakest[1]})`);

  if (overall >= 80) {
    insights.push("Excellent digital presence - focus on maintaining leadership");
  } else if (overall >= 60) {
    insights.push("Good foundation - targeted improvements can boost visibility significantly");
  } else {
    insights.push("Significant opportunity for improvement across all channels");
  }

  // Compile priority actions from all components
  const priorityActions = [
    ...seoResult.recommendations.slice(0, 2),
    ...geoResult.recommendations.slice(0, 2),
    ...aeoResult.recommendations.slice(0, 2),
  ].slice(0, 5);

  return {
    overall,
    grade,
    trend,
    change,
    components: {
      seo: seoResult,
      geo: geoResult,
      aeo: aeoResult,
    },
    weights: WEIGHTS,
    insights,
    priorityActions,
  };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E"; // Green
  if (score >= 60) return "#00E5CC"; // Cyan
  if (score >= 40) return "#F59E0B"; // Amber
  return "#EF4444"; // Red
}

/**
 * Get grade color
 */
export function getGradeColor(grade: UnifiedScoreResult["grade"]): string {
  const colors: Record<UnifiedScoreResult["grade"], string> = {
    "A+": "#22C55E",
    A: "#22C55E",
    B: "#00E5CC",
    C: "#F59E0B",
    D: "#F97316",
    F: "#EF4444",
  };
  return colors[grade];
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toFixed(0);
}

/**
 * Get score status text
 */
export function getScoreStatus(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Moderate";
  if (score >= 50) return "Fair";
  if (score >= 40) return "Needs Improvement";
  return "Critical";
}
