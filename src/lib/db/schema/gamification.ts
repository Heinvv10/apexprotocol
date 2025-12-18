import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

/**
 * User Gamification Progress Table
 * Stores XP, level, streaks, and stats for each user
 */
export const userGamification = pgTable("user_gamification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.clerkUserId, { onDelete: "cascade" }),
  organizationId: text("organization_id"),

  // XP and Level
  currentXP: integer("current_xp").default(0).notNull(),
  totalXP: integer("total_xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),

  // Streak data (stored as JSONB for flexibility)
  streaks: jsonb("streaks").$type<StreakData>().default({
    currentDaily: 0,
    longestDaily: 0,
    currentWeekly: 0,
    longestWeekly: 0,
    lastLoginDate: "",
    lastWeekStartDate: "",
  }),

  // User stats (stored as JSONB)
  stats: jsonb("stats").$type<UserStats>().default({
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
  }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * User Achievements Table
 * Tracks which achievements each user has unlocked
 */
export const userAchievements = pgTable("user_achievements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkUserId, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull(),
  xpAwarded: integer("xp_awarded").default(0).notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const userGamificationRelations = relations(userGamification, ({ one }) => ({
  user: one(users, {
    fields: [userGamification.userId],
    references: [users.clerkUserId],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.clerkUserId],
  }),
}));

// Type definitions (matching lib/gamification types)
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

// Type exports
export type UserGamification = typeof userGamification.$inferSelect;
export type NewUserGamification = typeof userGamification.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
