/**
 * Check brand status and data coverage
 */
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function check() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 BRAND DATABASE STATUS REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Total brands
  const brandCount = await db.execute(sql`SELECT COUNT(*) as count FROM brands`);
  console.log(`Total Brands: ${brandCount.rows[0].count}`);

  // Brands with monitoring enabled
  const monitoringEnabled = await db.execute(sql`
    SELECT COUNT(*) as count FROM brands WHERE monitoring_enabled = true
  `);
  console.log(`Monitoring Enabled: ${monitoringEnabled.rows[0].count}`);

  // Brands with GEO keywords
  const withKeywords = await db.execute(sql`
    SELECT COUNT(*) as count FROM brands
    WHERE geo_keywords IS NOT NULL AND jsonb_array_length(geo_keywords) > 0
  `);
  console.log(`With GEO Keywords: ${withKeywords.rows[0].count}`);

  // Brands with competitors configured
  const withCompetitors = await db.execute(sql`
    SELECT COUNT(*) as count FROM brands
    WHERE competitors IS NOT NULL AND jsonb_array_length(competitors) > 0
  `);
  console.log(`With Competitors: ${withCompetitors.rows[0].count}`);

  console.log('\n--- Data Coverage ---\n');

  // Brands with mentions
  const withMentions = await db.execute(sql`
    SELECT COUNT(DISTINCT brand_id) as count FROM brand_mentions
  `);
  console.log(`Brands with Mentions: ${withMentions.rows[0].count}`);

  // Total mentions
  const mentionCount = await db.execute(sql`SELECT COUNT(*) as count FROM brand_mentions`);
  console.log(`Total Mentions: ${mentionCount.rows[0].count}`);

  // Mentions by platform
  const mentionsByPlatform = await db.execute(sql`
    SELECT platform, COUNT(*) as count
    FROM brand_mentions
    GROUP BY platform
    ORDER BY count DESC
  `);
  console.log('\nMentions by Platform:');
  for (const row of mentionsByPlatform.rows) {
    console.log(`  ${row.platform}: ${row.count}`);
  }

  // SOV snapshots
  const sovCount = await db.execute(sql`SELECT COUNT(*) as count FROM share_of_voice`);
  const sovBrands = await db.execute(sql`SELECT COUNT(DISTINCT brand_id) as count FROM share_of_voice`);
  console.log(`\nSOV Snapshots: ${sovCount.rows[0].count} (${sovBrands.rows[0].count} brands)`);

  // Alerts
  const alertCount = await db.execute(sql`SELECT COUNT(*) as count FROM competitive_alerts`);
  const alertBrands = await db.execute(sql`SELECT COUNT(DISTINCT brand_id) as count FROM competitive_alerts`);
  console.log(`Alerts: ${alertCount.rows[0].count} (${alertBrands.rows[0].count} brands)`);

  // Gaps
  const gapCount = await db.execute(sql`SELECT COUNT(*) as count FROM competitive_gaps`);
  const gapBrands = await db.execute(sql`SELECT COUNT(DISTINCT brand_id) as count FROM competitive_gaps`);
  console.log(`Gaps: ${gapCount.rows[0].count} (${gapBrands.rows[0].count} brands)`);

  // Sample brands without mentions
  console.log('\n--- Sample Brands Without Mentions ---\n');
  const brandsWithoutMentions = await db.execute(sql`
    SELECT b.id, b.name, b.industry
    FROM brands b
    LEFT JOIN brand_mentions bm ON b.id = bm.brand_id
    WHERE bm.id IS NULL
    LIMIT 10
  `);
  for (const brand of brandsWithoutMentions.rows) {
    console.log(`  - ${brand.name} (${brand.industry || 'no industry'})`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

check().catch(console.error);
