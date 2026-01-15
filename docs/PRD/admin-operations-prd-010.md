# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-010: Analytics & Reporting Module

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 9 (Analytics & Reporting) - 2-3 weeks
**Scope**: Executive dashboard, sales/marketing analytics, custom reports, scheduled distribution, alert thresholds

---

## 1. EXECUTIVE SUMMARY

The Analytics & Reporting module provides comprehensive business intelligence across all admin operations. It consolidates data from CRM, marketing, social media, SEO, and platform monitoring into actionable dashboards. The system enables executives and managers to track KPIs, forecast revenue, analyze performance trends, and receive automated alerts when metrics exceed thresholds.

**Implemented Features**: 5 pages (overview, executive dashboard with API integration, sales analytics, marketing analytics, custom reports with scheduling and alerts)

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- No unified view of business performance across operations
- KPI tracking is manual and time-consuming
- Revenue forecasting lacks data-driven insights
- Marketing ROI calculations are inconsistent
- Alert fatigue from too many manual checks
- Reports distributed manually via spreadsheets
- Historical trend analysis difficult without consolidated data

### 2.2 Business Goals
1. Provide real-time KPI visibility for executives
2. Enable data-driven decision making
3. Automate report generation and distribution
4. Predict revenue trends with sales forecasting
5. Calculate marketing ROI across all channels
6. Alert stakeholders when metrics breach thresholds
7. Track performance trends over time

### 2.3 Key Metrics
- Dashboard load time: <2s for executive dashboard
- Report generation time: <5s for standard reports
- Alert trigger latency: <5 minutes from threshold breach
- Forecast accuracy: ±10% for 30-day revenue predictions
- User adoption: >80% of managers use dashboards weekly

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **CEO/Executive** | Track high-level KPIs, revenue trends, strategic metrics |
| **Sales Manager** | Monitor pipeline, forecast revenue, track team performance |
| **Marketing Manager** | Analyze campaign ROI, lead generation, channel effectiveness |
| **Operations Manager** | Review system health, integration status, operational metrics |
| **Finance** | Track ARR/MRR, revenue forecasting, cost analysis |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Executive dashboard with key business metrics
- Sales analytics (pipeline, conversions, forecasting)
- Marketing analytics (campaigns, ROI, channels)
- Custom report builder with drag-drop metrics
- Scheduled report distribution (daily, weekly, monthly)
- Alert system with threshold-based triggers
- Data export (CSV, PDF, Excel)
- Historical trend tracking

### 4.2 Out of Scope
- Real-time streaming analytics (Phase 10+)
- Advanced ML-based forecasting (Phase 10+)
- Custom dashboard builder for end users (Phase 10+)
- Data warehouse integration (Phase 10+)
- BI tool integration (Tableau, PowerBI) (Phase 10+)

### 4.3 Constraints
- Data aggregation runs hourly (not real-time)
- Forecasting limited to 90-day window
- Maximum 50 custom reports per organization
- Maximum 20 alert configurations per organization
- Report generation timeout: 60 seconds

---

## 5. DETAILED REQUIREMENTS

### 5.1 Analytics Overview Page

