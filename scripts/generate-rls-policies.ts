/**
 * Generate Supabase RLS policies for every tenant-scoped table.
 *
 * Part of Sprint 0 migration (TR-MIG-004).
 * See: docs/infra/supabase-migration-runbook.md §4.
 *
 * Introspects the live Postgres schema (not Drizzle source) so this stays
 * accurate as schema evolves. Categorises tables as:
 *
 *   DIRECT    — has organization_id column      → policy on organization_id = jwt.org_id
 *   VIA_BRAND — has brand_id column only        → policy joins brands.organization_id = jwt.org_id
 *   VIA_USER  — has user_id column only         → policy on user_id = auth.uid()
 *   SHARED    — no tenant column (enums, refs)  → no RLS, documented in output
 *   MANUAL    — ambiguous (both brand_id and user_id, or unusual) → flagged for human review
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/generate-rls-policies.ts \
 *     [--output=drizzle/0010_supabase_rls.sql] \
 *     [--schema=public] \
 *     [--dry-run]
 *
 * Writes SQL with idempotent DROP POLICY IF EXISTS + CREATE POLICY pairs.
 * The output is intended to be committed and applied via Drizzle migrations.
 */

import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL required.");
  process.exit(1);
}

const args = process.argv.slice(2);
const outputArg = args.find((a) => a.startsWith("--output="));
const outputPath = resolve(
  outputArg?.split("=")[1] ?? "drizzle/0010_supabase_rls.sql"
);
const schemaArg = args.find((a) => a.startsWith("--schema="));
const SCHEMA = schemaArg?.split("=")[1] ?? "public";
const dryRun = args.includes("--dry-run");

// Tables we explicitly skip (Supabase-managed, migration artefacts, truly public).
const SKIP_TABLES = new Set([
  "clerk_to_supabase_migration", // our own migration mapping
  "schema_migrations",
  "drizzle_migrations",
  "__drizzle_migrations",
]);

// Tables that are shared/reference data — intentionally no tenant scoping.
// Keep this small and auditable. Anything outside DIRECT/VIA_BRAND/VIA_USER
// that isn't in this set gets flagged as MANUAL and REQUIRES human review.
const SHARED_READ_ONLY = new Set([
  "ai_platforms",
  "platform_registry",
  "industry_categories",
  "benchmark_brands",
  "countries",
  "currencies",
]);

type ColInfo = { column_name: string; data_type: string; is_nullable: string };
type Category = "DIRECT" | "VIA_BRAND" | "VIA_USER" | "SHARED" | "MANUAL";
type TableReport = {
  table: string;
  category: Category;
  columns: string[];
  reason: string;
};

const pool = new Pool({ connectionString: DATABASE_URL });

async function getTables(): Promise<string[]> {
  const res = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = $1
     ORDER BY tablename`,
    [SCHEMA]
  );
  return res.rows
    .map((r) => r.tablename)
    .filter((t) => !SKIP_TABLES.has(t));
}

async function getColumns(table: string): Promise<ColInfo[]> {
  const res = await pool.query<ColInfo>(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [SCHEMA, table]
  );
  return res.rows;
}

function categorise(
  table: string,
  columnNames: string[]
): { category: Category; reason: string } {
  const hasOrg = columnNames.includes("organization_id");
  const hasBrand = columnNames.includes("brand_id");
  const hasUser = columnNames.includes("user_id");

  if (SHARED_READ_ONLY.has(table)) {
    return { category: "SHARED", reason: "explicit SHARED_READ_ONLY list" };
  }

  if (hasOrg) return { category: "DIRECT", reason: "has organization_id" };
  if (hasBrand && !hasUser) return { category: "VIA_BRAND", reason: "has brand_id only" };
  if (hasUser && !hasBrand) return { category: "VIA_USER", reason: "has user_id only" };

  if (hasBrand && hasUser) {
    return {
      category: "MANUAL",
      reason: "has BOTH brand_id and user_id — pick your scoping or split table",
    };
  }

  return {
    category: "MANUAL",
    reason: "no tenant column (organization_id / brand_id / user_id) — either add to SHARED_READ_ONLY list or add a tenant column",
  };
}

function policySQL(table: string, category: Category): string {
  const q = `"${SCHEMA}"."${table}"`;
  const header = `-- ${table} → ${category}`;

  switch (category) {
    case "DIRECT":
      return `${header}
ALTER TABLE ${q} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${q} FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ${table}_tenant_select ON ${q};
CREATE POLICY ${table}_tenant_select ON ${q}
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR organization_id = (auth.jwt() ->> 'org_id')
  );

