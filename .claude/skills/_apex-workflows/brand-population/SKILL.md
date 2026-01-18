# Brand Population Skill

Automate the process of populating benchmark brands into the database for competitive comparison data.

**USE WHEN** user says:
- "populate benchmark brands"
- "add industry brands"
- "enrich brand database"
- "gather brand data for [industry]"
- "run brand population"

---

## Skill Overview

This skill automates the collection, analysis, and insertion of real-world brand data across multiple industries. It enables the platform to provide meaningful competitive benchmarks for user brands.

**Core Capabilities:**
1. Web scraping for brand information
2. AI-powered brand voice analysis
3. Keyword research and extraction
4. Competitor identification
5. Visual identity detection
6. Database insertion with validation

---

## Prerequisites

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-...          # For brand voice analysis
SEMRUSH_API_KEY=...                    # (Optional) For keyword research
NEON_DATABASE_URL=postgresql://...     # Database connection
```

### Required Tools
- ✅ Playwright (web scraping)
- ✅ Anthropic API (brand analysis)
- ✅ Drizzle ORM (database)
- ✅ Chrome DevTools MCP (browser automation)

---

## Workflow: Populate Single Brand

### Step 1: Initialize Browser Session
```typescript
// Use Chrome DevTools MCP
await mcp__chrome-devtools__new_page({
  url: brandDomain
});
```

### Step 2: Scrape Basic Information

**Target Elements:**
- **Tagline**: Meta description, H1, hero section
- **Description**: About page, homepage intro
- **Logo**: OpenGraph image, /logo.svg, /logo.png
- **Colors**: Extract from CSS variables, computed styles
- **Social Links**: Footer, header navigation

**Extraction Strategy:**
```javascript
// Take snapshot to get page structure
const snapshot = await mcp__chrome-devtools__take_snapshot();

// Extract tagline (priority order)
const tagline =
  document.querySelector('meta[name="description"]')?.content ||
  document.querySelector('h1')?.textContent ||
  document.querySelector('[class*="hero"]')?.textContent;

// Extract logo URL
const logoUrl =
  document.querySelector('meta[property="og:image"]')?.content ||
  document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.href ||
  document.querySelector('img[alt*="logo" i]')?.src;

// Extract brand colors
const computedStyles = window.getComputedStyle(document.documentElement);
const primaryColor = computedStyles.getPropertyValue('--primary-color') ||
                     computedStyles.getPropertyValue('--brand-color');

// Extract social links
const socialLinks = {
  twitter: document.querySelector('a[href*="twitter.com"], a[href*="x.com"]')?.href,
  linkedin: document.querySelector('a[href*="linkedin.com"]')?.href,
  facebook: document.querySelector('a[href*="facebook.com"]')?.href,
  instagram: document.querySelector('a[href*="instagram.com"]')?.href,
};
```

### Step 3: Extract Keywords

**Sources:**
1. **Meta Keywords**: `<meta name="keywords">`
2. **H1/H2 Headers**: Topic clustering
3. **FAQ Section**: Question-based GEO keywords
4. **Navigation**: Product/service categories

**Keyword Classification:**
```typescript
interface KeywordSet {
  primary: string[];      // Brand name, core products
  seo: string[];          // Traditional search keywords
  geo: string[];          // Conversational/question-based
}

// Example extraction
const headers = Array.from(document.querySelectorAll('h1, h2, h3'))
  .map(h => h.textContent.trim());

const faqQuestions = Array.from(document.querySelectorAll('[class*="faq"] h3, [class*="question"]'))
  .map(q => q.textContent.trim());

const keywords: KeywordSet = {
  primary: [brandName, ...extractedCategories],
  seo: headers.filter(isSearchKeyword),
  geo: faqQuestions.filter(isConversational),
};
```

### Step 4: Analyze Brand Voice with AI

**Claude API Prompt:**
```typescript
const brandVoicePrompt = `
Analyze the following website content and extract brand voice characteristics:

**Homepage Content:**
${homepageText}

**About Page:**
${aboutPageText}

Please provide:
1. **Tone**: Choose one - professional, friendly, authoritative, casual, formal
2. **Personality Traits**: 3-5 keywords (e.g., innovative, trustworthy, playful)
3. **Target Audience**: One sentence description
4. **Key Messages**: 3-5 core messages the brand emphasizes
5. **Topics to Avoid**: Any obvious brand sensitivities

Format as JSON:
{
  "tone": "...",
  "personality": ["...", "..."],
  "targetAudience": "...",
  "keyMessages": ["...", "..."],
  "avoidTopics": ["..."]
}
`;

