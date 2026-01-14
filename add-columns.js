const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');

    const columns = [
      'platform_relevance',
      'schema_code',
      'expected_score_impact',
      'baseline_score',
      'post_implementation_score',
      'score_improvement',
      'effectiveness_score',
      'user_rating',
      'user_feedback',
      'feedback_at'
    ];

    for (const col of columns) {
      try {
        let sql = '';
        if (col === 'platform_relevance') {
          sql = `ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "${col}" jsonb;`;
        } else if (col === 'schema_code' || col === 'user_feedback') {
          sql = `ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "${col}" text;`;
        } else if (col === 'feedback_at') {
          sql = `ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "${col}" timestamp with time zone;`;
        } else {
          sql = `ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "${col}" integer;`;
        }

        await client.query(sql);
        console.log(`✅ ${col}`);
      } catch (error) {
        console.log(`⚠️  ${col}: ${error.message.split('\n')[0]}`);
      }
    }

    await client.end();
    console.log('\n✅ All columns processed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

run();
