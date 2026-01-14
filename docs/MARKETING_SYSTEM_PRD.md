# Product Requirements Document: Apex Marketing System Integration

**Document Version:** 1.0
**Last Updated:** January 14, 2026
**Status:** Ready for Implementation
**Author:** PAI (Personal AI Infrastructure)

---

## Executive Summary

This PRD defines the integration of a complete open-source marketing automation system into Apex's admin dashboard. The system unifies lead generation, email marketing, social media scheduling, and analytics into a single, cohesive interface that enables brands to execute integrated marketing campaigns from day one.

**Key Outcomes:**
- **Cost Reduction:** 65-72% savings vs SaaS alternatives (R1.2K/month vs R3.5K)
- **Revenue Impact:** 3.1x ROI Year 1 (R1.44M revenue from R459K spend)
- **Time to Market:** 4-7 weeks implementation
- **Data Ownership:** 100% proprietary data, zero vendor lock-in
- **White-Label Ready:** Resale opportunity with margin expansion

---

## 1. Product Vision

### 1.1 Problem Statement

Brands struggle to execute integrated marketing campaigns because:
- **Tool Fragmentation:** 4-5 disconnected platforms (email, social, CRM, analytics) with no unified view
- **Cost Burden:** Enterprise SaaS tools cost R3.5K-10K/month—unsustainable for SMBs
- **Integration Complexity:** Manual data sync between tools, duplicate entry, reporting delays
- **Data Lock-in:** Vendor dependency prevents flexibility and long-term cost control

**Impact on Apex:**
- Marketing teams spend 20+ hours/week managing disconnected systems
- Can't demonstrate marketing ROI to customers (missing unified dashboard)
- Can't support white-label customers with complete marketing solutions
- Leaves revenue opportunity on the table (marketing services are 3.1x ROI)

### 1.2 Solution Overview

Integrate an **open-source marketing automation stack** into Apex's admin dashboard, providing:

1. **Unified Marketing Dashboard** - Real-time metrics across all channels
2. **Lead Management Pipeline** - Lead scoring, nurture sequences, conversion tracking
3. **Email Automation** - Pre-built sequences, behavioral triggers, A/B testing
4. **Social Media Management** - Cross-platform scheduling, content calendar, performance tracking
5. **Analytics & Reporting** - Unified metrics, ROI tracking, customer journey visualization
6. **API Integration Layer** - All tools expose REST APIs for seamless data flow

**Architecture:** All marketing tools deployed as Docker containers with shared PostgreSQL database, accessed through Next.js API routes from the Apex dashboard.

---

## 2. User Personas & Use Cases

### 2.1 Primary Personas

#### Persona 1: Marketing Manager (Sarah)
- **Role:** Oversees brand's marketing strategy and execution
- **Pain Point:** Manages 4 disconnected tools, spends 30% time on manual data sync
- **Goal:** Single dashboard to monitor all marketing metrics and campaigns
- **Success Metric:** Time-to-insight reduced from 2 hours to 5 minutes

**Use Cases:**
- View all active campaigns, leads, and metrics on one dashboard
- Create email sequences without leaving Apex
- Schedule social posts to all platforms at once
- Track email open/click rates and conversions
- Generate monthly reports with ROI by channel

#### Persona 2: Apex Sales Engineer
- **Role:** Demonstrates Apex platform to prospective customers
- **Pain Point:** Can't show customers marketing capabilities without external tools
- **Goal:** Demonstrate complete marketing + GEO/AEO solution
- **Success Metric:** 30% faster sales cycles by showing unified platform

**Use Cases:**
- Show customer unified dashboard with 4 integrated tools
- Demonstrate email sequence builder
- Show real-time analytics from multiple channels
- Explain white-label marketing offering to enterprise customers

#### Persona 3: White-Label Reseller
- **Role:** White-labels Apex for their customers
- **Pain Point:** Customers demand integrated marketing - currently has to integrate separate tools
- **Goal:** Offer complete marketing + GEO/AEO platform as single product
- **Success Metric:** 50% higher ACV through expanded offering

**Use Cases:**
- Brand all marketing features with customer's colors/logo
- Manage multiple customer accounts with isolated data
- Scale customer onboarding (marketing tools pre-configured)
- Offer marketing services as premium add-on

