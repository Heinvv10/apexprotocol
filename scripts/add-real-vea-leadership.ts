import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { brands } from "../src/lib/db/schema/brands";
import { brandPeople } from "../src/lib/db/schema/people";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function addRealLeadership() {
  console.log("👥 Adding REAL VEA Group leadership team from veagroup.co.za/our-team\n");

  const veaBrands = await db.select().from(brands).where(eq(brands.name, "VEA Group"));
  if (veaBrands.length === 0) {
    console.error("❌ VEA Group brand not found!");
    process.exit(1);
  }
  const brandId = veaBrands[0].id;

  // REAL team members scraped from https://veagroup.co.za/our-team
  const realTeam = [
    {
      name: "Marno Nel",
      title: "Managing Director",
      roleCategory: "c_suite" as const,
      displayOrder: 0,
      isPrimary: true
    },
    {
      name: "Regardt Scheepers",
      title: "Operational Director",
      roleCategory: "c_suite" as const,
      displayOrder: 1,
      isPrimary: false
    },
    {
      name: "Thoko Tshabalala",
      title: "Director: Business Development",
      roleCategory: "c_suite" as const,
      displayOrder: 2,
      isPrimary: false
    },
    {
      name: "Hein Biekart",
      title: "Director: Construction",
      roleCategory: "c_suite" as const,
      displayOrder: 3,
      isPrimary: false
    },
    {
      name: "Lethuwane Johannes Mogola",
      title: "Director: Logistics, Telecoms",
      roleCategory: "c_suite" as const,
      displayOrder: 4,
      isPrimary: false
    },
    {
      name: "Ashmini Narotam",
      title: "Director: Legal",
      roleCategory: "c_suite" as const,
      displayOrder: 5,
      isPrimary: false
    }
  ];

  for (const person of realTeam) {
    await db.insert(brandPeople).values({
      id: createId(),
      brandId,
      name: person.name,
      title: person.title,
      roleCategory: person.roleCategory,
      bio: null, // No bio available on website
      socialProfiles: {}, // No social profiles found on website
      linkedinUrl: null,
      twitterUrl: null,
      linkedinFollowers: null,
      twitterFollowers: null,
      totalSocialFollowers: null,
      aiMentionCount: 0, // Real value: 0 (not tracked yet)
      aiVisibilityScore: 0, // Real value: 0 (not tracked yet)
      thoughtLeadershipScore: 0, // Real value: 0 (not tracked yet)
      isVerified: true, // Verified from official website
      isActive: true,
      isPrimary: person.isPrimary,
      displayOrder: person.displayOrder,
      discoveredFrom: "website_scrape" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Added ${person.name} - ${person.title}`);
  }

  console.log(`\n✅ Added ${realTeam.length} REAL team members from veagroup.co.za`);
  console.log("\n📝 Note: No biographical info, social profiles, or AI mentions available yet.");
  console.log("These would need to be:");
  console.log("  - Researched individually (LinkedIn profiles, etc.)");
  console.log("  - Tracked over time (AI platform monitoring)");
  console.log("  - Manually enriched (user input)");

  process.exit(0);
}

addRealLeadership().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
