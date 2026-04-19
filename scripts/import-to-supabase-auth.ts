/**
 * Import Clerk export JSON into Supabase Auth (auth.users) and set up
 * the clerk_to_supabase_migration mapping table.
 *
 * Part of Sprint 0 Neon+Clerk → Supabase migration (TR-MIG-002).
 * See: docs/infra/supabase-migration-runbook.md §5.2
 *
 * Usage:
 *   npx tsx scripts/import-to-supabase-auth.ts --input=/tmp/clerk-export.json [--dry-run] [--resume]
 *
 * Idempotent: safe to re-run. Uses the mapping table to skip already-migrated users.
 *
 * REQUIRED env vars (in .env.local):
 *   SUPABASE_URL                    — e.g. https://api.apex.dev
 *   SUPABASE_SERVICE_ROLE_KEY       — admin key, NEVER ship to client
 *   DATABASE_URL                    — direct Postgres connection to Supabase
 *
 * NOTE: This script does NOT migrate password hashes. All users get a magic-link
 * on first login after cutover. OAuth users auto-link by email match.
 */

import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error("ERROR: Missing env vars. Required:");
  console.error("  SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  console.error("  DATABASE_URL");
  process.exit(1);
}

const args = process.argv.slice(2);
const inputArg = args.find((a) => a.startsWith("--input="));
const inputPath = inputArg?.split("=")[1] ?? "/tmp/clerk-export.json";
const dryRun = args.includes("--dry-run");
const resume = args.includes("--resume");

if (!existsSync(inputPath)) {
  console.error(`ERROR: Input file not found: ${inputPath}`);
  console.error("Run scripts/export-clerk-users.ts first.");
  process.exit(1);
}

type ExportUser = {
  clerk_user_id: string;
  email: string | null;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  external_accounts: Array<{
    provider: string;
    external_id: string;
    email: string | null;
  }>;
  public_metadata: Record<string, unknown>;
};

type ExportOrg = {
  clerk_org_id: string;
  name: string;
  slug: string | null;
};

type ExportMembership = {
  clerk_user_id: string | null;
  clerk_org_id: string;
  role: string;
};

