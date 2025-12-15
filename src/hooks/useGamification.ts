/**
 * Gamification Hooks (F179)
 * Wire Gamification UI to XP/Achievements API
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/client";
import { useAuthStore } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type AchievementCategory =
  | "monitoring"
  | "content"
  | "audit"
  | "optimization"
  | "engagement"
  | "milestone"
  | "special";

export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  condition: {
    type: string;
    target: number;
    current?: number;
  };
  unlockedAt?: string;
  progress?: number;
}

export interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  progress: number;
}

export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  source: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Streak {
  type: "daily_login" | "daily_action" | "audit_streak" | "content_streak";
  current: number;
  longest: number;
  lastActivityAt: string;
  multiplier: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  level: number;
  totalXP: number;
  achievements: number;
  isCurrentUser?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface GamificationProfile {
  userId: string;
  level: UserLevel;
  achievements: Achievement[];
  recentXP: XPTransaction[];
  streaks: Streak[];
  badges: Badge[];
  stats: {
    totalAchievements: number;
    achievementCompletion: number;
    longestStreak: number;
    rank: number;
  };
}

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
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchGamificationProfile(userId: string): Promise<GamificationProfile> {
  const response = await fetch(`/api/gamification?action=progress&userId=${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch gamification profile");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch gamification profile");
  }

  // Transform API response to GamificationProfile shape
  const progress = data.progress;
  return {
    userId: progress.userId,
    level: {
      level: progress.currentLevel?.level || progress.level || 1,
      title: progress.currentLevel?.name || "Novice",
      currentXP: progress.currentXP || 0,
      requiredXP: progress.currentLevel?.maxXP || 100,
      totalXP: progress.totalXP || 0,
      progress: progress.levelProgress?.percentage || 0,
    },
    achievements: progress.achievements?.map((a: { achievementId: string; unlockedAt: Date; xpAwarded: number }) => ({
      id: a.achievementId,
      name: a.achievementId,
      unlockedAt: a.unlockedAt?.toString(),
      xpReward: a.xpAwarded,
    })) || [],
    recentXP: progress.actionHistory?.slice(0, 10).map((a: { action: string; xpAwarded: number; timestamp: Date }) => ({
      id: Math.random().toString(),
      amount: a.xpAwarded,
      reason: a.action,
      source: "action",
      createdAt: a.timestamp?.toString(),
    })) || [],
    streaks: [
      {
        type: "daily_login" as const,
        current: progress.streaks?.currentDaily || 0,
        longest: progress.streaks?.longestDaily || 0,
        lastActivityAt: progress.streaks?.lastLoginDate || "",
        multiplier: 1,
      },
    ],
    badges: [],
    stats: {
      totalAchievements: progress.achievements?.length || 0,
      achievementCompletion: 0,
      longestStreak: progress.streaks?.longestDaily || 0,
      rank: progress.leaderboard?.position || 0,
    },
  };
}

async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const response = await fetch(`/api/gamification?action=achievements&userId=${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch achievements");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch achievements");
  }

  // Transform API response to Achievement[] shape
  const all = data.all || [];
  return all.map((a: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    xpReward: number;
    requirement: { target: number };
    unlocked?: boolean;
    unlockedAt?: string;
    progress?: number;
  }) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category as AchievementCategory,
    rarity: tierToRarity(a.tier),
    xpReward: a.xpReward,
    condition: {
      type: "count",
      target: a.requirement?.target || 1,
      current: a.progress ? Math.floor((a.progress / 100) * (a.requirement?.target || 1)) : 0,
    },
    unlockedAt: a.unlocked ? a.unlockedAt : undefined,
    progress: a.progress,
  }));
}

function tierToRarity(tier: string): AchievementRarity {
  const map: Record<string, AchievementRarity> = {
    bronze: "common",
    silver: "uncommon",
    gold: "rare",
    platinum: "epic",
    diamond: "legendary",
  };
  return map[tier] || "common";
}

async function fetchLeaderboard(
  timeframe: string = "all",
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const response = await fetch(`/api/gamification?action=leaderboard`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch leaderboard");
  }

  // Transform API response to LeaderboardEntry[] shape
  return (data.leaderboard || []).slice(0, limit).map((entry: {
    rank: number;
    userId: string;
    username: string;
    level: number;
    totalXP: number;
    badge: string;
  }) => ({
    rank: entry.rank,
    userId: entry.userId,
    userName: entry.username,
    level: entry.level,
    totalXP: entry.totalXP,
    achievements: 0,
  }));
}

// =============================================================================
// Profile Hooks
// =============================================================================

/**
 * Hook to fetch user's gamification profile
 */
export function useGamificationProfile(
  options?: Omit<UseQueryOptions<GamificationProfile>, "queryKey" | "queryFn">
) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.gamification.profile(user?.id || ""),
    queryFn: () => fetchGamificationProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch user's current level and XP
 */
export function useUserLevel() {
  const { data: profile } = useGamificationProfile();
  return profile?.level;
}

/**
 * Hook to fetch user's XP history
 */
