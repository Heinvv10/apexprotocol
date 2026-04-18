import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import { config } from "dotenv";
// Load environment variables
config({ path: ".env.local" });
async function runMigration() {
  try {
    console.log("Running migration: Adding 'oauth' to system_setting_type enum...");
    
    // Add 'oauth' value to the enum
    await db.execute(sql`ALTER TYPE "system_setting_type" ADD VALUE IF NOT EXISTS 'oauth'`);
    
    console.log("✅ Migration completed successfully!");
    console.log("The 'oauth' value has been added to the system_setting_type enum.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
