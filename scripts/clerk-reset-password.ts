/**
 * Reset user password via Clerk Backend API
 * Usage: npx tsx scripts/clerk-reset-password.ts <email> <newPassword>
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.log("Usage: npx tsx scripts/clerk-reset-password.ts <email> <newPassword>");
  console.log("Example: npx tsx scripts/clerk-reset-password.ts user@example.com MyNewSecurePass123!");
  process.exit(1);
}

async function main() {
  console.log("Looking up user:", email);

  // Find user by email
  const searchRes = await fetch(
    "https://api.clerk.com/v1/users?email_address=" + encodeURIComponent(email),
    {
      headers: {
        Authorization: "Bearer " + CLERK_SECRET_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!searchRes.ok) {
    console.error("Failed to search users:", await searchRes.text());
    process.exit(1);
  }

  const users = await searchRes.json();
  
  if (users.length === 0) {
    console.error("No user found with email:", email);
    process.exit(1);
  }

  const userId = users[0].id;
  console.log("Found user:", userId);

  // Update password
  console.log("Updating password...");
  const updateRes = await fetch("https://api.clerk.com/v1/users/" + userId, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + CLERK_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: newPassword,
      skip_password_checks: true,
    }),
  });

  if (!updateRes.ok) {
    console.error("Failed to update password:", await updateRes.text());
    process.exit(1);
  }

  console.log("Password updated successfully!");
  console.log("User", email, "can now log in with the new password.");
}

main().catch(console.error);
