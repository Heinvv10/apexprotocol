# Apex - Comprehensive Feature Wiring Plan

**Created**: 2026-01-12
**Goal**: Wire up EVERY feature with NO stubs, NO TODOs, fully functional end-to-end

---

## Executive Summary

This plan covers the complete wiring of all Apex features across:
- **175 API Routes** (already created)
- **22 Custom Hooks** (already created)
- **40+ Dashboard Pages** (need wiring to APIs)
- **96 Outstanding TODO Items** (need resolution)

**Estimated Total Effort**: 4-6 weeks of focused development

---

## Phase 1: Core Dashboard Wiring (Priority: CRITICAL)

### 1.1 Dashboard Home Components

| Component | File | Hook | API Endpoint | Status |
|-----------|------|------|--------------|--------|
| GEO Score Gauge | `components/dashboard/geo-score-gauge.tsx` | `useDashboard.useGeoScore()` | `/api/analytics/unified-score` | Wire |
| GEO Score Trend | `components/dashboard/geo-score-trend.tsx` | `useDashboard.useGeoScoreHistory()` | `/api/analytics/unified-score?history=true` | Wire |
| Prioritized Recommendations | `components/dashboard/prioritized-recommendations.tsx` | `useRecommendations()` | `/api/recommendations?priority=high&limit=5` | Wire |
| Citation Velocity Chart | `components/dashboard/citation-velocity-chart.tsx` | `useMonitor.useCitationVelocity()` | `/api/monitor/citations/velocity` | Wire |
| Activity Feed | `components/dashboard/activity-feed.tsx` | `useDashboard.useActivityFeed()` | `/api/analytics/activity` | Wire |
| Platform Breakdown | `components/dashboard/platform-breakdown.tsx` | `useMonitor.usePlatformStats()` | `/api/monitor/platforms` | Wire |

**Implementation Tasks:**
```
[ ] 1.1.1 Create /api/analytics/activity endpoint if missing
[ ] 1.1.2 Create /api/monitor/citations/velocity endpoint if missing
[ ] 1.1.3 Update geo-score-trend.tsx to use useQuery with /api/analytics/unified-score
[ ] 1.1.4 Update prioritized-recommendations.tsx to use useRecommendations hook
[ ] 1.1.5 Update citation-velocity-chart.tsx to fetch from API
[ ] 1.1.6 Remove all mock data from dashboard components
[ ] 1.1.7 Add loading skeletons for all dashboard cards
[ ] 1.1.8 Add error states with retry buttons
```

### 1.2 Sidebar Badge Counts

| Badge | Location | API Endpoint | Implementation |
|-------|----------|--------------|----------------|
| Monitor Badge | `components/layout/sidebar.tsx:64` | `/api/monitor/mentions/count?unread=true` | Query unread mentions |
| Recommendations Badge | `components/layout/sidebar.tsx:106` | `/api/recommendations/count?status=pending` | Query pending count |
| Feedback Badge | `components/layout/sidebar.tsx:90` | `/api/feedback/count?unread=true` | Query unread feedback |

**Implementation Tasks:**
```
[ ] 1.2.1 Create useSidebarCounts hook with parallel queries
[ ] 1.2.2 Add /api/monitor/mentions/count endpoint
[ ] 1.2.3 Add /api/recommendations/count endpoint
[ ] 1.2.4 Add /api/feedback/count endpoint
[ ] 1.2.5 Wire sidebar to display real counts
[ ] 1.2.6 Add real-time updates via polling (30s interval)
```

---

## Phase 2: Monitor Section Wiring (Priority: HIGH)

### 2.1 Monitor Main Page

| Feature | File | Current State | Target |
|---------|------|---------------|--------|
| Platform Selection | `monitor/page.tsx` | Working | Keep |
| Brand Selection | `monitor/page.tsx` | Working | Keep |
| Mentions List | `monitor/page.tsx:239` | Uses useMonitor | Verify real data |
| Platform Filters | `monitor/page.tsx` | Working | Keep |
| Date Range Filter | `monitor/page.tsx` | Working | Keep |

**Implementation Tasks:**
```
[ ] 2.1.1 Verify useMonitor.useMentions() returns real database data
[ ] 2.1.2 Ensure /api/monitor/mentions supports all filter parameters
[ ] 2.1.3 Add pagination to mentions list
[ ] 2.1.4 Wire "Mark as Reviewed" action
[ ] 2.1.5 Wire "Report Issue" action
```

