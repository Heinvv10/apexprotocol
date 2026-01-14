import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Enums
// ============================================================================

export const geoPlatformEnum = pgEnum("geo_platform", [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "all",
]);

export const bestPracticeCategoryEnum = pgEnum("best_practice_category", [
  "schema",
  "content",
  "social",
  "technical",
]);

export const platformChangeTypeEnum = pgEnum("platform_change_type", [
  "citation_pattern",
  "content_preference",
  "feature_update",
  "algorithm_change",
]);

export const geoAlertTypeEnum = pgEnum("geo_alert_type", [
  "algorithm_change",
  "strategy_deprecated",
  "new_opportunity",
  "competitor_move",
  "score_impact",
  "recommendation_updated",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

export const schemaTypeEnum = pgEnum("schema_type", [
  "FAQPage",
  "Organization",
  "Article",
  "HowTo",
  "Product",
  "LocalBusiness",
  "Person",
  "Event",
  "Review",
  "BreadcrumbList",
]);

// Enum type exports
export type GeoPlatform = (typeof geoPlatformEnum.enumValues)[number];
export type BestPracticeCategory = (typeof bestPracticeCategoryEnum.enumValues)[number];
export type PlatformChangeType = (typeof platformChangeTypeEnum.enumValues)[number];
export type GeoAlertType = (typeof geoAlertTypeEnum.enumValues)[number];
export type AlertSeverity = (typeof alertSeverityEnum.enumValues)[number];
export type SchemaType = (typeof schemaTypeEnum.enumValues)[number];

// ============================================================================
// Type Interfaces for JSONB Fields
// ============================================================================

/**
 * Implementation step with platform-specific notes
 */
export interface ImplementationStep {
  stepNumber: number;
  instruction: string;
  platformNotes?: Record<string, string>;
  codeSnippet?: string;
  verificationMethod?: string;
}

/**
 * Platform relevance scores
 */
export type PlatformRelevance = Record<string, number>;

/**
 * Snapshot of a single action for version tracking
 */
export interface ActionSnapshot {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  impact: string;
  effort: string;
  steps: ImplementationStep[];
  schemaCode?: string;
  platformRelevance: PlatformRelevance;
  expectedScoreImpact: number;
}

/**
 * Changes between two versions
 */
export interface VersionChanges {
  addedActions: string[];
  removedActions: string[];
  modifiedActions: {
    actionId: string;
    changes: string[];
  }[];
  summary: string;
}

/**
 * Schema template variables for dynamic code generation
 */
export interface SchemaVariables {
  [key: string]: string | number | boolean | SchemaVariables | SchemaVariables[];
}

// ============================================================================
// Database Tables
// ============================================================================

/**
 * GEO Best Practices
 * Stores platform-specific best practices that auto-update as platforms change
 */
export const geoBestPractices = pgTable("geo_best_practices", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: varchar("platform", { length: 50 }).notNull(), // 'chatgpt', 'claude', 'gemini', etc.
  category: varchar("category", { length: 100 }).notNull(), // 'schema', 'content', 'social', 'technical'
  title: varchar("practice_title", { length: 255 }).notNull(),
  description: text("practice_description").notNull(),
  implementationSteps: jsonb("implementation_steps").$type<string[]>().notNull(), // Array of step descriptions
  impactScore: integer("impact_score").notNull(), // 1-10 current impact
  effortScore: integer("effort_score").notNull(), // 1-10 effort required
  effectiveSince: timestamp("effective_since", { withTimezone: true }).notNull(),
  deprecatedAt: timestamp("deprecated_at", { withTimezone: true }), // NULL if still active
  deprecationReason: text("deprecation_reason"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Schema Templates
 * Stores JSON-LD and other schema templates with version control
 */
export const schemaTemplates = pgTable("schema_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  schemaType: varchar("schema_type", { length: 100 }).notNull(), // 'FAQPage', 'Organization', 'Article', etc.
  platformRelevance: jsonb("platform_relevance").$type<Record<string, number>>().notNull(), // { "chatgpt": 9, "claude": 8 }
  templateCode: text("template_code").notNull(),
  usageInstructions: text("usage_instructions").notNull(),
  version: integer("version").notNull(),
  isCurrent: boolean("is_current").default(true).notNull(),
  supersededById: uuid("superseded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Self-referential foreign key for schema template versioning
export const schemaTemplatesRelations = relations(schemaTemplates, ({ one }) => ({
  supersededBy: one(schemaTemplates, {
    fields: [schemaTemplates.supersededById],
    references: [schemaTemplates.id],
  }),
}));

/**
 * Platform Algorithm Changes
 * Tracks detected changes in AI platform behavior
 */
export const platformChanges = pgTable("platform_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: varchar("platform", { length: 50 }).notNull(), // 'chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'
  changeDetected: timestamp("change_detected", { withTimezone: true }).notNull(),
  changeType: varchar("change_type", { length: 100 }).notNull(), // 'citation_pattern', 'content_preference', 'feature_update', 'algorithm_change'
  description: text("description").notNull(),
  impactAssessment: text("impact_assessment").notNull(),
  recommendedResponse: text("recommended_response").notNull(),
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  source: varchar("source", { length: 255 }).notNull(), // How we detected it: 'user_reports', 'automated_test', 'research_paper', 'community_feedback'
  affectedRecommendations: jsonb("affected_recommendations").$type<string[]>().notNull(), // IDs of affected best practices
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * GEO Alerts
 * Alerts sent to users when platforms change or strategies become obsolete
 */
export const geoAlerts = pgTable("geo_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  brandId: uuid("brand_id"), // Optional: for brand-specific alerts
  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'algorithm_change', 'strategy_deprecated', 'new_opportunity', 'competitor_move', 'score_impact', 'recommendation_updated'
  severity: varchar("severity", { length: 20 }).notNull(), // 'info', 'warning', 'critical'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  affectedPlatforms: jsonb("affected_platforms").$type<string[]>().notNull(),
  actionRequired: boolean("action_required").default(false).notNull(),
  suggestedActions: jsonb("suggested_actions").$type<string[]>().notNull(),
  relatedChanges: jsonb("related_changes").$type<string[]>(), // IDs of related platformChanges
  platformChangeId: uuid("platform_change_id"), // Reference to triggering platform change
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
});

/**
 * Recommendation Version History
 * Tracks changes to recommendations over time for audit trail
 */
export const recommendationVersions = pgTable("recommendation_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  recommendationId: varchar("recommendation_id", { length: 255 }).notNull(), // References original recommendation
  version: integer("version").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  impactScore: integer("impact_score").notNull(),
  effortScore: integer("effort_score").notNull(),
  steps: jsonb("steps").$type<Record<string, unknown>[]>().notNull(),
  platformRelevance: jsonb("platform_relevance").$type<Record<string, number>>().notNull(),
  changesSummary: jsonb("changes_summary").$type<string[]>(), // What changed from previous version
  reason: text("reason"), // Why this version was created
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Action Plan Versions
 * Stores versioned snapshots of action plans for tracking changes over time
 */
export const actionPlanVersions = pgTable("action_plan_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  knowledgeBaseVersion: varchar("knowledge_base_version", { length: 50 }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  actionsSnapshot: jsonb("actions_snapshot").$type<ActionSnapshot[]>().notNull(),
  changesFromPrevious: jsonb("changes_from_previous").$type<VersionChanges | null>(),
  downloadedAt: timestamp("downloaded_at", { withTimezone: true }),
  downloadedBy: uuid("downloaded_by"),
});

/**
 * Knowledge Base Update Log
 * Tracks when the knowledge base is updated and what changed
 */
export const updateLog = pgTable("update_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  updateType: varchar("update_type", { length: 100 }).notNull(), // 'best_practices', 'schema_templates', 'platform_changes'
  description: text("description").notNull(),
  itemsAdded: integer("items_added").default(0).notNull(),
  itemsUpdated: integer("items_updated").default(0).notNull(),
  itemsDeprecated: integer("items_deprecated").default(0).notNull(),
  affectedPlatforms: jsonb("affected_platforms").$type<string[]>().notNull(),
  dataSource: varchar("data_source", { length: 255 }).notNull(), // 'automated_test', 'research_paper', 'user_feedback', 'community_report'
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Type Exports
 */
export type GeoBestPractice = typeof geoBestPractices.$inferSelect;
export type NewGeoBestPractice = typeof geoBestPractices.$inferInsert;

export type SchemaTemplate = typeof schemaTemplates.$inferSelect;
export type NewSchemaTemplate = typeof schemaTemplates.$inferInsert;

export type PlatformChange = typeof platformChanges.$inferSelect;
export type NewPlatformChange = typeof platformChanges.$inferInsert;

export type GeoAlert = typeof geoAlerts.$inferSelect;
export type NewGeoAlert = typeof geoAlerts.$inferInsert;

export type RecommendationVersion = typeof recommendationVersions.$inferSelect;
export type NewRecommendationVersion = typeof recommendationVersions.$inferInsert;

export type UpdateLog = typeof updateLog.$inferSelect;
export type NewUpdateLog = typeof updateLog.$inferInsert;

export type ActionPlanVersion = typeof actionPlanVersions.$inferSelect;
export type NewActionPlanVersion = typeof actionPlanVersions.$inferInsert;

// ============================================================================
// Relations
// ============================================================================

/**
 * GEO Best Practices relations
 */
export const geoBestPracticesRelations = relations(geoBestPractices, ({}) => ({}));

/**
 * Platform Changes relations
 */
export const platformChangesRelations = relations(platformChanges, ({}) => ({}));

/**
 * GEO Alerts relations
 */
export const geoAlertsRelations = relations(geoAlerts, ({}) => ({}));

/**
 * Action Plan Versions relations
 */
export const actionPlanVersionsRelations = relations(actionPlanVersions, ({}) => ({}));
