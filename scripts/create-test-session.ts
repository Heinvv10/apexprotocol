/**
 * Create a session token for test user (bypass 2FA for testing)
 *
 * Usage: npx tsx scripts/create-test-session.ts
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

async function createTestSession() {
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

    // Create a session token for the user
    const token = await clerkClient.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 3600, // 1 hour
    });

    console.log("\n✅ Sign-in token created successfully!");
    console.log("\nSign-in URL:");
    console.log(`http://localhost:3001/sign-in#/?__clerk_ticket=${token.token}`);
    console.log("\nOpen this URL in your browser to sign in automatically (bypasses 2FA)");
  } catch (error: any) {
    console.error("❌ Error creating session:", error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

createTestSession();
