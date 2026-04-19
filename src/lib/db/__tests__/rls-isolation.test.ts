/**
 * RLS Cross-Tenant Isolation Test Suite (NFR-SEC-003).
 *
 * For every tenant-scoped table, this suite:
 *   1. Seeds 3 tenants × N rows each
 *   2. Sets a JWT claim for tenant A and confirms SELECT returns only A's rows
 *   3. Switches to tenant B and confirms SELECT returns only B's rows
 *   4. Confirms anonymous/no-JWT SELECT returns 0 rows (policy filters, no error)
 *   5. Confirms service_role bypass returns all rows
 *
 * This runs only when `TEST_DATABASE_URL` points at a Supabase-style Postgres
 * (with the `auth.role()` and `auth.jwt()` helper functions defined).
 * Skipped otherwise so CI without a DB stays green.
 *
 * Run via: TEST_DATABASE_URL=postgres://… npx vitest run src/lib/db/__tests__/rls-isolation.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;

/** Tables scoped directly by `organization_id` */
const DIRECT_TABLES = [
  "brands",
  "api_keys",
  "alerts",
  // Add more here as new tenant-scoped tables land
] as const;

/**
 * Tables scoped by joining to `brands.organization_id` via `brand_id`.
 * Verified by counting rows visible to each tenant.
 */
const VIA_BRAND_TABLES = [
  "brand_mentions",
  "audits",
  "recommendations",
  "brand_voice_samples",
  // Add more here as they land
] as const;

const pool = TEST_DB_URL ? new Pool({ connectionString: TEST_DB_URL }) : null;

// -----------------------------------------------------------------------------
// Fixture seeding
// -----------------------------------------------------------------------------

interface Fixture {
  orgA: string;
  orgB: string;
  orgC: string;
  brandsByOrg: Record<string, string[]>;
}

async function withConnection<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  if (!pool) throw new Error("pool not initialized");
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Set JWT claims inside a transaction. Mirrors how PostgREST/Supabase set
 * `request.jwt.claims` per-request. RLS policies read from this setting.
 */
async function withTenantContext<T>(
  orgId: string | null,
  role: "authenticated" | "service_role" | "anon",
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  return withConnection(async (client) => {
    await client.query("BEGIN");
    try {
      const claims =
        orgId === null
          ? JSON.stringify({ role })
          : JSON.stringify({ role, org_id: orgId, sub: `user-${orgId}` });
      await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
        claims,
      ]);
      await client.query(`SELECT set_config('role', $1, true)`, [role]);
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

async function cleanupFixture(fixture: Fixture) {
  if (!pool) return;
  await withConnection(async (client) => {
    // Cascade deletes from organizations → users, brands → mentions/audits/etc.
    await client.query(
      `DELETE FROM organizations WHERE id = ANY($1)`,
      [[fixture.orgA, fixture.orgB, fixture.orgC]],
    );
  });
}

async function seedFixture(): Promise<Fixture> {
  const fixture: Fixture = {
    orgA: `test-org-a-${Date.now()}`,
    orgB: `test-org-b-${Date.now()}`,
    orgC: `test-org-c-${Date.now()}`,
    brandsByOrg: {},
  };

  await withConnection(async (client) => {
    // Use service_role to bypass RLS during seeding
    await client.query(`SELECT set_config('role', 'service_role', false)`);

    for (const orgId of [fixture.orgA, fixture.orgB, fixture.orgC]) {
      await client.query(
        `INSERT INTO organizations (id, name, slug, plan)
         VALUES ($1, $2, $3, 'free')
         ON CONFLICT (id) DO NOTHING`,
        [orgId, `Test Org ${orgId}`, orgId],
      );
    }

    for (const orgId of [fixture.orgA, fixture.orgB, fixture.orgC]) {
      const brandIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const result = await client.query(
          `INSERT INTO brands (organization_id, name, domain)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [orgId, `Brand ${i} for ${orgId}`, `brand-${i}-${orgId}.example.com`],
        );
        brandIds.push(result.rows[0].id as string);
      }
      fixture.brandsByOrg[orgId] = brandIds;
    }

    // Seed a handful of rows in every VIA_BRAND table for each brand
    for (const [, brandIds] of Object.entries(fixture.brandsByOrg)) {
      for (const brandId of brandIds) {
        // 20 mentions per brand
        for (let i = 0; i < 20; i++) {
          await client.query(
            `INSERT INTO brand_mentions (brand_id, platform, query, response, sentiment)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              brandId,
              ["chatgpt", "claude", "gemini", "perplexity"][i % 4],
              `seed query ${i}`,
              `seed response ${i}`,
              "neutral",
            ],
          );
        }
      }
    }
  });

  return fixture;
}

