# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-003: Marketing Campaigns Module

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 2 (Marketing Campaigns) - 2-3 weeks
**Scope**: Campaign management, creation wizard, real-time metrics, Mautic integration

---

## 1. EXECUTIVE SUMMARY

The Marketing Campaigns module enables marketing teams to create, execute, and monitor marketing campaigns across multiple channels (email, social, webinar, landing pages, content). It provides real-time metrics and integrates with Mautic for email campaign execution.

**Implemented Features**: Campaign list, campaign detail, campaign overview dashboard

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Marketing team cannot create campaigns or track their performance
- No visibility into campaign ROI or effectiveness
- Cannot segment audiences for targeted campaigns
- No way to monitor real-time campaign metrics
- Campaign creation is manual and error-prone

### 2.2 Business Goals
1. Enable marketing team to create and execute campaigns quickly
2. Track campaign performance in real-time
3. Calculate campaign ROI automatically
4. Segment audiences for targeted campaigns
5. Integrate with Mautic for email campaign execution

### 2.3 Key Metrics
- Campaign creation time: <10 minutes (from idea to launch)
- Campaign ROI visibility: Real-time
- Email open rate: Target >25%
- Email click rate: Target >5%
- Conversion rate: Track by campaign type

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Marketing Manager** | Create campaigns, monitor performance, optimize ROI |
| **Content Marketer** | Create content campaigns, track engagement |
| **Demand Gen** | Create lead generation campaigns, track conversions |
| **Executive** | Monitor campaign ROI, budget vs spend |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Campaign list page with filters and search
- Campaign detail page with real-time metrics
- Campaign overview dashboard
- Campaign types: Email, Social, Webinar, Landing Page, Content
- Mautic integration for email campaigns
- Real-time metrics: Opens, clicks, conversions, revenue
- Campaign templates
- Audience segmentation (basic)

### 4.2 Out of Scope
- Advanced A/B testing (Phase 3)
- Multi-touch attribution (Phase 3)
- Campaign wizard (simplified for Phase 2)
- Advanced audience segmentation (Phase 3)

### 4.3 Constraints
- Must integrate with Mautic API
- Real-time metrics via webhooks
- Campaign data in `campaigns` table (already exists)
- Metrics in `metrics` table (already exists)
- Performance: Campaign list <1s for 100+ campaigns

---

## 5. DETAILED REQUIREMENTS

### 5.1 Campaign List Page

**Path**: `/admin/marketing/campaigns`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Marketing > Campaigns       │
│ Title: "Marketing Campaigns"                    │
│ Actions: [+ Create Campaign] [Export] [Filter]  │
├─ Stats Bar ─────────────────────────────────────┤
│ Active: 12 | Paused: 3 | Completed: 45 | ROI: $45k│
├─ Filters & Search ──────────────────────────────┤
│ Search: [____________________] (name)            │
│ Status: [All / Active / Paused / Completed] ▼   │
│ Type: [All / Email / Social / Webinar / ...] ▼  │
│ Date Range: [From] [To]                         │
├─ Campaign Cards (Grid) ─────────────────────────┤
│ ┌─ Campaign Card ───────────────────────────┐   │
│ │ Email Campaign: Q1 Product Launch         │   │
│ │ Status: Active | Type: Email               │   │
│ │ Created: Jan 10, 2026 | Budget: $5,000    │   │
│ │                                            │   │
│ │ Metrics:                                   │   │
│ │ • Sent: 10,542 | Opens: 2,845 (27%)      │   │
│ │ • Clicks: 634 (6%) | Conversions: 45      │   │
│ │ • Revenue: $12,400 | ROI: 148%            │   │
│ │                                            │   │
│ │ [View Details] [Edit] [Pause]             │   │
│ └───────────────────────────────────────────┘   │
│ (More campaign cards...)                         │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Search**: Real-time search across campaign names
- **Filters**:
  - Status: All, Active, Paused, Completed, Scheduled
  - Type: All, Email, Social, Webinar, Landing Page, Content
  - Date: Created date range
- **Sort**: By name, status, date, budget, ROI
- **Campaign Cards**: Grid layout showing key metrics
- **Bulk Actions**: Pause, resume, archive campaigns

**Interactions**:
- Click card → Navigate to campaign detail page
- Click "Create Campaign" → Campaign creation wizard (future)
- Click "Edit" → Edit campaign settings
- Click "Pause" → Pause campaign (with confirmation)

---

### 5.2 Campaign Detail Page

