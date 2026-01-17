import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { users } from "./users";
import { organizations } from "./organizations";

// Content type enum
export const contentTypeEnum = pgEnum("content_type", [
  "blog_post",
  "social_post",
  "product_description",
  "faq",
  "landing_page",
  "email",
  "ad_copy",
  "press_release",
]);

// Content status enum
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "review",
  "approved",
  "published",
  "archived",
]);

// Content table
export const content = pgTable("content", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),

  // Content info
  title: text("title").notNull(),
  url: text("url"), // Page URL for SEO tracking
  type: contentTypeEnum("type").notNull(),
  status: contentStatusEnum("status").default("draft").notNull(),

  // Content body
  content: text("content").notNull(),
  excerpt: text("excerpt"),

  // SEO fields
  metaDescription: text("meta_description"),
  indexed: boolean("indexed").default(false),
  indexingErrors: jsonb("indexing_errors").$type<string[]>().default([]),
  visits: integer("visits").default(0),
  lastModified: timestamp("last_modified", { withTimezone: true }),

  // SEO/AI optimization
  keywords: jsonb("keywords").$type<string[]>().default([]),
  aiScore: integer("ai_score"), // AI optimization score (0-100)
  readabilityScore: integer("readability_score"), // Readability score (0-100)
  seoScore: integer("seo_score"), // SEO score (0-100)

  // Target platform (if any)
  targetPlatform: text("target_platform"), // e.g., "chatgpt", "perplexity"

  // Versioning
  version: integer("version").default(1).notNull(),
  parentId: text("parent_id"), // For version tracking

  // AI generation metadata
  aiMetadata: jsonb("ai_metadata").$type<AIMetadata>().default({}),

  // Timestamps
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// AI metadata type
export interface AIMetadata {
  model?: string;
  prompt?: string;
  temperature?: number;
  tokensUsed?: number;
  generationTime?: number;
}

// Relations
export const contentRelations = relations(content, ({ one }) => ({
  organization: one(organizations, {
    fields: [content.organizationId],
    references: [organizations.id],
  }),
  brand: one(brands, {
    fields: [content.brandId],
    references: [brands.id],
  }),
  author: one(users, {
    fields: [content.authorId],
    references: [users.id],
  }),
}));

// Type exports
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