const voiceAnalysis = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [{ role: "user", content: brandVoicePrompt }]
});
```

### Step 5: Identify Competitors

**Strategy A: Web Scraping**
- Google "alternatives to {brandName}"
- Scrape G2/Capterra comparison pages
- Extract "Competitors" section from Crunchbase

**Strategy B: AI Analysis**
```typescript
const competitorPrompt = `
Based on this brand profile, identify 5-10 direct competitors:

**Brand**: ${brandName}
**Domain**: ${brandDomain}
**Industry**: ${industry}
**Description**: ${description}

For each competitor, provide:
- Name
- Website URL
- Relationship/reason (one sentence)

Format as JSON array.
`;
```

### Step 6: Validate & Prepare Data

**Quality Checks:**
```typescript
interface ValidationResult {
  isValid: boolean;
  completeness: number; // 0-100
  missingFields: string[];
  warnings: string[];
}

function validateBrandData(data: BrandData): ValidationResult {
  const required = ['name', 'domain', 'industry', 'description'];
  const optional = ['tagline', 'logoUrl', 'keywords', 'competitors', 'socialLinks'];

  const missingRequired = required.filter(field => !data[field]);
  const missingOptional = optional.filter(field => !data[field] || data[field].length === 0);

  const completeness = Math.round(
    ((required.length - missingRequired.length) / required.length) * 60 +
    ((optional.length - missingOptional.length) / optional.length) * 40
  );

  return {
    isValid: missingRequired.length === 0 && completeness >= 70,
    completeness,
    missingFields: [...missingRequired, ...missingOptional],
    warnings: missingRequired.length > 0 ? [`Missing required: ${missingRequired.join(', ')}`] : []
  };
}
```

### Step 7: Insert into Database

**Database Insertion:**
```typescript
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';

// Get system organization ID for benchmarks
const BENCHMARK_ORG_ID = 'org_benchmark_brands';

async function insertBenchmarkBrand(brandData: BrandData) {
  // Check for duplicates
  const existing = await db.query.brands.findFirst({
    where: eq(brands.domain, brandData.domain)
  });

  if (existing) {
    console.log(`Brand ${brandData.name} already exists (${existing.id})`);
    return existing;
  }

  // Insert new brand
  const [inserted] = await db.insert(brands).values({
    organizationId: BENCHMARK_ORG_ID,
    name: brandData.name,
    domain: brandData.domain,
    description: brandData.description,
    tagline: brandData.tagline,
    industry: brandData.industry,
    logoUrl: brandData.logoUrl,

    keywords: brandData.keywords.primary,
    seoKeywords: brandData.keywords.seo,
    geoKeywords: brandData.keywords.geo,

    competitors: brandData.competitors,
    valuePropositions: brandData.valuePropositions,
    socialLinks: brandData.socialLinks,

    voice: brandData.voice,
    visual: brandData.visual,

    isBenchmark: true, // NEW FIELD
    benchmarkTier: calculateTier(brandData), // gold/silver/bronze

    monitoringEnabled: false, // Don't actively monitor benchmarks
    isActive: true,
  }).returning();

  console.log(`✅ Inserted benchmark brand: ${brandData.name} (${inserted.id})`);
  return inserted;
}

function calculateTier(brandData: BrandData): 'gold' | 'silver' | 'bronze' {
  // Gold: Publicly traded, >$1B valuation, household name
  // Silver: Well-funded startups, strong brand recognition
  // Bronze: Emerging brands, niche leaders

  const goldBrands = ['Salesforce', 'Shopify', 'Netflix', 'Spotify', 'Airbnb'];
  const silverBrands = ['Notion', 'Airtable', 'Canva', 'Calm', 'Duolingo'];

  if (goldBrands.includes(brandData.name)) return 'gold';
  if (silverBrands.includes(brandData.name)) return 'silver';
  return 'bronze';
}
```

---

## Workflow: Populate Full Industry

### Master Execution Function

```typescript
interface IndustryBrandList {
  industryName: string;
  brands: Array<{
    name: string;
    domain: string;
    estimatedTier: 'gold' | 'silver' | 'bronze';
  }>;
}

