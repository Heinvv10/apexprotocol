/**
 * Social Engagement Schema — drafts + autonomy controls for the hybrid
 * autonomy model.
 *
 * Flow:
 *   1. A scanner (e.g. TwitterScanner or Reddit mention scraper) finds a
 *      mention worth replying to.
 *   2. `generateReplyDraft` writes a draft and inserts a row here with
 *      status='pending'.
 *   3. If the brand's credential has engagement_autonomy_mode='autonomous',
 *      the dispatcher picks it up immediately, routes to the platform
 *      composer, and transitions status='posted' (or 'failed').
 *   4. If the brand's mode is 'drafted' (default), the draft waits for a
 *      human to approve → status='approved' → dispatcher picks it up.
 *   5. Mode 'off' disables engagement entirely — drafts are not generated.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { brands } from "./brands";
import { socialPlatformEnum } from "./social";
import { socialBrowserCredentials } from "./social-browser-auth";

// ============================================================================
// Enums
// ============================================================================

export const engagementAutonomyModeEnum = pgEnum(
  "engagement_autonomy_mode",
  ["drafted", "autonomous", "off"],
);

export const engagementDraftStatusEnum = pgEnum("engagement_draft_status", [
  "pending", // awaiting review or autonomous pickup
  "approved", // human approved; ready for dispatch
  "rejected", // human rejected; terminal
  "posted", // dispatched successfully; terminal
  "failed", // dispatch threw; terminal (see errorMessage)
]);

export const engagementKindEnum = pgEnum("engagement_kind", [
  "reply", // reply to a post / comment
  "comment", // comment on a thread (Reddit)
  "answer", // answer (Quora)
  "quote", // quote-repost with commentary
]);

// ============================================================================
// Per-brand-per-platform autonomy settings
// ============================================================================

export const socialEngagementSettings = pgTable(
  "social_engagement_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),

    autonomyMode: engagementAutonomyModeEnum("autonomy_mode")
      .notNull()
      .default("drafted"),

    // Hard daily cap for autonomous engagement (additional to the
    // foundation quota enforcer). Null = platform default.
    autonomousDailyCap: text("autonomous_daily_cap"),

    // Subreddit / feed / topic allow-list for engagement. If null, any
    // scanner-surfaced mention is eligible. JSONB of string[].
    topicAllowlist: jsonb("topic_allowlist").$type<string[] | null>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byBrandPlatform: index("ses_brand_platform_idx").on(
      t.brandId,
      t.platform,
    ),
  }),
);

// ============================================================================
// Draft queue
// ============================================================================

export const socialEngagementDrafts = pgTable(
  "social_engagement_drafts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    credentialId: text("credential_id")
      .notNull()
      .references(() => socialBrowserCredentials.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),

    kind: engagementKindEnum("kind").notNull(),
    targetUrl: text("target_url").notNull(),
    // Opaque id from the source scanner (e.g. socialMentions.id for a
    // Twitter mention, reddit permalink id, etc.). Helps dedupe.
    sourceRef: text("source_ref"),

    draftText: text("draft_text").notNull(),
    // Optional author notes / prompt that shaped the draft.
    generationContext: jsonb("generation_context")
      .$type<Record<string, unknown>>()
      .default({}),

    status: engagementDraftStatusEnum("status").notNull().default("pending"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postUrl: text("post_url"),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byBrandStatus: index("sed_brand_status_idx").on(t.brandId, t.status),
    byCredentialStatus: index("sed_credential_status_idx").on(
      t.credentialId,
      t.status,
    ),
    bySourceRef: index("sed_source_ref_idx").on(t.platform, t.sourceRef),
  }),
);

// ============================================================================
// Relations
// ============================================================================

export const socialEngagementSettingsRelations = relations(
  socialEngagementSettings,
  ({ one }) => ({
    brand: one(brands, {
      fields: [socialEngagementSettings.brandId],
      references: [brands.id],
    }),
  }),
);

export const socialEngagementDraftsRelations = relations(
  socialEngagementDrafts,
  ({ one }) => ({
    brand: one(brands, {
      fields: [socialEngagementDrafts.brandId],
      references: [brands.id],
    }),
    credential: one(socialBrowserCredentials, {
      fields: [socialEngagementDrafts.credentialId],
      references: [socialBrowserCredentials.id],
    }),
  }),
);

// ============================================================================
// Type Exports
// ============================================================================

export type SocialEngagementSettings =
  typeof socialEngagementSettings.$inferSelect;
export type NewSocialEngagementSettings =
  typeof socialEngagementSettings.$inferInsert;
export type SocialEngagementDraft =
  typeof socialEngagementDrafts.$inferSelect;
export type NewSocialEngagementDraft =
  typeof socialEngagementDrafts.$inferInsert;
