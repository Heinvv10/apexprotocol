# PRD-001: User Deliverables & Dynamic Adaptability System

**Document Version:** 1.0
**Created:** January 13, 2026
**Last Updated:** January 13, 2026
**Status:** Approved
**Owner:** Product Team
**Implementation Timeline:** 10 weeks

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Stories](#user-stories)
5. [Functional Requirements](#functional-requirements)
6. [Technical Specifications](#technical-specifications)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [UI/UX Requirements](#uiux-requirements)
10. [Implementation Phases](#implementation-phases)
11. [Test Plan](#test-plan)
12. [Acceptance Criteria](#acceptance-criteria)
13. [Dependencies & Risks](#dependencies--risks)
14. [Appendices](#appendices)

---

## Executive Summary

### Overview
This PRD defines the implementation of a comprehensive **User Deliverables System** combined with a **Dynamic Adaptability Engine** for the Apex GEO/AEO platform. The system will transform Apex from a diagnostic tool into an indispensable, living intelligence service that users cannot operate without.

### Core Value Proposition
> **Apex = Diagnostics + Action Plans + Dynamic Intelligence**
>
> - WHERE you stand (GEO Score)
> - WHAT to do (Step-by-Step Action Plans)
> - WHEN things change (Proactive Alerts)
> - HOW to adapt (Auto-Updated Strategies)

### Key Deliverables
| # | Deliverable | Purpose | Format | Dynamic? |
|---|-------------|---------|--------|----------|
| 1 | GEO Visibility Report | Where you stand | PDF/Dashboard | Weekly updates |
| 2 | Action Plan | What to do | PDF/Checklist | Auto-updates |
| 3 | Social Media Guide | Platform-specific posting | PDF/Templates | Tracks changes |
| 4 | Developer Checklist | Technical handoff | PDF/Printable | Schema versions |
| 5 | Monthly Progress Report | ROI proof | PDF/Dashboard | Comparative |
| 6 | GEO Alerts | Proactive warnings | Dashboard/Email | Real-time |
| 7 | Knowledge Base Access | Current best practices | Dashboard | Living document |

---

## Problem Statement

### Current State Analysis

**What Apex Has Today:**

| Deliverable | Formats | Content | Step-by-Step? |
|-------------|---------|---------|---------------|
| Mentions Export | CSV/XLSX/PDF/JSON | Raw mention data | NO |
| Audits Export | CSV/XLSX/PDF | Issue summaries | NO |
| Recommendations Export | CSV/XLSX/PDF | Priority list | NO (field exists but empty) |
| Analytics Export | CSV/XLSX | Aggregated metrics | NO |
| PDF Reports | PDF | Multi-section report | NO |
| Executive Report | Database | Portfolio summary | NO |
| Email Digest | HTML | Notification alerts | NO |

### The Gap

**Problem 1: No Implementation Guidance**
Users get excellent diagnostics (WHERE they stand, WHAT the problems are) but NOT tactical implementation guides (HOW to fix them step-by-step).

The `steps` array field exists in recommendations but is:
- Never populated
- Not displayed in the UI
- Not included in exports

**Problem 2: Static Recommendations**
Traditional SEO evolved slowly over decades. GEO/AEO changes weekly. Without dynamic updates:
- Users implement recommendations that become obsolete
- They waste time on tactics that no longer work
- Competitors who adapt faster pull ahead
- GEO scores plateau or decline despite effort

| Traditional SEO | GEO/AEO Reality |
|----------------|-----------------|
| Google updates 2-3x/year | AI platforms update weekly |
| Strategies last 1-2 years | Tactics obsolete in weeks |
| Documented algorithms | Black-box AI behavior |
| Single search engine | 7+ platforms, each different |

---

## Goals & Success Metrics

### Primary Goals

| Goal | Description | Priority |
|------|-------------|----------|
| G1 | Enable users to export complete Action Plan PDFs with step-by-step instructions | P0 |
| G2 | Provide copy-paste schema code directly usable in websites | P0 |
| G3 | Deliver platform-specific social media playbooks | P1 |
| G4 | Generate exportable developer technical checklists | P1 |
| G5 | Show monthly progress with before/after comparisons | P1 |
| G6 | Proactively alert users when AI platforms change behavior | P0 |
| G7 | Auto-update recommendations based on latest platform signals | P0 |
| G8 | Version-control all deliverables with change tracking | P1 |

### Success Metrics (KPIs)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Action Plan Downloads | 0 | 500/month | Analytics |
| User Retention (90-day) | TBD | +25% | Cohort analysis |
| Time-to-First-Action | N/A | <24 hours | Event tracking |
| Alert Open Rate | N/A | >60% | Notification analytics |
| Recommendation Completion Rate | TBD | +40% | Dashboard tracking |
| NPS Score | TBD | +15 points | Survey |
| Churn Rate | TBD | -30% | Subscription data |

---

## User Stories

### Epic 1: Action Plan Generation

```
US-1.1: As a brand manager, I want to export a complete GEO action plan
        with step-by-step instructions so that I know exactly what to
        implement on my website.

US-1.2: As a marketing director, I want copy-paste schema code so that
        I can immediately hand it to my developer without modification.

US-1.3: As a business owner, I want to see the expected GEO score impact
        for each action so that I can prioritize my efforts effectively.

US-1.4: As a team lead, I want to assign actions to team members and
        track progress so that we complete all recommendations.
```

### Epic 2: Social Media Guidance

```
US-2.1: As a social media manager, I want platform-specific posting
        templates so that I can optimize our presence for each AI platform.

US-2.2: As a content creator, I want LinkedIn content templates that
        improve AI visibility so that Claude and ChatGPT cite our brand.

US-2.3: As a marketing team member, I want YouTube optimization guidance
        so that we can improve Gemini visibility.

US-2.4: As a brand strategist, I want Twitter/X posting strategies so
        that we maximize Grok visibility.
```

### Epic 3: Developer Handoff

```
US-3.1: As a marketing manager, I want a printable developer checklist
        so that I can hand technical requirements to my development team.

US-3.2: As a developer, I want validated schema code snippets so that
        I can implement them without debugging syntax errors.

US-3.3: As a technical lead, I want all schema templates to include
        validator links so that we can verify implementations.
```

### Epic 4: Progress Tracking

```
US-4.1: As a brand owner, I want monthly progress reports showing
        before/after comparisons so that I can prove ROI to stakeholders.

US-4.2: As an executive, I want to see which actions contributed most
        to GEO score improvements so that we can optimize our strategy.

US-4.3: As a team member, I want gamification (badges, streaks) for
        completing actions so that the team stays motivated.
```

### Epic 5: Dynamic Adaptability

```
US-5.1: As a subscriber, I want proactive alerts when AI platforms
        change their behavior so that I'm never caught off-guard.

US-5.2: As a brand manager, I want my action plan to auto-update when
        new best practices emerge so that I'm always using current strategies.

US-5.3: As a user, I want to see version history of my action plans
        with clear change logs so that I understand what's different.

US-5.4: As a strategist, I want deprecated tactics flagged immediately
        so that I don't waste time on obsolete approaches.

US-5.5: As a business owner, I want confidence indicators showing how
        fresh my recommendations are so that I trust the guidance.
```

---

## Functional Requirements

### FR-1: Action Plan Generator

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-1.1 | Generate step-by-step implementation guides from recommendations | P0 | Use recommendation templates |
| FR-1.2 | Include code snippets for each technical action | P0 | JSON-LD, HTML, meta tags |
| FR-1.3 | Calculate and display expected GEO score impact | P0 | Based on historical data |
| FR-1.4 | Group actions by priority (Critical/High/Medium) | P0 | Use existing priority system |
| FR-1.5 | Estimate time-to-complete for each action | P1 | Based on action complexity |
| FR-1.6 | Include verification checklist for each action | P0 | Checkbox format |
| FR-1.7 | Support PDF export with branded styling | P0 | White-label support |
| FR-1.8 | Support interactive dashboard checklist view | P1 | Track completion |

### FR-2: Schema Code Library

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-2.1 | Provide pre-built JSON-LD templates for common schemas | P0 | FAQ, Org, Article, etc. |
| FR-2.2 | Auto-fill schema templates with brand data | P0 | Name, URL, description |
| FR-2.3 | Include platform relevance scores for each schema | P1 | Which platforms benefit |
| FR-2.4 | Provide copy-to-clipboard functionality | P0 | One-click copy |
| FR-2.5 | Include validator.schema.org test links | P0 | Direct links |
| FR-2.6 | Version-control schema templates | P1 | Track Schema.org updates |

### FR-3: Social Media Guide Generator

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-3.1 | Generate LinkedIn company page optimization guide | P1 | ChatGPT/Claude focus |
| FR-3.2 | Generate LinkedIn executive visibility guide | P1 | Thought leadership |
| FR-3.3 | Generate Twitter/X optimization guide | P1 | Grok focus |
| FR-3.4 | Generate YouTube optimization guide | P1 | Gemini focus |
| FR-3.5 | Include content templates for each platform | P1 | Ready-to-use |
| FR-3.6 | Provide posting frequency recommendations | P2 | Platform-specific |

### FR-4: Developer Checklist

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-4.1 | Generate printable technical checklist | P1 | PDF format |
| FR-4.2 | Include schema markup requirements | P0 | All required schemas |
| FR-4.3 | Include technical SEO requirements | P1 | Meta, headings, speed |
| FR-4.4 | Include content structure requirements | P1 | Summaries, FAQs, TOC |
| FR-4.5 | Include crawlability requirements | P1 | Sitemap, robots.txt |
| FR-4.6 | Track checklist completion status | P2 | Dashboard integration |

### FR-5: Progress Report

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-5.1 | Generate monthly before/after comparison | P1 | GEO score delta |
| FR-5.2 | Show actions completed and their impact | P1 | Attribution |
| FR-5.3 | Show platform-by-platform breakdown | P1 | 7 platforms |
| FR-5.4 | Project next month's expected score | P2 | Based on pending actions |
| FR-5.5 | Include trend charts for key metrics | P1 | Recharts |
| FR-5.6 | Support PDF export | P1 | Branded |

### FR-6: Dynamic Knowledge Base

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-6.1 | Store platform-specific best practices | P0 | Updatable |
| FR-6.2 | Store version-controlled schema templates | P0 | With changelog |
| FR-6.3 | Store platform algorithm change history | P0 | Detection log |
| FR-6.4 | Support deprecation of outdated practices | P0 | Soft delete + reason |
| FR-6.5 | Track practice effectiveness over time | P1 | Impact scores |
| FR-6.6 | Support category-based organization | P1 | schema/content/social/technical |

### FR-7: Platform Behavior Monitoring

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-7.1 | Detect citation pattern changes | P0 | Aggregate from all users |
| FR-7.2 | Detect content preference changes | P0 | Length, format, freshness |
| FR-7.3 | Detect platform feature updates | P1 | New API capabilities |
| FR-7.4 | Calculate confidence scores for detections | P0 | 0-100% |
| FR-7.5 | Store detection history | P0 | For trend analysis |
| FR-7.6 | Trigger alerts based on thresholds | P0 | >10% change |

### FR-8: Alert System

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-8.1 | Generate alerts for algorithm changes | P0 | Platform behavior |
| FR-8.2 | Generate alerts for recommendation updates | P0 | Action plan changes |
| FR-8.3 | Generate alerts for strategy deprecation | P0 | Obsolete tactics |
| FR-8.4 | Generate alerts for new opportunities | P1 | New platform features |
| FR-8.5 | Generate alerts for competitor moves | P2 | Share of voice changes |
| FR-8.6 | Support severity levels (info/warning/critical) | P0 | Visual distinction |
| FR-8.7 | Support email delivery | P1 | Digest integration |
| FR-8.8 | Support dashboard display | P0 | Real-time |

### FR-9: Version Control System

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-9.1 | Version all action plan exports | P0 | v1.0, v1.1, etc. |
| FR-9.2 | Track changes between versions | P0 | Diff display |
| FR-9.3 | Show "what changed" summary | P0 | User-friendly |
| FR-9.4 | Support version comparison | P1 | Side-by-side |
| FR-9.5 | Track knowledge base version | P0 | 2026.01.3 format |
| FR-9.6 | Store user's last downloaded version | P1 | For comparison |

---

## Technical Specifications

### Tech Stack Alignment

| Component | Technology | Notes |
|-----------|------------|-------|
| Database | PostgreSQL (Neon) | Via Drizzle ORM |
| API | Next.js API Routes | App Router |
| PDF Generation | Existing pdf-report.ts | Extend |
| State Management | Zustand | Client state |
| Server State | TanStack Query | Caching |
| Charts | Recharts | Existing |
| Notifications | Existing system | Extend |

### New Files Required

#### Core Deliverables (Phase 1-3)
```
src/lib/reports/
├── action-plan-generator.ts      # Generate step-by-step guides
├── schema-generator.ts           # Generate JSON-LD code
└── social-guide-generator.ts     # Social media playbooks

src/components/reports/
├── action-plan-pdf.tsx           # PDF template component
├── developer-checklist.tsx       # Technical checklist
└── progress-report.tsx           # Monthly progress
```

#### Dynamic Adaptability System (Phase 4)
```
src/lib/db/schema/
└── geo-knowledge-base.ts         # New DB tables

src/lib/geo/
├── platform-monitor.ts           # Behavior detection
├── knowledge-base.ts             # CRUD operations
├── update-pipeline.ts            # Weekly updates
├── alert-generator.ts            # Generate alerts
└── version-tracker.ts            # Version control

src/app/api/geo/
├── platform-changes/route.ts     # Platform changes API
├── best-practices/route.ts       # Best practices API
└── alerts/route.ts               # Alerts API

src/components/alerts/
└── geo-alert-card.tsx            # Alert UI component

src/components/reports/
└── version-diff.tsx              # Version comparison
```

#### Files to Modify
```
src/lib/ai/recommendation-engine.ts    # Populate steps array
src/lib/reports/pdf-report.ts          # Add implementation sections
src/app/api/export/route.ts            # Include steps in exports
src/components/insights/recommendations-panel.tsx  # Step-by-step UI
src/lib/db/schema/index.ts             # Export new tables
src/lib/notifications/digest.ts        # Add GEO alert types
src/stores/insights-store.ts           # Add knowledge base state
```

---

## Database Schema

### New Tables

#### geo_best_practices
```sql
CREATE TABLE geo_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,           -- 'chatgpt', 'claude', 'gemini', etc.
  category VARCHAR(100) NOT NULL,          -- 'schema', 'content', 'social', 'technical'
  practice_title VARCHAR(255) NOT NULL,
  practice_description TEXT NOT NULL,
  implementation_steps JSONB NOT NULL,     -- Step-by-step instructions
  impact_score INTEGER NOT NULL DEFAULT 5, -- 1-10 current impact
  effort_score INTEGER NOT NULL DEFAULT 5, -- 1-10 effort required
  effective_since DATE NOT NULL DEFAULT CURRENT_DATE,
  deprecated_at DATE,                      -- NULL if still active
  deprecation_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geo_best_practices_platform ON geo_best_practices(platform);
CREATE INDEX idx_geo_best_practices_category ON geo_best_practices(category);
CREATE INDEX idx_geo_best_practices_active ON geo_best_practices(deprecated_at) WHERE deprecated_at IS NULL;
```

#### schema_templates
```sql
CREATE TABLE schema_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type VARCHAR(100) NOT NULL,       -- 'FAQPage', 'Organization', 'Article', etc.
  platform_relevance JSONB NOT NULL,       -- {"chatgpt": 90, "claude": 85, ...}
  template_code TEXT NOT NULL,
  usage_instructions TEXT NOT NULL,
  variables JSONB,                         -- Placeholders to fill
  validator_url VARCHAR(255),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  superseded_by UUID REFERENCES schema_templates(id)
);

CREATE INDEX idx_schema_templates_type ON schema_templates(schema_type);
CREATE INDEX idx_schema_templates_current ON schema_templates(is_current) WHERE is_current = true;
```

#### platform_changes
```sql
CREATE TABLE platform_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  change_detected DATE NOT NULL,
  change_type VARCHAR(100) NOT NULL,       -- 'citation_pattern', 'content_preference', 'feature_update'
  description TEXT NOT NULL,
  impact_assessment TEXT NOT NULL,
  recommended_response TEXT NOT NULL,
  confidence_score INTEGER NOT NULL,       -- 0-100
  source VARCHAR(255) NOT NULL,            -- How we detected it
  affected_practices UUID[],               -- References to geo_best_practices
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_changes_platform ON platform_changes(platform);
CREATE INDEX idx_platform_changes_date ON platform_changes(change_detected DESC);
```

#### geo_alerts
```sql
CREATE TABLE geo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  brand_id UUID REFERENCES brands(id),     -- NULL for org-wide alerts
  alert_type VARCHAR(50) NOT NULL,         -- 'algorithm_change', 'recommendation_updated', etc.
  severity VARCHAR(20) NOT NULL,           -- 'info', 'warning', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affected_platforms VARCHAR(50)[] NOT NULL,
  action_required BOOLEAN NOT NULL DEFAULT false,
  suggested_actions TEXT[],
  platform_change_id UUID REFERENCES platform_changes(id),
  read_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geo_alerts_org ON geo_alerts(organization_id);
CREATE INDEX idx_geo_alerts_brand ON geo_alerts(brand_id);
CREATE INDEX idx_geo_alerts_unread ON geo_alerts(read_at) WHERE read_at IS NULL;
```

#### action_plan_versions
```sql
CREATE TABLE action_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  version_number INTEGER NOT NULL,
  knowledge_base_version VARCHAR(20) NOT NULL, -- '2026.01.3'
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  actions_snapshot JSONB NOT NULL,         -- Full action plan at this version
  changes_from_previous JSONB,             -- What changed
  downloaded_at TIMESTAMP,
  downloaded_by UUID REFERENCES users(id),

  UNIQUE(brand_id, version_number)
);

CREATE INDEX idx_action_plan_versions_brand ON action_plan_versions(brand_id);
```

---

## API Specifications

### GET /api/geo/best-practices

Returns current best practices, optionally filtered by platform or category.

**Query Parameters:**
- `platform` (optional): Filter by platform
- `category` (optional): Filter by category
- `includeDeprecated` (optional): Include deprecated practices

**Response:**
```json
{
  "practices": [
    {
      "id": "uuid",
      "platform": "chatgpt",
      "category": "schema",
      "practiceTitle": "Add FAQ Schema",
      "practiceDescription": "...",
      "implementationSteps": [...],
      "impactScore": 8,
      "effortScore": 3,
      "effectiveSince": "2026-01-01",
      "version": 2
    }
  ],
  "knowledgeBaseVersion": "2026.01.3",
  "lastUpdated": "2026-01-13T10:00:00Z"
}
```

### GET /api/geo/platform-changes

Returns detected platform behavior changes.

**Query Parameters:**
- `platform` (optional): Filter by platform
- `since` (optional): Changes since date
- `limit` (optional): Number of results

**Response:**
```json
{
  "changes": [
    {
      "id": "uuid",
      "platform": "chatgpt",
      "changeDetected": "2026-01-10",
      "changeType": "citation_pattern",
      "description": "ChatGPT now citing FAQ schema 40% more frequently",
      "impactAssessment": "High impact on visibility for brands without FAQ schema",
      "recommendedResponse": "Add FAQ schema to top 10 pages within 7 days",
      "confidenceScore": 85
    }
  ]
}
```

### GET /api/geo/alerts

Returns alerts for an organization or brand.

**Query Parameters:**
- `brandId` (optional): Filter by brand
- `unreadOnly` (optional): Only unread alerts
- `severity` (optional): Filter by severity

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "alertType": "algorithm_change",
      "severity": "critical",
      "title": "ChatGPT Citation Pattern Change Detected",
      "description": "...",
      "affectedPlatforms": ["chatgpt"],
      "actionRequired": true,
      "suggestedActions": ["Add FAQ schema to top 10 pages"],
      "createdAt": "2026-01-13T08:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### POST /api/geo/alerts/:id/read

Mark an alert as read.

### POST /api/geo/alerts/:id/dismiss

Dismiss an alert.

### GET /api/reports/action-plan

Generate action plan for a brand.

**Query Parameters:**
- `brandId` (required): Brand ID
- `format` (optional): 'json' | 'pdf' (default: json)
- `includeSchemaCode` (optional): Include full schema snippets

**Response:**
```json
{
  "version": "2.3",
  "knowledgeBaseVersion": "2026.01.3",
  "generatedAt": "2026-01-13T10:00:00Z",
  "brandName": "Acme Corp",
  "currentGeoScore": 67,
  "projectedGeoScore": 82,
  "estimatedTimeToComplete": "12-16 hours",
  "actions": [
    {
      "actionNumber": 1,
      "title": "Add FAQ Schema to Homepage",
      "priority": "critical",
      "impactPoints": "8-12",
      "effortMinutes": 30,
      "affectedPlatforms": ["chatgpt", "claude", "perplexity"],
      "whyItMatters": "...",
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "Open your homepage HTML...",
          "codeSnippet": null
        },
        {
          "stepNumber": 2,
          "instruction": "Add this code in the <head> section:",
          "codeSnippet": "<script type=\"application/ld+json\">..."
        }
      ],
      "verification": [
        "Schema validator shows no errors",
        "Questions match customer FAQs"
      ]
    }
  ],
  "schemaCodeLibrary": {
    "faq": "...",
    "organization": "...",
    "article": "..."
  },
  "changesFromPreviousVersion": [
    "Action #1: Updated code template",
    "REMOVED: Meta keywords action",
    "NEW: Action #8 - YouTube Shorts"
  ]
}
```

### GET /api/reports/action-plan/versions

Get version history for a brand's action plans.

**Query Parameters:**
- `brandId` (required): Brand ID
- `limit` (optional): Number of versions

**Response:**
```json
{
  "versions": [
    {
      "versionNumber": 3,
      "knowledgeBaseVersion": "2026.01.3",
      "generatedAt": "2026-01-13T10:00:00Z",
      "changesFromPrevious": ["..."],
      "downloadedAt": "2026-01-13T11:00:00Z"
    }
  ]
}
```

---

## UI/UX Requirements

### Action Plan Dashboard

**Location:** `/dashboard/action-plan`

**Components:**
1. **Header Section**
   - Brand selector
   - Version indicator (v2.3)
   - Knowledge base version (2026.01.3)
   - "Download PDF" button
   - "Changes since last download" badge

2. **Progress Overview**
   - Circular progress indicator (X/Y actions completed)
   - Current GEO Score
   - Projected GEO Score after completion
   - Estimated time remaining

3. **Action List**
   - Grouped by priority (Critical/High/Medium)
   - Each action card shows:
     - Title
     - Impact score badge
     - Effort indicator
     - Affected platforms (icons)
     - Expand/collapse for steps
     - Checkbox for completion
     - "Freshness" badge (new/updated/stable)

4. **Schema Code Library Panel**
   - Collapsible section
   - Code blocks with syntax highlighting
   - One-click copy buttons
   - "Test in Validator" links

### GEO Alerts Panel

**Location:** Dashboard sidebar + `/dashboard/alerts`

**Components:**
1. **Alert Card**
   - Severity indicator (red/yellow/blue border)
   - Alert type icon
   - Title
   - Description (truncated)
   - Affected platforms badges
   - "View Details" expand
   - "Dismiss" button
   - Timestamp

2. **Alert Detail Modal**
   - Full description
   - Impact assessment
   - Suggested actions (actionable links)
   - Related recommendations link

### Version Diff View

**Location:** Modal from "Changes since last download"

**Components:**
1. **Version Selector**
   - Dropdown to compare versions

2. **Diff Display**
   - Added actions (green)
   - Removed actions (red)
   - Modified actions (yellow)
   - Changed steps highlighted

---

## Implementation Phases

### Phase 1: Core Deliverables Foundation (Week 1-2)

| Task | Description | Dependencies | Owner |
|------|-------------|--------------|-------|
| P1.1 | Create geo-knowledge-base.ts DB schema | None | Backend |
| P1.2 | Create action-plan-generator.ts | P1.1 | Backend |
| P1.3 | Create schema-generator.ts | P1.1 | Backend |
| P1.4 | Update recommendation-engine.ts to populate steps | P1.1 | Backend |
| P1.5 | Seed initial best practices data | P1.1 | Backend |
| P1.6 | Seed initial schema templates | P1.1 | Backend |

### Phase 2: Export & PDF Enhancement (Week 3-4)

| Task | Description | Dependencies | Owner |
|------|-------------|--------------|-------|
| P2.1 | Create action-plan-pdf.tsx component | P1.2 | Frontend |
| P2.2 | Enhance pdf-report.ts with step-by-step | P1.2 | Backend |
| P2.3 | Update export route with steps | P1.4 | Backend |
| P2.4 | Create developer-checklist.tsx | P1.3 | Frontend |
| P2.5 | Create social-guide-generator.ts | None | Backend |

### Phase 3: Dashboard UI (Week 5-6)

| Task | Description | Dependencies | Owner |
|------|-------------|--------------|-------|
| P3.1 | Create action plan dashboard page | P2.1 | Frontend |
| P3.2 | Update recommendations-panel.tsx | P1.4 | Frontend |
| P3.3 | Create progress-report.tsx component | P2.2 | Frontend |
| P3.4 | Add schema code library panel | P1.3 | Frontend |
| P3.5 | Implement action completion tracking | P3.1 | Full-stack |

### Phase 4: Dynamic Adaptability (Week 7-10)

| Task | Description | Dependencies | Owner |
|------|-------------|--------------|-------|
| P4.1 | Create platform-monitor.ts | P1.1 | Backend |
| P4.2 | Create alert-generator.ts | P4.1 | Backend |
| P4.3 | Create version-tracker.ts | P1.2 | Backend |
| P4.4 | Create update-pipeline.ts | P4.1 | Backend |
| P4.5 | Create geo alerts API routes | P4.2 | Backend |
| P4.6 | Create geo-alert-card.tsx | P4.5 | Frontend |
| P4.7 | Create version-diff.tsx | P4.3 | Frontend |
| P4.8 | Integrate alerts with notification digest | P4.2 | Backend |
| P4.9 | Set up weekly pipeline cron job | P4.4 | DevOps |

---

## Test Plan

### Unit Tests

#### action-plan-generator.test.ts
```typescript
describe('ActionPlanGenerator', () => {
  describe('generateActionPlan', () => {
    it('should generate action plan from recommendations', async () => {});
    it('should group actions by priority', async () => {});
    it('should include step-by-step instructions', async () => {});
    it('should calculate estimated GEO score impact', async () => {});
    it('should include schema code snippets', async () => {});
    it('should respect brand-specific context', async () => {});
  });

  describe('populateSteps', () => {
    it('should populate steps array for each recommendation', async () => {});
    it('should include platform-specific variations', async () => {});
    it('should include verification checklists', async () => {});
  });
});
```

#### schema-generator.test.ts
```typescript
describe('SchemaGenerator', () => {
  describe('generateFAQSchema', () => {
    it('should generate valid FAQ schema JSON-LD', () => {});
    it('should include brand-specific questions', () => {});
    it('should validate against Schema.org spec', () => {});
  });

  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema', () => {});
    it('should include all required fields', () => {});
    it('should auto-fill from brand data', () => {});
  });

  // ... tests for each schema type
});
```

#### platform-monitor.test.ts
```typescript
describe('PlatformMonitor', () => {
  describe('detectCitationPatternChanges', () => {
    it('should detect >10% change in citation patterns', async () => {});
    it('should calculate confidence scores', async () => {});
    it('should not trigger for minor fluctuations', async () => {});
  });

  describe('compareToBaseline', () => {
    it('should compare current behavior to 30-day baseline', async () => {});
    it('should identify specific change types', async () => {});
  });
});
```

#### alert-generator.test.ts
```typescript
describe('AlertGenerator', () => {
  describe('generateAlgorithmChangeAlert', () => {
    it('should create alert for platform behavior changes', async () => {});
    it('should set correct severity based on impact', async () => {});
    it('should include affected practices', async () => {});
  });

  describe('generateRecommendationUpdateAlert', () => {
    it('should create alert when action plan changes', async () => {});
    it('should list specific changes', async () => {});
  });
});
```

### Integration Tests

#### action-plan-api.test.ts
```typescript
describe('GET /api/reports/action-plan', () => {
  it('should return complete action plan', async () => {});
  it('should include version information', async () => {});
  it('should include changes from previous version', async () => {});
  it('should return PDF when format=pdf', async () => {});
  it('should require authentication', async () => {});
  it('should scope to organization', async () => {});
});
```

#### geo-alerts-api.test.ts
```typescript
describe('GEO Alerts API', () => {
  describe('GET /api/geo/alerts', () => {
    it('should return alerts for organization', async () => {});
    it('should filter by brand', async () => {});
    it('should filter unread only', async () => {});
  });

  describe('POST /api/geo/alerts/:id/read', () => {
    it('should mark alert as read', async () => {});
    it('should record timestamp', async () => {});
  });
});
```

### E2E Tests

#### action-plan-flow.spec.ts
```typescript
describe('Action Plan User Flow', () => {
  it('should display action plan dashboard', async () => {});
  it('should allow downloading PDF', async () => {});
  it('should show version changes badge', async () => {});
  it('should track action completion', async () => {});
  it('should copy schema code to clipboard', async () => {});
});
```

#### geo-alerts-flow.spec.ts
```typescript
describe('GEO Alerts User Flow', () => {
  it('should display alerts in sidebar', async () => {});
  it('should show alert count badge', async () => {});
  it('should expand alert details', async () => {});
  it('should dismiss alerts', async () => {});
  it('should navigate to updated action plan', async () => {});
});
```

---

## Acceptance Criteria

### Phase 1 Acceptance

- [ ] AC-1.1: geo_best_practices table created with correct schema
- [ ] AC-1.2: schema_templates table created with correct schema
- [ ] AC-1.3: platform_changes table created with correct schema
- [ ] AC-1.4: Initial best practices data seeded (minimum 20 practices)
- [ ] AC-1.5: Initial schema templates seeded (FAQ, Organization, Article, HowTo, Product)
- [ ] AC-1.6: action-plan-generator produces valid action plans
- [ ] AC-1.7: schema-generator produces valid JSON-LD
- [ ] AC-1.8: recommendations.steps array is populated
- [ ] AC-1.9: All unit tests passing

### Phase 2 Acceptance

- [ ] AC-2.1: Action Plan PDF exports with step-by-step instructions
- [ ] AC-2.2: PDF includes schema code library section
- [ ] AC-2.3: PDF uses correct branding (white-label support)
- [ ] AC-2.4: Developer checklist exports as printable PDF
- [ ] AC-2.5: Export API includes steps in all formats
- [ ] AC-2.6: Social media guide generates for all platforms
- [ ] AC-2.7: All integration tests passing

### Phase 3 Acceptance

- [ ] AC-3.1: Action plan dashboard displays all actions
- [ ] AC-3.2: Actions grouped by priority
- [ ] AC-3.3: Action completion tracking works
- [ ] AC-3.4: Schema code library has copy functionality
- [ ] AC-3.5: Progress report shows before/after metrics
- [ ] AC-3.6: Recommendations panel shows step-by-step
- [ ] AC-3.7: All E2E tests passing

### Phase 4 Acceptance

- [ ] AC-4.1: Platform monitor detects behavior changes
- [ ] AC-4.2: Alerts generated for significant changes
- [ ] AC-4.3: Alert severity correctly assigned
- [ ] AC-4.4: Version tracking records all changes
- [ ] AC-4.5: Version diff shows clear changes
- [ ] AC-4.6: Weekly pipeline runs successfully
- [ ] AC-4.7: Deprecated practices flagged in UI
- [ ] AC-4.8: Alerts delivered via email digest
- [ ] AC-4.9: All tests passing, system stable

---

## Dependencies & Risks

### Dependencies

| Dependency | Type | Impact | Mitigation |
|------------|------|--------|------------|
| Existing recommendation engine | Internal | High | Extend, don't replace |
| PDF generation library | Internal | Medium | Use existing pdf-report.ts |
| Notification system | Internal | Medium | Extend existing |
| AI platform APIs | External | High | Graceful degradation |
| Schema.org specifications | External | Low | Version control templates |

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Platform behavior hard to detect | Medium | High | Multiple detection methods, human review |
| False positive alerts | Medium | Medium | Confidence thresholds, user feedback |
| PDF generation performance | Low | Medium | Async generation, caching |
| Knowledge base accuracy | Medium | High | Expert review process |
| User alert fatigue | Medium | Medium | Smart throttling, severity levels |

---

## Appendices

### Appendix A: Schema Template Examples

See `docs/PRD/appendices/schema-templates.md`

### Appendix B: Alert Type Definitions

| Alert Type | Trigger | Default Severity |
|------------|---------|------------------|
| algorithm_change | Platform behavior shift >10% | critical |
| recommendation_updated | Action plan version change | info |
| strategy_deprecated | Practice marked deprecated | warning |
| new_opportunity | New platform feature detected | info |
| competitor_move | Competitor gains >5% SOV | warning |
| score_impact | GEO score changes >5 points | info |

### Appendix C: Impact Score Calculation

```typescript
impactScore = (
  citationImpact * 0.4 +
  platformCoverage * 0.3 +
  effortEfficiency * 0.2 +
  freshness * 0.1
)

// Where:
// - citationImpact: Historical improvement from this practice (0-100)
// - platformCoverage: Number of platforms affected / total platforms * 100
// - effortEfficiency: Expected GEO points / hours required
// - freshness: Days since last validation (100 - min(days/30, 1) * 100)
```

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| GEO | Generative Engine Optimization |
| AEO | Answer Engine Optimization |
| Knowledge Base Version | Semantic version of best practices (YYYY.MM.X) |
| Action Plan Version | Sequential version per brand (1, 2, 3...) |
| Practice Deprecation | Marking a best practice as no longer effective |
| Platform Signal | Detected change in AI platform behavior |

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-13 | Product Team | Initial PRD |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Design Lead | | | |
| QA Lead | | | |
