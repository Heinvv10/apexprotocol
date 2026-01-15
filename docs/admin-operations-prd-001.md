# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-001: Core Admin Dashboard & Navigation

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Scope**: Foundation for all admin operations pages

---

## 1. EXECUTIVE SUMMARY

The Admin Operations system is the internal control center for Apex company operations. It enables teams to manage customer relationships, run marketing campaigns, monitor social media performance, track algorithm changes, and monitor system health.

This PRD covers the foundational admin dashboard and navigation structure that all subsequent phases build upon.

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Marketing team cannot see customer relationships and engagement data
- Sales team has no lead management or pipeline visibility
- No way to run email campaigns or automate follow-ups
- Social media performance is invisible - no algorithm change detection
- Integration health monitoring is manual and error-prone
- Management lacks real-time KPI visibility

### 2.2 Business Goals
1. Enable data-driven sales and marketing decisions
2. Automate repetitive marketing tasks (email sequences, follow-ups)
3. Detect platform algorithm changes before they impact visibility
4. Reduce integration failures through proactive monitoring
5. Provide management with real-time operational visibility

### 2.3 Success Metrics
- Lead response time decreases 40% (automated follow-ups)
- Campaign ROI visible and traceable
- Email open rates improve 25% (targeted automation)
- Integration failures detected within 5 minutes
- Management dashboard adoption >80% (daily users)

---

## 3. TARGET USERS

| Role | Use Case | Key Needs |
|------|----------|-----------|
| **Sales Manager** | Lead pipeline tracking, conversion forecasting | Lead list, scoring, pipeline view, forecast |
| **Marketing Manager** | Campaign execution, automation, ROI tracking | Campaign wizard, email sequences, metrics |
| **Social Media Manager** | Post scheduling, engagement tracking, algorithm monitoring | Content calendar, platform monitoring, analytics |
| **Operations Manager** | Integration health, system monitoring | Status dashboard, alerts, health checks |
| **Executive/CEO** | KPI visibility, strategic decisions | Dashboard with key metrics, trends, alerts |
| **Content Team** | Content calendar, performance tracking | Editorial calendar, content metrics |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Admin dashboard homepage with stat cards
- Main navigation for all admin sections
- CRM module (leads, accounts, pipeline)
- Marketing module (campaigns, email automation, sequences)
- Social Media module (posting, engagement, algorithm monitoring)
- SEO module (technical health, keyword tracking)
- Integration management (health, status, credentials)
- Analytics module (executive dashboards, reporting)
- Webhook management and audit logs

### 4.2 Out of Scope
- Customer-facing features (those are separate)
- Payment processing
- Advanced AI agent automation
- Third-party app marketplace
- White-label tenant customization (Phase 2 future)

### 4.3 Constraints
- Must work with existing database schema (11 marketing tables already built)
- Must integrate with existing APIs (Mautic, ListMonk, Postiz)
- Must support multi-organization context (Clerk integration)
- Page load time <2s for dashboard
- Real-time updates required for critical metrics

---

## 5. DETAILED REQUIREMENTS

### 5.1 Admin Dashboard (Homepage)

**Path**: `/admin`

**Description**: Overview of all admin operations with quick access to all modules

**Layout**:
```
┌─ Header (Breadcrumb + Search + Admin Dropdown) ─┐
├─ Stat Cards (Grid)                              │
│  ├─ Total Leads                                 │
│  ├─ Active Campaigns                            │
│  ├─ Social Posts (This Month)                   │
│  └─ Integration Health                          │
├─ Quick Access Cards (Module Navigation)         │
│  ├─ CRM (Leads, Accounts, Pipeline)            │
│  ├─ Marketing (Campaigns, Sequences, Emails)   │
│  ├─ Social Media (Posting, Engagement)         │
│  ├─ SEO (Health, Keywords)                     │
│  ├─ Integrations (Status, Health)              │
│  └─ Analytics (Executive Dashboard)            │
├─ Recent Activity (Timeline)                     │
│  ├─ Recent leads added                         │
│  ├─ Recent campaigns launched                  │
│  ├─ Recent integration alerts                  │
│  └─ Recent email events                        │
└─ Alerts & Notifications                        │
   ├─ Critical: Integration failures             │
   ├─ Warning: API quota warnings                │
   └─ Info: Campaign milestones                  │
```

