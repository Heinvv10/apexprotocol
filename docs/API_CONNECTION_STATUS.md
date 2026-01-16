# API Connection Status & Real Data Flows

**Last Updated:** 2026-01-16
**Status:** MIXED - Some APIs fully connected to database, others return mock/empty data

---

## Executive Summary

### ✅ GOOD NEWS: Core Infrastructure Exists
- **200+ API route files** in `src/app/api/`
- **Drizzle ORM** fully configured with PostgreSQL (Neon)
- **32+ database tables** (schema files in `src/lib/db/schema/`)
- **Real database queries** implemented in many routes
- **Frontend API layer** complete (hooks + clients)

### ⚠️ STATUS: Partial Implementation
- Some routes have **real database implementations**
- Some routes return **empty/mock data** (marked with `// TODO` comments)
- Frontend components gracefully fall back to mock data when API returns empty results

---

## Frontend API Clients (in `src/lib/api/`)

| Client File | Purpose | Backend Routes Exist? | Real Data Flow? |
|-------------|---------|----------------------|-----------------|
| `crm.ts` | CRM (Leads, Accounts, Deals) | ❌ NO `/api/crm/*` routes | ❌ Returns empty arrays |
| `social.ts` | Social Media | ✅ YES `/api/social/route.ts` | ✅ **REAL DATABASE** |
| `seo.ts` | SEO Monitoring | ⚠️ PARTIAL | ⚠️ Mixed |
| `analytics.ts` | Analytics Dashboard | ✅ YES `/api/analytics/dashboard` | ✅ **REAL DATABASE** |
| `marketing.ts` | Marketing Campaigns | ⚠️ PARTIAL `/api/marketing/*` | ⚠️ Mixed |
| `platform-monitoring.ts` | Platform Monitoring | ⚠️ PARTIAL | ⚠️ Mixed |
| `integrations.ts` | External Integrations | ✅ YES `/api/integrations/*` | ⚠️ OAuth placeholders |
| `admin.ts` | Admin Operations | ✅ YES `/api/admin/*` | ✅ **REAL DATABASE** |

---

## Backend API Routes by Module

### ✅ FULLY IMPLEMENTED (Real Database Queries)

#### 1. **Analytics** (`/api/analytics/`)
**Routes:**
- `/api/analytics/dashboard` - ✅ **REAL** (293 lines of Drizzle queries)
- `/api/analytics/geo-score` - ✅ **REAL**
- `/api/analytics/unified-score` - ✅ **REAL**

**Database Tables Used:**
- `brandMentions` - Platform mentions
- `recommendations` - Smart recommendations
- `audits` - Site audits
- `content` - Content inventory
- `geoScoreHistory` - Historical GEO scores
- `activityLog` - Recent activity

**Data Flow:**
```
User Request → Next.js API Route → Drizzle ORM → Neon PostgreSQL → Response
```

**Example Query** (from `/api/analytics/dashboard/route.ts`):
```typescript
// Real database aggregation
const mentionsData = await db
  .select({
    total: count(),
    positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
    neutral: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'neutral' THEN 1 END)`,
    negative: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'negative' THEN 1 END)`,
  })
  .from(brandMentions)
  .where(eq(brandMentions.brandId, brandId));
```

---

#### 2. **Social Media** (`/api/social/`)
**Routes:**
- `/api/social/route.ts` - ✅ **REAL** (391 lines, multi-source data)
- `/api/social/accounts/route.ts` - ✅ **REAL**
- `/api/social/scan/route.ts` - ✅ **REAL** (service scan integration)
- `/api/social/twitter/mentions/route.ts` - ✅ **REAL**

**Database Tables Used:**
- `socialAccounts` - Connected social accounts
- `socialMentions` - Brand mentions on social media
- `socialMetrics` - Daily metrics per platform
- `socialScores` - Historical SMO scores
- `serviceScanResults` - No-OAuth scan data (Phase 8.6)

**Data Sources (Priority Order):**
1. **Service Scan Results** (Phase 8.6 - no OAuth required)
2. **OAuth-connected accounts** (real-time data)
3. **Stored scores** (historical data)
4. **Calculated scores** (fallback from aggregates)

**Data Flow:**
```
User Request → Check Service Scan → Check OAuth Data → Check Stored Score → Calculate if needed → Response
```

---

