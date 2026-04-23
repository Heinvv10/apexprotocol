/**
 * Social Browser Auth Schema
 *
 * Per-brand encrypted credentials and audit log for browser-automation
 * posting to social platforms (X, LinkedIn, Reddit, etc.). This sits
 * alongside the existing OAuth-token tables in social.ts — those are for
 * platforms with free APIs; this one is for platforms where we use a
 * logged-in browser session instead.
 *
 * Reuses src/lib/encryption.ts for the encrypted-field shape.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { socialPlatformEnum } from "./social";
import type { EncryptedData } from "@/lib/encryption";

// ============================================================================
// Enums
// ============================================================================

export const socialBrowserCredentialStatusEnum = pgEnum(
  "social_browser_credential_status",
  ["active", "flagged", "disabled"],
);

export const socialBrowserActionTypeEnum = pgEnum(
  "social_browser_action_type",
  [
    "login",
    "session_restore",
    "post",
    "thread",
    "reply",
    "quote",
    "comment",
    "navigate",
    "screenshot",
    "logout",
  ],
);

export const socialBrowserActionStatusEnum = pgEnum(
  "social_browser_action_status",
  ["success", "failure", "aborted"],
);

// ============================================================================
// Credentials
// ============================================================================

export const socialBrowserCredentials = pgTable(
  "social_browser_credentials",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id").notNull(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    platform: socialPlatformEnum("platform").notNull(),
    username: text("username").notNull(),
    profileUrl: text("profile_url"),

    passwordEncrypted: jsonb("password_encrypted")
      .$type<EncryptedData>()
      .notNull(),
    totpSecretEncrypted: jsonb("totp_secret_encrypted").$type<EncryptedData>(),
    sessionStateEncrypted: jsonb(
      "session_state_encrypted",
    ).$type<EncryptedData>(),
    sessionExpiresAt: timestamp("session_expires_at", { withTimezone: true }),

    userAgent: text("user_agent").notNull(),
    viewportWidth: integer("viewport_width").notNull().default(1366),
    viewportHeight: integer("viewport_height").notNull().default(768),

    status: socialBrowserCredentialStatusEnum("status")
      .notNull()
      .default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    lastError: text("last_error"),
    lastErrorAt: timestamp("last_error_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueBrandPlatformUser: unique().on(
      table.brandId,
      table.platform,
      table.username,
    ),
  }),
);

// ============================================================================
// Action Audit Log
// ============================================================================

export const socialBrowserActions = pgTable("social_browser_actions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  credentialId: text("credential_id")
    .notNull()
    .references(() => socialBrowserCredentials.id, { onDelete: "cascade" }),

  actionType: socialBrowserActionTypeEnum("action_type").notNull(),
  targetUrl: text("target_url"),
  status: socialBrowserActionStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  screenshotRef: text("screenshot_ref"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================================
// Relations
// ============================================================================

export const socialBrowserCredentialsRelations = relations(
  socialBrowserCredentials,
  ({ one, many }) => ({
    brand: one(brands, {
      fields: [socialBrowserCredentials.brandId],
      references: [brands.id],
    }),
    actions: many(socialBrowserActions),
  }),
);

export const socialBrowserActionsRelations = relations(
  socialBrowserActions,
  ({ one }) => ({
    credential: one(socialBrowserCredentials, {
      fields: [socialBrowserActions.credentialId],
      references: [socialBrowserCredentials.id],
    }),
  }),
);

// ============================================================================
// Type Exports
// ============================================================================

export type SocialBrowserCredential =
  typeof socialBrowserCredentials.$inferSelect;
export type NewSocialBrowserCredential =
  typeof socialBrowserCredentials.$inferInsert;
export type SocialBrowserAction = typeof socialBrowserActions.$inferSelect;
export type NewSocialBrowserAction = typeof socialBrowserActions.$inferInsert;
