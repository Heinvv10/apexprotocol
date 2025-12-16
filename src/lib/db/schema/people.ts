/**
 * People/Leadership Schema (Phase 7.2)
 *
 * Tables for tracking key people associated with brands - executives, founders,
 * board members, and their digital presence across AI platforms and social media.
 * Enables People Presence Optimization (PPO) scoring.
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

export const roleCategoryEnum = pgEnum("role_category", [
  "c_suite",
  "founder",
  "board",
  "key_employee",
  "ambassador",
  "advisor",
  "investor",
]);

export const discoverySourceEnum = pgEnum("discovery_source", [
  "website_scrape",
  "manual",
  "linkedin",
  "api_import",
]);

export const aiPlatformTypeEnum = pgEnum("ai_platform_type", [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "copilot",
]);

// ============================================================================
// Types
// ============================================================================

// Social profiles with metrics
export interface PersonSocialProfiles {
  linkedin?: {
    url: string;
    handle?: string;
    followers?: number;
    lastUpdated?: string;
  };
  twitter?: {
    url: string;
    handle?: string;
    followers?: number;
    lastUpdated?: string;
  };
  instagram?: {
    url: string;
    handle?: string;
    followers?: number;
    lastUpdated?: string;
  };
  youtube?: {
    url: string;
    handle?: string;
    subscribers?: number;
    lastUpdated?: string;
  };
  tiktok?: {
    url: string;
    handle?: string;
    followers?: number;
    lastUpdated?: string;
  };
  github?: {
    url: string;
    handle?: string;
    followers?: number;
    lastUpdated?: string;
  };
  medium?: {
    url: string;
    handle?: string;
    followers?: number;
    lastUpdated?: string;
  };
  personalWebsite?: {
    url: string;
    lastUpdated?: string;
  };
}

// Speaking engagements and media appearances
export interface ThoughtLeadershipActivity {
  type: "podcast" | "conference" | "webinar" | "article" | "interview" | "panel";
  title: string;
  venue?: string;
  url?: string;
  date?: string;
  reach?: number;
}

// Person metadata from AI extraction
export interface PersonExtractionMetadata {
  confidence: number;
  sourceUrl?: string;
  extractedAt?: string;
  rawText?: string;
}

// ============================================================================
// Brand People Table
// ============================================================================

// Key people/leadership associated with brands
export const brandPeople = pgTable("brand_people", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Basic info
  name: text("name").notNull(),
  title: text("title"),
  roleCategory: roleCategoryEnum("role_category"),
  department: text("department"),

  // Bio and profile
  bio: text("bio"),
  shortBio: text("short_bio"), // 1-2 sentences for display
  photoUrl: text("photo_url"),

  // Contact (optional)
  email: text("email"),
  phone: text("phone"),

  // Social profiles (stored as JSONB for flexibility)
  socialProfiles: jsonb("social_profiles").$type<PersonSocialProfiles>().default({}),

  // Direct social URLs (for quick access)
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  personalWebsite: text("personal_website"),

  // Aggregated social metrics
  linkedinFollowers: integer("linkedin_followers"),
  twitterFollowers: integer("twitter_followers"),
  totalSocialFollowers: integer("total_social_followers"),

  // Thought leadership
  thoughtLeadershipActivities: jsonb("thought_leadership_activities")
    .$type<ThoughtLeadershipActivity[]>()
    .default([]),
  thoughtLeadershipScore: integer("thought_leadership_score").default(0),
  publicationsCount: integer("publications_count").default(0),
  speakingEngagementsCount: integer("speaking_engagements_count").default(0),

  // AI visibility
  aiMentionCount: integer("ai_mention_count").default(0),
  aiVisibilityScore: integer("ai_visibility_score").default(0),

  // Discovery metadata
  discoveredFrom: discoverySourceEnum("discovered_from"),
  extractionMetadata: jsonb("extraction_metadata").$type<PersonExtractionMetadata>(),

  // Status
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  isPrimary: boolean("is_primary").default(false), // Primary contact/spokesperson

  // Display order
  displayOrder: integer("display_order").default(0),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),
});

// ============================================================================
// People AI Mentions Table
// ============================================================================

// AI response metadata
export interface PersonAIMentionContext {
  queryType?: "direct" | "brand_related" | "industry" | "competitor";
  responseLength?: number;
  citationPresent?: boolean;
  prominenceLevel?: "primary" | "secondary" | "passing";
}

// People mentions in AI platforms
export const peopleAiMentions = pgTable("people_ai_mentions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  personId: text("person_id")
    .notNull()
    .references(() => brandPeople.id, { onDelete: "cascade" }),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // AI platform
  platform: aiPlatformTypeEnum("platform").notNull(),

  // Query and response
  query: text("query"),
  responseSnippet: text("response_snippet"),
  fullResponse: text("full_response"),

  // Context
  mentionedWithBrand: boolean("mentioned_with_brand").default(false),
  mentionedWithCompetitor: boolean("mentioned_with_competitor").default(false),
  competitorName: text("competitor_name"),

  // Sentiment and position
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  sentimentScore: real("sentiment_score"),
  position: integer("position"), // Position in response (1st, 2nd, etc.)

  // Context metadata
  context: jsonb("context").$type<PersonAIMentionContext>(),

  // Timestamps
  queryTimestamp: timestamp("query_timestamp", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// People Scores Table
// ============================================================================

// Person-level score breakdown
export interface PersonScoreBreakdown {
  personId: string;
  personName: string;
  title?: string;
  overallScore: number;
  socialScore: number;
  aiVisibilityScore: number;
  thoughtLeadershipScore: number;
  totalFollowers: number;
  aiMentionCount: number;
}

// People presence score history (daily)
export const peopleScores = pgTable(
  "people_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    date: date("date").notNull(),

    // Overall PPO score (0-100)
    overallScore: integer("overall_score"),

    // Component scores (0-100 each)
    executiveVisibilityScore: integer("executive_visibility_score"),
    thoughtLeadershipScore: integer("thought_leadership_score"),
    aiMentionScore: integer("ai_mention_score"),
    socialEngagementScore: integer("social_engagement_score"),

    // Per-person breakdown
    personBreakdown: jsonb("person_breakdown").$type<PersonScoreBreakdown[]>(),

    // Aggregated metrics
    totalPeopleTracked: integer("total_people_tracked"),
    totalAiMentions: integer("total_ai_mentions"),
    totalSocialFollowers: integer("total_social_followers"),
    avgThoughtLeadershipScore: real("avg_thought_leadership_score"),

    // Top performers
    topPerformerIds: jsonb("top_performer_ids").$type<string[]>().default([]),

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

export const brandPeopleRelations = relations(brandPeople, ({ one, many }) => ({
  brand: one(brands, {
    fields: [brandPeople.brandId],
    references: [brands.id],
  }),
  aiMentions: many(peopleAiMentions),
}));

export const peopleAiMentionsRelations = relations(peopleAiMentions, ({ one }) => ({
  person: one(brandPeople, {
    fields: [peopleAiMentions.personId],
    references: [brandPeople.id],
  }),
  brand: one(brands, {
    fields: [peopleAiMentions.brandId],
    references: [brands.id],
  }),
}));

export const peopleScoresRelations = relations(peopleScores, ({ one }) => ({
  brand: one(brands, {
    fields: [peopleScores.brandId],
    references: [brands.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type BrandPerson = typeof brandPeople.$inferSelect;
export type NewBrandPerson = typeof brandPeople.$inferInsert;
export type PersonAiMention = typeof peopleAiMentions.$inferSelect;
export type NewPersonAiMention = typeof peopleAiMentions.$inferInsert;
export type PeopleScore = typeof peopleScores.$inferSelect;
export type NewPeopleScore = typeof peopleScores.$inferInsert;
