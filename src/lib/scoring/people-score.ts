/**
 * People Presence Optimization (PPO) Score Calculator (Phase 7.3)
 *
 * Calculates a comprehensive people/leadership presence score based on:
 * - Executive Visibility: Leadership profiles and social presence
 * - Thought Leadership: Publications, speaking, media appearances
 * - AI Mentions: Leadership mentions in AI platforms
 * - Social Engagement: Combined social following of key people
 */

import type { PersonScoreBreakdown } from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

export interface PPOScoreInput {
  /** Total people being tracked */
  totalPeopleTracked: number;
  /** Number of executives (C-suite, founders) */
  executiveCount: number;
  /** Total AI mentions of people */
  totalAiMentions: number;
  /** Combined social followers of all people */
  totalSocialFollowers: number;
  /** Average thought leadership score */
  avgThoughtLeadershipScore: number;
  /** Per-person breakdown */
  personBreakdown?: PersonScoreBreakdown[];
}

export interface PPOScoreResult {
  /** Overall PPO score (0-100) */
  score: number;
  /** Score breakdown by component */
  breakdown: {
    executiveVisibility: number;
    thoughtLeadership: number;
    aiMentions: number;
    socialEngagement: number;
  };
  /** Top performing people */
  topPerformers: Array<{
    name: string;
    title?: string;
    score: number;
    highlight: string;
  }>;
  /** Areas needing attention */
  weakAreas: string[];
  /** Actionable recommendations */
  recommendations: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Weights for PPO score components */
const PPO_WEIGHTS = {
  executiveVisibility: 0.35,
  thoughtLeadership: 0.30,
  aiMentions: 0.20,
  socialEngagement: 0.15,
};

/** Minimum recommended people to track */
const MIN_PEOPLE_TRACKED = 3;

/** Benchmark values for scoring */
const BENCHMARKS = {
  /** Minimum executives for good visibility */
  minExecutives: 2,
  /** Good number of AI mentions per person */
  aiMentionsPerPerson: 5,
  /** Good social following for executives */
  executiveSocialFollowers: 5000,
  /** Good thought leadership score */
  goodThoughtLeadershipScore: 60,
};

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate executive visibility score
 * Based on number of executives tracked and their completeness
 */
function calculateExecutiveVisibilityScore(
  executiveCount: number,
  totalPeople: number,
  personBreakdown?: PersonScoreBreakdown[]
): number {
  if (totalPeople === 0) return 0;

  // Base score from executive count
  let baseScore = Math.min(100, (executiveCount / BENCHMARKS.minExecutives) * 50);

  // Bonus for having complete profiles
  if (personBreakdown && personBreakdown.length > 0) {
    const executives = personBreakdown.filter(
      (p) => p.totalFollowers > 0 || p.aiMentionCount > 0
    );
    const completenessRate = executives.length / Math.max(personBreakdown.length, 1);
    baseScore += completenessRate * 50;
  }

  return Math.min(100, Math.round(baseScore));
}

/**
 * Calculate thought leadership score
 * Average of individual thought leadership scores
 */
function calculateThoughtLeadershipScore(
  avgScore: number,
  personBreakdown?: PersonScoreBreakdown[]
): number {
  if (avgScore > 0) {
    return Math.min(100, Math.round(avgScore));
  }

  if (personBreakdown && personBreakdown.length > 0) {
    const totalScore = personBreakdown.reduce(
      (sum, p) => sum + (p.thoughtLeadershipScore || 0),
      0
    );
    return Math.min(100, Math.round(totalScore / personBreakdown.length));
  }

  return 0;
}

/**
 * Calculate AI mentions score
 * Based on how often key people are mentioned in AI platforms
 */
function calculateAiMentionsScore(
  totalMentions: number,
  totalPeople: number
): number {
  if (totalPeople === 0) return 0;

  const mentionsPerPerson = totalMentions / totalPeople;
  const targetMentions = BENCHMARKS.aiMentionsPerPerson;

  // 0 mentions = 0, target mentions = 100
  const score = Math.min(100, (mentionsPerPerson / targetMentions) * 100);
  return Math.round(score);
}

/**
 * Calculate social engagement score
 * Based on combined social following of key people
 */
function calculateSocialEngagementScore(
  totalFollowers: number,
  totalPeople: number
): number {
  if (totalPeople === 0) return 0;

  const avgFollowers = totalFollowers / totalPeople;
  const targetFollowers = BENCHMARKS.executiveSocialFollowers;

  // Logarithmic scale for large followings
  if (avgFollowers >= targetFollowers) {
    const bonus = Math.log10(avgFollowers / targetFollowers) * 20;
    return Math.min(100, Math.round(70 + bonus));
  }

  // Linear scale for smaller followings
  const score = (avgFollowers / targetFollowers) * 70;
  return Math.round(score);
}

/**
 * Calculate the overall PPO Score
 */
export function calculatePPOScore(input: PPOScoreInput): PPOScoreResult {
  const {
    totalPeopleTracked,
    executiveCount,
    totalAiMentions,
    totalSocialFollowers,
    avgThoughtLeadershipScore,
    personBreakdown,
  } = input;

  // Calculate component scores
  const executiveVisibilityScore = calculateExecutiveVisibilityScore(
    executiveCount,
    totalPeopleTracked,
    personBreakdown
  );
  const thoughtLeadershipScore = calculateThoughtLeadershipScore(
    avgThoughtLeadershipScore,
    personBreakdown
  );
  const aiMentionsScore = calculateAiMentionsScore(totalAiMentions, totalPeopleTracked);
  const socialEngagementScore = calculateSocialEngagementScore(
    totalSocialFollowers,
    totalPeopleTracked
  );

  // Calculate weighted overall score
  const overallScore = Math.round(
    executiveVisibilityScore * PPO_WEIGHTS.executiveVisibility +
    thoughtLeadershipScore * PPO_WEIGHTS.thoughtLeadership +
    aiMentionsScore * PPO_WEIGHTS.aiMentions +
    socialEngagementScore * PPO_WEIGHTS.socialEngagement
  );

  // Identify top performers
  const topPerformers = (personBreakdown || [])
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3)
    .map((person) => ({
      name: person.personName,
      title: person.title,
      score: person.overallScore,
      highlight: getPersonHighlight(person),
    }));

