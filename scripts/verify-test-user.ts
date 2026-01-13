/**
 * Verify test user's email in Clerk (bypass email verification)
 *
 * Usage: npx tsx scripts/verify-test-user.ts
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

async function verifyTestUser() {
  try {
    console.log("Finding test user in Clerk...");

    // Search for test user by email
    const users = await clerkClient.users.getUserList({
      emailAddress: ["test@apex-demo.com"],
    });

    if (users.data.length === 0) {
      console.error("❌ No test user found");
      process.exit(1);
    }

    const user = users.data[0];
    console.log(`Found user: ${user.id} (${user.emailAddresses[0].emailAddress})`);

    // Get the email address ID
    const emailAddressId = user.emailAddresses[0].id;

    // Mark email as verified
    await clerkClient.emailAddresses.updateEmailAddress(emailAddressId, {
      verified: true,
    });

    console.log("✅ Email address verified successfully!");
    console.log("User can now sign in without email verification code");
  } catch (error: any) {
    console.error("❌ Error verifying test user:", error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

verifyTestUser();
