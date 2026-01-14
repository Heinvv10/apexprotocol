const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(
      'ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "platform_relevance" jsonb;'
    );
    console.log('✅ Successfully added platform_relevance column');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

run();
