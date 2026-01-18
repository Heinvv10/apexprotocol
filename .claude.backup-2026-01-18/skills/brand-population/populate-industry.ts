/**
 * Industry Batch Population Script
 *
 * Processes multiple brands within an industry category in sequence.
 * Includes rate limiting, error handling, and progress tracking.
 *
 * Usage:
 *   bun run .claude/skills/brand-population/populate-industry.ts --industry=saas
 */

import { enrichBrand, type BrandInput } from './enrich-brand';

// ============================================
// Industry Data Definitions
// ============================================

interface IndustryBrandList {
  industryName: string;
  brands: Array<{
    name: string;
    domain: string;
    estimatedTier: 'gold' | 'silver' | 'bronze';
  }>;
}

const INDUSTRIES: Record<string, IndustryBrandList> = {
  saas: {
    industryName: 'SaaS / B2B Software',
    brands: [
      { name: 'HubSpot', domain: 'hubspot.com', estimatedTier: 'gold' },
      { name: 'Salesforce', domain: 'salesforce.com', estimatedTier: 'gold' },
      { name: 'Slack', domain: 'slack.com', estimatedTier: 'gold' },
      { name: 'Notion', domain: 'notion.so', estimatedTier: 'silver' },
      { name: 'Airtable', domain: 'airtable.com', estimatedTier: 'silver' },
    ],
  },

  ecommerce: {
    industryName: 'E-commerce / Retail',
    brands: [
      { name: 'Shopify', domain: 'shopify.com', estimatedTier: 'gold' },
      { name: 'Etsy', domain: 'etsy.com', estimatedTier: 'gold' },
      { name: 'Warby Parker', domain: 'warbyparker.com', estimatedTier: 'silver' },
      { name: 'Glossier', domain: 'glossier.com', estimatedTier: 'silver' },
      { name: 'Allbirds', domain: 'allbirds.com', estimatedTier: 'silver' },
    ],
  },

  fintech: {
    industryName: 'Fintech / Financial Services',
    brands: [
      { name: 'Stripe', domain: 'stripe.com', estimatedTier: 'gold' },
      { name: 'Robinhood', domain: 'robinhood.com', estimatedTier: 'gold' },
      { name: 'Wise', domain: 'wise.com', estimatedTier: 'silver' },
      { name: 'Chime', domain: 'chime.com', estimatedTier: 'silver' },
      { name: 'Plaid', domain: 'plaid.com', estimatedTier: 'silver' },
    ],
  },

  healthcare: {
    industryName: 'Healthcare / Wellness',
    brands: [
      { name: 'Headspace', domain: 'headspace.com', estimatedTier: 'silver' },
      { name: 'Peloton', domain: 'onepeloton.com', estimatedTier: 'gold' },
      { name: 'Calm', domain: 'calm.com', estimatedTier: 'silver' },
      { name: 'Hims & Hers', domain: 'forhims.com', estimatedTier: 'silver' },
      { name: 'Zocdoc', domain: 'zocdoc.com', estimatedTier: 'silver' },
    ],
  },

  education: {
    industryName: 'Education / EdTech',
    brands: [
      { name: 'Coursera', domain: 'coursera.org', estimatedTier: 'gold' },
      { name: 'Duolingo', domain: 'duolingo.com', estimatedTier: 'gold' },
      { name: 'Masterclass', domain: 'masterclass.com', estimatedTier: 'silver' },
      { name: 'Khan Academy', domain: 'khanacademy.org', estimatedTier: 'silver' },
      { name: 'Udemy', domain: 'udemy.com', estimatedTier: 'silver' },
    ],
  },

  marketing: {
    industryName: 'Marketing / Advertising',
    brands: [
      { name: 'Canva', domain: 'canva.com', estimatedTier: 'gold' },
      { name: 'Mailchimp', domain: 'mailchimp.com', estimatedTier: 'gold' },
      { name: 'SEMrush', domain: 'semrush.com', estimatedTier: 'silver' },
      { name: 'Hootsuite', domain: 'hootsuite.com', estimatedTier: 'silver' },
      { name: 'Monday.com', domain: 'monday.com', estimatedTier: 'silver' },
    ],
  },

  food: {
    industryName: 'Food & Beverage',
    brands: [
      { name: 'DoorDash', domain: 'doordash.com', estimatedTier: 'gold' },
      { name: 'HelloFresh', domain: 'hellofresh.com', estimatedTier: 'gold' },
      { name: 'Blue Apron', domain: 'blueapron.com', estimatedTier: 'silver' },
      { name: 'Oatly', domain: 'oatly.com', estimatedTier: 'silver' },
      { name: 'Liquid Death', domain: 'liquiddeath.com', estimatedTier: 'bronze' },
    ],
  },

  travel: {
    industryName: 'Travel / Hospitality',
    brands: [
      { name: 'Airbnb', domain: 'airbnb.com', estimatedTier: 'gold' },
      { name: 'Booking.com', domain: 'booking.com', estimatedTier: 'gold' },
      { name: 'TripAdvisor', domain: 'tripadvisor.com', estimatedTier: 'gold' },
      { name: 'Expedia', domain: 'expedia.com', estimatedTier: 'gold' },
      { name: 'Vrbo', domain: 'vrbo.com', estimatedTier: 'silver' },
    ],
  },

  entertainment: {
    industryName: 'Entertainment / Media',
    brands: [
      { name: 'Spotify', domain: 'spotify.com', estimatedTier: 'gold' },
      { name: 'Netflix', domain: 'netflix.com', estimatedTier: 'gold' },
      { name: 'Twitch', domain: 'twitch.tv', estimatedTier: 'gold' },
      { name: 'Patreon', domain: 'patreon.com', estimatedTier: 'silver' },
      { name: 'Medium', domain: 'medium.com', estimatedTier: 'silver' },
    ],
  },

  realestate: {
    industryName: 'Real Estate / PropTech',
    brands: [
      { name: 'Zillow', domain: 'zillow.com', estimatedTier: 'gold' },
      { name: 'Redfin', domain: 'redfin.com', estimatedTier: 'gold' },
      { name: 'Compass', domain: 'compass.com', estimatedTier: 'silver' },
      { name: 'Opendoor', domain: 'opendoor.com', estimatedTier: 'silver' },
      { name: 'Realtor.com', domain: 'realtor.com', estimatedTier: 'gold' },
    ],
  },
};

