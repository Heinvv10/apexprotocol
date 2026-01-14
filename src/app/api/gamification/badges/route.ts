/**
 * Gamification Badges API Route
 * Badge collection and display for users
 * Badges are derived from unlocked achievements with special visual representation
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userGamification, userAchievements } from "@/lib/db/schema";
import { ACHIEVEMENTS } from "@/lib/gamification";

// Badge tier colors and styling
const BADGE_TIERS = {
  bronze: {
    color: "#CD7F32",
    bgColor: "rgba(205, 127, 50, 0.1)",
    border: "rgba(205, 127, 50, 0.3)",
  },
  silver: {
    color: "#C0C0C0",
    bgColor: "rgba(192, 192, 192, 0.1)",
    border: "rgba(192, 192, 192, 0.3)",
  },
  gold: {
    color: "#FFD700",
    bgColor: "rgba(255, 215, 0, 0.1)",
    border: "rgba(255, 215, 0, 0.3)",
  },
  platinum: {
    color: "#E5E4E2",
    bgColor: "rgba(229, 228, 226, 0.15)",
    border: "rgba(229, 228, 226, 0.4)",
  },
  diamond: {
    color: "#B9F2FF",
    bgColor: "rgba(185, 242, 255, 0.15)",
    border: "rgba(185, 242, 255, 0.4)",
  },
};

// Badge interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  category: string;
  earnedAt: string;
  xpReward: number;
  styling: {
    color: string;
    bgColor: string;
    border: string;
  };
  achievementId: string;
}

// Badge collection summary
export interface BadgeCollection {
  totalEarned: number;
  totalAvailable: number;
  byTier: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
  byCategory: Record<string, number>;
  recentBadges: Badge[];
  allBadges: Badge[];
  showcaseBadges: Badge[]; // Top 5 for display
}

/**
 * Convert achievement to badge format
 */
function achievementToBadge(
  achievement: typeof ACHIEVEMENTS[number],
  unlockedAt?: Date
): Badge {
  const tierStyling = BADGE_TIERS[achievement.tier];

  return {
    id: `badge_${achievement.id}`,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    tier: achievement.tier,
    category: achievement.category,
    earnedAt: unlockedAt?.toISOString() || "",
    xpReward: achievement.xpReward,
    styling: tierStyling,
    achievementId: achievement.id,
  };
}

/**
 * GET /api/gamification/badges
 * Get user's badge collection
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo-user";
  const showcase = searchParams.get("showcase") === "true";

  try {
    // Get user's unlocked achievements
    const userAchievementRecords = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    // Map achievement IDs to unlock dates
    const unlockedMap = new Map(
      userAchievementRecords.map((ua) => [ua.achievementId, ua.unlockedAt])
    );

    // Convert unlocked achievements to badges
    const earnedBadges: Badge[] = [];
    const availableBadges: Badge[] = [];

    ACHIEVEMENTS.forEach((achievement) => {
      const unlockedAt = unlockedMap.get(achievement.id);
      const badge = achievementToBadge(achievement, unlockedAt ?? undefined);

      if (unlockedAt) {
        earnedBadges.push(badge);
      } else if (!achievement.secret) {
        // Only show non-secret badges as available
        availableBadges.push(badge);
      }
    });

    // Sort earned badges by date (most recent first)
    earnedBadges.sort((a, b) =>
      new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
    );

    // If only showcase is requested, return top 5
    if (showcase) {
      // Sort by tier value for showcase (diamond > platinum > gold > silver > bronze)
      const tierValue = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
      const showcaseBadges = [...earnedBadges]
        .sort((a, b) => tierValue[b.tier] - tierValue[a.tier])
        .slice(0, 5);

      return NextResponse.json({
        success: true,
        showcaseBadges,
      });
    }

    // Calculate tier counts
    const byTier = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0,
    };

    // Calculate category counts
    const byCategory: Record<string, number> = {};

    earnedBadges.forEach((badge) => {
      byTier[badge.tier]++;
      byCategory[badge.category] = (byCategory[badge.category] || 0) + 1;
    });

    // Get recent badges (last 10)
    const recentBadges = earnedBadges.slice(0, 10);

    // Showcase badges (top 5 by tier)
    const tierValue = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
    const showcaseBadges = [...earnedBadges]
      .sort((a, b) => tierValue[b.tier] - tierValue[a.tier])
      .slice(0, 5);

    const collection: BadgeCollection = {
      totalEarned: earnedBadges.length,
      totalAvailable: ACHIEVEMENTS.filter((a) => !a.secret).length,
      byTier,
      byCategory,
      recentBadges,
      allBadges: earnedBadges,
      showcaseBadges,
    };

    return NextResponse.json({
      success: true,
      collection,
      availableBadges: availableBadges.slice(0, 10), // Show some available badges as goals
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch badges",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamification/badges
 * Update badge showcase selection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, showcaseBadgeIds } = body;

    if (!showcaseBadgeIds || !Array.isArray(showcaseBadgeIds)) {
      return NextResponse.json(
        { success: false, error: "showcaseBadgeIds array is required" },
        { status: 400 }
      );
    }

    if (showcaseBadgeIds.length > 5) {
      return NextResponse.json(
        { success: false, error: "Maximum 5 badges can be showcased" },
        { status: 400 }
      );
    }

    const finalUserId = userId || "demo-user";

    // Verify user owns these badges
    const userAchievementRecords = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, finalUserId));

    const unlockedIds = new Set(
      userAchievementRecords.map((ua) => `badge_${ua.achievementId}`)
    );

    const invalidBadges = showcaseBadgeIds.filter((id: string) => !unlockedIds.has(id));
    if (invalidBadges.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `User does not own these badges: ${invalidBadges.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // In a real implementation, we would store this preference
    // For now, just acknowledge the request
    return NextResponse.json({
      success: true,
      message: "Showcase badges updated",
      showcaseBadgeIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update badges",
      },
      { status: 500 }
    );
  }
}
