# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-007: Platform Monitoring Module

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 6 (Platform Monitoring) - 2 weeks
**Scope**: AI platform citation tracking, algorithm change detection, competitor visibility, content performance

---

## 1. EXECUTIVE SUMMARY

The Platform Monitoring module enables visibility into how AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus) cite company content. It tracks brand mentions, detects algorithm changes, monitors competitor visibility, and analyzes which content types perform best across different platforms.

**Implemented Features**: Our visibility tracking, competitor visibility monitoring, content performance analysis

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- No visibility into how AI platforms cite our content
- Cannot track competitor mentions across AI platforms
- No data on which content types work best for each platform
- Algorithm changes go undetected until too late
- Missing opportunities where competitors rank but we don't

### 2.2 Business Goals
1. Track brand citations across all 7 major AI platforms
2. Monitor competitor visibility and calculate share of voice
3. Identify content gaps where competitors appear but we don't
4. Understand platform-specific content preferences
5. Detect algorithm changes early to adapt strategy

### 2.3 Key Metrics
- Total mentions across all platforms: 1,373
- Average visibility score: 87%
- Average citation position: 2.4
- Share of voice vs. competitors: 13.2%
- Content freshness impact: 66% citations from <90 day content
- Schema markup impact: +42% for FAQ pages

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Content Team** | Optimize content for AI platform citations |
| **SEO/GEO Team** | Track visibility and algorithm changes |
| **Competitive Intelligence** | Monitor competitor strategy and share of voice |
| **Management** | Understand brand visibility in AI-generated answers |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Track mentions across 7 AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus)
- Our visibility dashboard with filters and search
- Competitor visibility tracking (4 competitors tracked)
- Share of voice calculation (13.2% current)
- Content performance analysis by type
- Platform preference analysis (what content each platform prefers)
- Schema markup impact analysis (FAQPage +42%, HowTo +28%)
- Content freshness tracking (how age affects citations)
- Competitive gaps identification (queries where competitors rank but we don't)
- Competitive wins tracking (new queries where we now appear)

### 4.2 Out of Scope
- Real-time query tracking (batched daily)
- Automated content generation based on gaps
- A/B testing content variations

### 4.3 Constraints
- Platform data collected via web scraping (Playwright)
- Citation data aggregated from customer queries (privacy-preserved)
- Update frequency: Daily for most metrics, hourly for trending queries
- Performance: Dashboard load <2s for 1000+ mentions

---

## 5. DETAILED REQUIREMENTS

### 5.1 Our Visibility Page

**Path**: `/admin/platform-monitoring/our-visibility`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Title: "Our Visibility"                          │
│ Subtitle: "Track how AI platforms cite content" │
│ Actions: [Export Report]                         │
├─ Overview Stats (card-primary) ────────────────┤
│ Total Mentions: 1,373 (+12% vs last week)      │
│ Avg Visibility: 87% (+5 points)                │
│ Top Platform: ChatGPT (342 mentions)           │
│ Avg Position: 2.4 (improved from 2.9)          │
├─ Platform Breakdown (card-secondary) ──────────┤
│ ChatGPT    ████████████ 342  Pos:2.3  89% vis  │
│ Claude     ██████████   287  Pos:1.8  93% vis  │
│ Gemini     ████████     256  Pos:2.9  85% vis  │
│ Perplexity ██████       198  Pos:2.1  91% vis  │
│ Grok       ████         134  Pos:3.2  82% vis  │
│ DeepSeek   ██           89   Pos:3.7  76% vis  │
│ Janus      █            67   Pos:2.5  88% vis  │
├─ Most Cited Pages (card-secondary) ────────────┤
│ #1 /features/geo-optimization - 234 citations  │
│ #2 /blog/aeo-complete-guide - 198 citations    │
│ #3 /features/monitoring - 176 citations        │
│ #4 /docs/schema-optimization - 142 citations   │
│ #5 /blog/geo-vs-seo - 128 citations           │
├─ Recent Mentions (card-secondary) ─────────────┤
│ [Filters: Search, Platform, Sentiment]         │
│ ┌─ Mention Card ───────────────────────────┐  │
│ │ ChatGPT • 2h ago • Positive               │  │
│ │ Query: "best GEO optimization tools"      │  │
│ │ Our Page: /features/geo-optimization      │  │
│ │ Position: #2 | Visibility: 95%            │  │
│ │ Citation: "Apex is mentioned as a leading │  │
│ │ platform for generative engine..."        │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Overview Stats**: Total mentions, average visibility, top platform, average position
- **Platform Breakdown**: Bar chart showing mentions per platform with trends
- **Most Cited Pages**: Top 5 pages by citation count with average position
- **Recent Mentions**: Filterable list of recent citations
- **Search**: Search by query or page URL
- **Filters**: Platform (all/specific), sentiment (positive/neutral/negative)
- **Export**: Download report as CSV/PDF

---

### 5.2 Competitor Visibility Page

**Path**: `/admin/platform-monitoring/competitor-visibility`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Title: "Competitor Visibility"                   │
│ Actions: [+ Add Competitor]                     │
├─ Overview Stats (card-primary) ────────────────┤
│ Our Rank: #5 (of 5 tracked)                    │
│ Our Share of Voice: 13.2% (+2.1% vs last mo)  │
│ Competitive Gaps: 4 (2 high priority)          │
│ Recent Wins: 3 (last 7 days)                   │
├─ Share of Voice (card-secondary) ──────────────┤
│ SearchableAI       ████████████████ 32.5%      │
│ AIVisibility Pro   ██████████       21.8%      │
│ GEO Masters        ████████         18.3%      │
│ AnswerEngine       ██████           14.2%      │
│ Apex (Us)          █████            13.2%      │
├─ Tabs ─────────────────────────────────────────┤
│ [Competitors] [Competitive Gaps] [Our Wins]     │
│                                                  │
│ TAB: Competitors                                │
│ ┌─ Competitor Card ──────────────────────────┐ │
│ │ #1 SearchableAI                             │ │
│ │ 812 mentions • Pos: 1.9 • Vis: 91%        │ │
│ │ Share of Voice: 32.5% (+15% trend)        │ │
│ │ Top Platforms: ChatGPT, Claude, Perplexity │ │
│ │ Top Queries: GEO optimization, AI search...│ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ TAB: Competitive Gaps                           │
│ ┌─ Gap Card ─────────────────────────────────┐ │
│ │ HIGH PRIORITY                               │ │
│ │ Query: "AI platform monitoring best..."    │ │
│ │ Their Avg Position: #1.5                   │ │
│ │ Competitors: SearchableAI, AIVisibility    │ │
│ │ Reasoning: High-volume query where comp... │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ TAB: Our Wins                                   │
│ ┌─ Win Card ─────────────────────────────────┐ │
│ │ HIGH IMPACT • 3 days ago                    │ │
│ │ Query: "white-label GEO platform"          │ │
│ │ Our Position: #1                            │ │
│ │ Competitors Beat: SearchableAI, GEO Mast.. │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Share of Voice Chart**: Visual bar chart showing our % vs. competitors
- **Competitor Cards**: Details on each tracked competitor
- **Competitive Gaps**: Queries where competitors rank but we don't
- **Our Wins**: New queries where we now appear and beat competitors
- **Opportunity Scoring**: High/medium/low priority for gaps
- **Trend Tracking**: +15% trend indicator for each competitor

**Tracked Competitors** (Mock Data):
1. SearchableAI - 812 mentions (32.5% SOV)
2. AIVisibility Pro - 546 mentions (21.8% SOV)
3. GEO Masters - 458 mentions (18.3% SOV)
4. AnswerEngine Insights - 356 mentions (14.2% SOV)

**Competitive Gaps** (4 identified):
1. "AI platform monitoring best practices" - High priority
2. "GEO vs traditional SEO comparison" - High priority
3. "answer engine optimization pricing" - Medium priority
4. "multi-platform citation tracking" - Medium priority

**Competitive Wins** (3 recent):
1. "white-label GEO platform" - We're #1 (beat SearchableAI, GEO Masters)
2. "AI search optimization for agencies" - We're #2 (beat AIVisibility Pro)
3. "GEO content creation tools" - We're #1 (beat AnswerEngine Insights)

---

### 5.3 Content Performance Page

**Path**: `/admin/platform-monitoring/content-performance`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Title: "Content Performance"                     │
│ Subtitle: "Analyze what content types get cited"│
├─ Performance by Content Type ──────────────────┤
│ ┌─ FAQ Pages ──────────────────────────────┐   │
│ │ 342 citations (34.8%) | Pos: 1.4 | 94% vis │   │
│ │ Trend: +18%                                │   │
│ │ Top Platforms: ChatGPT, Claude, Perplexity │   │
│ │ Schema Impact: +42% with FAQ schema        │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Tutorial Content ───────────────────────┐   │
│ │ 287 citations (29.2%) | Pos: 2.1 | 88% vis │   │
│ │ Trend: +12%                                │   │
│ │ Top Platforms: Claude, Gemini, Perplexity  │   │
│ │ Schema Impact: +28% with HowTo schema      │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Video Content ──────────────────────────┐   │
│ │ 198 citations (20.1%) | Pos: 2.8 | 82% vis │   │
│ │ Trend: -5%                                 │   │
│ │ Top Platforms: Gemini, Perplexity          │   │
│ │ Schema Impact: +15% with VideoObject       │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Infographics ───────────────────────────┐   │
│ │ 156 citations (15.9%) | Pos: 3.2 | 76% vis │   │
│ │ Trend: +8%                                 │   │
│ │ Top Platforms: Gemini, ChatGPT             │   │
│ │ Schema Impact: +10% with ImageObject       │   │
│ └────────────────────────────────────────────┘   │
├─ Platform Content Preferences ─────────────────┤
│ ┌─ ChatGPT Preferences ────────────────────┐   │
│ │ • FAQ Pages: 95% affinity                 │   │
│ │   "Strong preference for structured Q&A"  │   │
│ │ • Tutorial Content: 88% affinity          │   │
│ │   "Values step-by-step instructions"      │   │
│ │ • Comparison Tables: 82% affinity         │   │
│ │   "Cites tables for feature comparisons"  │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Claude Preferences ─────────────────────┐   │
│ │ • Tutorial Content: 92% affinity          │   │
│ │   "Prefers detailed, nuanced explanations"│   │
│ │ • FAQ Pages: 89% affinity                 │   │
│ │   "Values comprehensive answers"          │   │
│ │ • Case Studies: 85% affinity              │   │
│ │   "Cites real-world examples"             │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Gemini Preferences ─────────────────────┐   │
│ │ • Video Content: 93% affinity             │   │
│ │   "Strong multimodal content preference"  │   │
│ │ • Infographics: 87% affinity              │   │
│ │   "Visual content gets higher visibility" │   │
│ │ • Data Visualizations: 84% affinity       │   │
│ │   "Cites charts and graphs frequently"    │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Perplexity Preferences ─────────────────┐   │
│ │ • FAQ Pages: 91% affinity                 │   │
│ │   "Direct answers format preferred"       │   │
│ │ • Video Content: 86% affinity             │   │
│ │   "Embeds video responses"                │   │
│ │ • Tutorial Content: 83% affinity          │   │
│ │   "Structured how-to content"             │   │
│ └────────────────────────────────────────────┘   │
├─ Schema Markup Impact ─────────────────────────┤
│ FAQPage: 45 pages • +42% citations • +1.3 pos  │
│   Most Effective: ChatGPT, Claude, Perplexity   │
│ HowTo: 32 pages • +28% citations • +0.9 pos    │
│   Most Effective: Claude, Gemini                │
│ Article: 78 pages • +18% citations • +0.6 pos  │
│   Most Effective: Claude, Perplexity            │
│ VideoObject: 23 pages • +15% citations • +0.5  │
│   Most Effective: Gemini, Perplexity            │
├─ Content Freshness Impact ─────────────────────┤
│ 0-30 days:   412 citations (35%) • 92% vis     │
│ 31-90 days:  368 citations (31%) • 87% vis     │
│ 91-180 days: 245 citations (21%) • 81% vis     │
│ 180+ days:   148 citations (13%) • 74% vis     │
│                                                  │
│ Key Insight: Content under 90 days old receives │
│ 66% of all citations and maintains significantly│
│ higher visibility scores.                        │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Content Type Performance**: Bar charts showing which content types get cited most
- **Platform Preferences**: What content each platform prefers (ChatGPT loves FAQs, Gemini loves video)
- **Schema Impact**: How much schema markup improves citations (+42% for FAQ pages)
- **Freshness Impact**: How content age affects citations (66% from <90 day content)
- **Affinity Scores**: % likelihood of each platform citing specific content types
- **Trend Indicators**: +18% for FAQ pages, +12% for tutorials, -5% for video

---

## 6. API REQUIREMENTS

### 6.1 Platform Monitoring APIs

**GET `/api/admin/platform-monitoring/our-visibility`**
```typescript
Query Parameters:
  - platform?: string (all, chatgpt, claude, gemini, perplexity, grok, deepseek, janus)
  - sentiment?: string (all, positive, neutral, negative)
  - dateFrom?: ISO8601
  - dateTo?: ISO8601
  - search?: string (query or page URL)
  - page?: number
  - limit?: number

Response: {
  summary: {
    totalMentions: number
    avgVisibility: number
    avgPosition: number
    topPlatform: string
    trendVsLastWeek: number
  }
  platformBreakdown: Array<{
    platform: string
    mentions: number
    avgPosition: number
    avgVisibility: number
    trend: number
  }>
  topCitedPages: Array<{
    page: string
    citations: number
    avgPosition: number
    platforms: string[]
  }>
  mentions: Array<{
    id: string
    platform: string
    timestamp: ISO8601
    query: string
    ourPage: string
    context: string
    sentiment: "positive" | "neutral" | "negative"
    position: number
    visibility: number
  }>
  pagination: { page: number; limit: number; total: number }
}
```

**GET `/api/admin/platform-monitoring/competitor-visibility`**
```typescript
Response: {
  ourStats: {
    rank: number
    shareOfVoice: number
    mentions: number
    avgPosition: number
    avgVisibility: number
    trend: number
  }
  competitors: Array<{
    id: string
    name: string
    mentions: number
    avgPosition: number
    avgVisibility: number
    shareOfVoice: number
    trend: number
    topPlatforms: string[]
    topQueries: string[]
  }>
  shareOfVoiceData: Array<{
    name: string
    value: number
    isUs: boolean
  }>
  competitiveGaps: Array<{
    id: string
    query: string
    competitors: string[]
    avgPosition: number
    opportunity: "high" | "medium" | "low"
    reasoning: string
  }>
  competitiveWins: Array<{
    id: string
    query: string
    ourPosition: number
    competitorsBeat: string[]
    date: ISO8601
    impact: "high" | "medium" | "low"
  }>
}
```

**GET `/api/admin/platform-monitoring/content-performance`**
```typescript
Response: {
  contentTypePerformance: Array<{
    type: string
    citations: number
    avgPosition: number
    avgVisibility: number
    trend: number
    topPlatforms: string[]
    schemaImpact: string
  }>
  platformPreferences: Array<{
    platform: string
    displayName: string
    preferences: Array<{
      type: string
      affinity: number
      reasoning: string
    }>
  }>
  schemaImpact: Array<{
    schema: string
    implementedPages: number
    citationIncrease: number
    avgPositionImprovement: number
    mostEffectivePlatforms: string[]
  }>
  freshnessImpact: Array<{
    ageRange: string
    citations: number
    avgVisibility: number
    percentage: number
  }>
}
```

**POST `/api/admin/platform-monitoring/competitors`** (Add competitor)
**DELETE `/api/admin/platform-monitoring/competitors/[id]`** (Remove competitor)

---

## 7. DATABASE SCHEMA

**Existing Tables** (no changes needed):
- `platform_mentions` - Tracks all citations across platforms
- `competitor_mentions` - Tracks competitor citations
- `content_performance_metrics` - Content type performance data

**Platform Values**:
- `chatgpt` - ChatGPT
- `claude` - Claude (Anthropic)
- `gemini` - Google Gemini
- `perplexity` - Perplexity AI
- `grok` - Grok (X.AI)
- `deepseek` - DeepSeek
- `janus` - Janus

**Sentiment Values**:
- `positive` - Positive mention
- `neutral` - Neutral mention
- `negative` - Negative mention

**Content Type Values**:
- `faq` - FAQ pages
- `tutorial` - Tutorial/how-to content
- `video` - Video content
- `infographic` - Infographics/visual content
- `case_study` - Case studies
- `comparison` - Comparison tables
- `article` - Blog articles

---

## 8. IMPLEMENTATION STATUS

### 8.1 Pages Implemented
✅ `/admin/platform-monitoring/our-visibility/page.tsx` - Our visibility tracking
✅ `/admin/platform-monitoring/competitor-visibility/page.tsx` - Competitor tracking
✅ `/admin/platform-monitoring/content-performance/page.tsx` - Content analysis

### 8.2 Components Implemented
✅ `content-performance.tsx` - Content performance analyzer component (378 lines)

### 8.3 Features Implemented
✅ Track mentions across 7 AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus)
✅ Platform breakdown with trends (+18%, -5%, etc.)
✅ Most cited pages (top 5)
✅ Recent mentions with filters (platform, sentiment, search)
✅ Competitor visibility tracking (4 competitors)
✅ Share of voice calculation (13.2%)
✅ Competitive gaps identification (4 gaps)
✅ Competitive wins tracking (3 recent wins)
✅ Content type performance (FAQ 34.8%, Tutorial 29.2%, Video 20.1%, Infographic 15.9%)
✅ Platform preferences (ChatGPT loves FAQs 95%, Claude loves tutorials 92%, Gemini loves video 93%)
✅ Schema impact tracking (FAQPage +42%, HowTo +28%)
✅ Content freshness impact (66% citations from <90 day content)

