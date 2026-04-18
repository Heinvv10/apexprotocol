/**
 * Playwright global auth setup — runs before the main test projects.
 *
 * What it does:
 *   1. Uses the Clerk Backend API to get-or-create the E2E test user
 *      (pre-verified — no email round-trip)
 *   2. Ensures the matching users/organizations rows exist in Neon, so
 *      FK constraints don't trip the moment a test writes to the DB
 *   3. Mints a one-time sign_in_token and hands it to the app at
 *      /sign-in?__clerk_ticket=<token>; Clerk completes the session
 *      without requiring a password or MFA
 *   4. Handles the post-sign-in `choose-organization` task when the
 *      org isn't already linked to the user
 *   5. Saves the live storage state to STORAGE_STATE_PATH so subsequent
 *      tests can start authenticated
 *
 * Prerequisites (read from .env.local, already present):
 *   - CLERK_SECRET_KEY — Clerk Backend API
 *   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — must match the running app
 *   - DATABASE_URL — Neon pool so users/organizations rows can be
 *     seeded directly (the Clerk webhook doesn't fire from local dev)
 *
 * Config knobs (env):
 *   - E2E_TEST_EMAIL    (default hein+e2e@h10.co.za)
 *   - E2E_TEST_PASSWORD (default ApexGeo2026)
 *   - E2E_TEST_ORG_NAME (default "Apex E2E")
 *   - E2E_BASE_URL      (default http://localhost:3011)
 *   - STORAGE_STATE_PATH (default e2e/.auth/storage-state.json)
 */

import { chromium, expect, type FullConfig } from "@playwright/test";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

// Playwright doesn't load .env.local on its own. Pull CLERK_SECRET_KEY
// and DATABASE_URL from it (and the app's own env) before anything else.
loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });
loadDotenv({ path: path.resolve(process.cwd(), ".env") });

const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3011";
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "hein+e2e@h10.co.za";
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "ApexGeo2026";
const E2E_TEST_ORG_NAME = process.env.E2E_TEST_ORG_NAME ?? "Apex E2E";

export const STORAGE_STATE_PATH =
  process.env.STORAGE_STATE_PATH ??
  path.resolve(process.cwd(), "e2e/.auth/storage-state.json");

interface ClerkUser {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
}

async function clerkFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "CLERK_SECRET_KEY is not set — auth.setup.ts cannot contact Clerk Backend API"
    );
  }
  const res = await fetch(`https://api.clerk.com/v1${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clerk ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function getOrCreateUser(): Promise<ClerkUser> {
  const existing = await clerkFetch<ClerkUser[]>(
    `/users?email_address=${encodeURIComponent(E2E_TEST_EMAIL)}`
  );
  if (existing.length > 0) return existing[0];

  return clerkFetch<ClerkUser>("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [E2E_TEST_EMAIL],
      password: E2E_TEST_PASSWORD,
      first_name: "E2E",
      last_name: "Tester",
    }),
  });
}

async function mintSignInTicket(userId: string): Promise<string> {
  const token = await clerkFetch<{ token: string }>("/sign_in_tokens", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 }),
  });
  return token.token;
}

/**
 * Ensure the users + organizations rows referenced by the test user
 * exist in Neon. The Clerk webhook handles this in prod, but it doesn't
 * fire against local dev. Pooling via Neon's serverless ws driver so we
 * don't depend on psql being installed.
 */
async function seedLocalDbRows(
  clerkUserId: string,
  clerkOrgId: string | null
): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set — auth.setup.ts cannot seed the local DB"
    );
  }
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    if (clerkOrgId) {
      await pool.query(
        `INSERT INTO organizations (id, name, slug, clerk_org_id, plan, brand_limit)
         VALUES ($1, $2, $3, $1, 'starter', 5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [clerkOrgId, E2E_TEST_ORG_NAME, `e2e-${clerkOrgId.toLowerCase()}`]
      );
    }

    await pool.query(
      `INSERT INTO users (id, clerk_user_id, organization_id, email, name, role)
       VALUES ($1, $1, $2, $3, 'E2E Tester', 'admin')
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, organization_id = EXCLUDED.organization_id`,
      [clerkUserId, clerkOrgId, E2E_TEST_EMAIL]
    );
  } finally {
    await pool.end();
  }
}

async function getExistingOrgForUser(userId: string): Promise<string | null> {
  const memberships = await clerkFetch<Array<{ organization: { id: string } }>>(
    `/users/${userId}/organization_memberships`
  );
  return memberships[0]?.organization.id ?? null;
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const user = await getOrCreateUser();
  const preExistingOrg = await getExistingOrgForUser(user.id);
  if (preExistingOrg) {
    await seedLocalDbRows(user.id, preExistingOrg);
  }

  const ticket = await mintSignInTicket(user.id);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${E2E_BASE_URL}/sign-in?__clerk_ticket=${ticket}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // The session either lands on /dashboard (if the user already has an org)
    // or on /sign-in/tasks/choose-organization (first-time user).
    await page.waitForURL(
      (url) =>
        url.pathname === "/dashboard" ||
        url.pathname.startsWith("/sign-in/tasks/choose-organization"),
      { timeout: 30_000 }
    );

    if (page.url().includes("/sign-in/tasks/choose-organization")) {
      await page.fill('input[name="name"]', E2E_TEST_ORG_NAME);
      await page.getByRole("button", { name: /continue/i }).click();
      await page.waitForURL(
        (url) => url.pathname === "/dashboard" || url.pathname.startsWith("/onboarding"),
        { timeout: 30_000 }
      );
    }

    // Fresh sign-up will bounce to /onboarding; skip to /dashboard to make sure
    // we saved a storage state that lands on the real shell.
    await page.goto(`${E2E_BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    // Now that we know the Clerk org id, seed/refresh the mirror rows in Neon.
    const postAuthOrgId = await getExistingOrgForUser(user.id);
    await seedLocalDbRows(user.id, postAuthOrgId);

    const storage = await context.storageState();
    writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storage, null, 2));
  } finally {
    await browser.close();
  }
}