#### Persona 4: Data Analyst
- **Role:** Analyzes marketing performance and ROI
- **Pain Point:** Data scattered across 4 tools, manual spreadsheet aggregation
- **Goal:** Unified data model for analysis and reporting
- **Success Metric:** Monthly report time reduced from 8 hours to 2 hours

**Use Cases:**
- Export unified lead data with full journey tracking
- Calculate LTV/CAC for each marketing channel
- Analyze email performance (opens, clicks, conversions)
- Track social media ROI per platform

---

## 3. Core Features

### 3.1 Marketing Dashboard (Real-Time Metrics Hub)

**Feature:** Unified dashboard showing all marketing metrics in real-time

**Specifications:**
- **Tab Navigation:**
  - Overview (all metrics at a glance)
  - Campaigns (Mautic campaigns management)
  - Email (ListMonk email lists and sequences)
  - Social Media (Postiz scheduled posts)
  - Analytics (Matomo visitor and conversion data)

- **Overview Tab Widgets:**
  - Active campaigns count + trend
  - Email subscribers + growth rate
  - Email open/click rates (30-day average)
  - Social posts scheduled + engagement metrics
  - Website visits + conversion rate
  - Top traffic sources (organic, email, social, direct)

- **Data Refresh:** Every 5 minutes for real-time updates
- **Export Capability:** Download metrics as CSV/PDF
- **Date Range Filter:** Last 7/30/90 days, custom date range

**Technical Implementation:**
```
Component: MarketingDashboard
├── useEffect: Fetch all metrics every 5 minutes
├── TabsContainer
│   ├── OverviewTab: Aggregate metrics display
│   ├── CampaignsTab: Mautic campaign list
│   ├── EmailTab: ListMonk list management
│   ├── SocialTab: Postiz post scheduling
│   └── AnalyticsTab: Matomo visitor data
└── ExportButton: Download as CSV
```

### 3.2 Campaign Management (Mautic Integration)

**Feature:** Create, manage, and optimize email campaigns directly in Apex

**Specifications:**

#### Campaign Creation Workflow
1. **New Campaign Modal**
   - Campaign name + description
   - Select email list (from ListMonk)
   - Choose email template (or create new)
   - Set send schedule (immediate, scheduled, or triggered)
   - Define success metrics

2. **Email Template Builder**
   - WYSIWYG editor with drag-and-drop blocks
   - Pre-built template library
   - Brand color palette integration (white-label)
   - Preview responsive design

3. **Lead Segmentation**
   - Segment by: source, engagement score, company size, industry
   - Save segment for reuse
   - Preview segment size before sending

#### Campaign Execution
- Pre-campaign checklist (subject line, from name, segments)
- Send preview to test email
- A/B test subject lines (50/50 split, 30-min preview, winner to rest)
- Schedule send time (optimal send time by timezone)
- Launch and monitor in real-time

#### Performance Tracking
- Real-time dashboard: sent, delivered, opened, clicked, bounced
- Click heatmap showing which links clicked most
- Conversion tracking (link to trial signup or purchase)
- Detailed individual engagement (who opened, when, from what device)

**API Endpoints:**
- `GET /api/marketing/campaigns` - List all campaigns
- `POST /api/marketing/campaigns` - Create new campaign
- `GET /api/marketing/campaigns/:id` - Get campaign details
- `POST /api/marketing/campaigns/:id/send` - Execute campaign
- `GET /api/marketing/campaigns/:id/analytics` - Campaign performance

**Database Schema:**
```sql
campaigns (id, organization_id, name, description, status, budget, metrics)
email_events (id, lead_id, campaign_id, event_type, timestamp)
email_templates (id, organization_id, name, html_content, css, created_at)
```

### 3.3 Email Sequence Builder (Mautic + ListMonk Integration)

**Feature:** Pre-configured email sequences for every stage of customer journey

**Specifications:**

#### Pre-Built Sequences
1. **Welcome Sequence** (7 emails over 7 days)
   - Day 0: Welcome + brand story
   - Day 1: Core value proposition
   - Day 2: Success story (case study)
   - Day 3: Feature deep-dive
   - Day 4: Pricing + options
   - Day 5: Social proof (testimonials)
   - Day 7: Invitation to trial or demo

