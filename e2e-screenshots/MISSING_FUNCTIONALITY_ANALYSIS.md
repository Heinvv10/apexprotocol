# Missing Functionality Analysis - Apex Platform

**Analysis Date**: 2025-12-27
**Analyzed Brand**: Takealot.com
**Issue**: Backend data extraction and population not working

---

## Executive Summary

The E2E test revealed that while the **frontend UI loads correctly**, the **backend data extraction and population is incomplete**. The brand scraping extracts data, but it's not automatically being used to populate the separate database tables for social media, people, competitive intelligence, and monitoring.

**Root Cause**: The brand creation workflow only creates the brand record but doesn't trigger background jobs to populate related data tables.

---

## What's Working ✅

1. **Brand Creation**: Creates brand record in database
2. **Data Extraction**: AI scraping extracts comprehensive data including:
   - Social media links (stored in `brands.socialLinks` JSON field)
   - Competitors (stored in `brands.competitors` JSON array)
   - Monitoring platforms (stored in `brands.monitoringPlatforms` JSON array)
3. **Frontend Pages**: All dashboard pages load without errors
4. **Database Schema**: All required tables exist (people, social, competitive, etc.)

---

## What's Not Working ❌

### 1. Social Media Integration (Social Page)

**Expected**: Display brand social media profiles and analytics
**Actual**: Shows "Analyzing social media presence..." (loading state)

**Root Cause**:
- Social links ARE extracted by AI (stored in `brands.socialLinks`)
- BUT they're NOT being copied to the `social` table
- The Social page queries the `social` table, which is empty

**Database Tables**:
```typescript
// src/lib/db/schema/social.ts
socialProfiles: {
  id, brandId, platform, url, username,
  followers, engagement, lastUpdated
}
```

**Missing Logic**: After brand creation, need to:
1. Read `brands.socialLinks`
2. For each social link, create a `socialProfile` record
3. Optionally: Fetch follower counts and engagement data

---

### 2. LinkedIn People Extraction (People Page)

**Expected**: Display company leadership and employees from LinkedIn
**Actual**: Shows "Analyzing leadership presence..." (loading state)

**Root Cause**:
- People extraction is NOT part of the brand scraping workflow
- The `people` table is empty
- Requires separate LinkedIn scraping/API integration

**Database Tables**:
```typescript
// src/lib/db/schema/people.ts
people: {
  id, brandId, fullName, title, linkedInUrl,
  profileImageUrl, bio, skills, connections
}
```

**Missing Logic**: Need to implement LinkedIn integration:
1. Extract company domain from brand
2. Search LinkedIn for company page
3. Scrape/API call to get employees
4. Save to `people` table

---

### 3. Competitive Intelligence (Competitive Page)

**Expected**: Display competitor analysis and comparison
**Actual**: Shows "Analyzing competitive landscape..." (loading state)

**Root Cause**:
- Competitors ARE extracted by AI (stored in `brands.competitors`)
- BUT they're NOT being copied to the `competitive` tables
- The Competitive page queries `competitorBrands` and `competitorMonitoring` tables, which are empty

**Database Tables**:
```typescript
// src/lib/db/schema/competitive.ts
competitorBrands: {
  id, brandId, competitorId, relationship, priority
}
competitorMonitoring: {
  id, competitorId, platform, mentions, sentiment
}
```

**Missing Logic**: After brand creation, need to:
1. Read `brands.competitors`
2. For each competitor, create a `competitorBrand` record
3. Optionally: Start monitoring competitor mentions

---

### 4. GEO Monitoring Not Configured (Monitor Page)

**Expected**: Display GEO score, AI platform mentions, analytics
**Actual**: Shows "No Monitoring Configured Yet"

**Root Cause**:
- Monitoring platforms ARE configured (stored in `brands.monitoringPlatforms`)
- BUT no mentions data exists in the `mentions` table
- The Monitor page is waiting for actual GEO data to be collected

**Database Tables**:
```typescript
// src/lib/db/schema/mentions.ts
mentions: {
  id, brandId, platform, query, mentionText,
  context, sentiment, position, timestamp
}
```

**Missing Logic**: Need background job to:
1. Read `brands.geoKeywords` and `brands.monitoringPlatforms`
2. Query each AI platform with each keyword
3. Parse responses for brand mentions
4. Save mentions to `mentions` table
5. Calculate GEO score based on visibility

---

### 5. Brand Portfolio Not Created

**Expected**: Brands should be grouped into portfolios
**Actual**: No portfolio created for Takealot brand

**Root Cause**:
- Portfolio creation is manual, not automatic
- Brand was created without specifying a portfolio

**Database Tables**:
```typescript
// src/lib/db/schema/portfolios.ts
portfolios: {
  id, organizationId, name, description, brandIds
}
```

**Missing Logic**: Either:
1. Auto-create a "Default Portfolio" on first brand
2. OR: Add portfolio selection to brand creation wizard

---

### 6. Engine Room Not Functional

