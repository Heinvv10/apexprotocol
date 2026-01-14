/**
 * Citation ROI Schema
 * Phase 15: AI Citation ROI Calculator
 *
 * Tracks conversions and ROI from AI platform citations
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  decimal,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { brandMentions } from "./mentions";

// Conversion type enum
export const conversionTypeEnum = pgEnum("conversion_type", [
  "signup",
  "purchase",
  "contact",
  "download",
  "demo_request",
  "newsletter",
  "free_trial",
  "custom",
]);

// Attribution model enum
export const attributionModelEnum = pgEnum("attribution_model", [
  "first_touch",
  "last_touch",
  "linear",
  "time_decay",
  "position_based",
]);

// Citation Conversions table - tracks conversions attributed to AI citations
export const citationConversions = pgTable("citation_conversions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  mentionId: text("mention_id")
    .references(() => brandMentions.id, { onDelete: "set null" }),

  // Source information
  sourcePlatform: text("source_platform").notNull(), // chatgpt, claude, etc.
  visitorSessionId: text("visitor_session_id"),
  landingPage: text("landing_page"),
  referrerUrl: text("referrer_url"),

  // Conversion details
  conversionType: conversionTypeEnum("conversion_type").notNull(),
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),

  // Attribution
  attributionConfidence: decimal("attribution_confidence", { precision: 3, scale: 2 }).default("0.5"),
  attributionModel: attributionModelEnum("attribution_model").default("last_touch"),

  // Metadata
  metadata: jsonb("metadata").$type<ConversionMetadata>().default({}),

  // Timestamps
  convertedAt: timestamp("converted_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Citation Tracking Links table - manages UTM-tagged tracking links
export const citationTrackingLinks = pgTable("citation_tracking_links", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // URLs
  originalUrl: text("original_url").notNull(),
  trackingUrl: text("tracking_url").notNull(),
  shortCode: text("short_code").unique(),

  // UTM Parameters
  utmParams: jsonb("utm_params").$type<UTMParams>().default({}),

  // Stats
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),

  // Campaign info
  campaignName: text("campaign_name"),
  targetPlatform: text("target_platform"), // Which AI platform this link targets

  // Metadata
  metadata: jsonb("metadata").$type<TrackingLinkMetadata>().default({}),

  // Timestamps
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ROI Reports table - stores generated ROI report snapshots
export const citationRoiReports = pgTable("citation_roi_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Report period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  // Summary metrics
  totalConversions: integer("total_conversions").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  totalCitations: integer("total_citations").default(0),
  estimatedTraffic: integer("estimated_traffic").default(0),

  // ROI calculations
  roiPercentage: decimal("roi_percentage", { precision: 8, scale: 2 }),
  costPerConversion: decimal("cost_per_conversion", { precision: 10, scale: 2 }),
  revenuePerCitation: decimal("revenue_per_citation", { precision: 10, scale: 2 }),

  // Breakdown by platform
  platformBreakdown: jsonb("platform_breakdown").$type<PlatformROIBreakdown[]>().default([]),

  // Breakdown by conversion type
  conversionBreakdown: jsonb("conversion_breakdown").$type<ConversionTypeBreakdown[]>().default([]),

  // Full report data
  reportData: jsonb("report_data").$type<ROIReportData>().default({}),

  // Timestamps
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const citationConversionsRelations = relations(citationConversions, ({ one }) => ({
  brand: one(brands, {
    fields: [citationConversions.brandId],
    references: [brands.id],
  }),
  mention: one(brandMentions, {
    fields: [citationConversions.mentionId],
    references: [brandMentions.id],
  }),
}));

export const citationTrackingLinksRelations = relations(citationTrackingLinks, ({ one }) => ({
  brand: one(brands, {
    fields: [citationTrackingLinks.brandId],
    references: [brands.id],
  }),
}));

export const citationRoiReportsRelations = relations(citationRoiReports, ({ one }) => ({
  brand: one(brands, {
    fields: [citationRoiReports.brandId],
    references: [brands.id],
  }),
}));

// Type definitions
export interface ConversionMetadata {
  userAgent?: string;
  deviceType?: string;
  country?: string;
  city?: string;
  queryText?: string;
  aiResponseContext?: string;
  customFields?: Record<string, unknown>;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface TrackingLinkMetadata {
  description?: string;
  tags?: string[];
  customParams?: Record<string, string>;
}

export interface PlatformROIBreakdown {
  platform: string;
  conversions: number;
  revenue: number;
  citations: number;
  conversionRate: number;
}

export interface ConversionTypeBreakdown {
  type: string;
  count: number;
  totalValue: number;
  averageValue: number;
  percentage: number;
}

export interface ROIReportData {
  summary?: {
    totalInvestment?: number;
    totalReturn?: number;
    netProfit?: number;
  };
  trends?: {
    conversionsOverTime?: { date: string; value: number }[];
    revenueOverTime?: { date: string; value: number }[];
  };
  topPerformingCitations?: {
    mentionId: string;
    platform: string;
    conversions: number;
    revenue: number;
  }[];
  recommendations?: string[];
}

// Type exports
export type CitationConversion = typeof citationConversions.$inferSelect;
export type NewCitationConversion = typeof citationConversions.$inferInsert;
export type CitationTrackingLink = typeof citationTrackingLinks.$inferSelect;
export type NewCitationTrackingLink = typeof citationTrackingLinks.$inferInsert;
export type CitationRoiReport = typeof citationRoiReports.$inferSelect;
export type NewCitationRoiReport = typeof citationRoiReports.$inferInsert;
