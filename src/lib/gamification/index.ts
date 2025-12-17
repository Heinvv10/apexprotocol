/**
 * Gamification System (F151)
 * XP calculation, level progression, achievement tracking
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

export type ActionType =
  | "brand_created"
  | "audit_completed"
  | "audit_started"
  | "mention_tracked"
  | "content_generated"
  | "recommendation_completed"
  | "recommendation_dismissed"
  | "report_generated"
  | "integration_connected"
  | "team_member_invited"
  | "profile_completed"
  | "first_login"
  | "daily_login"
  | "weekly_streak"
  | "monthly_streak"
  | "geo_score_improved"
  | "all_recommendations_done"
  | "crisis_resolved"
  | "competitor_added"
  | "alert_configured"
  | "export_created";

export interface ActionXPConfig {
  action: ActionType;
  baseXP: number;
  multiplier?: number;
  maxDaily?: number;
  cooldown?: number; // in seconds
  description: string;
}

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  badge: string;
  perks: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  xpReward: number;
  requirement: AchievementRequirement;
  secret?: boolean;
}

export type AchievementCategory =
  | "monitoring"
  | "auditing"
  | "content"
  | "engagement"
  | "optimization"
  | "team"
  | "streak"
  | "special";

export interface AchievementRequirement {
  type: "count" | "threshold" | "streak" | "combination" | "milestone";
  action?: ActionType;
  target: number;
  timeframe?: "daily" | "weekly" | "monthly" | "all_time";
  conditions?: Record<string, unknown>;
}

export interface UserProgress {
  userId: string;
  organizationId: string;
  currentXP: number;
  totalXP: number;
  level: number;
  achievements: UnlockedAchievement[];
  actionHistory: ActionRecord[];
  streaks: StreakData;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: Date;
  xpAwarded: number;
}

export interface ActionRecord {
  action: ActionType;
  xpAwarded: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface StreakData {
  currentDaily: number;
  longestDaily: number;
  currentWeekly: number;
  longestWeekly: number;
  lastLoginDate: string;
  lastWeekStartDate: string;
}

export interface UserStats {
  totalAudits: number;
  totalMentions: number;
  totalContent: number;
  totalRecommendations: number;
  recommendationsCompleted: number;
  brandsCreated: number;
  reportsGenerated: number;
  integrationsConnected: number;
  teamMembersInvited: number;
  crisesResolved: number;
  geoScoreImprovements: number;
}

export interface XPCalculationResult {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  breakdown: XPBreakdownItem[];
  newLevel?: Level;
  leveledUp: boolean;
  newAchievements: Achievement[];
}

export interface XPBreakdownItem {
  source: string;
  amount: number;
  multiplier?: number;
}

// =============================================================================
// Configuration
// =============================================================================

export const ACTION_XP_CONFIG: ActionXPConfig[] = [
  // Brand & Setup
  { action: "brand_created", baseXP: 100, description: "Create a new brand" },
  { action: "profile_completed", baseXP: 50, description: "Complete your profile" },
  { action: "first_login", baseXP: 25, description: "First time login" },

  // Daily Engagement
  { action: "daily_login", baseXP: 10, maxDaily: 1, description: "Daily login bonus" },
  { action: "weekly_streak", baseXP: 50, description: "Maintain weekly streak" },
  { action: "monthly_streak", baseXP: 200, description: "Maintain monthly streak" },

  // Auditing
  { action: "audit_started", baseXP: 15, description: "Start an audit" },
  { action: "audit_completed", baseXP: 50, multiplier: 1.5, description: "Complete an audit" },

  // Monitoring
  { action: "mention_tracked", baseXP: 5, maxDaily: 100, description: "Track a mention" },
  { action: "competitor_added", baseXP: 25, description: "Add a competitor" },
  { action: "alert_configured", baseXP: 20, description: "Configure an alert" },

  // Content & Recommendations
  { action: "content_generated", baseXP: 30, description: "Generate AI content" },
  { action: "recommendation_completed", baseXP: 25, multiplier: 1.2, description: "Complete a recommendation" },
  { action: "recommendation_dismissed", baseXP: 5, description: "Dismiss a recommendation" },
  { action: "all_recommendations_done", baseXP: 100, description: "Complete all recommendations" },

  // Reports & Exports
  { action: "report_generated", baseXP: 20, description: "Generate a report" },
  { action: "export_created", baseXP: 10, description: "Export data" },

  // Integrations & Team
  { action: "integration_connected", baseXP: 40, description: "Connect an integration" },
  { action: "team_member_invited", baseXP: 30, description: "Invite a team member" },

  // Performance
  { action: "geo_score_improved", baseXP: 75, multiplier: 2, description: "Improve GEO score" },
  { action: "crisis_resolved", baseXP: 100, description: "Resolve a crisis alert" },
];

export const LEVELS: Level[] = [
  { level: 1, name: "Novice", minXP: 0, maxXP: 100, badge: "🌱", perks: ["Basic dashboard access"] },
  { level: 2, name: "Explorer", minXP: 100, maxXP: 300, badge: "🔍", perks: ["Custom reports"] },
  { level: 3, name: "Analyst", minXP: 300, maxXP: 600, badge: "📊", perks: ["Advanced filters"] },
  { level: 4, name: "Strategist", minXP: 600, maxXP: 1000, badge: "🎯", perks: ["Priority support"] },
  { level: 5, name: "Expert", minXP: 1000, maxXP: 1500, badge: "⭐", perks: ["Beta features"] },
  { level: 6, name: "Master", minXP: 1500, maxXP: 2200, badge: "🏆", perks: ["Custom integrations"] },
  { level: 7, name: "Guru", minXP: 2200, maxXP: 3000, badge: "💎", perks: ["White-label options"] },
  { level: 8, name: "Legend", minXP: 3000, maxXP: 4000, badge: "👑", perks: ["Dedicated account manager"] },
  { level: 9, name: "Titan", minXP: 4000, maxXP: 5500, badge: "🔥", perks: ["Custom AI training"] },
  { level: 10, name: "Apex", minXP: 5500, maxXP: Infinity, badge: "🚀", perks: ["Full platform access", "VIP support"] },
];

export const ACHIEVEMENTS: Achievement[] = [
  // Monitoring Achievements
  {
    id: "first_mention",
    name: "First Mention",
    description: "Track your first brand mention",
    icon: "👁️",
    category: "monitoring",
    tier: "bronze",
    xpReward: 25,
    requirement: { type: "count", action: "mention_tracked", target: 1 },
  },
  {
    id: "mention_hunter",
    name: "Mention Hunter",
    description: "Track 100 brand mentions",
    icon: "🎯",
    category: "monitoring",
    tier: "silver",
    xpReward: 100,
    requirement: { type: "count", action: "mention_tracked", target: 100 },
  },
  {
    id: "mention_master",
    name: "Mention Master",
    description: "Track 1,000 brand mentions",
    icon: "👁️‍🗨️",
    category: "monitoring",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "count", action: "mention_tracked", target: 1000 },
  },
  {
    id: "vigilant_watcher",
    name: "Vigilant Watcher",
    description: "Track 10,000 brand mentions",
    icon: "🦅",
    category: "monitoring",
    tier: "platinum",
    xpReward: 2000,
    requirement: { type: "count", action: "mention_tracked", target: 10000 },
  },

  // Auditing Achievements
  {
    id: "first_audit",
    name: "First Audit",
    description: "Complete your first site audit",
    icon: "🔎",
    category: "auditing",
    tier: "bronze",
    xpReward: 50,
    requirement: { type: "count", action: "audit_completed", target: 1 },
  },
  {
    id: "audit_pro",
    name: "Audit Pro",
    description: "Complete 10 site audits",
    icon: "📋",
    category: "auditing",
    tier: "silver",
    xpReward: 200,
    requirement: { type: "count", action: "audit_completed", target: 10 },
  },
  {
    id: "audit_expert",
    name: "Audit Expert",
    description: "Complete 50 site audits",
    icon: "🔬",
    category: "auditing",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "count", action: "audit_completed", target: 50 },
  },

  // Content Achievements
  {
    id: "content_creator",
    name: "Content Creator",
    description: "Generate your first AI content",
    icon: "✍️",
    category: "content",
    tier: "bronze",
    xpReward: 30,
    requirement: { type: "count", action: "content_generated", target: 1 },
  },
  {
    id: "prolific_writer",
    name: "Prolific Writer",
    description: "Generate 50 pieces of AI content",
    icon: "📝",
    category: "content",
    tier: "silver",
    xpReward: 200,
    requirement: { type: "count", action: "content_generated", target: 50 },
  },
  {
    id: "content_machine",
    name: "Content Machine",
    description: "Generate 500 pieces of AI content",
    icon: "🤖",
    category: "content",
    tier: "gold",
    xpReward: 1000,
    requirement: { type: "count", action: "content_generated", target: 500 },
  },

  // Optimization Achievements
  {
    id: "recommendation_rookie",
    name: "Recommendation Rookie",
    description: "Complete your first recommendation",
    icon: "✅",
    category: "optimization",
    tier: "bronze",
    xpReward: 25,
    requirement: { type: "count", action: "recommendation_completed", target: 1 },
  },
  {
    id: "optimizer",
    name: "Optimizer",
    description: "Complete 25 recommendations",
    icon: "⚡",
    category: "optimization",
    tier: "silver",
    xpReward: 150,
    requirement: { type: "count", action: "recommendation_completed", target: 25 },
  },
  {
    id: "perfection_seeker",
    name: "Perfection Seeker",
    description: "Complete 100 recommendations",
    icon: "💯",
    category: "optimization",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "count", action: "recommendation_completed", target: 100 },
  },
  {
    id: "geo_improver",
    name: "GEO Improver",
    description: "Improve your GEO score for the first time",
    icon: "📈",
    category: "optimization",
    tier: "bronze",
    xpReward: 75,
    requirement: { type: "count", action: "geo_score_improved", target: 1 },
  },
  {
    id: "geo_champion",
    name: "GEO Champion",
    description: "Improve your GEO score 10 times",
    icon: "🏅",
    category: "optimization",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "count", action: "geo_score_improved", target: 10 },
  },

  // Streak Achievements
  {
    id: "first_week",
    name: "First Week",
    description: "Login for 7 consecutive days",
    icon: "📅",
    category: "streak",
    tier: "bronze",
    xpReward: 50,
    requirement: { type: "streak", target: 7, timeframe: "daily" },
  },
  {
    id: "consistent",
    name: "Consistent",
    description: "Login for 30 consecutive days",
    icon: "🔥",
    category: "streak",
    tier: "silver",
    xpReward: 200,
    requirement: { type: "streak", target: 30, timeframe: "daily" },
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Login for 100 consecutive days",
    icon: "💪",
    category: "streak",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "streak", target: 100, timeframe: "daily" },
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Login for 365 consecutive days",
    icon: "🌟",
    category: "streak",
    tier: "diamond",
    xpReward: 2000,
    requirement: { type: "streak", target: 365, timeframe: "daily" },
  },

  // Team Achievements
  {
    id: "team_builder",
    name: "Team Builder",
    description: "Invite your first team member",
    icon: "👥",
    category: "team",
    tier: "bronze",
    xpReward: 30,
    requirement: { type: "count", action: "team_member_invited", target: 1 },
  },
  {
    id: "team_leader",
    name: "Team Leader",
    description: "Invite 5 team members",
    icon: "👨‍👩‍👧‍👦",
    category: "team",
    tier: "silver",
    xpReward: 150,
    requirement: { type: "count", action: "team_member_invited", target: 5 },
  },

  // Special Achievements
  {
    id: "crisis_manager",
    name: "Crisis Manager",
    description: "Resolve a crisis alert",
    icon: "🚨",
    category: "special",
    tier: "silver",
    xpReward: 100,
    requirement: { type: "count", action: "crisis_resolved", target: 1 },
  },
  {
    id: "crisis_veteran",
    name: "Crisis Veteran",
    description: "Resolve 10 crisis alerts",
    icon: "🛡️",
    category: "special",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "count", action: "crisis_resolved", target: 10 },
  },
  {
    id: "integration_guru",
    name: "Integration Guru",
    description: "Connect 5 integrations",
    icon: "🔗",
    category: "special",
    tier: "silver",
    xpReward: 200,
    requirement: { type: "count", action: "integration_connected", target: 5 },
  },
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Join during beta period",
    icon: "🎖️",
    category: "special",
    tier: "gold",
    xpReward: 500,
    requirement: { type: "milestone", target: 1 },
    secret: true,
  },
];

// =============================================================================
// Gamification Engine
// =============================================================================

export class GamificationEngine {
  private actionConfig: Map<ActionType, ActionXPConfig>;
  private levelsMap: Level[];
  private achievementsMap: Map<string, Achievement>;

  constructor() {
    this.actionConfig = new Map(ACTION_XP_CONFIG.map((a) => [a.action, a]));
    this.levelsMap = LEVELS;
    this.achievementsMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
  }

  /**
   * Calculate XP for an action
   */
  calculateActionXP(
    action: ActionType,
    progress: UserProgress,
    metadata?: Record<string, unknown>
  ): XPCalculationResult {
    const config = this.actionConfig.get(action);
    if (!config) {
      return {
        baseXP: 0,
        bonusXP: 0,
        totalXP: 0,
        breakdown: [],
        leveledUp: false,
        newAchievements: [],
      };
    }

    const breakdown: XPBreakdownItem[] = [];
    const baseXP = config.baseXP;
    let bonusXP = 0;

    // Check daily limit
    if (config.maxDaily) {
      const todayActions = progress.actionHistory.filter(
        (a) =>
          a.action === action &&
          this.isToday(a.timestamp)
      );
      if (todayActions.length >= config.maxDaily) {
        return {
          baseXP: 0,
          bonusXP: 0,
          totalXP: 0,
          breakdown: [{ source: "Daily limit reached", amount: 0 }],
          leveledUp: false,
          newAchievements: [],
        };
      }
    }

    breakdown.push({ source: config.description, amount: baseXP });

    // Apply multiplier if configured
    if (config.multiplier && config.multiplier > 1) {
      const multiplierBonus = Math.floor(baseXP * (config.multiplier - 1));
      bonusXP += multiplierBonus;
      breakdown.push({
        source: "Action multiplier",
        amount: multiplierBonus,
        multiplier: config.multiplier,
      });
    }

    // Streak bonus
    const streakBonus = this.calculateStreakBonus(progress.streaks);
    if (streakBonus > 0) {
      bonusXP += streakBonus;
      breakdown.push({ source: "Streak bonus", amount: streakBonus });
    }

    // Level bonus (higher levels earn slightly more)
    const levelBonus = Math.floor(baseXP * (progress.level * 0.05));
    if (levelBonus > 0) {
      bonusXP += levelBonus;
      breakdown.push({ source: "Level bonus", amount: levelBonus });
    }

    const totalXP = baseXP + bonusXP;
    const newTotalXP = progress.totalXP + totalXP;

    // Check for level up
    const currentLevel = this.getLevelForXP(progress.totalXP);
    const newLevel = this.getLevelForXP(newTotalXP);
    const leveledUp = newLevel.level > currentLevel.level;

    // Check for new achievements
    const newAchievements = this.checkNewAchievements(action, progress, metadata);

    return {
      baseXP,
      bonusXP,
      totalXP,
      breakdown,
      newLevel: leveledUp ? newLevel : undefined,
      leveledUp,
      newAchievements,
    };
  }

  /**
   * Process an action and update user progress
   */
  processAction(
    action: ActionType,
    progress: UserProgress,
    metadata?: Record<string, unknown>
  ): { updatedProgress: UserProgress; result: XPCalculationResult } {
    const result = this.calculateActionXP(action, progress, metadata);

    if (result.totalXP === 0 && result.newAchievements.length === 0) {
      return { updatedProgress: progress, result };
    }

    // Update stats
    const updatedStats = this.updateStats(action, progress.stats);

    // Add action to history
    const actionRecord: ActionRecord = {
      action,
      xpAwarded: result.totalXP,
      timestamp: new Date(),
      metadata,
    };

    // Update progress
    const updatedProgress: UserProgress = {
      ...progress,
      currentXP: progress.currentXP + result.totalXP,
      totalXP: progress.totalXP + result.totalXP,
      level: result.newLevel?.level || progress.level,
      actionHistory: [...progress.actionHistory.slice(-999), actionRecord],
      stats: updatedStats,
      updatedAt: new Date(),
    };

    // Add achievement XP and records
    for (const achievement of result.newAchievements) {
      updatedProgress.achievements.push({
        achievementId: achievement.id,
        unlockedAt: new Date(),
        xpAwarded: achievement.xpReward,
      });
      updatedProgress.totalXP += achievement.xpReward;
      updatedProgress.currentXP += achievement.xpReward;
    }

    // Recalculate level after achievement XP
    const finalLevel = this.getLevelForXP(updatedProgress.totalXP);
    updatedProgress.level = finalLevel.level;

    return { updatedProgress, result };
  }

  /**
   * Update daily streak
   */
  updateDailyStreak(progress: UserProgress): UserProgress {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const updatedStreaks = { ...progress.streaks };

    if (progress.streaks.lastLoginDate === today) {
      // Already logged in today
      return progress;
    }

    if (progress.streaks.lastLoginDate === yesterday) {
      // Consecutive day
      updatedStreaks.currentDaily += 1;
      if (updatedStreaks.currentDaily > updatedStreaks.longestDaily) {
        updatedStreaks.longestDaily = updatedStreaks.currentDaily;
      }
    } else {
      // Streak broken
      updatedStreaks.currentDaily = 1;
    }

    updatedStreaks.lastLoginDate = today;

    return {
      ...progress,
      streaks: updatedStreaks,
      updatedAt: new Date(),
    };
  }

  /**
   * Get level for XP amount
   */
  getLevelForXP(xp: number): Level {
    for (let i = this.levelsMap.length - 1; i >= 0; i--) {
      if (xp >= this.levelsMap[i].minXP) {
        return this.levelsMap[i];
      }
    }
    return this.levelsMap[0];
  }

  /**
   * Get XP progress within current level
   */
  getLevelProgress(xp: number): { current: number; required: number; percentage: number } {
    const level = this.getLevelForXP(xp);
    const xpInLevel = xp - level.minXP;
    const xpForLevel = level.maxXP - level.minXP;
    const percentage = level.maxXP === Infinity ? 100 : Math.min(100, (xpInLevel / xpForLevel) * 100);

    return {
      current: xpInLevel,
      required: level.maxXP === Infinity ? xpInLevel : xpForLevel,
      percentage,
    };
  }

  /**
   * Get next level info
   */
  getNextLevel(currentXP: number): Level | null {
    const currentLevel = this.getLevelForXP(currentXP);
    const nextIndex = this.levelsMap.findIndex((l) => l.level === currentLevel.level) + 1;
    return nextIndex < this.levelsMap.length ? this.levelsMap[nextIndex] : null;
  }

  /**
   * Get all achievements with unlock status
   */
  getAchievementsWithStatus(
    progress: UserProgress
  ): Array<Achievement & { unlocked: boolean; unlockedAt?: Date; progress?: number }> {
    const unlockedIds = new Set(progress.achievements.map((a) => a.achievementId));

    return ACHIEVEMENTS.filter((a) => !a.secret || unlockedIds.has(a.id)).map((achievement) => {
      const unlockRecord = progress.achievements.find((a) => a.achievementId === achievement.id);
      const achievementProgress = this.calculateAchievementProgress(achievement, progress);

      return {
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        unlockedAt: unlockRecord?.unlockedAt,
        progress: achievementProgress,
      };
    });
  }

  /**
   * Get leaderboard position (mock implementation)
   */
  getLeaderboardPosition(userId: string, totalXP: number): { position: number; percentile: number } {
    // In production, this would query the database
    // For now, return mock data based on XP
    const estimatedPosition = Math.max(1, Math.floor(10000 / Math.max(1, totalXP)));
    const percentile = Math.min(99, Math.max(1, 100 - (estimatedPosition / 100)));

    return { position: estimatedPosition, percentile };
  }

  // Private helper methods

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  private calculateStreakBonus(streaks: StreakData): number {
    const dailyBonus = Math.min(50, Math.floor(streaks.currentDaily / 7) * 5);
    return dailyBonus;
  }

  private updateStats(action: ActionType, stats: UserStats): UserStats {
    const updated = { ...stats };

    switch (action) {
      case "audit_completed":
        updated.totalAudits += 1;
        break;
      case "mention_tracked":
        updated.totalMentions += 1;
        break;
      case "content_generated":
        updated.totalContent += 1;
        break;
      case "recommendation_completed":
        updated.recommendationsCompleted += 1;
        break;
      case "brand_created":
        updated.brandsCreated += 1;
        break;
      case "report_generated":
        updated.reportsGenerated += 1;
        break;
      case "integration_connected":
        updated.integrationsConnected += 1;
        break;
      case "team_member_invited":
        updated.teamMembersInvited += 1;
        break;
      case "crisis_resolved":
        updated.crisesResolved += 1;
        break;
      case "geo_score_improved":
        updated.geoScoreImprovements += 1;
        break;
    }

    return updated;
  }

  private checkNewAchievements(
    action: ActionType,
    progress: UserProgress,
    metadata?: Record<string, unknown>
  ): Achievement[] {
    const unlockedIds = new Set(progress.achievements.map((a) => a.achievementId));
    const newAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      const isUnlocked = this.checkAchievementRequirement(achievement, action, progress, metadata);
      if (isUnlocked) {
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  private checkAchievementRequirement(
    achievement: Achievement,
    action: ActionType,
    progress: UserProgress,
    metadata?: Record<string, unknown>
  ): boolean {
    const req = achievement.requirement;

    switch (req.type) {
      case "count": {
        if (req.action !== action) return false;
        const count = this.getActionCount(req.action, progress, req.timeframe);
        return count + 1 >= req.target;
      }
      case "streak": {
        if (req.timeframe === "daily") {
          return progress.streaks.currentDaily >= req.target;
        }
        return false;
      }
      case "milestone": {
        // Special achievements checked separately
        return false;
      }
      default:
        return false;
    }
  }

  private getActionCount(
    action: ActionType,
    progress: UserProgress,
    timeframe?: "daily" | "weekly" | "monthly" | "all_time"
  ): number {
    let actions = progress.actionHistory.filter((a) => a.action === action);

    if (timeframe === "daily") {
      actions = actions.filter((a) => this.isToday(a.timestamp));
    } else if (timeframe === "weekly") {
      const weekAgo = Date.now() - 7 * 86400000;
      actions = actions.filter((a) => a.timestamp.getTime() > weekAgo);
    } else if (timeframe === "monthly") {
      const monthAgo = Date.now() - 30 * 86400000;
      actions = actions.filter((a) => a.timestamp.getTime() > monthAgo);
    }

    return actions.length;
  }

  private calculateAchievementProgress(achievement: Achievement, progress: UserProgress): number {
    const req = achievement.requirement;

    switch (req.type) {
      case "count": {
        if (!req.action) return 0;
        const count = this.getActionCount(req.action, progress, req.timeframe);
        return Math.min(100, (count / req.target) * 100);
      }
      case "streak": {
        if (req.timeframe === "daily") {
          return Math.min(100, (progress.streaks.currentDaily / req.target) * 100);
        }
        return 0;
      }
      default:
        return 0;
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create initial user progress
 */
export function createInitialProgress(userId: string, organizationId: string): UserProgress {
  return {
    userId,
    organizationId,
    currentXP: 0,
    totalXP: 0,
    level: 1,
    achievements: [],
    actionHistory: [],
    streaks: {
      currentDaily: 0,
      longestDaily: 0,
      currentWeekly: 0,
      longestWeekly: 0,
      lastLoginDate: "",
      lastWeekStartDate: "",
    },
    stats: {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get tier color
 */
export function getTierColor(tier: Achievement["tier"]): string {
  switch (tier) {
    case "bronze":
      return "#CD7F32";
    case "silver":
      return "#C0C0C0";
    case "gold":
      return "#FFD700";
    case "platinum":
      return "#E5E4E2";
    case "diamond":
      return "#B9F2FF";
    default:
      return "#888888";
  }
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: AchievementCategory): string {
  switch (category) {
    case "monitoring":
      return "👁️";
    case "auditing":
      return "🔍";
    case "content":
      return "✍️";
    case "engagement":
      return "💬";
    case "optimization":
      return "⚡";
    case "team":
      return "👥";
    case "streak":
      return "🔥";
    case "special":
      return "⭐";
    default:
      return "🏆";
  }
}

// Export singleton instance
export const gamificationEngine = new GamificationEngine();
