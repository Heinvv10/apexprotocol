import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";
import { users } from "./users";

// API key type enum - includes 'user' for user-generated API keys
export const apiKeyTypeEnum = pgEnum("api_key_type", [
  "anthropic",
  "openai",
  "gemini",
  "serper",
  "pinecone",
  "custom",
  "user", // For user-generated API keys for programmatic access
]);

// API key scopes type for future permission support
export interface ApiKeyScopes {
  read?: boolean;
  write?: boolean;
  admin?: boolean;
  endpoints?: string[]; // Specific endpoints allowed (e.g., ["/api/brands/*", "/api/audits/*"])
}

// API keys table - for storing encrypted service API keys and user-generated API keys
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // User association (null for external service keys, set for user-generated keys)
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),

    // Key info
    name: text("name").notNull(), // Internal identifier for the key
    displayName: text("display_name"), // User-friendly name for display in UI
    type: apiKeyTypeEnum("type").notNull(),

    // Encrypted key value (using application-level encryption)
    // Stored as JSON: {ciphertext, iv, authTag}
    encryptedKey: text("encrypted_key").notNull(),
    keyHash: text("key_hash").notNull(), // SHA-256 hash for lookup without decryption

    // Key rotation support
    version: integer("version").default(1).notNull(), // Incremented on each rotation
    lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),

    // Scopes for future permission support (nullable)
    scopes: jsonb("scopes").$type<ApiKeyScopes>(),

    // Metadata
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Status
    isActive: boolean("is_active").default(true).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Index for fast lookup by key hash (primary authentication path)
    index("api_keys_key_hash_idx").on(table.keyHash),
    // Index for organization-based queries
    index("api_keys_organization_id_idx").on(table.organizationId),
    // Index for user-based queries (user's API keys)
    index("api_keys_user_id_idx").on(table.userId),
    // Composite index for active keys by type within an organization
    index("api_keys_org_type_active_idx").on(
      table.organizationId,
      table.type,
      table.isActive
    ),
  ]
);

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Type exports
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
