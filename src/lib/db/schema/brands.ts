import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

// Brands table
export const brands = pgTable("brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Basic info
  name: text("name").notNull(),
  domain: text("domain"),
  description: text("description"),
  industry: text("industry"),
  logoUrl: text("logo_url"),

  // SEO/GEO Keywords
  keywords: jsonb("keywords").$type<string[]>().default([]),
  competitors: jsonb("competitors").$type<string[]>().default([]),

  // Brand voice settings for AI content
  voice: jsonb("voice").$type<BrandVoice>().default({
    tone: "professional",
    personality: [],
    targetAudience: "",
    keyMessages: [],
    avoidTopics: [],
  }),

  // Visual identity settings
  visual: jsonb("visual").$type<BrandVisual>().default({
    primaryColor: null,
    secondaryColor: null,
    fontFamily: null,
  }),

  // Monitoring settings
  monitoringEnabled: boolean("monitoring_enabled").default(true).notNull(),
  monitoringPlatforms: jsonb("monitoring_platforms")
    .$type<string[]>()
    .default(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"]),

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Brand voice type
export interface BrandVoice {
  tone: "professional" | "friendly" | "authoritative" | "casual" | "formal";
  personality: string[];
  targetAudience: string;
  keyMessages: string[];
  avoidTopics: string[];
}

// Brand visual type
export interface BrandVisual {
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
}

// Relations
export const brandsRelations = relations(brands, ({ one }) => ({
  organization: one(organizations, {
    fields: [brands.organizationId],
    references: [organizations.id],
  }),
}));

// Type exports
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
