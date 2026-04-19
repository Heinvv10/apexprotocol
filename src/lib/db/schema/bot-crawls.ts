/**
 * AI bot crawl log (FR-MON-033 — Profound's Agent Analytics moat).
 *
 * Ingests server-side log entries (Cloudflare Logpush, Vercel Edge logs,
 * raw access logs) and stores normalized rows: which AI crawler hit
 * which URL of which brand's site, when, with what status.
 *
 * Aggregate queries answer: "how often is GPTBot hitting /pricing?"
 * which directly closes the gap between "my site looks ready for AI
 * crawlers" and "crawlers are actually reading it."
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";

/**
 * Keep in sync with the AI-crawler robots.txt checker. When adding a new
 * bot, add the user-agent regex in src/lib/audit/checks/ai-crawler-check.ts
 * AND a row here in the same PR.
 */
export const aiCrawlerEnum = pgEnum("ai_crawler", [
  "gptbot",
  "chatgpt_user",
  "oai_searchbot",
  "claudebot",
  "anthropic_ai",
  "claude_web",
  "perplexitybot",
  "perplexity_user",
  "google_extended",
  "googleother",
  "bingbot_gpt",
  "meta_externalagent",
  "ccbot",
  "unknown",
]);

export const botCrawls = pgTable(
  "bot_crawls",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    crawler: aiCrawlerEnum("crawler").notNull(),
    userAgent: text("user_agent").notNull(),

    /** Normalized URL path without the origin — "/pricing" not "https://..." */
    path: text("path").notNull(),

    httpStatus: integer("http_status"),

    /** Source identification — which log ingester produced this row */
    source: text("source").notNull(),

    /** Raw IP — redacted to /24 (IPv4) or /48 (IPv6) at ingest time */
    ipRedacted: text("ip_redacted"),

    /** Size in bytes of the response served, if the ingester emits it */
    responseBytes: integer("response_bytes"),

    /** Response time in ms, if emitted */
    latencyMs: integer("latency_ms"),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("bot_crawls_brand_occurred_idx").on(
      t.brandId,
      t.occurredAt.desc(),
    ),
    index("bot_crawls_brand_crawler_path_idx").on(
      t.brandId,
      t.crawler,
      t.path,
    ),
  ],
);

export const botCrawlsRelations = relations(botCrawls, ({ one }) => ({
  brand: one(brands, {
    fields: [botCrawls.brandId],
    references: [brands.id],
  }),
}));

export type BotCrawl = typeof botCrawls.$inferSelect;
export type NewBotCrawl = typeof botCrawls.$inferInsert;
