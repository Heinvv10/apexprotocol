/**
 * Recommendation lift measurement + ROI modeling (🏆 FR-REC-007/013).
 *
 * Every completed recommendation gets a "measurement window": we snapshot
 * the brand score pre-completion, wait N days, snapshot post, diff.
 * Revenue attribution (when GA4/Shopify is wired) is layered on the same
 * measurement window.
 *
 * Pre/post deltas feed back into the what-if simulator's heuristic deltas
 * over time — the category-leading loop.
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { recommendations } from "./recommendations";
import { brands } from "./brands";
import { organizations } from "./organizations";

export interface LiftSnapshot {
  overallScore: number;
  mentionedRate: number | null;
  revenueCents: number | null;
  recordedAt: string;
}

export const recommendationLift = pgTable(
  "recommendation_lift",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    /** When the recommendation transitioned to 'completed' */
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    /** Measurement window — default 30 days post-completion */
    windowDays: integer("window_days").notNull().default(30),

    /** Snapshots captured at completion and at window close */
    preSnapshot: jsonb("pre_snapshot").$type<LiftSnapshot>().notNull(),
    postSnapshot: jsonb("post_snapshot").$type<LiftSnapshot>(),

    /** Deltas — null until window closes and post is captured */
    scoreDelta: integer("score_delta"),
    revenueCentsDelta: integer("revenue_cents_delta"),

    /**
     * Projected impact, computed at creation time based on the recommendation
     * type + historical lift data. Stored so we can reconcile projected vs
     * realized and refine the heuristic.
     */
    projectedScoreDelta: integer("projected_score_delta"),
    projectedRevenueCentsDelta: integer("projected_revenue_cents_delta"),
    /** 0..100 integer — confidence of the projection */
    projectionConfidence: integer("projection_confidence"),

    /**
     * Computed when post snapshot arrives. Null ⇒ measurement still open,
     * 'accurate' ⇒ realized within 30% of projected, 'optimistic' / 'pessimistic'
     * otherwise.
     */
    reconciliation: text("reconciliation"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("rec_lift_org_completed_idx").on(
      t.organizationId,
      t.completedAt.desc(),
    ),
    index("rec_lift_brand_window_idx").on(t.brandId, t.windowDays),
  ],
);

export const recommendationLiftRelations = relations(
  recommendationLift,
  ({ one }) => ({
    recommendation: one(recommendations, {
      fields: [recommendationLift.recommendationId],
      references: [recommendations.id],
    }),
    brand: one(brands, {
      fields: [recommendationLift.brandId],
      references: [brands.id],
    }),
    organization: one(organizations, {
      fields: [recommendationLift.organizationId],
      references: [organizations.id],
    }),
  }),
);

export type RecommendationLift = typeof recommendationLift.$inferSelect;
export type NewRecommendationLift = typeof recommendationLift.$inferInsert;