### 2.2 Mentions Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Mentions Grid | `monitor/mentions/page.tsx:173` | `useMonitor.useMentions()` | `/api/monitor/mentions` |
| Mention Details | `monitor/mentions/page.tsx` | `useMonitor.useMention()` | `/api/monitor/mentions/[id]` |
| Bulk Actions | `monitor/mentions/page.tsx` | `useMonitor.useBulkUpdate()` | `/api/monitor/mentions/bulk` |

**Implementation Tasks:**
```
[ ] 2.2.1 Wire mentions grid to API
[ ] 2.2.2 Create mention detail modal with full data
[ ] 2.2.3 Implement bulk mark as reviewed
[ ] 2.2.4 Implement bulk delete (soft delete)
[ ] 2.2.5 Add export to CSV functionality
```

### 2.3 Analytics Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Overall Stats | `monitor/analytics/page.tsx:148` | `useAnalytics.useSummary()` | `/api/analytics/dashboard` |
| Sentiment Chart | `monitor/analytics/page.tsx:213` | `useMonitor.useSentiment()` | `/api/monitor/sentiment` |
| Platform Comparison | `monitor/analytics/page.tsx` | `useAnalytics.usePlatformComparison()` | `/api/analytics/platforms` |
| Trend Over Time | `monitor/analytics/page.tsx` | `useAnalytics.useTrends()` | `/api/analytics/trends` |

**Implementation Tasks:**
```
[ ] 2.3.1 Create /api/analytics/trends endpoint
[ ] 2.3.2 Create /api/analytics/platforms endpoint
[ ] 2.3.3 Wire all analytics charts to real data
[ ] 2.3.4 Add date range filtering
[ ] 2.3.5 Add export report functionality
```

### 2.4 Citations Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Citations List | `monitor/analytics/citations/page.tsx:139` | `useMonitor.useCitations()` | `/api/monitor/citations` |
| Citation Details | `monitor/analytics/citations/page.tsx` | `useMonitor.useCitation()` | `/api/monitor/citations/[id]` |
| Source Analysis | `monitor/analytics/citations/page.tsx` | - | `/api/monitor/citations/sources` |

**Implementation Tasks:**
```
[ ] 2.4.1 Create /api/monitor/citations endpoint
[ ] 2.4.2 Create /api/monitor/citations/[id] endpoint
[ ] 2.4.3 Create /api/monitor/citations/sources endpoint
[ ] 2.4.4 Wire citations page to hooks
[ ] 2.4.5 Add citation quality scoring display
```

### 2.5 Prompts Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Prompts List | `monitor/prompts/page.tsx:84` | `useMonitor.usePrompts()` | `/api/monitor/prompts` |
| Prompt Testing | `monitor/prompts/page.tsx` | `useMonitor.useTestPrompt()` | `/api/monitor/prompts/test` |
| Prompt Optimization | `monitor/prompts/page.tsx` | - | `/api/monitor/prompts/optimize` |

**Implementation Tasks:**
```
[ ] 2.5.1 Create prompts database table
[ ] 2.5.2 Create /api/monitor/prompts CRUD endpoints
[ ] 2.5.3 Create /api/monitor/prompts/test for live testing
[ ] 2.5.4 Create /api/monitor/prompts/optimize for AI suggestions
[ ] 2.5.5 Wire prompts page to all endpoints
```

### 2.6 Monitor Settings

| Feature | File | Hook | API |
|---------|------|------|-----|
| Brand Config | `monitor/settings/page.tsx:64` | `useSettings.useBrandConfig()` | `/api/brands/[id]/config` |
| Alert Settings | `monitor/settings/page.tsx` | `useSettings.useAlertSettings()` | `/api/settings/alerts` |
| Platform Toggles | `monitor/settings/page.tsx` | - | `/api/settings/platforms` |

**Implementation Tasks:**
```
[ ] 2.6.1 Create /api/brands/[id]/config endpoint
[ ] 2.6.2 Create /api/settings/alerts endpoint
[ ] 2.6.3 Create /api/settings/platforms endpoint
[ ] 2.6.4 Wire settings page to save/load configs
[ ] 2.6.5 Add real-time validation
```