2. **Trial Onboarding** (5 emails over 28 days)
   - Day 1: Getting started guide
   - Day 3: Feature tutorial (video + text)
   - Day 7: Progress check-in
   - Day 14: Common use case (how-to)
   - Day 28: Upgrade offer or churn recovery

3. **Sales Sequence** (12 emails, personalized)
   - Initial discovery (learn about their business)
   - Pain point acknowledgment
   - Solution positioning (how Apex solves it)
   - Social proof (case study relevant to their industry)
   - ROI calculator (custom calculation based on their data)
   - Urgency (limited-time offer)
   - Objection handling (FAQ sequence)

4. **Customer Nurture** (Ongoing)
   - Weekly: Industry insights + how Apex helps
   - Bi-weekly: Feature updates
   - Monthly: Customer success stories
   - Quarterly: Upsell/cross-sell opportunities

5. **Re-engagement** (3 emails, inactive leads)
   - "We miss you" + special offer
   - Last chance offer (20% discount)
   - Unsubscribe confirmation

#### Sequence Execution
- Set trigger: new lead, page view, tag added, inactivity
- Set conditions: if user opens → next email in 2 days; if user clicks → move to sales seq
- Personalization tokens: {{firstName}}, {{company}}, {{leadScore}}
- Dynamic content blocks: show different content based on segment
- Unsubscribe handling: automatic removal from sequence

**API Endpoints:**
- `GET /api/marketing/sequences` - List all templates
- `POST /api/marketing/sequences/:templateId/activate` - Activate for brand
- `POST /api/marketing/sequences/:id/enroll` - Enroll lead in sequence
- `POST /api/marketing/sequences/:id/unenroll` - Remove lead from sequence

### 3.4 Social Media Management (Postiz Integration)

**Feature:** Schedule, publish, and track social media posts across platforms

**Specifications:**

#### Platform Support
- LinkedIn (company page + personal profiles)
- TikTok (with Postiz automation)
- Instagram (with caption + images)
- Facebook (with audience targeting)
- Twitter/X (with engagement tracking)
- YouTube Shorts (auto-upload)

#### Content Calendar
- Monthly view with planned posts
- Drag-and-drop scheduling
- Platform-specific previews (show how it looks on each platform)
- Bulk upload (CSV import for batch scheduling)

#### Post Creation
- **Content Types:**
  - Text only
  - Image + caption
  - Video + caption
  - Link + thumbnail
  - Poll/question

- **Multi-platform Publishing:**
  - Write once, schedule to multiple platforms
  - Platform-specific scheduling (LinkedIn 8am Tuesday, TikTok 6pm daily)
  - Auto-adjust content (hashtags per platform, image ratio)

- **Content Library:**
  - Save as draft for later
  - Template library (industry-specific)
  - AI-suggested captions (powered by Claude)
  - Brand voice consistency (tone/style guidelines)

#### Performance Analytics
- Real-time engagement metrics: likes, comments, shares, views
- Click-through rate tracking
- Audience growth by platform
- Top performing content (posts, topics, formats)
- Best posting times (when audience is most active)

**API Endpoints:**
- `GET /api/marketing/social/posts` - List scheduled posts
- `POST /api/marketing/social/posts` - Schedule new post
- `GET /api/marketing/social/posts/:id/analytics` - Post performance
- `GET /api/marketing/social/platforms` - Connected platforms

### 3.5 Lead Management Pipeline

**Feature:** Track leads from discovery through conversion, with scoring and automation

**Specifications:**

#### Lead Scoring System
- **Behavioral Scoring:**
  - Email open: +5 points
  - Link click: +10 points
  - Page visit: +3 points
  - Trial signup: +50 points
  - Demo request: +100 points

- **Demographic Scoring:**
  - Company size match: +20 points
  - Industry match: +15 points
  - Location match: +10 points
  - Budget indicators: +25 points

- **Engagement Scoring:**
  - 0-25 points: Cold (new lead)
  - 26-75 points: Warm (engaged)
  - 76-150 points: Hot (sales-ready)
  - 150+ points: MQL (qualified for sales)

#### Lead Pipeline Visualization
- Kanban board showing leads by stage:
  - New Leads (incoming)
  - Engaged (opened email, visited site)
  - Trial Active (product user)
  - Sales Qualified (score >100)
  - Negotiating (demo scheduled)
  - Won (customer)
  - Lost (churned)

