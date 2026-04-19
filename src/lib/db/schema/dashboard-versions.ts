/**
 * Versioned dashboards with rollback (premium marker #5, SOC 2 prereq).
 *
 * Every save of a dashboard config writes a new row. Rollback = pick a
 * previous version and copy it forward to head. We never delete versions
 * except when a tenant GDPR-erases; cost is minimal because configs are
 * jsonb and low-cardinality.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";
import { users } from "./users";

export interface DashboardConfig {
  widgets: Array<{
    id: string;
    kind: string;
    position: { x: number; y: number; w: number; h: number };
    params?: Record<string, unknown>;
  }>;
  filters?: Record<string, unknown>;
  theme?: "light" | "dark" | "system";
  /** Free-form metadata */
  meta?: Record<string, unknown>;
}

export const dashboards = pgTable(
  "dashboards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Slug unique within an org — "overview", "brand-123-monitor", etc. */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Current head version id — points into dashboard_versions */
    headVersionId: text("head_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("dashboards_org_slug_idx").on(t.organizationId, t.slug),
  ],
);

export const dashboardVersions = pgTable(
  "dashboard_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    dashboardId: text("dashboard_id")
      .notNull()
      .references(() => dashboards.id, { onDelete: "cascade" }),
    /** Monotonically increasing within a dashboard — 1, 2, 3, ... */
    versionNumber: integer("version_number").notNull(),
    /** Snapshotted config at this version */
    config: jsonb("config").$type<DashboardConfig>().notNull(),
    /** Who made this edit */
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Optional user-supplied message, e.g. "Added SoV widget" */
    message: text("message"),
    /**
     * When non-null, this version was produced by rolling back to
     * this prior version id. Preserves provenance.
     */
    rolledBackFromId: text("rolled_back_from_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("dashboard_versions_dashboard_number_idx").on(
      t.dashboardId,
      t.versionNumber,
    ),
    index("dashboard_versions_dashboard_created_idx").on(
      t.dashboardId,
      t.createdAt.desc(),
    ),
  ],
);

export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [dashboards.organizationId],
    references: [organizations.id],
  }),
  versions: many(dashboardVersions),
}));

export const dashboardVersionsRelations = relations(
  dashboardVersions,
  ({ one }) => ({
    dashboard: one(dashboards, {
      fields: [dashboardVersions.dashboardId],
      references: [dashboards.id],
    }),
    author: one(users, {
      fields: [dashboardVersions.authorId],
      references: [users.id],
    }),
  }),
);

export type Dashboard = typeof dashboards.$inferSelect;
export type NewDashboard = typeof dashboards.$inferInsert;
export type DashboardVersion = typeof dashboardVersions.$inferSelect;
export type NewDashboardVersion = typeof dashboardVersions.$inferInsert;