---

## Phase 3: Recommendations Engine Wiring (Priority: HIGH)

### 3.1 Recommendations List Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Recommendations List | `recommendations/page.tsx:624` | `useRecommendations()` | `/api/recommendations` |
| Filters | `recommendations/page.tsx` | - | `/api/recommendations?type=X&priority=Y` |
| Status Update | `recommendations/page.tsx` | `useRecommendations.useUpdateStatus()` | `/api/recommendations/[id]/status` |
| Assignment | `recommendations/page.tsx` | `useRecommendations.useAssign()` | `/api/recommendations/[id]/assign` |

**Implementation Tasks:**
```
[ ] 3.1.1 Verify /api/recommendations returns paginated real data
[ ] 3.1.2 Wire status update mutations
[ ] 3.1.3 Wire assignment mutations
[ ] 3.1.4 Add optimistic updates for status changes
[ ] 3.1.5 Add batch operations support
```

### 3.2 Kanban Board

| Feature | File | Hook | API |
|---------|------|------|-----|
| Board Data | `recommendations/kanban/page.tsx:430` | `useRecommendations()` | `/api/recommendations` |
| Drag & Drop | `recommendations/kanban/page.tsx` | `useRecommendations.useUpdateStatus()` | `/api/recommendations/[id]/status` |
| Team Members | `recommendations/kanban/page.tsx:435` | `useSettings.useTeamMembers()` | `/api/settings/team` |

**Implementation Tasks:**
```
[ ] 3.2.1 Wire Kanban board to useRecommendations hook
[ ] 3.2.2 Implement drag-drop status updates
[ ] 3.2.3 Create /api/settings/team endpoint for team members
[ ] 3.2.4 Wire assignment dropdown to team members
[ ] 3.2.5 Add real-time board updates
```

### 3.3 Calendar View

| Feature | File | Hook | API |
|---------|------|------|-----|
| Calendar Data | `recommendations/calendar/page.tsx:315` | `useRecommendations()` | `/api/recommendations?scheduled=true` |
| Schedule Action | `recommendations/calendar/page.tsx` | `useRecommendations.useSchedule()` | `/api/recommendations/[id]/schedule` |
| Drag to Reschedule | `recommendations/calendar/page.tsx` | - | `/api/recommendations/[id]/schedule` |

**Implementation Tasks:**
```
[ ] 3.3.1 Wire calendar to recommendations with scheduled_for date
[ ] 3.3.2 Implement drag-to-reschedule functionality
[ ] 3.3.3 Add /api/recommendations/[id]/schedule endpoint
[ ] 3.3.4 Add recurring schedule support
[ ] 3.3.5 Add calendar export (ICS format)
```

---

## Phase 4: Content Creation Wiring (Priority: HIGH)

### 4.1 Content List Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Content List | `create/page.tsx:316` | `useContent()` | `/api/content` |
| Content CRUD | `create/page.tsx` | `useContent.useCreate/Update/Delete()` | `/api/content/[id]` |
| Content Filters | `create/page.tsx` | - | `/api/content?status=X&type=Y` |

**Implementation Tasks:**
```
[ ] 4.1.1 Verify /api/content CRUD is fully functional
[ ] 4.1.2 Wire content list to useContent hook
[ ] 4.1.3 Add content filtering by type, status
[ ] 4.1.4 Add content search functionality
[ ] 4.1.5 Add bulk operations (publish, archive)
```

### 4.2 Content Editor (New/Generate)

| Feature | File | Hook | API |
|---------|------|------|-----|
| AI Generation | `create/generate/page.tsx` | `useContent.useGenerate()` | `/api/generate` |
| Content Optimization | `create/generate/page.tsx` | `useContent.useOptimize()` | `/api/optimize` |
| Save Draft | `create/generate/page.tsx` | `useContent.useCreate()` | `/api/content` |
| Publish | `create/generate/page.tsx` | `useContent.usePublish()` | `/api/content/[id]/publish` |

**Implementation Tasks:**
```
[ ] 4.2.1 Wire AI generation to /api/generate endpoint
[ ] 4.2.2 Wire content optimization to /api/optimize endpoint
[ ] 4.2.3 Implement auto-save drafts every 30 seconds
[ ] 4.2.4 Wire publish workflow
[ ] 4.2.5 Add version history tracking
```

