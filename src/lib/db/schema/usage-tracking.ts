/**
 * Usage Tracking Schema (F176)
 * Tables for API calls and storage tracking
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

/**
 * API Call Tracking
 * Tracks all API calls for billing and usage analytics
 */
export const apiCallTracking = pgTable("api_call_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull(), // e.g., /api/monitor/scan
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, etc.
  statusCode: integer("status_code").notNull(), // 200, 404, etc.
  responseTime: integer("response_time"), // milliseconds
  userId: varchar("user_id", { length: 255 }), // Clerk user ID
  metadata: jsonb("metadata").$type<{
    userAgent?: string;
    ip?: string;
    referer?: string;
    [key: string]: unknown;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Storage Tracking
 * Tracks storage usage by organization
 */
export const storageTracking = pgTable("storage_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }).notNull(), // e.g., 'audit_reports', 'content_pieces', 'mentions'
  resourceId: uuid("resource_id"), // ID of the resource (audit, content, etc.)
  sizeBytes: integer("size_bytes").notNull(), // Size in bytes
  storageLocation: varchar("storage_location", { length: 500 }), // S3 bucket, DB table, etc.
  metadata: jsonb("metadata").$type<{
    mimeType?: string;
    fileName?: string;
    [key: string]: unknown;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // For cleanup tracking
});

// Relations
export const apiCallTrackingRelations = relations(apiCallTracking, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiCallTracking.organizationId],
    references: [organizations.id],
  }),
}));

export const storageTrackingRelations = relations(storageTracking, ({ one }) => ({
  organization: one(storageTracking, {
    fields: [storageTracking.organizationId],
    references: [organizations.id],
  }),
}));

// Types
export type ApiCallTracking = typeof apiCallTracking.$inferSelect;
export type NewApiCallTracking = typeof apiCallTracking.$inferInsert;
export type StorageTracking = typeof storageTracking.$inferSelect;
export type NewStorageTracking = typeof storageTracking.$inferInsert;
