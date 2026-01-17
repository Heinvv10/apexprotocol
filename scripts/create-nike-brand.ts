import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createNikeBrand() {
  const client = await pool.connect();

  try {
    console.log('Creating Nike brand with test data...');

    // 1. Create Nike brand
    await client.query(`
      INSERT INTO brands (id, name, organization_id, created_at, updated_at)
      VALUES (
        'nike-test-brand-001',
        'Nike',
        'aas1zs4jmuoa9q840gzmrh4n',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Nike brand created');

    // 2. Create brand mentions across 7 AI platforms
    await client.query(`
      INSERT INTO brand_mentions (id, brand_id, platform, query, response, sentiment, position, timestamp, created_at)
      VALUES
        (gen_random_uuid()::text, 'nike-test-brand-001', 'chatgpt', 'Best athletic shoe brands', 'Nike is a leading athletic footwear brand known for innovation...', 'positive', 1, NOW() - INTERVAL '2 hours', NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'claude', 'Sustainable sportswear companies', 'Nike has made significant commitments to sustainability through Move to Zero...', 'positive', 2, NOW() - INTERVAL '3 hours', NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'gemini', 'Running shoe recommendations', 'Nike offers excellent running shoes with their Air Max and React technologies...', 'positive', 1, NOW() - INTERVAL '1 hour', NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'perplexity', 'Athletic apparel brands', 'Nike is among the top athletic apparel brands globally...', 'neutral', 3, NOW() - INTERVAL '4 hours', NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'grok', 'Basketball shoe brands', 'Nike leads basketball footwear with signature athlete lines...', 'positive', 1, NOW() - INTERVAL '5 hours', NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'deepseek', 'Sports brand innovation', 'Nike has pioneered innovations like Flyknit and self-lacing shoes...', 'neutral', 4, NOW() - INTERVAL '6 hours', NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'copilot', 'Sportswear market leaders', 'Nike maintains strong market position in athletic wear...', 'positive', 2, NOW() - INTERVAL '7 hours', NOW())
    `);
    console.log('✓ Brand mentions created (7 platforms)');

    // 3. Create competitor mentions
    await client.query(`
      INSERT INTO competitor_mentions (id, brand_id, competitor_name, competitor_domain, platform, query, position, sentiment, timestamp, created_at)
      VALUES
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Adidas', 'adidas.com', 'chatgpt', 'Best athletic shoe brands', 2, 'positive', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Under Armour', 'underarmour.com', 'claude', 'Athletic performance wear', 3, 'neutral', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Puma', 'puma.com', 'gemini', 'Running shoe brands', 4, 'neutral', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'New Balance', 'newbalance.com', 'perplexity', 'Running shoes for beginners', 5, 'positive', NOW(), NOW())
    `);
    console.log('✓ Competitor mentions created (4 competitors)');

    // 4. Create recommendations
    await client.query(`
      INSERT INTO recommendations (id, brand_id, title, description, category, priority, status, effort, impact, source, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Create FAQ about Nike Air technology', 'AI platforms frequently ask about Air cushioning technology. Create comprehensive FAQ to increase visibility in answer engines.', 'content_optimization', 'high', 'pending', 'moderate', 'high', 'monitoring', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Update sustainability initiatives content', 'Expand content on Move to Zero and sustainable materials to increase visibility on sustainability queries.', 'content_freshness', 'high', 'pending', 'moderate', 'high', 'content', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Add structured data for product catalog', 'Implement schema.org Product markup for better AI platform understanding and citation.', 'schema_markup', 'medium', 'pending', 'moderate', 'medium', 'audit', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Create athlete partnership stories', 'Document partnerships with athletes like LeBron James, Serena Williams for brand authority queries.', 'authority_building', 'medium', 'in_progress', 'major', 'medium', 'content', NOW(), NOW()),
        (gen_random_uuid()::text, 'nike-test-brand-001', 'Optimize innovation timeline content', 'Create timeline of Nike innovations (Waffle sole, Air, Flyknit, etc.) for historical queries.', 'content_optimization', 'low', 'completed', 'quick_win', 'low', 'manual', NOW(), NOW())
    `);
    console.log('✓ Recommendations created (5 recommendations)');

    // 5. Create audit
    await client.query(`
      INSERT INTO audits (id, brand_id, url, status, overall_score, issue_count, critical_count, high_count, medium_count, low_count, started_at, completed_at, created_at)
      VALUES
        (gen_random_uuid()::text, 'nike-test-brand-001', 'https://www.nike.com', 'completed', 87, 12, 1, 3, 5, 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', NOW() - INTERVAL '1 day')
    `);
    console.log('✓ Audit created');

    console.log('\n✅ Nike brand created successfully with comprehensive test data!');
    console.log('Brand ID: nike-test-brand-001');
    console.log('- 7 brand mentions across AI platforms');
    console.log('- 4 competitor mentions');
    console.log('- 5 recommendations');
    console.log('- 1 audit result');

  } catch (error) {
    console.error('Error creating Nike brand:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createNikeBrand();
