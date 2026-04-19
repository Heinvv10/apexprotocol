/**
 * Apex Agents v1 — run history + approval queue (FR-AGT-004/005).
 *
 * Three fixed agents in v1: visibility_gap_brief, competitor_audit,
 * content_refresh. Approval-gated by design — no agent output reaches
 * an external system without an explicit human approval.
 *
 * We deliberately do not ship a drag-drop workflow builder (Profound's
 * upsell scaffolding) — the gap analysis (§13) documents why.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";
import { brands } from "./brands";
import { users } from "./users";

export const agentKindEnum = pgEnum("agent_kind", [
  "visibility_gap_brief",
  "competitor_audit",
  "content_refresh",
]);

export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "pending",
  "running",
  "awaiting_approval",
  "approved",
  "rejected",
  "completed",
  "failed",
]);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    triggeredById: text("triggered_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    kind: agentKindEnum("kind").notNull(),
    status: agentRunStatusEnum("status").notNull().default("pending"),

    /** Parameters the agent was invoked with (query, threshold, etc.) */
    params: jsonb("params").$type<Record<string, unknown>>().default({}),

    /** Structured output — schema varies per agent kind */
    output: jsonb("output").$type<Record<string, unknown>>(),

    /** Approval queue fields */
    approvedById: text("approved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),

    /** Telemetry */
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),

    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("agent_runs_org_created_idx").on(
      t.organizationId,
      t.createdAt.desc(),
    ),
    index("agent_runs_brand_status_idx").on(t.brandId, t.status),
  ],
);

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
  organization: one(organizations, {
    fields: [agentRuns.organizationId],
    references: [organizations.id],
  }),
  brand: one(brands, {
    fields: [agentRuns.brandId],
    references: [brands.id],
  }),
  triggeredBy: one(users, {
    fields: [agentRuns.triggeredById],
    references: [users.id],
    relationName: "agent_run_triggered_by",
  }),
  approvedBy: one(users, {
    fields: [agentRuns.approvedById],
    references: [users.id],
    relationName: "agent_run_approved_by",
  }),
}));

export type AgentRun = typeof agentRuns.$inferSelect;
export type NewAgentRun = typeof agentRuns.$inferInsert;