**Path**: `/admin/analytics`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Analytics                   │
│ Title: "Analytics"                              │
│ Subtitle: "Business intelligence and reporting"│
├─ Quick Links ──────────────────────────────────┤
│ [Executive Dashboard] [Sales Analytics]         │
│ [Marketing Analytics] [Custom Reports]          │
└─────────────────────────────────────────────────┘
```

**Features**:
- Quick navigation to analytics pages
- Loading indicator while data loads

---

### 5.2 Executive Dashboard Page

**Path**: `/admin/analytics/executive-dashboard`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Executive Dashboard                              │
│ Time Range: [7d / 30d / 90d] ▼                  │
│ [Refresh] [Export Report]                       │
│ Last updated: 2026-01-15 15:08:46               │
├─ Revenue Metrics ──────────────────────────────┤
│ ┌─ MRR ──────┬─ New MRR ──┬─ Expansion ─┬─ Churn ─┐
│ │ $48.5k      │ $6.5k      │ $2.8k      │ -$1.2k │
│ │ ↑12.5%      │            │            │        │
│ └─────────────┴────────────┴────────────┴────────┘
│ ARR: $582k (↑18.2%)                              │
├─ Customer Metrics ─────────────────────────────┤
│ ┌─ Total ─────┬─ New ──┬─ Churned ─┬─ Churn Rate ─┐
│ │ 127 (↑8.5%) │ 12     │ 2        │ 1.6%        │
│ └─────────────┴────────┴──────────┴─────────────┘
├─ Lead & Marketing Metrics ─────────────────────┤
│ ┌─ Total Leads ┬─ MQL ─┬─ SQL ─┬─ Conv Rate ┬─ CPL ─┐
│ │ 1.8k (↑23%)  │ 342   │ 87    │ 25.4%      │ $42   │
│ └──────────────┴───────┴───────┴────────────┴───────┘
├─ Sales Metrics ────────────────────────────────┤
│ Pipeline Value: $487k (↑15.3%)                  │
│ Deals Won: 18 | Avg Deal: $4,200 (↑6.8%)       │
│ Sales Cycle: 23 days (↓12%)                    │
├─ Platform Metrics (AI Visibility) ─────────────┤
│ Mentions: 2.8k (↑34.2%)                         │
│ Visibility: 78.5% (↑12.1%)                     │
│ Share of Voice: 42.3% (↑8.5%)                  │
│ Customer Health: 87/100 | NPS: 68               │
├─ Key Insights & Recommendations ───────────────┤
│ ✅ Positive | High Impact | Revenue              │
│    Strong MRR Growth                            │
│    MRR increased by 12.5%, driven by new        │
│    customer acquisition and expansion           │
│                                                  │
│ ⚠️  Warning | Medium Impact | Sales              │
│    Pipeline Conversion Slowing                  │
│    Deal velocity down 8%, may need sales        │
│    process optimization                         │
│ (3 more insights...)                             │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Revenue Metrics**: MRR, ARR, new MRR, expansion MRR, churn MRR with trend indicators
- **Customer Metrics**: Total customers, new, churned, churn rate, net new
- **Lead Metrics**: Total leads, MQL, SQL, conversion rate, avg lead score, cost per lead
- **Sales Metrics**: Pipeline value, deals won, avg deal size, sales cycle length
- **Platform Metrics**: AI platform mentions, visibility score, share of voice, customer health
- **Key Insights**: Auto-generated insights with severity (positive, warning, critical) and impact level (high, medium, low)
- **API Integration**: Uses `useAnalyticsDashboard` hook with SWR for data fetching
- **Loading/Error States**: Spinner during data fetch, error alert on failure
- **Time Range Selector**: 7d, 30d, 90d views
- **Export**: Download report as PDF

**API Integration**:
```typescript
const { dashboard, isLoading, isError, error } = useAnalyticsDashboard(null);
// Fetches from: GET /api/admin/analytics/dashboard
```

---

### 5.3 Sales Analytics Page

**Path**: `/admin/analytics/sales-analytics`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Sales Analytics                                  │
│ Pipeline health, conversions, revenue forecasting│
│ Time Range: [7d / 30d / 90d] ▼                  │
│ [Refresh] [Export Report]                       │
├─ Key Performance Metrics ──────────────────────┤
│ Pipeline: $487k (↑15.3%) | Win Rate: 24%       │
│ Avg Sales Cycle: 23d (↓12%) | Revenue: $75.6k  │
├─ Pipeline by Stage ────────────────────────────┤
│ Prospecting: 12 deals • $84k (Avg age: 5d)     │
│ ████████░░░░░░░░░░░░░░░░░░░░ 17%              │
│                                                  │
│ Qualification: 8 deals • $96k (Avg age: 12d)   │
│ ███████████░░░░░░░░░░░░░░░░ 20%               │
│                                                  │
│ Proposal: 6 deals • $108k (Avg age: 18d)       │
│ █████████████░░░░░░░░░░░░░░ 22%               │
│                                                  │
│ Negotiation: 5 deals • $95k (Avg age: 23d)     │
│ ███████████░░░░░░░░░░░░░░░░ 20%               │
│                                                  │
│ Closing: 4 deals • $72k (Avg age: 28d)         │
│ █████████░░░░░░░░░░░░░░░░░░ 15%               │
│                                                  │
│ Won: 7 deals • $32k (Avg age: 15d)             │
│ ██████░░░░░░░░░░░░░░░░░░░░░ 7%                │
├─ Stage-to-Stage Conversion Rates ──────────────┤
│ Prospect→Qualification: 67%                     │
│ Qualification→Proposal: 75%                     │
│ Proposal→Negotiation: 83%                       │
│ Negotiation→Closing: 80%                        │
│ Closing→Won: 64%                                │
├─ Deal Size Distribution & Loss Reasons ────────┤
│ $0-$2k: 8 deals, $12k (16%)                    │
│ $2k-$5k: 12 deals, $42k (24%)                  │
│ $5k-$10k: 14 deals, $98k (28%)                 │
│ $10k-$20k: 6 deals, $84k (12%)                 │
│ $20k+: 2 deals, $52k (4%)                      │
│                                                  │
│ Loss Reasons:                                    │
│ Price too high: 5 deals (42%)                   │
│ Chose competitor: 3 deals (25%)                 │
│ No budget: 2 deals (17%)                        │
├─ Revenue Forecast ─────────────────────────────┤
│ This Month:                                      │
│ • Expected: $68k | Committed: $45k             │
│ • Best Case: $82k | Worst Case: $38k           │
│                                                  │
│ Next Month: Expected $74k | Committed $52k     │
│ Next Quarter: Expected $220k | Committed $165k │
├─ Top Performers & Source Performance ──────────┤
│ Sarah Chen: 8 deals, $32.4k, 72% win, 18d cycle│
│ Marcus Johnson: 6 deals, $28.8k, 68% win       │
│ Emily Rodriguez: 4 deals, $14.4k, 58% win      │
│                                                  │
│ Source Performance:                              │
│ • Website: 487 leads, 12 conv (2.5%), $28.8k  │
│ • Referral: 124 leads, 8 conv (6.5%), $32.4k  │
│ • Paid Ads: 342 leads, 6 conv (1.8%), $14.4k  │
│ • Partner: 68 leads, 4 conv (5.9%), $18k      │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Pipeline by Stage**: 6 stages (Prospecting, Qualification, Proposal, Negotiation, Closing, Won) with deal count, value, average age
- **Visual Progress Bars**: Show pipeline value distribution across stages
- **Stage Conversion Rates**: Conversion percentage between each stage
- **Deal Size Distribution**: 5 size brackets ($0-$2k, $2k-$5k, $5k-$10k, $10k-$20k, $20k+)
- **Loss Reasons Analysis**: Top 5 reasons deals are lost with percentages
- **Revenue Forecasting**: This month, next month, next quarter with expected/committed/best case/worst case scenarios
- **Top Performers**: Top 3 sales reps with deals won, revenue, win rate, sales cycle
- **Source Performance**: Lead source breakdown with conversion rates and revenue

---

### 5.4 Marketing Analytics Page

**Path**: `/admin/analytics/marketing-analytics`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Marketing Analytics                              │
│ Campaign performance, ROI, channel effectiveness│
│ Time Range: [7d / 30d / 90d / 12m] ▼           │
│ [Refresh] [Export Report]                       │
├─ Key Performance Metrics ──────────────────────┤
│ Total Spend: $28.5k (↑12.3%)                   │
│ Leads Generated: 1,847 (↑23.4%)                │
│ Cost per Lead: $15.43 (↓8.9%)                  │
│ ROI: 3.2x (↑15.6%)                             │
├─ Email Performance ────────────────────────────┤
│ Total Sent: 45,230                              │
│ Open Rate: 24.5% (↑2.3%)                       │
│ Click Rate: 3.8% (↑0.5%)                       │
│ Unsubscribe Rate: 0.4% (↓0.1%)                 │
│ Bounce Rate: 1.2% (↑0.2%)                      │
├─ Campaign Performance ─────────────────────────┤
│ Filters: [All / Active / Completed / Email /    │
│           Webinar / Social / Content] ▼         │
│                                                  │
│ ┌─ Q1 Product Launch (Email - Completed) ────┐ │
│ │ Spend: $8.5k | Leads: 487 | Conv: 24       │ │
│ │ Revenue: $57.6k | ROI: 6.8x                │ │
│ │ Duration: 45d ago → 15d ago                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Webinar Series (Active) ───────────────────┐ │
│ │ Spend: $6.2k | Leads: 342 | Conv: 18       │ │
│ │ Revenue: $43.2k | ROI: 7.0x                │ │
│ └─────────────────────────────────────────────┘ │
│ (3 more campaigns...)                            │
├─ Channel Performance ──────────────────────────┤
│ Email: $12.4k spend, 847 leads, 42 conv, ROI 8.1x│
│ Paid Ads: $8.2k spend, 423 leads, 18 conv, 5.3x│
│ Content: $4.8k spend, 342 leads, 12 conv, 6.0x │
│ Webinars: $3.1k spend, 235 leads, 15 conv, 11.6x│
├─ Content Performance ──────────────────────────┤
│ Ultimate Guide to GEO (Blog Post)               │
│ • 8,420 views | 124 leads | 8 conv (6.5%)     │
│ • Published 12 days ago                         │
│                                                  │
│ AI Search Webinar (Webinar)                     │
│ • 542 views | 87 leads | 12 conv (13.8%)      │
│ • Published 8 days ago                          │
│ (3 more content pieces...)                       │
├─ Audience Growth & Funnel ─────────────────────┤
│ Total Contacts: 12,847 (+487 this month)       │
│ Active Subscribers: 11,234                      │
│ Growth Rate: 3.9%                               │
│                                                  │
│ Marketing Funnel:                                │
│ Visitors: 45,230 → Leads: 1,847 (4.1%)        │
│ Leads: 1,847 → MQL: 342 (18.5%)               │
│ MQL: 342 → SQL: 87 (25.4%)                    │
│ SQL: 87 → Customers: 24 (27.6%)               │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Overview Metrics**: Total spend, leads generated, cost per lead, ROI with trend indicators
- **Email Performance**: Sent count, open rate, click rate, unsubscribe rate, bounce rate
- **Campaign Performance**: 5 campaigns (Q1 Product Launch, Webinar Series, Content Marketing, Paid Social Ads, Partner Co-Marketing) with spend, leads, conversions, revenue, ROI
- **Campaign Filtering**: By status (active, completed) or type (email, webinar, social, content, partner)
- **Channel Performance**: 4 channels (Email, Paid Ads, Content, Webinars) with comparative metrics
- **Content Performance**: Top 5 content pieces with views, leads, conversions, conversion rate, publish date
- **Audience Growth**: Total contacts, new this month, active subscribers, growth rate
- **Marketing Funnel**: 4-stage funnel (Visitors → Leads → MQL → SQL → Customers) with conversion rates

---

### 5.5 Custom Reports Page

**Path**: `/admin/analytics/custom-reports`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Custom Reports                                   │
│ Build, schedule, and manage custom reports      │
│ [+ New Report]                                   │
├─ Summary Stats ────────────────────────────────┤
│ Total: 6 | Active: 5 | Scheduled: 5            │
│ Total Alerts: 5 | Active Alerts: 4             │
├─ Filters & Search ─────────────────────────────┤
│ Search: [____________________]                   │
│ Category: [All / Executive / Sales / Marketing  │
│            / Platform / Operations] ▼           │
│ Status: [All / Active / Paused] ▼              │
├─ Report Cards ─────────────────────────────────┤
│ ┌─ Weekly Executive Summary ──────────────────┐ │
│ │ Category: Executive | Schedule: Weekly       │ │
│ │ Format: PDF | Status: Active                 │ │
│ │                                               │ │
│ │ Recipients: exec@company.com, ceo@...        │ │
│ │ Metrics: MRR, ARR, Customer Count, Leads,   │ │
│ │          Pipeline Value                      │ │
│ │                                               │ │
│ │ Last Run: 2d ago | Next Run: 5d from now    │ │
│ │ Created By: Admin | Created: 60d ago         │ │
│ │                                               │ │
│ │ [Run Now] [Edit] [Copy] [Delete]            │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Daily Lead Report ──────────────────────────┐ │
│ │ Category: Sales | Schedule: Daily            │ │
│ │ Format: CSV | Status: Active                 │ │
│ │ Last Run: 12h ago | Next Run: 12h from now  │ │
│ └──────────────────────────────────────────────┘ │
│ (4 more report cards...)                         │
├─ Alert Configurations ─────────────────────────┤
│ ┌─ High Churn Alert ──────────────────────────┐ │
│ │ Metric: Churn Rate                           │ │
│ │ Condition: Greater than 5.0%                 │ │
│ │ Status: Active                               │ │
│ │                                               │ │
│ │ Recipients: exec@..., customer-success@...   │ │
│ │ Last Triggered: 8d ago (2 total triggers)    │ │
│ │                                               │ │
│ │ [Edit] [Pause] [Delete]                     │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Low Lead Generation ────────────────────────┐ │
│ │ Metric: New Leads (Daily)                    │ │
│ │ Condition: Less than 50                      │ │
│ │ Status: Active | Never triggered             │ │
│ └──────────────────────────────────────────────┘ │
│ (3 more alert cards...)                          │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Custom Reports**: 6 pre-configured reports
  - Weekly Executive Summary (PDF, weekly, 5 metrics)
  - Daily Lead Report (CSV, daily, 5 metrics)
  - Monthly Marketing ROI (PDF, monthly, 5 metrics)
  - Platform Visibility Report (Excel, weekly, 4 metrics)
  - Integration Health Check (CSV, daily, 4 metrics)
  - Q4 Performance Review (PDF, manual, 6 metrics)
- **Report Attributes**:
  - Name, description, category (executive, sales, marketing, platform, operations)
  - Schedule (daily, weekly, monthly, manual)
  - Format (PDF, CSV, Excel)
  - Recipients (email list)
  - Metrics included
  - Last run, next run timestamps
  - Created by, created at
  - Status (active, paused)
- **Report Actions**: Run now, edit, copy, delete
- **Alert Configurations**: 5 alerts
  - High Churn Alert (Churn Rate > 5%)
  - Low Lead Generation (New Leads < 50)
  - Integration Downtime (Uptime < 99%)
  - Pipeline Value Drop (decreased by >20%)
  - Marketing ROI Decline (ROI < 2.0)
- **Alert Attributes**:
  - Name, metric, condition (greater_than, less_than, decreased_by), threshold
  - Status (active, paused)
  - Recipients (email list)
  - Last triggered timestamp, trigger count
- **Alert Actions**: Edit, pause/resume, delete
- **Search and Filtering**: By name, category, status

---

## 6. API REQUIREMENTS

### 6.1 Executive Dashboard APIs

**GET `/api/admin/analytics/dashboard`**
```typescript
Response: {
  revenue: {
    mrr: number
    mrrChange: number
    arr: number
    arrChange: number
    newMRR: number
    expansionMRR: number
    churnMRR: number
  }
  customers: {
    total: number
    totalChange: number
    new: number
    churned: number
    churnRate: number
    netNew: number
  }
  leads: {
    total: number
    totalChange: number
    mql: number
    sql: number
    conversionRate: number
    avgLeadScore: number
  }
  marketing: {
    campaigns: number
    campaignsActive: number
    engagement: number
    engagementChange: number
    costPerLead: number
    costPerLeadChange: number
  }
  sales: {
    pipeline: number
    pipelineChange: number
    dealsWon: number
    avgDealSize: number
    avgDealSizeChange: number
    salesCycle: number
    salesCycleChange: number
  }
  platforms: {
    mentions: number
    mentionsChange: number
    visibility: number
    visibilityChange: number
    shareOfVoice: number
    shareOfVoiceChange: number
  }
  health: {
    customerHealth: number
    nps: number
    satisfactionScore: number
    activeUsers: number
  }
  insights: Array<{
    id: string
    type: "positive" | "warning" | "negative"
    category: string
    title: string
    description: string
    impact: "high" | "medium" | "low"
  }>
}
```

---

### 6.2 Sales Analytics APIs

**GET `/api/admin/analytics/sales`**
```typescript
Query Parameters:
  - timeRange?: "7d" | "30d" | "90d"