  // Identify weak areas
  const weakAreas: string[] = [];
  const breakdown = {
    executiveVisibility: executiveVisibilityScore,
    thoughtLeadership: thoughtLeadershipScore,
    aiMentions: aiMentionsScore,
    socialEngagement: socialEngagementScore,
  };

  if (executiveVisibilityScore < 50) {
    weakAreas.push("Executive Visibility");
  }
  if (thoughtLeadershipScore < 50) {
    weakAreas.push("Thought Leadership");
  }
  if (aiMentionsScore < 50) {
    weakAreas.push("AI Platform Presence");
  }
  if (socialEngagementScore < 50) {
    weakAreas.push("Social Engagement");
  }

  // Generate recommendations
  const recommendations = generatePPORecommendations(
    breakdown,
    totalPeopleTracked,
    executiveCount,
    personBreakdown
  );

  return {
    score: overallScore,
    breakdown,
    topPerformers,
    weakAreas,
    recommendations,
  };
}

/**
 * Get highlight for a person based on their strongest metric
 */
function getPersonHighlight(person: PersonScoreBreakdown): string {
  if (person.aiMentionCount > 5) {
    return `${person.aiMentionCount} AI mentions`;
  }
  if (person.totalFollowers > 10000) {
    return `${(person.totalFollowers / 1000).toFixed(1)}K followers`;
  }
  if (person.thoughtLeadershipScore > 60) {
    return "Strong thought leader";
  }
  if (person.socialScore > 60) {
    return "Good social presence";
  }
  return "Key team member";
}

/**
 * Generate actionable recommendations based on PPO scores
 */
function generatePPORecommendations(
  breakdown: PPOScoreResult["breakdown"],
  totalPeople: number,
  executiveCount: number,
  personBreakdown?: PersonScoreBreakdown[]
): string[] {
  const recommendations: string[] = [];

  // Check if enough people are tracked
  if (totalPeople < MIN_PEOPLE_TRACKED) {
    recommendations.push(
      `Add more team members - currently tracking ${totalPeople}, recommend at least ${MIN_PEOPLE_TRACKED}`
    );
  }

  // Executive visibility recommendations
  if (breakdown.executiveVisibility < 50) {
    if (executiveCount < BENCHMARKS.minExecutives) {
      recommendations.push(
        "Add C-suite executives and founders to your tracked people"
      );
    } else {
      recommendations.push(
        "Complete executive profiles with photos, bios, and social links"
      );
    }
  }

  // Thought leadership recommendations
  if (breakdown.thoughtLeadership < 50) {
    recommendations.push(
      "Encourage executives to publish articles, speak at conferences, or appear on podcasts"
    );
  }

  // AI mentions recommendations
  if (breakdown.aiMentions < 50) {
    recommendations.push(
      "Improve leadership visibility in AI platforms through PR and content marketing"
    );
  }

  // Social engagement recommendations
  if (breakdown.socialEngagement < 50) {
    recommendations.push(
      "Grow executive social presence - encourage regular posting on LinkedIn and Twitter"
    );
  }

  // Person-specific recommendations
  if (personBreakdown) {
    const lowPerformers = personBreakdown.filter((p) => p.overallScore < 40);
    if (lowPerformers.length > 0 && lowPerformers.length <= 3) {
      recommendations.push(
        `Focus on improving presence for: ${lowPerformers.map((p) => p.personName).join(", ")}`
      );
    }
  }

  return recommendations.slice(0, 5);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get PPO score status text
 */
export function getPPOScoreStatus(score: number): string {
  if (score >= 80) return "Excellent People Presence";
  if (score >= 60) return "Good People Presence";
  if (score >= 40) return "Moderate People Presence";
  if (score >= 20) return "Needs Improvement";
  return "Critical - Build People Presence";
}

/**
 * Calculate individual person's PPO contribution
 */
export function calculatePersonContribution(
  person: PersonScoreBreakdown,
  totalScore: number
): number {
  if (totalScore === 0) return 0;
  return Math.round((person.overallScore / totalScore) * 100);
}

/**
 * Get recommended actions for a specific person
 */
export function getPersonRecommendations(person: PersonScoreBreakdown): string[] {
  const recommendations: string[] = [];

  if (person.socialScore < 40) {
    recommendations.push("Build social media presence on LinkedIn and Twitter");
  }

  if (person.aiMentionCount < 2) {
    recommendations.push("Increase visibility through PR and thought leadership content");
  }

  if (person.thoughtLeadershipScore < 40) {
    recommendations.push("Pursue speaking opportunities and publish industry insights");
  }

  if (person.totalFollowers < 1000) {
    recommendations.push("Grow social following through consistent engagement");
  }

  return recommendations;
}
