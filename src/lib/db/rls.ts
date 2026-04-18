/**
 * Row-Level Security (RLS) helpers for multi-tenant data isolation.
 *
 * Uses the shared pg pool + Drizzle transactions so RLS context is
 * properly scoped to the queries that need it: each transaction is a
 * single Postgres client connection, so set_config(..., true) — i.e.
 * SET LOCAL — applies for the duration of that transaction and resets
 * automatically on commit.
 */

import { sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { getDb } from "./index";
import * as schema from "./schema";

// RLS context configuration type
export interface RLSContext {
  organizationId: string;
  userId: string;
  role: "admin" | "editor" | "viewer";
}

type Tx = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Creates a "secure DB" handle bound to a tenant context. The actual
 * RLS settings are applied per-call via executeWithContext, which wraps
 * the caller's queries in a transaction with set_config(..., is_local=true).
 * That is the only correct way to make session vars stick across multiple
 * statements on a pooled pg.Client.
 */
export function createSecureDb(context: RLSContext) {
  const db: NodePgDatabase<typeof schema> = getDb();

  return {
    db,
    context,

    /**
     * Run `callback` inside a transaction with the RLS context applied.
     * The `tx` parameter exposes the same drizzle query API
     * (select/insert/update/delete/execute). All queries inside `callback`
     * see the set_config values; queries on `db` outside this method do not.
     */
    async executeWithContext<T>(callback: (tx: Tx) => Promise<T>): Promise<T> {
      return db.transaction(async (tx) => {
        await tx.execute(sql`
          SELECT
            set_config('app.current_organization_id', ${context.organizationId}, true),
            set_config('app.current_user_id', ${context.userId}, true),
            set_config('app.current_role', ${context.role}, true)
        `);
        return callback(tx);
      });
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
