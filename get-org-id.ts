import { db } from "@/lib/db";

async function getOrgId() {
  try {
    const brand = await db.query.brands.findFirst();
    if (brand) {
      console.log(`OrgId: ${brand.organizationId}`);
    } else {
      console.log("No brands found");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

getOrgId().catch(console.error);