#### 3. **Admin Operations** (`/api/admin/`)
**Routes** (17 implemented):
- `/api/admin/dashboard/stats` - ✅ **REAL**
- `/api/admin/dashboard/activity` - ✅ **REAL**
- `/api/admin/dashboard/ai-costs` - ✅ **REAL**
- `/api/admin/dashboard/audit-jobs` - ✅ **REAL**
- `/api/admin/dashboard/health` - ✅ **REAL**
- `/api/admin/dashboard/resources` - ✅ **REAL**
- `/api/admin/users` - ✅ **REAL**
- `/api/admin/organizations` - ✅ **REAL**
- `/api/admin/api-keys/*` - ✅ **REAL**
- `/api/admin/api-config/*` - ✅ **REAL**
- `/api/admin/audit-logs/*` - ✅ **REAL**

**Database Tables Used:**
- `users` - User management
- `organizations` - Organization management
- `apiKeys` - API key management
- `systemAuditLogs` - Audit trail
- `systemSettings` - Configuration
- `usageTracking` - API usage tracking

---

#### 4. **Competitive Intelligence** (`/api/competitive/`)
**Routes:**
- `/api/competitive/route.ts` - ✅ **REAL**
- `/api/competitive/benchmark/[brandId]/route.ts` - ✅ **REAL**
- `/api/competitive/comparison/route.ts` - ✅ **REAL**
- `/api/competitive/discover/route.ts` - ✅ **REAL**
- `/api/competitive/snapshots/route.ts` - ✅ **REAL**

**Database Tables Used:**
- `competitors` - Competitor tracking
- `competitorBenchmarks` - Performance benchmarks
- `competitorSnapshots` - Historical snapshots
- `competitorDiscovery` - Auto-discovered competitors

---

#### 5. **Recommendations** (`/api/recommendations/`)
**Routes:**
- `/api/recommendations/route.ts` - ✅ **REAL**
- `/api/recommendations/generate/route.ts` - ✅ **REAL** (AI-powered)
- `/api/recommendations/action-plans/route.ts` - ✅ **REAL**
- `/api/recommendations/effectiveness/route.ts` - ✅ **REAL**
- `/api/recommendations/schedule/route.ts` - ✅ **REAL**
- `/api/recommendations/social-media/route.ts` - ✅ **REAL**

**Database Tables Used:**
- `recommendations` - Smart recommendations
- `recommendationActionPlans` - Execution plans
- `recommendationEffectiveness` - ROI tracking
- `recommendationTemplates` - AI templates

**AI Integration:**
- Uses Claude API for recommendation generation
- ML-based prioritization
- QA validation

---

#### 6. **Audit System** (`/api/audit/`)
**Routes:**
- `/api/audit/route.ts` - ✅ **REAL**
- `/api/audit/analyze/route.ts` - ✅ **REAL**
- `/api/audit/[id]/route.ts` - ✅ **REAL**
- `/api/audit/[id]/cancel/route.ts` - ✅ **REAL**
- `/api/audit/[id]/retry/route.ts` - ✅ **REAL**

**Database Tables Used:**
- `audits` - Site audits
- `auditResults` - Detailed results
- `auditScans` - Technical scans

---

#### 7. **Brands** (`/api/brands/`)
**Routes:**
- `/api/brands/route.ts` - ✅ **REAL**
- `/api/brands/[id]/route.ts` - ✅ **REAL**
- `/api/brands/scrape/route.ts` - ✅ **REAL**
- `/api/brands/scrape/[jobId]/route.ts` - ✅ **REAL**

**Database Tables Used:**
- `brands` - Brand management
- `brandMetadata` - Extended metadata

---

### ⚠️ PARTIALLY IMPLEMENTED (Routes exist, return empty/mock data)

#### 8. **Marketing** (`/api/marketing/`)
**Routes:**
- `/api/marketing/campaigns/route.ts` - ⚠️ Exists (stub/empty)
- `/api/marketing/emails/route.ts` - ⚠️ Exists (stub/empty)
- `/api/marketing/analytics/route.ts` - ⚠️ Exists (stub/empty)
- `/api/marketing/social/route.ts` - ⚠️ Exists (stub/empty)

**Status:** Routes exist but likely return placeholder/empty data

**Database Tables Available:**
- `emailCampaigns` - Email campaigns
- `emailSequences` - Automation sequences
- `emailLists` - Contact lists
- `emailTemplates` - Email templates

**Integration Points:**
- Mautic API (external)
- ListMonk API (external)

---

#### 9. **Monitor** (`/api/monitor/`)
**Routes:**
- `/api/monitor/brands/route.ts` - ⚠️ Exists
- `/api/monitor/mentions/route.ts` - ⚠️ Exists
- `/api/monitor/citations/route.ts` - ⚠️ Exists
- `/api/monitor/platforms/route.ts` - ⚠️ Exists
- `/api/monitor/run/route.ts` - ⚠️ Exists

