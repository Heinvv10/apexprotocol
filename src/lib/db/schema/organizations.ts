import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Plan enum
export const planEnum = pgEnum("plan", ["starter", "professional", "enterprise"]);

// Subscription status enum
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "trialing",
  "none",
]);

// Organizations table
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  clerkOrgId: text("clerk_org_id").unique(),

  // Subscription Plan
  plan: planEnum("plan").default("starter").notNull(),
  brandLimit: integer("brand_limit").default(1).notNull(),
  userLimit: integer("user_limit").default(3).notNull(),

  // PayFast Subscription
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("none").notNull(),
  payfastToken: text("payfast_token"),
  payfastPaymentId: text("payfast_payment_id"),
  subscriptionStartedAt: timestamp("subscription_started_at", { withTimezone: true }),
  subscriptionEndsAt: timestamp("subscription_ends_at", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),

  // White-label branding settings
  branding: jsonb("branding").$type<BrandingSettings>().default({
    themeId: "apexgeo-default",
    primaryColor: "#00E5CC",
    accentColor: "#8B5CF6",
    logoUrl: null,
    logoDarkUrl: null,
    faviconUrl: null,
    appName: null,
    tagline: null,
    customDomain: null,
    supportEmail: null,
    showPoweredBy: true,
    customFooterText: null,
  }),

  // Feature flags
  features: jsonb("features").$type<string[]>().default([]),

  // Settings
  settings: jsonb("settings").$type<OrganizationSettings>().default({
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    defaultLanguage: "en",
  }),

  // Onboarding progress tracking
  onboardingStatus: jsonb("onboarding_status").$type<OnboardingStatus>().default({
    brandAdded: false,
    monitoringConfigured: false,
    auditRun: false,
    recommendationsReviewed: false,
    completedAt: null,
    dismissedAt: null,
  }),

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Types for JSONB columns
export interface BrandingSettings {
  // Theme preset ID (apexgeo-default, apexgeo-copper, apexgeo-midnight, custom)
  themeId: string;
  
  // Custom color overrides (used when themeId is 'custom' or to override preset)
  primaryColor: string;
  accentColor: string;
  
  // Logo and favicon
  logoUrl: string | null;
  logoDarkUrl: string | null;  // Logo for dark backgrounds
  faviconUrl: string | null;
  
  // White-label branding
  appName: string | null;       // Override "ApexGEO" name
  tagline: string | null;       // Custom tagline
  customDomain: string | null;  // e.g., "geo.clientdomain.com"
  supportEmail: string | null;  // White-label support email
  
  // Footer customization
  showPoweredBy: boolean;       // Show "Powered by ApexGEO"
  customFooterText: string | null;
}

export interface OrganizationSettings {
  timezone: string;
  dateFormat: string;
  defaultLanguage: string;
}

// Onboarding status tracking
export interface OnboardingStatus {
  brandAdded: boolean;
  monitoringConfigured: boolean;
  auditRun: boolean;
  recommendationsReviewed: boolean;
  completedAt: string | null;
  dismissedAt: string | null;
}

// Relations are defined in users.ts and brands.ts to avoid circular imports
// The inverse relations (organization -> users, organization -> brands) are handled
// by Drizzle automatically when you query with { with: { organization: true } }
//
// Note: To query all users or brands for an organization, use:
// - db.query.users.findMany({ where: eq(users.organizationId, orgId) })
// - db.query.brands.findMany({ where: eq(brands.organizationId, orgId) })
//
// If inverse relations are needed for eager loading, create a separate relations file:
// src/lib/db/relations.ts that imports all tables and defines cross-table relations
export const organizationsRelations = relations(organizations, () => ({}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