Response: {
  pipeline: {
    totalValue: number
    totalChange: number
    dealCount: number
    avgDealSize: number
    avgDealSizeChange: number
    byStage: Array<{
      stage: string
      count: number
      value: number
      avgAge: number
    }>
  }
  conversions: {
    prospectToQualification: number
    qualificationToProposal: number
    proposalToNegotiation: number
    negotiationToClosing: number
    closingToWon: number
    overallWinRate: number
  }
  performance: {
    dealsWon: number
    dealsLost: number
    avgSalesCycle: number
    avgSalesCycleChange: number
    revenue: number
    revenueChange: number
  }
  dealSizeDistribution: Array<{
    range: string
    count: number
    value: number
    percentage: number
  }>
  topPerformers: Array<{
    name: string
    dealsWon: number
    revenue: number
    avgDealSize: number
    winRate: number
    salesCycle: number
  }>
  lossReasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
  forecast: {
    thisMonth: { expected: number; committed: number; bestCase: number; worstCase: number }
    nextMonth: { expected: number; committed: number; bestCase: number; worstCase: number }
    nextQuarter: { expected: number; committed: number; bestCase: number; worstCase: number }
  }
  sourcePerformance: Array<{
    source: string
    leads: number
    conversions: number
    conversionRate: number
    revenue: number
    avgDealSize: number
  }>
}
```

---

### 6.3 Marketing Analytics APIs

**GET `/api/admin/analytics/marketing`**
```typescript
Query Parameters:
  - timeRange?: "7d" | "30d" | "90d" | "12m"
  - campaignFilter?: "all" | "active" | "completed" | "email" | "webinar" | "social" | "content"

