# APEX CUSTOMER DASHBOARD PRD v1.0
## PRD-CUSTOMER-011: Customer-Facing GEO/AEO Platform

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**System**: Customer-Facing Dashboard (Separate from Admin Operations)
**Scope**: Brand monitoring, content creation, auditing, recommendations across AI platforms

---

## 1. EXECUTIVE SUMMARY

The Apex Customer Dashboard is a white-label GEO/AEO (Generative Engine Optimization / Answer Engine Optimization) platform that enables brands to monitor, optimize, and improve their visibility across AI-powered search engines like ChatGPT, Claude, Gemini, Perplexity, Grok, and DeepSeek.

**Core Capabilities**:
- **MONITOR** - Track brand mentions across 7+ AI platforms in real-time
- **CREATE** - Generate AI-optimized content using brand voice and data
- **AUDIT** - Comprehensive technical site analysis for AI visibility
- **SMART RECOMMENDATIONS ENGINE** - Auto-generated, prioritized actionable recommendations

**Key Differentiator**: Dashboard-first UI with Smart Recommendations Engine (not chat-based)

**Target Market**: South African businesses initially, expanding to African markets with PPP-adjusted pricing

**Implemented Features**: 46 customer dashboard pages across 19 modules

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Brands cannot track their visibility across AI platforms (ChatGPT, Claude, Gemini, etc.)
- No way to measure "share of answer" when AI engines respond to user queries
- Technical SEO tools don't account for AI-specific optimization needs
- Content creation doesn't consider AI platform preferences and citation patterns
- Manual monitoring across 7+ platforms is time-consuming and inconsistent

### 2.2 Business Goals
1. Enable brands to track mentions across all major AI platforms
2. Provide actionable recommendations to improve AI visibility
3. Generate AI-optimized content that increases citation rates
4. Deliver comprehensive technical audits for GEO/AEO compliance
5. White-label solution for agencies and enterprises

### 2.3 Key Metrics
- **Share of Answer**: % of AI responses that mention the brand
- **GEO Score**: Overall Generative Engine Optimization score (0-100)
- **Unified Score**: Combined SEO + GEO + AEO performance (0-100)
- **Citation Rate**: % of mentions that include links to brand content
- **Platform Coverage**: Number of AI platforms actively monitored
- **Recommendation Completion Rate**: % of recommendations implemented

---

## 3. TARGET USERS

| User Type | Primary Use Case | Key Features |
|-----------|------------------|--------------|
| **Brand Manager** | Monitor brand presence across AI platforms | Dashboard, Monitoring, Analytics |
| **Content Marketer** | Create AI-optimized content | Content Creation, Recommendations |
| **SEO Specialist** | Technical optimization for AI visibility | Audit, Schema Analysis, Technical Recommendations |
| **Agency Owner** | White-label platform for client management | Multi-brand management, Portfolio view |
| **Executive** | High-level visibility and ROI tracking | Dashboard, Analytics, Reports |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- **Dashboard**: Main overview with onboarding, GEO score, unified score, platform metrics
- **Monitoring**: Real-time brand mention tracking across 7+ AI platforms
- **Content Creation**: AI-powered content generation with brand voice
- **Auditing**: Technical site analysis, schema validation, content gap analysis
- **Recommendations**: Smart recommendation engine with priority scoring
- **Brand Management**: Multi-brand support with portfolio view
- **Analytics**: Platform performance, trends, citation analysis
- **Reports**: Exportable reports and insights
- **Settings**: Brand configuration, team management, integrations

### 4.2 Out of Scope
- Social media monitoring (separate from AI platforms)
- Traditional SEO rank tracking (focus is on AI platforms)
- Ad campaign management
- Email marketing automation

### 4.3 Constraints
- White-label architecture: No hardcoded brand names or logos
- Multi-tenant isolation: Complete data separation per organization
- AI platform rate limits: Must respect API quotas for ChatGPT, Claude, etc.
- Scraping limitations: Playwright headless browser for platforms without APIs
- Real-time updates: WebSocket connections for live mention notifications

---

## 5. DETAILED REQUIREMENTS

### 5.1 Dashboard Module (Main Overview)

**Path**: `/dashboard`

**Purpose**: Central hub showing onboarding progress, key metrics, and quick actions

