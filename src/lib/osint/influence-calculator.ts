/**
 * Influence Calculator (Phase 9.3)
 *
 * Calculates influence scores for executives/people based on:
 * - Social media presence (followers, engagement)
 * - Thought leadership (publications, speaking engagements)
 * - AI visibility (mentions across AI platforms)
 * - Career progression and credentials
 */

import type { BrandPerson } from "@/lib/db/schema/people";
import type { PeopleEnrichmentRecord } from "@/lib/db/schema/enrichment";

// ============================================================================
// Types
// ============================================================================

export interface InfluenceMetrics {
  // Social metrics (normalized 0-100)
  linkedinScore: number;
  twitterScore: number;
  otherSocialScore: number;
  totalSocialScore: number;

  // Thought leadership (normalized 0-100)
  publicationsScore: number;
  speakingScore: number;
  totalThoughtLeadershipScore: number;

  // AI visibility (normalized 0-100)
  aiMentionScore: number;

  // Career/credential score (normalized 0-100)
  careerScore: number;

  // Overall influence score (0-100)
  overallScore: number;

  // Raw counts for display
  raw: {
    linkedinFollowers: number;
    twitterFollowers: number;
    totalFollowers: number;
    publicationsCount: number;
    speakingEngagementsCount: number;
    aiMentionCount: number;
    yearsExperience: number;
    positionsHeld: number;
  };

  // Breakdown for transparency
  breakdown: {
    social: number; // Weight: 35%
    thoughtLeadership: number; // Weight: 25%
    aiVisibility: number; // Weight: 20%
    career: number; // Weight: 20%
  };
}

export interface InfluenceComparison {
  personId: string;
  personName: string;
  influenceScore: number;
  percentile: number; // Where they rank compared to others
  strengths: string[];
  areasForGrowth: string[];
}

// ============================================================================
// Constants
// ============================================================================

// Weights for overall score calculation
const WEIGHTS = {
  social: 0.35,
  thoughtLeadership: 0.25,
  aiVisibility: 0.20,
  career: 0.20,
} as const;

// Sub-weights for social score
const SOCIAL_WEIGHTS = {
  linkedin: 0.50,
  twitter: 0.30,
  other: 0.20,
} as const;

// Benchmarks for normalization (based on typical executive ranges)
const BENCHMARKS = {
  // LinkedIn followers
  linkedinFollowers: {
    low: 500,
    medium: 5000,
    high: 50000,
    exceptional: 500000,
  },
  // Twitter followers
  twitterFollowers: {
    low: 1000,
    medium: 10000,
    high: 100000,
    exceptional: 1000000,
  },
  // Publications
  publications: {
    low: 1,
    medium: 5,
    high: 20,
    exceptional: 50,
  },
  // Speaking engagements
  speaking: {
    low: 1,
    medium: 5,
    high: 15,
    exceptional: 50,
  },
  // AI mentions
  aiMentions: {
    low: 1,
    medium: 10,
    high: 50,
    exceptional: 200,
  },
  // Years of experience
  yearsExperience: {
    low: 2,
    medium: 10,
    high: 20,
    exceptional: 30,
  },
  // LinkedIn engagement rate (likes + comments per post / followers)
  engagementRate: {
    low: 0.01,
    medium: 0.02,
    high: 0.05,
    exceptional: 0.10,
  },
} as const;

// ============================================================================
// Normalization Functions
// ============================================================================

/**
 * Normalize a value to 0-100 scale using logarithmic scaling
 * Good for metrics with wide ranges (followers, etc.)
 */