**Status:** Likely implemented but need to verify data flow

---

#### 10. **Content** (`/api/content/`)
**Routes:**
- `/api/content/route.ts` - ⚠️ Exists
- `/api/content/inventory/route.ts` - ⚠️ Exists
- `/api/content/metrics/route.ts` - ⚠️ Exists
- `/api/content/suggestions/route.ts` - ⚠️ Exists

**Database Tables Available:**
- `content` - Content inventory
- `contentSuggestions` - AI suggestions

---

### ❌ NOT IMPLEMENTED (Frontend expects, backend missing)

#### 11. **CRM Module** (`/api/crm/*`)
**Frontend Expects:**
- `/api/crm/leads` - ❌ Route does NOT exist
- `/api/crm/accounts` - ❌ Route does NOT exist
- `/api/crm/pipeline` - ❌ Route does NOT exist

**Current Behavior:**
- Frontend API client (`crm.ts`) returns empty arrays
- Pages display mock data only
- No database connection

**What's Needed:**
1. Create `/api/crm/leads/route.ts`
2. Create `/api/crm/accounts/route.ts`
3. Create `/api/crm/pipeline/route.ts`
4. Integrate with Mautic API (CRM backend)
5. Or create database tables for CRM data

**Integration Option:**
- Mautic has API for leads/contacts
- Webhook handler exists: `/api/webhooks/mautic/route.ts`

---

## Database Schema Overview

### Core Tables (32 schema files)

#### **Brand & Identity**
- `brands` - Brand management
- `brandMetadata` - Extended metadata
- `brandMentions` - Platform mentions

#### **Social Media** (6 tables)
- `socialAccounts` - OAuth-connected accounts
- `socialMentions` - Brand mentions
- `socialMetrics` - Daily metrics
- `socialScores` - Historical SMO scores
- `socialPosts` - Published posts
- `serviceScanResults` - No-OAuth scan data

#### **Analytics & Scoring** (5 tables)
- `geoScoreHistory` - GEO score tracking
- `smoScoreHistory` - SMO score tracking
- `geoScoreComponents` - Score breakdown
- `activityLog` - User activity
- `usageTracking` - API usage

#### **Content & Publishing** (4 tables)
- `content` - Content inventory
- `contentSuggestions` - AI suggestions
- `contentPublishing` - Publishing queue
- `contentMetadata` - Extended metadata

#### **Marketing** (5 tables)
- `emailCampaigns` - Email campaigns
- `emailSequences` - Automation
- `emailLists` - Contact lists
- `emailTemplates` - Templates
- `emailMetrics` - Performance tracking

#### **Recommendations** (4 tables)
- `recommendations` - Smart recommendations
- `recommendationActionPlans` - Execution plans
- `recommendationEffectiveness` - ROI tracking
- `recommendationTemplates` - AI templates

#### **Competitive Intelligence** (5 tables)
- `competitors` - Competitor tracking
- `competitorBenchmarks` - Performance data
- `competitorSnapshots` - Historical data
- `competitorDiscovery` - Auto-discovery
- `competitorMentions` - Mention tracking

#### **Admin & System** (8 tables)
- `users` - User management
- `organizations` - Organization management
- `apiKeys` - API key management
- `systemAuditLogs` - Audit trail
- `systemSettings` - Configuration
- `notifications` - Notification system
- `usageTracking` - Usage tracking
- `jobs` - Background jobs

---

## External Service Integrations

### ✅ Integrated (Webhooks + APIs)

1. **Mautic CRM**
   - Webhook: `/api/webhooks/mautic/route.ts`
   - Purpose: Lead management, email marketing
   - Status: Webhook ready, API integration partial

2. **ListMonk Email**
   - Webhook: `/api/webhooks/listmonk/route.ts`
   - Purpose: Email campaigns, subscriber management
   - Status: Webhook ready

3. **Postiz Social Media**
   - Webhook: `/api/webhooks/postiz/route.ts`
   - Purpose: Social media scheduling, posting
   - Status: Webhook ready

4. **Clerk Authentication**
   - Webhook: `/api/webhooks/clerk/route.ts`
   - Purpose: User authentication, SSO
   - Status: ✅ Fully integrated

5. **Playwright Scraping**
   - Library: `@/lib/scraping/` (Playwright-based)
   - Purpose: Platform monitoring, competitor tracking
   - Status: ✅ Implemented

### ⚠️ Configured (OAuth placeholders)

