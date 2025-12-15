"use client";

import * as React from "react";
import {
  Trophy,
  Star,
  Zap,
  Target,
  TrendingUp,
  Award,
  Crown,
  Flame,
  CheckCircle2,
  Lock,
  Gift,
  Sparkles,
  Calendar,
  BarChart3,
  FileText,
  Users,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGamificationProfile,
  useAchievements,
  useStreaks,
} from "@/hooks/useGamification";

interface UserLevel {
  level: number;
  name: string;
  xp: number;
  xpToNext: number;
  totalXp: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string;
  xpReward: number;
}

interface Streak {
  type: string;
  current: number;
  best: number;
  lastActivity: string;
}

const levelNames = [
  "Newcomer",
  "Beginner",
  "Explorer",
  "Apprentice",
  "Practitioner",
  "Skilled",
  "Expert",
  "Master",
  "Guru",
  "Champion",
  "Legend",
  "Brand Champion",
  "GEO Master",
  "Visibility Titan",
  "AI Pioneer",
];

// Icon mapping for achievements from API
const iconMap: Record<string, React.ElementType> = {
  target: Target,
  star: Star,
  trophy: Trophy,
  flame: Flame,
  crown: Crown,
  award: Award,
  gift: Gift,
  zap: Zap,
  trending: TrendingUp,
  calendar: Calendar,
  chart: BarChart3,
  file: FileText,
  users: Users,
  shield: Shield,
  check: CheckCircle2,
  sparkles: Sparkles,
};

// Color mapping for achievements
const colorMap: Record<string, { color: string; bgColor: string }> = {
  success: { color: "text-success", bgColor: "bg-success/20" },
  warning: { color: "text-warning", bgColor: "bg-warning/20" },
  primary: { color: "text-primary", bgColor: "bg-primary/20" },
  "accent-blue": { color: "text-accent-blue", bgColor: "bg-accent-blue/20" },
  "accent-pink": { color: "text-accent-pink", bgColor: "bg-accent-pink/20" },
};

// Rarity mapping
const rarityMap: Record<string, "common" | "rare" | "epic" | "legendary"> = {
  common: "common",
  uncommon: "rare",
  rare: "rare",
  epic: "epic",
  legendary: "legendary",
};

const rarityColors = {
  common: "from-slate-400 to-slate-500",
  rare: "from-[hsl(var(--accent-blue))] to-[hsl(var(--info))]",
  epic: "from-[hsl(var(--accent-purple))] to-[hsl(var(--primary))]",
  legendary: "from-[hsl(var(--warning))] to-[hsl(var(--warning-muted))]",
};

const rarityLabels = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

interface LevelsAchievementsProps {
  className?: string;
}

// Helper to transform API achievement to component Achievement type
function transformAchievement(
  apiAchievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    category: string;
    progress?: number;
    maxProgress?: number;
    unlockedAt?: string;
    xpReward: number;
  }
): Achievement {
  // Determine icon based on icon string or category
  const iconKey = apiAchievement.icon?.toLowerCase() || "trophy";
  const Icon = iconMap[iconKey] || Trophy;

  // Determine color based on category or rarity
  const colorKey = apiAchievement.rarity === "legendary" ? "warning"
    : apiAchievement.rarity === "epic" ? "accent-pink"
    : apiAchievement.rarity === "rare" ? "primary"
    : "success";
  const colors = colorMap[colorKey] || colorMap.primary;

  return {
    id: apiAchievement.id,
    name: apiAchievement.name,
    description: apiAchievement.description,
    icon: Icon,
    color: colors.color,
    bgColor: colors.bgColor,
    rarity: rarityMap[apiAchievement.rarity] || "common",
    category: apiAchievement.category,
    progress: apiAchievement.progress,
    maxProgress: apiAchievement.maxProgress,
    unlockedAt: apiAchievement.unlockedAt,
    xpReward: apiAchievement.xpReward,
  };
}

