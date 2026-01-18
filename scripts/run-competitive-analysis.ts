/**
 * Run Competitive Analysis Processes
 *
 * This script runs the properly implemented competitive intelligence processes:
 * 1. Calculate and store SOV snapshots (enables alert detection)
 * 2. Analyze and store competitive gaps
 * 3. Generate alerts based on SOV changes
 */
import 'dotenv/config';
import { db } from '../src/lib/db';
import { brands, brandMentions } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  calculateSOV,
  storeDailySOV,
  type SOVSnapshot
} from '../src/lib/competitive/share-of-voice';
import {
  analyzeGaps,
  storeGaps
} from '../src/lib/competitive/gap-analyzer';
import {
  generateCompetitiveAlerts
} from '../src/lib/competitive/alert-generator';

async function runCompetitiveAnalysis() {
  console.log('🔍 Running Competitive Intelligence Analysis\n');

  // Get Under Armour brand
  const brand = await db.query.brands.findFirst({
    where: eq(brands.name, 'Under Armour'),
  });

  if (!brand) {
    console.error('❌ Under Armour brand not found');
    return;
  }

  console.log(`📦 Brand: ${brand.name} (ID: ${brand.id})`);
  console.log(`👥 Configured Competitors: ${(brand.competitors as any[])?.map(c => c.name).join(', ') || 'None'}\n`);

  // Get brand mentions count
  const mentionsCount = await db.query.brandMentions.findMany({
    where: eq(brandMentions.brandId, brand.id),
  });
  console.log(`📊 Total Brand Mentions: ${mentionsCount.length}\n`);

  // Step 1: Calculate and Store SOV Snapshot
  console.log('═══════════════════════════════════════════════');
  console.log('Step 1: Calculate Share of Voice');
  console.log('═══════════════════════════════════════════════');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sovSnapshot = await calculateSOV(brand.id, {
    start: thirtyDaysAgo,
    end: new Date(),
  });

  console.log(`✅ Overall SOV: ${sovSnapshot.overall}%`);
  console.log(`📈 Platforms analyzed: ${sovSnapshot.platforms.length}`);
  console.log(`👥 Competitors found in mentions: ${sovSnapshot.competitors.length}`);

  if (sovSnapshot.competitors.length > 0) {
    console.log('\nCompetitors in mentions:');
    for (const comp of sovSnapshot.competitors.slice(0, 5)) {
      console.log(`  - ${comp.name}: ${comp.sovPercentage}% SOV`);
    }
  }

  // Store the SOV snapshot
  console.log('\n📦 Storing SOV snapshot...');
  await storeDailySOV(brand.id, sovSnapshot);
  console.log('✅ SOV snapshot stored\n');

  // Step 2: Analyze Competitive Gaps
  console.log('═══════════════════════════════════════════════');
  console.log('Step 2: Analyze Competitive Gaps');
  console.log('═══════════════════════════════════════════════');

  const gapReport = await analyzeGaps(brand.id);

  console.log(`✅ Total Gaps Found: ${gapReport.summary.totalGaps}`);
  console.log(`🎯 High Priority: ${gapReport.summary.highPriorityCount}`);
  console.log(`📊 By Type:`, gapReport.summary.byType);

  if (gapReport.gaps.length > 0) {
    console.log('\nTop Gaps:');
    for (const gap of gapReport.gaps.slice(0, 5)) {
      console.log(`  - [${gap.type}] ${gap.description} (opportunity: ${gap.opportunity})`);
    }

    // Store gaps
    console.log('\n📦 Storing gaps...');
    await storeGaps(brand.id, gapReport.gaps);
    console.log(`✅ ${gapReport.gaps.length} gaps stored\n`);
  } else {
    console.log('\n⚠️  No gaps found - this may be because:');
    console.log('   - Brand mentions don\'t reference the configured competitors');
    console.log('   - The brand already covers all competitor keywords/topics\n');
  }

  // Step 3: Generate Alerts
  console.log('═══════════════════════════════════════════════');
  console.log('Step 3: Generate Competitive Alerts');
  console.log('═══════════════════════════════════════════════');

  const alerts = await generateCompetitiveAlerts(brand.id, sovSnapshot);

  console.log(`✅ Alerts Generated: ${alerts.length}`);

  if (alerts.length > 0) {
    console.log('\nAlerts:');
    for (const alert of alerts) {
      console.log(`  - [${alert.severity.toUpperCase()}] ${alert.title}`);
      console.log(`    ${alert.description}`);
    }
  } else {
    console.log('\n⚠️  No alerts generated - this is normal for first run');
    console.log('   Alerts are generated when SOV changes are detected between snapshots');
    console.log('   Run this script again tomorrow to see alerts based on changes\n');
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Analysis Complete');
  console.log('═══════════════════════════════════════════════');

  // Final recommendations
  if (gapReport.recommendations.length > 0) {
    console.log('\n📝 Recommendations:');
    for (const rec of gapReport.recommendations) {
      console.log(`  • ${rec}`);
    }
  }
}

runCompetitiveAnalysis()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