// ============================================
// Progress Tracking
// ============================================

interface PopulationResults {
  success: string[];
  failed: Array<{ brand: string; error: string }>;
  skipped: string[];
}

// ============================================
// Main Population Function
// ============================================

async function populateIndustry(industryKey: string): Promise<PopulationResults> {
  const industryData = INDUSTRIES[industryKey];

  if (!industryData) {
    throw new Error(`Industry "${industryKey}" not found. Available: ${Object.keys(INDUSTRIES).join(', ')}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 STARTING INDUSTRY POPULATION`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Industry: ${industryData.industryName}`);
  console.log(`Brands: ${industryData.brands.length}`);
  console.log(`Estimated Time: ${industryData.brands.length * 2} minutes`);
  console.log(`${'='.repeat(60)}\n`);

  const results: PopulationResults = {
    success: [],
    failed: [],
    skipped: [],
  };

  const startTime = Date.now();

  for (let i = 0; i < industryData.brands.length; i++) {
    const brand = industryData.brands[i];
    const progress = `[${i + 1}/${industryData.brands.length}]`;

    console.log(`\n${'-'.repeat(60)}`);
    console.log(`${progress} Processing: ${brand.name}`);
    console.log(`Domain: ${brand.domain}`);
    console.log(`Tier: ${brand.estimatedTier}`);
    console.log(`${'-'.repeat(60)}\n`);

    try {
      const brandInput: BrandInput = {
        name: brand.name,
        domain: brand.domain,
        industry: industryData.industryName,
        tier: brand.estimatedTier,
      };

      await enrichBrand(brandInput);

      results.success.push(brand.name);
      console.log(`\n✅ ${progress} Successfully processed ${brand.name}`);

      // Rate limiting: wait 15 seconds between brands
      if (i < industryData.brands.length - 1) {
        console.log(`\n⏳ Waiting 15 seconds before next brand...\n`);
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ ${progress} Failed to process ${brand.name}:`, errorMessage);

      results.failed.push({
        brand: brand.name,
        error: errorMessage,
      });

      // Continue to next brand even if one fails
      console.log(`\n⏭️  Continuing to next brand...\n`);
    }
  }

  const endTime = Date.now();
  const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

  // Final Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 INDUSTRY POPULATION COMPLETE`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Industry: ${industryData.industryName}`);
  console.log(`Duration: ${durationMinutes} minutes`);
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (results.success.length > 0) {
    console.log(`✅ Successfully processed brands:`);
    results.success.forEach((brand) => console.log(`  - ${brand}`));
    console.log();
  }

  if (results.failed.length > 0) {
    console.log(`❌ Failed brands:`);
    results.failed.forEach(({ brand, error }) => {
      console.log(`  - ${brand}: ${error}`);
    });
    console.log();
  }

  return results;
}

// ============================================
// CLI Execution
// ============================================

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI arguments
  const industryArg = args.find((arg) => arg.startsWith('--industry='))?.split('=')[1];

  if (!industryArg) {
    console.error(`\nUsage: bun run populate-industry.ts --industry=<key>\n`);
    console.error(`Available industries:`);
    Object.entries(INDUSTRIES).forEach(([key, data]) => {
      console.error(`  - ${key.padEnd(15)} (${data.brands.length} brands) - ${data.industryName}`);
    });
    console.error();
    process.exit(1);
  }

  await populateIndustry(industryArg);
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { populateIndustry, INDUSTRIES, type PopulationResults };