### 4.3 AI Suggestions Panel

| Feature | File | Hook | API |
|---------|------|------|-----|
| Suggestions | `create/ai-suggestions-panel.tsx:90` | `useContent.useSuggestions()` | `/api/content/suggestions` |
| Apply Suggestion | `create/ai-suggestions-panel.tsx` | - | Callback to editor |

**Implementation Tasks:**
```
[ ] 4.3.1 Create /api/content/suggestions endpoint
[ ] 4.3.2 Wire suggestions panel to fetch suggestions
[ ] 4.3.3 Implement apply suggestion to editor
[ ] 4.3.4 Add suggestion feedback (helpful/not helpful)
```

---

## Phase 5: Audit Section Wiring (Priority: MEDIUM)

### 5.1 Audit Page (Start New Audit)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Start Audit | `audit/page.tsx:141` | `useAudit.useStartAudit()` | `/api/audit/analyze` |
| Audit Progress | `audit/page.tsx` | `useAudit.useAuditProgress()` | `/api/audit/[id]/status` |
| Cancel Audit | `audit/page.tsx` | `useAudit.useCancelAudit()` | `/api/audit/[id]/cancel` |

**Implementation Tasks:**
```
[ ] 5.1.1 Wire start audit to /api/audit/analyze
[ ] 5.1.2 Implement real-time progress updates (SSE or polling)
[ ] 5.1.3 Wire cancel audit functionality
[ ] 5.1.4 Add audit queue status display
```

### 5.2 Audit Results Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Results Display | `audit/results/page.tsx:313` | `useAudit.useAuditResults()` | `/api/audit/[id]` |
| Issues List | `audit/results/page.tsx:322` | `useAudit.useAuditIssues()` | `/api/audit/[id]/issues` |
| Export Report | `audit/results/page.tsx` | `useExport.useExportAudit()` | `/api/audit/[id]/export` |

**Implementation Tasks:**
```
[ ] 5.2.1 Wire results page to /api/audit/[id]
[ ] 5.2.2 Wire issues list with severity filtering
[ ] 5.2.3 Implement PDF export functionality
[ ] 5.2.4 Add issue resolution tracking
```

### 5.3 Audit History Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| History List | `audit/history/page.tsx:183` | `useAudit.useAuditHistory()` | `/api/audit?history=true` |
| Compare Audits | `audit/history/page.tsx` | `useAudit.useCompareAudits()` | `/api/audit/compare` |

**Implementation Tasks:**
```
[ ] 5.3.1 Wire history page to /api/audit endpoint
[ ] 5.3.2 Create /api/audit/compare endpoint
[ ] 5.3.3 Implement audit comparison UI
[ ] 5.3.4 Add trend visualization over audits
```

---

## Phase 6: Settings & Profile Wiring (Priority: MEDIUM)

### 6.1 Settings Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Profile | `settings/settings-client.tsx:167` | `useSettings.useProfile()` | `/api/user/profile` |
| Preferences | `settings/settings-client.tsx` | `useSettings.usePreferences()` | `/api/user/preferences` |
| API Keys | `settings/developer/page.tsx:74` | `useSettings.useApiKeys()` | `/api/user/api-keys` |

**Implementation Tasks:**
```
[ ] 6.1.1 Wire profile section to Clerk user data
[ ] 6.1.2 Wire preferences to /api/user/preferences
[ ] 6.1.3 Wire API keys management
[ ] 6.1.4 Add API key generation/revocation
[ ] 6.1.5 Add usage stats per API key
```

### 6.2 Notification Settings

| Feature | File | Hook | API |
|---------|------|------|-----|
| Notification Prefs | `settings/notifications/page.tsx:111` | `useNotifications.usePreferences()` | `/api/notifications/preferences` |
| Channel Toggles | `settings/notifications/page.tsx` | - | Same endpoint |
| Test Notification | `settings/notifications/page.tsx` | - | `/api/notifications/test` |

**Implementation Tasks:**
```
[ ] 6.2.1 Wire notification preferences to API
[ ] 6.2.2 Implement channel-specific toggles
[ ] 6.2.3 Add test notification functionality
[ ] 6.2.4 Add notification schedule settings
```

### 6.3 Social Accounts Settings

