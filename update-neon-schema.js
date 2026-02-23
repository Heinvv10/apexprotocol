#!/usr/bin/env node
/**
 * Update Neon database schema - add referral column
 */

const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:***REDACTED***@ep-cold-firefly-ajeq5xuy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();
  
  try {
    console.log('Adding referral column to contact_requests...');
    await client.query(`
      ALTER TABLE contact_requests 
      ADD COLUMN IF NOT EXISTS referral TEXT
    `);
    console.log('✅ Schema updated successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
