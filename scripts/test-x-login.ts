/**
 * Supervised X (Twitter) login test.
 *
 * Launches a headful browser, reads a credential from the vault, drives the
 * login flow, then pauses for you to visually inspect the logged-in state.
 * Abort with Ctrl+C.
 *
 * Usage:
 *   npx tsx scripts/test-x-login.ts --credential <credentialId>
 *   npx tsx scripts/test-x-login.ts --brand <brandIdOrDomain> --username <handle>
 *
 * Env required: DATABASE_URL, ENCRYPTION_KEY
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
if (!process.env.ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

type Args = { credential?: string; brand?: string; username?: string };

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const next = argv[i + 1];
    if (argv[i] === "--credential") out.credential = next;
    else if (argv[i] === "--brand") out.brand = next;
    else if (argv[i] === "--username") out.username = next;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { brands } = await import("../src/lib/db/schema");
  const { getDb } = await import("../src/lib/db");
  const browserMod = await import("../src/lib/social/browser");
  const { loginToX } = await import("../src/lib/social/x");
  const { getCredential, findCredential, launchSocialBrowser } = browserMod;
  type Credential = Awaited<ReturnType<typeof getCredential>>;

  const db = getDb();

  let credential: Credential;
  if (args.credential) {
    credential = await getCredential(args.credential);
  } else if (args.brand && args.username) {
    const brand = await db.query.brands.findFirst({
      where:
        args.brand.length > 20
          ? eq(brands.id, args.brand)
          : eq(brands.domain, args.brand),
    });
    if (!brand) throw new Error(`Brand not found: ${args.brand}`);
    credential = await findCredential(brand.id, "twitter", args.username);
  } else {
    console.error(
      "Provide --credential <id> OR --brand <idOrDomain> --username <handle>",
    );
    process.exit(1);
  }

  if (!credential) throw new Error("Credential not found");
  console.log(
    `Using credential ${credential.id} — brand=${credential.brandId} username=${credential.username}`,
  );

  const browser = await launchSocialBrowser({
    headless: false,
    userAgent: credential.userAgent,
    viewport: { width: credential.viewportWidth, height: credential.viewportHeight },
  });
  const [page] = await browser.pages();

  try {
    const result = await loginToX(browser, page, credential);
    console.log("Login result:", result);
    console.log(
      "\nBrowser will stay open for 60s so you can visually confirm. Ctrl+C to close sooner.",
    );
    await new Promise((r) => setTimeout(r, 60_000));
  } catch (err) {
    console.error("Login failed:", err);
  } finally {
    await browser.close();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
