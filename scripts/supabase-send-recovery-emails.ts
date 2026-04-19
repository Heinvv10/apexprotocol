/**
 * Send password-reset magic-links to all users migrated from Clerk.
 * Clerk bcrypt hashes are not portable to Supabase, so every migrated user
 * must set a new password on first login. This script triggers that email.
 *
 * Part of Sprint 0 Neon+Clerk → Supabase migration (TR-MIG-002).
 * See: docs/infra/supabase-migration-runbook.md §5.3
 *
 * Usage:
 *   npx tsx scripts/supabase-send-recovery-emails.ts [--dry-run] [--limit=50] [--since=2026-04-19T00:00:00Z]
 *
 * Safe to re-run; tracks which users have been emailed in the mapping table.
 * Rate-limit friendly: 1 email/second by default.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error(
    "ERROR: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL required."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
const sinceArg = args.find((a) => a.startsWith("--since="));
const since = sinceArg?.split("=")[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const pool = new Pool({ connectionString: DATABASE_URL });

async function ensureEmailedColumn() {
  if (dryRun) return;
  await pool.query(`
    ALTER TABLE clerk_to_supabase_migration
    ADD COLUMN IF NOT EXISTS recovery_emailed_at TIMESTAMPTZ
  `);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Send Supabase password-recovery emails");
  console.log("=".repeat(60));
  console.log(`Dry-run: ${dryRun}`);
  console.log(`Limit:   ${limit === Infinity ? "no limit" : limit}`);
  console.log("");

  await ensureEmailedColumn();

  const filters: string[] = ["recovery_emailed_at IS NULL"];
  const params: unknown[] = [];
  if (since) {
    params.push(since);
    filters.push(`migrated_at >= $${params.length}`);
  }

  const res = await pool.query<{
    clerk_user_id: string;
    supabase_user_id: string;
    email: string;
  }>(
    `SELECT clerk_user_id, supabase_user_id, email
     FROM clerk_to_supabase_migration
     WHERE ${filters.join(" AND ")}
     ORDER BY migrated_at ASC
     LIMIT ${Number.isFinite(limit) ? limit : 100000}`,
    params
  );

  console.log(`Pending users: ${res.rows.length}`);
  if (res.rows.length === 0) {
    console.log("Nothing to do.");
    await pool.end();
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const row of res.rows) {
    try {
      if (!dryRun) {
        const { error } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: row.email,
        });
        if (error) throw error;
        await pool.query(
          `UPDATE clerk_to_supabase_migration
           SET recovery_emailed_at = NOW()
           WHERE clerk_user_id = $1`,
          [row.clerk_user_id]
        );
      }
      sent++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${row.email}: ${(err as Error).message}`);
    }

    process.stdout.write(
      `  progress: sent=${sent} failed=${failed} / ${res.rows.length}\r`
    );

    // rate-limit: 1/sec to be kind to GoTrue + SMTP
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  process.stdout.write("\n");

  console.log("");
  console.log(`✓ Sent:   ${sent}`);
  console.log(`✗ Failed: ${failed}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("✗ Script failed:", err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
