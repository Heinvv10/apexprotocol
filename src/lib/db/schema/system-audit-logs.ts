/**
 * System Audit Logs Schema
 * Tracks all admin actions, user activities, and system events for security and compliance
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

// Audit action type enum
export const auditActionTypeEnum = pgEnum("audit_action_type", [
  "create",
  "update",
  "delete",
  "access",
  "security",
  "system",
]);

// Audit status enum
export const auditStatusTypeEnum = pgEnum("audit_status_type", [
  "success",
  "failure",
  "warning",
]);

// System audit logs table
export const systemAuditLogs = pgTable("system_audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Actor (who performed the action)
  actorId: text("actor_id").references(() => users.id),
  actorName: text("actor_name"),
  actorEmail: text("actor_email"),
  actorRole: text("actor_role"), // super_admin, org_admin, user, system

  // Action details
  action: text("action").notNull(), // create, update, delete, access, security, system
  actionType: auditActionTypeEnum("action_type").notNull(),
  description: text("description").notNull(),

  // Target (what was affected)
  targetType: text("target_type"), // user, organization, brand, api_config, system_setting
  targetId: text("target_id"),
  targetName: text("target_name"),

  // Changes (for update actions)
  changes: jsonb("changes").$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
  }>(),

  // Request metadata
  metadata: jsonb("metadata").$type<{
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number; // milliseconds
  }>(),

  // Status
  status: auditStatusTypeEnum("status").notNull().default("success"),
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),

  // Integrity chain (for tamper detection)
  integrityHash: text("integrity_hash"), // SHA-256 hash of this log entry
  previousLogHash: text("previous_log_hash"), // Hash of previous log for chain verification

  // Timestamps
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type SystemAuditLog = typeof systemAuditLogs.$inferSelect;
export type NewSystemAuditLog = typeof systemAuditLogs.$inferInsert;
