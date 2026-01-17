# Benchmark Brand Population Plan

## Overview
Populate the database with real-world benchmark brands across multiple industries to provide meaningful comparison data for user brands.

**Target**: 5 brands per industry, starting with 10 core industries (50 brands total for Phase 1)

---

## Industry Categories & Target Brands

### Priority Industries (Phase 1 - 10 industries, 50 brands)

#### 1. **SaaS / B2B Software** (High Priority - GEO-critical sector)
- **HubSpot** - hubspot.com - All-in-one marketing/sales platform
- **Salesforce** - salesforce.com - CRM leader
- **Slack** - slack.com - Team communication
- **Notion** - notion.so - Productivity workspace
- **Airtable** - airtable.com - Database/collaboration

#### 2. **E-commerce / Retail**
- **Shopify** - shopify.com - E-commerce platform
- **Etsy** - etsy.com - Handmade marketplace
- **Warby Parker** - warbyparker.com - Eyewear DTC
- **Glossier** - glossier.com - Beauty DTC
- **Allbirds** - allbirds.com - Sustainable footwear

#### 3. **Fintech / Financial Services**
- **Stripe** - stripe.com - Payment processing
- **Robinhood** - robinhood.com - Investment platform
- **Wise** - wise.com - International transfers
- **Chime** - chime.com - Digital banking
- **Plaid** - plaid.com - Financial data API

#### 4. **Healthcare / Wellness**
- **Headspace** - headspace.com - Meditation app
- **Peloton** - onepeloton.com - Fitness platform
- **Calm** - calm.com - Mental wellness
- **Hims & Hers** - forhims.com - Telehealth
- **Zocdoc** - zocdoc.com - Healthcare booking

#### 5. **Education / EdTech**
- **Coursera** - coursera.org - Online learning
- **Duolingo** - duolingo.com - Language learning
- **Masterclass** - masterclass.com - Expert courses
- **Khan Academy** - khanacademy.org - Free education
- **Udemy** - udemy.com - Course marketplace

#### 6. **Marketing / Advertising**
- **Canva** - canva.com - Design platform
- **Mailchimp** - mailchimp.com - Email marketing
- **SEMrush** - semrush.com - SEO tools
- **Hootsuite** - hootsuite.com - Social media management
- **Monday.com** - monday.com - Work management

#### 7. **Food & Beverage**
- **DoorDash** - doordash.com - Food delivery
- **HelloFresh** - hellofresh.com - Meal kits
- **Blue Apron** - blueapron.com - Meal delivery
- **Oatly** - oatly.com - Alternative milk
- **Liquid Death** - liquiddeath.com - Canned water

#### 8. **Travel / Hospitality**
- **Airbnb** - airbnb.com - Vacation rentals
- **Booking.com** - booking.com - Hotel booking
- **TripAdvisor** - tripadvisor.com - Travel reviews
- **Expedia** - expedia.com - Travel booking
- **Vrbo** - vrbo.com - Vacation rentals

#### 9. **Entertainment / Media**
- **Spotify** - spotify.com - Music streaming
- **Netflix** - netflix.com - Video streaming
- **Twitch** - twitch.tv - Live streaming
- **Patreon** - patreon.com - Creator monetization
- **Medium** - medium.com - Publishing platform

#### 10. **Real Estate / PropTech**
- **Zillow** - zillow.com - Real estate marketplace
- **Redfin** - redfin.com - Real estate brokerage
- **Compass** - compass.com - Real estate tech
- **Opendoor** - opendoor.com - iBuying platform
- **Realtor.com** - realtor.com - Property listings

---

## Data Collection Strategy

### Required Information Per Brand

#### 1. **Basic Brand Profile**
- ✅ Name
- ✅ Domain (primary website)
- ✅ Industry classification
- ✅ Tagline (from website/meta tags)
- ✅ Description (1-2 sentences, from About page)
- ✅ Logo URL (high-res, preferably SVG)

#### 2. **SEO/GEO Keywords** (15-25 per brand)
- ✅ Primary keywords (brand name, product categories)
- ✅ SEO keywords (traditional search focus)
- ✅ GEO keywords (conversational/question-based)
- **Sources**: SEMrush, Ahrefs, Google Search Console patterns