async function populateIndustry(industryData: IndustryBrandList) {
  console.log(`\n🚀 Starting population for industry: ${industryData.industryName}`);
  console.log(`📊 Target: ${industryData.brands.length} brands\n`);

  const results = {
    success: [] as string[],
    failed: [] as { brand: string; error: string }[],
    skipped: [] as string[],
  };

  for (const brand of industryData.brands) {
    console.log(`\n--- Processing: ${brand.name} (${brand.domain}) ---`);

    try {
      // Step 1: Scrape website
      const brandData = await scrapeBrandWebsite(brand.domain);

      // Step 2: Analyze with AI
      const voiceData = await analyzeBrandVoice(brandData.content);
      const competitors = await identifyCompetitors(brand.name, industryData.industryName);

      // Step 3: Validate
      const validation = validateBrandData({
        ...brandData,
        voice: voiceData,
        competitors,
        industry: industryData.industryName,
      });

      if (!validation.isValid) {
        console.warn(`⚠️  Validation failed (${validation.completeness}% complete)`);
        console.warn(`Missing: ${validation.missingFields.join(', ')}`);

        if (validation.completeness < 50) {
          results.failed.push({ brand: brand.name, error: 'Low data completeness' });
          continue;
        }
      }

      // Step 4: Insert
      await insertBenchmarkBrand({
        ...brandData,
        voice: voiceData,
        competitors,
        industry: industryData.industryName,
        benchmarkTier: brand.estimatedTier,
      });

      results.success.push(brand.name);
      console.log(`✅ Successfully processed ${brand.name}`);

      // Rate limiting: wait 10 seconds between brands
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
      console.error(`❌ Failed to process ${brand.name}:`, error);
      results.failed.push({
        brand: brand.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Summary
  console.log(`\n
📈 Industry Population Complete: ${industryData.industryName}
✅ Success: ${results.success.length}
❌ Failed: ${results.failed.length}
⏭️  Skipped: ${results.skipped.length}
  `);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Brands:');
    results.failed.forEach(({ brand, error }) => {
      console.log(`  - ${brand}: ${error}`);
    });
  }

  return results;
}
```

---

## Usage Examples

### Example 1: Populate SaaS Industry
```typescript
const saasIndustry: IndustryBrandList = {
  industryName: 'SaaS / B2B Software',
  brands: [
    { name: 'HubSpot', domain: 'hubspot.com', estimatedTier: 'gold' },
    { name: 'Salesforce', domain: 'salesforce.com', estimatedTier: 'gold' },
    { name: 'Slack', domain: 'slack.com', estimatedTier: 'gold' },
    { name: 'Notion', domain: 'notion.so', estimatedTier: 'silver' },
    { name: 'Airtable', domain: 'airtable.com', estimatedTier: 'silver' },
  ]
};

await populateIndustry(saasIndustry);
```

### Example 2: Enrich Single Brand
```typescript
const brandData = await enrichSingleBrand({
  name: 'Canva',
  domain: 'canva.com',
  industry: 'Marketing / Advertising',
  tier: 'gold'
});

console.log('Brand enriched:', brandData);
```

### Example 3: Validate Existing Brands
```typescript
// Check all benchmark brands for data completeness
const benchmarkBrands = await db.query.brands.findMany({
  where: eq(brands.isBenchmark, true)
});

for (const brand of benchmarkBrands) {
  const validation = validateBrandData(brand);

  if (validation.completeness < 80) {
    console.log(`🔄 Re-enriching ${brand.name} (${validation.completeness}% complete)`);
    await enrichSingleBrand({
      name: brand.name,
      domain: brand.domain!,
      industry: brand.industry!,
      tier: brand.benchmarkTier || 'bronze'
    });
  }
}
```

---

## Error Handling

### Common Issues & Solutions

**Issue: Rate Limiting**
```typescript
class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super(`Rate limited. Retry after ${retryAfter}s`);
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && attempt < maxAttempts) {
        console.log(`⏳ Rate limited. Waiting ${error.retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retry attempts reached');
}
```

**Issue: Website Blocks Scraping**
```typescript
// Use residential proxies or headless browser fingerprinting evasion
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...');
await page.setExtraHTTPHeaders({
  'Accept-Language': 'en-US,en;q=0.9',
});
```

**Issue: Logo Not Found**
```typescript
// Fallback logo sources
const logoSources = [
  `https://logo.clearbit.com/${domain}`, // Clearbit Logo API
  `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
  `https://${domain}/logo.svg`,
  `https://${domain}/assets/logo.svg`,
];

for (const logoUrl of logoSources) {
  const response = await fetch(logoUrl);
  if (response.ok) {
    return logoUrl;
  }
}
```

---

## Quality Assurance

### Manual Review Checklist
After populating each industry, manually review 2-3 brands:

- [ ] Logo displays correctly
- [ ] Tagline is accurate (not generic meta description)
- [ ] Description is concise and brand-specific
- [ ] Competitors are relevant (not random brands)
- [ ] Keywords include both SEO and GEO terms
- [ ] Social links are valid and active
- [ ] Brand voice reflects actual tone

### Automated Quality Metrics
```typescript
interface QualityMetrics {
  avgCompleteness: number;      // Average data completeness across brands
  logoSuccessRate: number;       // % of brands with valid logo URLs
  keywordDensity: number;        // Avg keywords per brand
  competitorRelevance: number;   // % of competitors in same industry
  socialLinkCoverage: number;    // % of brands with 3+ social links
}

function calculateQualityMetrics(brands: Brand[]): QualityMetrics {
  // Implementation
}
```

---

## Performance Optimization

### Parallel Processing
```typescript
// Process 2-3 brands concurrently (respecting rate limits)
const CONCURRENCY = 2;

async function populateIndustryParallel(industryData: IndustryBrandList) {
  const chunks = chunkArray(industryData.brands, CONCURRENCY);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(brand => enrichSingleBrand(brand))
    );

    // Wait between batches
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30s
  }
}
```

### Caching
```typescript
// Cache scraped HTML to avoid re-fetching
const scrapedCache = new Map<string, string>();

async function fetchWithCache(url: string): Promise<string> {
  if (scrapedCache.has(url)) {
    return scrapedCache.get(url)!;
  }

  const html = await fetch(url).then(r => r.text());
  scrapedCache.set(url, html);
  return html;
}
```

---

## Monitoring & Logging

### Job Execution Logs
```typescript
interface JobLog {
  jobId: string;
  type: 'populate-industry' | 'enrich-brand';
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'success' | 'failed';
  brandsProcessed: number;
  errors: string[];
}

// Log to database for tracking
await db.insert(jobLogs).values({
  jobId: createId(),
  type: 'populate-industry',
  industryName: industryData.industryName,
  startedAt: new Date(),
  status: 'running',
});
```

### Progress Tracking
```typescript
// Real-time progress updates
const progress = {
  total: industryData.brands.length,
  completed: 0,
  failed: 0,
};

console.log(`Progress: ${progress.completed}/${progress.total} (${Math.round(progress.completed/progress.total*100)}%)`);
```

---

## Next Steps After Skill Creation

1. **Test Pilot**: Run on 2-3 SaaS brands manually
2. **Validate Output**: Check database records for completeness
3. **Iterate**: Fix any scraping/analysis issues
4. **Automate**: Set up background job queue
5. **Scale**: Process all 50 Phase 1 brands

---

## Appendix: Data Sources

### Primary Sources (Free)
- ✅ Brand website (homepage, about, FAQ)
- ✅ OpenGraph meta tags
- ✅ Clearbit Logo API (free tier)
- ✅ Google Search (for competitors)

### Secondary Sources (Paid/Optional)
- SEMrush API - Keyword research
- Ahrefs API - Competitor analysis
- SimilarWeb - Traffic/competitor data
- Crunchbase - Company profiles

### AI Analysis
- Anthropic Claude API - Brand voice, competitor identification
- OpenAI GPT-4 - Fallback for analysis

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-17
**Maintainer**: Apex AI Team
