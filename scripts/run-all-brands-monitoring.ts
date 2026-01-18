/**
 * Run Comprehensive Brand Monitoring for All Brands
 *
 * This script runs real AI platform queries for all brands in the database,
 * calculates SOV snapshots, and generates competitive alerts.
 *
 * Uses the properly implemented processes:
 * 1. AI Platform Query Service - Real API calls to ChatGPT, Claude, Gemini, etc.
 * 2. GEO Monitoring Service - Orchestrates platform queries
 * 3. SOV Calculator - Share of Voice calculation from mentions
 * 4. Gap Analyzer - Finds competitive gaps
 * 5. Alert Generator - Generates alerts from SOV changes
 */
import 'dotenv/config';
import { db } from '../src/lib/db';
import { brands, brandMentions } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  queryAIPlatform,
  queryAllPlatforms,
  type AIPlatformMention
} from '../src/lib/services/ai-platform-query';
import {
  calculateSOV,
  storeDailySOV,
} from '../src/lib/competitive/share-of-voice';
import {
  analyzeGaps,
  storeGaps
} from '../src/lib/competitive/gap-analyzer';
import {
  generateCompetitiveAlerts
} from '../src/lib/competitive/alert-generator';

// ============================================================================
// Configuration
// ============================================================================

// Platforms to query
const PLATFORMS = ['chatgpt', 'claude', 'gemini', 'perplexity', 'deepseek', 'grok'];

// Rate limiting - delay between brands to avoid API rate limits
const DELAY_BETWEEN_BRANDS_MS = 2000; // 2 seconds between brands
const DELAY_BETWEEN_PLATFORMS_MS = 500; // 0.5 seconds between platforms

// Query templates for different industries
const INDUSTRY_QUERY_TEMPLATES: Record<string, string[]> = {
  'sports': [
    'What is the best {brand} product for running?',
    'Compare {brand} to Nike for athletic wear',
    'Is {brand} good for professional athletes?',
    'Best sports apparel brands like {brand}',
  ],
  'retail': [
    'Is {brand} reliable for online shopping?',
    'Compare {brand} to Amazon for e-commerce',
    'What are the best alternatives to {brand}?',
    'Tell me about {brand} customer service',
  ],
  'technology': [
    'Is {brand} a good tech company?',
    'Compare {brand} to competitors in tech',
    'What products does {brand} make?',
    'How does {brand} rank in technology?',
  ],
  'default': [
    'Tell me about {brand}',
    'What is {brand} known for?',
    'Is {brand} a reputable company?',
    'Who are the main competitors to {brand}?',
  ],
};

// ============================================================================
// Types
// ============================================================================

interface BrandMonitoringResult {
  brandId: string;
  brandName: string;
  platformsQueried: number;
  mentionsCollected: number;
  sovSnapshot: {
    overall: number;
    platforms: number;
    competitors: number;
  } | null;
  alertsGenerated: number;
  gapsFound: number;
  errors: string[];
  duration: number;
}

interface MonitoringRunSummary {
  startTime: Date;
  endTime: Date;
  totalBrands: number;
  brandsProcessed: number;
  totalMentions: number;
  totalAlerts: number;
  totalGaps: number;
  errors: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getQueriesForBrand(brandName: string, industry?: string): string[] {
  const templates = INDUSTRY_QUERY_TEMPLATES[industry || 'default'] || INDUSTRY_QUERY_TEMPLATES['default'];
  return templates.map(template => template.replace('{brand}', brandName));
}

async function saveMentionToDatabase(
  brandId: string,
  mention: AIPlatformMention
): Promise<void> {
  await db.insert(brandMentions).values({
    brandId,
    platform: mention.platform,
    query: mention.query,
    response: mention.response,
    sentiment: mention.sentiment,
    position: mention.position,
    citationUrl: mention.citationUrl,
    competitors: mention.competitors,
    promptCategory: mention.promptCategory,
    topics: mention.topics,
    metadata: mention.metadata,
  });
}

// ============================================================================
// Main Monitoring Functions
// ============================================================================

/**
 * Run monitoring for a single brand
 */
async function monitorBrand(
  brand: {
    id: string;
    name: string;
    industry?: string | null;
    geoKeywords?: string[] | null;
    monitoringPlatforms?: string[] | null;
    competitors?: any[] | null;
  }
): Promise<BrandMonitoringResult> {
  const startTime = Date.now();
  const result: BrandMonitoringResult = {
    brandId: brand.id,
    brandName: brand.name,
    platformsQueried: 0,
    mentionsCollected: 0,
    sovSnapshot: null,
    alertsGenerated: 0,
    gapsFound: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log(`\n📦 Processing: ${brand.name}`);

    // Determine platforms to query (use configured or default)
    const platformsToQuery = brand.monitoringPlatforms?.length
      ? brand.monitoringPlatforms
      : PLATFORMS;

    // Get queries for this brand
    const queries = getQueriesForBrand(brand.name, brand.industry || undefined);
    const keywords = brand.geoKeywords?.length
      ? brand.geoKeywords
      : [brand.name];

    console.log(`  Platforms: ${platformsToQuery.join(', ')}`);
    console.log(`  Keywords: ${keywords.length}`);

    // Step 1: Query AI platforms
    for (const platform of platformsToQuery) {
      for (const keyword of keywords.slice(0, 3)) { // Limit to 3 keywords per platform
        try {
          const mention = await queryAIPlatform(platform, brand.name, keyword);

          if (mention) {
            await saveMentionToDatabase(brand.id, mention);
            result.mentionsCollected++;
            console.log(`  ✅ ${platform}: Found mention (${mention.sentiment})`);
          } else {
            console.log(`  ⚪ ${platform}: No mention for "${keyword}"`);
          }

          result.platformsQueried++;
          await sleep(DELAY_BETWEEN_PLATFORMS_MS);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`${platform}: ${errorMsg}`);
          console.log(`  ❌ ${platform}: ${errorMsg}`);
        }
      }
    }

    // Step 2: Calculate SOV
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sovSnapshot = await calculateSOV(brand.id, {
        start: thirtyDaysAgo,
        end: new Date(),
      });

      await storeDailySOV(brand.id, sovSnapshot);

      result.sovSnapshot = {
        overall: sovSnapshot.overall,
        platforms: sovSnapshot.platforms.length,
        competitors: sovSnapshot.competitors.length,
      };
      console.log(`  📊 SOV: ${sovSnapshot.overall}%`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`SOV: ${errorMsg}`);
    }