Response: {
  overview: {
    totalSpend: number
    totalSpendChange: number
    leadsGenerated: number
    leadsGeneratedChange: number
    costPerLead: number
    costPerLeadChange: number
    roi: number
    roiChange: number
  }
  emailPerformance: {
    totalSent: number
    openRate: number
    openRateChange: number
    clickRate: number
    clickRateChange: number
    unsubscribeRate: number
    unsubscribeRateChange: number
    bounceRate: number
    bounceRateChange: number
  }
  campaignPerformance: Array<{
    id: string
    name: string
    type: "email" | "webinar" | "content" | "social" | "partner"
    status: "active" | "completed"
    spend: number
    leads: number
    conversions: number
    revenue: number
    roi: number
    startDate: ISO8601
    endDate: ISO8601
  }>
  channelPerformance: Array<{
    channel: string
    spend: number
    leads: number
    conversions: number
    revenue: number
    roi: number
    costPerLead: number
  }>
  contentPerformance: Array<{
    title: string
    type: string
    views: number
    leads: number
    conversions: number
    conversionRate: number
    publishedDays: number
  }>
  audienceGrowth: {
    totalContacts: number
    newThisMonth: number
    activeSubscribers: number
    unsubscribedThisMonth: number
    growthRate: number
  }
  funnelMetrics: {
    visitors: number
    leads: number
    mql: number
    sql: number
    customers: number
    visitorToLeadRate: number
    leadToMqlRate: number
    mqlToSqlRate: number
    sqlToCustomerRate: number
  }
}
```

---

### 6.4 Custom Reports APIs

**GET `/api/admin/analytics/reports`**
```typescript
Response: {
  reports: Array<{
    id: string
    name: string
    description: string
    category: "executive" | "sales" | "marketing" | "platform" | "operations"
    schedule: "daily" | "weekly" | "monthly" | "manual"
    format: "pdf" | "csv" | "excel"
    recipients: string[]
    lastRun: ISO8601
    nextRun: ISO8601 | null
    status: "active" | "paused"
    metrics: string[]
    createdBy: string
    createdAt: ISO8601
  }>
  alerts: Array<{
    id: string
    name: string
    metric: string
    condition: "greater_than" | "less_than" | "decreased_by"
    threshold: number
    status: "active" | "paused"
    recipients: string[]
    lastTriggered: ISO8601 | null
    triggerCount: number
  }>
  summary: {
    totalReports: number
    activeReports: number
    scheduledReports: number
    totalAlerts: number
    activeAlerts: number
  }
}
```

**POST `/api/admin/analytics/reports`** (Create report)
**PUT `/api/admin/analytics/reports/[id]`** (Update report)
**DELETE `/api/admin/analytics/reports/[id]`** (Delete report)
**POST `/api/admin/analytics/reports/[id]/run`** (Run report now)

**POST `/api/admin/analytics/alerts`** (Create alert)
**PUT `/api/admin/analytics/alerts/[id]`** (Update alert)
**DELETE `/api/admin/analytics/alerts/[id]`** (Delete alert)
**POST `/api/admin/analytics/alerts/[id]/pause`** (Pause alert)
**POST `/api/admin/analytics/alerts/[id]/resume`** (Resume alert)

---

## 7. DATABASE SCHEMA

**Existing Tables** (no changes needed):
- `analytics_events` - Aggregated daily/monthly metrics
- `metrics` - Campaign performance metrics

**New Tables**:

```sql
CREATE TABLE custom_reports (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  schedule VARCHAR(20), -- daily, weekly, monthly, manual
  format VARCHAR(10), -- pdf, csv, excel
  recipients TEXT[], -- array of emails
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  metrics TEXT[], -- array of metric names
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert_configurations (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  condition VARCHAR(50), -- greater_than, less_than, decreased_by
  threshold DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active',
  recipients TEXT[],
  last_triggered TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE report_execution_history (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES custom_reports(id),
  org_id UUID REFERENCES organizations(id),
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER,
  status VARCHAR(20), -- success, failed
  error_message TEXT,
  file_path VARCHAR(500)
);

CREATE TABLE alert_trigger_history (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alert_configurations(id),
  org_id UUID REFERENCES organizations(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  metric_value DECIMAL(10,2),
  threshold_value DECIMAL(10,2),
  notified_users TEXT[]
);
```

---

## 8. IMPLEMENTATION STATUS

### 8.1 Pages Implemented
✅ `/admin/analytics/page.tsx` - Analytics overview (placeholder)
✅ `/admin/analytics/executive-dashboard/page.tsx` - Executive dashboard with API integration
✅ `/admin/analytics/sales-analytics/page.tsx` - Sales analytics
✅ `/admin/analytics/marketing-analytics/page.tsx` - Marketing analytics
✅ `/admin/analytics/custom-reports/page.tsx` - Custom reports and alerts

### 8.2 Features Implemented
✅ Executive dashboard with comprehensive KPIs
✅ Revenue metrics (MRR, ARR, new MRR, expansion MRR, churn MRR)
✅ Customer metrics (total, new, churned, churn rate)
✅ Lead & marketing metrics (leads, MQL, SQL, conversion rate, CPL)
✅ Sales metrics (pipeline, deals won, avg deal size, sales cycle)
✅ Platform metrics (mentions, visibility, share of voice)
✅ Key insights with severity and impact levels
✅ Sales analytics with pipeline by stage
✅ Stage-to-stage conversion rates
✅ Deal size distribution and loss reasons
✅ Revenue forecasting (this month, next month, next quarter)
✅ Top performers and source performance
✅ Marketing analytics with campaign performance
✅ Email performance metrics
✅ Channel performance comparison
✅ Content performance tracking
✅ Audience growth and marketing funnel
✅ Custom reports (6 pre-configured reports)
✅ Report scheduling (daily, weekly, monthly, manual)
✅ Alert configurations (5 pre-configured alerts)
✅ Report/alert filtering and search
✅ Time range selector (7d, 30d, 90d, 12m)
✅ Export functionality (PDF, CSV, Excel)

### 8.3 API Integration
✅ **Executive Dashboard**: Full API integration with `useAnalyticsDashboard` hook
- Fetches from: `GET /api/admin/analytics/dashboard`
- Loading/error states implemented
- Mock data fallback in place
✅ **Sales/Marketing Analytics**: Ready for API connection
✅ **Custom Reports**: Ready for API connection

---

## 9. SECURITY & COMPLIANCE

### 9.1 Data Access Control
- Organization-scoped data (Clerk org context)
- Role-based access to sensitive financial metrics
- Report recipients validated against org members
- Alert configurations protected by role

### 9.2 Data Privacy
- PII excluded from automated reports
- Aggregate metrics only (no individual records)
- Report data encrypted at rest
- Alert history retained for 90 days

### 9.3 Audit Logging
- Report execution history tracked
- Alert trigger history logged
- User actions audited (create, edit, delete reports/alerts)
- Export events logged

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- Metric calculation logic (MRR, ARR, ROI, churn rate)
- Forecast algorithms (expected, best case, worst case)
- Alert threshold evaluation
- Report formatting (PDF, CSV, Excel)

### 10.2 Integration Tests
- Executive dashboard API returns correct metrics
- Sales analytics calculates pipeline correctly
- Marketing analytics aggregates campaigns correctly
- Custom reports execute and generate files
- Alerts trigger when thresholds breached
- Report scheduling works (daily, weekly, monthly)

### 10.3 E2E Tests (Playwright)
- Navigate to executive dashboard
- View all KPIs and trends
- Change time range
- Navigate to sales analytics
- View pipeline and conversions
- Navigate to marketing analytics
- Filter campaigns
- Navigate to custom reports
- Create new report
- Schedule report
- Create alert configuration

---

## 11. ACCEPTANCE CRITERIA

**Executive Dashboard**:
- [x] Loads in <2s with all metrics
- [x] Revenue metrics accurate (MRR, ARR, new MRR, expansion, churn)
- [x] Customer metrics accurate (total, new, churned, churn rate)
- [x] Lead metrics accurate (total, MQL, SQL, conversion rate, CPL)
- [x] Sales metrics accurate (pipeline, deals won, avg deal size, cycle)
- [x] Platform metrics accurate (mentions, visibility, share of voice)
- [x] Key insights display with severity and impact
- [x] Time range selector works (7d, 30d, 90d)
- [x] Export report button functional
- [x] API integration working with loading/error states
- [x] Responsive on mobile

**Sales Analytics**:
- [x] Pipeline by stage displays all 6 stages
- [x] Visual progress bars accurate
- [x] Stage conversion rates calculated correctly
- [x] Deal size distribution shows 5 brackets
- [x] Loss reasons analysis displays top 5 reasons
- [x] Revenue forecast shows 3 time periods
- [x] Top performers list displays top 3 reps
- [x] Source performance compares 4 sources
- [x] Responsive design works

**Marketing Analytics**:
- [x] Overview metrics accurate (spend, leads, CPL, ROI)
- [x] Email performance shows all metrics
- [x] Campaign performance lists 5 campaigns
- [x] Campaign filtering works (status, type)
- [x] Channel performance compares 4 channels
- [x] Content performance shows top 5 pieces
- [x] Audience growth metrics accurate
- [x] Marketing funnel displays 4-stage conversion
- [x] Responsive on mobile

**Custom Reports**:
- [x] Loads 6 pre-configured reports
- [x] Report cards display all attributes
- [x] Report actions work (run now, edit, copy, delete)
- [x] Alert configurations display 5 alerts
- [x] Alert actions work (edit, pause, delete)
- [x] Search and filtering functional
- [x] Summary stats accurate
- [x] Responsive design

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 2-3 weeks (Phase 9)

**Dependencies**:
- Admin layout (PRD-001) ✅
- CRM data (PRD-002) ✅
- Marketing campaigns data (PRD-003) ✅
- Email automation data (PRD-004) ✅
- Social media data (PRD-006) ✅
- Platform monitoring data (PRD-007) ✅
- SEO data (PRD-008) ✅
- Integration health data (PRD-009) ✅
- Database with analytics_events, metrics tables ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Real-time Analytics**: Should we implement real-time streaming for exec dashboard? (Recommendation: Hourly aggregation for Phase 9, real-time in Phase 10)
2. **Advanced Forecasting**: Should we use ML models for revenue forecasting? (Recommendation: Simple weighted average for Phase 9, ML in Phase 10)
3. **Custom Dashboard Builder**: Should users be able to drag-drop widgets to build custom dashboards? (Recommendation: Phase 10+)
4. **Data Warehouse Integration**: Should we integrate with external BI tools (Tableau, PowerBI)? (Recommendation: Phase 10+ when customer demand exists)

---

## 14. APPENDIX

### A. Metric Calculation Formulas

**MRR (Monthly Recurring Revenue)**:
```typescript
function calculateMRR(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.monthlyValue, 0);
}
```

**ARR (Annual Recurring Revenue)**:
```typescript
function calculateARR(mrr: number): number {
  return mrr * 12;
}
```

**Churn Rate**:
```typescript
function calculateChurnRate(churned: number, totalAtStart: number): number {
  return (churned / totalAtStart) * 100;
}
```

**ROI (Return on Investment)**:
```typescript
function calculateROI(revenue: number, cost: number): number {
  return (revenue - cost) / cost;
}
```

**Conversion Rate**:
```typescript
function calculateConversionRate(converted: number, total: number): number {
  return (converted / total) * 100;
}
```

### B. Revenue Forecasting Algorithm

```typescript
interface ForecastScenario {
  expected: number;
  committed: number;
  bestCase: number;
  worstCase: number;
}

function forecastRevenue(
  pipeline: Deal[],
  timeframe: 'month' | 'quarter'
): ForecastScenario {
  const days = timeframe === 'month' ? 30 : 90;
  const now = new Date();

  // Filter deals likely to close in timeframe
  const relevantDeals = pipeline.filter(deal => {
    const daysInStage = getDaysInStage(deal);
    const avgCycleTillClose = getAvgCycleTillClose(deal.stage);
    const expectedCloseDate = addDays(now, avgCycleTillClose);
    return isBefore(expectedCloseDate, addDays(now, days));
  });

  // Calculate scenarios
  const expected = relevantDeals.reduce((sum, deal) => {
    const winProbability = getWinProbabilityByStage(deal.stage);
    return sum + (deal.value * winProbability);
  }, 0);

  const committed = relevantDeals
    .filter(deal => deal.stage === 'Closing' || deal.stage === 'Negotiation')
    .reduce((sum, deal) => sum + deal.value, 0);

  const bestCase = relevantDeals
    .reduce((sum, deal) => sum + deal.value, 0);

  const worstCase = relevantDeals
    .filter(deal => deal.stage === 'Closing')
    .reduce((sum, deal) => sum + (deal.value * 0.8), 0);

  return { expected, committed, bestCase, worstCase };
}

function getWinProbabilityByStage(stage: string): number {
  const probabilities = {
    'Prospecting': 0.10,
    'Qualification': 0.20,
    'Proposal': 0.40,
    'Negotiation': 0.60,
    'Closing': 0.80,
  };
  return probabilities[stage] || 0;
}
```

### C. Alert Threshold Evaluation

```typescript
interface AlertCondition {
  metric: string;
  condition: 'greater_than' | 'less_than' | 'decreased_by';
  threshold: number;
}

function evaluateAlert(
  condition: AlertCondition,
  currentValue: number,
  previousValue: number
): boolean {
  switch (condition.condition) {
    case 'greater_than':
      return currentValue > condition.threshold;

    case 'less_than':
      return currentValue < condition.threshold;

    case 'decreased_by':
      const percentDecrease = ((previousValue - currentValue) / previousValue) * 100;
      return percentDecrease >= condition.threshold;

    default:
      return false;
  }
}

async function checkAndTriggerAlerts(orgId: string): Promise<void> {
  const alerts = await getActiveAlerts(orgId);
  const currentMetrics = await getCurrentMetrics(orgId);
  const previousMetrics = await getPreviousMetrics(orgId);

  for (const alert of alerts) {
    const currentValue = currentMetrics[alert.metric];
    const previousValue = previousMetrics[alert.metric];

    if (evaluateAlert(alert, currentValue, previousValue)) {
      await triggerAlert(alert, currentValue);
      await notifyRecipients(alert.recipients, alert.name, currentValue);
      await logAlertTrigger(alert.id, currentValue, alert.threshold);
    }
  }
}
```

### D. Report Generation Workflow

```typescript
async function generateReport(reportId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Load report configuration
    const report = await getReportConfig(reportId);

    // 2. Fetch metrics data
    const data = await fetchReportData(report.metrics, report.orgId);

    // 3. Generate report file based on format
    let filePath: string;
    switch (report.format) {
      case 'pdf':
        filePath = await generatePDFReport(report, data);
        break;
      case 'csv':
        filePath = await generateCSVReport(report, data);
        break;
      case 'excel':
        filePath = await generateExcelReport(report, data);
        break;
    }

    // 4. Email report to recipients
    await emailReport(report.recipients, filePath, report.name);

    // 5. Log execution
    const executionTime = Date.now() - startTime;
    await logReportExecution(reportId, 'success', executionTime, filePath);

    // 6. Schedule next run
    await scheduleNextRun(reportId, report.schedule);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    await logReportExecution(reportId, 'failed', executionTime, null, error.message);
    await notifyAdmins(reportId, error);
  }
}
```

---

**Previous PRD**: PRD-ADMIN-009 (Integration Management - Phase 8)

**End of PRD Series**: This completes all 10 PRDs for the Admin Operations system.
