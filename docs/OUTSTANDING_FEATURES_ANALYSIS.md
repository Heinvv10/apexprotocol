# Outstanding Features Analysis

**Date**: 2025-12-18
**Status**: Pre-Admin Detour Backlog Identified
**Total TODOs Found**: 96 items

---

## Executive Summary

While the `feature_list.json` marks all 190 features as "passing" (UI renders), there are **96 TODO items** in the codebase representing incomplete implementations. These are UI components that need to be wired to real APIs/database.

---

## Category 1: GraphQL Resolver Layer (HIGH PRIORITY)
**File**: `src/lib/graphql/schema.ts`
**Count**: 50+ TODOs

The entire GraphQL resolver layer has placeholder implementations that need database connections:

### Query Resolvers (Need Implementation)
- `getBrand` - SELECT * FROM brands WHERE id = $1
- `getBrands` - SELECT * FROM brands WHERE org_id = $1
- `getMention` - SELECT * FROM mentions WHERE id = $1
- `getMentions` - SELECT * FROM mentions WHERE brand_id = $1
- `getGeoScore` - SELECT * FROM geo_scores WHERE brand_id = $1
- `getGeoScoreHistory` - SELECT geo_score_history
- `getRecommendation` - SELECT * FROM recommendations WHERE id = $1
- `getRecommendations` - SELECT * FROM recommendations WHERE brand_id = $1
- `getAudit` - SELECT * FROM audits WHERE id = $1
- `getAudits` - SELECT * FROM audits WHERE brand_id = $1
- `getContent` - SELECT * FROM content WHERE id = $1
- `getContents` - SELECT * FROM content WHERE brand_id = $1
- `getSubscription` - SELECT * FROM subscriptions WHERE org_id = $1
- `getSubscriptionPlans` - SELECT * FROM subscription_plans
- `getIntegrations` - SELECT * FROM integrations WHERE org_id = $1
- `getAnalyticsSummary` - Aggregation query
- `getPlatformComparison` - Platform comparison query
- `getCompetitorAnalysis` - Competitor analysis query

### Mutation Resolvers (Need Implementation)
- `createBrand` - INSERT INTO brands
- `updateBrand` - UPDATE brands SET ...
- `deleteBrand` - DELETE FROM brands
- `refreshMentions` - Scraping service trigger
- `markMentionReviewed` - UPDATE mentions SET reviewed = true
- `calculateGeoScore` - GEO score calculation service
- `updateRecommendationStatus` - UPDATE recommendations SET status
- `assignRecommendation` - UPDATE recommendations SET assigned_to
- `submitRecommendationFeedback` - INSERT INTO recommendation_feedback
- `generateRecommendations` - AI-powered generation
- `startAudit` - Audit job queue
- `cancelAudit` - Audit job cancellation
- `createContent` - INSERT INTO content
- `updateContent` - UPDATE content SET ...
- `deleteContent` - DELETE FROM content
- `optimizeContent` - AI content optimization
- `publishContent` - UPDATE content SET status = 'published'
- `createCheckoutSession` - Stripe checkout
- `updateSubscription` - Stripe subscription update
- `cancelSubscription` - Stripe cancellation
- `connectIntegration` - OAuth flow
- `disconnectIntegration` - Integration disconnection
- `syncIntegration` - Integration sync

---

## Category 2: Dashboard Components (HIGH PRIORITY)
**Count**: 15 components need API wiring

### Dashboard Home (`src/components/dashboard/`)
| Component | File | TODO |
|-----------|------|------|
| Prioritized Recommendations | `prioritized-recommendations.tsx:59` | Fetch recommendations from API |
| GEO Score Trend | `geo-score-trend.tsx:105` | Fetch trend data from API |
| Citation Velocity Chart | `citation-velocity-chart.tsx:23` | Fetch citation velocity data |

### Monitor Section (`src/app/dashboard/monitor/`)
| Page | File | TODO |
|------|------|------|
| Mentions | `mentions/page.tsx:66` | Fetch mentions from API |
| Analytics | `analytics/page.tsx:140,213` | Fetch analytics data, sentiment data |
| Citations | `analytics/citations/page.tsx:122` | Fetch citations from API |
| Prompts | `prompts/page.tsx:54` | Fetch prompts from API |
| Settings | `settings/page.tsx:17,26` | Fetch/save brand config |

### Recommendations Section (`src/app/dashboard/recommendations/`)
| Page | File | TODO |
|------|------|------|
| Kanban Board | `kanban/page.tsx:251` | Fetch recommendations from API |
| Calendar | `calendar/page.tsx:185` | Fetch recommendations from API |

