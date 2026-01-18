# Brand Population Skill - Quick Start

Automate the collection and insertion of benchmark brand data for competitive analysis.

---

## Quick Commands

### Populate Single Brand
```bash
bun run .claude/skills/brand-population/enrich-brand.ts \
  --name="HubSpot" \
  --domain="hubspot.com" \
  --industry="SaaS / B2B Software" \
  --tier=gold
```

### Populate Entire Industry (5 brands)
```bash
# SaaS industry (HubSpot, Salesforce, Slack, Notion, Airtable)
bun run .claude/skills/brand-population/populate-industry.ts --industry=saas

# E-commerce industry
bun run .claude/skills/brand-population/populate-industry.ts --industry=ecommerce
```

### Available Industries
- `saas` - SaaS / B2B Software (5 brands)
- `ecommerce` - E-commerce / Retail (5 brands)
- `fintech` - Fintech / Financial Services (5 brands)
- `healthcare` - Healthcare / Wellness (5 brands)
- `education` - Education / EdTech (5 brands)
- `marketing` - Marketing / Advertising (5 brands)
- `food` - Food & Beverage (5 brands)
- `travel` - Travel / Hospitality (5 brands)
- `entertainment` - Entertainment / Media (5 brands)
- `realestate` - Real Estate / PropTech (5 brands)

**Total Phase 1**: 50 benchmark brands across 10 industries

---

## What Gets Collected

For each brand, the system automatically gathers:

### Basic Information
- Brand name, domain, industry classification
- Tagline and description (from meta tags and homepage)
- Logo URL (high-res, from OpenGraph or Clearbit API)

### SEO/GEO Data
- **Primary keywords** - Brand name variations
- **SEO keywords** - Traditional search keywords from headings
- **GEO keywords** - Conversational questions from FAQ sections

### Competitive Intelligence
- 5-7 direct competitors with URLs and relationship reasons
- Identified through AI analysis and web scraping

### Brand Voice & Positioning
- **Tone** - professional/friendly/authoritative/casual/formal
- **Personality traits** - 3-5 keywords describing brand personality
- **Target audience** - Primary customer segment
- **Key messages** - 3-5 core brand themes
- **Value propositions** - 3-5 unique differentiators

### Visual Identity
- Primary, secondary, and accent brand colors (hex codes)
- Extracted from CSS variables and computed styles

### Social Presence
- Twitter/X, LinkedIn, Facebook, Instagram, YouTube links
- Automatically detected from website footer/header

---

## Prerequisites

### Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...          # For brand voice analysis

# Database (already configured)
NEON_DATABASE_URL=postgresql://...

# Optional (enhances data quality)
SEMRUSH_API_KEY=...                    # For keyword research
```

### Database Schema
The skill adds 3 new fields to the `brands` table:
- `isBenchmark` (boolean) - Marks brands as benchmark data
- `benchmarkTier` (text) - 'gold', 'silver', or 'bronze' classification
- `lastEnrichedAt` (timestamp) - Last time data was refreshed

**Migration required**: Generate and apply migration before running.

---

## Execution Strategy

### Phase 1 - Priority Industries (Week 1-2)
1. **Day 1**: SaaS (5 brands, ~90 min)
2. **Day 2**: E-commerce (5 brands, ~90 min)
3. **Day 3-4**: Fintech + Healthcare (10 brands, ~3 hours)

### Phase 2 - Secondary Industries (Week 3-4)
4. **Week 3**: Education + Marketing + Food (15 brands)
5. **Week 4**: Travel + Entertainment + Real Estate (15 brands)

**Total Time**: 8-12 hours spread over 4 weeks (background processing)

### Rate Limiting
- 15-second delay between brands (avoid API rate limits)
- Max 4 brands/hour
- Playwright browser automation respects robots.txt

---

## Cost Estimate

### Per Brand Costs
- **Anthropic API**: ~$0.05-0.10 (brand voice analysis)
- **Playwright scraping**: $0.00 (self-hosted)
- **Clearbit Logo API**: $0.00 (free tier)

**Total Phase 1 (50 brands)**: ~$2.50-$5.00

---

## Data Quality

### Validation Checks
Each brand is validated for:
- **Completeness score** - 0-100% (minimum 70% required)
- **Required fields** - name, domain, industry, description
- **Optional fields** - tagline, logo, keywords, competitors, social links

### Expected Success Rate
- ✅ **95%+ success** for well-known brands with active websites
- ⚠️ **Lower success** for brands with anti-scraping measures or minimal web presence

### Manual Review
After first 5 brands, manually verify:
- Logo displays correctly in UI
- Competitors are relevant (not random)
- Keywords include both SEO and GEO terms
- Brand voice matches actual tone

---

## Troubleshooting

### Issue: "Brand already exists"
**Solution**: Brand is already in database, skips insert. To re-enrich, delete existing record first.

### Issue: "Failed to scrape website"
**Causes**:
- Website blocks scraping (anti-bot measures)
- Domain is inaccessible or down
- Timeout (site loads slowly)

**Solution**: Retry manually with longer timeout, or skip and enrich manually.

### Issue: "AI analysis failed"
**Causes**:
- Anthropic API key invalid or rate limited
- Homepage text is empty (scraping failed)

**Solution**: Check API key, verify website loaded successfully.

### Issue: "Low data completeness"
**Solution**: Script continues but warns. Manually review and add missing data later.

---

## Monitoring Progress

### Real-Time Output
The script provides detailed progress logging:
```
[1/5] Processing: HubSpot
  🌐 Scraping hubspot.com...
  ✅ Scraping complete
  🔑 Extracting keywords...
  ✅ Extracted 25 total keywords
  🤖 Analyzing brand voice for HubSpot...
  ✅ Brand voice analysis complete
  🔍 Identifying competitors for HubSpot...
  ✅ Found 6 competitors
  💾 Inserting HubSpot into database...
  ✅ Successfully inserted: HubSpot (brand_xyz123)

✅ [1/5] Successfully processed HubSpot
⏳ Waiting 15 seconds before next brand...
```

### Database Queries
Check how many benchmark brands exist:
```sql
SELECT COUNT(*) FROM brands WHERE is_benchmark = true;
```

View benchmark brands by tier:
```sql
SELECT name, industry, benchmark_tier
FROM brands
WHERE is_benchmark = true
ORDER BY benchmark_tier, industry;
```

---

## Next Steps After Population

1. **Verify in UI**: Check that benchmark brands appear in competitive analysis dashboards
2. **Enable Comparisons**: Update frontend to show user brands vs. benchmark averages
3. **Schedule Refreshes**: Set up monthly job to update GEO scores for benchmarks
4. **Expand Dataset**: Add Phase 2 industries (10 more industries, 50 more brands)

---

## Files in This Skill

- `SKILL.md` - Full skill documentation with technical details
- `enrich-brand.ts` - Single brand enrichment script
- `populate-industry.ts` - Batch industry population script
- `README.md` - This quick start guide

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs for specific error messages
3. Manually verify website is accessible
4. Reduce batch size if hitting rate limits

---

**Last Updated**: 2026-01-17
**Skill Version**: 1.0.0