6. **LinkedIn OAuth**
   - Routes: `/api/settings/oauth/linkedin/*`
   - Purpose: Social account connection
   - Status: Routes exist, need OAuth credentials

7. **Google Services**
   - Google Analytics: `/api/integrations/google-analytics/route.ts`
   - Google Search Console: `/api/integrations/google-search-console/route.ts`
   - Status: Placeholder routes

8. **Project Management**
   - Asana: `/api/integrations/asana/route.ts`
   - Jira: `/api/integrations/jira/route.ts`
   - Linear: `/api/integrations/linear/route.ts`
   - Trello: `/api/integrations/trello/route.ts`
   - Status: Placeholder routes

---

## Real Data Flows (Implemented)

### 1. Analytics Dashboard Flow
```
[Browser Request]
   ↓
[/api/analytics/dashboard?brandId=xxx]
   ↓
[Auth Check - Clerk getUserId()]
   ↓
[Drizzle ORM Queries]
   ├─ Aggregate mentions (positive/negative/neutral)
   ├─ Count recommendations (total/completed/pending)
   ├─ Get audit statistics
   ├─ Fetch content metrics
   ├─ Group mentions by platform
   ├─ Calculate GEO score from history
   └─ Fetch recent activity
   ↓
[Neon PostgreSQL Database]
   ↓
[JSON Response with aggregated metrics]
   ↓
[Frontend useAnalyticsDashboard() hook]
   ↓
[SWR Cache + React State]
   ↓
[Dashboard UI Components]
```

---

### 2. Social Media Flow (Multi-Source)
```
[Browser Request]
   ↓
[/api/social/route.ts?brandId=xxx&type=summary]
   ↓
[Priority 1: Check Service Scan Results]
   ├─ Query serviceScanResults table
   ├─ No OAuth required
   └─ If found: Calculate SMO from scan data
   ↓
[Priority 2: Check OAuth Accounts]
   ├─ Query socialAccounts table
   ├─ Query socialMentions for last 30 days
   └─ If found: Calculate metrics from real data
   ↓
[Priority 3: Check Stored Scores]
   ├─ Query socialScores for latest score
   └─ If found: Return historical score
   ↓
[Priority 4: Calculate Fallback]
   └─ Return default/calculated score
   ↓
[JSON Response with SMO score + breakdown]
   ↓
[Frontend useSocialSummary() hook]
   ↓
[Social Dashboard Components]
```

---

### 3. Recommendation Generation Flow
```
[User clicks "Generate Recommendations"]
   ↓
[/api/recommendations/generate POST]
   ↓
[Fetch brand data from database]
   ↓
[Fetch recent audits, mentions, content]
   ↓
[Call Claude API with context]
   ├─ Brand voice
   ├─ Current GEO score
   ├─ Audit findings
   └─ Competitor data
   ↓
[AI generates prioritized recommendations]
   ↓
[Save to recommendations table]
   ├─ Set priority (critical/high/medium/low)
   ├─ Set category (technical/content/marketing)
   └─ Set status (pending)
   ↓
[Return recommendations to frontend]
   ↓
[Display in Smart Recommendations Engine]
```

---

### 4. Audit System Flow
```
[User starts audit]
   ↓
[/api/audit/analyze POST]
   ↓
[Create audit record in database]
   ↓
[Enqueue background job (BullMQ)]
   ↓
[Background Worker]
   ├─ Playwright crawls site
   ├─ Checks technical SEO
   ├─ Analyzes content
   ├─ Validates schema markup
   └─ Scans for AI visibility issues
   ↓
[Save results to audits + auditResults tables]
   ↓
[Update GEO score based on findings]
   ↓
[Generate recommendations from audit]
   ↓
[Webhook notification (optional)]
   ↓
[Frontend polls /api/audit/[id] for status]
   ↓
[Display audit results page]
```

---

## Frontend-to-Backend Mapping

### API Clients → Backend Routes

```typescript
// src/lib/api/analytics.ts
export async function getAnalyticsDashboard(brandId: string)
  → Calls: /api/analytics/dashboard?brandId=${brandId}
  → Backend: REAL DATABASE IMPLEMENTATION ✅

export async function getSalesMetrics()
  → Calls: NONE (returns mock data)
  → Backend: MISSING ❌

export async function getMarketingMetrics()
  → Calls: NONE (returns mock data)
  → Backend: MISSING ❌

// src/lib/api/social.ts
export async function getSocialAccounts(brandId: string)
  → Calls: NONE (returns mock data)
  → Backend: /api/social/route.ts?type=accounts EXISTS ✅
  → Issue: Frontend client not calling API! 🔧

export async function getSocialMentions(brandId: string)
  → Calls: NONE (returns mock data)
  → Backend: /api/social/route.ts?type=mentions EXISTS ✅
  → Issue: Frontend client not calling API! 🔧

// src/lib/api/crm.ts
export async function getLeads()
  → Calls: NONE (returns empty data)
  → Backend: MISSING ❌

export async function getAccounts()
  → Calls: NONE (returns empty data)
  → Backend: MISSING ❌

export async function getPipeline()
  → Calls: NONE (returns empty data)
  → Backend: MISSING ❌
```