**Layout**:
```
┌─ Empty State (No Brands) ──────────────────────┐
│ Hero: "Let's optimize your AI visibility"       │
│ Progress Ring: Onboarding completion (0-100%)   │
│                                                  │
│ Onboarding Steps (4 cards):                     │
│ 1. Add Your Brand                               │
│ 2. Configure Monitoring                         │
│ 3. Run Your First Audit                         │
│ 4. Review Recommendations                       │
│                                                  │
│ What You'll Track:                              │
│ - Share of Answer                               │
│ - Trust Score                                   │
│ - Smart Recommendations                         │
│                                                  │
│ AI Platforms: ChatGPT, Claude, Gemini, etc.    │
└──────────────────────────────────────────────────┘

┌─ Active Dashboard (Brand Selected) ─────────────┐
│ Header: Dashboard | Refresh Data                 │
│                                                  │
│ Key Metrics (4 cards):                          │
│ - Unified Score: 78 (overall performance)       │
│ - GEO Score: 82 (geographic performance)        │
│ - Mentions: 2,847 (across all platforms)       │
│ - Trend: +12% (month over month)               │
│                                                  │
│ Charts:                                         │
│ - Unified Score Gauge (SEO + GEO + AEO)        │
│ - Platform Performance (7 platforms)            │
│ - Score Trend (historical)                      │
│                                                  │
│ Quick Actions:                                  │
│ - Edit Keywords                                 │
│ - Run Audit                                     │
│ - View Recommendations                          │
│                                                  │
│ Emerging Opportunities (data-driven)            │
└──────────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/dashboard/metrics?brandId={id}` - Key metrics
- `GET /api/dashboard/geo-score?brandId={id}` - GEO score
- `GET /api/dashboard/unified-score?brandId={id}` - Unified score with breakdown
- `GET /api/onboarding/progress` - Onboarding status

**Key Features**:
- Animated background orbs and particle grid
- Progress ring with gradient
- Real-time metric updates via SWR
- Empty state with onboarding wizard
- Platform performance bars
- Score trend visualization

---

### 5.2 Monitoring Module

**Paths**:
- `/dashboard/monitor` - Main monitoring dashboard
- `/dashboard/monitor/mentions` - Detailed mentions list
- `/dashboard/monitor/analytics` - Platform analytics
- `/dashboard/monitor/analytics/citations` - Citation analysis

**Purpose**: Track brand mentions across AI platforms in real-time

**Main Monitoring Page**:
```
┌─ Monitor Dashboard ────────────────────────────┐
│ Header: Brand Monitoring                        │
│ Filter Sidebar:                                 │
│ - Tracked Topics                                │
│ - Entity Types                                  │
│ - AI Engines (7 platforms)                     │
│                                                 │
│ Smart Table (Mentions):                        │
│ ID | Query | Platform | Sentiment | Citation   │
│ ───┼───────┼──────────┼───────────┼──────────  │
│ 001| "Best CRM" | ChatGPT | Positive | Cited   │
│ 002| "Project mgmt" | Claude | Neutral | Mentioned│
│ 003| "Task tracking" | Gemini | Positive | Not Cited│
│                                                 │
│ Real-time updates via WebSocket                 │
└──────────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitor/mentions?brandId={id}` - All mentions
- `GET /api/monitor/mentions/{id}` - Mention detail
- `GET /api/monitor/analytics?brandId={id}` - Platform analytics
- `GET /api/monitor/citations?brandId={id}` - Citation analysis
- `WebSocket /api/ws/mentions` - Real-time mention notifications

**Key Features**:
- Filter by platform, sentiment, citation status
- Real-time mention updates (WebSocket)
- Sentiment analysis (positive, neutral, negative)
- Citation tracking (cited, mentioned, not cited)
- Competitor mentions
- Query-level insights

---

### 5.3 Content Creation Module

**Paths**:
- `/dashboard/create` - Content creation hub
- `/dashboard/create/new` - New content wizard
- `/dashboard/create/brief` - Content brief editor
- `/dashboard/create/generate` - AI generation interface

**Purpose**: Generate AI-optimized content using brand voice and data

