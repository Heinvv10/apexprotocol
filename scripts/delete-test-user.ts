/**
 * Delete test user from Clerk
 *
 * Usage: npx tsx scripts/delete-test-user.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClerkClient } from "@clerk/backend";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in .env.local");
  process.exit(1);
}

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function deleteTestUser() {
  try {
    console.log("Finding test user in Clerk...");

    // Search for test user by email
    const users = await clerkClient.users.getUserList({
      emailAddress: ["test@apex-demo.com"],
    });

    if (users.data.length === 0) {
      console.log("✅ No test user found - nothing to delete");
      return;
    }

    const user = users.data[0];
    console.log(`Found user: ${user.id} (${user.emailAddresses[0].emailAddress})`);

    // Delete the user
    await clerkClient.users.deleteUser(user.id);

    console.log("✅ Test user deleted successfully!");
  } catch (error: any) {
    console.error("❌ Error deleting test user:", error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

deleteTestUser();