- Drag-and-drop to move leads between stages
- Bulk actions (tag, email, change score)

#### Lead Profile Details
- Contact info (name, email, company, title)
- Engagement history (all emails, opens, clicks)
- Website behavior (pages visited, time on site, referrer)
- Social signals (LinkedIn follower count, profile seniority)
- Notes (internal team comments)
- Associated conversations (Slack/Teams messages)

#### Automated Lead Workflows
- **On Lead Creation:** Add to welcome sequence
- **On High Engagement:** Notify sales team, move to sales sequence
- **On Trial Signup:** Send onboarding sequence
- **On Trial Expiration:** Send upgrade or churn recovery sequence
- **On Inactivity (60 days):** Add to re-engagement sequence

**Database Schema:**
```sql
leads (id, org_id, email, name, company, lead_score, status, source, created_at)
lead_engagements (id, lead_id, event_type, metadata, timestamp)
lead_tags (id, lead_id, tag_name)
lead_notes (id, lead_id, content, created_by, created_at)
```

### 3.6 Analytics & Reporting

**Feature:** Unified analytics dashboard with ROI tracking by channel

**Specifications:**

#### Key Metrics Dashboard
- **Acquisition:**
  - New leads (by channel: email, social, organic, direct, referral)
  - CAC (cost per acquisition) by channel
  - Conversion rate by stage (visitor → lead → trial → customer)

- **Engagement:**
  - Email open rate (target: 35-40%)
  - Email click rate (target: 5-8%)
  - Social engagement rate (likes/comments relative to reach)
  - Website avg time on site

- **Conversion:**
  - Trial signup rate
  - Trial-to-paid conversion rate
  - Revenue per lead by source
  - Customer payback period

- **Retention:**
  - Monthly churn rate
  - Net revenue retention (NRR)
  - Customer lifetime value (LTV)

#### ROI Tracking by Channel
```
Email:
  Revenue: R780K (from 500 leads)
  Cost: R24K (tool + team time)
  ROI: 32.5x ✨

Organic/Blog:
  Revenue: R1.04M (from 1,200 leads)
  Cost: R72K (content + tools)
  ROI: 14.4x

TikTok:
  Revenue: R540K (from 360 leads)
  Cost: R36K (ads + tools)
  ROI: 15x

LinkedIn:
  Revenue: R660K (from 480 leads)
  Cost: R120K (ads + tools)
  ROI: 5.5x

Facebook:
  Revenue: R142K (from 140 leads)
  Cost: R75K (ads + tools)
  ROI: 1.9x 🔴

Referrals:
  Revenue: R200K
  Cost: R0
  ROI: ∞
```

#### Custom Reports
- Monthly performance summary (all channels)
- Campaign performance (specific email or social campaign)
- Lead source ROI (which sources convert best)
- Customer acquisition funnel (leads → trials → customers)
- Cohort analysis (leads acquired in Jan perform better than Feb)

#### Export Capabilities
- PDF reports (branded with company logo)
- CSV exports (for Excel analysis)
- Email scheduling (auto-send report every Monday 8am)

**API Endpoints:**
- `GET /api/marketing/analytics/metrics` - All metrics
- `GET /api/marketing/analytics/roi` - ROI by channel
- `GET /api/marketing/analytics/funnel` - Conversion funnel
- `POST /api/marketing/analytics/reports/:id/send` - Email report

---

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│               Apex Admin Dashboard (Next.js)            │
│         (React components + Zustand state)              │
└────────────────┬────────────────────────────────────────┘
                 │ REST API calls
                 ↓
┌─────────────────────────────────────────────────────────┐
│           Apex Backend API Routes (Next.js)             │
│        (API aggregation + authentication layer)         │
│                                                          │
│  /api/marketing/campaigns     (Mautic wrapper)          │
│  /api/marketing/emails        (ListMonk wrapper)        │
│  /api/marketing/social        (Postiz wrapper)          │
│  /api/marketing/analytics     (Matomo wrapper)          │
│  /api/webhooks/mautic         (Receive events)          │
│  /api/webhooks/listmonk       (Receive events)          │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP calls
                 ↓
┌─────────────────────────────────────────────────────────┐
│         Docker Containers (Marketing Tools)             │
│                                                          │
│  Mautic (8000)      CRM + Email Automation              │
│  ListMonk (9000)    Email Delivery Engine               │
│  Postiz (3000)      Social Media Scheduler              │
│  Matomo (8080)      Analytics & Tracking                │
└────────────────┬────────────────────────────────────────┘
                 │ Shared database connection
                 ↓