#### 3. **Competitors** (5-10 per brand)
- ✅ Competitor name
- ✅ Competitor URL
- ✅ Relationship/reason (e.g., "Direct competitor in CRM space")

#### 4. **Value Propositions** (3-5 per brand)
- ✅ Core differentiators from homepage/positioning
- Examples: "All-in-one platform", "Easy to use", "Affordable pricing"

#### 5. **Social Links**
- ✅ Twitter/X
- ✅ LinkedIn
- ✅ Facebook
- ✅ Instagram
- ✅ YouTube (if applicable)

#### 6. **Brand Voice Analysis**
- ✅ Tone classification (professional/friendly/authoritative/casual)
- ✅ Personality traits (3-5 keywords from content analysis)
- ✅ Target audience description
- ✅ Key messages (from homepage/marketing)

#### 7. **Visual Identity**
- ✅ Primary brand color (hex)
- ✅ Secondary color (hex)
- ✅ Accent color (hex)
- ✅ Font family (primary)

#### 8. **GEO/AEO Performance Metrics** (Simulated/Estimated)
- ✅ AI platform mentions (ChatGPT, Claude, Gemini, Perplexity, Grok)
- ✅ Estimated GEO score (0-100, based on brand size/presence)
- ✅ Platform visibility breakdown

---

## Data Gathering Process (Per Brand)

### Phase A: Automated Web Scraping (10-15 min per brand)

1. **Website Analysis**
   - Scrape homepage for tagline, description, value props
   - Extract meta tags (title, description, keywords)
   - Identify primary brand colors from CSS
   - Download logo (OpenGraph image or logo asset)

2. **Keyword Research**
   - Use SEMrush API (if available) for keyword data
   - Extract H1/H2 headers for topic clustering
   - Analyze FAQ sections for GEO keywords

3. **Social Media Discovery**
   - Scrape footer/header for social links
   - Validate links are active

4. **Competitor Identification**
   - Use SimilarWeb/SEMrush competitor data
   - Analyze "Alternatives to X" pages
   - Extract from G2/Capterra comparison pages

### Phase B: AI-Powered Analysis (5-10 min per brand)

1. **Brand Voice Analysis**
   - Feed homepage copy to Claude API
   - Extract tone, personality, key messages
   - Classify target audience

2. **Value Proposition Extraction**
   - Analyze hero sections, feature lists
   - Summarize core differentiators

3. **GEO Performance Simulation**
   - Query AI platforms with brand name + industry keywords
   - Count mentions, analyze positioning
   - Generate estimated GEO score

### Phase C: Manual Validation (2-5 min per brand)

1. **Data Quality Check**
   - Verify logo renders correctly
   - Confirm competitor relevance
   - Validate social links

2. **Deduplication**
   - Check if brand already exists in DB
   - Merge data if partial record exists

---

## Database Schema Requirements

### Using Existing `brands` Table ✅
The existing schema supports all required fields:
- ✅ Basic info (name, domain, description, tagline, industry, logoUrl)
- ✅ Keywords (keywords, seoKeywords, geoKeywords)
- ✅ Competitors (competitors array with name, url, reason)
- ✅ Value propositions (valuePropositions array)
- ✅ Social links (socialLinks object)
- ✅ Brand voice (voice object)
- ✅ Visual identity (visual object)

### Organization Assignment Strategy
**Benchmark brands should be assigned to a special "system" organization:**
- Create `org_benchmark_brands` organization (if not exists)
- All benchmark brands use this organizationId
- Mark brands with `isBenchmark: true` flag (requires schema update)

### Schema Enhancement Needed
```typescript
// Add to brands table:
isBenchmark: boolean("is_benchmark").default(false).notNull(),
benchmarkTier: text("benchmark_tier"), // 'gold', 'silver', 'bronze' (by company size)
lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),
```

---

## Automation Workflow

### Background Job Architecture (BullMQ)

#### Job Queue: `brand-population`

**Job Types:**
1. `populate-industry` - Process all brands in one industry
2. `enrich-brand` - Gather data for one specific brand
3. `validate-brand` - Quality check existing brand data
4. `refresh-metrics` - Update GEO scores for benchmark brands

**Execution Strategy:**
- **Priority**: Low (runs when system is idle)
- **Rate Limiting**: Max 5 brands/hour (avoid rate limits)
- **Retry Policy**: 3 attempts with exponential backoff
- **Concurrency**: 2 parallel jobs max

