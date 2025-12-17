import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  decimal,
  boolean,
  date,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";

// ============================================
// Phase 9.1: Competitor Discovery Enums
// ============================================

// Discovery method enum - how was this competitor discovered?
export const discoveryMethodEnum = pgEnum("discovery_method", [
  "keyword_overlap",
  "ai_co_occurrence",
  "industry_match",
  "search_overlap",
  "manual",
]);

// Discovery status enum - what's the user's decision?
export const discoveryStatusEnum = pgEnum("discovery_status", [
  "pending",
  "confirmed",
  "rejected",
]);

// SERP Feature type enum
export const serpFeatureTypeEnum = pgEnum("serp_feature_type", [
  "featured_snippet",
  "people_also_ask",
  "ai_overview",
  "knowledge_panel",
  "local_pack",
  "image_pack",
  "video_carousel",
  "top_stories",
]);

// Ownership enum
export const featureOwnerEnum = pgEnum("feature_owner", [
  "self",
  "competitor",
  "other",
]);

// SERP Features tracking table
export const serpFeatures = pgTable("serp_features", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Keyword being tracked
  keyword: text("keyword").notNull(),

  // Feature details
  featureType: serpFeatureTypeEnum("feature_type").notNull(),
  ownedBy: featureOwnerEnum("owned_by").notNull(),
  competitorName: text("competitor_name"), // If owned by competitor

  // Content details
  snippetContent: text("snippet_content"), // The actual snippet text
  snippetUrl: text("snippet_url"), // URL of the snippet source

  // Position and visibility
  position: integer("position"), // Position in SERP
  visibility: decimal("visibility", { precision: 5, scale: 2 }), // Estimated visibility score

  // Metadata
  searchEngine: text("search_engine").default("google").notNull(),
  metadata: jsonb("metadata").$type<SerpFeatureMetadata>().default({}),

  // Timestamps
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// SERP Feature metadata type
export interface SerpFeatureMetadata {
  searchVolume?: number;
  difficulty?: number;
  relatedQuestions?: string[];
  rawData?: Record<string, unknown>;
}

// Competitor mentions tracking (aggregated from brand mentions)
export const competitorMentions = pgTable("competitor_mentions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Competitor info
  competitorName: text("competitor_name").notNull(),
  competitorDomain: text("competitor_domain"),

  // AI Platform tracking
  platform: text("platform").notNull(), // chatgpt, claude, gemini, etc.
  query: text("query").notNull(),

  // Position and sentiment
  position: integer("position"), // Where competitor appeared in response
  sentiment: text("sentiment").default("neutral"), // positive, neutral, negative

  // Context
  context: text("context"), // Surrounding text context
  citationUrl: text("citation_url"),

  // Timestamps
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Share of Voice daily snapshots
export const shareOfVoice = pgTable("share_of_voice", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Date for the snapshot
  date: date("date").notNull(),

  // Platform-level SOV
  platform: text("platform").notNull(), // chatgpt, claude, gemini, etc. or 'all'

  // Share of Voice metrics
  brandMentions: integer("brand_mentions").default(0).notNull(),
  totalMentions: integer("total_mentions").default(0).notNull(),
  sovPercentage: decimal("sov_percentage", { precision: 5, scale: 2 }), // e.g., 35.50%

  // Position averages
  avgPosition: decimal("avg_position", { precision: 5, scale: 2 }),
  topPositions: integer("top_positions").default(0), // Count of top-3 positions

  // Sentiment breakdown
  positiveMentions: integer("positive_mentions").default(0),
  neutralMentions: integer("neutral_mentions").default(0),
  negativeMentions: integer("negative_mentions").default(0),

  // Competitor breakdown
  competitorBreakdown: jsonb("competitor_breakdown").$type<CompetitorSOV[]>().default([]),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Competitor SOV type
export interface CompetitorSOV {
  name: string;
  mentions: number;
  sovPercentage: number;
  avgPosition: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Competitive gaps tracking
export const competitiveGaps = pgTable("competitive_gaps", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Gap type
  gapType: text("gap_type").notNull(), // 'keyword', 'topic', 'schema', 'content'

  // Gap details
  keyword: text("keyword"),
  topic: text("topic"),
  description: text("description").notNull(),

  // Competitor data
  competitorName: text("competitor_name").notNull(),
  competitorPosition: integer("competitor_position"),
  competitorUrl: text("competitor_url"),

  // Impact assessment
  searchVolume: integer("search_volume"),
  difficulty: integer("difficulty"), // 1-100
  opportunity: integer("opportunity"), // 1-100 score

  // Status
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  // Timestamps
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Competitive alerts
export const competitiveAlerts = pgTable("competitive_alerts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Alert type
  alertType: text("alert_type").notNull(), // 'sov_drop', 'competitor_gain', 'new_competitor', 'position_loss'

  // Alert details
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").default("medium").notNull(), // low, medium, high, critical

  // Related data
  competitorName: text("competitor_name"),
  platform: text("platform"),
  keyword: text("keyword"),
  previousValue: decimal("previous_value", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),

  // Status
  isRead: boolean("is_read").default(false).notNull(),
  isDismissed: boolean("is_dismissed").default(false).notNull(),

  // Timestamps
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// Phase 9.1: Discovered Competitors Table
// ============================================

// Auto-discovered competitors waiting for user confirmation
export const discoveredCompetitors = pgTable("discovered_competitors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Competitor identification
  competitorName: text("competitor_name").notNull(),
  competitorDomain: text("competitor_domain"),

  // Discovery method and confidence
  discoveryMethod: discoveryMethodEnum("discovery_method").notNull(),
  confidenceScore: real("confidence_score").notNull(), // 0-1 scale

  // Discovery signals (contributing factors)
  keywordOverlap: real("keyword_overlap"), // % of keywords shared
  aiCoOccurrence: real("ai_co_occurrence"), // % of mentions together
  industryMatch: boolean("industry_match").default(false),

  // Evidence data
  sharedKeywords: jsonb("shared_keywords").$type<string[]>().default([]),
  coOccurrenceQueries: jsonb("co_occurrence_queries").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<DiscoveryMetadata>().default({}),

  // User decision
  status: discoveryStatusEnum("status").default("pending").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Discovery metadata type
export interface DiscoveryMetadata {
  industryCategory?: string;
  serviceArea?: string;
  keywordCount?: number;
  mentionCount?: number;
  firstSeenAt?: string;
  rawSignals?: Record<string, unknown>;
}

// ============================================
// Phase 9.1: Competitor Snapshots Table
// ============================================

// Point-in-time snapshots of competitor metrics for trend tracking
export const competitorSnapshots = pgTable("competitor_snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Competitor identification
  competitorName: text("competitor_name").notNull(),
  competitorDomain: text("competitor_domain").notNull(),

  // Snapshot date
  snapshotDate: date("snapshot_date").notNull(),

  // GEO/AEO metrics
  geoScore: integer("geo_score"), // 0-100
  aiMentionCount: integer("ai_mention_count"),
  avgMentionPosition: real("avg_mention_position"),
  sentimentScore: real("sentiment_score"), // -1 to 1

  // Social metrics
  socialFollowers: integer("social_followers"),
  socialEngagementRate: real("social_engagement_rate"),

  // Content metrics
  contentPageCount: integer("content_page_count"),
  blogPostCount: integer("blog_post_count"),
  lastContentPublished: timestamp("last_content_published", { withTimezone: true }),

  // Technical metrics
  schemaTypes: jsonb("schema_types").$type<string[]>().default([]),
  structuredDataScore: integer("structured_data_score"),

  // Platform breakdown
  platformBreakdown: jsonb("platform_breakdown").$type<PlatformMetrics[]>().default([]),

  // Metadata
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Platform metrics breakdown type
export interface PlatformMetrics {
  platform: string; // chatgpt, claude, gemini, etc.
  mentions: number;
  avgPosition: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Relations
export const serpFeaturesRelations = relations(serpFeatures, ({ one }) => ({
  brand: one(brands, {
    fields: [serpFeatures.brandId],
    references: [brands.id],
  }),
}));

export const competitorMentionsRelations = relations(competitorMentions, ({ one }) => ({
  brand: one(brands, {
    fields: [competitorMentions.brandId],
    references: [brands.id],
  }),
}));

export const shareOfVoiceRelations = relations(shareOfVoice, ({ one }) => ({
  brand: one(brands, {
    fields: [shareOfVoice.brandId],
    references: [brands.id],
  }),
}));

export const competitiveGapsRelations = relations(competitiveGaps, ({ one }) => ({
  brand: one(brands, {
    fields: [competitiveGaps.brandId],
    references: [brands.id],
  }),
}));

export const competitiveAlertsRelations = relations(competitiveAlerts, ({ one }) => ({
  brand: one(brands, {
    fields: [competitiveAlerts.brandId],
    references: [brands.id],
  }),
}));

export const discoveredCompetitorsRelations = relations(discoveredCompetitors, ({ one }) => ({
  brand: one(brands, {
    fields: [discoveredCompetitors.brandId],
    references: [brands.id],
  }),
}));

export const competitorSnapshotsRelations = relations(competitorSnapshots, ({ one }) => ({
  brand: one(brands, {
    fields: [competitorSnapshots.brandId],
    references: [brands.id],
  }),
}));

// Type exports
export type SerpFeature = typeof serpFeatures.$inferSelect;
export type NewSerpFeature = typeof serpFeatures.$inferInsert;

export type CompetitorMentionRecord = typeof competitorMentions.$inferSelect;
export type NewCompetitorMentionRecord = typeof competitorMentions.$inferInsert;

export type ShareOfVoiceRecord = typeof shareOfVoice.$inferSelect;
export type NewShareOfVoiceRecord = typeof shareOfVoice.$inferInsert;

export type CompetitiveGap = typeof competitiveGaps.$inferSelect;
export type NewCompetitiveGap = typeof competitiveGaps.$inferInsert;

export type CompetitiveAlert = typeof competitiveAlerts.$inferSelect;
export type NewCompetitiveAlert = typeof competitiveAlerts.$inferInsert;

// Phase 9.1: New type exports
export type DiscoveredCompetitor = typeof discoveredCompetitors.$inferSelect;
export type NewDiscoveredCompetitor = typeof discoveredCompetitors.$inferInsert;

export type CompetitorSnapshot = typeof competitorSnapshots.$inferSelect;
export type NewCompetitorSnapshot = typeof competitorSnapshots.$inferInsert;