**Expected**: Content generation and publishing tools
**Actual**: Page likely shows empty state or errors

**Root Cause**: Engine Room requires:
- Brand voice settings (partially populated)
- Content templates (not created)
- Publishing integrations (not configured)

**Missing Implementation**: Need to build:
1. Content generation workflows
2. AI content prompts using brand voice
3. Publishing integration with social media

---

### 7. Audit Not Working

**Expected**: SEO and technical audits of brand website
**Actual**: Page likely shows empty state or errors

**Root Cause**:
- Audit feature requires running website crawls
- No audit records exist for Takealot

**Database Tables**:
```typescript
// src/lib/db/schema/audits.ts
audits: {
  id, brandId, url, status, score, issues,
  recommendations, createdAt
}
```

**Missing Logic**: Need to:
1. Trigger audit on brand creation OR manually
2. Run comprehensive website crawl
3. Analyze SEO, performance, accessibility
4. Save results to `audits` table

---

## Required Implementations

### Priority 1: Immediate Data Population

Create a **post-brand-creation background job** that:

```typescript
// src/lib/services/brand-post-create.ts

export async function populateBrandData(brandId: string) {
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId)
  });

  // 1. Populate social profiles
  if (brand.socialLinks && Object.keys(brand.socialLinks).length > 0) {
    await populateSocialProfiles(brandId, brand.socialLinks);
  }

  // 2. Populate competitors
  if (brand.competitors && brand.competitors.length > 0) {
    await populateCompetitors(brandId, brand.competitors);
  }

  // 3. Start GEO monitoring
  if (brand.monitoringEnabled && brand.geoKeywords.length > 0) {
    await startGEOMonitoring(brandId);
  }

  // 4. Create default portfolio
  await ensureDefaultPortfolio(brand.organizationId, brandId);

  // 5. Schedule initial audit
  await scheduleAudit(brandId);
}
```

### Priority 2: LinkedIn Integration

```typescript
// src/lib/services/linkedin-scraper.ts

export async function extractLinkedInPeople(brandDomain: string) {
  // Option 1: Use LinkedIn API (requires auth)
  // Option 2: Use web scraping (legal gray area)
  // Option 3: Use third-party service (Clearbit, FullContact, etc.)

  // Extract company employees
  const people = await scrapeLinkedInCompany(brandDomain);

  // Save to database
  await db.insert(peopleTable).values(people);
}
```

### Priority 3: GEO Monitoring Cron Job

```typescript
// src/lib/cron/geo-monitor.ts

export async function runGEOMonitoring() {
  const activeBrands = await db.query.brands.findMany({
    where: eq(brands.monitoringEnabled, true)
  });

  for (const brand of activeBrands) {
    for (const platform of brand.monitoringPlatforms) {
      for (const keyword of brand.geoKeywords) {
        // Query AI platform
        const mentions = await queryAIPlatform(platform, keyword, brand.name);

        // Save mentions
        await db.insert(mentionsTable).values(mentions);
      }
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Data Population (Quick Wins)
- [ ] Create `brand-post-create.ts` service
- [ ] Implement `populateSocialProfiles()` - copy from `brands.socialLinks`
- [ ] Implement `populateCompetitors()` - copy from `brands.competitors`
- [ ] Implement `ensureDefaultPortfolio()` - auto-create portfolio
- [ ] Add background job trigger to brand creation API

### Phase 2: GEO Monitoring (Core Feature)
- [ ] Create GEO monitoring service
- [ ] Implement AI platform query functions (ChatGPT, Claude, Gemini, etc.)
- [ ] Create cron job for periodic monitoring
- [ ] Calculate and display GEO score
- [ ] Build Monitor page data fetching

### Phase 3: LinkedIn Integration (People Feature)
- [ ] Research LinkedIn data extraction methods
- [ ] Implement LinkedIn company scraper
- [ ] Build People page data fetching
- [ ] Add people management UI

### Phase 4: Competitive Intelligence
- [ ] Build competitive monitoring workflows
- [ ] Track competitor GEO scores
- [ ] Create comparison dashboards

### Phase 5: Engine Room & Audit
- [ ] Build content generation workflows
- [ ] Implement website audit runner
- [ ] Create audit scheduling system

---

## Testing Validation

After implementing fixes, re-run E2E test to verify:

1. ✅ Social page displays Takealot's social profiles
2. ✅ People page shows Takealot employees from LinkedIn
3. ✅ Competitive page shows competitor comparison
4. ✅ Monitor page displays GEO score and mentions
5. ✅ Brand is added to a portfolio
6. ✅ Engine Room has content generation tools
7. ✅ Audit page shows website audit results

---

## Conclusion

The platform has **excellent frontend UI and data extraction**, but **lacks the backend workflows** to populate the separate database tables and run background monitoring jobs.

**Key Issue**: Brand creation is a one-time API call, but it should trigger a cascade of background tasks to populate related data.

**Recommended Fix**: Implement a comprehensive `populateBrandData()` post-creation workflow that runs automatically after brand creation completes.