#### Job Data Structure
```typescript
interface BrandPopulationJob {
  type: 'populate-industry' | 'enrich-brand' | 'validate-brand' | 'refresh-metrics';
  industryCategory?: string; // For populate-industry
  brandName?: string;        // For enrich-brand
  brandDomain?: string;      // For enrich-brand
  priority: 'low' | 'medium' | 'high';
}
```

### Execution Timeline

**Phase 1 (Week 1)**: SaaS + E-commerce (10 brands)
- Days 1-2: SaaS brands (5 brands, ~2 hours)
- Days 3-4: E-commerce brands (5 brands, ~2 hours)

**Phase 2 (Week 2)**: Fintech + Healthcare + Education (15 brands)
- ~3 hours total, spread across idle periods

**Phase 3 (Week 3)**: Marketing + Food & Beverage + Travel (15 brands)

**Phase 4 (Week 4)**: Entertainment + Real Estate (10 brands)

**Total Estimated Time**: 8-12 hours of background processing over 4 weeks

---

## Implementation Checklist

### Database Preparation
- [ ] Add `isBenchmark`, `benchmarkTier`, `lastEnrichedAt` to brands schema
- [ ] Create migration for schema changes
- [ ] Create `org_benchmark_brands` system organization
- [ ] Set up indexes for benchmark brand queries

### Skill Development
- [ ] Create `.claude/skills/brand-population/` directory
- [ ] Write SKILL.md with full automation instructions
- [ ] Create brand data gathering protocols
- [ ] Build validation/quality check scripts

### API Integrations
- [ ] Set up Playwright for web scraping
- [ ] Configure Anthropic API for brand voice analysis
- [ ] (Optional) Integrate SEMrush API for keyword data
- [ ] (Optional) Integrate SimilarWeb for competitor data

### Background Jobs
- [ ] Create BullMQ queue for brand population
- [ ] Implement job handlers (populate-industry, enrich-brand, etc.)
- [ ] Set up job scheduling (cron for weekly refreshes)
- [ ] Add job monitoring/logging

### Quality Assurance
- [ ] Manual review of first 5 brands
- [ ] Automated validation script
- [ ] Deduplication checks
- [ ] Data completeness scoring

---

## Success Metrics

### Phase 1 Completion Criteria
- ✅ 50 benchmark brands in database
- ✅ 100% data completeness (all required fields populated)
- ✅ 95%+ accuracy on manual validation spot checks
- ✅ Average enrichment time < 20 minutes per brand
- ✅ Zero duplicate brands

### Ongoing Maintenance
- **Monthly refresh**: Update GEO scores for all benchmark brands
- **Quarterly review**: Add 2-3 new brands per industry
- **Annual audit**: Validate all data is still accurate

---

## Cost Estimation

### API Costs (per brand)
- **Anthropic API**: ~$0.05-0.10 (brand voice analysis)
- **SEMrush API**: ~$0.00 (free tier sufficient for 50 brands)
- **Playwright scraping**: $0.00 (self-hosted)

**Total Phase 1 Cost**: ~$2.50-$5.00 for 50 brands

### Time Investment
- **Setup**: 4-6 hours (skill creation, database prep)
- **Automation execution**: 8-12 hours (spread over 4 weeks, background)
- **Validation**: 2-4 hours (spot checks, quality assurance)

**Total**: 14-22 hours over 4 weeks (mostly automated background processing)

---

## Next Steps

1. **Review & Approve Plan** - Confirm industry list and brand selection
2. **Schema Updates** - Add benchmark brand fields to database
3. **Create Brand Population Skill** - Build `.claude/skills/brand-population/`
4. **Pilot Test** - Run on 2-3 SaaS brands manually
5. **Automate** - Set up background jobs and execute Phase 1

---

## Appendix: Future Expansion Industries

**Phase 2 (Q2)**: Additional 10 industries
- Cybersecurity
- HR Tech
- Legal Tech
- Insurance Tech
- Supply Chain / Logistics
- Gaming
- Fashion / Apparel
- Beauty / Cosmetics
- Home & Garden
- Automotive

**Total Phase 1 + 2**: 100 benchmark brands across 20 industries
