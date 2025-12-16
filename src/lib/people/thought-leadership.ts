/**
 * Thought Leadership Scoring (Phase 7.2)
 *
 * Calculates thought leadership scores for brand people based on:
 * - Content publishing (articles, blog posts)
 * - Speaking engagements (conferences, podcasts, webinars)
 * - Media mentions and interviews
 * - Social engagement on professional content
 */

import type {
  BrandPerson,
  ThoughtLeadershipActivity,
} from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

export interface ThoughtLeadershipScore {
  overall: number; // 0-100
  components: {
    publishing: number; // 0-100
    speaking: number; // 0-100
    media: number; // 0-100
    engagement: number; // 0-100
  };
  breakdown: {
    totalActivities: number;
    publicationsCount: number;
    speakingCount: number;
    mediaCount: number;
    avgReach: number;
  };
}

export interface ActivityScoreWeights {
  podcast: number;
  conference: number;
  webinar: number;
  article: number;
  interview: number;
  panel: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Base points for each activity type */
const ACTIVITY_BASE_POINTS: ActivityScoreWeights = {
  conference: 15, // High prestige
  podcast: 12, // Good reach
  interview: 10, // Media exposure
  panel: 10, // Industry presence
  webinar: 8, // Targeted reach
  article: 6, // Content creation
};

/** Reach multipliers based on estimated audience size */
const REACH_MULTIPLIERS: Record<string, number> = {
  tiny: 1, // < 100 reach
  small: 1.2, // 100-1,000
  medium: 1.5, // 1,000-10,000
  large: 2, // 10,000-100,000
  massive: 3, // > 100,000
};

/** Prestige venues that get bonus points */
const PRESTIGE_VENUES = [
  "ted",
  "tedx",
  "sxsw",
  "web summit",
  "ces",
  "techcrunch",
  "disrupt",
  "y combinator",
  "forbes",
  "harvard business review",
  "wired",
  "wsj",
  "wall street journal",
  "new york times",
  "bloomberg",
  "cnbc",
  "bbc",
  "cnn",
  "nbc",
  "abc",
  "cbs",
  "npr",
  "the economist",
  "financial times",
  "mit technology review",
  "stanford",
  "oxford",
  "cambridge",
  "aws reinvent",
  "google io",
  "microsoft build",
  "wwdc",
  "dreamforce",
  "hubspot inbound",
];

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Get reach multiplier based on estimated audience size
 */
function getReachMultiplier(reach: number | undefined): number {
  if (!reach || reach < 100) return REACH_MULTIPLIERS.tiny;
  if (reach < 1_000) return REACH_MULTIPLIERS.small;
  if (reach < 10_000) return REACH_MULTIPLIERS.medium;
  if (reach < 100_000) return REACH_MULTIPLIERS.large;
  return REACH_MULTIPLIERS.massive;
}

/**
 * Check if venue is a prestige venue
 */
function isPrestigeVenue(venue: string | undefined): boolean {
  if (!venue) return false;
  const venueLower = venue.toLowerCase();
  return PRESTIGE_VENUES.some((p) => venueLower.includes(p));
}

/**
 * Calculate recency bonus (activities in last year worth more)
 */
function getRecencyMultiplier(date: string | undefined): number {
  if (!date) return 0.7; // Unknown date gets reduced weight

  const activityDate = new Date(date);
  const now = new Date();
  const monthsAgo = (now.getTime() - activityDate.getTime()) / (30 * 24 * 60 * 60 * 1000);

  if (monthsAgo <= 3) return 1.5; // Last 3 months
  if (monthsAgo <= 6) return 1.25; // Last 6 months
  if (monthsAgo <= 12) return 1.0; // Last year
  if (monthsAgo <= 24) return 0.75; // Last 2 years
  return 0.5; // Older
}

/**
 * Calculate points for a single activity
 */
export function calculateActivityPoints(activity: ThoughtLeadershipActivity): number {
  // Base points for activity type
  const basePoints = ACTIVITY_BASE_POINTS[activity.type] || 5;

  // Apply multipliers
  let points = basePoints;
  points *= getReachMultiplier(activity.reach);
  points *= getRecencyMultiplier(activity.date);

  // Prestige venue bonus (50% extra)
  if (isPrestigeVenue(activity.venue)) {
    points *= 1.5;
  }

  return Math.round(points * 10) / 10;
}

/**
 * Calculate thought leadership score for a person
 */
export function calculateThoughtLeadershipScore(
  person: BrandPerson
): ThoughtLeadershipScore {
  const activities = person.thoughtLeadershipActivities || [];

  const result: ThoughtLeadershipScore = {
    overall: 0,
    components: {
      publishing: 0,
      speaking: 0,
      media: 0,
      engagement: 0,
    },
    breakdown: {
      totalActivities: activities.length,
      publicationsCount: 0,
      speakingCount: 0,
      mediaCount: 0,
      avgReach: 0,
    },
  };

  if (activities.length === 0) {
    return result;
  }

  // Categorize activities and calculate points
  let publishingPoints = 0;
  let speakingPoints = 0;
  let mediaPoints = 0;
  let totalReach = 0;
  let reachCount = 0;

  for (const activity of activities) {
    const points = calculateActivityPoints(activity);

    switch (activity.type) {
      case "article":
        publishingPoints += points;
        result.breakdown.publicationsCount++;
        break;
      case "conference":
      case "webinar":
      case "panel":
        speakingPoints += points;
        result.breakdown.speakingCount++;
        break;
      case "podcast":
      case "interview":
        mediaPoints += points;
        result.breakdown.mediaCount++;
        break;
    }

    if (activity.reach) {
      totalReach += activity.reach;
      reachCount++;
    }
  }

  result.breakdown.avgReach = reachCount > 0 ? Math.round(totalReach / reachCount) : 0;

  // Convert points to scores (0-100 scale)
  // Use logarithmic scaling with caps
  result.components.publishing = pointsToScore(publishingPoints, 50);
  result.components.speaking = pointsToScore(speakingPoints, 80);
  result.components.media = pointsToScore(mediaPoints, 60);

  // Engagement score based on social followers if available
  result.components.engagement = calculateEngagementScore(person);

  // Overall score (weighted average)
  result.overall = Math.round(
    result.components.publishing * 0.25 +
    result.components.speaking * 0.35 +
    result.components.media * 0.25 +
    result.components.engagement * 0.15
  );

  return result;
}

/**
 * Convert raw points to 0-100 score with diminishing returns
 */
function pointsToScore(points: number, maxPoints: number): number {
  if (points <= 0) return 0;
  if (points >= maxPoints) return 100;

  // Logarithmic curve for diminishing returns
  const normalized = points / maxPoints;
  const score = Math.sqrt(normalized) * 100;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate engagement score based on social presence
 */
function calculateEngagementScore(person: BrandPerson): number {
  const totalFollowers = person.totalSocialFollowers || 0;

  if (totalFollowers === 0) return 0;

  // Logarithmic scale
  // 1,000 = ~30
  // 10,000 = ~50
  // 100,000 = ~70
  // 1,000,000 = ~90

  if (totalFollowers >= 1_000_000) return 100;

  const score = Math.log10(totalFollowers) * 15;
  return Math.min(Math.round(score), 100);
}

// ============================================================================
// Activity Analysis
// ============================================================================

/**
 * Analyze thought leadership trends
 */
export function analyzeThoughtLeadershipTrends(
  activities: ThoughtLeadershipActivity[]
): {
  trending: "up" | "down" | "stable";
  recentActivityCount: number;
  mostActiveType: string | null;
  topVenues: string[];
} {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

  // Count activities by period
  let recentCount = 0;
  let olderCount = 0;
  const typeCounts: Record<string, number> = {};
  const venueCounts: Record<string, number> = {};

  for (const activity of activities) {
    if (activity.date) {
      const activityDate = new Date(activity.date);
      if (activityDate >= sixMonthsAgo) {
        recentCount++;
      } else if (activityDate >= yearAgo) {
        olderCount++;
      }
    }

    typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;

    if (activity.venue) {
      venueCounts[activity.venue] = (venueCounts[activity.venue] || 0) + 1;
    }
  }

  // Determine trend
  let trending: "up" | "down" | "stable" = "stable";
  if (recentCount > olderCount * 1.5) {
    trending = "up";
  } else if (recentCount < olderCount * 0.5) {
    trending = "down";
  }

  // Find most active type
  let mostActiveType: string | null = null;
  let maxTypeCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxTypeCount) {
      mostActiveType = type;
      maxTypeCount = count;
    }
  }

