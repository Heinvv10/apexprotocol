/**
 * Zapier REST Hook subscriptions.
 *
 * Requirement: FR-ITG-004.
 *
 * Zapier's "REST Hooks" model: when a user builds a Zap, Zapier POSTs to our
 * subscribe endpoint with a target URL + trigger type. We store the
 * (tenant, target_url, event) tuple here. When the named event fires, we
 * POST the payload to every matching subscription. On unsubscribe, Zapier
 * hits our unsubscribe endpoint with the subscription id and we remove it.
 */

import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

export const zapierEventEnum = pgEnum("zapier_event", [
  "score_changed",
  "new_recommendation",
  "alert_fired",
  "mention_detected",
  "audit_completed",
]);

export const zapierSubscriptions = pgTable(
  "zapier_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    event: zapierEventEnum("event").notNull(),
    /** Zapier-provided target URL — we POST here on event */
    targetUrl: text("target_url").notNull(),
    /** Optional filter — brand_id scoping */
    brandId: text("brand_id"),
    /** Zapier-assigned bundle id — echoed back on delivery for debugging */
    zapierBundleId: text("zapier_bundle_id"),
    lastFiredAt: timestamp("last_fired_at", { withTimezone: true }),
    lastError: text("last_error"),
    failureCount: text("failure_count").default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("zapier_sub_org_event_idx").on(t.organizationId, t.event),
  ],
);

export const zapierSubscriptionsRelations = relations(
  zapierSubscriptions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [zapierSubscriptions.organizationId],
      references: [organizations.id],
    }),
  }),
);

export type ZapierSubscription = typeof zapierSubscriptions.$inferSelect;
export type NewZapierSubscription = typeof zapierSubscriptions.$inferInsert;