| Feature | File | Hook | API |
|---------|------|------|-----|
| Connected Accounts | `settings/social/page.tsx` | `useSocial.useAccounts()` | `/api/social/accounts` |
| Connect Account | `settings/social/page.tsx` | - | `/api/oauth/[platform]/authorize` |
| Disconnect Account | `settings/social/page.tsx` | - | `/api/social/accounts/[id]/disconnect` |

**Implementation Tasks:**
```
[ ] 6.3.1 Wire social accounts list to API
[ ] 6.3.2 Implement OAuth connect flow for each platform
[ ] 6.3.3 Implement disconnect functionality
[ ] 6.3.4 Add account sync status display
```

---

## Phase 7: Engine Room Wiring (Priority: MEDIUM)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Engine Stats | `engine-room/page.tsx:221` | `useEngineRoom()` | `/api/engine-room` |
| Job Queue | `engine-room/page.tsx` | `useJobs()` | `/api/jobs` |
| Platform Health | `engine-room/page.tsx` | - | `/api/engine-room/health` |

**Implementation Tasks:**
```
[ ] 7.1 Wire engine room stats to /api/engine-room
[ ] 7.2 Create /api/engine-room/health endpoint
[ ] 7.3 Wire job queue display to /api/jobs
[ ] 7.4 Add manual job trigger functionality
[ ] 7.5 Add job retry functionality
```

---

## Phase 8: Reports & Analytics Wiring (Priority: MEDIUM)

### 8.1 Reports Page

| Feature | File | Hook | API |
|---------|------|------|-----|
| Reports List | `reports/page.tsx:153` | `useReports()` | `/api/reports` |
| Generate Report | `reports/page.tsx` | `useReports.useGenerate()` | `/api/reports/generate` |
| Download Report | `reports/page.tsx` | - | `/api/reports/[id]/download` |

**Implementation Tasks:**
```
[ ] 8.1.1 Wire reports list to /api/reports
[ ] 8.1.2 Implement report generation with templates
[ ] 8.1.3 Add PDF download functionality
[ ] 8.1.4 Add scheduled report generation
```

### 8.2 Investor Reports

| Feature | File | Hook | API |
|---------|------|------|-----|
| Investor Reports | `reports/investor/page.tsx:114,124` | Custom hooks | `/api/investor-reports` |
| PDF Generation | `reports/investor/page.tsx` | - | `/api/investor-reports/[id]/pdf` |
| Preview | `reports/investor/page.tsx` | - | `/api/investor-reports/[id]/preview` |

**Implementation Tasks:**
```
[ ] 8.2.1 Wire investor reports page
[ ] 8.2.2 Implement PDF generation
[ ] 8.2.3 Add portfolio selection
[ ] 8.2.4 Add custom branding options
```

---

## Phase 9: Integrations Wiring (Priority: MEDIUM)

### 9.1 Project Management Integrations

| Integration | Status | OAuth Flow | Sync |
|-------------|--------|------------|------|
| Jira | Built | `/api/integrations/jira` | `/api/integrations/jira/sync` |
| Trello | Built | `/api/integrations/trello` | `/api/integrations/trello/sync` |
| Asana | Built | `/api/integrations/asana` | `/api/integrations/asana/sync` |
| Linear | Built | `/api/integrations/linear` | `/api/integrations/linear/sync` |

**Implementation Tasks:**
```
[ ] 9.1.1 Wire Jira OAuth and bi-directional sync
[ ] 9.1.2 Wire Trello OAuth and card creation
[ ] 9.1.3 Wire Asana OAuth and task creation
[ ] 9.1.4 Wire Linear OAuth and issue creation
[ ] 9.1.5 Add integration settings UI
```

### 9.2 Communication Integrations

| Integration | Status | OAuth Flow | Webhooks |
|-------------|--------|------------|----------|
| Slack | Built | `/api/integrations/slack` | Yes |
| WhatsApp | Partial | - | `/api/notifications/whatsapp` |
| Email | Built | - | `/api/notifications/email` |

**Implementation Tasks:**
```
[ ] 9.2.1 Wire Slack OAuth and channel selection
[ ] 9.2.2 Wire WhatsApp Business API notifications
[ ] 9.2.3 Wire email notification templates
[ ] 9.2.4 Add notification preview functionality
```