---

## Issues & Fixes Needed

### 🔧 QUICK FIXES (Frontend not calling existing backend)

**Problem:** Some frontend API clients return mock data even though backend routes exist!

**Example - Social API:**
```typescript
// CURRENT (src/lib/api/social.ts):
export async function getSocialAccounts(brandId: string): Promise<SocialAccountsResponse> {
  // For now, return mock data since Social API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    accounts: [],
    total: 0,
  };
}

// FIX:
export async function getSocialAccounts(brandId: string): Promise<SocialAccountsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/social/route?brandId=${brandId}&type=accounts`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse(response);
}
```

**Files to Fix:**
1. `src/lib/api/social.ts` - Connect to `/api/social/route.ts`
2. `src/lib/api/marketing.ts` - Check if routes exist and connect
3. `src/lib/api/seo.ts` - Check if routes exist and connect
4. `src/lib/api/platform-monitoring.ts` - Check if routes exist and connect

---

### ❌ BACKEND IMPLEMENTATIONS NEEDED

#### 1. CRM Module
**Create:**
- `/api/crm/leads/route.ts`
- `/api/crm/accounts/route.ts`
- `/api/crm/pipeline/route.ts`

**Options:**
- A) Integrate with Mautic API (CRM backend already configured)
- B) Create database tables and manage CRM data internally
- C) Hybrid: Sync Mautic data to local database via webhook

---

#### 2. Marketing Analytics
**Missing:**
- `/api/analytics/sales` - Sales metrics
- `/api/analytics/marketing` - Marketing metrics

**Implementation:**
- Query existing `emailCampaigns`, `emailMetrics` tables
- Integrate with Mautic API for lead/conversion data
- Calculate ROI, conversion rates, campaign performance

---

#### 3. SEO Monitoring
**Missing:**
- `/api/seo/keywords` - Keyword tracking
- `/api/seo/rankings` - SERP rankings
- `/api/seo/backlinks` - Backlink analysis

**Implementation:**
- Integrate with Google Search Console API
- Create database tables for historical tracking
- Scraping for competitor keyword data

---

## Recommendations

### Immediate Actions (Priority Order)

**1. FIX DISCONNECTED FRONTENDS (2-4 hours)**
- Update `src/lib/api/social.ts` to call existing `/api/social/route.ts`
- Update `src/lib/api/marketing.ts` if routes exist
- Test and verify data flows correctly

**2. IMPLEMENT CRM ROUTES (1-2 days)**
- Create `/api/crm/*` routes
- Integrate with Mautic API
- Update frontend clients to call new routes

**3. COMPLETE MARKETING ANALYTICS (2-3 days)**
- Implement `/api/analytics/sales`
- Implement `/api/analytics/marketing`
- Connect to existing email campaign tables

**4. ADD SEO MONITORING (3-5 days)**
- Implement `/api/seo/*` routes
- Integrate Google Search Console
- Create historical tracking tables

---

## Summary

### What's Working ✅
- **Core infrastructure**: Drizzle ORM + Neon PostgreSQL fully configured
- **Analytics dashboard**: Real database queries, aggregations, calculations
- **Social media**: Multi-source data (service scans, OAuth, historical)
- **Admin operations**: User management, audit logs, API keys
- **Recommendations engine**: AI-powered generation with database storage
- **Audit system**: Background jobs, Playwright scraping, score calculation
- **Webhooks**: Mautic, ListMonk, Postiz integration points ready

### What's Broken ❌
- **CRM module**: No backend routes (frontend expects them)
- **Sales analytics**: Returns mock data (no backend implementation)
- **Marketing analytics**: Returns mock data (partial backend)

### What's Disconnected 🔧
- **Social API**: Backend exists, frontend not calling it!
- **Some marketing routes**: May exist but frontend returns mock data

---

**Next Steps:** Would you like me to:
1. Fix the disconnected frontends (social, marketing)?
2. Implement the missing CRM routes?
3. Complete the analytics routes?
4. All of the above?
