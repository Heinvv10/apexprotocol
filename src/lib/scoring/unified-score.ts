/**
 * Unified Digital Presence Score Calculator (Updated Phase 7.3)
 * Combines SEO + GEO + AEO + SMO + PPO into a single comprehensive score
 *
 * Formula (Phase 7 Update):
 *   Digital Presence Score = (SEO × 0.25) + (GEO × 0.25) + (AEO × 0.15) + (SMO × 0.20) + (PPO × 0.15)
 *
 * Components:
 * - SEO: Search engine visibility (Google/Bing rankings)
 * - GEO: Generative Engine Optimization (AI platform visibility)
 * - AEO: Answer Engine Optimization (featured snippets, zero-click)
 * - SMO: Social Media Optimization (social reach, engagement, sentiment)
 * - PPO: People Presence Optimization (leadership visibility, thought leadership)
 */

import { calculateSEOScore, SEOScoreInput, SEOScoreResult } from "./seo-score";
import { calculateAEOScore, AEOScoreInput, AEOScoreResult } from "./aeo-score";
import { calculateSMOScore, SMOScoreInput, SMOScoreResult } from "./social-score";
import { calculatePPOScore, PPOScoreInput, PPOScoreResult } from "./people-score";

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
  smo?: SMOScoreInput;
  ppo?: PPOScoreInput;
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
    smo?: SMOScoreResult;
    ppo?: PPOScoreResult;
  };
  weights: {
    seo: number;
    geo: number;
    aeo: number;
    smo: number;
    ppo: number;
  };
  insights: string[];
  priorityActions: string[];
}

// Score weights (Phase 7 Update)
// When SMO/PPO are available, use 5-component formula
// When not available (legacy), fall back to 3-component formula
const WEIGHTS_FULL = {
  seo: 0.25,
  geo: 0.25,
  aeo: 0.15,
  smo: 0.20,
  ppo: 0.15,
};

// Legacy weights (no social/people data)
const WEIGHTS_LEGACY = {
  seo: 0.40,
  geo: 0.35,
  aeo: 0.25,
  smo: 0,
  ppo: 0,
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
 * Supports both 3-component (legacy) and 5-component (Phase 7) modes
 */
export function calculateUnifiedScore(
  input: UnifiedScoreInput,
  previousScore?: number
): UnifiedScoreResult {
  // Calculate individual scores (always calculate SEO, GEO, AEO)
  const seoResult = calculateSEOScore(input.seo);
  const geoResult = calculateGEOScore(input.geo);
  const aeoResult = calculateAEOScore(input.aeo);

  // Calculate SMO and PPO if inputs are provided
  const smoResult = input.smo ? calculateSMOScore(input.smo) : undefined;
  const ppoResult = input.ppo ? calculatePPOScore(input.ppo) : undefined;

  // Determine which weights to use
  const hasSocialAndPeople = smoResult && ppoResult;
  const weights = hasSocialAndPeople ? WEIGHTS_FULL : WEIGHTS_LEGACY;

  // Calculate weighted overall score
  let overall: number;
  if (hasSocialAndPeople) {
    overall = Math.round(
      seoResult.score * weights.seo +
      geoResult.score * weights.geo +
      aeoResult.score * weights.aeo +
      smoResult.score * weights.smo +
      ppoResult.score * weights.ppo
    );
  } else {
    overall = Math.round(
      seoResult.score * weights.seo +
      geoResult.score * weights.geo +
      aeoResult.score * weights.aeo
    );
  }

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

  // Identify strongest and weakest components
  const scores: Record<string, number> = {
    seo: seoResult.score,
    geo: geoResult.score,
    aeo: aeoResult.score,
  };
  if (smoResult) scores.smo = smoResult.score;
  if (ppoResult) scores.ppo = ppoResult.score;

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

  // Additional insights for 5-component mode
  if (hasSocialAndPeople) {
    if (smoResult.score < 50) {
      insights.push("Social media presence needs attention - consider increasing activity");
    }
    if (ppoResult.score < 50) {
      insights.push("Leadership visibility is low - build executive profiles and thought leadership");
    }
  } else {
    insights.push("Connect social accounts and add team members for complete analysis");
  }

  // Compile priority actions from all components
  const priorityActions = [
    ...seoResult.recommendations.slice(0, 1),
    ...geoResult.recommendations.slice(0, 1),
    ...aeoResult.recommendations.slice(0, 1),
    ...(smoResult?.recommendations.slice(0, 1) || []),
    ...(ppoResult?.recommendations.slice(0, 1) || []),
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
      smo: smoResult,
      ppo: ppoResult,
    },
    weights,
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
