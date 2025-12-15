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

// Organizations table
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  clerkOrgId: text("clerk_org_id").unique(),

  // Subscription
  plan: planEnum("plan").default("starter").notNull(),
  brandLimit: integer("brand_limit").default(1).notNull(),
  userLimit: integer("user_limit").default(3).notNull(),

  // White-label branding settings
  branding: jsonb("branding").$type<BrandingSettings>().default({
    primaryColor: "#4926FA",
    accentColor: "#D82F71",
    logoUrl: null,
    faviconUrl: null,
    appName: null,
    customDomain: null,
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
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  appName: string | null;
  customDomain: string | null;
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

// Relations will be defined after all tables are created
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(organizations), // Placeholder - will be updated with actual users table
  brands: many(organizations), // Placeholder - will be updated with actual brands table
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