**Path**: `/admin/marketing/campaigns/[id]`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ ← Back | Campaign Name | [Edit] [Pause] [Delete]│
├─ Campaign Info (card-primary) ──────────────────┤
│ Name: Q1 Product Launch                          │
│ Type: Email | Status: Active                     │
│ Budget: $5,000 | Spent: $3,200 (64%)            │
│ Created: Jan 10, 2026 | Updated: Jan 15, 2026   │
│ Owner: Marketing Team                            │
├─ Key Metrics (card-secondary) ──────────────────┤
│ ┌─ Emails Sent ──┬─ Opens ──┬─ Clicks ──┬─ Conversions ─┐
│ │ 10,542         │ 2,845     │ 634       │ 45            │
│ │                │ (27.0%)   │ (6.0%)    │ (0.43%)       │
│ └───────────────┴──────────┴──────────┴───────────────┘
│
│ ┌─ Revenue ──────┬─ Cost ─────┬─ ROI ──────────────────┐
│ │ $12,400        │ $3,200     │ $9,200 (287% ROI)      │
│ └───────────────┴───────────┴──────────────────────────┘
├─ Performance Chart (card-secondary) ────────────┤
│ Open Rate Over Time:                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ 30% ┤                                 ██     │ │
│ │ 25% ┤                           ██ ██       │ │
│ │ 20% ┤                     ██ ██             │ │
│ │ 15% ┤               ██ ██                   │ │
│ │ 10% ┤         ██ ██                         │ │
│ │  5% ┤   ██ ██                               │ │
│ │     └──────────────────────────────────────  │ │
│ │       1/10  1/11  1/12  1/13  1/14  1/15    │ │
│ └─────────────────────────────────────────────┘ │
├─ Audience Breakdown (card-secondary) ───────────┤
│ Target Audience: 10,542 contacts                 │
│ Segments:                                        │
│ • Engaged Users: 5,420 (51%)                    │
│ • New Leads: 3,200 (30%)                        │
│ • Re-engagement: 1,922 (18%)                    │
├─ Activity Log (card-tertiary) ──────────────────┤
│ Jan 15, 14:32 - Email opened by john@acme.com   │
│ Jan 15, 10:15 - Email clicked by jane@corp.com  │
│ Jan 14, 09:00 - Campaign email sent (10,542)    │
│ Jan 10, 15:42 - Campaign created                │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Campaign Info**: Name, type, status, budget, dates, owner
- **Key Metrics**: Sent, opens, clicks, conversions, revenue, ROI
- **Performance Charts**: Open rate, click rate, conversion rate over time
- **Audience Breakdown**: Target audience size and segmentation
- **Activity Log**: Recent events related to campaign

**Edit Mode**:
```
┌─ Edit Campaign Dialog ──────────────────────┐
│ Campaign Information                         │
│ Name: [________________]                    │
│ Type: [Email ▼]                            │
│ Status: [Active ▼]                         │
│ Budget: [__________]                       │
│ Owner: [Marketing Team ▼]                  │
│                                             │
│ [Save] [Cancel]                             │
└─────────────────────────────────────────────┘
```

---

### 5.3 Campaign Overview Dashboard

**Path**: `/admin/marketing/campaigns` (overview tab)

**Layout**:
```
┌─ Overview Stats ────────────────────────────────┐
│ Active: 12 | Total: 60 | Avg ROI: 187%         │
│ Total Budget: $45k | Total Revenue: $134k       │
├─ Campaign Performance (card-secondary) ─────────┤
│ Top Performing Campaigns:                       │
│ 1. Q1 Product Launch - ROI: 287%               │
│ 2. Webinar Series - ROI: 245%                  │
│ 3. Content Marketing - ROI: 198%               │
├─ Campaign Type Breakdown (card-secondary) ──────┤
│ Email: 35 (58%) | Social: 12 (20%)             │
│ Webinar: 8 (13%) | Landing Page: 5 (8%)        │
├─ Monthly Trends (card-secondary) ───────────────┤
│ Campaign Count by Month:                        │
│ Jan: 12 | Feb: 8 | Mar: 10 | Apr: 15           │
└─────────────────────────────────────────────────┘
```

---

## 6. API REQUIREMENTS

### 6.1 Campaign APIs

**GET `/api/admin/marketing/campaigns`**
```typescript
Query Parameters:
  - search?: string (name)
  - status?: string
  - type?: string
  - dateFrom?: ISO8601
  - dateTo?: ISO8601
  - page?: number
  - limit?: number

Response: {
  data: Array<{
    id: string
    name: string
    type: "email" | "social" | "webinar" | "landing_page" | "content"
    status: "active" | "paused" | "completed" | "scheduled"
    budget: number
    spent: number
    revenue: number
    roi: number
    metrics: {
      sent: number
      opens: number
      clicks: number
      conversions: number
    }
    createdAt: ISO8601
    updatedAt: ISO8601
  }>
  pagination: { page: number; limit: number; total: number }
}
```