**Components Required**:
- `AdminDashboard` (main page)
- `AdminStatCard` (reusable stat cards with click-through to detail)
- `AdminQuickAccessCard` (module navigation)
- `AdminActivityTimeline` (recent events)
- `AlertBanner` (critical alerts)

**Data Requirements**:
- GET `/api/admin/dashboard/overview` - Stats and summary data
- GET `/api/admin/dashboard/activity` - Recent activity timeline
- GET `/api/admin/dashboard/alerts` - Active alerts

**Interaction**:
- Clicking stat cards navigates to detail pages
- Clicking module cards navigates to module pages
- Activity items link to source records
- Alerts are dismissible

---

### 5.2 Admin Navigation

**Location**: Left sidebar + Top navigation

**Structure**:
```
Main Navigation:
├─ Dashboard (home icon)
├─ CRM
│  ├─ Leads
│  ├─ Accounts
│  ├─ Contacts
│  └─ Pipeline
├─ Marketing
│  ├─ Campaigns
│  ├─ Automation
│  ├─ Email Management
│  ├─ Content Calendar
│  └─ Analytics
├─ Social Media
│  ├─ Channels
│  ├─ Posting
│  ├─ Engagement
│  ├─ Algorithm Monitoring
│  ├─ Competitor Tracking
│  └─ Analytics
├─ SEO
│  ├─ Website Health
│  ├─ Content Management
│  ├─ Keyword Tracking
│  ├─ Platform Monitoring
│  └─ Competitor SEO
├─ Platform Monitoring
│  ├─ Our Visibility
│  ├─ Algorithm Changes
│  ├─ Competitor Visibility
│  └─ Content Performance
├─ Integrations
│  ├─ Platform Status
│  ├─ Webhook Management
│  ├─ Credentials
│  └─ Health Monitoring
├─ Analytics
│  ├─ Executive Dashboard
│  ├─ Sales Analytics
│  ├─ Marketing Analytics
│  ├─ Product Analytics
│  └─ Custom Reports
└─ Settings
   ├─ Organization
   ├─ Team & Permissions
   ├─ Integrations Config
   └─ Audit Logs
```

**Design Requirements**:
- Responsive: Sidebar collapses on mobile
- Active state clearly indicated
- Breadcrumb trail in header
- Search across all admin pages
- Quick help tooltips on hover

---

### 5.3 Layout Template

All admin pages use consistent layout:

```tsx
<AdminLayout>
  <AdminHeader>
    <Breadcrumb />
    <PageTitle />
    <Actions (buttons, filters) />
  </AdminHeader>

  <AdminContent>
    {/* Page-specific content */}
  </AdminContent>

  <AdminFooter>
    <PaginationInfo />
    <SyncStatus />
  </AdminFooter>
</AdminLayout>
```

---

### 5.4 Design System Requirements

**Colors** (from APEX_DESIGN_SYSTEM.md):
- Background: `#0a0f1a`
- Card: `#141930`
- Primary (Cyan): `#00E5CC`
- Secondary (Purple): `#8B5CF6`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Error: `#EF4444`

**Typography**:
- Page titles: Bold, 28px
- Section headers: Bold, 20px
- Card titles: Bold, 16px
- Body text: Regular, 14px

**Card Hierarchy**:
```
card-primary    → Main KPIs, critical metrics
card-secondary  → Charts, detailed data
card-tertiary   → Lists, activity logs
```

**Spacing**:
- Page margin: 24px
- Section spacing: 16px
- Component spacing: 12px

---

### 5.5 Authorization & Permissions

