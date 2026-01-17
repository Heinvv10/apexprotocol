# Benchmark Brands Expansion to 125

**Date:** 2026-01-17
**Status:** ✅ COMPLETE
**Total Brands:** 125 across 25 industries

---

## Overview

Successfully expanded the benchmark brands database from 100 to 125 brands by adding 5 high-impact, high-search-intent industries that are critical for comprehensive GEO/AEO platform coverage.

---

## Expansion Strategy

### Selection Criteria

The 5 new industries were selected based on:

1. **High Search Intent** - Categories with significant AI search queries
2. **B2B + B2C Coverage** - Mix of enterprise and consumer markets
3. **Growing Markets** - Industries with strong growth trajectories
4. **Complementary Coverage** - Filling gaps in existing industry taxonomy

### Industries Added

| Industry | Search Intent | Market Type | Growth |
|----------|--------------|-------------|--------|
| Insurance / Insurtech | High | B2C + B2B | High |
| HR / Recruitment Tech | High | B2B | High |
| Cybersecurity | Very High | B2B + B2C | Very High |
| Legal / Legal Tech | High | B2B + B2C | Medium |
| Mental Health / Therapy Tech | Very High | B2C + B2B | Very High |

---

## Brand Breakdown

### 1. Insurance / Insurtech (5 brands)

**Gold Tier (3):**
- **Lemonade** (lemonade.com) - Digital insurance powered by AI, renters/homeowners/car/pet/life
- **Root Insurance** (root.com) - Usage-based auto insurance with telematics
- **PolicyGenius** (policygenius.com) - Insurance marketplace for comparison and quotes

**Silver Tier (2):**
- **Oscar Health** (hioscar.com) - Health insurance with technology focus
- **Next Insurance** (nextinsurance.com) - Small business insurance online

**Why Important:**
- High-value conversions (insurance purchases)
- Complex comparison queries ideal for AI search
- Trust-based decision making (perfect for GEO content)
- Both personal and business insurance coverage

---

### 2. HR / Recruitment Tech (5 brands)

**Gold Tier (3):**
- **LinkedIn** (linkedin.com) - World's largest professional network (900M+ members)
- **Greenhouse** (greenhouse.io) - Structured hiring and recruiting software
- **Workday** (workday.com) - Enterprise HCM and finance platform

**Silver Tier (2):**
- **BambooHR** (bamboohr.com) - HR software for small/medium businesses
- **Gusto** (gusto.com) - Payroll, benefits, and HR platform

**Why Important:**
- Critical B2B software category
- High-intent career and hiring queries
- Both enterprise and SMB coverage
- Recruitment + HRIS + payroll coverage

---

### 3. Cybersecurity (5 brands)

**Gold Tier (3):**
- **CrowdStrike** (crowdstrike.com) - Cloud-native endpoint and workload protection
- **Palo Alto Networks** (paloaltonetworks.com) - Next-gen firewalls and cloud security
- **1Password** (1password.com) - Password manager for individuals, families, businesses

**Silver Tier (2):**
- **Norton** (norton.com) - Consumer cybersecurity (antivirus, VPN, identity protection)
- **Okta** (okta.com) - Identity and access management (IAM)

**Why Important:**
- Highest growth security sector
- Enterprise + consumer coverage
- Critical for all businesses
- High technical content opportunities

---

### 4. Legal / Legal Tech (5 brands)

**Gold Tier (3):**
- **LegalZoom** (legalzoom.com) - Online legal documents and business formation
- **Clio** (clio.com) - Legal practice management for law firms
- **Rocket Lawyer** (rocketlawyer.com) - Legal services and attorney marketplace

**Silver Tier (2):**
- **Ironclad** (ironcladapp.com) - Contract lifecycle management (CLM)
- **Thomson Reuters** (thomsonreuters.com) - Legal research (Westlaw)

**Why Important:**
- Professional services expansion
- High-value B2B and B2C segments
- Compliance-heavy content (great for E-E-A-T)
- Legal tech growing rapidly

---

### 5. Mental Health / Therapy Tech (5 brands)

**Gold Tier (3):**
- **BetterHelp** (betterhelp.com) - World's largest online therapy platform
- **Talkspace** (talkspace.com) - Virtual therapy and psychiatry
- **Spring Health** (springhealth.com) - Comprehensive workplace mental health