export function useXPHistory(limit: number = 20) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gamification", "xp-history", user?.id, limit],
    queryFn: async () => {
      // Use the progress endpoint which includes action history
      const response = await fetch(
        `/api/gamification?action=progress&userId=${user!.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch XP history");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch XP history");
      }
      // Transform action history to XPTransaction format
      const history = data.progress?.actionHistory || [];
      return history.slice(0, limit).map((a: { action: string; xpAwarded: number; timestamp: string }) => ({
        id: Math.random().toString(),
        amount: a.xpAwarded,
        reason: a.action,
        source: "action",
        createdAt: a.timestamp,
      })) as XPTransaction[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });
}

// =============================================================================
// Achievement Hooks
// =============================================================================

/**
 * Hook to fetch all achievements (earned and unearned)
 */
export function useAchievements(
  options?: Omit<UseQueryOptions<Achievement[]>, "queryKey" | "queryFn">
) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.gamification.achievements(user?.id || ""),
    queryFn: () => fetchAchievements(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to fetch achievements by category
 */
export function useAchievementsByCategory(category: AchievementCategory) {
  const { data: achievements } = useAchievements();

  return {
    achievements: achievements?.filter((a) => a.category === category) || [],
    earned: achievements?.filter((a) => a.category === category && a.unlockedAt)?.length || 0,
    total: achievements?.filter((a) => a.category === category)?.length || 0,
  };
}

/**
 * Hook to fetch recent achievements
 */
export function useRecentAchievements(limit: number = 5) {
  const { data: achievements } = useAchievements();

  return (
    achievements
      ?.filter((a) => a.unlockedAt)
      ?.sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      ?.slice(0, limit) || []
  );
}

/**
 * Hook to fetch achievements in progress
 */
export function useAchievementsInProgress() {
  const { data: achievements } = useAchievements();

  return (
    achievements
      ?.filter((a) => !a.unlockedAt && a.progress && a.progress > 0)
      ?.sort((a, b) => (b.progress || 0) - (a.progress || 0)) || []
  );
}

/**
 * Hook to claim achievement reward (if manual claim needed)
 */
export function useClaimAchievement() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (achievementId: string) => {
      // Use unlock_achievement action to claim/unlock the achievement
      const response = await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock_achievement",
          achievementId,
          userId: user?.id,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to claim achievement");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to claim achievement");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.profile(user?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.achievements(user?.id || ""),
      });
    },
  });
}

// =============================================================================
// Streak Hooks
// =============================================================================

/**
 * Hook to fetch user's streaks
 */
export function useStreaks() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gamification", "streaks", user?.id],
    queryFn: async () => {
      // Use stats endpoint which includes streaks
      const response = await fetch(`/api/gamification?action=stats&userId=${user!.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch streaks");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch streaks");
      }
      // Transform API streaks to Streak[] format
      const apiStreaks = data.streaks || {};
      return [
        {
          type: "daily_login" as const,
          current: apiStreaks.currentDaily || 0,
          longest: apiStreaks.longestDaily || 0,
          lastActivityAt: apiStreaks.lastLoginDate || "",
          multiplier: 1 + Math.floor((apiStreaks.currentDaily || 0) / 7) * 0.1,
        },
      ] as Streak[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to check in for daily streak
 */
export function useCheckInStreak() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async () => {
      // Use the login action to record daily check-in
      const response = await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login" }),
      });
      if (!response.ok) {
        throw new Error("Failed to check in");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to check in");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gamification", "streaks", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.profile(user?.id || ""),
      });
    },
  });
}

// =============================================================================
// Leaderboard Hooks
// =============================================================================

/**
 * Hook to fetch leaderboard
 */
export function useLeaderboard(
  timeframe: "daily" | "weekly" | "monthly" | "all" = "all",
  limit: number = 50
) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.gamification.leaderboard(timeframe),
    queryFn: () => fetchLeaderboard(timeframe, limit),
    staleTime: 1000 * 60 * 5,
    select: (data) => {
      // Mark current user in leaderboard
      return data.map((entry) => ({
        ...entry,
        isCurrentUser: entry.userId === user?.id,
      }));
    },
  });
}

/**
 * Hook to fetch user's rank
 */
