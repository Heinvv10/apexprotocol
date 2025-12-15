/**
 * Jobs Schema - Background jobs and scheduled tasks
 */

import {
  pgTable,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { brands } from "./brands";

// Job status enum
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

// Schedule type enum
export const scheduleTypeEnum = pgEnum("schedule_type", [
  "once",
  "hourly",
  "daily",
  "weekly",
  "monthly",
]);

// Monitoring Jobs Table - Tracks individual monitoring job runs
export const monitoringJobs = pgTable("monitoring_jobs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  brandId: varchar("brand_id", { length: 128 }).notNull(),
  orgId: varchar("org_id", { length: 128 }).notNull(),
  status: jobStatusEnum("status").default("pending").notNull(),
  platforms: jsonb("platforms").$type<string[]>().default([]),
  queries: jsonb("queries").$type<string[]>().default([]),
  mentionsFound: integer("mentions_found").default(0),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scheduled Jobs Table - Recurring job schedules
export const scheduledJobs = pgTable("scheduled_jobs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  scheduleType: scheduleTypeEnum("schedule_type").notNull(),
  jobType: varchar("job_type", { length: 50 }).notNull(), // monitor:scan, report:weekly, etc.
  brandId: varchar("brand_id", { length: 128 }).notNull(),
  orgId: varchar("org_id", { length: 128 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const monitoringJobsRelations = relations(monitoringJobs, ({ one }) => ({
  brand: one(brands, {
    fields: [monitoringJobs.brandId],
    references: [brands.id],
  }),
  organization: one(organizations, {
    fields: [monitoringJobs.orgId],
    references: [organizations.id],
  }),
}));

export const scheduledJobsRelations = relations(scheduledJobs, ({ one }) => ({
  brand: one(brands, {
    fields: [scheduledJobs.brandId],
    references: [brands.id],
  }),
  organization: one(organizations, {
    fields: [scheduledJobs.orgId],
    references: [organizations.id],
  }),
}));

// Types
export type MonitoringJob = typeof monitoringJobs.$inferSelect;
export type NewMonitoringJob = typeof monitoringJobs.$inferInsert;
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;
