/**
 * Ensure dev user exists for development mode
 */
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const DEV_USER_ID = "dev-user-id";
const DEV_ORG_ID = "demo-org-id";

async function ensureDevUser() {
  // Check if dev user exists
  const existing = await db.select().from(users).where(eq(users.id, DEV_USER_ID)).limit(1);
  
  if (existing.length > 0) {
    console.log("Dev user already exists:", existing[0].email);
    return existing[0];
  }
  
  // Create dev user
  const newUser = await db.insert(users).values({
    id: DEV_USER_ID,
    clerkUserId: "dev-clerk-user-id",
    organizationId: DEV_ORG_ID,
    email: "dev@apex.local",
    name: "Development User",
    role: "admin",
    isActive: true,
  }).returning();
  
  console.log("Created dev user:", newUser[0].email);
  return newUser[0];
}

ensureDevUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
