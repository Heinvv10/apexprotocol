import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

// Integration category enum
export const integrationCategoryEnum = pgEnum("integration_category", [
  "ai_models",
  "search_apis",
  "analytics",
]);

// Integration status enum
export const integrationStatusEnum = pgEnum("integration_status", [
  "configured",
  "not_configured",
  "disabled",
  "error",
]);

// API integrations table - for system-wide API configurations
export const apiIntegrations = pgTable("api_integrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Service info
  serviceName: text("service_name").notNull(),
  provider: text("provider").notNull(),
  description: text("description"),
  category: integrationCategoryEnum("category").notNull(),

  // Status
  status: integrationStatusEnum("status").notNull().default("not_configured"),
  isEnabled: boolean("is_enabled").default(true).notNull(),

  // Configuration (encrypted)
  config: jsonb("config").notNull().$type<{
    apiKey?: string;
    endpoint?: string;
    model?: string;
    maxTokens?: number;
    [key: string]: any;
  }>(),

  // Verification
  lastVerified: timestamp("last_verified", { withTimezone: true }),
  lastError: text("last_error"),

  // Usage tracking
  usageThisMonth: integer("usage_this_month").default(0),
  quotaRemaining: integer("quota_remaining"),
  rateLimit: text("rate_limit"),

  // Audit fields
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
});

// Type exports
export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type NewApiIntegration = typeof apiIntegrations.$inferInsert;
