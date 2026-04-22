/**
 * Standalone verification for the 4 audit-UX improvements.
 *
 * Runs the new modules against the existing IsaFlow audit without
 * touching the running apex-app container. Demonstrates that each
 * change produces the expected output on real data.
 *
 * Usage: DATABASE_URL=... tsx scripts/verify-audit-enhancements.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brandMentions, brands } from "@/lib/db/schema";
import { projectExpectedImpact } from "@/lib/audit/expected-impact";
import { generateSchemaCodeForIssue } from "@/lib/audit/generators/schema-jsonld";
import { buildActionPlan } from "@/lib/recommendations/action-plan";

const BRAND_ID = "fstvkq2ms2m92vlme7yf7nnb";

async function main() {
  console.log("=== Verifying audit-UX enhancements ===\n");

  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, BRAND_ID),
  });
  if (!brand) throw new Error("Brand not found");
  console.log(`Brand: ${brand.name} (${brand.domain})\n`);

  const audit = await db.query.audits.findFirst({
    where: and(eq(audits.brandId, BRAND_ID), eq(audits.status, "completed")),
    orderBy: [desc(audits.completedAt)],
  });
  if (!audit) throw new Error("No completed audit");
  console.log(
    `Audit: ${audit.id} — overallScore ${audit.overallScore}, ${audit.issueCount} issues\n`,
  );

  // Change 3 — expected score impact
  console.log("── Change 3: projectExpectedImpact ──");
  const impactMap = projectExpectedImpact({
    issues: audit.issues ?? [],
    categoryScores: audit.categoryScores ?? [],
  });
  const issuesWithImpact = (audit.issues ?? [])
    .map((i) => ({
      title: i.title,
      severity: i.severity,
      impact: impactMap.get(i.id) ?? 0,
    }))
    .sort((a, b) => b.impact - a.impact);
  console.table(issuesWithImpact);

  // Change 2 — JSON-LD snippets for schema findings
  console.log("\n── Change 2: schema JSON-LD generation ──");
  for (const issue of audit.issues ?? []) {
    const code = generateSchemaCodeForIssue(issue.title, brand);
    if (code) {
      console.log(`\n  ✓ ${issue.title} → snippet (${code.length} chars)`);
      console.log(
        code
          .split("\n")
          .slice(0, 6)
          .map((l) => `     ${l}`)
          .join("\n"),
      );
      console.log("     ...");
    }
  }

  // Change 4 — action plan
  console.log("\n── Change 4: buildActionPlan ──");
  const mentions = await db
    .select({
      platform: brandMentions.platform,
      sentiment: brandMentions.sentiment,
      position: brandMentions.position,
    })
    .from(brandMentions)
    .where(eq(brandMentions.brandId, BRAND_ID))
    .orderBy(desc(brandMentions.timestamp))
    .limit(100);
  const groups = new Map<
    string,
    { total: number; recognised: number; sentiments: string[] }
  >();
  for (const m of mentions) {
    const g = groups.get(m.platform) ?? {
      total: 0,
      recognised: 0,
      sentiments: [],
    };
    g.total += 1;
    if (m.position !== null) g.recognised += 1;
    if (m.sentiment) g.sentiments.push(m.sentiment);
    groups.set(m.platform, g);
  }
  const platformSignals = Array.from(groups.entries()).map(([platform, g]) => {
    const neg = g.sentiments.filter((s) => s === "negative").length;
    const pos = g.sentiments.filter((s) => s === "positive").length;
    const unrec = g.sentiments.filter((s) => s === "unrecognized").length;
    const dominant =
      unrec > g.total / 3
        ? ("unrecognized" as const)
        : neg > pos
          ? ("negative" as const)
          : pos > neg
            ? ("positive" as const)
            : ("neutral" as const);
    return {
      platform,
      mentionRate: Math.round((g.recognised / Math.max(g.total, 1)) * 100),
      sentiment: dominant,
    };
  });
  console.log("Platform signals:");
  console.table(platformSignals);

  const plan = buildActionPlan({
    issues: audit.issues ?? [],
    expectedImpactById: impactMap,
    platformSignals,
  });
  console.log("\nAction plan:");
  for (const item of plan) {
    console.log(`  ${item.rank}. ${item.title}`);
    console.log(`     ${item.reason}`);
    if (item.expectedScoreImpact)
      console.log(`     Expected lift: +${item.expectedScoreImpact} pts`);
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