┌─────────────────────────────────────────────────────────┐
│     Shared PostgreSQL Database (Neon/local)             │
│                                                          │
│  ├─ campaigns                                           │
│  ├─ leads                                               │
│  ├─ email_events                                        │
│  ├─ email_lists                                         │
│  ├─ social_posts                                        │
│  ├─ analytics_events                                    │
│  └─ ...                                                 │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Deployment Architecture

**Development Environment:**
```bash
docker-compose up
# Starts all 4 tools locally on:
# - Mautic: http://localhost:8000
# - ListMonk: http://localhost:9000
# - Postiz: http://localhost:3000
# - Matomo: http://localhost:8080
# - PostgreSQL: localhost:5432
```

**Production Environment:**
```
VPS Deployment (72.61.197.178)
  ├─ Docker Compose (all marketing tools + PostgreSQL)
  ├─ Nginx (reverse proxy)
  └─ SSL/TLS (Let's Encrypt)

Apex Frontend
  ├─ Vercel (Next.js app)
  └─ Clerk Auth (session management)
```

### 4.3 Data Flow

**Real-Time Event Flow:**

```
User Action (Email Open)
  ↓
ListMonk detects open
  ↓
ListMonk webhook POST to /api/webhooks/listmonk
  ↓
Apex inserts event to PostgreSQL (email_events table)
  ↓
Dashboard queries email_events (cached, 5-min refresh)
  ↓
Dashboard shows updated open rate to marketing manager
```

**Batch Sync Flow:**

```
Every 5 minutes:
  ├─ Dashboard calls /api/marketing/campaigns
  │    ├─ Apex API authenticates with Mautic
  │    ├─ Fetches active campaigns + stats
  │    └─ Returns aggregated data
  │
  ├─ Dashboard calls /api/marketing/emails
  │    ├─ Apex API authenticates with ListMonk
  │    ├─ Fetches list stats + recent events
  │    └─ Returns aggregated data
  │
  ├─ Dashboard calls /api/marketing/social
  │    ├─ Apex API authenticates with Postiz
  │    ├─ Fetches scheduled posts + engagement
  │    └─ Returns aggregated data
  │
  └─ Dashboard calls /api/marketing/analytics
       ├─ Apex API authenticates with Matomo
       ├─ Fetches visitor + conversion data
       └─ Returns aggregated data
```

### 4.4 Integration Points

**Authentication:**
- Clerk handles Apex user authentication
- Each tool (Mautic, ListMonk, Postiz, Matomo) uses API authentication
- Apex backend securely stores and uses tool credentials

**White-Label Configuration:**
- Organization ID determines which Mautic account, ListMonk account, etc.
- Each org has isolated email lists, campaigns, social accounts
- Row-level security (RLS) in PostgreSQL prevents cross-org data leakage

**Data Isolation:**
- PostgreSQL schema includes `organization_id` on all tables
- Queries always filter by `organization_id`
- No org can see another org's campaigns, leads, or events

---

## 5. Implementation Roadmap

### 5.1 Phase 1: Foundation (Weeks 1-2, R66K)

**Deliverables:**
- Docker Compose setup with all 4 tools
- PostgreSQL schema for marketing data
- Basic API wrappers for each tool
- Authentication with each tool configured

**Tasks:**
- [ ] Deploy Mautic (self-hosted)
- [ ] Deploy ListMonk (self-hosted)
- [ ] Deploy Postiz (self-hosted)
- [ ] Deploy Matomo (self-hosted)
- [ ] Create PostgreSQL schema
- [ ] Write Mautic API wrapper
- [ ] Write ListMonk API wrapper
- [ ] Write Postiz API wrapper
- [ ] Write Matomo API wrapper
- [ ] Configure tool credentials (securely stored)

**Team:** 1 backend engineer (40 hours)
**Budget:** R22K spend on infrastructure

### 5.2 Phase 2: Dashboard MVP (Weeks 3-4, R105K)

**Deliverables:**
- Marketing dashboard component (overview tab)
- Real-time metrics aggregation
- Basic campaign list view
- Email list view
- Social post scheduler
- Analytics dashboard