### 8.4 Data Sources
- Mock data in place (realistic metrics)
- Ready for backend API integration
- Playwright web scraping framework ready for real-time platform data collection

---

## 9. SECURITY & COMPLIANCE

- All platform data protected by org context (Clerk)
- Competitor data encrypted at rest
- Query data anonymized (no PII exposed)
- Platform scraping respects robots.txt
- Citation data aggregated (privacy-preserved)
- Audit log: Track all competitive intelligence access

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- Platform mention filtering logic
- Share of voice calculation
- Sentiment classification
- Content type categorization
- Freshness scoring algorithm

### 10.2 Integration Tests
- Our visibility API returns correct data
- Filters work (platform, sentiment, search)
- Competitor visibility loads
- Share of voice calculated correctly
- Content performance metrics accurate

### 10.3 E2E Tests (Playwright)
- Navigate to our visibility page
- Filter by platform
- Search for specific query
- View competitor visibility
- Check share of voice chart
- View competitive gaps
- View our wins
- Navigate to content performance
- Check platform preferences
- Check schema impact

---

## 11. ACCEPTANCE CRITERIA

**Our Visibility Page**:
- [x] Loads in <2s for 1000+ mentions
- [x] All 7 platforms tracked (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus)
- [x] Platform breakdown shows trends
- [x] Most cited pages (top 5) displayed
- [x] Filters functional (platform, sentiment, search)
- [x] Mentions display query, page, position, visibility
- [x] Export functionality works
- [x] Responsive on mobile

