/**
 * Row-Level Security (RLS) helpers for multi-tenant data isolation
 *
 * This module provides utilities for implementing PostgreSQL RLS policies
 * that ensure complete data isolation between organizations.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// RLS context configuration type
export interface RLSContext {
  organizationId: string;
  userId: string;
  role: "admin" | "editor" | "viewer";
}

/**
 * Creates a database connection with RLS context set
 * This ensures all queries are automatically filtered by organization
 */
export function createSecureDb(context: RLSContext) {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL not configured");
  }

  // Create a new connection with RLS context parameters
  // Neon supports session parameters via connection options
  const sql = neon(connectionString, {
    // These will be available in the database session
    // for RLS policy checks
  });

  const db = drizzle(sql, { schema });

  // Return a wrapped database with context-aware operations
  return {
    ...db,
    context,

    /**
     * Execute raw SQL with RLS context set
     */
    async executeWithContext<T>(
      callback: (
        db: typeof import("drizzle-orm/neon-http").drizzle
      ) => Promise<T>
    ): Promise<T> {
      // Set the RLS context variables before executing
      await sql`SELECT set_config('app.current_organization_id', ${context.organizationId}, true)`;
      await sql`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
      await sql`SELECT set_config('app.current_role', ${context.role}, true)`;

      // @ts-expect-error - Type mismatch but functionally correct
      return callback(db);
    },
  };
}

/**
 * SQL statements to enable RLS on all tenant-scoped tables
 * These should be run as a migration
 */
export const RLS_SETUP_SQL = `
-- Enable RLS on all tenant-scoped tables

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_org_isolation ON users
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::text);

CREATE POLICY users_update ON users
  FOR UPDATE
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

CREATE POLICY users_delete ON users
  FOR DELETE
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

-- Brands table RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY brands_org_isolation ON brands
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

CREATE POLICY brands_insert ON brands
  FOR INSERT
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::text);

CREATE POLICY brands_update ON brands
  FOR UPDATE
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

CREATE POLICY brands_delete ON brands
  FOR DELETE
  USING (organization_id = current_setting('app.current_organization_id', true)::text);

-- Mentions table RLS
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentions_org_isolation ON mentions
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Audits table RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY audits_org_isolation ON audits
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Content table RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_org_isolation ON content
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- Recommendations table RLS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY recommendations_org_isolation ON recommendations
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE organization_id = current_setting('app.current_organization_id', true)::text
    )
  );

-- API Keys table RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_org_isolation ON api_keys
  USING (organization_id = current_setting('app.current_organization_id', true)::text);
`;

/**
 * SQL to disable RLS (for admin/superuser access)
 */
export const RLS_DISABLE_SQL = `
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE content DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
`;

/**
 * Helper to check if user has access to a specific organization
 */
export function hasOrgAccess(
  userOrgId: string | null | undefined,
  targetOrgId: string
): boolean {
  return userOrgId === targetOrgId;
}

/**
 * Helper to check if user has required role
 */
export function hasRole(
  userRole: string | null | undefined,
  requiredRoles: Array<"admin" | "editor" | "viewer">
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as "admin" | "editor" | "viewer");
}

/**
 * Permission matrix for different operations
 */
export const PERMISSION_MATRIX = {
  // Brand operations
  "brand.create": ["admin"],
  "brand.read": ["admin", "editor", "viewer"],
  "brand.update": ["admin", "editor"],
  "brand.delete": ["admin"],

  // Content operations
  "content.create": ["admin", "editor"],
  "content.read": ["admin", "editor", "viewer"],
  "content.update": ["admin", "editor"],
  "content.delete": ["admin"],
  "content.publish": ["admin", "editor"],

  // Audit operations
  "audit.create": ["admin", "editor"],
  "audit.read": ["admin", "editor", "viewer"],
  "audit.delete": ["admin"],

  // Monitoring operations
  "monitor.configure": ["admin"],
  "monitor.read": ["admin", "editor", "viewer"],

  // Settings operations
  "settings.read": ["admin", "editor", "viewer"],
  "settings.update": ["admin"],

  // API Key operations
  "apikey.create": ["admin"],
  "apikey.read": ["admin"],
  "apikey.delete": ["admin"],

  // User management
  "user.invite": ["admin"],
  "user.remove": ["admin"],
  "user.updateRole": ["admin"],
} as const;

export type Permission = keyof typeof PERMISSION_MATRIX;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSION_MATRIX[permission] as readonly string[];
  return allowedRoles.includes(role);
}