export function useUserRank() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gamification", "rank", user?.id],
    queryFn: async () => {
      // Use progress endpoint which includes leaderboard position
      const response = await fetch(`/api/gamification?action=progress&userId=${user!.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch rank");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch rank");
      }
      // Extract leaderboard position from progress response
      const leaderboard = data.progress?.leaderboard || {};
      return {
        rank: leaderboard.rank || 0,
        percentile: leaderboard.percentile || 0,
        change: 0, // API doesn't track rank change over time
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });
}

// =============================================================================
// Challenge Hooks
// =============================================================================

/**
 * Hook to fetch active challenges
 * Note: API doesn't have a dedicated challenges endpoint yet,
 * returning empty array for now - challenges can be derived from achievements
 */
export function useChallenges() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gamification", "challenges", user?.id],
    queryFn: async (): Promise<Challenge[]> => {
      // Challenges endpoint not yet implemented in API
      // Return empty array - challenges UI will show "No active challenges"
      return [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch daily challenges
 */
export function useDailyChallenges() {
  const { data: challenges } = useChallenges();
  return challenges?.filter((c) => c.type === "daily") || [];
}

/**
 * Hook to fetch weekly challenges
 */
export function useWeeklyChallenges() {
  const { data: challenges } = useChallenges();
  return challenges?.filter((c) => c.type === "weekly") || [];
}

/**
 * Hook to claim challenge reward
 * Note: API doesn't have challenges endpoint yet - this is a placeholder
 */
export function useClaimChallengeReward() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (_challengeId: string) => {
      // Challenges endpoint not yet implemented
      // Return success to prevent UI errors
      return { success: true, message: "Challenge rewards coming soon" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gamification", "challenges", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.profile(user?.id || ""),
      });
    },
  });
}

// =============================================================================
// Badge Hooks
// =============================================================================

/**
 * Hook to fetch user's badges
 * Badges are derived from unlocked achievements
 */
export function useBadges() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gamification", "badges", user?.id],
    queryFn: async (): Promise<Badge[]> => {
      // Fetch achievements and derive badges from unlocked ones
      const response = await fetch(`/api/gamification?action=achievements&userId=${user!.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch badges");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch badges");
      }
      // Transform unlocked achievements to badges
      const all = data.all || [];
      return all
        .filter((a: { unlocked?: boolean }) => a.unlocked)
        .map((a: { id: string; name: string; description: string; icon: string; tier: string }) => ({
          id: `badge-${a.id}`,
          name: a.name,
          description: a.description,
          icon: a.icon || "🏆",
          tier: a.tier as "bronze" | "silver" | "gold" | "platinum" | "diamond",
          earnedAt: new Date().toISOString(),
          isDisplayed: false,
        }));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to set displayed badge
 * Note: API doesn't have badge display endpoint yet - this is a placeholder
 */
export function useSetDisplayedBadge() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (_badgeId: string) => {
      // Badge display endpoint not yet implemented
      // Return success to prevent UI errors
      return { success: true, message: "Badge display feature coming soon" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.profile(user?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: ["gamification", "badges", user?.id],
      });
    },
  });
}

// =============================================================================
// XP Earning Hook
// =============================================================================

/**
 * Hook to award XP (used internally by other features)
 */
export function useAwardXP() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async ({
      amount: _amount,
      reason: _reason,
      source,
      metadata,
    }: {
      amount: number;
      reason: string;
      source: string;
      metadata?: Record<string, unknown>;
    }) => {
      // Use the record action to award XP based on action type
      // The source maps to an actionType in the API
      const response = await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record",
          actionType: source, // e.g., "run_audit", "generate_content", etc.
          userId: user?.id,
          metadata,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to award XP");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to award XP");
      }
      // Transform response to expected format
      return {
        newXP: data.progress?.totalXP || 0,
        levelUp: data.result?.leveledUp || false,
        newLevel: data.result?.newLevel?.level,
        achievementsUnlocked: data.result?.newAchievements?.map((a: { id: string; name: string }) => ({
          id: a.id,
          name: a.name,
        })) || [],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.profile(user?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.achievements(user?.id || ""),
      });
    },
  });
}

// =============================================================================
// Combined Dashboard Hook
// =============================================================================

/**
 * Combined hook for gamification dashboard
 */
export function useGamificationDashboard() {
  const profile = useGamificationProfile();
  const achievements = useAchievements();
  const streaks = useStreaks();
  const leaderboard = useLeaderboard("weekly", 10);
  const challenges = useChallenges();

  const isLoading =
    profile.isLoading ||
    achievements.isLoading ||
    streaks.isLoading ||
    leaderboard.isLoading ||
    challenges.isLoading;

  const error =
    profile.error ||
    achievements.error ||
    streaks.error ||
    leaderboard.error ||
    challenges.error;

  return {
    profile: profile.data,
    achievements: achievements.data,
    streaks: streaks.data,
    leaderboard: leaderboard.data,
    challenges: challenges.data,
    isLoading,
    error,
    refetch: () => {
      profile.refetch();
      achievements.refetch();
      streaks.refetch();
      leaderboard.refetch();
      challenges.refetch();
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get color for achievement rarity
 */
export function getRarityColor(rarity: AchievementRarity): string {
  const colors: Record<AchievementRarity, string> = {
    common: "text-muted-foreground",
    uncommon: "text-success",
    rare: "text-blue-500",
    epic: "text-purple-500",
    legendary: "text-yellow-500",
  };
  return colors[rarity];
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "Novice",
    5: "Apprentice",
    10: "Practitioner",
    15: "Expert",
    20: "Master",
    25: "Grandmaster",
    30: "Legend",
    35: "Mythic",
    40: "Transcendent",
    50: "Ascended",
  };

  let title = "Novice";
  for (const [lvl, t] of Object.entries(titles)) {
    if (level >= parseInt(lvl)) {
      title = t;
    }
  }
  return title;
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPForLevel(level: number): number {
  // Exponential growth formula
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
