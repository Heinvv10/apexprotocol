/**
 * Gamification Challenges API Route
 * Daily and weekly challenges for XP rewards
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { userGamification, type StreakData, type UserStats } from "@/lib/db/schema";

// Challenge type definitions
export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "special";
  xpReward: number;
  progress: number;
  target: number;
  expiresAt: string;
  completed: boolean;
  category: "monitoring" | "content" | "audit" | "engagement" | "optimization";
  icon: string;
}

// Define challenge templates
const DAILY_CHALLENGES: Omit<Challenge, "progress" | "expiresAt" | "completed">[] = [
  {
    id: "daily_login",
    name: "Daily Check-in",
    description: "Log in to Apex today",
    type: "daily",
    xpReward: 10,
    target: 1,
    category: "engagement",
    icon: "calendar-check",
  },
  {
    id: "daily_audit",
    name: "Quick Audit",
    description: "Complete at least 1 audit check",
    type: "daily",
    xpReward: 25,
    target: 1,
    category: "audit",
    icon: "search",
  },
  {
    id: "daily_mentions",
    name: "Mention Monitor",
    description: "Track 3 new brand mentions",
    type: "daily",
    xpReward: 20,
    target: 3,
    category: "monitoring",
    icon: "bell",
  },
  {
    id: "daily_content",
    name: "Content Creator",
    description: "Generate 1 piece of content",
    type: "daily",
    xpReward: 30,
    target: 1,
    category: "content",
    icon: "edit",
  },
  {
    id: "daily_recommendation",
    name: "Optimizer",
    description: "Complete 2 recommendations",
    type: "daily",
    xpReward: 40,
    target: 2,
    category: "optimization",
    icon: "trending-up",
  },
];

const WEEKLY_CHALLENGES: Omit<Challenge, "progress" | "expiresAt" | "completed">[] = [
  {
    id: "weekly_streak",
    name: "Consistency Champion",
    description: "Log in 5 days this week",
    type: "weekly",
    xpReward: 100,
    target: 5,
    category: "engagement",
    icon: "flame",
  },
  {
    id: "weekly_audits",
    name: "Audit Master",
    description: "Complete 5 full audits this week",
    type: "weekly",
    xpReward: 150,
    target: 5,
    category: "audit",
    icon: "shield-check",
  },
  {
    id: "weekly_content",
    name: "Content Machine",
    description: "Generate 10 pieces of content",
    type: "weekly",
    xpReward: 200,
    target: 10,
    category: "content",
    icon: "file-text",
  },
  {
    id: "weekly_mentions",
    name: "Mention Tracker Pro",
    description: "Track 25 brand mentions",
    type: "weekly",
    xpReward: 125,
    target: 25,
    category: "monitoring",
    icon: "activity",
  },
  {
    id: "weekly_recommendations",
    name: "Optimization Expert",
    description: "Complete 15 recommendations",
    type: "weekly",
    xpReward: 175,
    target: 15,
    category: "optimization",
    icon: "award",
  },
];

/**
 * Get the expiration date for a challenge type
 */
function getChallengeExpiry(type: "daily" | "weekly"): Date {
  const now = new Date();
  if (type === "daily") {
    // Expires at end of today (midnight)
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  } else {
    // Expires at end of this week (Sunday midnight)
    const endOfWeek = new Date(now);
    const daysUntilSunday = 7 - endOfWeek.getDay();
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }
}

/**
 * Calculate progress for a challenge based on user stats
 */
function calculateProgress(challengeId: string, stats: UserStats, streaks: StreakData): number {
  switch (challengeId) {
    case "daily_login":
      // Check if logged in today based on streak data
      const today = new Date().toISOString().split("T")[0];
      return streaks.lastLoginDate === today ? 1 : 0;
    case "daily_audit":
      return Math.min(stats.totalAudits || 0, 1); // Today's audits - simplified
    case "daily_mentions":
      return Math.min(stats.totalMentions || 0, 3); // Today's mentions - simplified
    case "daily_content":
      return Math.min(stats.totalContent || 0, 1); // Today's content - simplified
    case "daily_recommendation":
      return Math.min(stats.recommendationsCompleted || 0, 2);
    case "weekly_streak":
      return Math.min(streaks.currentDaily || 0, 5);
    case "weekly_audits":
      return Math.min(stats.totalAudits || 0, 5);
    case "weekly_content":
      return Math.min(stats.totalContent || 0, 10);
    case "weekly_mentions":
      return Math.min(stats.totalMentions || 0, 25);
    case "weekly_recommendations":
      return Math.min(stats.recommendationsCompleted || 0, 15);
    default:
      return 0;
  }
}

/**
 * Select a subset of daily challenges for today
 */
function selectDailyChallenges(): typeof DAILY_CHALLENGES {
  // For consistency, select challenges based on day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Rotate through challenges, always include login
  const loginChallenge = DAILY_CHALLENGES.find((c) => c.id === "daily_login")!;
  const otherChallenges = DAILY_CHALLENGES.filter((c) => c.id !== "daily_login");

  // Select 2-3 other challenges based on day
  const selected = [loginChallenge];
  const indices = [dayOfYear % otherChallenges.length, (dayOfYear + 1) % otherChallenges.length];
  indices.forEach((idx) => {
    if (!selected.some((c) => c.id === otherChallenges[idx].id)) {
      selected.push(otherChallenges[idx]);
    }
  });

  return selected;
}