### Other Dashboard Pages
| Page | File | TODO |
|------|------|------|
| Audit History | `audit/history/page.tsx:119` | Fetch history from API |
| Feedback | `feedback/page.tsx:146` | Fetch feedback data |
| Engine Room | `engine-room/page.tsx:199` | Fetch engine room data |

---

## Category 3: Settings & Profile (MEDIUM PRIORITY)
**Count**: 5 items

| Component | File | TODO |
|-----------|------|------|
| Settings Page | `settings/page.tsx:303` | Integrate with Clerk user data |
| Profile Section | `settings-sections.tsx:26` | Fetch profile from API |
| API Keys Section | `settings-sections.tsx:332` | Fetch API keys from API |
| Usage Stats | `settings-sections.tsx:472` | Fetch usage tracking |
| Mobile Nav | `mobile-navigation.tsx:201` | Integrate with Clerk user data |

---

## Category 4: Shared Components (MEDIUM PRIORITY)
**Count**: 6 items

| Component | File | TODO |
|-----------|------|------|
| AI Suggestions Panel | `create/ai-suggestions-panel.tsx:90` | Fetch suggestions from API |
| Onboarding Checklist | `onboarding/onboarding-checklist.tsx:44,229` | Fetch checklist items |
| Competitor Comparison | `competitors/competitor-comparison.tsx:112` | Fetch competitors |
| Notifications Bell | `notifications/notifications-bell.tsx:45` | Fetch notifications |
| Billing Usage Dashboard | `billing/usage-dashboard.tsx:272,289` | Connect to database |

---

## Category 5: Sidebar Badge Counts (LOW PRIORITY)
**Count**: 3 items

| Badge | File | TODO |
|-------|------|------|
| Monitor Badge | `sidebar.tsx:64` | Get from monitoring data |
| Feedback Badge | `sidebar.tsx:90` | Get unread feedback count |
| Recommendations Badge | `sidebar.tsx:106` | Get pending recommendations count |

---

## Category 6: API Routes (MEDIUM PRIORITY)
**Count**: 6 items

| Route | File | TODO |
|-------|------|------|
| Public API v1 | `api/v1/route.ts:129-160` | Implement database queries |
| Gamification | `api/gamification/route.ts:109` | Implement database query |
| Usage Breakdown | `api/usage/breakdown/route.ts:4,25` | Connect to database |

---

## Category 7: Backend Services (MEDIUM PRIORITY)
**Count**: 5 items

| Service | File | TODO |
|---------|------|------|
| Local Payments | `billing/local-payments.ts:837` | Implement refund API |
| API Key Encryption | `api/admin/api-config/[id]/route.ts:231` | Encrypt API keys |
| API Key Encryption | `api/admin/api-config/route.ts:256` | Encrypt API keys |
| LinkedIn Tracker | `people/social-tracker.ts:153` | LinkedIn API/scraping |
| X/Twitter Tracker | `people/social-tracker.ts:170` | X API v2 |
| AI Refinement | `people/discovery.ts:440` | AI implementation |

---

## Recommended Implementation Order

### Phase 1: Core Dashboard Data (Week 1-2)
1. Wire dashboard home components (GEO Score, Recommendations, Citations)
2. Wire Monitor section (Mentions, Analytics, Citations)
3. Wire Recommendations (Kanban, Calendar)

### Phase 2: Settings & Profile (Week 2)
1. Clerk user data integration
2. Profile fetching/updating
3. API keys management

### Phase 3: GraphQL Layer (Week 3-4)
1. Query resolvers with Drizzle ORM
2. Mutation resolvers
3. Real-time subscriptions (if needed)

### Phase 4: Remaining Features (Week 4-5)
1. Sidebar badge counts
2. Notifications system
3. Social tracker implementations
4. API key encryption

---

## Files Affected Summary

| Category | File Count | TODO Count |
|----------|------------|------------|
| GraphQL Schema | 1 | 50+ |
| Dashboard Components | 8 | 12 |
| Monitor Pages | 5 | 7 |
| Recommendations Pages | 2 | 2 |
| Settings Components | 3 | 5 |
| Shared Components | 6 | 8 |
| API Routes | 3 | 6 |
| Backend Services | 4 | 6 |
| **TOTAL** | **32 files** | **96+ TODOs** |

---

*This analysis identifies the backlog that existed before the Admin Dashboard detour.*
