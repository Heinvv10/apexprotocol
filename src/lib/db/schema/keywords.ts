/**
 * SEO Keywords Schema
 * Tracks keyword rankings and performance for SEO monitoring
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

// Keywords table for SEO tracking
export const keywords = pgTable("keywords", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Keyword info
  keyword: text("keyword").notNull(),
  url: text("url").notNull(), // URL this keyword is associated with

  // Ranking data
  currentPosition: integer("current_position").default(0).notNull(),
  previousPosition: integer("previous_position").default(0).notNull(),

  // Metrics
  searchVolume: integer("search_volume").default(0),
  difficulty: integer("difficulty").default(0), // 0-100 keyword difficulty score
  traffic: integer("traffic").default(0), // Estimated traffic from this keyword

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const keywordsRelations = relations(keywords, ({ one }) => ({
  organization: one(organizations, {
    fields: [keywords.organizationId],
    references: [organizations.id],
  }),
}));

// Type exports
export type Keyword = typeof keywords.$inferSelect;
export type NewKeyword = typeof keywords.$inferInsert;
