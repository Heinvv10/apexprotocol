import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

// Competitor with full details
export interface BrandCompetitor {
  name: string;
  url: string;
  reason: string;
}

// AI analysis confidence scores
export interface BrandConfidence {
  overall: number;
  perField: Record<string, number>;
}

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
  tagline: text("tagline"),
  industry: text("industry"),
  logoUrl: text("logo_url"),

  // SEO/GEO Keywords (expanded)
  keywords: jsonb("keywords").$type<string[]>().default([]),
  seoKeywords: jsonb("seo_keywords").$type<string[]>().default([]),
  geoKeywords: jsonb("geo_keywords").$type<string[]>().default([]),

  // Competitors with full details
  competitors: jsonb("competitors").$type<BrandCompetitor[]>().default([]),

  // Brand positioning
  valuePropositions: jsonb("value_propositions").$type<string[]>().default([]),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),

  // Brand voice settings for AI content
  voice: jsonb("voice").$type<BrandVoice>().default({
    tone: "professional",
    personality: [],
    targetAudience: "",
    keyMessages: [],
    avoidTopics: [],
  }),

  // Visual identity settings (expanded)
  visual: jsonb("visual").$type<BrandVisual>().default({
    primaryColor: null,
    secondaryColor: null,
    accentColor: null,
    colorPalette: [],
    fontFamily: null,
  }),

  // AI Analysis confidence
  confidence: jsonb("confidence").$type<BrandConfidence>().default({
    overall: 0,
    perField: {},
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

// Brand visual type (expanded)
export interface BrandVisual {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  colorPalette: string[];
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