  // Top venues
  const topVenues = Object.entries(venueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([venue]) => venue);

  return {
    trending,
    recentActivityCount: recentCount,
    mostActiveType,
    topVenues,
  };
}

/**
 * Generate thought leadership recommendations
 */
export function generateThoughtLeadershipRecommendations(
  person: BrandPerson,
  score: ThoughtLeadershipScore
): string[] {
  const recommendations: string[] = [];

  // Low publishing score
  if (score.components.publishing < 30) {
    recommendations.push(
      "Consider publishing articles or blog posts on industry topics to build thought leadership"
    );
  }

  // Low speaking score
  if (score.components.speaking < 30) {
    recommendations.push(
      "Apply to speak at industry conferences or host webinars to increase visibility"
    );
  }

  // Low media score
  if (score.components.media < 30) {
    recommendations.push(
      "Seek podcast guest appearances or media interviews to expand reach"
    );
  }

  // Low engagement
  if (score.components.engagement < 30) {
    recommendations.push(
      "Build social media presence on LinkedIn and Twitter to amplify thought leadership content"
    );
  }

  // Few total activities
  if (score.breakdown.totalActivities < 3) {
    recommendations.push(
      "Increase thought leadership activities - aim for at least 4-6 per year"
    );
  }

  // Low reach
  if (score.breakdown.avgReach < 1000 && score.breakdown.totalActivities > 0) {
    recommendations.push(
      "Target higher-reach opportunities - larger conferences, popular podcasts"
    );
  }

  // Good score - celebrate
  if (score.overall >= 70) {
    recommendations.push(
      "Strong thought leadership presence! Consider mentoring others or creating educational content"
    );
  }

  return recommendations;
}

// ============================================================================
// Activity Helpers
// ============================================================================

/**
 * Create a new thought leadership activity
 */
export function createActivity(
  type: ThoughtLeadershipActivity["type"],
  title: string,
  options: {
    venue?: string;
    url?: string;
    date?: string;
    reach?: number;
  } = {}
): ThoughtLeadershipActivity {
  return {
    type,
    title,
    venue: options.venue,
    url: options.url,
    date: options.date || new Date().toISOString().split("T")[0],
    reach: options.reach,
  };
}

/**
 * Sort activities by date (most recent first)
 */
export function sortActivitiesByDate(
  activities: ThoughtLeadershipActivity[]
): ThoughtLeadershipActivity[] {
  return [...activities].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Filter activities by type
 */
export function filterActivitiesByType(
  activities: ThoughtLeadershipActivity[],
  types: ThoughtLeadershipActivity["type"][]
): ThoughtLeadershipActivity[] {
  return activities.filter((a) => types.includes(a.type));
}
