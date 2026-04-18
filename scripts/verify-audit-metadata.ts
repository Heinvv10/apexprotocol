import { db } from "../src/lib/db";
import { audits, recommendations } from "../src/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const capitecId = "cclvalb2orst7m8qhmf8z8s8";
  const capitec = await db.query.audits.findFirst({ where: eq(audits.id, capitecId) });
  if (!capitec) { console.log("Capitec audit missing"); return; }
  const meta = capitec.metadata as Record<string, unknown>;
  console.log("[capitec] aiReadiness:", meta.aiReadiness);
  console.log("[capitec] contentAnalysis:", meta.contentAnalysis);

  // Simulate hook math for Optimization + Suitability tiles
  const ca = (meta.contentAnalysis as any) ?? {};
  const ai = (meta.aiReadiness as any) ?? {};
  const wc = ca.averageWordCount ?? 0;
  const rb = ca.averageReadability ?? 0;
  const opt = [
    ca.faqSchemaFound ? 95 : ca.hasStructuredContent ? 60 : 25,
    ca.headingHierarchyValid ? 90 : 65,
    Math.min(100, Math.round((wc / 2000) * 100)),
    72, 65,
    ca.hasStructuredContent ? 85 : 70,
  ];
  const avgOpt = Math.round(opt.reduce((a, b) => a + b, 0) / opt.length);
  const suit = [
    ca.hasStructuredContent ? 90 : 60, 82, Math.round(rb),
    Math.min(100, Math.round((wc / 2000) * 100)), 75, 80,
  ];
  const avgSuit = Math.round(suit.reduce((a, b) => a + b, 0) / suit.length);
  console.log(`[capitec] computed: Citation=${Math.round(ai.score * 0.93)} Optimization=${avgOpt} Suitability=${avgSuit}`);
  console.log(`[capitec] any NaN? opt=${opt.includes(NaN)} suit=${suit.includes(NaN)}`);

  // Recommendations count across three audits
  const ids = ["cclvalb2orst7m8qhmf8z8s8", "cck0uvihtpavz1pybjlgfryw", "cch87isxzpnrnnzu7loo3pio"];
  const recs = await db.select().from(recommendations).where(inArray(recommendations.auditId, ids));
  console.log(`[recommendations] count across the 3 audits: ${recs.length}`);
  const byAudit = recs.reduce<Record<string, number>>((acc, r) => {
    const k = r.auditId ?? "null";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log("[recommendations] by auditId:", byAudit);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
