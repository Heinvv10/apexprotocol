/**
 * Gamification API Route (F151)
 * XP calculation, level progression, achievement tracking
 * Now with database persistence for leaderboard and progress
 */

import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  userGamification,
  userAchievements,
  users,
  type StreakData,
  type UserStats,
} from "@/lib/db/schema";
import {
  gamificationEngine,
  createInitialProgress,
  ACHIEVEMENTS,
  LEVELS,
  ACTION_XP_CONFIG,
  type ActionType,
  type UserProgress,
} from "@/lib/gamification";

/**
 * Helper to convert database record to UserProgress type
 */
function dbToUserProgress(
  dbRecord: typeof userGamification.$inferSelect,
  achievements: typeof userAchievements.$inferSelect[]
): UserProgress {
  return {
    userId: dbRecord.userId,
    organizationId: dbRecord.organizationId || "",
    currentXP: dbRecord.currentXP,
    totalXP: dbRecord.totalXP,
    level: dbRecord.level,
    streaks: (dbRecord.streaks as StreakData) || {
      currentDaily: 0,
      longestDaily: 0,
      currentWeekly: 0,
      longestWeekly: 0,
      lastLoginDate: "",
      lastWeekStartDate: "",
    },
    stats: (dbRecord.stats as UserStats) || {
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
    },
    achievements: achievements.map((a) => ({
      achievementId: a.achievementId,
      unlockedAt: a.unlockedAt,
      xpAwarded: a.xpAwarded,
    })),
    actionHistory: [], // Action history not stored in DB, managed in-memory per session
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

/**
 * Get or create user gamification record from database
 */
async function getOrCreateUserProgress(
  userId: string,
  organizationId: string
): Promise<UserProgress> {
  // Try to get existing record
  const existingRecords = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (existingRecords.length > 0) {
    // Get achievements for this user
    const achievements = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    return dbToUserProgress(existingRecords[0], achievements);
  }

  // Create new record
  const initialProgress = createInitialProgress(userId, organizationId);
  const [newRecord] = await db
    .insert(userGamification)
    .values({
      userId,
      organizationId,
      currentXP: initialProgress.currentXP,
      totalXP: initialProgress.totalXP,
      level: initialProgress.level,
      streaks: initialProgress.streaks,
      stats: initialProgress.stats,
    })
    .returning();

  return dbToUserProgress(newRecord, []);
}

/**
 * Save user progress to database
 */
async function saveUserProgress(progress: UserProgress): Promise<void> {
  await db
    .update(userGamification)
    .set({
      currentXP: progress.currentXP,
      totalXP: progress.totalXP,
      level: progress.level,
      streaks: progress.streaks,
      stats: progress.stats,
      updatedAt: new Date(),
    })
    .where(eq(userGamification.userId, progress.userId));
}

/**
 * GET /api/gamification
 * Get user progress, achievements, or leaderboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "progress";
  const userId = searchParams.get("userId") || "demo-user";
  const organizationId = searchParams.get("organizationId") || "demo-org";

  try {
    switch (action) {
      case "progress": {
        // Get or create user progress from database
        const progress = await getOrCreateUserProgress(userId, organizationId);

        const level = gamificationEngine.getLevelForXP(progress.totalXP);
        const levelProgress = gamificationEngine.getLevelProgress(progress.totalXP);
        const nextLevel = gamificationEngine.getNextLevel(progress.totalXP);
        const leaderboard = gamificationEngine.getLeaderboardPosition(userId, progress.totalXP);

        return NextResponse.json({
          success: true,
          progress: {
            ...progress,
            currentLevel: level,
            levelProgress,
            nextLevel,
            leaderboard,
          },
        });
      }

      case "achievements": {
        const progress = await getOrCreateUserProgress(userId, organizationId);

        const achievements = gamificationEngine.getAchievementsWithStatus(progress);

        // Group by category
        const grouped = achievements.reduce(
          (acc, achievement) => {
            if (!acc[achievement.category]) {
              acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
          },
          {} as Record<string, typeof achievements>
        );

        // Summary stats
        const summary = {
          total: achievements.length,
          unlocked: achievements.filter((a) => a.unlocked).length,
          xpFromAchievements: achievements
            .filter((a) => a.unlocked)
            .reduce((sum, a) => sum + a.xpReward, 0),
        };

        return NextResponse.json({
          success: true,
          achievements: grouped,
          all: achievements,
          summary,
        });
      }

      case "levels": {
        return NextResponse.json({
          success: true,
          levels: LEVELS,
        });
      }

      case "actions": {
        return NextResponse.json({
          success: true,
          actions: ACTION_XP_CONFIG,
        });
      }

      case "leaderboard": {
        // Query database for top users by XP
        const leaderboardData = await db
          .select({
            rank: userGamification.id, // Will calculate rank client-side
            userId: userGamification.userId,
            totalXP: userGamification.totalXP,
            level: userGamification.level,
            streaks: userGamification.streaks,
          })
          .from(userGamification)
          .orderBy(desc(userGamification.totalXP))
          .limit(10);

        // Join with users to get display names
        const leaderboardWithNames = await Promise.all(
          leaderboardData.map(async (entry, index) => {
            const userRecords = await db
              .select({ name: users.name, email: users.email })
              .from(users)
              .where(eq(users.id, entry.userId))
              .limit(1);

            const user = userRecords[0];
            const levelInfo = gamificationEngine.getLevelForXP(entry.totalXP);
            const streakData = entry.streaks as StreakData | null;

            return {
              rank: index + 1,
              userId: entry.userId,
              username: user?.name || user?.email?.split("@")[0] || "Anonymous",
              totalXP: entry.totalXP,
              level: entry.level,
              levelName: levelInfo.name,
              levelBadge: levelInfo.badge,
              currentStreak: streakData?.currentDaily || 0,
            };
          })
        );

        return NextResponse.json({
          success: true,
          leaderboard: leaderboardWithNames,
        });
      }

      case "stats": {
        const progress = await getOrCreateUserProgress(userId, organizationId);

        return NextResponse.json({
          success: true,
          stats: progress.stats,
          streaks: progress.streaks,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get gamification data",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamification
 * Record an action and award XP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action: requestAction, userId, organizationId, actionType, metadata } = body;

    const finalUserId = userId || "demo-user";
    const finalOrgId = organizationId || "demo-org";

    switch (requestAction || "record") {
      case "record": {
        if (!actionType) {
          return NextResponse.json(
            { success: false, error: "actionType is required" },
            { status: 400 }
          );
        }

        // Validate action type
        const validActions = ACTION_XP_CONFIG.map((a) => a.action);
        if (!validActions.includes(actionType)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid action type: ${actionType}. Valid types: ${validActions.join(", ")}`,
            },
            { status: 400 }
          );
        }

        // Get or create user progress from database
        const progress = await getOrCreateUserProgress(finalUserId, finalOrgId);

        // Process the action
        const { updatedProgress, result } = gamificationEngine.processAction(
          actionType as ActionType,
          progress,
          metadata
        );

        // Save updated progress to database
        await saveUserProgress(updatedProgress);

        // Get updated level info
        const level = gamificationEngine.getLevelForXP(updatedProgress.totalXP);
        const levelProgress = gamificationEngine.getLevelProgress(updatedProgress.totalXP);

        return NextResponse.json({
          success: true,
          result: {
            ...result,
            currentLevel: level,
            levelProgress,
          },
          progress: {
            currentXP: updatedProgress.currentXP,
            totalXP: updatedProgress.totalXP,
            level: updatedProgress.level,
          },
        });
      }

      case "login": {
        // Record daily login and update streak from database
        const progress = await getOrCreateUserProgress(finalUserId, finalOrgId);

        // Update streak
        const updatedProgress = gamificationEngine.updateDailyStreak(progress);

        // Award daily login XP
        const { updatedProgress: finalProgress, result } = gamificationEngine.processAction(
          "daily_login",
          updatedProgress
        );

        // Check for streak achievements
        let weeklyResult = null;
        if (finalProgress.streaks.currentDaily === 7) {
          const { result: wr } = gamificationEngine.processAction("weekly_streak", finalProgress);
          weeklyResult = wr;
        }

        // Save progress to database
        await saveUserProgress(finalProgress);

        return NextResponse.json({
          success: true,
          dailyXP: result,
          weeklyBonus: weeklyResult,
          streaks: finalProgress.streaks,
          progress: {
            currentXP: finalProgress.currentXP,
            totalXP: finalProgress.totalXP,
            level: finalProgress.level,
          },
        });
      }

      case "unlock_achievement": {
        const { achievementId } = body;
        if (!achievementId) {
          return NextResponse.json(
            { success: false, error: "achievementId is required" },
            { status: 400 }
          );
        }

        // Validate achievement exists
        const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!achievement) {
          return NextResponse.json(
            { success: false, error: `Achievement not found: ${achievementId}` },
            { status: 404 }
          );
        }

        // Get user progress from database
        const progress = await getOrCreateUserProgress(finalUserId, finalOrgId);

        // Check if already unlocked
        if (progress.achievements.some((a) => a.achievementId === achievementId)) {
          return NextResponse.json({
            success: false,
            error: "Achievement already unlocked",
          });
        }

        // Insert achievement record
        await db.insert(userAchievements).values({
          userId: finalUserId,
          achievementId,
          xpAwarded: achievement.xpReward,
        });

        // Update user XP and level
        const newTotalXP = progress.totalXP + achievement.xpReward;
        const newCurrentXP = progress.currentXP + achievement.xpReward;
        const newLevel = gamificationEngine.getLevelForXP(newTotalXP);

        await db
          .update(userGamification)
          .set({
            totalXP: newTotalXP,
            currentXP: newCurrentXP,
            level: newLevel.level,
            updatedAt: new Date(),
          })
          .where(eq(userGamification.userId, finalUserId));

        return NextResponse.json({
          success: true,
          achievement,
          xpAwarded: achievement.xpReward,
          newLevel: newLevel.level !== progress.level ? newLevel : null,
          progress: {
            currentXP: newCurrentXP,
            totalXP: newTotalXP,
            level: newLevel.level,
          },
        });
      }

      case "reset": {
        // Reset user progress (for testing) - delete and recreate
        await db.delete(userAchievements).where(eq(userAchievements.userId, finalUserId));
        await db.delete(userGamification).where(eq(userGamification.userId, finalUserId));

        const newProgress = await getOrCreateUserProgress(finalUserId, finalOrgId);

        return NextResponse.json({
          success: true,
          message: "Progress reset successfully",
          progress: newProgress,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${requestAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process gamification action",
      },
      { status: 500 }
    );
  }
}
