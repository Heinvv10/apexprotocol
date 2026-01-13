import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// System setting types
export const systemSettingTypeEnum = pgEnum("system_setting_type", [
  "api_key",
  "feature_flag",
  "configuration",
  "limit",
]);

// System setting categories for API keys
export const apiKeyProviderEnum = pgEnum("api_key_provider", [
  "openai",
  "anthropic",
  "gemini",
  "serper",
  "pinecone",
]);

// System settings table - for global/universal settings
export const systemSettings = pgTable("system_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Setting identification
  key: text("key").notNull().unique(), // e.g., "universal_api_key_openai"
  type: systemSettingTypeEnum("type").notNull(),
  category: text("category"), // e.g., "api_keys", "features", "limits"

  // Setting value (stored as JSON for flexibility)
  // For API keys: {encryptedKey: string, iv: string, authTag: string}
  value: jsonb("value").notNull(),

  // Metadata
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),

  // Last modified by (user ID)
  lastModifiedBy: text("last_modified_by"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
