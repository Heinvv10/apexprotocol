/**
 * Create a test user in Clerk for E2E testing
 *
 * Usage: npx tsx scripts/create-test-user.ts
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

async function createTestUser() {
  try {
    console.log("Creating test user in Clerk...");

    // Create a test user with a unique secure password
    // Using a UUID-based password to avoid pwned password databases
    const securePassword = `ApexTest2025!${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

    const user = await clerkClient.users.createUser({
      emailAddress: ["test@apex-demo.com"],
      password: securePassword,
      firstName: "Test",
      lastName: "User",
      skipPasswordChecks: true, // Skip basic password requirements
      skipPasswordRequirement: false,
    });

    console.log("✅ Test user created successfully!");
    console.log("User ID:", user.id);
    console.log("Email:", user.emailAddresses[0].emailAddress);
    console.log("\nYou can now sign in with:");
    console.log("  Email: test@apex-demo.com");
    console.log(`  Password: ${securePassword}`);

    // Try to create an organization for the user (if organizations are enabled)
    try {
      console.log("\nCreating test organization...");
      const org = await clerkClient.organizations.createOrganization({
        name: "Test Organization",
        createdBy: user.id,
      });

      console.log("✅ Organization created successfully!");
      console.log("Organization ID:", org.id);
      console.log("Organization Name:", org.name);

      // Add user as admin to the organization
      await clerkClient.organizations.updateOrganizationMembership({
        organizationId: org.id,
        userId: user.id,
        role: "org:admin",
      });

      console.log("✅ User added as admin to organization!");
    } catch (orgError: any) {
      if (orgError.errors?.[0]?.code === "organization_not_enabled_in_instance") {
        console.log("\n⚠️  Organizations not enabled in this Clerk instance");
        console.log("   Enable at: https://dashboard.clerk.com");
        console.log("   (This is optional - user can still sign in without an organization)");
      } else {
        throw orgError;
      }
    }

  } catch (error: any) {
    console.error("❌ Error creating test user:", error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

createTestUser();