**GET `/api/admin/marketing/campaigns/[id]`**
```typescript
Response: {
  campaign: {
    id: string
    name: string
    type: string
    status: string
    budget: number
    spent: number
    revenue: number
    roi: number
    owner: string
    createdAt: ISO8601
    updatedAt: ISO8601
  }
  metrics: {
    sent: number
    opens: number
    openRate: number
    clicks: number
    clickRate: number
    conversions: number
    conversionRate: number
    revenue: number
    cost: number
    roi: number
  }
  performance: Array<{
    date: ISO8601
    opens: number
    clicks: number
    conversions: number
  }>
  audienceBreakdown: {
    total: number
    segments: Array<{ name: string; count: number; percentage: number }>
  }
  activityLog: Array<{
    id: string
    type: string
    description: string
    timestamp: ISO8601
  }>
}
```

**POST `/api/admin/marketing/campaigns`** (Create)
**PUT `/api/admin/marketing/campaigns/[id]`** (Update)
**DELETE `/api/admin/marketing/campaigns/[id]`** (Delete)
**POST `/api/admin/marketing/campaigns/[id]/pause`** (Pause)
**POST `/api/admin/marketing/campaigns/[id]/resume`** (Resume)

### 6.2 Mautic Integration

**POST `/api/integrations/mautic/campaigns`** (Sync campaign to Mautic)
**Webhook**: `/api/webhooks/mautic` (Already exists - receives events)

---

## 7. DATABASE SCHEMA

**Existing Tables** (no changes needed):
- `campaigns` - Campaign metadata
- `metrics` - Campaign performance metrics
- `email_events` - Email engagement events

**Campaign Status Values**:
- `draft` - Created but not launched
- `scheduled` - Scheduled for future launch
- `active` - Currently running
- `paused` - Temporarily paused
- `completed` - Finished
- `archived` - Archived

**Campaign Type Values**:
- `email` - Email campaign
- `social` - Social media campaign
- `webinar` - Webinar campaign
- `landing_page` - Landing page campaign
- `content` - Content marketing campaign

---

## 8. IMPLEMENTATION STATUS

### 8.1 Pages Implemented
✅ `/admin/marketing/campaigns/page.tsx` - Campaign list
✅ `/admin/marketing/campaigns/[id]/page.tsx` - Campaign detail
✅ `/admin/marketing/campaigns/page.tsx` (overview tab) - Campaign overview

### 8.2 Features Implemented
✅ Campaign list with filters (status, type, date)
✅ Campaign search by name
✅ Campaign cards with key metrics
✅ Campaign detail page with full metrics
✅ Performance charts (opens, clicks, conversions)
✅ Audience breakdown
✅ Activity log
✅ Mautic integration ready (webhook exists)

### 8.3 API Integration
- Mock data fallback in place
- Ready for backend API connection
- Webhook handler exists: `/api/webhooks/mautic`

---

## 9. SECURITY & COMPLIANCE

- All campaign data protected by org context (Clerk)
- Audit log: Track campaign creation, edits, deletion
- Budget approval workflow (future)
- Campaign access control by role
- GDPR: Campaign data retention policies

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- Campaign filtering logic
- ROI calculation
- Metrics aggregation
- Date formatting

### 10.2 Integration Tests
- Campaign list API returns correct data
- Filters work (status, type, date)
- Campaign detail loads metrics
- Mautic integration works
- Webhook events update metrics

### 10.3 E2E Tests (Playwright)
- Navigate to campaigns list
- Search for campaign
- Filter by status
- Click campaign to see detail
- View performance charts
- Check activity log

---

## 11. ACCEPTANCE CRITERIA

**Campaign List Page**:
- [x] Loads in <1s for 100+ campaigns
- [x] Search works across campaign names
- [x] All filters functional (status, type, date)
- [x] Campaign cards show accurate metrics
- [x] Responsive on mobile
- [x] No 404 errors

**Campaign Detail Page**:
- [x] All campaign info displays correctly
- [x] Key metrics accurate (opens, clicks, conversions, ROI)
- [x] Performance charts render
- [x] Audience breakdown displays
- [x] Activity log populated
- [x] Can edit campaign info
- [x] Can pause/resume campaign
- [x] Responsive design works

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 2-3 weeks (Phase 2)

**Dependencies**:
- Admin layout (PRD-001) ✅
- Database with campaigns table ✅
- Mautic webhook handler ✅
- Email events tracking ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Campaign Wizard**: Should we build a step-by-step wizard or simplified form? (Recommendation: Simplified form for Phase 2, wizard in Phase 3)
2. **A/B Testing**: Should we support A/B testing in Phase 2? (Recommendation: Phase 3)
3. **Campaign Templates**: Should we provide pre-built templates? (Recommendation: Yes, 5-10 common templates)

---

**Next PRD**: PRD-ADMIN-004 (Email Automation - Phase 3)