    // Step 3: Analyze gaps
    try {
      const gapReport = await analyzeGaps(brand.id);

      if (gapReport.gaps.length > 0) {
        await storeGaps(brand.id, gapReport.gaps);
        result.gapsFound = gapReport.gaps.length;
        console.log(`  🎯 Gaps: ${gapReport.gaps.length}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Gaps: ${errorMsg}`);
    }

    // Step 4: Generate alerts
    try {
      if (result.sovSnapshot) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const currentSovSnapshot = await calculateSOV(brand.id, {
          start: thirtyDaysAgo,
          end: new Date(),
        });

        const alerts = await generateCompetitiveAlerts(brand.id, currentSovSnapshot);
        result.alertsGenerated = alerts.length;

        if (alerts.length > 0) {
          console.log(`  🔔 Alerts: ${alerts.length}`);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Alerts: ${errorMsg}`);
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`General: ${errorMsg}`);
  }

  result.duration = Date.now() - startTime;
  console.log(`  ⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);

  return result;
}

/**
 * Run monitoring for all brands
 */
async function runAllBrandsMonitoring(options?: {
  limit?: number;
  offset?: number;
  onlyWithMonitoringEnabled?: boolean;
}): Promise<MonitoringRunSummary> {
  const summary: MonitoringRunSummary = {
    startTime: new Date(),
    endTime: new Date(),
    totalBrands: 0,
    brandsProcessed: 0,
    totalMentions: 0,
    totalAlerts: 0,
    totalGaps: 0,
    errors: [],
  };

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 COMPREHENSIVE BRAND MONITORING');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Started: ${summary.startTime.toISOString()}`);
  console.log('');

  try {
    // Get all brands
    let allBrands = await db.query.brands.findMany({
      columns: {
        id: true,
        name: true,
        industry: true,
        geoKeywords: true,
        monitoringPlatforms: true,
        competitors: true,
        monitoringEnabled: true,
      },
    });

    // Filter if only monitoring enabled
    if (options?.onlyWithMonitoringEnabled) {
      allBrands = allBrands.filter(b => b.monitoringEnabled);
    }

    // Apply offset and limit
    if (options?.offset) {
      allBrands = allBrands.slice(options.offset);
    }
    if (options?.limit) {
      allBrands = allBrands.slice(0, options.limit);
    }

    summary.totalBrands = allBrands.length;
    console.log(`📊 Total brands to process: ${summary.totalBrands}`);
    console.log('');

    // Process each brand
    for (let i = 0; i < allBrands.length; i++) {
      const brand = allBrands[i];
      console.log(`[${i + 1}/${summary.totalBrands}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      const result = await monitorBrand(brand);

      summary.brandsProcessed++;
      summary.totalMentions += result.mentionsCollected;
      summary.totalAlerts += result.alertsGenerated;
      summary.totalGaps += result.gapsFound;

      if (result.errors.length > 0) {
        summary.errors.push(`${brand.name}: ${result.errors.join('; ')}`);
      }

      // Delay between brands
      if (i < allBrands.length - 1) {
        await sleep(DELAY_BETWEEN_BRANDS_MS);
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    summary.errors.push(`Fatal: ${errorMsg}`);
    console.error('Fatal error:', error);
  }

  summary.endTime = new Date();
  const totalDuration = summary.endTime.getTime() - summary.startTime.getTime();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 MONITORING SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
  console.log(`Brands processed: ${summary.brandsProcessed}/${summary.totalBrands}`);
  console.log(`Mentions collected: ${summary.totalMentions}`);
  console.log(`Alerts generated: ${summary.totalAlerts}`);
  console.log(`Gaps found: ${summary.totalGaps}`);
  console.log(`Errors: ${summary.errors.length}`);

  if (summary.errors.length > 0) {
    console.log('');
    console.log('Errors:');
    for (const error of summary.errors.slice(0, 10)) {
      console.log(`  - ${error}`);
    }
    if (summary.errors.length > 10) {
      console.log(`  ... and ${summary.errors.length - 10} more`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════════');

  return summary;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

// Parse command line arguments
const args = process.argv.slice(2);
let limit: number | undefined;
let offset: number | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
  }
  if (args[i] === '--offset' && args[i + 1]) {
    offset = parseInt(args[i + 1], 10);
  }
}

runAllBrandsMonitoring({ limit, offset })
  .then((summary) => {
    console.log('');
    console.log('✅ Monitoring complete!');
    process.exit(summary.errors.length > 10 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
