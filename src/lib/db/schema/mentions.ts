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

// AI Platform enum
// Phase 0-9: Original 7 platforms
// Phase 10 Tier 1: 5 new platforms (OpenAI Search, Bing Copilot, NotebookLM, Cohere, Janus)
// Phase 10 Tier 2: 5 regional/emerging platforms (Mistral, Llama, YandexGPT, Kimi, Qwen)
export const aiPlatformEnum = pgEnum("ai_platform", [
  // Original platforms
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "copilot",
  // Phase 10 Tier 1: Quick wins
  "openai_search",
  "bing_copilot",
  "notebooklm",
  "cohere",
  "janus",
  // Phase 10 Tier 2: Regional/emerging platforms
  "mistral",
  "llama",
  "yandexgpt",
  "kimi",
  "qwen",
]);

// Sentiment enum
export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "neutral",
  "negative",
  "unrecognized",
]);

// Brand mentions table
export const brandMentions = pgTable("brand_mentions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Platform and query info
  platform: aiPlatformEnum("platform").notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),

  // Analysis results
  sentiment: sentimentEnum("sentiment").default("neutral").notNull(),
  position: integer("position"), // Ranking position in response (null if not mentioned)
  citationUrl: text("citation_url"), // URL if brand was cited

  // Competitor comparison data
  competitors: jsonb("competitors").$type<CompetitorMention[]>().default([]),

  // Categorization
  promptCategory: text("prompt_category"), // e.g., "comparison", "recommendation", "review"
  topics: jsonb("topics").$type<string[]>().default([]),

  // Metadata
  metadata: jsonb("metadata").$type<MentionMetadata>().default({}),

  // Timestamps
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Competitor mention type
export interface CompetitorMention {
  name: string;
  position: number;
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
}

// Mention metadata type
export interface MentionMetadata {
  modelVersion?: string;
  responseLength?: number;
  confidenceScore?: number;
  rawResponse?: string;
}

// Relations
export const brandMentionsRelations = relations(brandMentions, ({ one }) => ({
  brand: one(brands, {
    fields: [brandMentions.brandId],
    references: [brands.id],
  }),
}));

// Type exports
export type BrandMention = typeof brandMentions.$inferSelect;
export type NewBrandMention = typeof brandMentions.$inferInsert;
