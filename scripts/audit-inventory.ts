/**
 * E2E Audit Inventory — enumerate what real data exists in the DB so we
 * can plan the end-to-end browser test.
 *
 * Usage: npx tsx scripts/audit-inventory.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  organizations,
  brands,
  audits,
  brandMentions,
  recommendations,
  users,
  apiKeys,
} from "@/lib/db/schema";

async function main() {
  console.log("=== Organizations ===");
  const orgs = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .limit(10);
  for (const o of orgs) {
    console.log(`  ${o.id}  ${o.name}  (${o.slug ?? "no slug"})`);
  }
  console.log(`  total: ${orgs.length}`);

  console.log("\n=== Users (raw query — schema may vary) ===");
  const userRaw = await db.execute<Record<string, unknown>>(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' ORDER BY ordinal_position
  `);
  const userCols = (Array.isArray(userRaw)
    ? userRaw
    : ((userRaw as unknown as { rows?: unknown[] }).rows ?? [])) as Array<{ column_name: string }>;
  console.log("  columns: " + userCols.map((c) => c.column_name).join(", "));

  const userSample = await db.execute<Record<string, unknown>>(sql`
    SELECT id, email, organization_id, role FROM users LIMIT 10
  `);
  const userList = (Array.isArray(userSample)
    ? userSample
    : ((userSample as unknown as { rows?: unknown[] }).rows ?? [])) as Array<{
    id: string;
    email: string | null;
    organization_id: string | null;
    role: string | null;
  }>;
  for (const u of userList) {
    console.log(
      `  ${u.id}  ${u.email ?? "(no email)"}  org=${u.organization_id ?? "none"}  role=${u.role ?? "-"}`,
    );
  }

  console.log("\n=== Brands (top 10 by mention count) ===");
  const brandRows = await db.execute<{
    id: string;
    name: string;
    domain: string | null;
    organization_id: string;
    mention_count: number;
    audit_count: number;
    rec_count: number;
  }>(sql`
    SELECT
      b.id, b.name, b.domain, b.organization_id,
      (SELECT COUNT(*)::int FROM brand_mentions WHERE brand_id = b.id) AS mention_count,
      (SELECT COUNT(*)::int FROM audits WHERE brand_id = b.id) AS audit_count,
      (SELECT COUNT(*)::int FROM recommendations WHERE brand_id = b.id) AS rec_count
    FROM brands b
    ORDER BY mention_count DESC NULLS LAST
    LIMIT 10
  `);
  const rows = (Array.isArray(brandRows)
    ? brandRows
    : ((brandRows as unknown as { rows?: typeof brandRows[number][] }).rows ?? [])) as Array<{
    id: string;
    name: string;
    domain: string | null;
    organization_id: string;
    mention_count: number;
    audit_count: number;
    rec_count: number;
  }>;
  for (const b of rows) {
    console.log(
      `  ${b.id}  ${b.name}  ${b.domain ?? "(no domain)"}  mentions=${b.mention_count}  audits=${b.audit_count}  recs=${b.rec_count}  org=${b.organization_id}`,
    );
  }

  console.log("\n=== Top brands within Apex Demo Company org ===");
  const apexDemo = await db.execute<{
    id: string;
    name: string;
    domain: string | null;
    mention_count: number;
    audit_count: number;
    rec_count: number;
  }>(sql`
    SELECT
      b.id, b.name, b.domain,
      (SELECT COUNT(*)::int FROM brand_mentions WHERE brand_id = b.id) AS mention_count,
      (SELECT COUNT(*)::int FROM audits WHERE brand_id = b.id) AS audit_count,
      (SELECT COUNT(*)::int FROM recommendations WHERE brand_id = b.id) AS rec_count
    FROM brands b
    WHERE b.organization_id = 'aas1zs4jmuoa9q840gzmrh4n'
    ORDER BY mention_count DESC
    LIMIT 10
  `);
  const apexList = (Array.isArray(apexDemo) ? apexDemo : ((apexDemo as unknown as { rows?: unknown[] }).rows ?? [])) as Array<{
    id: string;
    name: string;
    domain: string | null;
    mention_count: number;
    audit_count: number;
    rec_count: number;
  }>;
  for (const b of apexList) {
    console.log(
      `  ${b.id}  ${b.name}  ${b.domain ?? "-"}  mentions=${b.mention_count}  audits=${b.audit_count}  recs=${b.rec_count}`,
    );
  }

  console.log("\n=== API Keys ===");
  const keys = await db.execute<{
    id: string;
    name: string;
    organization_id: string;
    user_id: string | null;
    key_prefix: string | null;
    type: string;
  }>(sql`
    SELECT id, name, organization_id, user_id, type, LEFT(id, 16) AS key_prefix
    FROM api_keys
    WHERE type = 'user'
    LIMIT 10
  `);
  const keyList = (Array.isArray(keys) ? keys : ((keys as unknown as { rows?: unknown[] }).rows ?? [])) as Array<{
    id: string;
    name: string;
    organization_id: string;
    user_id: string | null;
    type: string;
    key_prefix: string;
  }>;
  for (const k of keyList) {
    console.log(`  ${k.id}  ${k.name}  org=${k.organization_id}  user=${k.user_id ?? "-"}`);
  }

  console.log("\n=== Totals ===");
  const totals = await db.execute<{
    orgs: number;
    users: number;
    brands: number;
    audits: number;
    mentions: number;
    recs: number;
    api_keys: number;
  }>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM organizations) AS orgs,
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM brands) AS brands,
      (SELECT COUNT(*)::int FROM audits) AS audits,
      (SELECT COUNT(*)::int FROM brand_mentions) AS mentions,
      (SELECT COUNT(*)::int FROM recommendations) AS recs,
      (SELECT COUNT(*)::int FROM api_keys) AS api_keys
  `);
  const totalRows = (Array.isArray(totals)
    ? totals
    : ((totals as unknown as { rows?: unknown[] }).rows ?? [])) as Array<{
    orgs: number;
    users: number;
    brands: number;
    audits: number;
    mentions: number;
    recs: number;
    api_keys: number;
  }>;
  if (totalRows[0]) {
    console.log("  " + JSON.stringify(totalRows[0], null, 2));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
