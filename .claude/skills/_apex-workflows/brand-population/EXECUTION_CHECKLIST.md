# Brand Population - Execution Checklist

Quick reference for executing the brand population workflow.

---

## Prerequisites ✅

- [x] Database schema updated (`isBenchmark`, `benchmarkTier`, `lastEnrichedAt`)
- [x] Schema changes pushed to database (`bun run db:push`)
- [ ] Environment variable `ANTHROPIC_API_KEY` set
- [ ] Playwright dependencies installed

---

## Setup Steps (One-Time)

### 1. Create Benchmark Organization
```bash
bun run .claude/skills/brand-population/setup-benchmark-org.ts
```

✅ **Expected**: Organization `org_benchmark_brands` created

### 2. Test Single Brand
```bash
bun run .claude/skills/brand-population/enrich-brand.ts \
  --name="Notion" \
  --domain="notion.so" \
  --industry="SaaS / B2B Software" \
  --tier=silver
```

✅ **Expected**: Brand inserted, ~2 minutes runtime

---

## Phase 1 Execution (50 Brands, 10 Industries)

### Week 1: Priority Industries (10 brands)

**Day 1: SaaS**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=saas
```
- ✅ Brands: HubSpot, Salesforce, Slack, Notion, Airtable
- ⏱️ Duration: ~90 minutes
- 📊 Verify: 5 brands in database, `industry = 'SaaS / B2B Software'`

**Day 2: E-commerce**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=ecommerce
```
- ✅ Brands: Shopify, Etsy, Warby Parker, Glossier, Allbirds
- ⏱️ Duration: ~90 minutes

---

### Week 2: Business Services (15 brands)

**Day 3: Fintech**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=fintech
```
- ✅ Brands: Stripe, Robinhood, Wise, Chime, Plaid

**Day 4: Healthcare**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=healthcare
```
- ✅ Brands: Headspace, Peloton, Calm, Hims & Hers, Zocdoc

**Day 5: Education**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=education
```
- ✅ Brands: Coursera, Duolingo, Masterclass, Khan Academy, Udemy

---

### Week 3: Consumer Brands (15 brands)

**Day 6: Marketing**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=marketing
```
- ✅ Brands: Canva, Mailchimp, SEMrush, Hootsuite, Monday.com

**Day 7: Food & Beverage**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=food
```
- ✅ Brands: DoorDash, HelloFresh, Blue Apron, Oatly, Liquid Death

**Day 8: Travel**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=travel
```
- ✅ Brands: Airbnb, Booking.com, TripAdvisor, Expedia, Vrbo

---

### Week 4: Media & Real Estate (10 brands)

**Day 9: Entertainment**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=entertainment
```
- ✅ Brands: Spotify, Netflix, Twitch, Patreon, Medium

**Day 10: Real Estate**
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=realestate
```
- ✅ Brands: Zillow, Redfin, Compass, Opendoor, Realtor.com

---

## Quality Checks (After Each Industry)

### Database Query
```sql
SELECT
  name,
  industry,
  benchmark_tier,
  array_length(keywords, 1) as keywords,
  array_length(competitors, 1) as competitors,
  created_at
FROM brands
WHERE is_benchmark = true AND industry = '<INDUSTRY_NAME>'
ORDER BY name;
```

### Validation Checklist
- [ ] All 5 brands inserted
- [ ] Keywords >= 10 per brand
- [ ] Competitors >= 5 per brand
- [ ] Logo URLs valid (spot check 2-3 brands)
- [ ] No duplicate domains

---

## Error Recovery

### If a Brand Fails
1. Check error message in console output
2. Manually test domain accessibility: `curl -I https://<domain>`
3. Retry single brand:
   ```bash
   bun run .claude/skills/brand-population/enrich-brand.ts \
     --name="Brand Name" \
     --domain="example.com" \
     --industry="Industry Name" \
     --tier=silver
   ```

### If Rate Limited
- Wait 60 seconds
- Resume with failed brand
- Consider increasing delay between brands in script

---

## Final Verification (After 50 Brands)

### Count Total Brands
```sql
SELECT COUNT(*) FROM brands WHERE is_benchmark = true;
```
✅ **Expected**: 50

### Completeness Score
```sql
SELECT
  AVG(
    CASE
      WHEN name IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN domain IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN industry IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN description IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN tagline IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN logo_url IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN array_length(keywords, 1) >= 10 THEN 20 ELSE 0 END +
      CASE WHEN array_length(competitors, 1) >= 5 THEN 20 ELSE 0 END +
      CASE WHEN jsonb_array_length(social_links::jsonb) >= 3 THEN 10 ELSE 0 END
  ) as avg_completeness_score
FROM brands
WHERE is_benchmark = true;
```
✅ **Target**: >= 80

---

## Post-Execution Tasks

1. **Update Frontend**: Display benchmark comparisons in competitive analysis views
2. **Document Learnings**: Note any issues for future enrichment runs
3. **Schedule Refresh**: Set up monthly job to update GEO scores
4. **Plan Phase 2**: Identify next 10 industries for expansion

---

## Commands Reference

### Single Brand
```bash
bun run .claude/skills/brand-population/enrich-brand.ts \
  --name="<Brand>" \
  --domain="<domain.com>" \
  --industry="<Industry>" \
  --tier=<gold|silver|bronze>
```

### Industry Batch
```bash
bun run .claude/skills/brand-population/populate-industry.ts --industry=<key>
```

### Setup Organization
```bash
bun run .claude/skills/brand-population/setup-benchmark-org.ts
```

---

## Success Metrics

- ✅ **50 brands** inserted
- ✅ **95%+ success rate** (47+ brands enriched successfully)
- ✅ **80%+ completeness** (average data quality)
- ✅ **< $5 total cost** (Anthropic API usage)
- ✅ **< 2 weeks** execution time (background processing)

---

**Status**: Ready for execution
**Next Step**: Run setup script + test with Notion
**Estimated Completion**: 2-4 weeks
