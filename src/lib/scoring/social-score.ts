/**
 * Social Media Optimization (SMO) Score Calculator (Phase 7.3)
 *
 * Calculates a comprehensive social media presence score based on:
 * - Reach: Total followers/subscribers across platforms
 * - Engagement: Likes, comments, shares relative to audience
 * - Sentiment: Positive vs negative mentions
 * - Growth: Follower growth rate
 * - Consistency: Regular posting activity
 */

import type { SocialPlatformBreakdown } from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

export interface SMOScoreInput {
  /** Total followers across all platforms */
  totalFollowers: number;
  /** Total engagements (likes, comments, shares) */
  totalEngagements: number;
  /** Average engagement rate (0-1) */
  avgEngagementRate: number;
  /** Average sentiment score (-1 to 1) */
  avgSentiment: number;
  /** Number of connected social accounts */
  connectedAccounts: number;
  /** Follower growth in last 30 days */
  followerGrowth30d?: number;
  /** Posts in last 30 days */
  postsLast30d?: number;
  /** Platform-specific breakdown */
  platformBreakdown?: SocialPlatformBreakdown[];
}

export interface SMOScoreResult {
  /** Overall SMO score (0-100) */
  score: number;
  /** Score breakdown by component */
  breakdown: {
    reach: number;
    engagement: number;
    sentiment: number;
    growth: number;
    consistency: number;
  };
  /** Platform-level scores */
  platformScores: Array<{
    platform: string;
    score: number;
    followers: number;
    engagementRate: number;
  }>;
  /** Actionable recommendations */
  recommendations: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Weights for SMO score components */
const SMO_WEIGHTS = {
  reach: 0.25,
  engagement: 0.30,
  sentiment: 0.20,
  growth: 0.15,
  consistency: 0.10,
};

/** Benchmark engagement rates by platform */
const PLATFORM_ENGAGEMENT_BENCHMARKS: Record<string, number> = {
  instagram: 0.03, // 3% is good
  tiktok: 0.05, // 5% is good
  linkedin: 0.02, // 2% is good
  twitter: 0.01, // 1% is good
  facebook: 0.01, // 1% is good
  youtube: 0.03, // 3% is good
};

/** Target followers for scoring tiers */
const FOLLOWER_TIERS = {
  excellent: 100000, // 100K+
  good: 10000, // 10K+
  moderate: 1000, // 1K+
  low: 100, // 100+
};

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate reach score based on total followers
 * Uses logarithmic scaling with caps
 */
function calculateReachScore(totalFollowers: number): number {
  if (totalFollowers <= 0) return 0;
  if (totalFollowers >= FOLLOWER_TIERS.excellent) return 100;

  // Logarithmic scale: log10(100K) = 5, log10(100) = 2
  // Range: 2-5 maps to 20-100
  const logFollowers = Math.log10(Math.max(totalFollowers, 1));
  const score = ((logFollowers - 2) / 3) * 80 + 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate engagement score based on engagement rate
 * Compared against platform benchmarks
 */
function calculateEngagementScore(
  avgEngagementRate: number,
  platformBreakdown?: SocialPlatformBreakdown[]
): number {
  if (avgEngagementRate <= 0) return 0;

  // If we have platform breakdown, use weighted benchmark comparison
  if (platformBreakdown && platformBreakdown.length > 0) {
    let weightedScore = 0;
    let totalWeight = 0;

    for (const platform of platformBreakdown) {
      const benchmark = PLATFORM_ENGAGEMENT_BENCHMARKS[platform.platform.toLowerCase()] || 0.02;
      const platformScore = Math.min(100, (platform.engagementRate / benchmark) * 50);
      const weight = platform.followers;
      weightedScore += platformScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  // Generic engagement rate scoring
  // 2% engagement = 50 score, 5% = 100 score
  const score = Math.min(100, (avgEngagementRate / 0.05) * 100);
  return Math.round(score);
}

/**
 * Calculate sentiment score
 * Converts -1 to 1 scale to 0-100
 */
function calculateSentimentScore(avgSentiment: number): number {
  // -1 = 0, 0 = 50, 1 = 100
  const score = (avgSentiment + 1) * 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate growth score based on 30-day follower growth
 */
function calculateGrowthScore(
  followerGrowth30d: number,
  totalFollowers: number
): number {
  if (!followerGrowth30d || totalFollowers <= 0) return 50; // Neutral if no data

  const growthRate = followerGrowth30d / totalFollowers;

  // 0% growth = 50, 5% monthly growth = 100
  if (growthRate <= 0) {
    // Negative growth
    const score = 50 + growthRate * 100; // -50% = 0
    return Math.max(0, Math.round(score));
  }

  // Positive growth
  const score = 50 + Math.min(growthRate / 0.05, 1) * 50;
  return Math.min(100, Math.round(score));
}

/**
 * Calculate consistency score based on posting frequency
 */
function calculateConsistencyScore(postsLast30d: number): number {
  if (!postsLast30d || postsLast30d <= 0) return 0;

  // Target: at least 20 posts per month (roughly 1 per day including weekends)
  // 0 posts = 0, 10 posts = 50, 20+ posts = 100
  const score = Math.min(100, (postsLast30d / 20) * 100);
  return Math.round(score);
}

/**
 * Calculate the overall SMO Score
 */
export function calculateSMOScore(input: SMOScoreInput): SMOScoreResult {
  const {
    totalFollowers,
    totalEngagements,
    avgEngagementRate,
    avgSentiment,
    connectedAccounts,
    followerGrowth30d = 0,
    postsLast30d = 0,
    platformBreakdown,
  } = input;

  // Calculate component scores
  const reachScore = calculateReachScore(totalFollowers);
  const engagementScore = calculateEngagementScore(avgEngagementRate, platformBreakdown);
  const sentimentScore = calculateSentimentScore(avgSentiment);
  const growthScore = calculateGrowthScore(followerGrowth30d, totalFollowers);
  const consistencyScore = calculateConsistencyScore(postsLast30d);

  // Calculate weighted overall score
  const overallScore = Math.round(
    reachScore * SMO_WEIGHTS.reach +
    engagementScore * SMO_WEIGHTS.engagement +
    sentimentScore * SMO_WEIGHTS.sentiment +
    growthScore * SMO_WEIGHTS.growth +
    consistencyScore * SMO_WEIGHTS.consistency
  );

  // Calculate platform-level scores
  const platformScores = (platformBreakdown || []).map((platform) => ({
    platform: platform.platform,
    score: Math.round(
      calculateReachScore(platform.followers) * 0.3 +
      calculateEngagementScore(platform.engagementRate) * 0.4 +
      calculateSentimentScore(platform.sentimentScore) * 0.3
    ),
    followers: platform.followers,
    engagementRate: platform.engagementRate,
  }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (reachScore < 50) {
    recommendations.push("Focus on growing your audience through consistent content and engagement");
  }

  if (engagementScore < 50) {
    recommendations.push("Improve engagement by posting more interactive content and responding to comments");
  }

  if (sentimentScore < 60) {
    recommendations.push("Address negative sentiment by improving customer service and brand messaging");
  }

  if (growthScore < 50 && totalFollowers > 0) {
    recommendations.push("Implement growth strategies: collaborations, contests, and cross-promotion");
  }

  if (consistencyScore < 50) {
    recommendations.push("Increase posting frequency to at least 3-5 times per week");
  }

  if (connectedAccounts < 3) {
    recommendations.push("Connect more social accounts for comprehensive monitoring");
  }

  // Platform-specific recommendations
  if (platformBreakdown) {
    const weakPlatforms = platformScores.filter((p) => p.score < 50);
    if (weakPlatforms.length > 0) {
      recommendations.push(
        `Focus on improving presence on: ${weakPlatforms.map((p) => p.platform).join(", ")}`
      );
    }
  }

  return {
    score: overallScore,
    breakdown: {
      reach: reachScore,
      engagement: engagementScore,
      sentiment: sentimentScore,
      growth: growthScore,
      consistency: consistencyScore,
    },
    platformScores,
    recommendations: recommendations.slice(0, 5),
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get SMO score status text
 */
export function getSMOScoreStatus(score: number): string {
  if (score >= 80) return "Excellent Social Presence";
  if (score >= 60) return "Good Social Presence";
  if (score >= 40) return "Moderate Social Presence";
  if (score >= 20) return "Needs Improvement";
  return "Critical - Build Social Presence";
}

/**
 * Get recommended posting frequency by platform
 */
export function getRecommendedPostingFrequency(platform: string): {
  minimum: number;
  optimal: number;
  unit: string;
} {
  const frequencies: Record<string, { minimum: number; optimal: number; unit: string }> = {
    twitter: { minimum: 7, optimal: 21, unit: "per week" },
    instagram: { minimum: 3, optimal: 7, unit: "per week" },
    linkedin: { minimum: 2, optimal: 5, unit: "per week" },
    facebook: { minimum: 3, optimal: 7, unit: "per week" },
    tiktok: { minimum: 5, optimal: 14, unit: "per week" },
    youtube: { minimum: 1, optimal: 3, unit: "per week" },
  };

  return frequencies[platform.toLowerCase()] || { minimum: 3, optimal: 7, unit: "per week" };
}

// ============================================================================
// Service Scan Data Integration (Phase 8.6)
// ============================================================================

/**
 * Service scan result from database
 */
export interface ServiceScanData {
  platform: string;
  handle: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews: number;
  postFrequency: number;
  mentionsCount: number;
  sentimentPositive: number;
  sentimentNeutral: number;
  sentimentNegative: number;
  scannedAt: Date | string;
}

/**
 * Convert service scan results to SMO score input
 *
 * @param scanResults - Array of service scan results from database
 * @returns SMOScoreInput ready for score calculation
 */
export function serviceScanToSMOInput(scanResults: ServiceScanData[]): SMOScoreInput {
  if (!scanResults || scanResults.length === 0) {
    return {
      totalFollowers: 0,
      totalEngagements: 0,
      avgEngagementRate: 0,
      avgSentiment: 0,
      connectedAccounts: 0,
    };
  }

  // Aggregate metrics across all platforms
  let totalFollowers = 0;
  let totalEngagements = 0;
  let totalPosts = 0;
  let weightedEngagementRate = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let totalPostFrequency = 0;

  const platformBreakdown: SocialPlatformBreakdown[] = [];

  for (const result of scanResults) {
    totalFollowers += result.followerCount || 0;
    totalPosts += result.postCount || 0;
    totalPostFrequency += result.postFrequency || 0;

    // Calculate engagements from averages
    const platformEngagements =
      ((result.avgLikes || 0) + (result.avgComments || 0) + (result.avgShares || 0)) *
      (result.postCount || 0);
    totalEngagements += platformEngagements;

    // Weighted engagement rate by followers
    if (result.followerCount > 0) {
      weightedEngagementRate += (result.engagementRate || 0) * result.followerCount;
    }

    // Sentiment counts
    positiveCount += result.sentimentPositive || 0;
    neutralCount += result.sentimentNeutral || 0;
    negativeCount += result.sentimentNegative || 0;

    // Platform breakdown
    const totalSentimentCount =
      (result.sentimentPositive || 0) +
      (result.sentimentNeutral || 0) +
      (result.sentimentNegative || 0);

    // Calculate sentiment score: -1 to 1 based on positive vs negative ratio
    let sentimentScore = 0;
    if (totalSentimentCount > 0) {
      sentimentScore =
        ((result.sentimentPositive || 0) - (result.sentimentNegative || 0)) / totalSentimentCount;
    }

    platformBreakdown.push({
      platform: result.platform,
      score: 0, // Will be calculated later
      followers: result.followerCount || 0,
      engagementRate: result.engagementRate || 0,
      sentimentScore,
      reachScore: calculateReachScore(result.followerCount || 0),
    });
  }

  // Calculate averages
  const avgEngagementRate = totalFollowers > 0 ? weightedEngagementRate / totalFollowers : 0;

  // Calculate overall sentiment (-1 to 1)
  const totalSentiment = positiveCount + neutralCount + negativeCount;
  const avgSentiment =
    totalSentiment > 0 ? (positiveCount - negativeCount) / totalSentiment : 0;

  // Estimate posts in last 30 days from post frequency
  const postsLast30d = Math.round(totalPostFrequency * 30);

  return {
    totalFollowers,
    totalEngagements,
    avgEngagementRate,
    avgSentiment,
    connectedAccounts: scanResults.length,
    postsLast30d,
    platformBreakdown,
  };
}

/**
 * Calculate SMO score from service scan results
 *
 * @param scanResults - Array of service scan results from database
 * @returns Complete SMO score result
 */
export function calculateSMOFromServiceScan(scanResults: ServiceScanData[]): SMOScoreResult {
  const input = serviceScanToSMOInput(scanResults);
  return calculateSMOScore(input);
}