### 9.3 Analytics Integrations

| Integration | Status | OAuth Flow | Data Sync |
|-------------|--------|------------|-----------|
| Google Analytics | Built | `/api/integrations/google-analytics` | `/api/integrations/ga/sync` |
| Google Search Console | Built | `/api/integrations/google-search-console` | `/api/integrations/gsc/sync` |

**Implementation Tasks:**
```
[ ] 9.3.1 Wire GA4 OAuth and property selection
[ ] 9.3.2 Wire GSC OAuth and site verification
[ ] 9.3.3 Implement data import from GA4
[ ] 9.3.4 Implement data import from GSC
```

---

## Phase 10: Billing & Usage Wiring (Priority: MEDIUM)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Subscription Status | Components | `useBilling()` | `/api/billing` |
| Usage Dashboard | `billing/usage-dashboard.tsx:272,289` | `useUsage()` | `/api/usage/summary` |
| Upgrade Flow | Components | `useBilling.useUpgrade()` | `/api/billing/checkout` |
| Invoice History | Components | `useBilling.useInvoices()` | `/api/billing/invoices` |

**Implementation Tasks:**
```
[ ] 10.1 Wire subscription status display
[ ] 10.2 Wire usage dashboard to /api/usage/summary
[ ] 10.3 Implement Stripe checkout flow
[ ] 10.4 Wire invoice history
[ ] 10.5 Add usage alerts configuration
```

---

## Phase 11: Notifications System Wiring (Priority: MEDIUM)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Notifications Bell | `notifications/notifications-bell.tsx:45` | `useNotifications()` | `/api/notifications` |
| Notification List | Dropdown | `useNotifications.useList()` | `/api/notifications?limit=20` |
| Mark as Read | Dropdown | `useNotifications.useMarkRead()` | `/api/notifications/[id]/read` |

**Implementation Tasks:**
```
[ ] 11.1 Wire notifications bell to show unread count
[ ] 11.2 Wire notification dropdown to list notifications
[ ] 11.3 Implement mark as read functionality
[ ] 11.4 Add notification sound/toast
[ ] 11.5 Implement real-time notifications (WebSocket or SSE)
```

---

## Phase 12: Competitive Intelligence Wiring (Priority: MEDIUM)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Competitor List | `competitors/page.tsx` | `useCompetitors()` | `/api/competitors` |
| Competitor Tracking | `competitors/page.tsx` | `useCompetitors.useTrack()` | `/api/competitors/track` |
| Share of Voice | `competitive/page.tsx` | `useCompetitive()` | `/api/competitive` |

**Implementation Tasks:**
```
[ ] 12.1 Wire competitor management CRUD
[ ] 12.2 Wire competitor tracking/untracking
[ ] 12.3 Wire share of voice calculations
[ ] 12.4 Add competitor comparison charts
[ ] 12.5 Add competitor alert triggers
```

---

## Phase 13: People/Contacts Wiring (Priority: LOW)

| Feature | File | Hook | API |
|---------|------|------|-----|
| People List | `people/page.tsx` | `usePeople()` | `/api/people` |
| Person Details | `people/page.tsx` | `usePeople.usePerson()` | `/api/people/[id]` |
| Social Enrichment | `people/page.tsx` | - | `/api/people/[id]/enrich` |

**Implementation Tasks:**
```
[ ] 13.1 Wire people list to API
[ ] 13.2 Wire person details modal
[ ] 13.3 Wire social enrichment (LinkedIn, Twitter)
[ ] 13.4 Add people import functionality
[ ] 13.5 Add people export functionality
```

---

## Phase 14: Portfolios Wiring (Priority: LOW)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Portfolio List | `portfolios/page.tsx` | `usePortfolios()` | `/api/portfolios` |
| Portfolio Details | `portfolios/[id]/page.tsx:83` | `usePortfolios.usePortfolio()` | `/api/portfolios/[id]` |
| Portfolio Settings | `portfolios/[id]/settings/page.tsx:103` | - | `/api/portfolios/[id]/settings` |

**Implementation Tasks:**
```
[ ] 14.1 Wire portfolio list CRUD
[ ] 14.2 Wire portfolio details page
[ ] 14.3 Wire brand assignment to portfolios
[ ] 14.4 Add aggregate portfolio metrics
```

