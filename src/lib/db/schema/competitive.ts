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
  uniqueIndex,
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
}, (table) => ({
  // Unique constraint for brand+date+platform combo for upsert operations
  brandDatePlatformIdx: uniqueIndex("sov_brand_date_platform_idx").on(
    table.brandId,
    table.date,
    table.platform
  ),
}));

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
  discoveryReason?: string;
  discoveredDuringBrandCreation?: boolean;
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

// ============================================
// Enhanced Competitive Intelligence Tables
// ============================================

// Data source enum - how was this score calculated?
export const scoreDataSourceEnum = pgEnum("score_data_source", [
  "scraped",
  "estimated",
  "manual",
]);

// Roadmap status enum
export const roadmapStatusEnum = pgEnum("roadmap_status", [
  "draft",
  "active",
  "paused",
  "completed",
]);

// Roadmap target position enum
export const roadmapTargetPositionEnum = pgEnum("roadmap_target_position", [
  "leader",
  "top3",
  "competitive",
]);

// Score category enum for milestones
export const scoreCategoryEnum = pgEnum("score_category", [
  "geo",
  "seo",
  "aeo",
  "smo",
  "ppo",
]);

// Milestone status enum
export const milestoneStatusEnum = pgEnum("milestone_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

// Milestone difficulty enum
export const milestoneDifficultyEnum = pgEnum("milestone_difficulty", [
  "easy",
  "medium",
  "hard",
]);

// ============================================
// Competitor Scores Table
// ============================================

// Score breakdown types
export interface ScoreBreakdown {
  total: number;
  factors: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
  lastUpdated: string;
}

// Store calculated 5-score breakdown for competitors
export const competitorScores = pgTable("competitor_scores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Competitor identification
  competitorName: text("competitor_name").notNull(),
  competitorDomain: text("competitor_domain"),

  // The 5 core scores (0-100 scale)
  geoScore: integer("geo_score").notNull().default(0),
  seoScore: integer("seo_score").notNull().default(0),
  aeoScore: integer("aeo_score").notNull().default(0),
  smoScore: integer("smo_score").notNull().default(0),
  ppoScore: integer("ppo_score").notNull().default(0),

  // Unified/aggregate score and grade
  unifiedScore: integer("unified_score").notNull().default(0),
  grade: text("grade").notNull().default("D"), // A+, A, B+, B, C+, C, D, F

  // Score breakdowns (detailed factor analysis)
  geoBreakdown: jsonb("geo_breakdown").$type<ScoreBreakdown>(),
  seoBreakdown: jsonb("seo_breakdown").$type<ScoreBreakdown>(),
  aeoBreakdown: jsonb("aeo_breakdown").$type<ScoreBreakdown>(),
  smoBreakdown: jsonb("smo_breakdown").$type<ScoreBreakdown>(),
  ppoBreakdown: jsonb("ppo_breakdown").$type<ScoreBreakdown>(),

  // Confidence and source
  confidence: integer("confidence").notNull().default(50), // 0-100
  dataSource: scoreDataSourceEnum("data_source").notNull().default("estimated"),

  // Timestamps
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint for brand+competitor combo
  brandCompetitorIdx: uniqueIndex("cs_brand_competitor_idx").on(
    table.brandId,
    table.competitorName
  ),
}));

// ============================================
// Improvement Roadmaps Table
// ============================================

