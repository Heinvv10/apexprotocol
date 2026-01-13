/**
 * GEO Knowledge Base Schema
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * This schema supports the Dynamic Adaptability System with:
 * - geo_best_practices: Platform-specific best practices (auto-updated)
 * - schema_templates: Version-controlled JSON-LD templates
 * - platform_changes: Detected AI platform behavior changes
 * - geo_alerts: User alerts for algorithm changes and updates
 * - action_plan_versions: Version-controlled action plan exports
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  boolean,
  date,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";
import { brands } from "./brands";
import { users } from "./users";

// ============================================================================
// Enums
// ============================================================================

/**
 * AI Platform enum - matches existing aiPlatformEnum but with additional platforms
 */
export const geoPlatformEnum = pgEnum("geo_platform", [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "copilot",
  "all", // Applies to all platforms
]);

/**
 * Best practice category enum
 */
export const bestPracticeCategoryEnum = pgEnum("best_practice_category", [
  "schema", // Schema markup (FAQ, Organization, Article, etc.)
  "content", // Content optimization (structure, length)
  "social", // Social media presence (LinkedIn, Twitter, YouTube)
  "technical", // Technical SEO (meta tags, speed, crawlability)
  "authority", // Authority building (citations, mentions, backlinks)
  "freshness", // Content freshness and update frequency
]);

/**
 * Platform change type enum
 */
export const platformChangeTypeEnum = pgEnum("platform_change_type", [
  "citation_pattern", // How the platform cites sources
  "content_preference", // Content length, format, freshness preferences
  "feature_update", // New platform features or API changes
  "algorithm_update", // Algorithm or model updates
  "ranking_change", // Changes to ranking/visibility factors
]);

/**
 * GEO Alert type enum
 */
export const geoAlertTypeEnum = pgEnum("geo_alert_type", [
  "algorithm_change", // Platform changed behavior
  "recommendation_updated", // Action plan changed
  "strategy_deprecated", // Something you did is now less effective
  "new_opportunity", // New platform feature to leverage
  "competitor_move", // Competitor gained visibility
  "score_impact", // Your score changed significantly
]);

/**
 * Alert severity enum
 */
export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

/**
 * Schema type enum for schema_templates
 */
export const schemaTypeEnum = pgEnum("schema_type", [
  "FAQPage",
  "Organization",
  "Article",
  "HowTo",
  "Product",
  "LocalBusiness",
  "Person",
  "WebSite",
  "BreadcrumbList",
  "SiteNavigationElement",
  "VideoObject",
  "Course",
  "Event",
  "Review",
  "AggregateRating",
]);

// ============================================================================
// Types for JSONB fields
// ============================================================================

/**
 * Implementation step structure
 */
export interface ImplementationStep {
  stepNumber: number;
  instruction: string;
  codeSnippet?: string;
  platformNotes?: Record<string, string>; // Platform-specific variations
  verificationMethod?: string;
  estimatedTime?: string;
}

/**
 * Platform relevance scores
 */
export interface PlatformRelevance {
  chatgpt?: number; // 0-100
  claude?: number;
  gemini?: number;
  perplexity?: number;
  grok?: number;
  deepseek?: number;
  copilot?: number;
}

/**
 * Schema template variables (placeholders)
 */
export interface SchemaVariables {
  name: string;
  description: string;
  placeholder: string;
  required: boolean;
  example?: string;
}

/**
 * Action plan action snapshot
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
 * Changes from previous version
 */
export interface VersionChanges {
  addedActions: string[];
  removedActions: string[];
  modifiedActions: Array<{
    actionId: string;
    changes: string[];
  }>;
  summary: string;
}

// ============================================================================
// Tables
// ============================================================================

/**
 * GEO Best Practices Table
 *
 * Stores platform-specific best practices that are auto-updated
 * based on detected platform behavior changes.
 */
export const geoBestPractices = pgTable(
  "geo_best_practices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    // Platform and category
    platform: geoPlatformEnum("platform").notNull(),
    category: bestPracticeCategoryEnum("category").notNull(),

    // Practice details
    practiceTitle: text("practice_title").notNull(),
    practiceDescription: text("practice_description").notNull(),
    implementationSteps: jsonb("implementation_steps")
      .$type<ImplementationStep[]>()
      .notNull()
      .default([]),

    // Scoring
    impactScore: integer("impact_score").notNull().default(5), // 1-10
    effortScore: integer("effort_score").notNull().default(5), // 1-10

    // Lifecycle
    effectiveSince: date("effective_since").notNull().defaultNow(),
    deprecatedAt: date("deprecated_at"),
    deprecationReason: text("deprecation_reason"),

    // Versioning
    version: integer("version").notNull().default(1),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_geo_best_practices_platform").on(table.platform),
    index("idx_geo_best_practices_category").on(table.category),
    index("idx_geo_best_practices_active").on(table.deprecatedAt),
  ]
);

/**
 * Schema Templates Table
 *
 * Stores version-controlled JSON-LD schema templates
 * with platform relevance scores.
 */
export const schemaTemplates = pgTable(
  "schema_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    // Schema type
    schemaType: schemaTypeEnum("schema_type").notNull(),

    // Platform relevance scores
    platformRelevance: jsonb("platform_relevance")
      .$type<PlatformRelevance>()
      .notNull()
      .default({}),

    // Template content
    templateCode: text("template_code").notNull(),
    usageInstructions: text("usage_instructions").notNull(),
    variables: jsonb("variables").$type<SchemaVariables[]>(),
    validatorUrl: text("validator_url"),

    // Versioning
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    supersededBy: text("superseded_by"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_schema_templates_type").on(table.schemaType),
    index("idx_schema_templates_current").on(table.isCurrent),
  ]
);

