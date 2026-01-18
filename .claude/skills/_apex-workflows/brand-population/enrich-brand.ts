/**
 * Brand Enrichment Script
 *
 * Automates the process of gathering comprehensive brand data from web sources
 * and AI analysis for insertion into the benchmark brands database.
 *
 * Usage:
 *   bun run .claude/skills/brand-population/enrich-brand.ts --name "HubSpot" --domain "hubspot.com" --industry "SaaS"
 */

import { chromium, Browser, Page } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';
import type { BrandVoice, BrandVisual } from '@/lib/db/schema/brands';

// ============================================
// Configuration
// ============================================

const BENCHMARK_ORG_ID = 'org_benchmark_brands'; // System organization for benchmarks
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Types
// ============================================

interface BrandInput {
  name: string;
  domain: string;
  industry: string;
  tier?: 'gold' | 'silver' | 'bronze';
}

interface ScrapedData {
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  socialLinks: Record<string, string>;
  headings: string[];
  faqQuestions: string[];
  homepageText: string;
  aboutPageText: string;
}

interface KeywordSet {
  primary: string[];
  seo: string[];
  geo: string[];
}

interface CompetitorData {
  name: string;
  url: string;
  reason: string;
}

interface EnrichedBrandData {
  // Basic
  name: string;
  domain: string;
  description: string | null;
  tagline: string | null;
  industry: string;
  logoUrl: string | null;

  // Keywords
  keywords: string[];
  seoKeywords: string[];
  geoKeywords: string[];

  // Competitors
  competitors: CompetitorData[];

  // Brand voice & visual
  voice: BrandVoice;
  visual: BrandVisual;
  valuePropositions: string[];
  socialLinks: Record<string, string>;

  // Benchmark metadata
  benchmarkTier: 'gold' | 'silver' | 'bronze';
}

// ============================================
// Web Scraping Functions
// ============================================

async function scrapeBrandWebsite(domain: string): Promise<ScrapedData> {
  console.log(`🌐 Scraping ${domain}...`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const url = domain.startsWith('http') ? domain : `https://${domain}`;

  try {
    // Navigate to homepage
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract all data
    const scrapedData = await page.evaluate(() => {
      // Tagline extraction (priority order)
      const tagline =
        document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        document.querySelector('h1')?.textContent?.trim() ||
        document.querySelector('[class*="hero"] p, [class*="headline"] p')?.textContent?.trim() ||
        null;

      // Description (prefer About meta or first paragraph)
      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        document.querySelector('p')?.textContent?.trim() ||
        null;

      // Logo URL
      const logoUrl =
        document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute('href') ||
        document.querySelector('img[alt*="logo" i], img[class*="logo" i]')?.getAttribute('src') ||
        null;

      // Brand colors from CSS
      const computedStyles = window.getComputedStyle(document.documentElement);
      const primaryColor =
        computedStyles.getPropertyValue('--primary-color') ||
        computedStyles.getPropertyValue('--brand-color') ||
        computedStyles.getPropertyValue('--color-primary') ||
        null;

      const secondaryColor =
        computedStyles.getPropertyValue('--secondary-color') ||
        computedStyles.getPropertyValue('--accent-color') ||
        null;

      // Social links
      const socialLinks: Record<string, string> = {};
      const twitterLink = document.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
      const linkedinLink = document.querySelector('a[href*="linkedin.com"]');
      const facebookLink = document.querySelector('a[href*="facebook.com"]');
      const instagramLink = document.querySelector('a[href*="instagram.com"]');
      const youtubeLink = document.querySelector('a[href*="youtube.com"]');

      if (twitterLink) socialLinks.twitter = twitterLink.getAttribute('href') || '';
      if (linkedinLink) socialLinks.linkedin = linkedinLink.getAttribute('href') || '';
      if (facebookLink) socialLinks.facebook = facebookLink.getAttribute('href') || '';
      if (instagramLink) socialLinks.instagram = instagramLink.getAttribute('href') || '';
      if (youtubeLink) socialLinks.youtube = youtubeLink.getAttribute('href') || '';

      // Extract headings for keywords
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(
        (h) => h.textContent?.trim() || ''
      );

      // Extract FAQ questions for GEO keywords
      const faqQuestions = Array.from(
        document.querySelectorAll('[class*="faq"] h3, [class*="question"], [itemtype*="Question"] [itemprop="name"]')
      ).map((q) => q.textContent?.trim() || '');

      // Homepage text (for AI analysis)
      const homepageText =
        document.querySelector('main')?.textContent?.trim() ||
        document.body.textContent?.trim() ||
        '';

      return {
        tagline,
        description,
        logoUrl,
        primaryColor: primaryColor?.trim() || null,
        secondaryColor: secondaryColor?.trim() || null,
        socialLinks,
        headings,
        faqQuestions,
        homepageText: homepageText.substring(0, 5000), // Limit to 5000 chars
        aboutPageText: '', // Will be populated separately
      };
    });

    // Try to scrape About page
    try {
      const aboutUrl = new URL('/about', url).href;
      await page.goto(aboutUrl, { waitUntil: 'networkidle', timeout: 15000 });

      const aboutText = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main?.textContent?.trim().substring(0, 3000) || '';
      });

      scrapedData.aboutPageText = aboutText;
    } catch (error) {
      console.log('  ⚠️  About page not accessible, skipping...');
    }

    await browser.close();

    // Fallback for logo if not found
    if (!scrapedData.logoUrl) {
      scrapedData.logoUrl = `https://logo.clearbit.com/${domain}`;
    }

    console.log('  ✅ Scraping complete');
    return scrapedData;

  } catch (error) {
    await browser.close();
    throw new Error(`Failed to scrape ${domain}: ${error}`);
  }
}

