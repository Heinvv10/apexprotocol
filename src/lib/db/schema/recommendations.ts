import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { audits } from "./audits";
import { users } from "./users";
import type { ImplementationStep, PlatformRelevance } from "./geo-knowledge-base";

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

  // Implementation steps (rich step-by-step instructions)
  steps: jsonb("steps").$type<ImplementationStep[]>().default([]),

  // Platform relevance scores (which AI platforms this affects most)
  platformRelevance: jsonb("platform_relevance").$type<PlatformRelevance>(),

  // Schema code (if applicable - copy-paste ready JSON-LD)
  schemaCode: text("schema_code"),

  // Expected score impact
  expectedScoreImpact: integer("expected_score_impact"),

  // Notes and comments
  notes: text("notes"),

  // Timestamps
  dueDate: timestamp("due_date", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  // GEO Score Tracking
  baselineScore: integer("baseline_score"),
  postImplementationScore: integer("post_implementation_score"),
  scoreImprovement: integer("score_improvement"),
  effectivenessScore: integer("effectiveness_score"),

  // User Feedback
  userRating: integer("user_rating"),
  userFeedback: text("user_feedback"),
  feedbackAt: timestamp("feedback_at", { withTimezone: true }),

  // Platform targeting
  platformTags: jsonb("platform_tags").$type<string[]>().default([]),

  // Estimated impact range
  estimatedImpactLow: integer("estimated_impact_low"),
  estimatedImpactHigh: integer("estimated_impact_high"),
  impactSource: text("impact_source"),
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

// Re-export ImplementationStep and PlatformRelevance for consumers
export type { ImplementationStep, PlatformRelevance };
