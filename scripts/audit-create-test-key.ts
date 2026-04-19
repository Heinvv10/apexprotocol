/**
 * Create a test API key for Apex Demo Company so we can E2E the API surface.
 * Prints the raw key once; it's then stored encrypted + hashed. Safe to
 * run repeatedly — creates a fresh key each time.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { apiKeys } from "../src/lib/db/schema";
import {
  generateApiKey,
  hashApiKey,
} from "../src/lib/crypto/key-generation";
import { encryptApiKey } from "../src/lib/crypto/api-key-encryption";
import { createId } from "@paralleldrive/cuid2";

const ORG_ID = "aas1zs4jmuoa9q840gzmrh4n"; // Apex Demo Company
const USER_ID = "rti2wjo4qgesx4fdr52517mp"; // admin@apex-demo.com

async function main() {
  const { key } = await generateApiKey();
  const keyHash = await hashApiKey(key);
  const encryptedKey = encryptApiKey(key);

  const [inserted] = await db
    .insert(apiKeys)
    .values({
      id: createId(),
      organizationId: ORG_ID,
      userId: USER_ID,
      name: `e2e-audit-key-${Date.now()}`,
      displayName: "E2E Audit Test Key",
      type: "user",
      encryptedKey,
      keyHash,
      isActive: true,
    })
    .returning({ id: apiKeys.id, name: apiKeys.name });

  console.log(JSON.stringify({
    id: inserted.id,
    name: inserted.name,
    organizationId: ORG_ID,
    userId: USER_ID,
    key,
    prefix: key.slice(0, 16),
  }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  console.error(err.stack);
  process.exit(1);
});
