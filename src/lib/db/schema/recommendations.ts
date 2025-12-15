import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { audits } from "./audits";
import { users } from "./users";

// Priority enum
export const priorityEnum = pgEnum("priority", [
  "critical",
  "high",
  "medium",
  "low",
]);

// Status enum
export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "pending",
  "in_progress",
  "completed",
  "dismissed",
]);

// Effort enum
export const effortEnum = pgEnum("effort", [
  "quick_win",
  "moderate",
  "major",
]);

// Impact enum
export const impactEnum = pgEnum("impact", ["high", "medium", "low"]);

// Category enum
export const recommendationCategoryEnum = pgEnum("recommendation_category", [
  "technical_seo",
  "content_optimization",
  "schema_markup",
  "citation_building",
  "brand_consistency",
  "competitor_analysis",
  "content_freshness",
  "authority_building",
]);

// Source enum
export const sourceEnum = pgEnum("source", [
  "audit",
  "monitoring",
  "content",
  "manual",
]);

// Recommendations table
export const recommendations = pgTable("recommendations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  auditId: text("audit_id").references(() => audits.id, { onDelete: "set null" }),
  assignedToId: text("assigned_to_id").references(() => users.id, {
    onDelete: "set null",
  }),

  // Recommendation details
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: recommendationCategoryEnum("category").notNull(),

  // Prioritization
  priority: priorityEnum("priority").default("medium").notNull(),
  status: recommendationStatusEnum("status").default("pending").notNull(),
  effort: effortEnum("effort").default("moderate").notNull(),
  impact: impactEnum("impact").default("medium").notNull(),
  estimatedTime: text("estimated_time"),

  // Source
  source: sourceEnum("source").default("manual").notNull(),
  relatedMentionId: text("related_mention_id"),

  // Implementation steps
  steps: jsonb("steps").$type<string[]>().default([]),

  // Notes and comments
  notes: text("notes"),

  // Timestamps
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  brand: one(brands, {
    fields: [recommendations.brandId],
    references: [brands.id],
  }),
  audit: one(audits, {
    fields: [recommendations.auditId],
    references: [audits.id],
  }),
  assignedTo: one(users, {
    fields: [recommendations.assignedToId],
    references: [users.id],
  }),
}));

// Type exports
export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;
