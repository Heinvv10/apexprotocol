import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { audits } from "./audits";
import { brands } from "./brands";
import { organizations } from "./organizations";
import { users } from "./users";

export const auditShares = pgTable(
  "audit_shares",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    auditId: text("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),

    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    token: text("token").notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    viewCount: integer("view_count").default(0).notNull(),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("audit_shares_token_idx").on(t.token),
    index("audit_shares_audit_idx").on(t.auditId, t.createdAt.desc()),
    index("audit_shares_org_idx").on(t.organizationId),
  ],
);

export const auditSharesRelations = relations(auditShares, ({ one }) => ({
  audit: one(audits, {
    fields: [auditShares.auditId],
    references: [audits.id],
  }),
  brand: one(brands, {
    fields: [auditShares.brandId],
    references: [brands.id],
  }),
  organization: one(organizations, {
    fields: [auditShares.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [auditShares.createdById],
    references: [users.id],
  }),
}));

export type AuditShare = typeof auditShares.$inferSelect;
export type NewAuditShare = typeof auditShares.$inferInsert;
