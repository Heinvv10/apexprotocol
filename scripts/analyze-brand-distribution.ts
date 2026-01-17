import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq, and } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const benchmarkBrands = await db.query.brands.findMany({
    where: and(
      eq(brands.isBenchmark, true),
      eq(brands.organizationId, 'org_benchmark_brands')
    ),
  });

  console.log('\n' + '='.repeat(70));
  console.log('📊 BENCHMARK BRANDS ANALYSIS');
  console.log('='.repeat(70));
  console.log(`\nTotal Brands: ${benchmarkBrands.length}\n`);

  // By Industry
  const byIndustry: Record<string, { total: number; gold: number; silver: number }> = {};
  for (const brand of benchmarkBrands) {
    if (!byIndustry[brand.industry]) {
      byIndustry[brand.industry] = { total: 0, gold: 0, silver: 0 };
    }
    byIndustry[brand.industry].total++;
    if (brand.benchmarkTier === 'gold') {
      byIndustry[brand.industry].gold++;
    } else {
      byIndustry[brand.industry].silver++;
    }
  }

  console.log('📈 BY INDUSTRY:\n');
  Object.entries(byIndustry)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([industry, stats]) => {
      const goldIcon = '🥇'.repeat(stats.gold);
      const silverIcon = '🥈'.repeat(stats.silver);
      console.log(`  ${industry}`);
      console.log(`    Total: ${stats.total} | ${goldIcon} ${silverIcon}`);
    });

  // By Tier
  const goldBrands = benchmarkBrands.filter(b => b.benchmarkTier === 'gold');
  const silverBrands = benchmarkBrands.filter(b => b.benchmarkTier === 'silver');

  console.log('\n' + '='.repeat(70));
  console.log('🏆 BY TIER:\n');
  console.log(`  Gold Tier:   ${goldBrands.length} brands (${((goldBrands.length / benchmarkBrands.length) * 100).toFixed(1)}%)`);
  console.log(`  Silver Tier: ${silverBrands.length} brands (${((silverBrands.length / benchmarkBrands.length) * 100).toFixed(1)}%)`);

  // Industry Categories
  const consumerIndustries = [
    'E-commerce / Retail',
    'Food & Beverage',
    'Travel / Hospitality',
    'Entertainment / Media',
    'Consumer Goods',
    'Gaming',
    'Fashion / Apparel',
    'Beauty / Cosmetics',
    'Sports & Fitness',
    'Home & Garden',
  ];

  const b2bSaasIndustries = [
    'SaaS / B2B Software',
    'Marketing / Martech',
    'HR / Recruitment Tech',
    'Cybersecurity',
    'Legal / Legal Tech',
    'Real Estate / PropTech',
    'Telecommunications',
    'Education / E-Learning',
  ];

  const healthcareIndustries = [
    'Healthcare / Wellness',
    'Mental Health / Therapy Tech',
  ];

  const financeIndustries = [
    'Fintech / Financial Services',
    'Insurance / Insurtech',
  ];

  const professionalIndustries = [
    'Professional Services',
    'Legal / Legal Tech',
  ];

  const consumerBrands = benchmarkBrands.filter(b => consumerIndustries.includes(b.industry));
  const b2bBrands = benchmarkBrands.filter(b => b2bSaasIndustries.includes(b.industry));
  const healthcareBrands = benchmarkBrands.filter(b => healthcareIndustries.includes(b.industry));
  const financeBrands = benchmarkBrands.filter(b => financeIndustries.includes(b.industry));

  console.log('\n' + '='.repeat(70));
  console.log('🎯 BY MARKET SEGMENT:\n');
  console.log(`  Consumer:           ${consumerBrands.length} brands (${consumerIndustries.length} industries)`);
  console.log(`  B2B SaaS:           ${b2bBrands.length} brands (${b2bSaasIndustries.length} industries)`);
  console.log(`  Healthcare:         ${healthcareBrands.length} brands (${healthcareIndustries.length} industries)`);
  console.log(`  Financial Services: ${financeBrands.length} brands (${financeIndustries.length} industries)`);

  // Voice tone distribution
  const byTone: Record<string, number> = {};
  for (const brand of benchmarkBrands) {
    const tone = brand.voice.tone;
    byTone[tone] = (byTone[tone] || 0) + 1;
  }

  console.log('\n' + '='.repeat(70));
  console.log('🗣️  BY VOICE TONE:\n');
  Object.entries(byTone)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tone, count]) => {
      const percentage = ((count / benchmarkBrands.length) * 100).toFixed(1);
      console.log(`  ${tone.padEnd(15)} ${count.toString().padStart(3)} brands (${percentage}%)`);
    });

  // Color analysis
  const primaryColors = benchmarkBrands.map(b => b.visual.primaryColor);
  const colorCategories: Record<string, number> = {
    'Blue': 0,
    'Red/Orange': 0,
    'Green': 0,
    'Purple': 0,
    'Black': 0,
    'Other': 0,
  };

  for (const color of primaryColors) {
    const hex = color.toLowerCase();
    if (hex.includes('00') && (hex.includes('ff') || hex.includes('e5') || hex.includes('cc'))) {
      colorCategories['Blue']++;
    } else if (hex.includes('ff') && hex[1] !== 'f') {
      colorCategories['Red/Orange']++;
    } else if ((hex.includes('0') || hex.includes('3') || hex.includes('7')) && hex.includes('c')) {
      colorCategories['Green']++;
    } else if (hex.includes('b') || hex.includes('6b4')) {
      colorCategories['Purple']++;
    } else if (hex === '#000000' || hex === '#1a1a1a') {
      colorCategories['Black']++;
    } else {
      colorCategories['Other']++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎨 PRIMARY COLOR DISTRIBUTION:\n');
  Object.entries(colorCategories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([color, count]) => {
      if (count > 0) {
        const percentage = ((count / benchmarkBrands.length) * 100).toFixed(1);
        console.log(`  ${color.padEnd(15)} ${count.toString().padStart(3)} brands (${percentage}%)`);
      }
    });

  // New industries (added in expansion)
  const newIndustries = [
    'Insurance / Insurtech',
    'HR / Recruitment Tech',
    'Cybersecurity',
    'Legal / Legal Tech',
    'Mental Health / Therapy Tech',
  ];

  const newBrands = benchmarkBrands.filter(b => newIndustries.includes(b.industry));

  console.log('\n' + '='.repeat(70));
  console.log('🆕 NEW INDUSTRIES (Expansion to 125):\n');
  newIndustries.forEach(industry => {
    const industryBrands = benchmarkBrands.filter(b => b.industry === industry);
    const gold = industryBrands.filter(b => b.benchmarkTier === 'gold');
    const silver = industryBrands.filter(b => b.benchmarkTier === 'silver');

    console.log(`\n  ${industry}:`);
    console.log(`    Gold:   ${gold.map(b => b.name).join(', ')}`);
    console.log(`    Silver: ${silver.map(b => b.name).join(', ')}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(70) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