**Content Creation Workflow**:
```
┌─ Create Content ───────────────────────────────┐
│ Step 1: Select Content Type                     │
│ - Blog Post                                     │
│ - FAQ Page                                      │
│ - Product Description                           │
│ - How-To Guide                                  │
│ - Case Study                                    │
│                                                 │
│ Step 2: Provide Brief                          │
│ - Topic: [____________]                        │
│ - Target Keywords: [____________]              │
│ - AI Platforms: [ChatGPT, Claude, ...]        │
│ - Brand Voice: [Professional, Casual, ...]     │
│                                                 │
│ Step 3: Generate Content                       │
│ AI-powered generation using Claude/GPT-4       │
│ - Schema markup optimization                    │
│ - Citation-friendly structure                   │
│ - Question-answer format                        │
│ - Entity mentions                               │
│                                                 │
│ Step 4: Review & Publish                       │
│ - Edit generated content                        │
│ - Preview schema markup                         │
│ - Export (Markdown, HTML, JSON-LD)            │
└──────────────────────────────────────────────────┘
```

**API Endpoints**:
- `POST /api/content/generate` - Generate content
- `GET /api/content/templates` - Content templates
- `POST /api/content/brief` - Save content brief
- `GET /api/content/history` - Content generation history

**Key Features**:
- AI-powered content generation (Claude API)
- Brand voice customization
- Schema markup automation
- Citation-friendly formatting
- Multi-platform optimization
- Export to multiple formats

---

### 5.4 Audit Module

**Paths**:
- `/dashboard/audit` - Audit dashboard
- `/dashboard/audit/results` - Latest audit results
- `/dashboard/audit/history` - Audit history

**Purpose**: Comprehensive technical site analysis for AI visibility

**Audit Dashboard**:
```
┌─ Site Audit ───────────────────────────────────┐
│ GEO Score: 82/100                               │
│ Technical: 85 | Content: 78 | AEO: 84          │
│                                                 │
│ Audit Categories:                               │
│                                                 │
│ ✅ Schema Markup (92/100)                      │
│    ✓ Organization schema present               │
│    ✓ FAQPage schema present                    │
│    ⚠ Article schema missing                    │
│                                                 │
│ ⚠ Content Gaps (68/100)                       │
│    ⚠ 12 high-opportunity topics not covered    │
│    ⚠ Competitor coverage 40% higher            │
│                                                 │
│ ✅ Language & Voice (95/100)                   │
│    ✓ Natural language optimization             │
│    ✓ Question format optimization              │
│                                                 │
│ ⚠ Technical (78/100)                           │
│    ✓ Mobile-friendly                            │
│    ⚠ Page speed could be improved              │
│                                                 │
│ [Run New Audit] [Schedule Recurring]           │
└──────────────────────────────────────────────────┘
```

**Audit Types**:
1. **Schema Audit**: Validates structured data markup
2. **Content Gap Analysis**: Identifies missing topic coverage
3. **Language Optimization**: Checks natural language and voice search readiness
4. **Technical Audit**: Site speed, mobile-friendliness, crawlability
5. **Competitor Analysis**: Compares brand against competitors

**API Endpoints**:
- `POST /api/audit/run?brandId={id}` - Run new audit
- `GET /api/audit/results?brandId={id}` - Latest results
- `GET /api/audit/history?brandId={id}` - Audit history
- `GET /api/audit/schema?url={url}` - Schema validation
- `GET /api/audit/content-gaps?brandId={id}` - Content gap analysis

**Key Features**:
- Automated technical audits
- Schema markup validation
- Content gap identification
- Competitor comparison
- Historical tracking
- Scheduled recurring audits

---

### 5.5 Recommendations Module

**Path**: `/dashboard/recommendations`

**Purpose**: Smart recommendation engine with priority scoring and actionable insights