DROP POLICY IF EXISTS ${table}_tenant_modify ON ${q};
CREATE POLICY ${table}_tenant_modify ON ${q}
  FOR ALL USING (
    auth.role() = 'service_role'
    OR organization_id = (auth.jwt() ->> 'org_id')
  ) WITH CHECK (
    auth.role() = 'service_role'
    OR organization_id = (auth.jwt() ->> 'org_id')
  );
`;

    case "VIA_BRAND":
      return `${header}
ALTER TABLE ${q} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${q} FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ${table}_tenant_select ON ${q};
CREATE POLICY ${table}_tenant_select ON ${q}
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR brand_id IN (
      SELECT id FROM "${SCHEMA}"."brands"
      WHERE organization_id = (auth.jwt() ->> 'org_id')
    )
  );

DROP POLICY IF EXISTS ${table}_tenant_modify ON ${q};
CREATE POLICY ${table}_tenant_modify ON ${q}
  FOR ALL USING (
    auth.role() = 'service_role'
    OR brand_id IN (
      SELECT id FROM "${SCHEMA}"."brands"
      WHERE organization_id = (auth.jwt() ->> 'org_id')
    )
  ) WITH CHECK (
    auth.role() = 'service_role'
    OR brand_id IN (
      SELECT id FROM "${SCHEMA}"."brands"
      WHERE organization_id = (auth.jwt() ->> 'org_id')
    )
  );
`;

    case "VIA_USER":
      return `${header}
ALTER TABLE ${q} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${q} FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ${table}_user_select ON ${q};
CREATE POLICY ${table}_user_select ON ${q}
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()::text
  );

DROP POLICY IF EXISTS ${table}_user_modify ON ${q};
CREATE POLICY ${table}_user_modify ON ${q}
  FOR ALL USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    auth.role() = 'service_role'
    OR user_id = auth.uid()::text
  );
`;

    case "SHARED":
      return `${header}
-- SHARED reference table — no RLS. Readable by all authenticated users.
ALTER TABLE ${q} ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ${table}_read_all ON ${q};
CREATE POLICY ${table}_read_all ON ${q}
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

-- Only service_role can modify
DROP POLICY IF EXISTS ${table}_admin_modify ON ${q};
CREATE POLICY ${table}_admin_modify ON ${q}
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
`;

    case "MANUAL":
      return `${header}