// Store generated improvement roadmaps
export const improvementRoadmaps = pgTable("improvement_roadmaps", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Roadmap details
  title: text("title").notNull(),
  description: text("description"),

  // Target configuration
  targetCompetitor: text("target_competitor"), // Optional specific competitor to beat
  targetPosition: roadmapTargetPositionEnum("target_position").notNull().default("competitive"),

  // Score tracking
  currentUnifiedScore: integer("current_unified_score").notNull().default(0),
  targetUnifiedScore: integer("target_unified_score").notNull().default(0),
  currentGrade: text("current_grade").notNull().default("D"),
  targetGrade: text("target_grade").notNull().default("B"),

  // Timeline
  estimatedWeeks: integer("estimated_weeks").notNull().default(12),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),

  // Status and progress
  status: roadmapStatusEnum("status").notNull().default("draft"),
  progressPercentage: integer("progress_percentage").notNull().default(0), // 0-100

  // AI generation metadata
  generatedByAi: boolean("generated_by_ai").notNull().default(false),
  aiModel: text("ai_model"),
  generationPrompt: text("generation_prompt"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// Roadmap Milestones Table
// ============================================

// Action item within a milestone
export interface MilestoneActionItem {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
}

// Individual milestones within roadmap
export const roadmapMilestones = pgTable("roadmap_milestones", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  roadmapId: text("roadmap_id")
    .notNull()
    .references(() => improvementRoadmaps.id, { onDelete: "cascade" }),

  // Milestone details
  title: text("title").notNull(),
  description: text("description"),
  category: scoreCategoryEnum("category").notNull(),

  // Phase and ordering (1 = Quick Wins, 2 = Month 1, 3 = Ongoing)
  phase: integer("phase").notNull().default(1),
  orderInPhase: integer("order_in_phase").notNull().default(0),

  // Impact estimates
  expectedScoreImpact: integer("expected_score_impact").notNull().default(0), // Points to gain
  expectedDaysToComplete: integer("expected_days_to_complete").notNull().default(7),
  difficulty: milestoneDifficultyEnum("difficulty").notNull().default("medium"),

  // Action items (checklist)
  actionItems: jsonb("action_items").$type<MilestoneActionItem[]>().default([]),

  // Status and completion
  status: milestoneStatusEnum("status").notNull().default("pending"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  actualScoreImpact: integer("actual_score_impact"), // Actual points gained after completion

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// Roadmap Progress Snapshots Table
// ============================================

// Track progress over time
export const roadmapProgressSnapshots = pgTable("roadmap_progress_snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  roadmapId: text("roadmap_id")
    .notNull()
    .references(() => improvementRoadmaps.id, { onDelete: "cascade" }),

  // Snapshot date
  snapshotDate: date("snapshot_date").notNull(),

  // All 5 scores at snapshot point
  geoScore: integer("geo_score").notNull().default(0),
  seoScore: integer("seo_score").notNull().default(0),
  aeoScore: integer("aeo_score").notNull().default(0),
  smoScore: integer("smo_score").notNull().default(0),
  ppoScore: integer("ppo_score").notNull().default(0),
  unifiedScore: integer("unified_score").notNull().default(0),
  grade: text("grade").notNull().default("D"),

  // Progress metrics
  milestonesCompleted: integer("milestones_completed").notNull().default(0),
  milestonesTotal: integer("milestones_total").notNull().default(0),
  rankAmongCompetitors: integer("rank_among_competitors"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint for roadmap+date combo
  roadmapDateIdx: uniqueIndex("rps_roadmap_date_idx").on(
    table.roadmapId,
    table.snapshotDate
  ),
}));

// ============================================
// Relations for New Tables
// ============================================

export const competitorScoresRelations = relations(competitorScores, ({ one }) => ({
  brand: one(brands, {
    fields: [competitorScores.brandId],
    references: [brands.id],
  }),
}));

export const improvementRoadmapsRelations = relations(improvementRoadmaps, ({ one, many }) => ({
  brand: one(brands, {
    fields: [improvementRoadmaps.brandId],
    references: [brands.id],
  }),
  milestones: many(roadmapMilestones),
  progressSnapshots: many(roadmapProgressSnapshots),
}));

export const roadmapMilestonesRelations = relations(roadmapMilestones, ({ one }) => ({
  roadmap: one(improvementRoadmaps, {
    fields: [roadmapMilestones.roadmapId],
    references: [improvementRoadmaps.id],
  }),
}));

export const roadmapProgressSnapshotsRelations = relations(roadmapProgressSnapshots, ({ one }) => ({
  roadmap: one(improvementRoadmaps, {
    fields: [roadmapProgressSnapshots.roadmapId],
    references: [improvementRoadmaps.id],
  }),
}));

// ============================================
// Type Exports for New Tables
// ============================================

export type CompetitorScoreRecord = typeof competitorScores.$inferSelect;
export type NewCompetitorScoreRecord = typeof competitorScores.$inferInsert;

export type ImprovementRoadmap = typeof improvementRoadmaps.$inferSelect;
export type NewImprovementRoadmap = typeof improvementRoadmaps.$inferInsert;

export type RoadmapMilestone = typeof roadmapMilestones.$inferSelect;
export type NewRoadmapMilestone = typeof roadmapMilestones.$inferInsert;

export type RoadmapProgressSnapshot = typeof roadmapProgressSnapshots.$inferSelect;
export type NewRoadmapProgressSnapshot = typeof roadmapProgressSnapshots.$inferInsert;