**Tasks:**
- [ ] Build MarketingDashboard component
- [ ] Implement data aggregation logic
- [ ] Add 5-minute refresh cycle
- [ ] Build campaigns tab
- [ ] Build email tab
- [ ] Build social media tab
- [ ] Build analytics tab
- [ ] Add export functionality (CSV)
- [ ] Create mobile-responsive design

**Team:** 1 frontend engineer + 1 backend engineer (80 hours)
**Budget:** R30K spend on infrastructure + team hours

### 5.3 Phase 3: Campaign Builder (Weeks 5-8, R105K)

**Deliverables:**
- Email campaign creation wizard
- Template builder (WYSIWYG editor)
- Lead segmentation interface
- A/B test setup
- Campaign performance analytics

**Tasks:**
- [ ] Build campaign creation modal
- [ ] Implement WYSIWYG email template editor
- [ ] Build lead segmentation UI
- [ ] Implement A/B test split logic
- [ ] Add performance tracking dashboard
- [ ] Create campaign management (edit/delete)
- [ ] Add campaign history and reporting

**Team:** 1 frontend engineer + 1 backend engineer (120 hours)
**Budget:** R40K spend on infrastructure + team hours

### 5.4 Phase 4: Email Sequences (Weeks 9-12, Part of R105K + extra R100K)

**Deliverables:**
- Pre-built sequence templates (7 templates)
- Sequence enrollment workflows
- Trigger-based automation
- Personalization token support
- Sequence analytics

**Tasks:**
- [ ] Create 7 sequence templates (copy + structure)
- [ ] Build sequence activation UI
- [ ] Implement lead enrollment logic
- [ ] Add trigger conditions (new lead, tag, engagement)
- [ ] Implement personalization tokens
- [ ] Add conditional branching (if opened → next email)
- [ ] Create sequence performance dashboard

**Team:** 1 backend engineer + 1 marketing specialist (100 hours)
**Budget:** R50K spend + team hours

### 5.5 Phase 5: Social Media Management (Weeks 13-16, R50K)

**Deliverables:**
- Content calendar (monthly view)
- Multi-platform post scheduling
- Platform-specific formatting
- Engagement analytics
- Bulk upload (CSV)

**Tasks:**
- [ ] Build content calendar component
- [ ] Implement multi-platform scheduling
- [ ] Add platform-specific preview
- [ ] Build bulk upload (CSV)
- [ ] Add engagement tracking
- [ ] Create performance analytics
- [ ] Implement post templates

**Team:** 1 frontend engineer + 1 backend engineer (80 hours)
**Budget:** R25K spend

### 5.6 Phase 6: Analytics & Reporting (Weeks 17-20, R50K)

**Deliverables:**
- Unified metrics dashboard
- ROI tracking by channel
- Custom report builder
- Email report scheduling
- Export capabilities

**Tasks:**
- [ ] Build unified metrics dashboard
- [ ] Implement ROI calculation logic
- [ ] Create custom report builder
- [ ] Add report scheduling (auto-email)
- [ ] Implement CSV/PDF export
- [ ] Create cohort analysis view
- [ ] Add funnel visualization

**Team:** 1 backend engineer + 1 data analyst (100 hours)
**Budget:** R30K spend

### 5.7 Phase 7: Lead Management & Automation (Weeks 21-26, R80K)

**Deliverables:**
- Lead scoring system
- Kanban pipeline view
- Automated lead workflows
- Lead enrichment
- Sales team integration

**Tasks:**
- [ ] Implement lead scoring algorithm
- [ ] Build Kanban board component
- [ ] Create workflow automation engine
- [ ] Add lead enrichment logic
- [ ] Integrate with Slack/Teams (send alerts)
- [ ] Build lead profile detail view
- [ ] Create lead bulk actions

**Team:** 1 backend engineer + 1 frontend engineer (120 hours)
**Budget:** R50K spend

---

## 6. Success Metrics & KPIs

### 6.1 Product Metrics

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Dashboard Availability | 99.9% | Uptime monitoring (Sentry) | Daily |
| API Response Time | <500ms | APM (New Relic) | Daily |
| Data Sync Latency | <5 minutes | Event timestamp vs sync time | Daily |
| User Adoption | 80% of users | Active users / total users | Weekly |
| Feature Usage | 70% of features | Feature events tracked | Weekly |