-- ⚠  MANUAL REVIEW REQUIRED — no policy auto-generated.
-- Add this table to SHARED_READ_ONLY in the generator, or give it a tenant column.
-- DO NOT leave unprotected in production.
`;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Generate Supabase RLS policies");
  console.log("=".repeat(60));
  console.log(`Schema:   ${SCHEMA}`);
  console.log(`Output:   ${outputPath}`);
  console.log(`Dry-run:  ${dryRun}`);
  console.log("");

  const tables = await getTables();
  console.log(`Discovered ${tables.length} tables in schema "${SCHEMA}".`);
  console.log("");

  const reports: TableReport[] = [];
  for (const t of tables) {
    const cols = await getColumns(t);
    const colNames = cols.map((c) => c.column_name);
    const { category, reason } = categorise(t, colNames);
    reports.push({ table: t, category, columns: colNames, reason });
  }

  const by: Record<Category, TableReport[]> = {
    DIRECT: [],
    VIA_BRAND: [],
    VIA_USER: [],
    SHARED: [],
    MANUAL: [],
  };
  for (const r of reports) by[r.category].push(r);

  console.log(
    `  DIRECT:     ${by.DIRECT.length.toString().padStart(4)}  (organization_id)`
  );
  console.log(
    `  VIA_BRAND:  ${by.VIA_BRAND.length.toString().padStart(4)}  (brand_id → brands.organization_id)`
  );
  console.log(
    `  VIA_USER:   ${by.VIA_USER.length.toString().padStart(4)}  (user_id = auth.uid())`
  );
  console.log(
    `  SHARED:     ${by.SHARED.length.toString().padStart(4)}  (reference data)`
  );
  console.log(
    `  MANUAL:     ${by.MANUAL.length.toString().padStart(4)}  ${by.MANUAL.length ? "⚠  NEEDS HUMAN REVIEW" : ""}`
  );
  console.log("");

  if (by.MANUAL.length > 0) {
    console.log("Tables needing manual review:");
    for (const r of by.MANUAL) {
      console.log(`  • ${r.table}: ${r.reason}`);
    }
    console.log("");
  }

  const header = `-- Auto-generated by scripts/generate-rls-policies.ts
-- Generated: ${new Date().toISOString()}
-- Schema:    ${SCHEMA}
--
-- This migration replaces the app-layer RLS pattern
-- (current_setting('app.current_organization_id'))
-- with Supabase's native auth.jwt() pattern.
--
-- It is idempotent: every policy is wrapped in DROP IF EXISTS + CREATE.
-- Safe to re-run.
--
-- Negative-test fixture:
--   SET LOCAL request.jwt.claims TO '{"role":"authenticated","sub":"UUID","org_id":"org-a"}';
--   SELECT COUNT(*) FROM brands;                   -- only org-a rows
--   SET LOCAL request.jwt.claims TO '{"role":"authenticated","sub":"UUID","org_id":"org-b"}';
--   SELECT COUNT(*) FROM brands;                   -- only org-b rows
--   RESET request.jwt.claims;
--
-- Categories in this file:
--   DIRECT    — organization_id column
--   VIA_BRAND — brand_id → brands.organization_id
--   VIA_USER  — user_id = auth.uid()
--   SHARED    — read-all reference data, service_role modifies
--   MANUAL    — flagged for human review (no auto-policy)
`;

  const sections: string[] = [header];
  const order: Category[] = ["DIRECT", "VIA_BRAND", "VIA_USER", "SHARED", "MANUAL"];
  for (const cat of order) {
    if (by[cat].length === 0) continue;
    sections.push(
      `\n-- ${"=".repeat(70)}\n-- ${cat} (${by[cat].length})\n-- ${"=".repeat(70)}\n`
    );
    for (const r of by[cat]) {
      sections.push(policySQL(r.table, r.category));
    }
  }

  const out = sections.join("\n");

  if (dryRun) {
    console.log("DRY RUN — first 60 lines of output:");
    console.log(out.split("\n").slice(0, 60).join("\n"));
    console.log("…");
  } else {
    writeFileSync(outputPath, out);
    console.log(`✓ Written ${out.split("\n").length} lines to ${outputPath}`);
    console.log("");
    console.log("Next step:");
    console.log(`  1. Review ${outputPath} — especially MANUAL entries`);
    console.log("  2. Add the custom JWT hook (see runbook §4.2)");
    console.log("  3. Apply:  npx drizzle-kit push  (or psql <file)");
    console.log("  4. Run negative-path test (see file header)");
  }

  await pool.end();
  process.exit(by.MANUAL.length > 0 && !dryRun ? 2 : 0);
}

main().catch(async (err) => {
  console.error("");
  console.error("✗ Generator failed:", err.message);
  console.error(err.stack);
  await pool.end().catch(() => {});
  process.exit(1);
});