type Payload = {
  users: ExportUser[];
  organizations: ExportOrg[];
  memberships: ExportMembership[];
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pool = new Pool({ connectionString: DATABASE_URL });

async function ensureMappingTable() {
  if (dryRun) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clerk_to_supabase_migration (
      clerk_user_id   TEXT PRIMARY KEY,
      supabase_user_id UUID NOT NULL UNIQUE,
      email           TEXT NOT NULL,
      migrated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      retain_until    DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days')
    );
    CREATE INDEX IF NOT EXISTS idx_clerk_map_email
      ON clerk_to_supabase_migration (email);
  `);
}

async function alreadyMigrated(clerkUserId: string): Promise<string | null> {
  const res = await pool.query<{ supabase_user_id: string }>(
    "SELECT supabase_user_id FROM clerk_to_supabase_migration WHERE clerk_user_id = $1",
    [clerkUserId]
  );
  return res.rows[0]?.supabase_user_id ?? null;
}

async function findSupabaseUserByEmail(
  email: string
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const users = data.users as Array<{ id: string; email?: string | null }>;
  const match = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  return match?.id ?? null;
}

async function importUser(user: ExportUser): Promise<{
  clerk_user_id: string;
  supabase_user_id: string | null;
  status: "created" | "linked" | "skipped" | "failed";
  error?: string;
}> {
  if (!user.email) {
    return {
      clerk_user_id: user.clerk_user_id,
      supabase_user_id: null,
      status: "skipped",
      error: "no email",
    };
  }

  if (resume) {
    const existing = await alreadyMigrated(user.clerk_user_id);
    if (existing) {
      return {
        clerk_user_id: user.clerk_user_id,
        supabase_user_id: existing,
        status: "skipped",
        error: "already migrated (resume)",
      };
    }
  }

  if (dryRun) {
    return {
      clerk_user_id: user.clerk_user_id,
      supabase_user_id: "DRY-RUN",
      status: "created",
    };
  }

  const { data: created, error } = await supabase.auth.admin.createUser({
    email: user.email,
    email_confirm: user.email_verified,
    user_metadata: {
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.image_url,
      migrated_from_clerk: true,
      clerk_user_id: user.clerk_user_id,
      original_created_at: user.created_at,
    },
    app_metadata: {
      providers: user.external_accounts.map((ea) => ea.provider),
      banned: user.banned,
      ...user.public_metadata,
    },
  });

  if (error) {
    const emailTaken =
      error.message?.toLowerCase().includes("already") ||
      error.status === 422;

    if (emailTaken) {
      const existingId = await findSupabaseUserByEmail(user.email);
      if (existingId) {
        await pool.query(
          `INSERT INTO clerk_to_supabase_migration
           (clerk_user_id, supabase_user_id, email)
           VALUES ($1, $2, $3)
           ON CONFLICT (clerk_user_id) DO NOTHING`,
          [user.clerk_user_id, existingId, user.email]
        );
        return {
          clerk_user_id: user.clerk_user_id,
          supabase_user_id: existingId,
          status: "linked",
        };
      }
    }

    return {
      clerk_user_id: user.clerk_user_id,
      supabase_user_id: null,
      status: "failed",
      error: error.message,
    };
  }

  await pool.query(
    `INSERT INTO clerk_to_supabase_migration
     (clerk_user_id, supabase_user_id, email)
     VALUES ($1, $2, $3)
     ON CONFLICT (clerk_user_id) DO NOTHING`,
    [user.clerk_user_id, created.user!.id, user.email]
  );

  return {
    clerk_user_id: user.clerk_user_id,
    supabase_user_id: created.user!.id,
    status: "created",
  };
}

async function updateUsersTable() {
  if (dryRun) {
    console.log("[dry-run] Would update public.users.id from clerk → supabase");
    return;
  }

  // Update the public.users table to use Supabase auth.users.id as the primary ID.
  // Assumes public.users has a clerk_user_id column — if not, adapt to your schema.
  const res = await pool.query(`
    UPDATE public.users u
    SET id = m.supabase_user_id
    FROM clerk_to_supabase_migration m
    WHERE u.clerk_user_id = m.clerk_user_id
      AND u.id::text <> m.supabase_user_id::text
    RETURNING u.id
  `);
  console.log(`  Updated ${res.rowCount} rows in public.users`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Supabase Auth Import — Sprint 0 migration");
  console.log("=".repeat(60));
  console.log(`Input:         ${inputPath}`);
  console.log(`Supabase URL:  ${SUPABASE_URL}`);
  console.log(`Dry-run:       ${dryRun}`);
  console.log(`Resume:        ${resume}`);
  console.log("");

  const payload: Payload = JSON.parse(readFileSync(inputPath, "utf8"));
  console.log(
    `Loaded ${payload.users.length} users, ${payload.organizations.length} orgs, ${payload.memberships.length} memberships.`
  );
  console.log("");

  console.log("[1/3] Ensuring mapping table exists…");
  await ensureMappingTable();

  console.log("[2/3] Importing users…");
  const results = {
    created: 0,
    linked: 0,
    skipped: 0,
    failed: 0,
  };
  const failures: Array<{ clerk_user_id: string; error?: string }> = [];

  for (let i = 0; i < payload.users.length; i++) {
    const user = payload.users[i];
    const result = await importUser(user);
    results[result.status]++;
    if (result.status === "failed") {
      failures.push({ clerk_user_id: result.clerk_user_id, error: result.error });
    }
    if ((i + 1) % 25 === 0 || i === payload.users.length - 1) {
      process.stdout.write(
        `  ${i + 1}/${payload.users.length} — created:${results.created} linked:${results.linked} skipped:${results.skipped} failed:${results.failed}\r`
      );
    }
  }
  process.stdout.write("\n");

  console.log("[3/3] Updating public.users.id from Clerk IDs → Supabase UUIDs…");
  await updateUsersTable();

  console.log("");
  console.log("Results:");
  console.log(`  Created:   ${results.created}`);
  console.log(`  Linked:    ${results.linked} (existing Supabase user, mapping added)`);
  console.log(`  Skipped:   ${results.skipped}`);
  console.log(`  Failed:    ${results.failed}`);

  if (failures.length) {
    console.log("");
    console.log("Failures:");
    for (const f of failures.slice(0, 20)) {
      console.log(`  ${f.clerk_user_id}: ${f.error ?? "unknown"}`);
    }
    if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
  }

  if (!dryRun) {
    console.log("");
    console.log("Next step:");
    console.log(
      "  Send password-reset emails to migrated users (they need to set a new password since bcrypt hashes are not portable)."
    );
    console.log("  Example (run once):");
    console.log("    npx tsx scripts/supabase-send-recovery-emails.ts");
    console.log("");
    console.log("  Verify with:");
    console.log(
      "    psql $DATABASE_URL -c 'SELECT COUNT(*) FROM clerk_to_supabase_migration;'"
    );
  }

  await pool.end();
  process.exit(failures.length > 0 && !dryRun ? 1 : 0);
}

main().catch(async (err) => {
  console.error("");
  console.error("✗ Import failed:", err.message);
  console.error(err.stack);
  await pool.end().catch(() => {});
  process.exit(1);
});
