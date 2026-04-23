/**
 * Add a social-browser credential to the vault.
 *
 * Usage:
 *   npx tsx scripts/add-social-credential.ts
 *     --brand <brandId-or-domain> --platform <twitter|linkedin|reddit|...> --username <handle>
 *     [--profile-url <url>] [--user-agent <ua>] [--viewport 1366x768]
 *
 * Password and TOTP secret are prompted interactively (no shell history).
 *
 * Env required: DATABASE_URL, ENCRYPTION_KEY
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import * as readline from "node:readline";
import { Writable } from "node:stream";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
if (!process.env.ENCRYPTION_KEY) {
  console.error("ENCRYPTION_KEY not set (required for vault encryption)");
  process.exit(1);
}

type Args = {
  brand?: string;
  platform?: string;
  username?: string;
  profileUrl?: string;
  userAgent?: string;
  viewport?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--brand") out.brand = next;
    else if (a === "--platform") out.platform = next;
    else if (a === "--username") out.username = next;
    else if (a === "--profile-url") out.profileUrl = next;
    else if (a === "--user-agent") out.userAgent = next;
    else if (a === "--viewport") out.viewport = next;
  }
  return out;
}

function promptVisible(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const mutableStdout = new Writable({
      write(chunk, _enc, cb) {
        if (!(mutableStdout as unknown as { muted: boolean }).muted) {
          process.stdout.write(chunk, cb);
        } else {
          cb();
        }
      },
    });
    (mutableStdout as unknown as { muted: boolean }).muted = false;
    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });
    process.stdout.write(question);
    (mutableStdout as unknown as { muted: boolean }).muted = true;
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const { brands } = await import("../src/lib/db/schema");
  const { getDb } = await import("../src/lib/db");
  const { createCredential } = await import("../src/lib/social/browser");

  const args = parseArgs(process.argv.slice(2));

  const brandSelector = args.brand ?? (await promptVisible("Brand (id or domain): "));
  const platformInput = args.platform ?? (await promptVisible("Platform (twitter|linkedin|reddit|...): "));
  const username = args.username ?? (await promptVisible("Username/handle: "));

  const db = getDb();
  const brand = await db.query.brands.findFirst({
    where: brandSelector.startsWith("bra_") || brandSelector.length > 20
      ? eq(brands.id, brandSelector)
      : eq(brands.domain, brandSelector),
  });

  if (!brand) {
    console.error(`Brand not found: ${brandSelector}`);
    process.exit(1);
  }

  console.log(`Matched brand: ${brand.name} (${brand.domain}) — org ${brand.organizationId}`);

  const password = await promptHidden("Password: ");
  if (!password) {
    console.error("Password is required");
    process.exit(1);
  }
  const totpRaw = await promptHidden("TOTP secret (blank to skip): ");
  const totpSecret = totpRaw.trim() || undefined;

  const defaultUA =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  const viewport = args.viewport?.split("x").map(Number) ?? [1366, 768];

  const inserted = await createCredential({
    organizationId: brand.organizationId,
    brandId: brand.id,
    platform: platformInput as "twitter",
    username,
    password,
    totpSecret,
    profileUrl: args.profileUrl,
    userAgent: args.userAgent ?? defaultUA,
    viewportWidth: viewport[0],
    viewportHeight: viewport[1],
  });

  console.log(`\nCredential created: ${inserted.id}`);
  console.log(`  brand=${brand.name} platform=${inserted.platform} username=${inserted.username}`);
  console.log(`  status=${inserted.status} totp=${inserted.totpSecretEncrypted ? "yes" : "no"}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create credential:", err);
  process.exit(1);
});