**Recommendations Dashboard**:
```
┌─ Smart Recommendations ────────────────────────┐
│ Priority Filter: [All | Critical | High | ...]  │
│ Status Filter: [All | Pending | In Progress]    │
│                                                  │
│ Recommendation Cards:                            │
│                                                  │
│ ┌─ Critical Priority ──────────────────────┐    │
│ │ 🔴 Add FAQPage Schema to Support Pages    │    │
│ │ Impact: High | Effort: Low | Score: 92     │    │
│ │                                            │    │
│ │ Problem:                                   │    │
│ │ Support pages lack FAQPage schema markup,  │    │
│ │ reducing AI citation likelihood by 42%.    │    │
│ │                                            │    │
│ │ Solution:                                  │    │
│ │ Implement FAQPage schema on 8 support     │    │
│ │ pages. Code template provided.             │    │
│ │                                            │    │
│ │ Evidence:                                  │    │
│ │ - Competitors with FAQ schema: 78% cited   │    │
│ │ - Your pages without schema: 36% cited     │    │
│ │                                            │    │
│ │ [Mark In Progress] [Assign] [Dismiss]     │    │
│ └───────────────────────────────────────────┘    │
│                                                  │
│ ┌─ High Priority ──────────────────────────┐    │
│ │ 🟡 Create Content: "Project Management"   │    │
│ │ Impact: Medium | Effort: Medium | Score: 78│   │
│ │ ...                                        │    │
│ └───────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

**Recommendation Types**:
- **Content Gap**: Missing topics with high opportunity scores
- **Schema Audit**: Missing or invalid structured data
- **Language Optimization**: Natural language and voice search improvements
- **Voice Search**: Query-based optimization for conversational AI
- **Technical**: Site speed, mobile, crawlability issues

**Priority Scoring Algorithm**:
```typescript
priorityScore = (
  impact * 0.4 +
  confidence * 0.3 +
  competitorGap * 0.2 +
  easOfImplementation * 0.1
) * 100
```

**API Endpoints**:
- `GET /api/recommendations?brandId={id}` - All recommendations
- `GET /api/recommendations/{id}` - Recommendation detail
- `POST /api/recommendations` - Create recommendation
- `PUT /api/recommendations/{id}` - Update status
- `POST /api/recommendations/{id}/assign` - Assign to team member
- `DELETE /api/recommendations/{id}` - Dismiss recommendation

**Key Features**:
- Auto-generated recommendations from audit data
- Priority scoring (0-100)
- Impact and effort estimates
- Evidence-based suggestions
- Task assignment
- Status tracking (pending, in progress, completed, dismissed)
- Integration with project management tools (Jira, Linear, Trello)

---

### 5.6 Brand Management Module

**Paths**:
- `/dashboard/brands` - Brand list
- `/dashboard/brands/new` - Create new brand
- `/dashboard/brands/[id]` - Brand detail
- `/dashboard/brands/[id]/edit` - Edit brand settings

**Purpose**: Multi-brand management with white-label configuration

**Brand List**:
```
┌─ Brand Management ─────────────────────────────┐
│ [+ Add New Brand]                               │
│                                                 │
│ Brand Cards (Grid):                            │
│                                                 │
│ ┌─ Acme Corp ──────────────────────────┐       │
│ │ GEO Score: 82 | Mentions: 2,847       │       │
│ │ Last Audit: 2 days ago                │       │
│ │ Status: Active                         │       │
│ │                                        │       │
│ │ [View Dashboard] [Edit] [Archive]     │       │
│ └────────────────────────────────────────┘       │
│                                                 │
│ ┌─ TechStart Inc ──────────────────────┐       │
│ │ GEO Score: 75 | Mentions: 1,234       │       │
│ │ Last Audit: 5 days ago                │       │
│ │ Status: Active                         │       │
│ │ [View Dashboard] [Edit] [Archive]     │       │
│ └────────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘
```

**Brand Configuration**:
- Brand name and logo
- Website URL
- Industry and category
- Target keywords
- Competitor tracking
- AI platform preferences
- Monitoring frequency
- Custom branding (white-label)

**API Endpoints**:
- `GET /api/brands` - List brands for organization
- `POST /api/brands` - Create new brand
- `GET /api/brands/{id}` - Brand detail
- `PUT /api/brands/{id}` - Update brand
- `DELETE /api/brands/{id}` - Archive brand

---

### 5.7 Analytics Module

**Path**: `/dashboard/analytics`

**Purpose**: Detailed analytics and insights on AI platform performance

**Analytics Dashboard**:
```
┌─ Analytics ────────────────────────────────────┐
│ Time Range: [7d | 30d | 90d | Custom]          │
│                                                 │
│ Platform Performance:                           │
│ ┌─────────────────────────────────────┐        │
│ │ ChatGPT:  ████████████ 45% (1,280) │        │
│ │ Claude:   ███████ 22% (627)         │        │
│ │ Gemini:   ██████ 18% (513)          │        │
│ │ Perplexity: ████ 10% (285)          │        │
│ │ Other:    █ 5% (142)                │        │
│ └─────────────────────────────────────┘        │
│                                                 │
│ Citation Analysis:                              │
│ - Cited: 42% (1,196 mentions)                  │
│ - Mentioned: 38% (1,082 mentions)              │
│ - Not Cited: 20% (569 mentions)                │
│                                                 │
│ Sentiment Breakdown:                            │
│ - Positive: 58%                                │
│ - Neutral: 35%                                 │
│ - Negative: 7%                                 │
│                                                 │
│ Trend Chart (30 days):                         │
│ [Line chart showing mentions over time]         │
└──────────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/analytics/overview?brandId={id}&timeRange={range}` - Overview metrics
- `GET /api/analytics/platforms?brandId={id}` - Platform breakdown
- `GET /api/analytics/citations?brandId={id}` - Citation analysis
- `GET /api/analytics/sentiment?brandId={id}` - Sentiment breakdown
- `GET /api/analytics/trends?brandId={id}&metric={metric}` - Trend data

---

### 5.8 Additional Modules

**Competitive Intelligence** (`/dashboard/competitive`):
- Competitor mention tracking
- Share of voice comparison
- Competitive gap analysis

**Insights** (`/dashboard/insights`):
- AI-generated insights from data
- Emerging opportunities
- Anomaly detection

**Reports** (`/dashboard/reports`):
- Executive summary reports
- Platform performance reports
- Custom report builder
- Export (PDF, CSV, Excel)

**Settings** (`/dashboard/settings`):
- Organization settings
- Team management
- Integrations (Jira, Slack, Google Search Console)
- Billing and subscription
- API keys
- White-label branding

**Notifications** (`/dashboard/notifications`):
- Real-time mention alerts
- Audit completion notifications
- Recommendation updates
- Team activity feed

**Engine Room** (`/dashboard/engine-room`):
- Advanced settings
- API configuration
- Scraping job management
- Debugging tools

---

## 6. API REQUIREMENTS

### 6.1 Core Dashboard APIs

**GET `/api/dashboard/metrics`**
```typescript
Query: ?brandId={id}
Response: {
  mentions: {
    total: number
    change: number // percentage
  }
  geoScore: number
  unifiedScore: number
  platforms: Array<{
    name: string
    mentions: number
  }>
}
```

**GET `/api/dashboard/unified-score`**
```typescript
Query: ?brandId={id}
Response: {
  score: {
    overall: number // 0-100
    grade: string // A+, A, B+, etc.
    components: {
      seo: { score: number; weight: number }
      geo: { score: number; weight: number }
      aeo: { score: number; weight: number }
    }
  }
  history: Array<{
    date: string
    score: number
  }>
}
```

### 6.2 Monitoring APIs

**GET `/api/monitor/mentions`**
```typescript
Query: ?brandId={id}&platform={platform}&sentiment={sentiment}&citationStatus={status}
Response: {
  data: Array<{
    id: string
    query: string
    platform: string
    sentiment: "positive" | "neutral" | "negative"
    sentimentScore: number // 0-1
    mentioned: boolean
    citationUrl: string | null
    response: string
    tags: string[]
    createdAt: string
  }>
  pagination: { page: number; limit: number; total: number }
}
```

**WebSocket `/api/ws/mentions`**
```typescript
// Real-time mention notifications
{
  type: "new_mention" | "mention_updated"
  data: {
    id: string
    query: string
    platform: string
    sentiment: string
    mentioned: boolean
  }
}
```

### 6.3 Content Creation APIs

**POST `/api/content/generate`**
```typescript
Request: {
  brandId: string
  contentType: "blog" | "faq" | "product" | "howto" | "casestudy"
  brief: {
    topic: string
    keywords: string[]
    targetPlatforms: string[]
    brandVoice: string
    length: "short" | "medium" | "long"
  }
}
Response: {
  content: string
  schemaMarkup: object
  metadata: {
    wordCount: number
    readingTime: number
    seoScore: number
    geoScore: number
  }
}
```

### 6.4 Audit APIs

**POST `/api/audit/run`**
```typescript
Request: {
  brandId: string
  auditTypes: Array<"schema" | "content_gaps" | "language" | "technical">
}
Response: {
  auditId: string
  status: "running" | "completed" | "failed"
  estimatedTime: number // seconds
}
```

**GET `/api/audit/results/{auditId}`**
```typescript
Response: {
  auditId: string
  brandId: string
  completedAt: string
  overallScore: number
  breakdown: {
    schema: { score: number; findings: Array<Finding> }
    contentGaps: { score: number; gaps: Array<Gap> }
    language: { score: number; issues: Array<Issue> }
    technical: { score: number; issues: Array<Issue> }
  }
}
```

### 6.5 Recommendations APIs

**GET `/api/recommendations`**
```typescript
Query: ?brandId={id}&priority={priority}&status={status}
Response: {
  data: Array<{
    id: string
    type: "content_gap" | "schema_audit" | "language" | "technical"
    priority: "critical" | "high" | "medium" | "low"
    priorityScore: number // 0-100
    title: string
    description: string
    problem: string
    solution: string
    impactEstimate: string
    effortEstimate: string
    confidenceScore: number
    evidence: object
    status: "pending" | "in_progress" | "completed" | "dismissed"
    assignedTo: string | null
    createdAt: string
  }>
}
```

---

## 7. DATABASE SCHEMA

**Customer-Facing Tables** (in addition to admin operations tables):

```sql
-- Organizations (multi-tenant)
organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(100) UNIQUE,
  clerk_org_id VARCHAR(100),
  subscription_tier ENUM('free', 'starter', 'professional', 'enterprise'),
  settings JSONB, -- branding, preferences
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Brands (domains to monitor)
brands (
  id UUID PRIMARY KEY,
  organization_id UUID FK,
  name VARCHAR(255),
  domain VARCHAR(255),
  logo_url VARCHAR(500),
  industry VARCHAR(100),
  target_keywords TEXT[],
  competitors TEXT[],
  geo_score INTEGER,
  last_scanned_at TIMESTAMP,
  scan_frequency ENUM('daily', 'weekly', 'monthly'),
  status ENUM('active', 'archived'),
  created_at TIMESTAMP
)

