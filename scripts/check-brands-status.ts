/**
 * Check brand status and data coverage
 */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 BRAND DATABASE STATUS REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Total brands
  const brandCount = await sql`SELECT COUNT(*) as count FROM brands`;
  console.log(`Total Brands: ${brandCount[0].count}`);

  // Brands with monitoring enabled
  const monitoringEnabled = await sql`
    SELECT COUNT(*) as count FROM brands WHERE monitoring_enabled = true
  `;
  console.log(`Monitoring Enabled: ${monitoringEnabled[0].count}`);

  // Brands with GEO keywords
  const withKeywords = await sql`
    SELECT COUNT(*) as count FROM brands
    WHERE geo_keywords IS NOT NULL AND jsonb_array_length(geo_keywords) > 0
  `;
  console.log(`With GEO Keywords: ${withKeywords[0].count}`);

  // Brands with competitors configured
  const withCompetitors = await sql`
    SELECT COUNT(*) as count FROM brands
    WHERE competitors IS NOT NULL AND jsonb_array_length(competitors) > 0
  `;
  console.log(`With Competitors: ${withCompetitors[0].count}`);

  console.log('\n--- Data Coverage ---\n');

  // Brands with mentions
  const withMentions = await sql`
    SELECT COUNT(DISTINCT brand_id) as count FROM brand_mentions
  `;
  console.log(`Brands with Mentions: ${withMentions[0].count}`);

  // Total mentions
  const mentionCount = await sql`SELECT COUNT(*) as count FROM brand_mentions`;
  console.log(`Total Mentions: ${mentionCount[0].count}`);

  // Mentions by platform
  const mentionsByPlatform = await sql`
    SELECT platform, COUNT(*) as count
    FROM brand_mentions
    GROUP BY platform
    ORDER BY count DESC
  `;
  console.log('\nMentions by Platform:');
  for (const row of mentionsByPlatform) {
    console.log(`  ${row.platform}: ${row.count}`);
  }

  // SOV snapshots
  const sovCount = await sql`SELECT COUNT(*) as count FROM share_of_voice`;
  const sovBrands = await sql`SELECT COUNT(DISTINCT brand_id) as count FROM share_of_voice`;
  console.log(`\nSOV Snapshots: ${sovCount[0].count} (${sovBrands[0].count} brands)`);

  // Alerts
  const alertCount = await sql`SELECT COUNT(*) as count FROM competitive_alerts`;
  const alertBrands = await sql`SELECT COUNT(DISTINCT brand_id) as count FROM competitive_alerts`;
  console.log(`Alerts: ${alertCount[0].count} (${alertBrands[0].count} brands)`);

  // Gaps
  const gapCount = await sql`SELECT COUNT(*) as count FROM competitive_gaps`;
  const gapBrands = await sql`SELECT COUNT(DISTINCT brand_id) as count FROM competitive_gaps`;
  console.log(`Gaps: ${gapCount[0].count} (${gapBrands[0].count} brands)`);

  // Sample brands without mentions
  console.log('\n--- Sample Brands Without Mentions ---\n');
  const brandsWithoutMentions = await sql`
    SELECT b.id, b.name, b.industry
    FROM brands b
    LEFT JOIN brand_mentions bm ON b.id = bm.brand_id
    WHERE bm.id IS NULL
    LIMIT 10
  `;
  for (const brand of brandsWithoutMentions) {
    console.log(`  - ${brand.name} (${brand.industry || 'no industry'})`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

check().catch(console.error);