### 6.2 Business Metrics

| Metric | Target | How It's Measured | Frequency |
|--------|--------|------------------|-----------|
| Revenue per Customer | +25% | (MRR / customer count) | Monthly |
| Marketing Cost Savings | 65-72% | Tool cost comparison | Monthly |
| Campaign Performance ROI | 3.1x Year 1 | (Revenue / Marketing Spend) | Monthly |
| Customer Acquisition Cost (CAC) | <R1,500 | (Marketing Spend / New Customers) | Monthly |
| Customer Lifetime Value (LTV) | >R50K | Average customer revenue * retention | Monthly |
| Email Campaign Open Rate | 35-40% | Mautic email stats | Per campaign |
| Email Click Rate | 5-8% | Mautic email stats | Per campaign |
| Social Media Engagement | >3% | (Likes+Comments+Shares) / reach | Per post |

### 6.3 User Experience Metrics

| Metric | Target | How It's Measured | Frequency |
|--------|--------|------------------|-----------|
| Time to Create Campaign | <10 minutes | User observation / analytics | Weekly |
| Onboarding Completion | >90% | Users who create first campaign | Weekly |
| Feature Discovery | 80% | Users who use 6+ features | Monthly |
| Customer Satisfaction (NPS) | >50 | NPS survey | Quarterly |
| Churn Rate | <5%/month | (Churned customers / starting customers) | Monthly |

---

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Tool API rate limits | Medium | Data sync delays | Implement caching, queue system |
| Data sync failures | Low | Stale metrics | Retry logic, webhook monitoring |
| PostgreSQL performance | Low | Dashboard slowness | Query optimization, indexing |
| Tool outages | Low | Feature unavailability | Status page, graceful degradation |

### 7.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Low adoption | Medium | Low ROI | User training, clear onboarding |
| Competitive response | Medium | Price pressure | Patent recommendations engine |
| Integration complexity | Medium | Delayed launch | Phased rollout, MVP first |
| Data privacy concerns | Low | Legal liability | GDPR compliance, data encryption |

### 7.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Tool license changes | Medium | Legal compliance | Monitor AGPL changes, legal review |
| Tool abandonment | Low | Support gaps | Maintain fork, in-house support |
| Infrastructure costs | Medium | Budget overrun | Monitor resource usage, scaling limits |

---

## 8. Resource Requirements

### 8.1 Team Composition

**Phase 1-2 (Weeks 1-4):**
- 1x Backend Engineer (full-time, R50K/month)
- 0.5x DevOps Engineer (part-time, design infrastructure)

**Phase 3-7 (Weeks 5-26):**
- 1x Backend Engineer (full-time)
- 1x Frontend Engineer (full-time)
- 1x Product Manager (0.5 FTE, oversight)
- 1x QA Engineer (0.5 FTE, testing)
- 1x Marketing Specialist (0.5 FTE, content/sequences)

**Total Effort:** 880 hours (22 weeks × 40 hours)

### 8.2 Infrastructure Costs

**Development:**
- PostgreSQL (local): Free
- Mautic (Docker): Free
- ListMonk (Docker): Free
- Postiz (Docker): Free
- Matomo (Docker): Free

**Production:**
- VPS (72.61.197.178): R1,200/month
- PostgreSQL (Neon): R500-1,000/month
- Monitoring (Sentry): R500/month
- **Total: R2,200-2,700/month**

**Comparison:**
- SaaS Alternatives: R3,500-10,000/month
- **Savings: 65-72% vs SaaS**

---

## 9. Acceptance Criteria

### Phase 1 Acceptance Criteria
- [ ] All 4 tools deployed and running on production VPS
- [ ] Database schema created and tested
- [ ] API wrappers authenticate successfully with each tool
- [ ] Webhook endpoints receive test events

### Phase 2 Acceptance Criteria
- [ ] Dashboard displays real-time metrics for all tools
- [ ] Data refreshes every 5 minutes without manual intervention
- [ ] Export to CSV works without errors
- [ ] Mobile responsive design verified on iPhone/iPad
- [ ] Performance: Dashboard loads in <3 seconds

### Phase 3 Acceptance Criteria
- [ ] Campaign creation wizard completes in <5 clicks
- [ ] Email preview shows correct rendering
- [ ] A/B test can be created and launched
- [ ] Campaign performance updates in real-time
- [ ] Campaigns can be edited/paused/deleted