-- AI Visibility Tests (mention tracking)
ai_visibility_tests (
  id UUID PRIMARY KEY,
  brand_id UUID FK,
  query TEXT,
  ai_platform ENUM('chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot'),
  brand_mentioned BOOLEAN,
  position INTEGER,
  response_text TEXT,
  citation_url VARCHAR(2000),
  sentiment ENUM('positive', 'neutral', 'negative'),
  sentiment_score FLOAT, -- 0-1
  competitors_mentioned JSONB,
  tags TEXT[],
  tested_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Recommendations
recommendations (
  id UUID PRIMARY KEY,
  brand_id UUID FK,
  type ENUM('content_gap', 'schema_audit', 'language', 'voice_search', 'technical'),
  priority ENUM('critical', 'high', 'medium', 'low'),
  priority_score INTEGER, -- 0-100
  title VARCHAR(500),
  description TEXT,
  problem TEXT,
  solution TEXT,
  impact_estimate VARCHAR(100),
  effort_estimate VARCHAR(100),
  confidence_score INTEGER, -- 0-100
  evidence JSONB,
  status ENUM('pending', 'in_progress', 'completed', 'dismissed'),
  assigned_to UUID FK users,
  scheduled_for DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)

-- GEO Scores
geo_scores (
  id UUID PRIMARY KEY,
  brand_id UUID FK,
  overall_score INTEGER, -- 0-100
  technical_score INTEGER,
  content_score INTEGER,
  aeo_score INTEGER,
  scan_date DATE,
  breakdown JSONB,
  created_at TIMESTAMP
)

-- Schema Audits
schema_audits (
  id UUID PRIMARY KEY,
  brand_id UUID FK,
  page_url VARCHAR(2000),
  schema_types_found TEXT[],
  schema_types_missing TEXT[],
  validation_errors JSONB,
  score INTEGER, -- 0-100
  scanned_at TIMESTAMP
)

-- Content Gaps
content_gaps (
  id UUID PRIMARY KEY,
  brand_id UUID FK,
  topic VARCHAR(500),
  search_volume INTEGER,
  competitor_coverage JSONB,
  opportunity_score INTEGER, -- 0-100
  suggested_content_type VARCHAR(100),
  languages_needed TEXT[],
  created_at TIMESTAMP
)

-- Onboarding Progress
onboarding_progress (
  id UUID PRIMARY KEY,
  organization_id UUID FK,
  brand_added BOOLEAN,
  monitoring_configured BOOLEAN,
  audit_run BOOLEAN,
  recommendations_reviewed BOOLEAN,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)
```

---

## 8. IMPLEMENTATION STATUS

### 8.1 Modules Implemented
✅ **Dashboard** - Main overview with onboarding
✅ **Monitoring** - Real-time brand mention tracking
✅ **Content Creation** - AI-powered content generation
✅ **Auditing** - Technical site analysis
✅ **Recommendations** - Smart recommendation engine
✅ **Brand Management** - Multi-brand support
✅ **Analytics** - Platform performance insights
✅ **Competitive Intelligence** - Competitor tracking
✅ **Reports** - Exportable reports
✅ **Settings** - Configuration and integrations

### 8.2 Pages Implemented
**Total Customer Pages**: 46 pages across 19 modules

**Key Pages**:
- Dashboard (main + empty state)
- Monitor (list, detail, analytics, citations)
- Create (hub, new, brief, generate)
- Audit (dashboard, results, history)
- Recommendations (list, detail)
- Brands (list, new, detail, edit)
- Analytics (overview, platforms, trends)
- Competitive (overview, competitors)
- Reports (builder, templates)
- Settings (org, team, integrations, billing)

### 8.3 Features Implemented
✅ Onboarding wizard with progress tracking
✅ Multi-brand management
✅ Real-time mention tracking (WebSocket)
✅ AI-powered content generation (Claude API)
✅ Schema markup validation
✅ Content gap analysis
✅ Smart recommendation engine with priority scoring
✅ Platform analytics (7 AI platforms)
✅ Citation tracking
✅ Sentiment analysis
✅ Competitor mention tracking
✅ White-label configuration
✅ Export to multiple formats (PDF, CSV, Excel)

---

## 9. WHITE-LABEL ARCHITECTURE

### 9.1 Branding Configuration

**Environment Variables**:
```env
NEXT_PUBLIC_BRAND_NAME="Apex"
NEXT_PUBLIC_BRAND_LOGO_URL="/logo.svg"
NEXT_PUBLIC_BRAND_FAVICON="/favicon.ico"
NEXT_PUBLIC_PRIMARY_COLOR="#00E5CC"
NEXT_PUBLIC_SECONDARY_COLOR="#8B5CF6"
NEXT_PUBLIC_SUPPORT_EMAIL="support@apex-platform.com"
NEXT_PUBLIC_DOMAIN="apex-platform.com"
```

**Database Configuration**:
- `organizations.settings.branding` - Per-tenant branding
- Custom themes stored in database
- Logo and asset uploads to S3/Cloudflare R2

**Theming System**:
- CSS variables for all colors
- Tailwind theme configuration from env/database
- Runtime theme switching support
- Dark/light mode per tenant

### 9.2 Multi-Tenancy

**Tenant Isolation**:
- Row-level security (RLS) in PostgreSQL
- Clerk organization context enforced on all queries
- Complete data separation per organization

**Subdomain Support**:
- `*.apex-platform.com` or custom domains
- Dynamic routing based on subdomain
- SSL certificates per custom domain

---

## 10. SECURITY & COMPLIANCE

- **Authentication**: Clerk with SSO, MFA, RBAC
- **Data Isolation**: Row-level security per organization
- **API Security**: Rate limiting, API key authentication
- **Data Encryption**: At-rest (PostgreSQL) and in-transit (TLS 1.3)
- **Audit Logging**: All user actions logged to `activity_log` table
- **GDPR Compliance**: Data export, deletion, consent management
- **CCPA Compliance**: Data access, deletion requests supported
- **SOC 2**: Planned certification for enterprise tier

---

## 11. TESTING STRATEGY

### 11.1 Unit Tests
- API endpoint logic
- Recommendation priority scoring algorithm
- GEO score calculation
- Content generation validation
- Schema markup validation

### 11.2 Integration Tests
- Dashboard metrics API returns correct data
- Monitoring APIs filter correctly
- WebSocket real-time updates work
- Audit runs complete successfully
- Recommendations are generated from audit data

### 11.3 E2E Tests (Playwright)
- User onboarding flow (4 steps)
- Create brand → Configure monitoring → Run audit → View recommendations
- Content generation workflow
- Multi-brand switching
- Real-time mention updates

---

## 12. ACCEPTANCE CRITERIA

**Dashboard**:
- [x] Empty state shows onboarding wizard
- [x] Onboarding progress tracked via API
- [x] Main dashboard shows key metrics
- [x] Unified score gauge displays correctly
- [x] Platform performance bars render
- [x] Real-time updates via SWR

**Monitoring**:
- [x] Mentions list filters by platform, sentiment, citation
- [x] Real-time updates via WebSocket
- [x] Mention detail shows full response
- [x] Sentiment analysis displays correctly
- [x] Citation tracking works

**Content Creation**:
- [x] Content generation wizard works
- [x] AI generates content using Claude API
- [x] Schema markup included in output
- [x] Export to multiple formats

**Auditing**:
- [x] Audit runs successfully
- [x] Results show breakdown by category
- [x] Schema validation works
- [x] Content gaps identified
- [x] Historical audits tracked

**Recommendations**:
- [x] Recommendations auto-generated from audit
- [x] Priority scoring works (0-100)
- [x] Status tracking (pending, in progress, completed)
- [x] Assignment to team members
- [x] Integration with project management tools

---

## 13. TIMELINE & DEPENDENCIES

**Customer Dashboard**: Separate development track from Admin Operations

**Dependencies**:
- Clerk authentication ✅
- PostgreSQL database with Drizzle ORM ✅
- Anthropic Claude API integration ✅
- Playwright for AI platform scraping ✅
- Redis for caching ✅
- WebSocket server for real-time updates ✅

**Blockers**: None (all features implemented)

---

## 14. OPEN QUESTIONS

1. **AI Platform API Access**: Should we use official APIs (where available) or continue with Playwright scraping?
   - **Recommendation**: Use APIs where available (OpenAI, Anthropic), scraping for others (Perplexity, Grok)

2. **Real-time Updates Frequency**: How often should we poll AI platforms for new mentions?
   - **Recommendation**: Every 15 minutes for free tier, every 5 minutes for paid tiers

3. **Content Generation Model**: Should we support GPT-4 in addition to Claude?
   - **Recommendation**: Yes, allow users to choose between Claude (default) and GPT-4

4. **White-Label Pricing**: Should agencies get volume discounts for managing multiple brands?
   - **Recommendation**: Yes, tiered pricing based on number of brands managed

---

## 15. APPENDIX

### 15.1 AI Platforms Supported

1. **ChatGPT** (OpenAI)
2. **Claude** (Anthropic)
3. **Gemini** (Google)
4. **Perplexity**
5. **Grok** (xAI)
6. **DeepSeek**
7. **Copilot** (Microsoft)

### 15.2 Priority Scoring Algorithm

```typescript
function calculatePriorityScore(
  impact: number, // 0-100
  confidence: number, // 0-100
  competitorGap: number, // 0-100
  easeOfImplementation: number // 0-100
): number {
  return Math.round(
    impact * 0.4 +
    confidence * 0.3 +
    competitorGap * 0.2 +
    easeOfImplementation * 0.1
  );
}
```

### 15.3 GEO Score Calculation

```typescript
function calculateGEOScore(
  technicalScore: number, // 0-100
  contentScore: number, // 0-100
  aeoScore: number // 0-100
): number {
  return Math.round(
    technicalScore * 0.35 +
    contentScore * 0.35 +
    aeoScore * 0.30
  );
}
```

### 15.4 Unified Score Calculation

```typescript
function calculateUnifiedScore(
  seoScore: number, // 0-100
  geoScore: number, // 0-100
  aeoScore: number // 0-100
): { overall: number; grade: string } {
  const overall = Math.round(
    seoScore * 0.30 +
    geoScore * 0.40 +
    aeoScore * 0.30
  );

  const grade =
    overall >= 95 ? "A+" :
    overall >= 90 ? "A" :
    overall >= 85 ? "A-" :
    overall >= 80 ? "B+" :
    overall >= 75 ? "B" :
    overall >= 70 ? "B-" :
    overall >= 65 ? "C+" :
    overall >= 60 ? "C" :
    "C-";

  return { overall, grade };
}
```

---

**Next PRD**: N/A (Customer-facing system complete)

**Related PRDs**:
- PRD-001 through PRD-010 (Admin Operations - separate system)