/**
 * Select weekly challenges for this week
 */
function selectWeeklyChallenges(): typeof WEEKLY_CHALLENGES {
  // For consistency, select challenges based on week of year
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekOfYear = Math.floor(
    ((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7
  );

  // Rotate through weekly challenges, always include streak
  const streakChallenge = WEEKLY_CHALLENGES.find((c) => c.id === "weekly_streak")!;
  const otherChallenges = WEEKLY_CHALLENGES.filter((c) => c.id !== "weekly_streak");

  const selected = [streakChallenge];
  const indices = [weekOfYear % otherChallenges.length, (weekOfYear + 1) % otherChallenges.length];
  indices.forEach((idx) => {
    if (!selected.some((c) => c.id === otherChallenges[idx].id)) {
      selected.push(otherChallenges[idx]);
    }
  });

  return selected;
}

/**
 * GET /api/gamification/challenges
 * Get active challenges for a user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo-user";
  const type = searchParams.get("type") as "daily" | "weekly" | "all" | null;

  try {
    // Get user progress for calculating challenge progress
    const userProgressRecords = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId))
      .limit(1);

    const stats: UserStats = (userProgressRecords[0]?.stats as UserStats) || {
      totalAudits: 0,
      totalMentions: 0,
      totalContent: 0,
      totalRecommendations: 0,
      recommendationsCompleted: 0,
      brandsCreated: 0,
      reportsGenerated: 0,
      integrationsConnected: 0,
      teamMembersInvited: 0,
      crisesResolved: 0,
      geoScoreImprovements: 0,
    };

    const streaks: StreakData = (userProgressRecords[0]?.streaks as StreakData) || {
      currentDaily: 0,
      longestDaily: 0,
      currentWeekly: 0,
      longestWeekly: 0,
      lastLoginDate: "",
      lastWeekStartDate: "",
    };

    const challenges: Challenge[] = [];

    // Get daily challenges
    if (!type || type === "daily" || type === "all") {
      const dailyExpiry = getChallengeExpiry("daily");
      const selectedDaily = selectDailyChallenges();

      selectedDaily.forEach((template) => {
        const progress = calculateProgress(template.id, stats, streaks);
        challenges.push({
          ...template,
          progress,
          expiresAt: dailyExpiry.toISOString(),
          completed: progress >= template.target,
        });
      });
    }

    // Get weekly challenges
    if (!type || type === "weekly" || type === "all") {
      const weeklyExpiry = getChallengeExpiry("weekly");
      const selectedWeekly = selectWeeklyChallenges();

      selectedWeekly.forEach((template) => {
        const progress = calculateProgress(template.id, stats, streaks);
        challenges.push({
          ...template,
          progress,
          expiresAt: weeklyExpiry.toISOString(),
          completed: progress >= template.target,
        });
      });
    }

    // Sort: incomplete first, then by XP reward
    challenges.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.xpReward - a.xpReward;
    });

    return NextResponse.json({
      success: true,
      challenges,
      summary: {
        total: challenges.length,
        completed: challenges.filter((c) => c.completed).length,
        daily: challenges.filter((c) => c.type === "daily").length,
        weekly: challenges.filter((c) => c.type === "weekly").length,
        totalXPAvailable: challenges
          .filter((c) => !c.completed)
          .reduce((sum, c) => sum + c.xpReward, 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch challenges",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamification/challenges
 * Claim a completed challenge reward
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, userId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: "challengeId is required" },
        { status: 400 }
      );
    }

    const finalUserId = userId || "demo-user";

    // Get user progress
    const userProgressRecords = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, finalUserId))
      .limit(1);

    if (!userProgressRecords.length) {
      return NextResponse.json(
        { success: false, error: "User progress not found" },
        { status: 404 }
      );
    }

    const userProgress = userProgressRecords[0];
    const stats = (userProgress.stats as UserStats) || {};
    const streaks = (userProgress.streaks as StreakData) || {};

    // Find the challenge
    const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];
    const challengeTemplate = allChallenges.find((c) => c.id === challengeId);

    if (!challengeTemplate) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Calculate current progress
    const progress = calculateProgress(challengeId, stats, streaks);
    const isCompleted = progress >= challengeTemplate.target;

    if (!isCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Challenge not yet completed",
          progress,
          target: challengeTemplate.target,
        },
        { status: 400 }
      );
    }

    // Award XP (this would normally check if already claimed)
    const newTotalXP = userProgress.totalXP + challengeTemplate.xpReward;
    const newCurrentXP = userProgress.currentXP + challengeTemplate.xpReward;

    await db
      .update(userGamification)
      .set({
        totalXP: newTotalXP,
        currentXP: newCurrentXP,
        updatedAt: new Date(),
      })
      .where(eq(userGamification.userId, finalUserId));

    return NextResponse.json({
      success: true,
      message: `Challenge completed! +${challengeTemplate.xpReward} XP`,
      xpAwarded: challengeTemplate.xpReward,
      newTotalXP,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to claim challenge",
      },
      { status: 500 }
    );
  }
}
