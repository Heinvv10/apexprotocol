/**
 * One-shot: enqueue an audit for IsaFlow through the same path the
 * POST /api/audit endpoint uses, then rely on the minute-cron to pick
 * it up. Created row + queued job match the normal production flow.
 */

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { addAuditJob } from "@/lib/queue";

const BRAND_ID = "fstvkq2ms2m92vlme7yf7nnb";
const ORG_ID = "user_user_3BZjc3P1QwE6rxKtv7PH4WKzOEa";
const URL = "https://isaflow.co.za";

async function main() {
  const auditId = createId();
  await db.insert(audits).values({
    id: auditId,
    brandId: BRAND_ID,
    url: URL,
    status: "pending",
    startedAt: new Date(),
    metadata: {
      depth: "homepage",
      priority: "high",
      options: {},
    },
  });
  console.log(`Inserted audit row: ${auditId}`);

  const job = await addAuditJob(BRAND_ID, ORG_ID, URL, {
    depth: 1,
    maxPages: 1,
    priority: 1,
  });
  console.log(`Queued job: ${job.id}`);
  console.log("Worker will pick it up within ~1 min (cron: /api/cron/audit)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
