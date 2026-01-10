import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Enums for content publishing workflow
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "review",
  "scheduled",
  "published",
]);

export const scheduleStatusEnum = pgEnum("schedule_status", [
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

export const publishingPlatformEnum = pgEnum("publishing_platform", [
  "wordpress",
  "medium",
]);

export const publishingStatusEnum = pgEnum("publishing_status", [
  "success",
  "failed",
]);

// Content Items table
export const contentItems = pgTable("content_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id").notNull(),

  // Content data
  title: text("title").notNull(),
  body: text("body").notNull(),
  geoData: jsonb("geo_data").$type<GeoData>(),

  // Workflow status
  status: contentStatusEnum("status").default("draft").notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Content Schedules table
export const contentSchedules = pgTable("content_schedules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  contentId: text("content_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),

  // Schedule details
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  qstashScheduleId: text("qstash_schedule_id"),
  qstashMessageId: text("qstash_message_id"),
  platforms: jsonb("platforms").$type<string[]>().default([]).notNull(),

  // Status
  status: scheduleStatusEnum("status").default("pending").notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Publishing History table
export const publishingHistory = pgTable("publishing_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  contentId: text("content_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),

  // Publishing details
  platform: publishingPlatformEnum("platform").notNull(),
  externalId: text("external_id").notNull(),
  externalUrl: text("external_url").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),

  // Status and error tracking
  status: publishingStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<PublishingMetadata>().default({}),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Content Metrics table
export const contentMetrics = pgTable("content_metrics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  contentId: text("content_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),

  // Platform and metrics
  platform: publishingPlatformEnum("platform").notNull(),
  views: integer("views").default(0).notNull(),
  engagementScore: integer("engagement_score").default(0).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// JSONB type interfaces
export interface GeoData {
  location?: string;
  keywords?: string[];
  targetAudience?: string;
  [key: string]: unknown;
}

export interface PublishingMetadata {
  [key: string]: unknown;
}

// Relations
export const contentItemsRelations = relations(contentItems, ({ many }) => ({
  schedules: many(contentSchedules),
  publishingHistory: many(publishingHistory),
  metrics: many(contentMetrics),
}));

export const contentSchedulesRelations = relations(contentSchedules, ({ one }) => ({
  content: one(contentItems, {
    fields: [contentSchedules.contentId],
    references: [contentItems.id],
  }),
}));

export const publishingHistoryRelations = relations(publishingHistory, ({ one }) => ({
  content: one(contentItems, {
    fields: [publishingHistory.contentId],
    references: [contentItems.id],
  }),
}));

export const contentMetricsRelations = relations(contentMetrics, ({ one }) => ({
  content: one(contentItems, {
    fields: [contentMetrics.contentId],
    references: [contentItems.id],
  }),
}));

// Type exports
export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

export type ContentSchedule = typeof contentSchedules.$inferSelect;
export type NewContentSchedule = typeof contentSchedules.$inferInsert;

export type PublishingHistory = typeof publishingHistory.$inferSelect;
export type NewPublishingHistory = typeof publishingHistory.$inferInsert;

export type ContentMetrics = typeof contentMetrics.$inferSelect;
export type NewContentMetrics = typeof contentMetrics.$inferInsert;