/**
 * Platform Changes Table
 *
 * Tracks detected changes in AI platform behavior.
 * Used to trigger alerts and update best practices.
 */
export const platformChanges = pgTable(
  "platform_changes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    // Platform and change type
    platform: geoPlatformEnum("platform").notNull(),
    changeType: platformChangeTypeEnum("change_type").notNull(),

    // Change details
    changeDetected: date("change_detected").notNull().defaultNow(),
    description: text("description").notNull(),
    impactAssessment: text("impact_assessment").notNull(),
    recommendedResponse: text("recommended_response").notNull(),

    // Confidence
    confidenceScore: integer("confidence_score").notNull(), // 0-100

    // Source of detection
    source: text("source").notNull(), // How we detected it

    // Affected practices
    affectedPractices: jsonb("affected_practices").$type<string[]>(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_platform_changes_platform").on(table.platform),
    index("idx_platform_changes_date").on(table.changeDetected),
  ]
);

/**
 * GEO Alerts Table
 *
 * User-facing alerts for algorithm changes, recommendation updates,
 * and other GEO-related notifications.
 */
export const geoAlerts = pgTable(
  "geo_alerts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    // Organization and brand (brand can be null for org-wide alerts)
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    brandId: text("brand_id").references(() => brands.id, {
      onDelete: "cascade",
    }),

    // Alert details
    alertType: geoAlertTypeEnum("alert_type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),

    // Affected platforms
    affectedPlatforms: jsonb("affected_platforms").$type<string[]>().notNull(),

    // Action guidance
    actionRequired: boolean("action_required").notNull().default(false),
    suggestedActions: jsonb("suggested_actions").$type<string[]>(),

    // Link to platform change (if applicable)
    platformChangeId: text("platform_change_id").references(
      () => platformChanges.id,
      { onDelete: "set null" }
    ),

    // User interaction
    readAt: timestamp("read_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_geo_alerts_org").on(table.organizationId),
    index("idx_geo_alerts_brand").on(table.brandId),
    index("idx_geo_alerts_unread").on(table.readAt),
  ]
);

/**
 * Action Plan Versions Table
 *
 * Tracks versioned snapshots of action plans for each brand.
 * Enables "what changed" comparisons between versions.
 */
export const actionPlanVersions = pgTable(
  "action_plan_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    // Brand
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    // Version info
    versionNumber: integer("version_number").notNull(),
    knowledgeBaseVersion: text("knowledge_base_version").notNull(), // e.g., "2026.01.3"

    // Snapshot
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actionsSnapshot: jsonb("actions_snapshot")
      .$type<ActionSnapshot[]>()
      .notNull(),
    changesFromPrevious: jsonb("changes_from_previous").$type<VersionChanges>(),

    // Download tracking
    downloadedAt: timestamp("downloaded_at", { withTimezone: true }),
    downloadedBy: text("downloaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("idx_action_plan_versions_brand").on(table.brandId),
    unique("unique_brand_version").on(table.brandId, table.versionNumber),
  ]
);

// ============================================================================
// Relations
// ============================================================================

export const geoBestPracticesRelations = relations(geoBestPractices, ({}) => ({
  // No direct relations, but referenced by platformChanges.affectedPractices
}));

export const schemaTemplatesRelations = relations(
  schemaTemplates,
  ({ one }) => ({
    supersededByTemplate: one(schemaTemplates, {
      fields: [schemaTemplates.supersededBy],
      references: [schemaTemplates.id],
    }),
  })
);

export const platformChangesRelations = relations(
  platformChanges,
  ({ many }) => ({
    alerts: many(geoAlerts),
  })
);

export const geoAlertsRelations = relations(geoAlerts, ({ one }) => ({
  organization: one(organizations, {
    fields: [geoAlerts.organizationId],
    references: [organizations.id],
  }),
  brand: one(brands, {
    fields: [geoAlerts.brandId],
    references: [brands.id],
  }),
  platformChange: one(platformChanges, {
    fields: [geoAlerts.platformChangeId],
    references: [platformChanges.id],
  }),
}));

export const actionPlanVersionsRelations = relations(
  actionPlanVersions,
  ({ one }) => ({
    brand: one(brands, {
      fields: [actionPlanVersions.brandId],
      references: [brands.id],
    }),
    downloadedByUser: one(users, {
      fields: [actionPlanVersions.downloadedBy],
      references: [users.id],
    }),
  })
);

// ============================================================================
// Type Exports
// ============================================================================

export type GeoBestPractice = typeof geoBestPractices.$inferSelect;
export type NewGeoBestPractice = typeof geoBestPractices.$inferInsert;

export type SchemaTemplate = typeof schemaTemplates.$inferSelect;
export type NewSchemaTemplate = typeof schemaTemplates.$inferInsert;

export type PlatformChange = typeof platformChanges.$inferSelect;
export type NewPlatformChange = typeof platformChanges.$inferInsert;

export type GeoAlert = typeof geoAlerts.$inferSelect;
export type NewGeoAlert = typeof geoAlerts.$inferInsert;

export type ActionPlanVersion = typeof actionPlanVersions.$inferSelect;
export type NewActionPlanVersion = typeof actionPlanVersions.$inferInsert;

// Enum type exports
export type GeoPlatform = (typeof geoPlatformEnum.enumValues)[number];
export type BestPracticeCategory = (typeof bestPracticeCategoryEnum.enumValues)[number];
export type PlatformChangeType = (typeof platformChangeTypeEnum.enumValues)[number];
export type GeoAlertType = (typeof geoAlertTypeEnum.enumValues)[number];
export type AlertSeverity = (typeof alertSeverityEnum.enumValues)[number];
export type SchemaType = (typeof schemaTypeEnum.enumValues)[number];