---

## Phase 15: AI Citation ROI Calculator (NEW FEATURE)

**This is a new differentiating feature to implement from scratch.**

### 15.1 Database Schema

```sql
CREATE TABLE citation_conversions (
  id UUID PRIMARY KEY,
  mention_id UUID REFERENCES mentions(id),
  brand_id UUID REFERENCES brands(id),
  source_platform VARCHAR(50), -- chatgpt, claude, etc.
  visitor_session_id VARCHAR(100),
  landing_page VARCHAR(2000),
  conversion_type VARCHAR(50), -- signup, purchase, contact, etc.
  conversion_value DECIMAL(10,2),
  attribution_confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE citation_tracking_links (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  original_url VARCHAR(2000),
  tracking_url VARCHAR(2000),
  utm_params JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 15.2 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/citation-roi` | GET | Get ROI summary |
| `/api/citation-roi/conversions` | GET | List conversions |
| `/api/citation-roi/tracking-links` | POST | Create tracking link |
| `/api/citation-roi/report` | GET | Generate ROI report |

### 15.3 Implementation Tasks

```
[ ] 15.1 Create citation_conversions table migration
[ ] 15.2 Create citation_tracking_links table migration
[ ] 15.3 Create /api/citation-roi endpoints
[ ] 15.4 Create tracking pixel/script for conversion tracking
[ ] 15.5 Integrate with GA4 for conversion data
[ ] 15.6 Build Citation ROI Dashboard component
[ ] 15.7 Add ROI calculations and attribution
[ ] 15.8 Create ROI report PDF export
```

---

## Phase 16: Gamification Wiring (Priority: LOW)

| Feature | File | Hook | API |
|---------|------|------|-----|
| Achievements | Components | `useGamification()` | `/api/gamification` |
| Leaderboard | Components | `useGamification.useLeaderboard()` | `/api/gamification/leaderboard` |
| Streaks | Components | `useGamification.useStreaks()` | `/api/gamification/streaks` |

**Implementation Tasks:**
```
[ ] 16.1 Wire achievements display
[ ] 16.2 Wire leaderboard with filters
[ ] 16.3 Wire streak tracking
[ ] 16.4 Add achievement unlock notifications
```

---

## Phase 17: GraphQL Resolvers (Priority: LOW)

The GraphQL layer at `src/lib/graphql/schema.ts` has 50+ placeholder resolvers.

**Implementation Tasks:**
```
[ ] 17.1 Wire all Query resolvers to Drizzle ORM
[ ] 17.2 Wire all Mutation resolvers to Drizzle ORM
[ ] 17.3 Add proper authentication middleware
[ ] 17.4 Add rate limiting
[ ] 17.5 Add caching layer
```

---

## Implementation Order & Dependencies

### Week 1-2: Core Dashboard (Phase 1-2)
- Dashboard home components
- Sidebar badges
- Monitor section

### Week 2-3: Recommendations & Content (Phase 3-4)
- Recommendations engine
- Kanban & calendar views
- Content creation workflow

### Week 3-4: Audit & Settings (Phase 5-6)
- Audit workflow
- Settings pages
- Profile management

### Week 4-5: Engine Room & Reports (Phase 7-8)
- Engine room stats
- Reports generation
- PDF exports

### Week 5-6: Integrations & Billing (Phase 9-10)
- OAuth integrations
- Billing workflows
- Usage tracking

### Week 6-7: Notifications & Competitive (Phase 11-12)
- Real-time notifications
- Competitive intelligence

### Week 7-8: AI Citation ROI (Phase 15)
- New feature implementation
- GA4 integration

### Week 8+: Polish & Low Priority (Phase 13-14, 16-17)
- People/contacts
- Portfolios
- Gamification
- GraphQL

---

## Success Criteria

Each phase is complete when:
1. All API endpoints return real database data (no mocks)
2. All hooks fetch from correct endpoints
3. All mutations work correctly
4. Loading states display properly
5. Error states display with retry options
6. Optimistic updates work smoothly
7. E2E tests pass

---

## Testing Strategy

For each wired feature:
1. Unit test API route handlers
2. Unit test hook behavior
3. Integration test API + database
4. E2E test user workflows

---

*Document created: 2026-01-12*
*Last updated: 2026-01-12*
