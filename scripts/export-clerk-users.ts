/**
 * Export all Clerk users + organizations + memberships to a JSON file.
 *
 * Part of Sprint 0 Neon+Clerk → Supabase migration (TR-MIG-002).
 * See: docs/infra/supabase-migration-runbook.md §5.1
 *
 * Usage:
 *   npx tsx scripts/export-clerk-users.ts [--output=/tmp/clerk-export.json] [--dry-run]
 *
 * Output: JSON file with { exportedAt, users[], organizations[], memberships[] }
 * Safe to re-run — idempotent, read-only against Clerk.
 */

import { config } from "dotenv";
import { writeFileSync, existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";

config({ path: ".env.local" });

const CLERK_API = "https://api.clerk.com/v1";

if (!process.env.CLERK_SECRET_KEY) {
  console.error("ERROR: CLERK_SECRET_KEY not found in .env.local");
  process.exit(1);
}
const CLERK_SECRET_KEY: string = process.env.CLERK_SECRET_KEY;

const args = process.argv.slice(2);
const outputArg = args.find((a) => a.startsWith("--output="));
const outputPath = resolve(outputArg?.split("=")[1] ?? "/tmp/clerk-export.json");
const dryRun = args.includes("--dry-run");

type ClerkUser = {
  id: string;
  email_addresses: Array<{
    email_address: string;
    verification: { status: string } | null;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
  last_sign_in_at: number | null;
  banned: boolean;
  external_accounts: Array<{
    provider: string;
    external_id: string;
    email_address: string | null;
  }>;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
};

type ClerkOrg = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  members_count: number;
  created_at: number;
  updated_at: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
};

type ClerkMembership = {
  id: string;
  role: string;
  public_user_data: { user_id: string } | null;
  organization: { id: string };
  created_at: number;
};

async function clerkFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CLERK_API}${path}`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clerk API ${res.status} on ${path}: ${body}`);
  }
  return (await res.json()) as T;
}

async function paginate<T>(path: string, label: string): Promise<T[]> {
  const all: T[] = [];
  const limit = 500;
  let offset = 0;
  let page = 1;

  while (true) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${path}${sep}limit=${limit}&offset=${offset}`;
    const batch = await clerkFetch<T[]>(url);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    process.stdout.write(`  ${label}: page ${page} → ${all.length} total\r`);
    if (batch.length < limit) break;
    offset += limit;
    page += 1;
  }
  process.stdout.write("\n");
  return all;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Clerk Export — Sprint 0 migration");
  console.log("=".repeat(60));
  console.log(`Output: ${outputPath}`);
  console.log(`Dry-run: ${dryRun}`);
  console.log("");

  if (!dryRun && existsSync(outputPath)) {
    const backup = `${outputPath}.${Date.now()}.bak`;
    console.log(`Existing output found; backing up to ${backup}`);
    renameSync(outputPath, backup);
  }

  console.log("[1/3] Exporting users…");
  const users = await paginate<ClerkUser>("/users?order_by=-created_at", "users");
  console.log(`     ✓ ${users.length} users`);

  console.log("[2/3] Exporting organizations…");
  const orgs = await paginate<ClerkOrg>("/organizations?order_by=-created_at", "orgs");
  console.log(`     ✓ ${orgs.length} organizations`);

  console.log("[3/3] Exporting memberships per org…");
  const memberships: Array<
    ClerkMembership & { organization_id: string }
  > = [];
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    const ms = await clerkFetch<ClerkMembership[]>(
      `/organizations/${org.id}/memberships?limit=500`
    );
    memberships.push(
      ...ms.map((m) => ({ ...m, organization_id: org.id }))
    );
    process.stdout.write(
      `  memberships: org ${i + 1}/${orgs.length} → ${memberships.length} total\r`
    );
  }
  process.stdout.write("\n");
  console.log(`     ✓ ${memberships.length} memberships`);

  const payload = {
    exportedAt: new Date().toISOString(),
    clerkInstanceRef: CLERK_SECRET_KEY.slice(0, 8) + "…",
    counts: {
      users: users.length,
      organizations: orgs.length,
      memberships: memberships.length,
    },
    users: users.map((u) => ({
      clerk_user_id: u.id,
      email: u.email_addresses[0]?.email_address ?? null,
      all_emails: u.email_addresses.map((e) => e.email_address),
      email_verified:
        u.email_addresses[0]?.verification?.status === "verified",
      first_name: u.first_name,
      last_name: u.last_name,
      image_url: u.image_url,
      created_at: new Date(u.created_at).toISOString(),
      updated_at: new Date(u.updated_at).toISOString(),
      last_sign_in_at: u.last_sign_in_at
        ? new Date(u.last_sign_in_at).toISOString()
        : null,
      banned: u.banned,
      external_accounts: u.external_accounts.map((ea) => ({
        provider: ea.provider,
        external_id: ea.external_id,
        email: ea.email_address,
      })),
      public_metadata: u.public_metadata,
      private_metadata: u.private_metadata,
    })),
    organizations: orgs.map((o) => ({
      clerk_org_id: o.id,
      name: o.name,
      slug: o.slug,
      image_url: o.image_url,
      members_count: o.members_count,
      created_at: new Date(o.created_at).toISOString(),
      updated_at: new Date(o.updated_at).toISOString(),
      public_metadata: o.public_metadata,
      private_metadata: o.private_metadata,
    })),
    memberships: memberships.map((m) => ({
      clerk_user_id: m.public_user_data?.user_id ?? null,
      clerk_org_id: m.organization_id,
      role: m.role,
      created_at: new Date(m.created_at).toISOString(),
    })),
  };

  const withoutEmail = payload.users.filter((u) => !u.email);
  const orphanMemberships = payload.memberships.filter(
    (m) => !m.clerk_user_id
  );

  console.log("");
  console.log("Summary:");
  console.log(`  Users:           ${payload.users.length}`);
  console.log(`  Users no email:  ${withoutEmail.length}  ${withoutEmail.length ? "⚠  (will be skipped on import)" : ""}`);
  console.log(`  Organizations:   ${payload.organizations.length}`);
  console.log(`  Memberships:     ${payload.memberships.length}`);
  console.log(`  Orphan mem:      ${orphanMemberships.length}  ${orphanMemberships.length ? "⚠" : ""}`);
  console.log("");

  if (dryRun) {
    console.log("DRY RUN — not writing file.");
    return;
  }

  writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`✓ Written to ${outputPath}`);
  console.log("");
  console.log("Next step:");
  console.log(`  npx tsx scripts/import-to-supabase-auth.ts --input=${outputPath} --dry-run`);
}

main().catch((err) => {
  console.error("");
  console.error("✗ Export failed:", err.message);
  process.exit(1);
});