**Access Control**:
- Route protection: Require `admin` role via Clerk
- Super-admin actions: Require `super-admin` role
- Organization scoping: Users only see their organization's data
- Audit logging: Track all admin actions

**Roles** (Clerk-based):
- `admin` - Full access to admin dashboard
- `super-admin` - Access to all organizations, system config
- `manager` - Limited access to specific modules (sales manager, marketing manager, etc.)
- `operator` - View-only access to integration monitoring

---

## 6. USER FLOWS

### 6.1 Sales Manager Daily Workflow
1. Open `/admin`
2. Check "Total Leads" stat card
3. Click "Leads" to see `/admin/crm/leads`
4. Filter by "New Leads" added today
5. Click on lead to see detail + interaction history
6. Assign follow-up task
7. Check pipeline view for forecast

### 6.2 Marketing Manager Campaign Workflow
1. Open `/admin`
2. Check "Active Campaigns" stat
3. Click "Campaigns" → `/admin/marketing/campaigns`
4. Click "Create Campaign" to start wizard
5. Select campaign type (email, social, webinar)
6. Choose audience from leads list
7. Create/select email template
8. Schedule campaign
9. Monitor metrics in real-time

### 6.3 Operations Manager Daily Standup
1. Open `/admin`
2. Check "Integration Health" stat
3. Review Alerts & Notifications for any failures
4. Click "Integrations" → `/admin/integrations`
5. Verify all platform statuses (Mautic, ListMonk, Postiz)
6. Check webhook delivery logs
7. Review error logs and take action if needed

---

## 7. API REQUIREMENTS

### 7.1 New APIs to Create

**GET `/api/admin/dashboard/overview`**
```typescript
Response {
  stats: {
    totalLeads: number
    totalLeadsToday: number
    activeCampaigns: number
    socialPostsThisMonth: number
    integrationHealth: "healthy" | "warning" | "critical"
    alertCount: number
  }
  recentActivity: Array<{
    id: string
    type: "lead" | "campaign" | "integration" | "email"
    title: string
    timestamp: ISO8601
    actionUrl: string
  }>
  alerts: Array<{
    id: string
    severity: "critical" | "warning" | "info"
    title: string
    description: string
    actionUrl?: string
    dismissible: boolean
  }>
}
```

**GET `/api/admin/modules/status`**
```typescript
Response {
  crm: { ready: boolean, recordCount: number }
  marketing: { ready: boolean, campaignCount: number }
  socialMedia: { ready: boolean, channelCount: number }
  seo: { ready: boolean }
  integrations: { ready: boolean, healthStatus: "healthy" | "warning" | "critical" }
}
```

### 7.2 Existing APIs to Extend

**`/api/admin/dashboard/ai-costs`** (already exists)
- Already extended with `byUser` aggregation ✓

**`/api/marketing/campaigns`** (partially built)
- Extend to support filtering, sorting, pagination

**Webhook handlers** (already built):
- `/api/webhooks/mautic`
- `/api/webhooks/listmonk`
- `/api/webhooks/postiz`

---

## 8. DATABASE SCHEMA (Existing)

All required tables already exist in `src/lib/db/schema/marketing.ts`:

```
campaigns          → Campaign metadata, budget, status
leads              → Lead data, scoring (leadScore, mqlScore, sqlScore)
email_lists        → Email list management
email_events       → Email engagement (open, click, bounce)
social_posts       → Social media content
analytics_events   → Aggregated metrics
metrics            → Campaign performance
sequences          → Email automation workflows
automation_logs    → Execution history
platforms          → Integration credentials
integrations       → Integration health monitoring
```

**No schema changes needed for Phase 1 - all tables already built**

---

## 9. SECURITY & COMPLIANCE

### 9.1 Authentication
- All admin routes protected by Clerk auth
- Super-admin role validation on sensitive endpoints
- Session timeout: 30 minutes of inactivity

### 9.2 Authorization
- Organization-level data isolation
- Role-based access control (RBAC)
- Audit logging for all admin actions