// ============================================
// AI Analysis Functions
// ============================================

async function analyzeBrandVoice(
  brandName: string,
  homepageText: string,
  aboutText: string
): Promise<{ voice: BrandVoice; valuePropositions: string[] }> {
  console.log(`🤖 Analyzing brand voice for ${brandName}...`);

  const prompt = `Analyze the following website content for the brand "${brandName}" and extract brand voice characteristics:

**Homepage Content:**
${homepageText}

**About Page:**
${aboutText}

Please provide:
1. **Tone**: Choose ONE from: professional, friendly, authoritative, casual, formal
2. **Personality Traits**: 3-5 keywords that describe the brand personality (e.g., innovative, trustworthy, playful, bold, empathetic)
3. **Target Audience**: One sentence describing the primary target audience
4. **Key Messages**: 3-5 core messages or themes the brand emphasizes
5. **Topics to Avoid**: Any obvious brand sensitivities or topics they avoid
6. **Value Propositions**: 3-5 unique value propositions or differentiators

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "tone": "professional|friendly|authoritative|casual|formal",
  "personality": ["trait1", "trait2", "trait3"],
  "targetAudience": "description",
  "keyMessages": ["message1", "message2"],
  "avoidTopics": ["topic1", "topic2"],
  "valuePropositions": ["value1", "value2"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const analysis = JSON.parse(content.text);

    console.log('  ✅ Brand voice analysis complete');

    return {
      voice: {
        tone: analysis.tone,
        personality: analysis.personality,
        targetAudience: analysis.targetAudience,
        keyMessages: analysis.keyMessages,
        avoidTopics: analysis.avoidTopics,
      },
      valuePropositions: analysis.valuePropositions,
    };
  } catch (error) {
    console.error('  ❌ Brand voice analysis failed:', error);
    // Return safe defaults
    return {
      voice: {
        tone: 'professional',
        personality: ['innovative', 'reliable'],
        targetAudience: 'Business professionals',
        keyMessages: [],
        avoidTopics: [],
      },
      valuePropositions: [],
    };
  }
}

async function identifyCompetitors(
  brandName: string,
  domain: string,
  industry: string
): Promise<CompetitorData[]> {
  console.log(`🔍 Identifying competitors for ${brandName}...`);

  const prompt = `Based on this brand profile, identify 5-7 direct competitors:

**Brand**: ${brandName}
**Domain**: ${domain}
**Industry**: ${industry}

For each competitor, provide:
- **name**: Company name
- **url**: Website domain (format: example.com)
- **reason**: Brief reason why they're a competitor (one short sentence)

Focus on well-known, established competitors in the same industry.

Respond ONLY with valid JSON array (no markdown, no explanation):
[
  {
    "name": "Competitor Name",
    "url": "competitor.com",
    "reason": "Direct competitor in X space"
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const competitors = JSON.parse(content.text);
    console.log(`  ✅ Found ${competitors.length} competitors`);

    return competitors;
  } catch (error) {
    console.error('  ❌ Competitor identification failed:', error);
    return [];
  }
}

// ============================================
// Keyword Extraction
// ============================================

function extractKeywords(
  brandName: string,
  headings: string[],
  faqQuestions: string[]
): KeywordSet {
  console.log(`🔑 Extracting keywords...`);

  // Primary keywords: brand name variations
  const primary = [
    brandName,
    brandName.toLowerCase(),
    brandName.replace(/\s+/g, ''), // Remove spaces (e.g., "HubSpot" -> "hubspot")
  ].filter((k, i, arr) => arr.indexOf(k) === i); // Deduplicate

  // SEO keywords: extracted from headings (filter out noise)
  const seo = headings
    .filter((h) => h.length > 3 && h.length < 100) // Reasonable length
    .map((h) => h.toLowerCase().trim())
    .filter((k, i, arr) => arr.indexOf(k) === i) // Deduplicate
    .slice(0, 15); // Limit to top 15

  // GEO keywords: conversational questions from FAQs
  const geo = faqQuestions
    .filter((q) => q.includes('?') || q.toLowerCase().startsWith('how') || q.toLowerCase().startsWith('what'))
    .map((q) => q.trim())
    .filter((k, i, arr) => arr.indexOf(k) === i) // Deduplicate
    .slice(0, 10); // Limit to top 10

  console.log(`  ✅ Extracted ${primary.length + seo.length + geo.length} total keywords`);

  return { primary, seo, geo };
}

// ============================================
// Database Insertion
// ============================================

async function insertBenchmarkBrand(brandData: EnrichedBrandData): Promise<void> {
  console.log(`💾 Inserting ${brandData.name} into database...`);

  // Check for duplicates
  const existing = await db.query.brands.findFirst({
    where: eq(brands.domain, brandData.domain),
  });

  if (existing) {
    console.log(`  ⚠️  Brand already exists (${existing.id}), skipping insert`);
    return;
  }

  // Insert new benchmark brand
  const [inserted] = await db
    .insert(brands)
    .values({
      organizationId: BENCHMARK_ORG_ID,
      name: brandData.name,
      domain: brandData.domain,
      description: brandData.description,
      tagline: brandData.tagline,
      industry: brandData.industry,
      logoUrl: brandData.logoUrl,

      keywords: brandData.keywords,
      seoKeywords: brandData.seoKeywords,
      geoKeywords: brandData.geoKeywords,

      competitors: brandData.competitors,
      valuePropositions: brandData.valuePropositions,
      socialLinks: brandData.socialLinks,

      voice: brandData.voice,
      visual: brandData.visual,

      isBenchmark: true,
      benchmarkTier: brandData.benchmarkTier,
      lastEnrichedAt: new Date(),

      monitoringEnabled: false, // Don't actively monitor benchmarks
      isActive: true,
    })
    .returning();

  console.log(`  ✅ Successfully inserted: ${brandData.name} (${inserted.id})`);
}

// ============================================
// Main Enrichment Function
// ============================================

async function enrichBrand(input: BrandInput): Promise<EnrichedBrandData> {
  console.log(`\n🚀 Starting enrichment for: ${input.name}\n`);

  try {
    // Step 1: Scrape website
    const scrapedData = await scrapeBrandWebsite(input.domain);

    // Step 2: Extract keywords
    const keywords = extractKeywords(input.name, scrapedData.headings, scrapedData.faqQuestions);

    // Step 3: Analyze brand voice
    const { voice, valuePropositions } = await analyzeBrandVoice(
      input.name,
      scrapedData.homepageText,
      scrapedData.aboutPageText
    );

    // Step 4: Identify competitors
    const competitors = await identifyCompetitors(input.name, input.domain, input.industry);

    // Step 5: Assemble enriched data
    const enrichedData: EnrichedBrandData = {
      name: input.name,
      domain: input.domain,
      description: scrapedData.description || `${input.name} - ${input.industry} company`,
      tagline: scrapedData.tagline,
      industry: input.industry,
      logoUrl: scrapedData.logoUrl,

      keywords: keywords.primary,
      seoKeywords: keywords.seo,
      geoKeywords: keywords.geo,

      competitors,
      valuePropositions,
      socialLinks: scrapedData.socialLinks,

      voice,
      visual: {
        primaryColor: scrapedData.primaryColor,
        secondaryColor: scrapedData.secondaryColor,
        accentColor: null,
        colorPalette: [scrapedData.primaryColor, scrapedData.secondaryColor].filter(Boolean) as string[],
        fontFamily: null,
      },

      benchmarkTier: input.tier || 'bronze',
    };

    // Step 6: Insert into database
    await insertBenchmarkBrand(enrichedData);

    console.log(`\n✅ Enrichment complete for ${input.name}\n`);

    return enrichedData;
  } catch (error) {
    console.error(`\n❌ Enrichment failed for ${input.name}:`, error);
    throw error;
  }
}

// ============================================
// CLI Execution
// ============================================

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI arguments
  const nameArg = args.find((arg) => arg.startsWith('--name='))?.split('=')[1];
  const domainArg = args.find((arg) => arg.startsWith('--domain='))?.split('=')[1];
  const industryArg = args.find((arg) => arg.startsWith('--industry='))?.split('=')[1];
  const tierArg = args.find((arg) => arg.startsWith('--tier='))?.split('=')[1] as 'gold' | 'silver' | 'bronze' | undefined;

  if (!nameArg || !domainArg || !industryArg) {
    console.error('Usage: bun run enrich-brand.ts --name="Brand Name" --domain="example.com" --industry="Industry" [--tier=gold|silver|bronze]');
    process.exit(1);
  }

  const brandInput: BrandInput = {
    name: nameArg,
    domain: domainArg,
    industry: industryArg,
    tier: tierArg,
  };

  await enrichBrand(brandInput);
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { enrichBrand, type BrandInput, type EnrichedBrandData };
