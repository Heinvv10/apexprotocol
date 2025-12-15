/**
 * Gamification API Route (F151)
 * XP calculation, level progression, achievement tracking
 */

import { NextRequest, NextResponse } from "next/server";
import {
  gamificationEngine,
  createInitialProgress,
  ACHIEVEMENTS,
  LEVELS,
  ACTION_XP_CONFIG,
  type ActionType,
  type UserProgress,
} from "@/lib/gamification";

// In-memory storage for demo (in production, use database)
const userProgressStore = new Map<string, UserProgress>();

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
        // Get or create user progress
        let progress = userProgressStore.get(userId);
        if (!progress) {
          progress = createInitialProgress(userId, organizationId);
          userProgressStore.set(userId, progress);
        }

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
        let progress = userProgressStore.get(userId);
        if (!progress) {
          progress = createInitialProgress(userId, organizationId);
        }

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
        // TODO: Implement database query
        // SELECT user_id, username, level, total_xp FROM user_progress
        // ORDER BY total_xp DESC LIMIT 10
        // Returns empty array until database is connected
        return NextResponse.json({
          success: true,
          leaderboard: [],
          message: "Database connection required for leaderboard data",
        });
      }

      case "stats": {
        let progress = userProgressStore.get(userId);
        if (!progress) {
          progress = createInitialProgress(userId, organizationId);
        }

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

        // Get or create user progress
        let progress = userProgressStore.get(finalUserId);
        if (!progress) {
          progress = createInitialProgress(finalUserId, finalOrgId);
        }

        // Process the action
        const { updatedProgress, result } = gamificationEngine.processAction(
          actionType as ActionType,
          progress,
          metadata
        );

        // Save updated progress
        userProgressStore.set(finalUserId, updatedProgress);

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
        // Record daily login and update streak
        let progress = userProgressStore.get(finalUserId);
        if (!progress) {
          progress = createInitialProgress(finalUserId, finalOrgId);
        }

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

        // Save progress
        userProgressStore.set(finalUserId, finalProgress);

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

        // Get user progress
        let progress = userProgressStore.get(finalUserId);
        if (!progress) {
          progress = createInitialProgress(finalUserId, finalOrgId);
        }

        // Check if already unlocked
        if (progress.achievements.some((a) => a.achievementId === achievementId)) {
          return NextResponse.json({
            success: false,
            error: "Achievement already unlocked",
          });
        }

        // Unlock achievement
        const updatedProgress: UserProgress = {
          ...progress,
          achievements: [
            ...progress.achievements,
            {
              achievementId,
              unlockedAt: new Date(),
              xpAwarded: achievement.xpReward,
            },
          ],
          totalXP: progress.totalXP + achievement.xpReward,
          currentXP: progress.currentXP + achievement.xpReward,
          updatedAt: new Date(),
        };

        // Recalculate level
        const newLevel = gamificationEngine.getLevelForXP(updatedProgress.totalXP);
        updatedProgress.level = newLevel.level;

        // Save progress
        userProgressStore.set(finalUserId, updatedProgress);

        return NextResponse.json({
          success: true,
          achievement,
          xpAwarded: achievement.xpReward,
          newLevel: newLevel.level !== progress.level ? newLevel : null,
          progress: {
            currentXP: updatedProgress.currentXP,
            totalXP: updatedProgress.totalXP,
            level: updatedProgress.level,
          },
        });
      }

      case "reset": {
        // Reset user progress (for testing)
        const newProgress = createInitialProgress(finalUserId, finalOrgId);
        userProgressStore.set(finalUserId, newProgress);

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
