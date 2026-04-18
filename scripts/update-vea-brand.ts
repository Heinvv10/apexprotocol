import { db } from '../src/lib/db';

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });
import { brands } from "../src/lib/db/schema/brands";
import { eq } from "drizzle-orm";
async function updateVEABrand() {
  console.log("Updating VEA Group brand with scraped website data...");

  // Update brand with social media links and additional details
  await db.update(brands)
    .set({
      tagline: "Diversified Investments - Uplifting people, business, and progress",
      socialLinks: {
        facebook: "https://www.facebook.com/pg/VEA-Group-446262695861388",
        twitter: "https://twitter.com/GroupVea",
        instagram: "https://www.instagram.com/veagroup1",
        linkedin: "https://www.linkedin.com/company/11809859"
      },
      valuePropositions: [
        "Invests in already-profitable businesses and high-potential ventures",
        "Specializes in repositioning underutilized, mismanaged, or underperforming companies",
        "Offers multi-level management support to help companies reach full potential",
        "Combines intellectual and financial capital as a value-adding partner",
        "Targets minimum 26% equity stake, maximum 90% (with 100% in special cases)"
      ],
      description: "VEA Group is a diversified investment company with active operations in South Africa, the United Kingdom, and the United States. The organization focuses on uplifting people, business, and progress through strategic investments across multiple sectors. VEA operates under the D.C.U.P.E. principle: Desire, Continuous, Unyielding, Persistent, Effort with emphasis on output and relentless pursuit of progress.",
      updatedAt: new Date()
    })
    .where(eq(brands.name, "VEA Group"));

  console.log("✅ VEA Group brand updated successfully with social media links and value propositions!");

  process.exit(0);
}

updateVEABrand().catch((err) => {
  console.error("❌ Error updating brand:", err);
  process.exit(1);
});
