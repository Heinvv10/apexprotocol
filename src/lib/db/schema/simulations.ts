import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { organizations } from "./organizations";

// Enums
export const simulationStatusEnum = pgEnum("simulation_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "partial",
]);

export const simulationTypeEnum = pgEnum("simulation_type", [
  "single",
  "ab_test",
]);

// JSONB interfaces
export interface VisibilityBreakdown {
  mentionCount: number;
  citationQuality: number;
  prominence: number;
}

export interface SimulationResultMetadata {
  responseTime?: number;
  model?: string;
  tokensUsed?: number;
  error?: string;
}

// Simulations table - stores simulation config
export const simulations = pgTable("simulations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),

  // Simulation config
  type: simulationTypeEnum("type").default("single").notNull(),
  query: text("query").notNull(),
  contentTitle: text("content_title"),
  contentBody: text("content_body").notNull(),
  contentType: text("content_type"), // blog, faq, product, landing, etc.
  variantBTitle: text("variant_b_title"),
  variantBBody: text("variant_b_body"),
  platforms: jsonb("platforms").$type<string[]>().default([]),
  brandContextSnapshot: text("brand_context_snapshot"),

  // Execution state
  status: simulationStatusEnum("status").default("pending").notNull(),
  progress: integer("progress").default(0).notNull(),

  // Timestamps
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Simulation Results table - per-platform results
export const simulationResults = pgTable("simulation_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  simulationId: text("simulation_id")
    .notNull()
    .references(() => simulations.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),

  // Baseline (without draft content)
  baselineScore: real("baseline_score").default(0).notNull(),
  baselineCitations: integer("baseline_citations").default(0).notNull(),
  baselineResponse: text("baseline_response"),
  baselineBreakdown: jsonb("baseline_breakdown").$type<VisibilityBreakdown>(),

  // Enriched (with draft content - variant A)
  enrichedScore: real("enriched_score").default(0).notNull(),
  enrichedCitations: integer("enriched_citations").default(0).notNull(),
  enrichedResponse: text("enriched_response"),
  enrichedBreakdown: jsonb("enriched_breakdown").$type<VisibilityBreakdown>(),

  // Variant B (for A/B tests)
  variantBScore: real("variant_b_score"),
  variantBCitations: integer("variant_b_citations"),
  variantBResponse: text("variant_b_response"),
  variantBBreakdown: jsonb("variant_b_breakdown").$type<VisibilityBreakdown>(),

  // Computed deltas
  scoreDelta: real("score_delta").default(0).notNull(),
  citationDelta: integer("citation_delta").default(0).notNull(),
  variantBScoreDelta: real("variant_b_score_delta"),

  // Confidence & metadata
  confidence: real("confidence").default(0).notNull(),
  status: text("result_status").default("pending").notNull(), // pending, success, failed
  metadata: jsonb("metadata").$type<SimulationResultMetadata>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  brand: one(brands, {
    fields: [simulations.brandId],
    references: [brands.id],
  }),
  organization: one(organizations, {
    fields: [simulations.organizationId],
    references: [organizations.id],
  }),
  results: many(simulationResults),
}));

export const simulationResultsRelations = relations(simulationResults, ({ one }) => ({
  simulation: one(simulations, {
    fields: [simulationResults.simulationId],
    references: [simulations.id],
  }),
}));

// Type exports
export type Simulation = typeof simulations.$inferSelect;
export type NewSimulation = typeof simulations.$inferInsert;
export type SimulationResult = typeof simulationResults.$inferSelect;
export type NewSimulationResult = typeof simulationResults.$inferInsert;
