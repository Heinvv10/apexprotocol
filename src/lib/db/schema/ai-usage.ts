/**
 * AI Usage Schema - Track token usage per organization
 */

import { pgTable, text, integer, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { users } from "./users";

// AI Usage table for tracking token usage
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id").notNull(),
  userId: text("user_id"),
  provider: text("provider").notNull(), // 'claude' | 'openai'
  model: text("model").notNull(),
  operation: text("operation").notNull(), // 'sentiment', 'content', 'recommendation', etc.
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  cost: text("cost").default("0"), // Stored as string to preserve decimal precision
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiUsage.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

// Types
export type AIUsage = typeof aiUsage.$inferSelect;
export type NewAIUsage = typeof aiUsage.$inferInsert;