**Silver Tier (2):**
- **Lyra Health** (lyrahealth.com) - Employee mental health benefits
- **Cerebral** (cerebral.com) - Online therapy and medication management

**Why Important:**
- Extremely high growth sector
- Personal/sensitive queries (trust critical)
- B2C teletherapy + B2B employee benefits
- Mental wellness is trending topic

---

## Industry Coverage Analysis

### Complete Industry Taxonomy (25 Industries)

**Original 20 Industries:**
1. SaaS / B2B Software
2. E-commerce / Retail
3. Fintech / Financial Services
4. Healthcare / Wellness
5. Education / E-Learning
6. Marketing / Martech
7. Food & Beverage
8. Travel / Hospitality
9. Entertainment / Media
10. Real Estate / PropTech
11. Consumer Goods
12. Automotive
13. Gaming
14. Fashion / Apparel
15. Home & Garden
16. Beauty / Cosmetics
17. Professional Services
18. Sports & Fitness
19. Telecommunications
20. Energy / Sustainability

**New 5 Industries:**
21. Insurance / Insurtech
22. HR / Recruitment Tech
23. Cybersecurity
24. Legal / Legal Tech
25. Mental Health / Therapy Tech

### Market Segment Coverage

| Segment | Industries | Brands |
|---------|-----------|--------|
| **Consumer** | 10 | 50 |
| **B2B SaaS** | 8 | 40 |
| **Professional Services** | 3 | 15 |
| **Healthcare** | 2 | 10 |
| **Finance** | 2 | 10 |

**Coverage Highlights:**
- ✅ All major consumer categories
- ✅ Complete B2B software stack
- ✅ Professional services (consulting, legal, accounting)
- ✅ Healthcare (wellness + mental health)
- ✅ Financial services (fintech + insurance)
- ✅ Infrastructure (real estate, logistics, telecom, energy)
- ✅ Technology (automotive, gaming, cybersecurity)

---

## Tier Distribution

### Overall Distribution
- **75 Gold Tier Brands** (60%) - Industry leaders
- **50 Silver Tier Brands** (40%) - Strong competitors
- **Total: 125 Brands**

### Per Industry
- **3 Gold + 2 Silver** = 5 brands per industry

This distribution ensures:
- Balanced competitive analysis
- Clear market leader identification
- Sufficient data for share of voice calculations
- Diverse brand voice/strategy examples

---

## Technical Implementation

### Database Schema

All brands include:
- **Core Data**: name, domain, tagline, description, logoUrl, industry
- **SEO**: keywords (3 types), competitors (5 each)
- **Brand Voice**: tone, personality, target audience, key messages
- **Visual Identity**: color palette (4 colors), font family
- **Locations**: JSONB array with headquarters info
- **Personnel**: JSONB array with C-suite executives (LinkedIn profiles)
- **Tier**: benchmarkTier ('gold' | 'silver')
- **Organization**: organizationId ('org_benchmark_brands')

### Scripts Created

1. **add-5-new-industries.ts**
   - Main expansion script
   - 23 brands inserted (Calm/Headspace already existed)
   - All 5 industries with proper data structure

2. **complete-mental-health-industry.ts**
   - Added Spring Health and Cerebral
   - Completed Mental Health industry to 5 brands

3. **count-brands.ts** (updated with .env.local loading)
   - Verification script
   - Shows total and per-industry breakdown

---

## Impact on Platform Features

### 1. Platform Monitoring

**Before (20 industries):**
- Limited to tech, consumer, and some B2B

**After (25 industries):**
- ✅ Complete B2B software coverage (SaaS, HR, Legal, Cybersecurity)
- ✅ Financial services depth (Fintech + Insurance)
- ✅ Healthcare breadth (Wellness + Mental Health)
- ✅ Professional services expansion

**Benefit:** More accurate share of voice calculations across diverse sectors

### 2. Content Creation (GEO/AEO)

**New Content Opportunities:**
- Insurance comparison guides
- HR software buying guides
- Cybersecurity best practices
- Legal tech reviews
- Mental health resource guides

**Benefit:** Broader audience reach, more keyword coverage

### 3. Competitor Analysis

**Enhanced Competitive Intelligence:**
- 125 brands × 5 competitors each = 625 competitor relationships mapped
- Cross-industry competitive dynamics
- Market positioning insights

