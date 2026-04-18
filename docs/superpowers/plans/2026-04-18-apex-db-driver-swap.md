# Plan 2: Database driver swap (Neon → pg) — Apex codebase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@neondatabase/serverless` with `pg` (already a dep) so Apex's data layer talks standard Postgres. After this plan, Apex can connect to **any** Postgres host — Neon (today), the new self-hosted ApexGEO Supabase (Plan 1, ready to use), or future targets — by changing only `DATABASE_URL`. RLS pattern is also fixed: currently the `set_config(...)` calls run as separate HTTP requests under `neon-http`, so the LOCAL session var doesn't persist into the actual query (latent correctness bug). The new pattern wraps RLS context + queries in a real Postgres transaction.

**Architecture:**
- One `pg.Pool` instance at module scope in `src/lib/db/index.ts` (lazy-initialized so missing `DATABASE_URL` in dev doesn't crash import).
- Drizzle wraps that pool via `drizzle-orm/node-postgres` — same query API surface as before (`db.select(...)`, `db.insert(...)`, `db.transaction(...)`).
- `src/lib/db/rls.ts` consumes the same pool — no second connection. RLS context is set inside `db.transaction(async tx => ...)` using `set_config(name, value, true)` so the values are local to that transaction (the only correct semantics under a real connection pool).
- Type imports across the codebase that referenced `NeonDatabase` switch to `NodePgDatabase`.
- `@neondatabase/serverless` and `ws` are removed from `package.json` after the swap is verified end-to-end.

**Tech Stack:** Node.js, TypeScript (strict mode), Drizzle ORM 0.45, `pg` 8.16, vitest.

**Reference spec:** `docs/superpowers/specs/2026-04-18-supabase-migration-design.md` §5.1
**Predecessor:** Plan 1 (`2026-04-18-velo-apexgeo-supabase-stack.md`) — must be COMPLETE. Provides the live `apexgeo-supabase` stack we'll smoke-test against.

---

## File / artifact map

| Type | Path | Responsibility |
|------|------|----------------|
| Modify | `src/lib/db/index.ts` | Pool + drizzle factory using `pg` instead of `@neondatabase/serverless` |
| Rewrite | `src/lib/db/rls.ts` (top half) | RLS-scoped `executeWithContext` using `db.transaction()` instead of separate neon-http calls. Bottom half (`RLS_SETUP_SQL`, `hasOrgAccess`, `hasRole`, `hasPermission`, `PERMISSION_MATRIX`) is **untouched**. |
| Modify | `src/lib/auth/api-key-auth.ts:11` | Type-only import: `NeonDatabase` → `NodePgDatabase` |
| Create | `src/lib/db/index.test.ts` | Module-export smoke test (pattern matches `competitor-queries.test.ts`) |
| Create | `src/lib/db/rls.test.ts` | RLS context + transaction behaviour test (uses real apexgeo DB if `TEST_DATABASE_URL` set, otherwise skips integration parts) |
| Modify | `package.json` | Remove `@neondatabase/serverless` and `ws` from deps (Task 10) |
| Modify | `bun.lock` | Regenerated from package.json change |

**Files NOT touched in this plan** (deferred to later plans):
- `tests/setup.ts` — keeps Clerk env vars stubbed; auth swap is Plan 3
- `src/lib/db/schema/*.ts` — Drizzle schemas are driver-agnostic
- `drizzle/*.sql` migrations — driver-agnostic
- `drizzle.config.ts` — uses connection string only; no driver-specific code
- Any of the 133 Clerk-touching files — Plan 3

---

## Branching & commit policy

This plan runs **directly on `master`** (matching the velocity pattern of Plan 1). Each task ends in a commit. If a task fails verification, revert that task's commit and re-attempt; do not move forward.

If the operator prefers a feature branch instead, run:
```bash
cd /home/hein/Workspace/ApexGEO && git checkout -b plan-2-pg-driver-swap
```
Otherwise commit straight to `master`.

---

## Task 1: Inventory all Neon imports

**Why:** The known sites are `src/lib/db/index.ts`, `src/lib/db/rls.ts`, `src/lib/auth/api-key-auth.ts`. Confirm with a fresh grep — if there's a 4th, this plan needs amending.

**Files:** None modified — discovery only.

- [ ] **Step 1.1: Grep for all Neon imports**

```bash
cd /home/hein/Workspace/ApexGEO && \
  grep -rnE '@neondatabase/serverless|drizzle-orm/neon-serverless|drizzle-orm/neon-http|neonConfig\b' \
  src/ tests/ --include='*.ts' --include='*.tsx'
```

Expected output (exactly 5 lines):
```
src/lib/db/index.ts:1:import { Pool, neonConfig } from "@neondatabase/serverless";
src/lib/db/index.ts:5:} from "drizzle-orm/neon-serverless";
src/lib/db/rls.ts:8:import { neon } from "@neondatabase/serverless";
src/lib/db/rls.ts:9:import { drizzle } from "drizzle-orm/neon-http";
src/lib/auth/api-key-auth.ts:11:import type { NeonDatabase } from "drizzle-orm/neon-serverless";
```

If extra lines appear, **stop and update this plan** to include them in Task 4 / Task 5 / Task 6.

- [ ] **Step 1.2: Commit nothing (discovery only)** — proceed to Task 2.

---

## Task 2: Add baseline smoke test for `db` exports (TDD red step)

**Why:** Before swapping the driver, capture the current public API of `src/lib/db/index.ts` as a test. The test must remain green after the swap — that's the proof the swap is non-breaking.

**Files:**
- Create: `src/lib/db/index.test.ts`

- [ ] **Step 2.1: Write the test**

```typescript
// src/lib/db/index.test.ts
/**
 * Smoke test for the db module's public API surface.
 * Must remain green across driver swaps.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("db module exports", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports `db` as a Drizzle proxy", async () => {
    const mod = await import("./index");
    expect(mod.db).toBeDefined();
    // Drizzle's query builder methods we know we use across the codebase
    expect(typeof mod.db.select).toBe("function");
    expect(typeof mod.db.insert).toBe("function");
    expect(typeof mod.db.update).toBe("function");
    expect(typeof mod.db.delete).toBe("function");
    expect(typeof mod.db.transaction).toBe("function");
  });

  it("exports `getDb` factory", async () => {
    const mod = await import("./index");
    expect(typeof mod.getDb).toBe("function");
  });

  it("exports `schema` namespace with at least the users table", async () => {
    const mod = await import("./index");
    expect(mod.schema).toBeDefined();
    expect(mod.schema.users).toBeDefined();
  });

  it("re-exports RLS helpers", async () => {
    const mod = await import("./index");
    expect(mod.hasOrgAccess).toBeDefined();
    expect(mod.hasRole).toBeDefined();
    expect(mod.hasPermission).toBeDefined();
  });

  it("exports `Database` type", async () => {
    // Type-only check — we just need the module to load without error
    const mod = await import("./index");
    expect(mod).toHaveProperty("db");
  });

  it("getDb() throws when DATABASE_URL is missing", async () => {
    const orig = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const mod = await import("./index");
      expect(() => mod.getDb()).toThrow(/Database not configured/);
    } finally {
      if (orig !== undefined) process.env.DATABASE_URL = orig;
    }
  });
});
```

- [ ] **Step 2.2: Run the test against the existing (Neon) implementation**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run src/lib/db/index.test.ts
```

Expected: 6 tests PASS. This proves the test correctly captures the existing API. If any fail now (before any code change), the test is wrong — fix the test, not the code.

- [ ] **Step 2.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/db/index.test.ts && \
  git commit -m "test(db): smoke test for db module public API surface"
```

---

## Task 3: Swap `src/lib/db/index.ts` to `pg`

**Files:**
- Modify: `src/lib/db/index.ts` (full rewrite — short file, ~50 lines)

- [ ] **Step 3.1: Replace the file contents**

Overwrite `src/lib/db/index.ts` with:

```typescript
import { Pool, type PoolConfig } from "pg";
import {
  drizzle,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

function buildPoolConfig(): PoolConfig {
  const config: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    // Modest defaults — Supavisor in transaction mode handles real pooling.
    // We keep app-side connections low to avoid exhausting Supavisor.
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    // Self-hosted Supabase Postgres uses a self-signed cert on the internal
    // Docker network. Trust it explicitly when SSL is negotiated.
    ssl: process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
  };
  return config;
}

function getDatabase(): NodePgDatabase<typeof schema> {
  if (!_db) {
    if (!isDatabaseConfigured()) {
      throw new Error(
        "Database not configured. Please set DATABASE_URL environment variable."
      );
    }
    _pool = new Pool(buildPoolConfig());
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const database = getDatabase();
    const value = database[prop as keyof typeof database];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export function getDb(): NodePgDatabase<typeof schema> {
  return getDatabase();
}

export { schema };

export * from "./rls";

export type Database = NodePgDatabase<typeof schema>;
```

- [ ] **Step 3.2: Run the smoke test from Task 2**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run src/lib/db/index.test.ts
```

Expected: all 6 tests PASS. The Proxy and exported names match the previous implementation, so the same assertions hold.

- [ ] **Step 3.3: Run TypeScript check on the file**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit src/lib/db/index.ts 2>&1 | head -20
```

Expected: no errors. (`tsc --noEmit` against a single file with `--noEmit` may complain about other unrelated files; this step is just a sanity check on the new file's own types. Full project tsc runs in Task 8.)

- [ ] **Step 3.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/db/index.ts && \
  git commit -m "feat(db): swap @neondatabase/serverless → pg driver

Drops Neon's WebSocket protocol in favor of standard libpq. Apex now
talks to any Postgres host via DATABASE_URL — Neon, self-hosted
Supabase, or anything else. SSL set to permissive (rejectUnauthorized:
false) for self-hosted Postgres with self-signed certs; can be tightened
via DATABASE_SSL=false to disable entirely."
```

---

## Task 4: Rewrite `src/lib/db/rls.ts` top half (the connection + executeWithContext)

**Files:**
- Modify: `src/lib/db/rls.ts` lines 1-61 (the imports + `createSecureDb` function)
- The bottom half (line 62 onward — `RLS_SETUP_SQL`, helpers, `PERMISSION_MATRIX`) stays exactly as-is.

**Why the rewrite:** The current implementation uses `neon-http`, which is a per-HTTP-request connection. The three `set_config(..., true)` calls run as three separate HTTP requests, so the LOCAL session var doesn't survive into the actual query in the callback — a latent correctness bug. With `pg` and a real connection pool, RLS context must be set inside a `db.transaction()` so all queries (including the callback's) execute on the same client with the LOCAL setting still active.

- [ ] **Step 4.1: Write the failing RLS test**

Create `src/lib/db/rls.test.ts`:

```typescript
// src/lib/db/rls.test.ts
/**
 * RLS module tests.
 * Module-surface tests run always; integration tests run only if
 * TEST_DATABASE_URL is set (pointing at a Postgres dev instance,
 * e.g. the apexgeo-supabase stack from Plan 1).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSecureDb,
  hasOrgAccess,
  hasRole,
  hasPermission,
  type RLSContext,
} from "./rls";

describe("RLS module — exports", () => {
  it("exports createSecureDb factory", () => {
    expect(typeof createSecureDb).toBe("function");
  });

  it("hasOrgAccess returns true on match", () => {
    expect(hasOrgAccess("org-1", "org-1")).toBe(true);
    expect(hasOrgAccess("org-1", "org-2")).toBe(false);
    expect(hasOrgAccess(null, "org-2")).toBe(false);
  });

  it("hasRole respects required-roles list", () => {
    expect(hasRole("admin", ["admin"])).toBe(true);
    expect(hasRole("editor", ["admin"])).toBe(false);
    expect(hasRole(null, ["admin"])).toBe(false);
  });

  it("hasPermission resolves via the matrix", () => {
    expect(hasPermission("admin", "brand.create")).toBe(true);
    expect(hasPermission("viewer", "brand.create")).toBe(false);
    expect(hasPermission(null, "brand.create")).toBe(false);
  });

  it("createSecureDb returns an object with executeWithContext + context", () => {
    const ctx: RLSContext = {
      organizationId: "org-test",
      userId: "user-test",
      role: "admin",
    };
    // Don't actually invoke if no DB; just check construction shape
    if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
      return; // skip — nothing to construct against
    }
    const secure = createSecureDb(ctx);
    expect(secure.context).toEqual(ctx);
    expect(typeof secure.executeWithContext).toBe("function");
  });
});

// Integration tests — only run with a live Postgres DB
describe.skipIf(!process.env.TEST_DATABASE_URL)("RLS — integration", () => {
  beforeEach(() => {
    // Reset module cache so the lazy `_pool` in db/index.ts re-initializes
    // against TEST_DATABASE_URL instead of the placeholder URL set in
    // tests/setup.ts during module-surface tests above.
    vi.resetModules();
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
  });

  it("set_config inside executeWithContext is visible to the callback's queries", async () => {
    const { createSecureDb } = await import("./rls");
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
      // pg returns rows as { rows: [...] }; drizzle's tx.execute returns a similar shape
      return (result as unknown as { rows: Array<{ org: string; uid: string; role: string }> }).rows[0];
    });

    expect(observed.org).toBe("rls-test-org-uuid");
    expect(observed.uid).toBe("rls-test-user-uuid");
    expect(observed.role).toBe("admin");
  });
});
```

- [ ] **Step 4.2: Run the test — module-surface tests should PASS, integration tests skip**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run src/lib/db/rls.test.ts
```

Expected: 5 module-surface tests PASS. The integration `describe` block is skipped (`describe.skipIf(!process.env.TEST_DATABASE_URL)`).

If `TEST_DATABASE_URL` happens to be set, the integration test will run and FAIL right now (because the current `executeWithContext` uses `neon-http` which doesn't work on a non-Neon DB). That's the failing test driving Task 4.3.

- [ ] **Step 4.3: Rewrite the top half of `src/lib/db/rls.ts`**

Replace lines 1-61 (everything from `/** ... */` through the end of the `createSecureDb` function — i.e. up to but not including the `/** SQL statements ... */` comment block that starts the `RLS_SETUP_SQL` constant).

The new top half:

```typescript
/**
 * Row-Level Security (RLS) helpers for multi-tenant data isolation.
 *
 * Uses the shared pg pool + Drizzle transactions so RLS context is
 * properly scoped to the queries that need it (each transaction is
 * a single Postgres client connection, so set_config(..., true) — i.e.
 * SET LOCAL — applies for the duration of the transaction).
 */

import { sql } from "drizzle-orm";
import { getDb } from "./index";
import type { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
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
 * the caller's queries in a transaction with set_config(..., is_local=true)
 * — the only way to make session vars stick across multiple statements
 * on a pooled pg.Client.
 */
export function createSecureDb(context: RLSContext) {
  // Returning the live db means callers can do read-only queries that
  // don't need RLS context (e.g. lookup an organization by id) without
  // paying for a transaction. RLS-scoped work goes through executeWithContext.
  const db: NodePgDatabase<typeof schema> = getDb();

  return {
    db,
    context,

    /**
     * Run `callback` inside a transaction with the RLS context applied.
     * The transaction parameter `tx` exposes the same drizzle query API
     * (select/insert/update/delete/execute). All queries inside `callback`
     * see the set_config values; queries outside (on `db`) do not.
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

```

Leave everything below line 61 (the `RLS_SETUP_SQL` constant onwards) **untouched**.

- [ ] **Step 4.4: Run the RLS test (module-surface)**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run src/lib/db/rls.test.ts
```

Expected: 5 PASS. Integration block still skipped (no TEST_DATABASE_URL yet — Task 9 sets that).

- [ ] **Step 4.5: Run the original index test to confirm RLS re-exports still work**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run src/lib/db/index.test.ts
```

Expected: all 6 tests PASS (including "re-exports RLS helpers").

- [ ] **Step 4.6: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/db/rls.ts src/lib/db/rls.test.ts && \
  git commit -m "feat(db): rewrite RLS context to use pg transactions

The neon-http path ran each set_config call as a separate HTTP request,
so SET LOCAL didn't survive into the callback's queries. The new
implementation uses db.transaction() so all queries — including the
callback — execute on the same pooled pg.Client with the RLS context
set. Adds module-surface and integration tests; integration tests
skip unless TEST_DATABASE_URL is set."
```

---

## Task 5: Update the type-only Neon import in `src/lib/auth/api-key-auth.ts`

**Files:**
- Modify: `src/lib/auth/api-key-auth.ts:11`

- [ ] **Step 5.1: Read the current import to confirm context**

```bash
sed -n '5,20p' /home/hein/Workspace/ApexGEO/src/lib/auth/api-key-auth.ts
```

Expected to see (line numbers approximate):
```
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
```

- [ ] **Step 5.2: Replace with NodePgDatabase**

```bash
cd /home/hein/Workspace/ApexGEO && \
  sed -i 's|^import type { NeonDatabase } from "drizzle-orm/neon-serverless";|import type { NodePgDatabase } from "drizzle-orm/node-postgres";|' \
  src/lib/auth/api-key-auth.ts
```

- [ ] **Step 5.3: Replace any references to `NeonDatabase<` in the same file with `NodePgDatabase<`**

```bash
cd /home/hein/Workspace/ApexGEO && \
  sed -i 's/NeonDatabase</NodePgDatabase</g' src/lib/auth/api-key-auth.ts && \
  grep -n 'NeonDatabase\|NodePgDatabase' src/lib/auth/api-key-auth.ts
```

Expected: no `NeonDatabase` references remain; `NodePgDatabase` is the only one.

- [ ] **Step 5.4: TypeScript check on this file's compile unit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'api-key-auth' | head -10
```

Expected: no errors mentioning `api-key-auth.ts`.

- [ ] **Step 5.5: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/auth/api-key-auth.ts && \
  git commit -m "refactor(auth): swap NeonDatabase type import for NodePgDatabase"
```

---

## Task 6: Re-run grep to confirm zero remaining Neon imports

**Files:** None modified — verification only.

- [ ] **Step 6.1: Grep for any leftover Neon references**

```bash
cd /home/hein/Workspace/ApexGEO && \
  grep -rnE '@neondatabase/serverless|drizzle-orm/neon-serverless|drizzle-orm/neon-http|neonConfig\b|NeonDatabase\b' \
  src/ tests/ --include='*.ts' --include='*.tsx' || echo 'CLEAN'
```

Expected: only `CLEAN` printed (grep finds no matches → exits non-zero → triggers `|| echo CLEAN`). If any matches appear, those files need the same treatment as Task 5.

---

## Task 7: Run the full unit test suite

**Why:** Catch any test elsewhere that imports types or APIs we just changed.

**Files:** None modified.

- [ ] **Step 7.1: Run vitest across the whole `src/` and `tests/` tree**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run 2>&1 | tail -30
```

Expected: summary line shows `Test Files  N passed (N)` and `Tests  M passed (M)`. No failures.

If a test fails because it mocks `@neondatabase/serverless`, update the mock to target `pg` instead. If a test imports `NeonDatabase` for typing, swap to `NodePgDatabase`.

- [ ] **Step 7.2: If any tests fail, fix and re-run**

After fixes, repeat `npx vitest run` until all pass. Each fix gets its own commit:

```bash
git add <test file> && \
git commit -m "test(<area>): swap Neon driver references for pg in test"
```

---

## Task 8: Full TypeScript check

**Files:** None modified.

- [ ] **Step 8.1: Run `tsc --noEmit` across the whole project**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | tail -30
```

Expected: zero errors. Exit code 0.

- [ ] **Step 8.2: If errors appear, fix them**

Most likely culprits:
- A type imported from `drizzle-orm/neon-serverless` somewhere — swap to `drizzle-orm/node-postgres`
- A function signature that took `NeonDatabase<typeof schema>` — swap to `NodePgDatabase<typeof schema>`

After each fix:
```bash
cd /home/hein/Workspace/ApexGEO && \
  git add <file> && \
  git commit -m "refactor(<area>): replace Neon types with NodePg equivalents"
```

Repeat `npx tsc --noEmit` until clean.

---

## Task 9: Live integration test against ApexGEO Supabase

**Why:** Smoke-test the new driver against a real Postgres — specifically the apexgeo-supabase stack from Plan 1 — to confirm it actually connects and the RLS transaction behaviour works end-to-end.

**Files:** None modified — runtime check.

- [ ] **Step 9.1: Build the connection string**

The pooler accepts `postgres.<tenant_id>` as the user format. From Plan 1:
- Host: `localhost` (running on Velo where the stack lives)
- Port: `7783` (transaction pooler)
- Database: `apexgeo`
- User: `postgres.apexgeo`
- Password: pulled from `/home/velo/apexgeo-supabase/.env`

Construct the URL into a temp shell var (don't write to any file):

```bash
PW=$(sudo -u velo grep '^POSTGRES_PASSWORD=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
export TEST_DATABASE_URL="postgresql://postgres.apexgeo:${PW}@localhost:7783/apexgeo?sslmode=disable"
unset PW
```

(`sslmode=disable` because the pooler in this setup terminates without TLS on the local Docker network.)

- [ ] **Step 9.2: Quick raw connectivity check via `psql`**

```bash
psql "$TEST_DATABASE_URL" -c "SELECT current_database(), current_user, now();"
```

Expected: row showing `apexgeo`, `postgres`, current timestamp. (User shows `postgres` because the pooler maps `postgres.apexgeo` → real role `postgres` for the apexgeo tenant.)

- [ ] **Step 9.3: Run the RLS integration test against the live DB**

```bash
cd /home/hein/Workspace/ApexGEO && \
  TEST_DATABASE_URL="$TEST_DATABASE_URL" npx vitest run src/lib/db/rls.test.ts
```

Expected: all 5 module-surface tests PASS, plus the 1 integration test now also PASS:
```
✓ RLS — integration > set_config inside executeWithContext is visible to the callback's queries
```

This is the **definitive proof** that:
- `pg` driver connects to apexgeo-supabase correctly
- The transaction wrapper makes `set_config(..., true)` persist into the callback's queries
- RLS context propagation works end-to-end

If this test fails, **stop**. Common issues:
- Connection refused → check `docker ps | grep apexgeo-supabase-pooler`
- Tenant not found → verify `POOLER_TENANT_ID=apexgeo` in `.env` and pooler is running
- SSL handshake error → confirm `sslmode=disable` in TEST_DATABASE_URL

- [ ] **Step 9.4: Optional — also confirm a Drizzle schema-level query works**

```bash
cd /home/hein/Workspace/ApexGEO && \
  TEST_DATABASE_URL="$TEST_DATABASE_URL" \
  DATABASE_URL="$TEST_DATABASE_URL" \
  node --input-type=module -e "
    const { db, schema } = await import('./src/lib/db/index.ts');
    const result = await db.select().from(schema.users).limit(1);
    console.log('rows:', result.length);
    process.exit(0);
  " 2>&1 | tail -5
```

Note: this requires `tsx`/`bun` for direct .ts execution. If unavailable, skip — the integration test in 9.3 is sufficient proof.

Expected: `rows: 0` (no users in apexgeo yet — Plan 1 left a clean slate). No connection errors.

- [ ] **Step 9.5: Clean up the env var**

```bash
unset TEST_DATABASE_URL
```

- [ ] **Step 9.6: Commit nothing — this task is verification only.**

---

## Task 10: Remove `@neondatabase/serverless` and `ws` from dependencies

**Files:**
- Modify: `package.json` (remove 2 dep entries)
- Modify: `bun.lock` (regenerated)

Only safe to do AFTER Tasks 6, 7, 8, 9 all pass — confirms nothing else needs Neon.

- [ ] **Step 10.1: Remove the deps**

```bash
cd /home/hein/Workspace/ApexGEO && \
  bun remove @neondatabase/serverless ws @types/ws 2>&1 | tail -10
```

(`ws` was only there to satisfy `@neondatabase/serverless`'s websocket constructor; `@types/ws` similarly redundant.)

If `bun` isn't available, fall back to npm:
```bash
cd /home/hein/Workspace/ApexGEO && \
  npm uninstall @neondatabase/serverless ws @types/ws
```

- [ ] **Step 10.2: Re-run TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | tail -10
```

Expected: zero errors. If anything still imports from `@neondatabase/serverless` or `ws`, the install removal will surface that here.

- [ ] **Step 10.3: Re-run the test suite**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run 2>&1 | tail -10
```

Expected: all tests still pass.

- [ ] **Step 10.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add package.json bun.lock package-lock.json 2>/dev/null && \
  git commit -m "chore(deps): remove @neondatabase/serverless, ws, @types/ws

No longer used after the pg driver swap. The Apex codebase has no
remaining Neon-specific imports."
```

---

## Task 11: Update plan with verified state

**Files:**
- Modify: this plan file

- [ ] **Step 11.1: Append a "Verified state" section**

Edit the top of `docs/superpowers/plans/2026-04-18-apex-db-driver-swap.md`. Change the title line to:
```
# Plan 2: Database driver swap (Neon → pg) — Apex codebase  (✅ COMPLETE YYYY-MM-DD)
```
…and below it add:

```markdown
## Verified state (YYYY-MM-DD)

- 0 remaining `@neondatabase/serverless` / `drizzle-orm/neon-*` imports across `src/` and `tests/`
- `npx tsc --noEmit` passes
- `npx vitest run` passes (full suite)
- Live integration test against apexgeo-supabase: `set_config` visible inside `executeWithContext` callback ✓
- `package.json` no longer references `@neondatabase/serverless`, `ws`, `@types/ws`

## What this unblocks for Plan 3

The Apex codebase can now point `DATABASE_URL` at the apexgeo-supabase pooler (`postgresql://postgres.apexgeo:<pw>@apexgeo-supabase-pooler:6543/apexgeo`) and run any query. Plan 3 (Auth swap) can begin assuming the data layer is migration-ready.
```

- [ ] **Step 11.2: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add docs/superpowers/plans/2026-04-18-apex-db-driver-swap.md && \
  git commit -m "docs(plan): Plan 2 complete — Apex DB driver swapped to pg"
```

---

## Verification checklist (run before declaring Plan 2 complete)

- [ ] No `@neondatabase/serverless`, `drizzle-orm/neon-*`, `neonConfig`, or `NeonDatabase` references anywhere in `src/` or `tests/`
- [ ] `package.json` does not list `@neondatabase/serverless`, `ws`, or `@types/ws`
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` reports all tests passing
- [ ] Live RLS integration test passes against the apexgeo-supabase pooler
- [ ] All commits pushed (or staged on master) — no uncommitted work
- [ ] Plan file marked `(✅ COMPLETE …)` and committed

---

## What's NOT in this plan

- **Auth swap (Clerk → Supabase Auth)** — Plan 3
- **Cache swap (Upstash → ioredis)** — Plan 4
- **Storage swap (local/whatever → Supabase Storage)** — Plan 4
- **Apex containerization for Velo (`apex-app` + `apex-worker` Dockerfiles)** — Plan 5
- **Production cutover runbook (data migration from Neon → apexgeo, DNS flip, decommission)** — Plan 6
- **Auth user migration / seed admin / migration 0017** — Plan 6 (the cutover phase)