### 9.3 Data Protection
- API credentials encrypted (Mautic, ListMonk, Postiz keys)
- PII (email, phone) not logged in audit trail
- Rate limiting on all admin APIs (1000 req/min per org)

### 9.4 Compliance
- Audit log retention: 90 days
- Data export available for compliance
- GDPR-compliant data deletion

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- Component rendering tests (stat cards, cards, etc.)
- Utility function tests (formatting, filtering)
- Data calculation tests (lead score, metrics)

### 10.2 Integration Tests
- Auth flow (Clerk login → dashboard access)
- API response validation
- Database query accuracy
- Webhook event processing

### 10.3 E2E Tests (Playwright)
- Admin login and dashboard access
- Navigate to each module
- Verify stat cards display correct data
- Click through to detail pages

### 10.4 Performance Tests
- Dashboard load time <2s
- Stat card calculation <500ms
- API response time <1s

---

## 11. DEPLOYMENT & ROLLOUT

### 11.1 Deployment Steps
1. Deploy to staging environment
2. Run full test suite
3. Performance testing and optimization
4. Staging sign-off
5. Deploy to production
6. Monitor error logs and performance metrics

### 11.2 Rollout Strategy
- Feature flag for admin dashboard access
- Initially available to super-admin only
- Gradual rollout to admin users
- Full release after stabilization (1 week)

### 11.3 Monitoring
- Sentry/error tracking enabled
- New Relic APM for performance
- Custom analytics for feature adoption
- Slack notifications for critical errors

---

## 12. ACCEPTANCE CRITERIA

**Admin Dashboard Must**:
- [ ] Load in <2 seconds
- [ ] Display accurate stat card values (verified against DB)
- [ ] All stat cards clickable and link to correct pages
- [ ] Recent activity populated with real events
- [ ] Alerts properly sorted by severity
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Navigation accessible and clearly labeled
- [ ] All links functional and no 404s
- [ ] Auth protected - unauthenticated users redirected to login
- [ ] Super-admin and admin roles properly handled

**Navigation Must**:
- [ ] All menu items present and correctly categorized
- [ ] Active page highlighted
- [ ] Breadcrumb trail accurate
- [ ] Search functionality working
- [ ] Mobile sidebar collapse/expand works
- [ ] Keyboard navigation supported

---

## 13. TIMELINE & DEPENDENCIES

**Duration**: 1-2 weeks

**Dependencies**:
- Clerk auth system (✓ already integrated)
- Database with marketing tables (✓ already built)
- Existing API routes (✓ partially built)
- Design system CSS (✓ already available)

**Blockers**: None identified

---

## 14. OPEN QUESTIONS

None - this is foundation work with clear requirements based on existing backend.

---

## 15. APPENDIX: FILE STRUCTURE

```
src/app/admin/
├── page.tsx                    # Admin dashboard homepage
├── layout.tsx                  # Admin layout with nav
├── crm/
│   ├── page.tsx               # CRM overview (Phase 1)
│   ├── leads/
│   ├── accounts/
│   ├── contacts/
│   └── pipeline/
├── marketing/
│   ├── page.tsx
│   ├── campaigns/
│   ├── automation/
│   ├── email-management/
│   ├── content-calendar/
│   └── analytics/
├── social-media/
│   ├── page.tsx
│   ├── channels/
│   ├── posting/
│   ├── engagement/
│   ├── algorithm-monitoring/
│   ├── competitor-tracking/
│   └── analytics/
├── seo/
├── platform-monitoring/
├── integrations/
├── analytics/
└── settings/

src/components/admin/
├── AdminLayout.tsx
├── AdminHeader.tsx
├── AdminNav.tsx
├── AdminStatCard.tsx
├── AdminQuickAccessCard.tsx
├── AdminActivityTimeline.tsx
└── AlertBanner.tsx
```

---

**Next PRD**: PRD-ADMIN-002 (CRM Module - Phase 1)