export function LevelsAchievements({ className }: LevelsAchievementsProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Fetch data from API using hooks
  const { data: profile, isLoading: profileLoading } = useGamificationProfile();
  const { data: apiAchievements, isLoading: achievementsLoading } = useAchievements();
  const { data: apiStreaks, isLoading: streaksLoading } = useStreaks();

  const isLoading = profileLoading || achievementsLoading || streaksLoading;

  // Transform API data to component types
  const userLevel: UserLevel = React.useMemo(() => {
    if (!profile) {
      return { level: 1, name: "Newcomer", xp: 0, xpToNext: 100, totalXp: 0 };
    }
    return {
      level: profile.level?.level || 1,
      name: profile.level?.title || levelNames[0],
      xp: profile.level?.currentXP || 0,
      xpToNext: profile.level?.requiredXP || 100,
      totalXp: profile.level?.totalXP || 0,
    };
  }, [profile]);

  const achievements: Achievement[] = React.useMemo(() => {
    if (!apiAchievements) return [];
    return apiAchievements.map(transformAchievement);
  }, [apiAchievements]);

  const streaks: Streak[] = React.useMemo(() => {
    if (!apiStreaks || apiStreaks.length === 0) {
      return [{ type: "Login", current: 0, best: 0, lastActivity: "" }];
    }
    return apiStreaks.map((s) => ({
      type: s.type === "daily_login" ? "Login" : s.type,
      current: s.current,
      best: s.longest,
      lastActivity: s.lastActivityAt || "",
    }));
  }, [apiStreaks]);

  const categories = React.useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return ["all", ...Array.from(cats)];
  }, [achievements]);

  const filteredAchievements = React.useMemo(() => {
    if (selectedCategory === "all") return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [selectedCategory, achievements]);

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Level Progress Section */}
      <div className="card-primary p-6 mb-6">
        <LevelProgressCard level={userLevel} achievementCount={unlockedCount} />
      </div>

      {/* Streaks Section */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {streaks.map((streak) => (
          <StreakCard key={streak.type} streak={streak} />
        ))}
      </div>

      {/* Achievements Section */}
      <div className="card-secondary p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Achievements
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unlockedCount} of {achievements.length} unlocked
            </p>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-muted/20 border border-border/50 rounded-lg text-sm text-foreground"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Achievement Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelProgressCard({ level, achievementCount = 0 }: { level: UserLevel; achievementCount?: number }) {
  const progress = (level.xp / level.xpToNext) * 100;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      {/* Level Badge */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground">
              {level.level}
            </span>
          </div>
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          Level
        </div>
      </div>

      {/* Level Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-foreground">{level.name}</h2>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        {/* XP Progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {level.xp.toLocaleString()} / {level.xpToNext.toLocaleString()} XP
            </span>
            <span className="text-primary font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent-pink rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {(level.xpToNext - level.xp).toLocaleString()} XP to{" "}
          {levelNames[level.level] || "Next Level"}
        </p>

        {/* Total XP */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm text-foreground">
              {level.totalXp.toLocaleString()} Total XP
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              {achievementCount} Achievements
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StreakCard({ streak }: { streak: Streak }) {
  const isActive = streak.current > 0;

  return (
    <div className="card-tertiary p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isActive ? "bg-warning/20 text-warning" : "bg-muted/20 text-muted-foreground"
            )}
          >
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {streak.type} Streak
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-3xl font-bold",
                isActive ? "text-warning" : "text-muted-foreground"
              )}
            >
              {streak.current}
            </span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="text-sm font-medium text-foreground">{streak.best} days</p>
        </div>
      </div>

      {/* Streak visualization */}
      <div className="flex gap-1 mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1.5 rounded-full",
              i < streak.current % 7
                ? "bg-warning"
                : "bg-muted/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievement.icon;
  const isUnlocked = !!achievement.unlockedAt;
  const hasProgress = achievement.progress !== undefined;
  const progress = hasProgress
    ? (achievement.progress! / achievement.maxProgress!) * 100
    : 0;

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        isUnlocked
          ? "bg-card/50 border-border/50"
          : "bg-muted/10 border-border/20"
      )}
    >
      {/* Rarity indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r",
          rarityColors[achievement.rarity]
        )}
      />

      <div className="flex items-start gap-3 mt-2">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isUnlocked ? achievement.bgColor : "bg-muted/20"
          )}
        >
          {isUnlocked ? (
            <Icon className={cn("w-6 h-6", achievement.color)} />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "text-sm font-medium truncate",
              isUnlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {achievement.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {achievement.description}
          </p>

          {/* Progress bar for in-progress achievements */}
          {hasProgress && !isUnlocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">
                  {achievement.progress} / {achievement.maxProgress}
                </span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlocked date */}
          {isUnlocked && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-success">
              <CheckCircle2 className="w-3 h-3" />
              Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* XP Reward */}
      <div className="absolute top-3 right-3">
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
            isUnlocked
              ? "bg-primary/20 text-primary"
              : "bg-muted/20 text-muted-foreground"
          )}
        >
          <Zap className="w-3 h-3" />
          {achievement.xpReward}
        </div>
      </div>

      {/* Rarity label */}
      <div className="mt-3 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{achievement.category}</span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded font-medium bg-gradient-to-r text-white",
            rarityColors[achievement.rarity]
          )}
        >
          {rarityLabels[achievement.rarity]}
        </span>
      </div>
    </div>
  );
}

// Compact widget for profile/sidebar
export function LevelWidget({ className }: { className?: string }) {
  const { data: profile, isLoading } = useGamificationProfile();

  // Default values while loading
  const level = {
    level: profile?.level?.level || 1,
    name: profile?.level?.title || "Newcomer",
    xp: profile?.level?.currentXP || 0,
    xpToNext: profile?.level?.requiredXP || 100,
  };
  const progress = (level.xp / level.xpToNext) * 100;

  if (isLoading) {
    return (
      <div className={cn("card-tertiary p-3", className)}>
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-tertiary p-3", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center">
          <span className="text-sm font-bold text-white">{level.level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {level.name}
          </p>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {level.xp.toLocaleString()} / {level.xpToNext.toLocaleString()} XP
          </p>
        </div>
      </div>
    </div>
  );
}

// Achievement badges for profile header
export function AchievementBadges({ className }: { className?: string }) {
  const { data: apiAchievements, isLoading } = useAchievements();

  // Transform API achievements
  const achievements = React.useMemo(() => {
    if (!apiAchievements) return [];
    return apiAchievements.map(transformAchievement);
  }, [apiAchievements]);

  const recentAchievements = achievements
    .filter((a) => a.unlockedAt)
    .slice(0, 5);

  const totalUnlocked = achievements.filter((a) => a.unlockedAt).length;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recentAchievements.length === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="text-xs text-muted-foreground">No achievements yet</div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {recentAchievements.map((achievement) => {
        const Icon = achievement.icon;
        return (
          <div
            key={achievement.id}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              achievement.bgColor
            )}
            title={achievement.name}
          >
            <Icon className={cn("w-4 h-4", achievement.color)} />
          </div>
        );
      })}
      {totalUnlocked > 5 && (
        <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
          +{totalUnlocked - 5}
        </div>
      )}
    </div>
  );
}
