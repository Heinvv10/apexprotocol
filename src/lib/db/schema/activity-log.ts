/**
 * Activity Log Schema
 * Tracks user activities and events for dashboard analytics
 */

import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { brands } from "./brands";
import { users } from "./users";

export type ActivityType =
  | "mention_detected"
  | "content_created"
  | "audit_completed"
  | "recommendation_completed"
  | "geo_score_changed"
  | "competitor_added"
  | "alert_triggered"
  | "report_generated";

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.clerkUserId),
  activityType: text("activity_type").notNull().$type<ActivityType>(),
  description: text("description").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  brand: one(brands, {
    fields: [activityLog.brandId],
    references: [brands.id],
  }),
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.clerkUserId],
  }),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
