/**
 * RLS module tests.
 * Module-surface tests run always; integration tests run only if
 * TEST_DATABASE_URL is set (pointing at a real Postgres dev instance,
 * e.g. the apexgeo-supabase stack from Plan 1).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.unmock("@/lib/db");

describe("RLS module — exports", () => {
  it("exports createSecureDb factory", async () => {
    const mod = await vi.importActual<typeof import("./rls")>("./rls");
    expect(typeof mod.createSecureDb).toBe("function");
  });

  it("hasOrgAccess matches org IDs strictly", async () => {
    const { hasOrgAccess } = await vi.importActual<typeof import("./rls")>("./rls");
    expect(hasOrgAccess("org-1", "org-1")).toBe(true);
    expect(hasOrgAccess("org-1", "org-2")).toBe(false);
    expect(hasOrgAccess(null, "org-2")).toBe(false);
    expect(hasOrgAccess(undefined, "org-2")).toBe(false);
  });

  it("hasRole respects required-roles list", async () => {
    const { hasRole } = await vi.importActual<typeof import("./rls")>("./rls");
    expect(hasRole("admin", ["admin"])).toBe(true);
    expect(hasRole("editor", ["admin"])).toBe(false);
    expect(hasRole("editor", ["admin", "editor"])).toBe(true);
    expect(hasRole(null, ["admin"])).toBe(false);
  });

  it("hasPermission resolves via the permission matrix", async () => {
    const { hasPermission } = await vi.importActual<typeof import("./rls")>("./rls");
    expect(hasPermission("admin", "brand.create")).toBe(true);
    expect(hasPermission("viewer", "brand.create")).toBe(false);
    expect(hasPermission("editor", "content.create")).toBe(true);
    expect(hasPermission(null, "brand.create")).toBe(false);
  });

  it("createSecureDb returns object with executeWithContext + context", async () => {
    if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
      return; // nothing to construct against; env-stubbed url is fine for shape check
    }
    const { createSecureDb } = await vi.importActual<typeof import("./rls")>("./rls");
    const secure = createSecureDb({
      organizationId: "org-test",
      userId: "user-test",
      role: "admin",
    });
    expect(secure.context).toEqual({
      organizationId: "org-test",
      userId: "user-test",
      role: "admin",
    });
    expect(typeof secure.executeWithContext).toBe("function");
  });
});

// Integration tests — only run with a live Postgres DB
describe.skipIf(!process.env.TEST_DATABASE_URL)("RLS — integration", () => {
  beforeEach(() => {
    // Reset module cache so the lazy `_pool` in db/index.ts re-initializes
    // against TEST_DATABASE_URL (instead of the placeholder URL set by
    // tests/setup.ts during the module-surface tests above).
    vi.resetModules();
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
  });

  it("set_config inside executeWithContext is visible to the callback's queries", async () => {
    const { createSecureDb } = await vi.importActual<typeof import("./rls")>("./rls");
    const { sql } = await import("drizzle-orm");

    const secure = createSecureDb({
      organizationId: "rls-test-org-uuid",
      userId: "rls-test-user-uuid",
      role: "admin",
    });

    const observed = await secure.executeWithContext(async (tx) => {
      const result = await tx.execute(sql`
        SELECT current_setting('app.current_organization_id', true) AS org,
               current_setting('app.current_user_id', true) AS uid,
               current_setting('app.current_role', true) AS role
      `);
      return (
        result as unknown as {
          rows: Array<{ org: string; uid: string; role: string }>;
        }
      ).rows[0];
    });

    expect(observed.org).toBe("rls-test-org-uuid");
    expect(observed.uid).toBe("rls-test-user-uuid");
    expect(observed.role).toBe("admin");
  });

  it("settings DO NOT leak outside the executeWithContext transaction", async () => {
    const { createSecureDb } = await vi.importActual<typeof import("./rls")>("./rls");
    const { db } = await vi.importActual<typeof import("./index")>("./index");
    const { sql } = await import("drizzle-orm");

    await createSecureDb({
      organizationId: "leaky-org-id",
      userId: "leaky-user-id",
      role: "admin",
    }).executeWithContext(async () => "irrelevant");

    // After executeWithContext returns, a fresh query on the pool should
    // see the setting reset (because is_local=true scopes it to that
    // transaction). Different connection → empty string default.
    const result = await db.execute(sql`
      SELECT current_setting('app.current_organization_id', true) AS org
    `);
    const org = (
      result as unknown as { rows: Array<{ org: string | null }> }
    ).rows[0].org;
    expect(org === null || org === "").toBe(true);
  });
});
