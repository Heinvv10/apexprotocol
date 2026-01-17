/**
 * Migrate personnel from brands.personnel JSONB to brand_people table
 */
import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { brandPeople } from "../src/lib/db/schema/people";
import { isNotNull, sql } from "drizzle-orm";

async function migratePersonnel() {
  console.log("=== Migrating Personnel from JSONB to brand_people ===\n");

  // Get all brands with personnel in JSONB
  const brandsWithPersonnel = await db
    .select({
      id: brands.id,
      name: brands.name,
      domain: brands.domain,
      personnel: brands.personnel,
    })
    .from(brands)
    .where(isNotNull(brands.personnel));

  const brandsToProcess = brandsWithPersonnel.filter(
    (b) => Array.isArray(b.personnel) && b.personnel.length > 0
  );

  console.log("Found", brandsToProcess.length, "brands with personnel data");

  let totalMigrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const brand of brandsToProcess) {
    const personnel = (brand.personnel as any[]) || [];

    for (const person of personnel) {
      if (!person.name) {
        skipped++;
        continue;
      }

      try {
        // Check if already exists
        const existing = await db.query.brandPeople.findFirst({
          where: (p, { and, eq }) =>
            and(eq(p.brandId, brand.id), eq(p.name, person.name)),
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Determine if key contact
        const title = (person.title || "").toLowerCase();
        const isKeyContact =
          title.includes("ceo") ||
          title.includes("founder") ||
          title.includes("president") ||
          title.includes("chief");

        await db.insert(brandPeople).values({
          brandId: brand.id,
          name: person.name,
          title: person.title || null,
          department: person.department || null,
          email: person.email || null,
          linkedinUrl: person.linkedinUrl || person.linkedin || null,
          isPrimary: isKeyContact,
          isActive: true,
          discoveredFrom: person.discoveredFrom || "website_scrape",
        });

        totalMigrated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${brand.name}: ${msg}`);
      }
    }
  }

  console.log("\n✅ Migrated", totalMigrated, "people records");
  console.log("⏭️ Skipped", skipped, "(duplicates or missing name)");

  if (errors.length > 0) {
    console.log("\n⚠️ Errors (first 5):");
    errors.slice(0, 5).forEach((e) => console.log("  -", e));
  }

  // Verify
  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(brandPeople);
  console.log("\nTotal records in brand_people:", count[0].count);

  // Show sample
  const sample = await db.query.brandPeople.findMany({ limit: 5 });
  console.log("\nSample records:");
  sample.forEach((p) => console.log(`  - ${p.name} (${p.title})`));

  process.exit(0);
}

migratePersonnel().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
