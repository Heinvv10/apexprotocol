import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

// Role enum
export const roleEnum = pgEnum("role", ["admin", "editor", "viewer"]);

// Users table
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  clerkUserId: text("clerk_user_id").unique(),
  authUserId: text("auth_user_id").unique(),
  organizationId: text("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Profile
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").default("viewer").notNull(),

  // Preferences
  preferences: jsonb("preferences").$type<UserPreferences>().default({
    theme: "dark",
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    mentionAlerts: true,
    auditAlerts: true,
  }),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),

  // Super Admin (system-wide access)
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  superAdminGrantedAt: timestamp("super_admin_granted_at", { withTimezone: true }),
  superAdminGrantedBy: text("super_admin_granted_by"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// User preferences type
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  mentionAlerts: boolean;
  auditAlerts: boolean;
  // Connectivity settings (South Africa specific)
  loadsheddingMode?: boolean;
  lowBandwidthMode?: boolean;
  autoDetectConnection?: boolean;
}

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
