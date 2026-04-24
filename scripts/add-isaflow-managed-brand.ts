/**
 * Seed ISAFlow as a managed brand in the Apex DB.
 *
 * Usage (on Velo against apexgeo-supabase-db):
 *   DATABASE_URL=postgresql://postgres:PASS@apexgeo-supabase-db:5432/apexgeo \
 *   ORG_ID=<your-org-id> \
 *   SOURCE_CREDENTIAL_BRAND_ID=<brightsphere-brand-id-or-blank> \
 *   bun run scripts/add-isaflow-managed-brand.ts
 *
 * What it does:
 *   1. Inserts an ISAFlow brand row under ORG_ID (if not already present by domain).
 *   2. If SOURCE_CREDENTIAL_BRAND_ID is set and that brand has a LinkedIn
 *      Jarvis credential, copies the encrypted rows into the new ISAFlow brand
 *      so apex-linkedin's findCredential(brandId, 'linkedin', username) works
 *      for ISAFlow. No plaintext ever leaves the DB.
 *
 * Idempotent: re-running is a no-op once ISAFlow exists and the credential is
 * mirrored.
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
    "ERROR: ORG_ID env var is required (the Apex organization that will own the ISAFlow brand).",
  );
  process.exit(1);
}

const ISAFLOW_LINKEDIN_COMPANY_ID = "115783482";

const ISAFLOW_BRAND = {
  name: "ISAFlow",
  domain: "isaflow.co.za",
  tagline:
    "South Africa's most comprehensive cloud accounting platform — built on International Standards on Auditing.",
  description:
    "ISAFlow is South Africa's most comprehensive cloud accounting platform — built from the ground up on International Standards on Auditing (ISA) and SA tax law. Designed for SA businesses, accountants, and audit firms, ISAFlow unifies core accounting, VAT and tax compliance, payroll with SARS filing (EMP201/EMP501, IRP5/IT3), fixed-asset depreciation (IAS 16), loan amortisation, practice management with billable hours and WIP billing, and multi-company consolidation — in a single, audit-ready workflow.",
  industry: "Accounting",
  logoUrl: "https://media.licdn.com/dms/image/v2/D4D0BAQEdswgbT1sKbg/company-logo_200_200/0/1776963000000/isaflow_logo",
  keywords: [
    "isaflow",
    "cloud accounting",
    "south african accounting",
    "sars compliance",
    "ifrs for smes",
  ],
  seoKeywords: [
    "cloud accounting south africa",
    "sars emp201",
    "vat 201 south africa",
    "ifrs for smes software",
    "ias 16 fixed assets software",
    "south african payroll software",
    "accounting practice management sa",
  ],
  geoKeywords: [
    "best cloud accounting south africa",
    "isaflow vs sage",
    "isaflow vs xero south africa",
    "audit-ready accounting software",
  ],
  competitors: [
    { name: "Sage Business Cloud", url: "sage.com/en-za", reason: "Established SA accounting incumbent" },
    { name: "Xero", url: "xero.com", reason: "Global cloud accounting with SA presence" },
    { name: "QuickBooks Online", url: "quickbooks.intuit.com", reason: "Global SMB accounting" },
    { name: "Draftworx", url: "draftworx.com", reason: "SA audit/AFS software" },
    { name: "SimplePay", url: "simplepay.co.za", reason: "SA payroll specialist" },
  ],
  locations: [
    {
      type: "headquarters" as const,
      address: "Menlyn, Pretoria",
      city: "Pretoria",
      state: "Gauteng",
      country: "South Africa",
      postalCode: "0002",
    },
  ],
  valuePropositions: [
    "Built on International Standards on Auditing",
    "Full SARS compliance (VAT 201, EMP201/EMP501, IRP5/IT3)",
    "Audit-ready month-end and year-end playbooks",
    "IAS 16 fixed-asset depreciation",
    "Practice management with WIP billing",
    "Multi-company consolidation",
  ],
  socialLinks: {
    linkedin: "https://www.linkedin.com/company/isaflow",
    linkedinCompanyId: ISAFLOW_LINKEDIN_COMPANY_ID,
    website: "https://www.isaflow.co.za",
  },
  voice: {
    tone: "authoritative" as const,
    personality: ["precise", "compliance-first", "South African", "audit-grade"],
    targetAudience: "SA accountants, audit firms, and finance teams",
    keyMessages: [
      "Built on International Standards on Auditing",
      "SA compliance is not an add-on — it's the foundation",
      "Month-end as a playbook, not a scramble",
      "Every journal has a source; every period locks clean",
    ],
    avoidTopics: [],
  },
  visual: {
    primaryColor: "#0F172A",
    secondaryColor: "#14B8A6",
    accentColor: "#0D9488",
    colorPalette: ["#0F172A", "#134E4A", "#0D9488", "#14B8A6", "#CBD5E1"],
    fontFamily: "Inter",
  },
};

async function main(): Promise<void> {
  console.log(`Seeding ISAFlow managed brand under organization ${ORG_ID}\n`);

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
      eq(brands.domain, ISAFLOW_BRAND.domain),
    ),
  });

  let isaflowBrandId: string;

  if (existing) {
    console.log(`⏭  ISAFlow brand already exists: ${existing.id} — will reuse.`);
    isaflowBrandId = existing.id;
  } else {
    const [inserted] = await db
      .insert(brands)
      .values({
        organizationId: ORG_ID!,
        isBenchmark: false,
        ...ISAFLOW_BRAND,
      })
      .returning();
    if (!inserted) {
      throw new Error("Insert returned no row");
    }
    isaflowBrandId = inserted.id;
    console.log(`✅ Inserted ISAFlow brand: ${inserted.id}`);
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
      eq(socialBrowserCredentials.brandId, isaflowBrandId),
      eq(socialBrowserCredentials.platform, "linkedin"),
      eq(socialBrowserCredentials.username, JARVIS_USERNAME),
    ),
  });

  if (mirror) {
    console.log(
      `⏭  LinkedIn credential already mirrored for ISAFlow brand (${mirror.id}) — no-op.`,
    );
    return;
  }

  await db.insert(socialBrowserCredentials).values({
    organizationId: sourceCred.organizationId,
    brandId: isaflowBrandId,
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
    `✅ Mirrored Jarvis LinkedIn credential from ${SOURCE_CREDENTIAL_BRAND_ID} → ${isaflowBrandId}`,
  );
  console.log("\nDone. apex-linkedin can now post to the ISAFlow Page via:");
  console.log(
    `  composePagePost(page, credential, { text }, '${ISAFLOW_LINKEDIN_COMPANY_ID}', ...)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