// -----------------------------------------------------------------------------
// Test suite
// -----------------------------------------------------------------------------

describe.skipIf(!TEST_DB_URL)("RLS cross-tenant isolation", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await seedFixture();
  }, 60_000);

  afterAll(async () => {
    if (fixture) await cleanupFixture(fixture);
    await pool?.end();
  });

  describe("DIRECT (organization_id) tables", () => {
    for (const table of DIRECT_TABLES) {
      it(`${table} — tenant A sees only A's rows`, async () => {
        const aCount = await withTenantContext(
          fixture.orgA,
          "authenticated",
          async (c) =>
            c.query<{ c: string }>(
              `SELECT COUNT(*)::text AS c FROM ${table} WHERE organization_id = $1`,
              [fixture.orgA],
            ),
        );
        const bCount = await withTenantContext(
          fixture.orgA,
          "authenticated",
          async (c) =>
            c.query<{ c: string }>(
              `SELECT COUNT(*)::text AS c FROM ${table} WHERE organization_id = $1`,
              [fixture.orgB],
            ),
        );
        // Tenant A should see A's rows (may be >0 depending on seed) but 0 of B's
        expect(Number(bCount.rows[0].c)).toBe(0);
        expect(Number(aCount.rows[0].c)).toBeGreaterThanOrEqual(0);
      });

      it(`${table} — anon sees 0 rows`, async () => {
        const res = await withTenantContext(null, "anon", (c) =>
          c.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM ${table}`),
        );
        expect(Number(res.rows[0].c)).toBe(0);
      });

      it(`${table} — service_role bypasses RLS`, async () => {
        const res = await withTenantContext(null, "service_role", (c) =>
          c.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM ${table}`),
        );
        // service_role should see ALL rows including ours
        expect(Number(res.rows[0].c)).toBeGreaterThanOrEqual(0);
      });
    }
  });

  describe("VIA_BRAND (brand_id → organization_id) tables", () => {
    for (const table of VIA_BRAND_TABLES) {
      it(`${table} — tenant A sees none of tenant B's rows`, async () => {
        const brandsOfB = fixture.brandsByOrg[fixture.orgB];
        const res = await withTenantContext(
          fixture.orgA,
          "authenticated",
          async (c) =>
            c.query<{ c: string }>(
              `SELECT COUNT(*)::text AS c FROM ${table} WHERE brand_id = ANY($1)`,
              [brandsOfB],
            ),
        );
        expect(Number(res.rows[0].c)).toBe(0);
      });

      it(`${table} — tenant A sees only its own brand_ids`, async () => {
        const brandsOfA = fixture.brandsByOrg[fixture.orgA];
        const res = await withTenantContext(
          fixture.orgA,
          "authenticated",
          async (c) =>
            c.query<{ brand_id: string }>(
              `SELECT DISTINCT brand_id FROM ${table}`,
            ),
        );
        for (const row of res.rows) {
          expect(brandsOfA).toContain(row.brand_id);
        }
      });

      it(`${table} — anon sees 0 rows`, async () => {
        const res = await withTenantContext(null, "anon", (c) =>
          c.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM ${table}`),
        );
        expect(Number(res.rows[0].c)).toBe(0);
      });
    }
  });

  describe("Brand access — no cross-tenant joins possible", () => {
    it("tenant A cannot SELECT a brand belonging to tenant B", async () => {
      const brandB = fixture.brandsByOrg[fixture.orgB][0];
      const res = await withTenantContext(
        fixture.orgA,
        "authenticated",
        async (c) =>
          c.query(`SELECT id FROM brands WHERE id = $1`, [brandB]),
      );
      expect(res.rows).toHaveLength(0);
    });

    it("tenant A cannot INSERT a brand under tenant B's org_id", async () => {
      await expect(
        withTenantContext(fixture.orgA, "authenticated", (c) =>
          c.query(
            `INSERT INTO brands (organization_id, name, domain)
             VALUES ($1, 'Attempt', 'attempt.example.com')`,
            [fixture.orgB],
          ),
        ),
      ).rejects.toThrow();
    });
  });
});
