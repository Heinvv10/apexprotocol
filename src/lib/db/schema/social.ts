/**
 * Social Media Schema (Phase 7.1)
 *
 * Tables for social media monitoring, account connections, and SMO scoring.
 * Integrates with the existing brand system for unified digital presence tracking.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
  real,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";

// ============================================================================
// Enums
// ============================================================================

export const socialPlatformEnum = pgEnum("social_platform", [
  "linkedin",
  "twitter",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "github",
  "pinterest",
  "medium",
  "reddit",
  "discord",
  "threads",
  "mastodon",
  "bluesky",
]);

export const socialSentimentEnum = pgEnum("social_sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const socialAccountTypeEnum = pgEnum("social_account_type", [
  "company",
  "personal",
  "unknown",
]);

// ============================================================================
// Types
// ============================================================================

// Platform-specific metrics stored as JSONB
export interface PlatformMetrics {
  impressions?: number;
  reach?: number;
  clicks?: number;
  shares?: number;
  saves?: number;
  videoViews?: number;
  avgWatchTime?: number;
  profileViews?: number;
}

// Token metadata for OAuth
export interface TokenMetadata {
  scope?: string[];
  tokenType?: string;
  expiresIn?: number;
}

// ============================================================================
// Social Accounts Table
// ============================================================================

// Social accounts connected to brand
export const socialAccounts = pgTable("social_accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Platform info
  platform: socialPlatformEnum("platform").notNull(),
  accountType: socialAccountTypeEnum("account_type").default("company"),

  // Account identifiers
  accountId: text("account_id").notNull(), // Platform-specific account ID
  accountHandle: text("account_handle"), // @username or page name
  accountName: text("account_name"),
  profileUrl: text("profile_url"),
  avatarUrl: text("avatar_url"),

  // OAuth tokens (encrypted in production)
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  tokenMetadata: jsonb("token_metadata").$type<TokenMetadata>(),

  // Current metrics (latest snapshot)
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  postsCount: integer("posts_count").default(0),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false),
  connectionStatus: text("connection_status").default("connected"), // 'connected', 'expired', 'revoked'

  // Sync info
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  lastError: text("last_error"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Social Mentions Table
// ============================================================================

// Social mentions (separate from AI mentions)
export const socialMentions = pgTable("social_mentions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  socialAccountId: text("social_account_id").references(() => socialAccounts.id, {
    onDelete: "set null",
  }),

  // Platform info
  platform: socialPlatformEnum("platform").notNull(),

  // Post identifiers
  postId: text("post_id"), // Platform-specific post ID
  postUrl: text("post_url"),

  // Author info
  authorHandle: text("author_handle"),
  authorName: text("author_name"),
  authorAvatarUrl: text("author_avatar_url"),
  authorFollowers: integer("author_followers"),
  authorVerified: boolean("author_verified").default(false),

  // Content
  content: text("content"),
  contentType: text("content_type"), // 'text', 'image', 'video', 'link', 'thread'

  // Sentiment
  sentiment: socialSentimentEnum("sentiment"),
  sentimentScore: real("sentiment_score"), // -1 to 1

  // Engagement metrics
  engagementLikes: integer("engagement_likes").default(0),
  engagementShares: integer("engagement_shares").default(0),
  engagementComments: integer("engagement_comments").default(0),
  engagementViews: integer("engagement_views").default(0),

  // Classification
  isInfluencer: boolean("is_influencer").default(false),
  influencerTier: text("influencer_tier"), // 'nano', 'micro', 'mid', 'macro', 'mega'

  // Tags and metadata
  hashtags: jsonb("hashtags").$type<string[]>().default([]),
  mentionedCompetitors: jsonb("mentioned_competitors").$type<string[]>().default([]),
  mentionedProducts: jsonb("mentioned_products").$type<string[]>().default([]),

  // Media
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),

  // Timestamps
  postTimestamp: timestamp("post_timestamp", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Social Metrics Table (Daily Snapshots)
// ============================================================================

// Social metrics history (daily snapshots for trend analysis)
export const socialMetrics = pgTable(
  "social_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    socialAccountId: text("social_account_id").references(() => socialAccounts.id, {
      onDelete: "cascade",
    }),

    // Platform info
    platform: socialPlatformEnum("platform").notNull(),
    date: date("date").notNull(),

    // Follower metrics
    followersCount: integer("followers_count"),
    followersGain: integer("followers_gain"),
    followersLost: integer("followers_lost"),
    followingCount: integer("following_count"),

    // Content metrics
    postsCount: integer("posts_count"),
    newPostsCount: integer("new_posts_count"),

    // Engagement metrics
    engagementRate: real("engagement_rate"), // Percentage as decimal
    avgLikesPerPost: real("avg_likes_per_post"),
    avgCommentsPerPost: real("avg_comments_per_post"),
    avgSharesPerPost: real("avg_shares_per_post"),

    // Reach and impressions
    impressions: integer("impressions"),
    reach: integer("reach"),
    profileViews: integer("profile_views"),

    // Mentions and sentiment
    mentionsCount: integer("mentions_count"),
    sentimentPositive: integer("sentiment_positive"),
    sentimentNeutral: integer("sentiment_neutral"),
    sentimentNegative: integer("sentiment_negative"),
    avgSentimentScore: real("avg_sentiment_score"),

    // Platform-specific metrics
    platformMetrics: jsonb("platform_metrics").$type<PlatformMetrics>(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueAccountDate: unique().on(table.socialAccountId, table.date),
  })
);

// ============================================================================
// Social Scores Table
// ============================================================================

// Platform score breakdown
export interface SocialPlatformBreakdown {
  platform: string;
  score: number;
  followers: number;
  engagementRate: number;
  sentimentScore: number;
  reachScore: number;
}

// Social score history (daily)
export const socialScores = pgTable(
  "social_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    date: date("date").notNull(),

    // Overall SMO score (0-100)
    overallScore: integer("overall_score"),

    // Component scores (0-100 each)
    reachScore: integer("reach_score"),
    engagementScore: integer("engagement_score"),
    sentimentScore: integer("sentiment_score"),
    growthScore: integer("growth_score"),
    consistencyScore: integer("consistency_score"), // Posting consistency

    // Platform breakdown
    platformBreakdown: jsonb("platform_breakdown").$type<SocialPlatformBreakdown[]>(),

    // Key metrics used in calculation
    totalFollowers: integer("total_followers"),
    totalEngagements: integer("total_engagements"),
    avgEngagementRate: real("avg_engagement_rate"),
    avgSentiment: real("avg_sentiment"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueBrandDate: unique().on(table.brandId, table.date),
  })
);

// ============================================================================
// Relations
// ============================================================================

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  brand: one(brands, {
    fields: [socialAccounts.brandId],
    references: [brands.id],
  }),
  mentions: many(socialMentions),
  metrics: many(socialMetrics),
}));

export const socialMentionsRelations = relations(socialMentions, ({ one }) => ({
  brand: one(brands, {
    fields: [socialMentions.brandId],
    references: [brands.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [socialMentions.socialAccountId],
    references: [socialAccounts.id],
  }),
}));

export const socialMetricsRelations = relations(socialMetrics, ({ one }) => ({
  brand: one(brands, {
    fields: [socialMetrics.brandId],
    references: [brands.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [socialMetrics.socialAccountId],
    references: [socialAccounts.id],
  }),
}));

export const socialScoresRelations = relations(socialScores, ({ one }) => ({
  brand: one(brands, {
    fields: [socialScores.brandId],
    references: [brands.id],
  }),
}));

// ============================================================================
// Phase 8: OAuth Tokens Table (Secure Token Storage)
// ============================================================================

export const connectionStatusEnum = pgEnum("connection_status", [
  "active",
  "expired",
  "revoked",
  "error",
  "pending",
]);

export const syncJobStatusEnum = pgEnum("sync_job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const syncJobTypeEnum = pgEnum("sync_job_type", [
  "metrics",
  "mentions",
  "followers",
  "posts",
  "profile",
  "full_sync",
]);

// Dedicated OAuth tokens table with encryption support
export const socialOauthTokens = pgTable(
  "social_oauth_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id").notNull(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    // Platform info
    platform: socialPlatformEnum("platform").notNull(),

    // OAuth tokens (should be encrypted in production)
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenType: text("token_type").default("Bearer"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    scopes: jsonb("scopes").$type<string[]>().default([]),

    // Account info from OAuth response
    accountId: text("account_id"), // Platform-specific user/page ID
    accountName: text("account_name"),
    accountHandle: text("account_handle"),
    profileUrl: text("profile_url"),
    avatarUrl: text("avatar_url"),

    // Connection status
    connectionStatus: connectionStatusEnum("connection_status").default("active"),
    lastError: text("last_error"),
    lastErrorAt: timestamp("last_error_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueBrandPlatformAccount: unique().on(table.brandId, table.platform, table.accountId),
  })
);

// ============================================================================
// Phase 8: API Rate Limits Table
// ============================================================================

// Track rate limits per platform/endpoint
export const apiRateLimits = pgTable(
  "api_rate_limits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    platform: socialPlatformEnum("platform").notNull(),
    endpoint: text("endpoint").notNull(), // e.g., 'user/timeline', 'mentions', 'analytics'

    // Rate limit tracking
    requestsMade: integer("requests_made").default(0),
    requestsLimit: integer("requests_limit").notNull(),
    windowStartAt: timestamp("window_start_at", { withTimezone: true }).defaultNow(),
    windowDurationSeconds: integer("window_duration_seconds").default(900), // 15 min default
    resetAt: timestamp("reset_at", { withTimezone: true }),

    // Backoff tracking
    consecutiveErrors: integer("consecutive_errors").default(0),
    backoffUntil: timestamp("backoff_until", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniquePlatformEndpoint: unique().on(table.platform, table.endpoint),
  })
);

// ============================================================================
// Phase 8: Social Sync Jobs Table
// ============================================================================

// Track background sync jobs
export const socialSyncJobs = pgTable("social_sync_jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  socialAccountId: text("social_account_id").references(() => socialAccounts.id, {
    onDelete: "cascade",
  }),

  // Job info
  platform: socialPlatformEnum("platform").notNull(),
  jobType: syncJobTypeEnum("job_type").notNull(),
  status: syncJobStatusEnum("status").default("pending"),

  // Execution tracking
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  recordsProcessed: integer("records_processed").default(0),
  recordsTotal: integer("records_total"),

  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),

  // Job metadata
  jobMetadata: jsonb("job_metadata").$type<Record<string, unknown>>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Phase 8: Social Posts Table (Brand's Own Content)
// ============================================================================

export const socialPostTypeEnum = pgEnum("social_post_type", [
  "text",
  "image",
  "video",
  "carousel",
  "story",
  "reel",
  "live",
  "poll",
  "thread",
  "article",
]);

// Track brand's own social media posts
export const socialPosts = pgTable(
  "social_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    socialAccountId: text("social_account_id").references(() => socialAccounts.id, {
      onDelete: "cascade",
    }),

    // Platform info
    platform: socialPlatformEnum("platform").notNull(),
    platformPostId: text("platform_post_id").notNull(), // Platform-specific post ID

    // Content
    content: text("content"),
    postType: socialPostTypeEnum("post_type"),
    postUrl: text("post_url"),

    // Publication
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isPublished: boolean("is_published").default(true),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),

    // Engagement metrics
    likesCount: integer("likes_count").default(0),
    commentsCount: integer("comments_count").default(0),
    sharesCount: integer("shares_count").default(0),
    savesCount: integer("saves_count").default(0),
    impressionsCount: integer("impressions_count").default(0),
    reachCount: integer("reach_count").default(0),
    engagementRate: real("engagement_rate"),

    // Sentiment analysis
    sentimentScore: real("sentiment_score"), // -1 to 1

    // Content metadata
    hashtags: jsonb("hashtags").$type<string[]>().default([]),
    mentions: jsonb("mentions").$type<string[]>().default([]),
    mediaUrls: jsonb("media_urls").$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueBrandPlatformPost: unique().on(table.brandId, table.platform, table.platformPostId),
  })
);

// ============================================================================
// Phase 8: Relations for New Tables
// ============================================================================

export const socialOauthTokensRelations = relations(socialOauthTokens, ({ one }) => ({
  brand: one(brands, {
    fields: [socialOauthTokens.brandId],
    references: [brands.id],
  }),
}));

export const socialSyncJobsRelations = relations(socialSyncJobs, ({ one }) => ({
  brand: one(brands, {
    fields: [socialSyncJobs.brandId],
    references: [brands.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [socialSyncJobs.socialAccountId],
    references: [socialAccounts.id],
  }),
}));

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  brand: one(brands, {
    fields: [socialPosts.brandId],
    references: [brands.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [socialPosts.socialAccountId],
    references: [socialAccounts.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type NewSocialAccount = typeof socialAccounts.$inferInsert;
export type SocialMention = typeof socialMentions.$inferSelect;
export type NewSocialMention = typeof socialMentions.$inferInsert;
export type SocialMetric = typeof socialMetrics.$inferSelect;
export type NewSocialMetric = typeof socialMetrics.$inferInsert;
export type SocialScore = typeof socialScores.$inferSelect;
export type NewSocialScore = typeof socialScores.$inferInsert;

// Phase 8 types
export type SocialOauthToken = typeof socialOauthTokens.$inferSelect;
export type NewSocialOauthToken = typeof socialOauthTokens.$inferInsert;
export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
export type NewApiRateLimit = typeof apiRateLimits.$inferInsert;
export type SocialSyncJob = typeof socialSyncJobs.$inferSelect;
export type NewSocialSyncJob = typeof socialSyncJobs.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;
