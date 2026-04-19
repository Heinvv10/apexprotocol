/**
 * Usage metering for usage-based billing (premium marker #7).
 *
 * Primitive building block — any domain event that should be billed or
 * reported writes a row here. Stripe sub-billing reads aggregates from
 * this table (no Stripe-specific shape baked in — Orb/Metronome/any
 * meter vendor plugs in via the same aggregate queries).
 *
 * For agency → client sub-billing: events carry both the agency
 * organization_id (who pays Apex) AND an optional client_organization_id
 * (which downstream tenant the event happened in). Agencies price
 * clients however they want — we just give them the meter.
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

export const usageEventKindEnum = pgEnum("usage_event_kind", [
  "llm_input_tokens",
  "llm_output_tokens",
  "audit_run",
  "monitored_prompt_run",
  "agent_run",
  "serpapi_query",
  "dataforseo_query",
  "pdf_report_generated",
  "embed_token_minted",
]);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    /** Org that owns the Apex subscription — the billable party */
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /**
     * Optional — for agencies, the client tenant this event originated in.
     * Null for direct customers.
     */
    clientOrganizationId: text("client_organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    kind: usageEventKindEnum("kind").notNull(),
    /** Unit quantity — tokens, runs, queries, etc. */
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    /** Per-unit cost in USD micro-cents (1/100,000 of a cent) — nullable when
     *  the vendor doesn't expose a unit price (e.g. audits) */
    unitCostMicroCents: integer("unit_cost_micro_cents"),
    /** Aggregate cost in USD cents — denormalized for fast billing rollups */
    costCents: integer("cost_cents"),

    /** Resource the event attaches to, for user-facing usage views */
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),

    /** Provider / vendor name, e.g. "anthropic", "openai", "dataforseo" */
    provider: text("provider"),

    /** Free-form metadata for forensics */
    metadata: text("metadata"),

    /**
     * Idempotency key — when set, duplicate writes with the same key are
     * deduped at the DB level. Required for at-least-once callers like
     * BullMQ workers.
     */
    idempotencyKey: text("idempotency_key"),

    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("usage_events_org_kind_occurred_idx").on(
      t.organizationId,
      t.kind,
      t.occurredAt.desc(),
    ),
    index("usage_events_client_occurred_idx").on(
      t.clientOrganizationId,
      t.occurredAt.desc(),
    ),
    index("usage_events_idempotency_idx").on(t.idempotencyKey),
  ],
);

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageEvents.organizationId],
    references: [organizations.id],
    relationName: "usage_event_billing_org",
  }),
  clientOrganization: one(organizations, {
    fields: [usageEvents.clientOrganizationId],
    references: [organizations.id],
    relationName: "usage_event_client_org",
  }),
}));

export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