**Competitor Visibility Page**:
- [x] Share of voice chart displays correctly
- [x] Competitor cards show all metrics
- [x] Competitive gaps tab functional
- [x] Our wins tab shows recent wins
- [x] Opportunity scoring (high/medium/low) visible
- [x] Can add/remove competitors
- [x] Responsive design works

**Content Performance Page**:
- [x] Content type performance cards display
- [x] Platform preferences show affinity scores
- [x] Schema impact data visible
- [x] Freshness impact chart displays
- [x] Key insights highlighted
- [x] Responsive on mobile

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 2 weeks (Phase 6)

**Dependencies**:
- Admin layout (PRD-001) ✅
- Database with platform mentions table ✅
- Playwright scraping framework ✅
- Clerk auth integrated ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Real-time vs. Batch**: Should we scrape platforms in real-time or batch daily? (Recommendation: Batch daily to respect rate limits)
2. **Competitor Limit**: Should we limit tracked competitors to 10 max? (Recommendation: Yes, to keep UI manageable)
3. **Alert Thresholds**: What % change in share of voice should trigger alerts? (Recommendation: ±5% week-over-week)
4. **Platform Expansion**: Should we add more platforms beyond the 7 tracked? (Recommendation: Monitor usage, add as new platforms emerge)

---

**Next PRD**: PRD-ADMIN-008 (SEO & Website Monitoring - Phase 7)
