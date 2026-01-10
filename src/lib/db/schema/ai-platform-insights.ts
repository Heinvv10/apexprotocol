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
import { brands } from "./brands";
import { users } from "./users";
import { aiPlatformEnum } from "./mentions";

/**
 * Citation type enumeration
 *
 * Defines the different types of citations that AI platforms can make when referencing brand content.
 *
 * @enum {string}
 * @property {string} direct_quote - Direct quotation from brand content
 * @property {string} paraphrase - Paraphrased content from brand sources
 * @property {string} link - URL reference to brand content
 * @property {string} reference - General reference to brand information
 */
export const citationTypeEnum = pgEnum("citation_type", [
  "direct_quote",
  "paraphrase",
  "link",
  "reference",
]);

/**
 * Platform queries table
 *
 * Stores brand-related queries that are run against multiple AI platforms for analysis.
 * Each query represents a single brand-related question or search that will be sent to
 * ChatGPT, Claude, Gemini, and Perplexity to analyze how each platform handles brand content.
 *
 * @table platform_queries
 */
export const platformQueries = pgTable("platform_queries", {
  /** Unique identifier for the query */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  /** Brand being analyzed */
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  /** User who created the query */
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** The actual query text sent to AI platforms */
  queryText: text("query_text").notNull(),
  /** Additional brand context/prompt provided with the query */
  brandContext: text("brand_context"),

  /** Array of platform names that were queried (e.g., ['chatgpt', 'claude']) */
  platforms: jsonb("platforms").$type<string[]>().default([]),
  /** Query execution status: pending, completed, failed, or partial */
  status: text("status").default("pending").notNull(),

  /** Timestamp when query was created */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  /** Timestamp when query execution completed */
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/**
 * Platform insights table
 *
 * Stores analysis results for each AI platform's response to a brand query.
 * Contains visibility scores, citation metrics, content type performance data,
 * and platform-specific recommendations. One record is created per platform per query.
 *
 * @table platform_insights
 */
export const platformInsights = pgTable("platform_insights", {
  /** Unique identifier for the insight record */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  /** Reference to the parent query */
  queryId: text("query_id")
    .notNull()
    .references(() => platformQueries.id, { onDelete: "cascade" }),
  /** Brand being analyzed */
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  /** User who owns this insight */
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** AI platform that generated this response (chatgpt, claude, gemini, perplexity) */
  platform: aiPlatformEnum("platform").notNull(),

  /** The full text response from the AI platform */
  responseContent: text("response_content").notNull(),

  /** Brand visibility score on a scale of 0-100 */
  visibilityScore: integer("visibility_score"),
  /** Total number of citations found in the response */
  citationCount: integer("citation_count").default(0).notNull(),
  /** Total number of brand mentions in the response */
  mentionCount: integer("mention_count").default(0).notNull(),
  /** How prominently the brand appears in the response (0-100) */
  prominenceScore: integer("prominence_score"),

  /** Performance metrics broken down by content type */
  contentTypePerformance: jsonb("content_type_performance").$type<ContentTypePerformance>().default({}),

  /** Platform-specific optimization recommendations */
  recommendations: jsonb("recommendations").$type<string[]>().default([]),

  /** Raw platform response metadata (model, tokens, timing, etc.) */
  metadata: jsonb("metadata").$type<InsightMetadata>().default({}),

  /** Timestamp when insight was created */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Citation records table
 *
 * Stores individual citations extracted from AI platform responses.
 * Each record represents a single citation, quote, or reference to brand content
 * found in a platform's response. Includes citation type, source information,
 * positioning, and relevance metrics.
 *
 * @table citation_records
 */
export const citationRecords = pgTable("citation_records", {
  /** Unique identifier for the citation */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  /** Reference to the parent platform insight */
  insightId: text("insight_id")
    .notNull()
    .references(() => platformInsights.id, { onDelete: "cascade" }),
  /** Brand being cited */
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  /** Type of citation (direct_quote, paraphrase, link, reference) */
  citationType: citationTypeEnum("citation_type").notNull(),
  /** The actual quoted or paraphrased text from the citation */
  citationText: text("citation_text"),
  /** URL of the source being cited */
  sourceUrl: text("source_url"),
  /** Title of the cited source */
  sourceTitle: text("source_title"),

  /** Position of citation in response (0-based index) */
  position: integer("position"),
  /** Surrounding context where citation appears */
  context: text("context"),

  /** Type of content being cited (blog_post, documentation, case_study, etc.) */
  contentType: text("content_type"),

  /** Relevance score for this citation (0-100) */
  relevanceScore: integer("relevance_score"),

  /** Timestamp when citation was recorded */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Content type performance metrics
 *
 * Tracks how frequently different types of brand content are cited by AI platforms.
 * Each property represents a content type and its citation count or performance score.
 *
 * @interface ContentTypePerformance
 */
export interface ContentTypePerformance {
  /** Blog post citations */
  blog_post?: number;
  /** Documentation citations */
  documentation?: number;
  /** Case study citations */
  case_study?: number;
  /** Press release citations */
  press_release?: number;
  /** Social media citations */
  social_media?: number;
  /** Video content citations */
  video?: number;
  /** Podcast citations */
  podcast?: number;
  /** Whitepaper citations */
  whitepaper?: number;
  /** Additional custom content types */
  [key: string]: number | undefined;
}

/**
 * Platform insight metadata
 *
 * Contains raw response metadata from AI platforms including model information,
 * token usage, performance metrics, and platform-specific data like search results.
 *
 * @interface InsightMetadata
 */
export interface InsightMetadata {
  /** AI model name (e.g., 'gpt-4', 'claude-3-opus') */
  model?: string;
  /** Model version identifier */
  modelVersion?: string;
  /** Temperature setting used for generation */
  temperature?: number;
  /** Number of tokens consumed by the request */
  tokensUsed?: number;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Search results array (Perplexity-specific) */
  searchResults?: any[];
  /** Full raw response from platform for debugging */
  rawResponse?: any;
}

// Relations
export const platformQueriesRelations = relations(platformQueries, ({ one, many }) => ({
  brand: one(brands, {
    fields: [platformQueries.brandId],
    references: [brands.id],
  }),
  user: one(users, {
    fields: [platformQueries.userId],
    references: [users.id],
  }),
  insights: many(platformInsights),
}));

export const platformInsightsRelations = relations(platformInsights, ({ one, many }) => ({
  query: one(platformQueries, {
    fields: [platformInsights.queryId],
    references: [platformQueries.id],
  }),
  brand: one(brands, {
    fields: [platformInsights.brandId],
    references: [brands.id],
  }),
  user: one(users, {
    fields: [platformInsights.userId],
    references: [users.id],
  }),
  citations: many(citationRecords),
}));

export const citationRecordsRelations = relations(citationRecords, ({ one }) => ({
  insight: one(platformInsights, {
    fields: [citationRecords.insightId],
    references: [platformInsights.id],
  }),
  brand: one(brands, {
    fields: [citationRecords.brandId],
    references: [brands.id],
  }),
}));

// Type exports
export type PlatformQuery = typeof platformQueries.$inferSelect;
export type NewPlatformQuery = typeof platformQueries.$inferInsert;

export type PlatformInsight = typeof platformInsights.$inferSelect;
export type NewPlatformInsight = typeof platformInsights.$inferInsert;

export type CitationRecord = typeof citationRecords.$inferSelect;
export type NewCitationRecord = typeof citationRecords.$inferInsert;
