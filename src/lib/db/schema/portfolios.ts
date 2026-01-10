import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";
import { brands } from "./brands";

// Report frequency enum
export const reportFrequencyEnum = pgEnum("report_frequency", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
]);

// Report status enum
export const reportStatusEnum = pgEnum("report_status", [
  "scheduled",
  "generating",
  "completed",
  "failed",
]);

// Portfolio settings interface
export interface PortfolioSettings {
  defaultView: "grid" | "list" | "comparison";
  alertThresholds: {
    scoreDropPercent: number;
    mentionDropPercent: number;
    competitorGainPercent: number;
  };
  reportRecipients: string[];
  reportFrequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly";
  compareMetrics: string[];
}

// Portfolios table - groups multiple brands for agencies/enterprise
export const portfolios = pgTable("portfolios", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Basic info
  name: text("name").notNull(),
  description: text("description"),

  // Settings
  settings: jsonb("settings").$type<PortfolioSettings>().default({
    defaultView: "grid",
    alertThresholds: {
      scoreDropPercent: 10,
      mentionDropPercent: 20,
      competitorGainPercent: 15,
    },
    reportRecipients: [],
    reportFrequency: "weekly",
    compareMetrics: ["unified_score", "geo_score", "mentions_count"],
  }),

  // Aggregated metrics (cached for performance)
  aggregatedMetrics: jsonb("aggregated_metrics").$type<PortfolioMetrics>().default({
    totalBrands: 0,
    avgUnifiedScore: 0,
    avgGeoScore: 0,
    avgSeoScore: 0,
    avgAeoScore: 0,
    totalMentions: 0,
    totalRecommendations: 0,
    healthStatus: "healthy",
  }),

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  metricsUpdatedAt: timestamp("metrics_updated_at", { withTimezone: true }),
});

// Portfolio metrics interface
export interface PortfolioMetrics {
  totalBrands: number;
  avgUnifiedScore: number;
  avgGeoScore: number;
  avgSeoScore: number;
  avgAeoScore: number;
  totalMentions: number;
  totalRecommendations: number;
  healthStatus: "healthy" | "warning" | "critical";
  brandBreakdown?: {
    brandId: string;
    brandName: string;
    unifiedScore: number;
    trend: "up" | "down" | "stable";
  }[];
}