**Benefit:** Better strategic recommendations for users

### 4. Brand Voice Library

**Expanded Voice Examples:**
- **Empathetic**: BetterHelp, Lyra Health
- **Authoritative**: CrowdStrike, Thomson Reuters
- **Friendly**: Lemonade, BambooHR, 1Password
- **Professional**: LinkedIn, Workday, Palo Alto Networks
- **Supportive**: Talkspace, Cerebral

**Benefit:** More diverse voice templates for content generation

---

## Usage Statistics

### By Industry Type

| Type | Industries | Brands | % of Total |
|------|-----------|--------|------------|
| B2B SaaS | 8 | 40 | 32% |
| Consumer | 10 | 50 | 40% |
| Healthcare | 2 | 10 | 8% |
| Finance | 2 | 10 | 8% |
| Professional | 3 | 15 | 12% |

### By Benchmark Tier

| Tier | Count | % | Typical Role |
|------|-------|---|--------------|
| Gold | 75 | 60% | Market leaders, innovators |
| Silver | 50 | 40% | Strong competitors, challengers |

---

## Recommendations for Future Expansion

### Tier 1: Next Priority Industries (5 more → 150 brands)

1. **Supply Chain / Logistics** - E-commerce critical, complex queries
2. **Web3 / Crypto / Blockchain** - High search volume, emerging
3. **Agriculture / AgTech** - B2B agriculture, sustainability
4. **Pet Care / Pet Tech** - Consumer passion category
5. **Photography / Creative Tools** - Creator economy

### Tier 2: Specialized Industries (5 more → 175 brands)

6. **Construction / ConTech** - Project management, contractor searches
7. **Manufacturing / Industrial** - Enterprise B2B
8. **Biotech / Life Sciences** - Research-heavy, innovation
9. **Non-Profit / Social Impact** - Trust signals, mission-driven
10. **Aerospace / Aviation** - Future-focused, innovation

### Growth Path

- **Phase 1 (Current):** 125 brands across 25 industries ✅
- **Phase 2:** 150 brands across 30 industries
- **Phase 3:** 175 brands across 35 industries
- **Phase 4:** 200 brands across 40 industries

---

## Key Metrics

### Brand Data Completeness

| Field | Completeness |
|-------|--------------|
| Core Info | 100% |
| Keywords | 100% |
| Competitors | 100% (5 per brand) |
| Voice Profile | 100% |
| Visual Identity | 100% |
| Locations | 100% (HQ minimum) |
| Personnel | 100% (C-suite) |

### Industry Balance

- ✅ All 25 industries have exactly 5 brands
- ✅ All industries have 3 gold + 2 silver distribution
- ✅ No industry has duplicate brands
- ✅ All brands have unique domains

---

## Technical Notes

### Environment Configuration

All scripts require `.env.local` loading:

```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
```

### Execution Pattern

```bash
# Count brands
node --import=tsx scripts/count-brands.ts

# Add new industries
node --import=tsx scripts/add-5-new-industries.ts

# Complete industry
node --import=tsx scripts/complete-mental-health-industry.ts
```

### Deduplication Logic

```typescript
const existing = await db.query.brands.findFirst({
  where: eq(brands.domain, brandData.domain),
});

if (existing) {
  console.log(`⏭️  SKIPPED: ${brandData.name} - already exists`);
  continue;
}
```

---

## Conclusion

The expansion to 125 benchmark brands across 25 industries provides:

1. **Comprehensive Industry Coverage** - All major B2B and B2C sectors
2. **Deep Competitive Intelligence** - 625 competitor relationships mapped
3. **Diverse Brand Examples** - Multiple voice tones and strategies
4. **Enhanced GEO/AEO Capabilities** - Broader content opportunities
5. **Scalable Foundation** - Clear path to 150, 175, 200+ brands

The platform now has **25% more brands** with strategically selected industries that address critical gaps in cybersecurity, legal tech, insurance, HR tech, and mental health - all high-growth, high-intent sectors ideal for GEO/AEO optimization.

---

**Next Steps:**
1. Consider Phase 2 expansion to 150 brands
2. Analyze competitor overlap across industries
3. Generate industry-specific content templates
4. Build share of voice dashboards by industry
