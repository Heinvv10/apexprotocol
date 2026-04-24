/**
 * Seed Apex GEO as a managed brand in the Apex DB (so apex-linkedin can
 * resolve its LinkedIn credential via findCredential(brandId, 'linkedin', ...)).
 *
 * Usage (on Velo against apexgeo-supabase-db):
 *   DATABASE_URL=postgresql://postgres:PASS@apexgeo-supabase-db:5432/apexgeo \
 *   ORG_ID=<your-org-id> \
 *   SOURCE_CREDENTIAL_BRAND_ID=<brightsphere-brand-id-or-blank> \
 *   bun run scripts/add-apex-geo-managed-brand.ts
 *
 * Idempotent: re-running is a no-op once the brand + mirrored credential
 * exist.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { db } from "@/lib/db";
import { brands, organizations } from "@/lib/db/schema";
import { socialBrowserCredentials } from "@/lib/db/schema/social-browser-auth";
import { and, eq } from "drizzle-orm";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const ORG_ID = process.env.ORG_ID;
const SOURCE_CREDENTIAL_BRAND_ID = process.env.SOURCE_CREDENTIAL_BRAND_ID;
const JARVIS_USERNAME = process.env.JARVIS_USERNAME ?? "jarvis@h10.co.za";

if (!ORG_ID) {
  console.error(
    "ERROR: ORG_ID env var is required (the Apex organization that will own the Apex GEO managed-brand record).",
  );
  process.exit(1);
}

const APEX_GEO_LINKEDIN_COMPANY_ID = "110656303";

const APEX_GEO_BRAND = {
  name: "Apex GEO",
  domain: "apexgeo.app",
  tagline:
    "Visibility in the AI era — audit how ChatGPT, Claude, Perplexity & Gemini see your brand.",
  description:
    "ApexGEO is the visibility platform for the AI era. We show brands how ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, and Meta AI see them today — and what to change so they start citing you tomorrow. Classic SEO optimised for ten blue links. Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) optimise for a very different reader: the LLM that summarises the answer before the user clicks anything. Built for B2B SaaS, agencies, and brand teams who are tired of guessing why AI engines talk about competitors and not them. White-label ready. PPP-priced for African markets. Audit. Action. Visibility.",
  industry: "Technology, Information and Internet",
  logoUrl:
    "https://media.licdn.com/dms/image/v2/D4D0BAQELWkV7oLCH1g/company-logo_200_200/B4DZ265Db1JYAM-/0/1776957012244/apex_geo_logo",
  keywords: [
    "generative engine optimization",
    "answer engine optimization",
    "geo",
    "aeo",
    "ai seo",
    "llm visibility",
    "ai citations",
  ],
  seoKeywords: [
    "generative engine optimization platform",
    "answer engine optimization saas",
    "ai search visibility",
    "brand monitoring chatgpt",
    "brand monitoring perplexity",
    "ai readiness audit",
  ],
  geoKeywords: [
    "best generative engine optimization platform",
    "how to rank in chatgpt",
    "how to get cited by perplexity",
    "claude citations for brands",
    "ai search optimization south africa",
  ],
  competitors: [
    { name: "Profound", url: "tryprofound.com", reason: "AI visibility analytics" },
    { name: "Peec AI", url: "peec.ai", reason: "LLM brand monitoring" },
    { name: "Searchable.ai", url: "searchable.ai", reason: "AI search optimization" },
    { name: "Writer", url: "writer.com", reason: "Enterprise AI content with optimization" },
    { name: "Otterly.AI", url: "otterly.ai", reason: "AI chatbot monitoring" },
  ],
  locations: [
    {
      type: "headquarters" as const,
      address: "Cape Town",
      city: "Cape Town",
      state: "Western Cape",
      country: "South Africa",
      postalCode: "8001",
    },
  ],
  valuePropositions: [
    "Track brand mentions across 7+ AI platforms",
    "Audit technical AI readiness (schema, E-E-A-T, citations)",
    "Prioritised action plan your team can actually ship",
    "White-label ready for agencies",
    "PPP-adjusted pricing for African markets",
    "Dashboard-first UX (not chat-based)",
  ],
  socialLinks: {
    linkedin: "https://www.linkedin.com/company/apex-geo",
    linkedinCompanyId: APEX_GEO_LINKEDIN_COMPANY_ID,
    website: "https://apexgeo.app",
  },
  voice: {
    tone: "authoritative" as const,
    personality: ["data-forward", "precise", "audit-grade", "ship-something-today"],
    targetAudience: "B2B SaaS marketers, agencies, and brand teams losing AI-search share",
    keyMessages: [
      "Classic SEO optimised for ten blue links. GEO optimises for the LLM reader.",
      "We audited X sites — here's what broke.",
      "Visibility in the AI era is measured, not hoped for.",
      "Audit. Action. Visibility.",
    ],
    avoidTopics: [],
  },
  visual: {
    primaryColor: "#00E5CC",
    secondaryColor: "#8B5CF6",
    accentColor: "#141930",
    colorPalette: ["#0a0f1a", "#141930", "#00E5CC", "#8B5CF6", "#22C55E"],
    fontFamily: "Inter",
  },
};

async function main(): Promise<void> {
  console.log(`Seeding Apex GEO managed brand under organization ${ORG_ID}\n`);

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, ORG_ID!),
  });
  if (!org) {
    console.error(`ERROR: organization ${ORG_ID} not found.`);
    process.exit(1);
  }
  console.log(`Organization: ${org.name} (${org.id})`);

  const existing = await db.query.brands.findFirst({
    where: and(
      eq(brands.organizationId, ORG_ID!),
      eq(brands.domain, APEX_GEO_BRAND.domain),
    ),
  });

  let apexBrandId: string;

  if (existing) {
    console.log(`⏭  Apex GEO brand already exists: ${existing.id} — will reuse.`);
    apexBrandId = existing.id;
  } else {
    const [inserted] = await db
      .insert(brands)
      .values({
        organizationId: ORG_ID!,
        isBenchmark: false,
        ...APEX_GEO_BRAND,
      })
      .returning();
    if (!inserted) {
      throw new Error("Insert returned no row");
    }
    apexBrandId = inserted.id;
    console.log(`✅ Inserted Apex GEO brand: ${inserted.id}`);
  }

  if (!SOURCE_CREDENTIAL_BRAND_ID) {
    console.log(
      "\nSOURCE_CREDENTIAL_BRAND_ID not set — skipping credential mirror.",
    );
    console.log(
      "You can re-run with SOURCE_CREDENTIAL_BRAND_ID=<brightsphere-brand-id> to copy the Jarvis LinkedIn credential.",
    );
    return;
  }

  const sourceCred = await db.query.socialBrowserCredentials.findFirst({
    where: and(
      eq(socialBrowserCredentials.brandId, SOURCE_CREDENTIAL_BRAND_ID),
      eq(socialBrowserCredentials.platform, "linkedin"),
      eq(socialBrowserCredentials.username, JARVIS_USERNAME),
    ),
  });

  if (!sourceCred) {
    console.error(
      `\nERROR: no LinkedIn credential found for brand ${SOURCE_CREDENTIAL_BRAND_ID} / username ${JARVIS_USERNAME}. Aborting credential mirror.`,
    );
    process.exit(2);
  }

  const mirror = await db.query.socialBrowserCredentials.findFirst({
    where: and(
      eq(socialBrowserCredentials.brandId, apexBrandId),
      eq(socialBrowserCredentials.platform, "linkedin"),
      eq(socialBrowserCredentials.username, JARVIS_USERNAME),
    ),
  });

  if (mirror) {
    console.log(
      `⏭  LinkedIn credential already mirrored for Apex GEO brand (${mirror.id}) — no-op.`,
    );
    return;
  }

  await db.insert(socialBrowserCredentials).values({
    organizationId: sourceCred.organizationId,
    brandId: apexBrandId,
    platform: "linkedin",
    username: sourceCred.username,
    profileUrl: sourceCred.profileUrl,
    passwordEncrypted: sourceCred.passwordEncrypted,
    totpSecretEncrypted: sourceCred.totpSecretEncrypted,
    userAgent: sourceCred.userAgent,
    viewportWidth: sourceCred.viewportWidth,
    viewportHeight: sourceCred.viewportHeight,
    status: sourceCred.status,
  });

  console.log(
    `✅ Mirrored Jarvis LinkedIn credential from ${SOURCE_CREDENTIAL_BRAND_ID} → ${apexBrandId}`,
  );
  console.log("\nDone. apex-linkedin can now post to the Apex GEO Page via:");
  console.log(
    `  composePagePost(page, credential, { text, imagePath }, '${APEX_GEO_LINKEDIN_COMPANY_ID}', ...)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