// Junction table: Portfolio <-> Brands (many-to-many)
export const portfolioBrands = pgTable("portfolio_brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Order within portfolio
  displayOrder: integer("display_order").default(0),

  // Per-brand settings within portfolio
  isHighlighted: boolean("is_highlighted").default(false),
  customLabel: text("custom_label"),

  // Timestamps
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

// Executive Reports table
export const executiveReports = pgTable("executive_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  portfolioId: text("portfolio_id").references(() => portfolios.id, {
    onDelete: "set null",
  }),

  // Report metadata
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // 'weekly', 'monthly', 'custom', 'audit'

  // Date range
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  // Report content (JSON structure for flexibility)
  content: jsonb("content").$type<ReportContent>().notNull(),

  // PDF generation
  pdfUrl: text("pdf_url"),
  pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),

  // Status
  status: reportStatusEnum("status").default("scheduled").notNull(),

  // Delivery
  recipients: jsonb("recipients").$type<string[]>().default([]),
  sentAt: timestamp("sent_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Report content interface
export interface ReportContent {
  summary: {
    headline: string;
    keyMetrics: {
      label: string;
      value: number | string;
      change: number;
      changeDirection: "up" | "down" | "stable";
    }[];
    highlights: string[];
  };
  scores: {
    unified: { current: number; previous: number; trend: number[] };
    seo: { current: number; previous: number; trend: number[] };
    geo: { current: number; previous: number; trend: number[] };
    aeo: { current: number; previous: number; trend: number[] };
  };
  mentions: {
    total: number;
    byPlatform: { platform: string; count: number; sentiment: string }[];
    topQueries: { query: string; count: number }[];
  };
  recommendations: {
    completed: number;
    inProgress: number;
    pending: number;
    topPriority: { title: string; category: string; impact: string }[];
  };
  competitive: {
    shareOfVoice: number;
    competitorComparison: { name: string; sov: number }[];
    gaps: { keyword: string; opportunity: string }[];
  };
  insights: string[];
  brandBreakdown?: {
    brandId: string;
    brandName: string;
    scores: { unified: number; geo: number };
    mentionCount: number;
    topRecommendation: string;
  }[];
}

// Investor Report content interface (extends executive reports for investor intelligence)
export interface InvestorReportContent extends ReportContent {
  // Brand credibility and investment readiness
  credibilitySummary: {
    credibilityScore: number; // 0-100
    impactIndexRating: number; // 0-100
    strengths: string[]; // Top 3 strengths
    risks: string[]; // Top 3 risks
    investmentRecommendation: string; // 1-paragraph assessment
  };

  // GEO visibility trends over time
  geoTrends: {
    dateRange: {
      start: string;
      end: string;
    };
    metrics: {
      date: string;
      impressions: number;
      clicks: number;
      ctr: number;
      avgRanking: number;
    }[];
    trendDirection: "up" | "down" | "stable";
    periodComparison: {
      currentPeriod: { impressions: number; clicks: number; ctr: number };
      previousPeriod: { impressions: number; clicks: number; ctr: number };
      percentChange: { impressions: number; clicks: number; ctr: number };
    };
  };

  // Industry benchmark comparisons
  benchmarkData: {
    industryMedian: {
      unifiedScore: number;
      geoScore: number;
      credibilityScore: number;
    };
    subjectBusiness: {
      unifiedScore: number;
      geoScore: number;
      credibilityScore: number;
    };
    percentileRanking: number; // 0-100 (e.g., 75 = top 25%)
    delta: {
      unifiedScore: number; // Percentage difference
      geoScore: number;
      credibilityScore: number;
    };
    comparableBusinessesCount: number;
  };

  // Impact Index detailed breakdown
  impactIndexBreakdown: {
    overallScore: number;
    components: {
      name: string; // e.g., "Quality", "Relevance", "Authority"
      score: number; // 0-100
      weight: number; // Percentage weight in overall score
      rawData: string; // Source/evidence
    }[];
    methodology: string; // Calculation methodology explanation
  };

  // Competitive intelligence (optional - if available)
  competitiveIntelligence?: {
    directCompetitors: {
      name: string;
      unifiedScore: number;
      geoScore: number;
      marketShare: number;
    }[];
    competitiveAdvantages: string[];
    threats: string[];
  };
}

// Scheduled Reports table (for automated report generation)
export const scheduledReports = pgTable("scheduled_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  portfolioId: text("portfolio_id").references(() => portfolios.id, {
    onDelete: "cascade",
  }),

  // Schedule settings
  name: text("name").notNull(),
  frequency: reportFrequencyEnum("frequency").notNull(),
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  timeOfDay: text("time_of_day").default("09:00"), // HH:MM format

  // Recipients
  recipients: jsonb("recipients").$type<string[]>().default([]),

  // Report customization
  includeAllBrands: boolean("include_all_brands").default(true),
  brandIds: jsonb("brand_ids").$type<string[]>().default([]),
  sections: jsonb("sections").$type<string[]>().default([
    "summary",
    "scores",
    "mentions",
    "recommendations",
    "competitive",
    "insights",
  ]),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [portfolios.organizationId],
    references: [organizations.id],
  }),
  portfolioBrands: many(portfolioBrands),
  executiveReports: many(executiveReports),
  scheduledReports: many(scheduledReports),
}));

export const portfolioBrandsRelations = relations(portfolioBrands, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioBrands.portfolioId],
    references: [portfolios.id],
  }),
  brand: one(brands, {
    fields: [portfolioBrands.brandId],
    references: [brands.id],
  }),
}));

export const executiveReportsRelations = relations(executiveReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [executiveReports.organizationId],
    references: [organizations.id],
  }),
  portfolio: one(portfolios, {
    fields: [executiveReports.portfolioId],
    references: [portfolios.id],
  }),
}));

export const scheduledReportsRelations = relations(scheduledReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [scheduledReports.organizationId],
    references: [organizations.id],
  }),
  portfolio: one(portfolios, {
    fields: [scheduledReports.portfolioId],
    references: [portfolios.id],
  }),
}));

// Type exports
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type PortfolioBrand = typeof portfolioBrands.$inferSelect;
export type NewPortfolioBrand = typeof portfolioBrands.$inferInsert;
export type ExecutiveReport = typeof executiveReports.$inferSelect;
export type NewExecutiveReport = typeof executiveReports.$inferInsert;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;