function normalizeLogarithmic(
  value: number,
  benchmark: { low: number; medium: number; high: number; exceptional: number }
): number {
  if (value <= 0) return 0;
  if (value >= benchmark.exceptional) return 100;

  // Use log scale for smoother distribution
  const logValue = Math.log10(value + 1);
  const logLow = Math.log10(benchmark.low + 1);
  const logExceptional = Math.log10(benchmark.exceptional + 1);

  const normalized = ((logValue - logLow) / (logExceptional - logLow)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Normalize a value using linear scaling with diminishing returns
 */
function normalizeLinear(
  value: number,
  benchmark: { low: number; medium: number; high: number; exceptional: number }
): number {
  if (value <= 0) return 0;
  if (value >= benchmark.exceptional) return 100;

  // Linear with soft cap
  if (value <= benchmark.medium) {
    return (value / benchmark.medium) * 50;
  } else if (value <= benchmark.high) {
    return 50 + ((value - benchmark.medium) / (benchmark.high - benchmark.medium)) * 30;
  } else {
    return 80 + ((value - benchmark.high) / (benchmark.exceptional - benchmark.high)) * 20;
  }
}

// ============================================================================
// Score Calculation Functions
// ============================================================================

/**
 * Calculate social media presence score
 */
function calculateSocialScore(
  person: BrandPerson,
  enrichment?: PeopleEnrichmentRecord | null
): {
  linkedinScore: number;
  twitterScore: number;
  otherSocialScore: number;
  totalScore: number;
  rawFollowers: { linkedin: number; twitter: number; total: number };
} {
  const linkedinFollowers = person.linkedinFollowers || enrichment?.linkedinConnectionCount || 0;
  const twitterFollowers = person.twitterFollowers || 0;
  const totalFollowers = person.totalSocialFollowers || linkedinFollowers + twitterFollowers;

  // Calculate individual scores
  const linkedinScore = normalizeLogarithmic(linkedinFollowers, BENCHMARKS.linkedinFollowers);
  const twitterScore = normalizeLogarithmic(twitterFollowers, BENCHMARKS.twitterFollowers);

  // Other social platforms (from socialProfiles)
  let otherFollowers = 0;
  const profiles = person.socialProfiles;
  if (profiles) {
    otherFollowers += profiles.instagram?.followers || 0;
    otherFollowers += profiles.youtube?.subscribers || 0;
    otherFollowers += profiles.github?.followers || 0;
    otherFollowers += profiles.medium?.followers || 0;
    otherFollowers += profiles.tiktok?.followers || 0;
  }
  const otherSocialScore = normalizeLogarithmic(otherFollowers, BENCHMARKS.linkedinFollowers);

  // Weighted total
  const totalScore =
    linkedinScore * SOCIAL_WEIGHTS.linkedin +
    twitterScore * SOCIAL_WEIGHTS.twitter +
    otherSocialScore * SOCIAL_WEIGHTS.other;

  return {
    linkedinScore,
    twitterScore,
    otherSocialScore,
    totalScore,
    rawFollowers: {
      linkedin: linkedinFollowers,
      twitter: twitterFollowers,
      total: totalFollowers + otherFollowers,
    },
  };
}

/**
 * Calculate thought leadership score
 */
function calculateThoughtLeadershipScore(
  person: BrandPerson,
  enrichment?: PeopleEnrichmentRecord | null
): {
  publicationsScore: number;
  speakingScore: number;
  totalScore: number;
  rawCounts: { publications: number; speaking: number };
} {
  // Count publications
  const publicationsCount =
    person.publicationsCount ||
    (enrichment?.publications?.length || 0) +
      (enrichment?.linkedinArticleCount || 0);

  // Count speaking engagements
  const speakingCount =
    person.speakingEngagementsCount ||
    (enrichment?.conferenceAppearances?.length || 0) +
      (enrichment?.podcastAppearances?.length || 0) +
      (person.thoughtLeadershipActivities?.filter(
        (a) => a.type === "conference" || a.type === "podcast" || a.type === "webinar"
      ).length || 0);

  const publicationsScore = normalizeLinear(publicationsCount, BENCHMARKS.publications);
  const speakingScore = normalizeLinear(speakingCount, BENCHMARKS.speaking);

  // Equal weighting for publications and speaking
  const totalScore = publicationsScore * 0.5 + speakingScore * 0.5;

  return {
    publicationsScore,
    speakingScore,
    totalScore,
    rawCounts: {
      publications: publicationsCount,
      speaking: speakingCount,
    },
  };
}

/**
 * Calculate AI visibility score
 */
function calculateAIVisibilityScore(person: BrandPerson): {
  score: number;
  rawMentions: number;
} {
  const aiMentionCount = person.aiMentionCount || 0;
  const score = normalizeLinear(aiMentionCount, BENCHMARKS.aiMentions);

  return {
    score,
    rawMentions: aiMentionCount,
  };
}

/**
 * Calculate career/credential score
 */
function calculateCareerScore(
  person: BrandPerson,
  enrichment?: PeopleEnrichmentRecord | null
): {
  score: number;
  yearsExperience: number;
  positionsHeld: number;
} {
  // Years of experience
  const yearsExperience = enrichment?.totalYearsExperience || 0;
  const yearsScore = normalizeLinear(yearsExperience, BENCHMARKS.yearsExperience);

  // Number of positions (career progression indicator)
  const positionsHeld = enrichment?.pastPositions?.length || 0;
  const positionsScore = normalizeLinear(positionsHeld, { low: 1, medium: 3, high: 6, exceptional: 10 });

  // Role category bonus
  let roleCategoryBonus = 0;
  if (person.roleCategory === "c_suite") roleCategoryBonus = 20;
  else if (person.roleCategory === "founder") roleCategoryBonus = 25;
  else if (person.roleCategory === "board") roleCategoryBonus = 15;

  // Education bonus (having any education listed)
  const educationBonus = (enrichment?.education?.length || 0) > 0 ? 10 : 0;

  // Certifications bonus
  const certBonus = Math.min(15, (enrichment?.certifications?.length || 0) * 3);

  // Combine scores (capped at 100)
  const score = Math.min(
    100,
    yearsScore * 0.3 + positionsScore * 0.2 + roleCategoryBonus + educationBonus + certBonus
  );

  return {
    score,
    yearsExperience,
    positionsHeld,
  };
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculate comprehensive influence metrics for a person
 */
export function calculateInfluenceScore(
  person: BrandPerson,
  enrichment?: PeopleEnrichmentRecord | null
): InfluenceMetrics {
  // Calculate component scores
  const social = calculateSocialScore(person, enrichment);
  const thoughtLeadership = calculateThoughtLeadershipScore(person, enrichment);
  const aiVisibility = calculateAIVisibilityScore(person);
  const career = calculateCareerScore(person, enrichment);

  // Calculate overall score
  const overallScore = Math.round(
    social.totalScore * WEIGHTS.social +
      thoughtLeadership.totalScore * WEIGHTS.thoughtLeadership +
      aiVisibility.score * WEIGHTS.aiVisibility +
      career.score * WEIGHTS.career
  );

  return {
    // Social metrics
    linkedinScore: Math.round(social.linkedinScore),
    twitterScore: Math.round(social.twitterScore),
    otherSocialScore: Math.round(social.otherSocialScore),
    totalSocialScore: Math.round(social.totalScore),

    // Thought leadership
    publicationsScore: Math.round(thoughtLeadership.publicationsScore),
    speakingScore: Math.round(thoughtLeadership.speakingScore),
    totalThoughtLeadershipScore: Math.round(thoughtLeadership.totalScore),

    // AI visibility
    aiMentionScore: Math.round(aiVisibility.score),

    // Career
    careerScore: Math.round(career.score),

    // Overall
    overallScore,

    // Raw counts
    raw: {
      linkedinFollowers: social.rawFollowers.linkedin,
      twitterFollowers: social.rawFollowers.twitter,
      totalFollowers: social.rawFollowers.total,
      publicationsCount: thoughtLeadership.rawCounts.publications,
      speakingEngagementsCount: thoughtLeadership.rawCounts.speaking,
      aiMentionCount: aiVisibility.rawMentions,
      yearsExperience: career.yearsExperience,
      positionsHeld: career.positionsHeld,
    },

    // Breakdown
    breakdown: {
      social: Math.round(social.totalScore * WEIGHTS.social),
      thoughtLeadership: Math.round(thoughtLeadership.totalScore * WEIGHTS.thoughtLeadership),
      aiVisibility: Math.round(aiVisibility.score * WEIGHTS.aiVisibility),
      career: Math.round(career.score * WEIGHTS.career),
    },
  };
}

// ============================================================================
// Comparison and Analysis Functions
// ============================================================================

/**
 * Get strengths and areas for growth based on influence metrics
 */
export function analyzeInfluenceProfile(metrics: InfluenceMetrics): {
  strengths: string[];
  areasForGrowth: string[];
  tier: "emerging" | "established" | "influential" | "thought_leader";
} {
  const strengths: string[] = [];
  const areasForGrowth: string[] = [];

  // Analyze social presence
  if (metrics.totalSocialScore >= 70) {
    strengths.push("Strong social media presence");
  } else if (metrics.totalSocialScore < 30) {
    areasForGrowth.push("Build social media following");
  }

  // Analyze LinkedIn specifically
  if (metrics.linkedinScore >= 70) {
    strengths.push("Excellent LinkedIn network");
  } else if (metrics.linkedinScore < 30 && metrics.raw.linkedinFollowers < 500) {
    areasForGrowth.push("Grow LinkedIn connections");
  }

  // Analyze thought leadership
  if (metrics.totalThoughtLeadershipScore >= 70) {
    strengths.push("Active thought leader");
  } else if (metrics.totalThoughtLeadershipScore < 30) {
    if (metrics.publicationsScore < 30) {
      areasForGrowth.push("Publish more articles/content");
    }
    if (metrics.speakingScore < 30) {
      areasForGrowth.push("Pursue speaking opportunities");
    }
  }

  // Analyze AI visibility
  if (metrics.aiMentionScore >= 50) {
    strengths.push("Visible in AI responses");
  } else if (metrics.aiMentionScore < 20) {
    areasForGrowth.push("Increase AI platform visibility");
  }

  // Analyze career
  if (metrics.careerScore >= 70) {
    strengths.push("Strong career credentials");
  }

  // Determine tier
  let tier: "emerging" | "established" | "influential" | "thought_leader";
  if (metrics.overallScore >= 80) {
    tier = "thought_leader";
  } else if (metrics.overallScore >= 60) {
    tier = "influential";
  } else if (metrics.overallScore >= 40) {
    tier = "established";
  } else {
    tier = "emerging";
  }

  return { strengths, areasForGrowth, tier };
}

/**
 * Compare multiple people and rank by influence
 */
export function compareInfluence(
  people: Array<{ person: BrandPerson; enrichment?: PeopleEnrichmentRecord | null }>
): InfluenceComparison[] {
  // Calculate scores for all
  const scored = people.map(({ person, enrichment }) => {
    const metrics = calculateInfluenceScore(person, enrichment);
    const analysis = analyzeInfluenceProfile(metrics);
    return {
      personId: person.id,
      personName: person.name,
      influenceScore: metrics.overallScore,
      strengths: analysis.strengths,
      areasForGrowth: analysis.areasForGrowth,
    };
  });

  // Sort by score
  scored.sort((a, b) => b.influenceScore - a.influenceScore);

  // Calculate percentiles
  return scored.map((item, index) => ({
    ...item,
    percentile: Math.round(((scored.length - index) / scored.length) * 100),
  }));
}

/**
 * Get influence tier label and color
 */
export function getInfluenceTierDisplay(score: number): {
  tier: string;
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      tier: "thought_leader",
      label: "Thought Leader",
      color: "#8B5CF6", // Purple
      description: "Industry-recognized expert with significant influence",
    };
  } else if (score >= 60) {
    return {
      tier: "influential",
      label: "Influential",
      color: "#00E5CC", // Cyan
      description: "Strong presence and growing influence in their field",
    };
  } else if (score >= 40) {
    return {
      tier: "established",
      label: "Established",
      color: "#22C55E", // Green
      description: "Solid professional presence with room for growth",
    };
  } else {
    return {
      tier: "emerging",
      label: "Emerging",
      color: "#F59E0B", // Warning/Yellow
      description: "Building their professional presence and influence",
    };
  }
}