### Phase 4 Acceptance Criteria
- [ ] 7 pre-built sequences are available
- [ ] Leads can be enrolled in sequences
- [ ] Personalization tokens are replaced correctly
- [ ] Trigger conditions work (new lead → enroll)
- [ ] Sequence analytics show engagement metrics

### Phase 5 Acceptance Criteria
- [ ] Posts can be scheduled to 5+ platforms
- [ ] Content calendar shows all scheduled posts
- [ ] Engagement metrics update daily
- [ ] Bulk upload (CSV) works for 100+ posts
- [ ] Post can be edited before publishing

### Phase 6 Acceptance Criteria
- [ ] Dashboard shows all 15+ key metrics
- [ ] ROI calculation is accurate by channel
- [ ] Reports can be generated and exported
- [ ] Email scheduling works for auto-send
- [ ] Cohort analysis shows lead quality differences

### Phase 7 Acceptance Criteria
- [ ] Lead scores update in real-time
- [ ] Kanban board shows all lead stages
- [ ] Leads move between stages via drag-and-drop
- [ ] Automated workflows trigger correctly
- [ ] Slack alerts send when lead becomes MQL

---

## 10. Success Stories (Post-Launch)

### Expected Outcomes (Month 1)
- Onboard first 5 customers with marketing integration
- Generate first email campaign (500+ leads)
- Demonstrate +3% trial conversion rate
- Save first customer R2.5K/month on marketing tools

### Expected Outcomes (Month 3)
- 50+ customers using marketing dashboard
- +30% revenue from marketing upsell
- Email campaigns generating +R780K in revenue
- CAC reduced to R1,200 (20% improvement)

### Expected Outcomes (Month 6)
- 200+ customers with marketing integration
- Marketing services = 30% of total revenue
- ROI proven: 3.1x on marketing spend
- Net promoter score (NPS) > 50

---

## 11. Go-To-Market Plan

### 11.1 Sales Enablement
- Train sales team on new marketing features
- Create 5-minute demo video showing dashboard
- Develop case study: "How [Customer] Got 3.1x ROI"
- Update sales deck with marketing ROI proof

### 11.2 Customer Onboarding
- Create onboarding video series (5 videos, 20 min total)
- Pre-populate 7 email sequences (with white-label branding)
- Set up Slack bot to help with common questions
- Assign dedicated CSM for first 30 days

### 11.3 Marketing Strategy
- Blog post: "The Open-Source Marketing Stack" (SEO)
- LinkedIn series: "Integrated Marketing in Apex" (3 posts)
- Webinar: "Marketing Automation for SMBs" (Lead gen)
- YouTube: "Dashboard Tour" (Product demo)

### 11.4 Pricing Strategy
- **Base Plan:** Apex platform + basic marketing (5 email campaigns/month) = R500
- **Growth Plan:** Unlimited campaigns + social scheduling + analytics = R1,500
- **Enterprise Plan:** Everything + lead scoring + workflows + API access = R3,500

**Projected Impact:**
- +R250K MRR by Month 6
- +200 customers by Year End
- +R3M Annual Revenue from marketing upsell

---

## 12. Document Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | [TBD] | 2026-01-14 | ___ |
| Engineering Lead | [TBD] | 2026-01-14 | ___ |
| Finance/CFO | [TBD] | 2026-01-14 | ___ |
| CEO/Founder | [TBD] | 2026-01-14 | ___ |

---

## 13. Appendix: Reference Documents

**Related Documents:**
- `INTEGRATED_MARKETING_SALES_WORKFLOW.md` - Detailed workflow guide
- `OPEN_SOURCE_INTEGRATION_ARCHITECTURE.md` - Technical implementation guide
- `MARKETING_RESEARCH_EXECUTIVE_SUMMARY.md` - Strategic overview
- `APEX_DESIGN_SYSTEM.md` - UI/UX specifications
- `app_spec.txt` - Full Apex platform specification

**External References:**
- Mautic Docs: https://www.mautic.org/docs
- ListMonk Docs: https://listmonk.app/docs
- Postiz Docs: https://postiz.com/docs
- Matomo Docs: https://matomo.org/docs

---

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-14 | PAI | Initial PRD creation |

