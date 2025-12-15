/**
 * Database Seed Script for Apex GEO/AEO Platform
 * Usage: npx tsx scripts/seed.ts
 * Usage: npx tsx scripts/seed.ts --clean (to reset demo data)
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

config({ path: ".env.local" });

import * as schema from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });
const shouldClean = process.argv.includes("--clean");

const ids = {
  org: createId(),
  users: [createId(), createId()],
  brands: [createId(), createId(), createId()],
};

async function cleanExistingData() {
  console.log("Cleaning existing demo data...");
  const existingOrg = await db.query.organizations.findFirst({
    where: (org, { eq }) => eq(org.slug, "apex-demo"),
  });
  if (existingOrg) {
    const existingBrands = await db.query.brands.findMany({
      where: (brand, { eq }) => eq(brand.organizationId, existingOrg.id),
    });
    for (const brand of existingBrands) {
      await db.delete(schema.brandMentions).where(eq(schema.brandMentions.brandId, brand.id)).catch(() => {});
      await db.delete(schema.recommendations).where(eq(schema.recommendations.brandId, brand.id)).catch(() => {});
      await db.delete(schema.audits).where(eq(schema.audits.brandId, brand.id)).catch(() => {});
    }
    await db.delete(schema.brands).where(eq(schema.brands.organizationId, existingOrg.id)).catch(() => {});
    await db.delete(schema.users).where(eq(schema.users.organizationId, existingOrg.id)).catch(() => {});
    await db.delete(schema.organizations).where(eq(schema.organizations.id, existingOrg.id)).catch(() => {});
    console.log("Demo data removed");
  }
}

async function seed() {
  console.log("Starting database seed...");
  try {
    const existingOrg = await db.query.organizations.findFirst({
      where: (org, { eq }) => eq(org.slug, "apex-demo"),
    });
    
    if (existingOrg && !shouldClean) {
      console.log("Demo data already exists! Use --clean to reset.");
      return;
    }
    
    if (shouldClean) await cleanExistingData();

    console.log("Creating organization...");
    await db.insert(schema.organizations).values({
      id: ids.org,
      name: "Apex Demo Company",
      slug: "apex-demo",
      clerkOrgId: "org_demo_" + createId().slice(0, 8),
      plan: "professional",
      brandLimit: 10,
      userLimit: 25,
      isActive: true,
      onboardingStatus: {
        brandAdded: false,
        monitoringConfigured: false,
        auditRun: false,
        recommendationsReviewed: false,
        completedAt: null,
        dismissedAt: null,
      },
    });

    console.log("Creating users...");
    await db.insert(schema.users).values([
      {
        id: ids.users[0],
        clerkUserId: "user_demo_admin_" + createId().slice(0, 8),
        organizationId: ids.org,
        email: "admin@apex-demo.com",
        name: "Alex Thompson",
        role: "admin",
        isActive: true,
      },
      {
        id: ids.users[1],
        clerkUserId: "user_demo_editor_" + createId().slice(0, 8),
        organizationId: ids.org,
        email: "editor@apex-demo.com",
        name: "Jordan Lee",
        role: "editor",
        isActive: true,
      },
    ]);

    console.log("Creating brands...");
    await db.insert(schema.brands).values([
      {
        id: ids.brands[0],
        organizationId: ids.org,
        name: "TechFlow Solutions",
        domain: "techflow.io",
        industry: "Technology",
        isActive: true,
      },
      {
        id: ids.brands[1],
        organizationId: ids.org,
        name: "GreenLeaf Organics",
        domain: "greenleaforganics.com",
        industry: "Food & Beverage",
        isActive: true,
      },
      {
        id: ids.brands[2],
        organizationId: ids.org,
        name: "FinanceHub Pro",
        domain: "financehubpro.com",
        industry: "Financial Services",
        isActive: true,
      },
    ]);

    console.log("Seed completed!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
