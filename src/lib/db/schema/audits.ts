import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { users } from "./users";

// Audit status enum
export const auditStatusEnum = pgEnum("audit_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

// Audits table
export const audits = pgTable("audits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  triggeredById: text("triggered_by_id").references(() => users.id, {
    onDelete: "set null",
  }),

  // Audit target
  url: text("url").notNull(),
  status: auditStatusEnum("status").default("pending").notNull(),

  // Scores
  overallScore: integer("overall_score"), // 0-100
  categoryScores: jsonb("category_scores").$type<CategoryScore[]>().default([]),

  // Issues found
  issues: jsonb("issues").$type<AuditIssue[]>().default([]),
  issueCount: integer("issue_count").default(0),
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),

  // Recommendations generated from audit
  recommendations: jsonb("recommendations").$type<string[]>().default([]),

  // Per-platform visibility scores
  platformScores: jsonb("platform_scores").$type<PlatformVisibilityScore[]>().default([]),

  // Audit metadata
  metadata: jsonb("metadata").$type<AuditMetadata>().default({}),

  // Error handling
  errorMessage: text("error_message"),

  // Timestamps
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audits_brand_created_idx").on(t.brandId, t.createdAt.desc()),
  index("audits_status_idx").on(t.status),
]);

// Category score type
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  issues: number;
}

// Audit issue type
export interface AuditIssue {
  id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  element?: string;
  recommendation: string;
  impact: string;
}

// Platform visibility score type
export interface PlatformVisibilityScore {
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "copilot";
  score: number;
  citationRate: number;
  mentionRate: number;
  shareOfVoice: number;
  trend: "up" | "stable" | "down";
  lastUpdated: string;
}

// Content chunking breakdown
export interface ContentChunkingBreakdown {
  faqSchema: number;
  headingStructure: number;
  paragraphLength: number;
  listUsage: number;
  contentDepth: number;
}

// Stages the audit worker moves through. Ordered; each maps to a rough
// progress percentage so the UI can render a stepper and a determinate
// progress bar without waiting for the worker to emit exact numbers.
export type AuditStage =
  | "queued"
  | "crawling"
  | "analyzing"
  | "checks"
  | "scoring"
  | "persisting"
  | "finalizing"
  | "completed"
  | "failed"
  | "cancelled";

// Audit metadata type
export interface AuditMetadata {
  userAgent?: string;
  viewport?: { width: number; height: number };
  timing?: {
    totalDuration: number;
    fetchTime?: number;
    analysisTime?: number;
  };
  // Live progress telemetry the worker updates at each phase boundary.
  // Read by /api/audit/[id]/stream (SSE) to push updates to the dashboard.
  progress?: {
    stage: AuditStage;
    percent: number; // 0-100
    message?: string;
    pagesCrawled?: number;
    totalPages?: number;
    currentUrl?: string;
    updatedAt: string; // ISO — lets the SSE loop skip no-ops
  };
  pageInfo?: {
    title?: string;
    metaDescription?: string;
    h1Count?: number;
    wordCount?: number;
  };
  // Audit request options
  depth?: string;
  options?: Record<string, boolean>;
  priority?: string;
  // Analysis results
  pagesAnalyzed?: number;
  grade?: string;
  // Content chunking score (0-100)
  contentChunkingScore?: number;
  contentChunkingBreakdown?: ContentChunkingBreakdown;
  // Content analysis snapshot the analyzer produces per-audit. Persisted
  // so the AI Readiness hook can render real Optimization / Suitability
  // tiles instead of NaN.
  contentAnalysis?: {
    averageWordCount: number;
    averageReadability: number;
    headingHierarchyValid: boolean;
    faqSchemaFound: boolean;
    hasStructuredContent: boolean;
  };
  // AI readiness score synthesised post-audit from the category scores.
  // Weighted toward the factors that matter most for LLM citation
  // (schema + structure).
  aiReadiness?: {
    score: number;
    factors: {
      schema: number;
      structure: number;
      clarity: number;
      metadata: number;
      accessibility: number;
    };
  };
  // Prioritised 3-item action plan synthesised from issues +
  // brand_mentions once the audit completes. Lets the UI render a
  // "do these first" block instead of dropping the user into a flat
  // recommendations list. Generated by buildActionPlan() at
  // src/lib/recommendations/action-plan.ts.
  actionPlan?: {
    generatedAt: string;
    items: Array<{
      rank: 1 | 2 | 3;
      title: string;
      reason: string;
      findingIds: string[];
      expectedScoreImpact?: number;
    }>;
  };
  // Performance measurements captured during the crawl. Only populated
  // when the crawler had measurable timings.
  performance?: {
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    totalBlockingTime?: number;
    cumulativeLayoutShift?: number;
    speedIndex?: number;
    responseTime?: number;
    dnsLookup?: number;
    tcpConnection?: number;
    requestTime?: number;
    domProcessing?: number;
    resourcesDownload?: number;
  };
}

// Relations
export const auditsRelations = relations(audits, ({ one }) => ({
  brand: one(brands, {
    fields: [audits.brandId],
    references: [brands.id],
  }),
  triggeredBy: one(users, {
    fields: [audits.triggeredById],
    references: [users.id],
  }),
}));

// Type exports
export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
