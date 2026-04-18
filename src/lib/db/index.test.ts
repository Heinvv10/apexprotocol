/**
 * Smoke test for the db module's public API surface.
 * Must remain green across driver swaps (Neon → pg).
 *
 * Global tests/setup.ts stubs @/lib/db with a minimal mock so API-route
 * tests don't hit a real database. These tests use vi.importActual to
 * bypass that mock and inspect the REAL module surface.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.unmock("@/lib/db");

type DbModule = typeof import("./index");

async function importReal(): Promise<DbModule> {
  return vi.importActual<DbModule>("./index");
}

describe("db module exports (real, unmocked)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports `db` as a Drizzle proxy with query builder methods", async () => {
    const mod = await importReal();
    expect(mod.db).toBeDefined();
    expect(typeof mod.db.select).toBe("function");
    expect(typeof mod.db.insert).toBe("function");
    expect(typeof mod.db.update).toBe("function");
    expect(typeof mod.db.delete).toBe("function");
    expect(typeof mod.db.transaction).toBe("function");
  });

  it("exports `getDb` factory", async () => {
    const mod = await importReal();
    expect(typeof mod.getDb).toBe("function");
  });

  it("exports `schema` namespace with at least the users table", async () => {
    const mod = await importReal();
    expect(mod.schema).toBeDefined();
    expect(mod.schema.users).toBeDefined();
  });

  it("re-exports RLS helpers", async () => {
    const mod = await importReal();
    expect(mod.hasOrgAccess).toBeDefined();
    expect(mod.hasRole).toBeDefined();
    expect(mod.hasPermission).toBeDefined();
  });

  it("module loads without throwing", async () => {
    const mod = await importReal();
    expect(mod).toHaveProperty("db");
  });

  it("getDb() throws when DATABASE_URL is missing", async () => {
    const orig = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const mod = await importReal();
      expect(() => mod.getDb()).toThrow(/Database not configured/);
    } finally {
      if (orig !== undefined) process.env.DATABASE_URL = orig;
    }
  });
});
