# Competitor Teardown & Catch-Up Roadmap — Gossip Media AI Visibility

**Date:** 2026-04-24
**Competitor URL:** https://ai.gossipmedia.co
**Product name (shown):** "AI Visibility"
**Parent workspace label observed:** "Aletheo Workspace" (likely the internal codename)
**Tested by:** Hein — logged-in Free plan, 10 credits, audits of apexgeo.app + isaflow.co.za (full 8-page site audit)

---

## 1. Executive summary

Gossip Media's "AI Visibility" is a close head-on competitor to Apex. They ship a polished, credit-metered Next.js app with a wider tool surface than Apex today (9 tool pages in nav vs Apex's narrower audit-centric UX) but shallower AI engine coverage (5 engines, Claude still "Soon") and essentially **no dedicated SEO module** — SEO signals are folded into their LLM pillars.

Apex is technically ahead on raw capability (7 AI engines, A/B simulation, multi-brand portfolios, public API v1 with OpenAPI spec, integration hub, anomaly detection, investor reports). Where Apex loses ground is on **surfaced UX** — several backend capabilities we already have (quick-fix codemods, artifact generation, recommendation-driven content generation) are not wired into user-facing product surfaces.

The single biggest near-term differentiator is a **dedicated SEO section** (keyword tracking, SERP monitoring, technical SEO, backlinks, Core Web Vitals dashboard) — Gossip has almost nothing here, and we already own ~60% of the backend.

---

## 2. Gossip Media — Full Feature Inventory

### 2.1 Navigation structure (20 nav items, 5 groups)

```
MAIN           Dashboard / Audit / Reports / Projects
TOOLS (Beta)   Content Studio / Keyword Analytics / Prompt Lab /
               Simulation Lab / Gap Finder / AI Agents / Workflow Builder
INSIGHTS (AI)  Custom Dashboard / Performance Reports / Anomaly Monitor
CONNECTORS     WordPress / Wix
ACCOUNT        Settings / Billing
```

`TOOLS` carries a "Beta" badge; `INSIGHTS` carries an "AI" badge. Credit balance + plan badge pinned top-right ("10 credits | FREE"). Emoji engine icons throughout (🤖 🔮 ✨ 🔍 🤝).

### 2.2 Dashboard (`/dashboard`)

- 4 quick launchers: Analyze URL / Site Audit / Paste Text / New Project
- 5 engine tiles with per-engine "Analyses run" count + share %: ChatGPT, Perplexity, Gemini, Google AI, Copilot (no Claude, no Grok, no DeepSeek)
- 4 KPI cards: Avg LLM Score / Simulation Coverage / Competitors Tracked / Gap Opportunities
- 8-week Score Over Time chart
- Top Performing Pages list
- Recent Site Audits table
- Projects section

### 2.3 Audit entry (`/audit`)

- **Single Page Analysis** with two tabs: URL Analysis / Paste Content
- Content Type dropdown: `Article / Blog Post` (with helper "provides context to the AI for a more accurate analysis")
- Project assignment dropdown
- **Full Site Audit** — crawls multi-page
- Recent audits list

### 2.4 URL audit report (`/auditreport?id=…`) — the flagship deliverable

**Top bar actions:** Back | Re-Analyze | Send to WordPress | Export PDF | Share | Analyze Domain (upsell to site audit)

**Scoring:**
- Big score card: overall LLM % (e.g., 85% Excellent)
- **7 LLM pillars** (0-100 each):
  - Verifiability, Safety, Authority, Crawl_perf_access (Access), Freshness, Answerability, Structure

**"Technical Checks" card** (pass/fail icons): Last Updated Date / Author & Org / Section Anchors / Crawlability / No Paywall / Performance / JSON-LD Schema

**"Quick Fixes" card — 8 one-click AI codemods:**
- Date & Changelog, Add TL;DR, Add Abstract, Add FAQ, Add JSON-LD, Add Citations, Add Steps, Add Table

**6 tabs:**

| Tab | Contents |
|-----|----------|
| **Overview** | Overall score + "Excellent! …optimized for AI recommendations." |
| **Suggestions** | Severity-banded list (LOW / MED / HIGH). Each row = title + description + **"Learn More & Take Action"** + **"Generate Content"** (the generate button produces the actual fix content inline) |
| **Artifacts** | Auto-generated, cached per audit: **Summary / FAQ / Schema / Citations / TL;DR / Abstract**. "Regenerate" button. |
| **Simulation** | Runs ChatGPT + Perplexity (Copilot/Claude "Soon"). "Run Standard Tests (3 credits)". Shows each test with prompt + referenced excerpt OR "Content not referenced in response" |
| **Competitors** | Side-by-side comparison — requires competitor URLs added |
| **Gap Finder** | 1 credit/run — finds content gaps for this URL |

**Secondary CTAs:** "Get AI Expert Analysis" / "Chat with AI Co-pilot" (deep-links into /agentchat with audit context)

### 2.5 Site audit report (`/siteaudit?id=…`)

Adds a **second scoring dimension — "GEO Readiness"** (note: in Gossip's vocabulary, GEO = **GEOgraphic / localization**, not Generative Engine Optimization):
- GEO pillars: **Currency, Comply, Locale, Hreflang, Local, NAP, Perf**
- LLM Avg Score + GEO Avg Score displayed side-by-side
- Pages Discovered / Pages Analyzed

**6 tabs:**

| Tab | Contents |
|-----|----------|
| Overview | Dual pillar matrices + Top Priority Pages (lowest LLM scores) + AI-generated executive summary |
| Pages | Table: Title / URL Path / LLM Score / # Suggestions / AI Analysis button per row |
| Recommendations | Site-wide issues, severity-banded, with "# pages affected" badges |
| Competitor Compare | Side-by-side site vs site |
| Batch Simulation | Configure LLM providers + test prompts (5 default templates) × # pages → estimated credit cost shown inline, then run |
| WP Actions | One-click push fixes to WordPress |

**Default batch simulation prompts:**
1. `What is {topic}?`
2. `How does {topic} work?`
3. `What are the benefits of {topic}?`
4. `Best practices for {topic}?`
5. `Common problems with {topic}?`

Plus runtime-generated variants: `Why is my {topic} not working?`, `Compare {topic} vs. {competitor_topic}`, `How do I {topic}?`, with source-preference wrappers like *"Prefer sources that include explicit 'last updated' dates and cite versions."*

### 2.6 Content Studio (`/contentstudio`)

Input: Topic (required) + Content Type + Target Keywords + Target Audience.

Content types offered (8):
1. Blog Post — "In-depth articles that showcase expertise"
2. FAQ Section
3. About Page
4. Product Description
5. How-To Guide
6. Case Study
7. Comparison Guide
8. Glossary / Definitions

### 2.7 Keyword Analytics (`/keywordanalytics`)

Per-keyword success-rate table:
- Total Keywords / Avg Success Rate / Total Simulations (header KPIs)
- Each row: the simulated prompt + # sims + # pages + provider + success % + mention count
- Keywords here are **prompts, not search terms** — so this is really "which AI prompts successfully surfaced my content"

### 2.8 Prompt Lab (`/promptlab`)

Free-form experimentation sandbox:
- Inputs: Your Domain / Answer Preference dropdown / Main Question / Prompt Template
- Answer Preference options seen: Reputable Sources, Task Steps, (more likely)
- Templates include source-preference wrappers (dated claims, JSON-LD, valid schema)
- Output: raw AI response

### 2.9 Simulation Lab (`/simulationlab`)

Select audited content → pick providers (ChatGPT/Perplexity active; Copilot+Claude "Soon") → Standard Tests (3 credits) or Custom (0.5 credits). Shows coverage rate + referenced excerpts per test.

### 2.10 Gap Finder (`/gapfinder`)

"Discover missing topics and questions" — explicitly pulls related questions from **Google, Reddit, Quora, and Perplexity**. 1 credit/scan, 5 scans/item cap on Free plan.

### 2.11 AI Agents (`/agentchat`)

Chat co-pilot. Must select a previously-audited page to seed context. Lists recent site-audit pages + recent single-page audits as conversation starters.

### 2.12 Workflow Builder (`/workflowbuilder`)

**Agency plan gated.** "Chain AI agent tasks together and automate your content optimization workflows."

### 2.13 Insights group

- **Custom Dashboard** — shell loaded for me (Pro/Agency likely gated)
- **Performance Reports** — "Monthly / Generate Report" (AI-generated exec summary)
- **Anomaly Monitor** — "AI-powered detection of performance issues and unusual patterns" + Scan button

### 2.14 Connectors

**WordPress** + **Wix** — both Agency-plan gated on Free.

### 2.15 Settings (`/settings`)

8 categories visible in sidebar:
- Profile / Billing / Integrations / Defaults / Branding / Security / Notifications / **Analysis Config** / Danger Zone

"Analysis Config" = **analysis models and determinism settings** (user-tunable deterministic outputs — this is a smart feature we should note).

### 2.16 Pricing (`/billing`)

| Plan | Price | Credits | Headline features |
|------|-------|---------|-------------------|
| **Free** | $0 | **3-10 credits/mo** | 3 URL analyses, AI content gen, Basic scoring, AI summaries/Q&A/schema, Manual workflows |
| **Pro** | **$49/mo** | **50 credits** | 50 URL analyses, Site-wide Audits, Advanced AI analysis, PDF + white-label logo, Shareable links, **WP + Wix connectors**, Custom dashboards, Performance reports |
| **Agency** | **$149/mo** | **500 credits** | 3 seats, Full white-label, **Webhooks + API**, Autonomous AI Agents, Workflow automation, AI-driven reports, Anomaly detection, +$9/additional seat |

**Credit pack:** 200 credits = **$29** top-up

**Credit economics observed:**
- 1 credit = 1 URL analysis
- 3 credits = Standard simulation test run
- 0.5 credits = Custom simulation
- 1 credit = Gap analysis
- Batch sim cost = `0.5 × pages × providers × prompts` (shown inline, e.g., "Total simulations: 40, Estimated credits: 20.0")

### 2.17 Tech stack observations

- Next.js 14+ with Radix UI (`radixCollectionItem` on tabs → shadcn/ui)
- Tailwind CSS
- Server-rendered — almost zero client-side XHR (all data loads via Server Components / Server Actions)
- Audit IDs are 24-char ObjectIds → likely MongoDB backend
- Tab state on Radix primitive (same stack as Apex — easy to mirror)
- Clerk-style auth, session-bound workspace concept

---

## 3. Apex GEO — Current Feature Inventory (verified from code)

Summary of what's in `/home/hein/Workspace/ApexGEO/src/`:

### Scoring — broader framing than Gossip
- **5 Apex pillars:** SEO, GEO (Generative Engine Opt — *not* geographic), AEO, SMO, PPO + unified score (`/src/lib/scoring/`)
- Gossip's 7 LLM pillars (Verifiability/Safety/Authority/Access/Freshness/Answerability/Structure) vs our SEO-centric framing — **different vocabulary; both defensible**

### AI engine coverage — **Apex is ahead**
- **Apex: 7 adapters** — ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot (`/src/lib/ai/adapters/`)
- Gossip: 5 advertised, Claude and Copilot shipped partially

### Audit pipeline — parity
- Single URL + sitemap-based site crawl (`/src/lib/audit/`)
- Schema validation, Core Web Vitals, readability, issue detector (6 categories), answer-quality, HTML codemods, JSON-LD generators, LLMs.txt builder

### Recommendations & action plans — parity
- Priority scoring (impact/effort/urgency/confidence) in `/src/lib/recommendations/`
- Action-plan generator + templates + voice/schema/social guides

### Content generation — Apex broader
- 12+ content types via `/src/lib/sub-agents/content-generation/` including blog/FAQ/social/docs/press/how-to/listicle/comparison/case-study/landing

### Simulation Lab — Apex technically stronger
- A/B variant compare + 7-platform concurrent simulation (`/src/lib/simulation/`)

### Gap analysis — Apex narrower
- `/src/lib/ai/prompt-gap-analyzer.ts` focuses on AI-citation gaps; **no Google PAA / Reddit / Quora scraping**

### Competitor analysis — Apex ahead
- Full suite: discover, deep-dive, benchmark, snapshots, roadmap, scores (`/src/lib/competitive/`)

### Anomaly detection — parity
- Z-score + 3-sigma + rolling-window baseline (`/src/lib/mentions/anomaly-detector.ts`)

### Publishing — partial gap
- **WordPress ✓** (`/src/lib/publishing/wordpress.ts`)
- **Wix ✗**

### Platform — Apex stronger
- Public API v1 with OpenAPI spec (`/src/app/api/v1/openapi.json`)
- Outgoing + incoming webhooks
- Integration hub: Slack, Jira, Linear, Asana, GA, GSC (`/src/app/api/integrations/*`)
- Multi-brand portfolios
- Investor-grade PDF reports
- White-label branding settings per org
- PayFast billing (SA-market specific)

### Missing / weak in Apex
- ✗ **Prompt Lab** (free-form test surface)
- ✗ **Workflow Builder** (visual agent chain)
- ✗ **Wix connector**
- △ **Projects** (simple grouping; Portfolios exists but is heavier)
- △ **Quick-Fix one-click UI** (backend codemods exist, no UI)
- △ **Artifact caching + tab** (generated per request, not stored)
- △ **AI Co-pilot chat per audit** (agents exist, no dedicated chat UX seeded with audit context)
- △ **Gap-source diversity** (no Google PAA / Reddit / Quora scraping)
- △ **Custom Dashboard drag-drop** (fixed layout today)
- △ **Localization pillars** (NAP/hreflang/currency/locale scoring)
- △ **Keyword Analytics surface** (schema exists, no user-facing table)
- △ **Analysis Config determinism knobs** (temperature/seed/model selection per-user)

---

## 4. Side-by-side Feature Matrix

| # | Area | Gossip | Apex | Verdict |
|---|------|:------:|:----:|---------|
| 1 | Single-URL audit | ✓ | ✓ | Parity |
| 2 | Paste-content audit | ✓ | ? | **Verify + add** |
| 3 | Full site crawl | ✓ | ✓ | Parity |
| 4 | Scoring pillars (LLM readiness) | 7 | 5 different | Parity (different framing) |
| 5 | Scoring pillars (Localization/Geographic) | 7 | △ partial | **Gap for Apex** |
| 6 | Technical checks panel | 7 checks | ~7 | Parity |
| 7 | One-click Quick-Fix UI | **8 actions** | △ backend only | **Gap for Apex** |
| 8 | AI engines queried | 5 | **7** | **Apex leads** |
| 9 | Recommendations w/ severity | ✓ | ✓ | Parity |
| 10 | "Generate Content" button per suggestion | ✓ | △ | **Gap for Apex** |
| 11 | Content Studio | 8 types | 12+ types | **Apex leads on breadth; Gossip on UX** |
| 12 | Keyword Analytics surface | ✓ | △ schema only | **Gap for Apex** |
| 13 | Prompt Lab | ✓ | ✗ | **Gap for Apex** |
| 14 | Simulation Lab | ✓ 5 templates | ✓ A/B compare + 7 engines | **Apex leads** |
| 15 | Gap Finder multi-source | ✓ (Google/Reddit/Quora/Perp) | △ AI-citation only | **Gap for Apex** |
| 16 | AI Co-pilot chat per audit | ✓ | △ | **Gap for Apex** |
| 17 | Workflow Builder | ✓ (Agency) | ✗ | **Gap for Apex** |
| 18 | Custom Dashboard (drag-drop) | ✓ | △ | **Gap for Apex** |
| 19 | Performance Reports | ✓ | ✓ | Parity |
| 20 | Anomaly Monitor | ✓ | ✓ (z-score) | **Apex technically stronger** |
| 21 | WordPress connector | ✓ | ✓ | Parity |
| 22 | Wix connector | ✓ | ✗ | **Small gap** |
| 23 | Artifact cache + tab | ✓ | △ | **Gap for Apex** |
| 24 | Competitor comparison | ✓ | ✓ | **Apex leads on depth** |
| 25 | **Dedicated SEO section** | ✗ | ✗ (scattered) | **Mutual gap → biggest differentiator opportunity for Apex** |
| 26 | PDF export / share links | ✓ | ✓ | Parity |
| 27 | White-label branding | ✓ | ✓ | Parity |
| 28 | Multi-seat / team | ✓ (3+$9) | ✓ | Parity |
| 29 | Billing + credits | ✓ (transparent per-action) | ✓ (usage meters, less visible) | **Gap — UX, not capability** |
| 30 | Public API + webhooks | ✓ (Agency) | ✓ OpenAPI v1 | **Apex leads** |
| 31 | Integration hub (Slack/Jira/Linear/Asana/GA/GSC) | — | ✓ | **Apex leads** |
| 32 | Investor reports | — | ✓ | **Apex leads** |
| 33 | Projects grouping | ✓ | △ Portfolios | **Gap — UX, not capability** |
| 34 | Batch Simulation | ✓ | ✓ | Parity |
| 35 | Determinism config (models/seed) | ✓ | ? | **Verify + add** |
| 36 | Content-Type selector on audit | ✓ | ? | **Verify + add** |
| 37 | "Send to WordPress" button on audit | ✓ | △ | **Small gap** |
| 38 | Emoji-forward playful engine icons | ✓ | ? | Brand-voice choice |

---

## 5. Catch-Up & Leap-Ahead Roadmap

Priority is scored by **(Impact × Visibility) ÷ Effort**. Tiers are cumulative — land Tier 1 before moving to Tier 2.

### TIER 1 — Close easily visible UX gaps (2-3 sprints total)

Each of these has substantial backend already in Apex; what's missing is the UI surface.

**T1.1 — Quick-Fix panel on audit report** · *1-2 days*
- Surface `/src/lib/audit/generators/*` + `/src/lib/audit/html-codemods.ts` as 8 buttons on the audit detail page: *Add TL;DR / Add Abstract / Add FAQ / Add JSON-LD / Add Citations / Add Steps / Add Table / Date & Changelog*
- Each button opens a modal preview → confirm → writes to a new `audit_artifacts` table → shows diff

**T1.2 — Artifacts tab + cache store** · *2-3 days*
- Migrate schema: `audit_artifacts(audit_id, kind, content, generated_at)` with kinds `summary|faq|schema|citations|tldr|abstract`
- Render new "Artifacts" tab on `/dashboard/audit/[id]`
- "Regenerate" button invalidates row, re-runs generator

**T1.3 — "Generate Content" button on every recommendation** · *2 days*
- Wire each recommendation card to `/src/lib/sub-agents/content-generation/` with the recommendation text as prompt input
- Store generation + surface inline

**T1.4 — AI Co-pilot chat per audit** · *3-4 days*
- New page `/dashboard/audit/[id]/chat`
- Context pre-seeded with audit results + source URL content
- Wrap existing `/src/lib/agents/*` in streaming chat UX (Vercel AI SDK)
- Cross-link from each audit detail page's "Chat with AI Co-pilot" CTA

**T1.5 — Paste Content audit mode** · *0.5 day*
- `/api/audit` accepts `{ mode: "text", content: string, contentType: string }` instead of URL
- Adds `Content Type` dropdown to audit entry (Blog / Article / FAQ / About / Product / How-To / Case Study / Comparison / Glossary)

**T1.6 — Visible credit cost next to every action + credit balance in header** · *1 day*
- Header badge: `X credits · PLAN`
- Inline badges: `1 credit · Analyze`, `3 credits · Run Simulation`, `1 credit · Gap Scan`
- Aligns with Gossip's transparency pattern — reduces upgrade friction

**T1.7 — Projects grouping (lightweight)** · *2 days*
- New `projects` table: (id, org_id, name, color)
- Nullable `project_id` on audits/simulations
- Sidebar "Projects" entry, filter controls on Reports page
- Kept separate from heavier Portfolios concept (Portfolios = multi-brand; Projects = per-client grouping within one brand)

### TIER 2 — Build a **dedicated SEO section** (the moat move)

**This is the single biggest differentiator available.** Gossip has almost nothing on traditional SEO — all their SEO-adjacent signals are mashed into LLM pillars. A first-class SEO module puts Apex ahead on a dimension Gossip can't easily copy.

**T2.1 — New nav group: `SEO`** · *10-15 days total*
Proposed routes:
- `/dashboard/seo` — overview dashboard (SEO health score, top keywords, ranking changes, core web vitals summary)
- `/dashboard/seo/keywords` — keyword tracking table (already have schema; add UI + scheduled rank-check job)
- `/dashboard/seo/serp` — SERP tracking (integrate DataForSEO or SerpApi — budget ~$1/1K queries)
- `/dashboard/seo/technical` — robots.txt + sitemap validator, hreflang validator, canonical audit, broken-links crawler, redirect chain checker, indexability map
- `/dashboard/seo/vitals` — Core Web Vitals dashboard (LCP/INP/CLS trends — leverage existing `/src/lib/audit/core-web-vitals.ts`)
- `/dashboard/seo/schema` — schema validator (exists) + generator UI + "missing schema" opportunities
- `/dashboard/seo/backlinks` — backlink profile (integrate Ahrefs/Moz API or Common Crawl free tier)
- `/dashboard/seo/on-page` — per-URL on-page SEO scorecard (title, meta, H1, alt-text coverage, internal link depth, readability)
- `/dashboard/seo/opportunities` — ranked list of fixable SEO issues (uses existing `/src/lib/audit/issue-detector.ts`)

**Underlying stack decisions:**
- **SERP + keyword ranking:** DataForSEO API (covers 200+ locales) — budget line item, ~$50-100/mo for an MVP
- **Backlinks:** start with Common Crawl (free, batch-only) → offer Ahrefs via Agency plan
- **Technical SEO crawler:** reuse `/src/lib/audit/crawler.ts`, extend to check robots/sitemap/hreflang/canonicals/redirects/broken links
- **On-page scorecard:** extend existing `/src/lib/scoring/seo-score.ts` with expanded breakdown

**Positioning:** Market Apex as *"GEO + SEO in one"*. Gossip is pure GEO; the $100B established SEO market is still the buyer's budget line.

### TIER 3 — Add missing feature surfaces

**T3.1 — Prompt Lab** · *3-4 days*
- `/dashboard/prompt-lab` — Domain + Answer Preference + Main Question + Prompt Template
- Backend: thin wrapper over `/src/lib/ai/adapters/*`
- Save runs to history
- "Answer Preference" templates: Reputable Sources / Task Steps / JSON-LD Required / Date-Anchored / Citation-Required

**T3.2 — Keyword Analytics surface** · *3 days*
- `/dashboard/keyword-analytics`
- Per-keyword simulation success rate, coverage per provider, trend
- Drill-in to audits where keyword appeared
- Reuses existing simulation history

**T3.3 — Gap Finder multi-source expansion** · *5-7 days*
- Extend `/src/lib/ai/prompt-gap-analyzer.ts`:
  - Google PAA scraper (Playwright, or SerpApi PAA endpoint)
  - Reddit: `praw` (official API, free)
  - Quora: Playwright scraper
  - Perplexity related-questions endpoint
- Unified ranked-suggestion list with "source: Reddit / Google / Quora / Perp" badges

**T3.4 — Wix connector** · *3 days*
- Mirror `wordpress.ts` against Wix Headless API

**T3.5 — Custom Dashboard (drag-drop)** · *7-10 days*
- `react-grid-layout` + saveable layouts
- Widget catalog: KPI card / chart / recent audits / top pages / recommendations feed / competitor delta
- Reuses existing `dashboard-versions` schema

**T3.6 — Determinism & Analysis Config per user** · *2 days*
- `/dashboard/settings/analysis-config` — model per platform (GPT-4o vs 4.1 etc.), temperature, seed, cache behaviour
- Already have adapters — need UI layer + persisted prefs

### TIER 4 — Differentiate past Gossip

**T4.1 — Workflow Builder** · *14-20 days*
- ReactFlow visual builder: Audit → Generate → Publish
- Node types: Audit / Crawl / Simulate / Generate / Codemod / Publish-WP / Slack-notify / Webhook
- Backend: reuse `/src/lib/agents/*` and `/src/lib/sub-agents/*`
- **Bigger vision:** this is a Zapier/n8n clone specific to GEO/SEO — it's the "Agency plan" moat

**T4.2 — Localization pillars** · *7 days*
- Add per-URL scoring: Currency / Locale / Hreflang / NAP / Compliance / Local-listing presence / Locale-specific Perf
- New `/src/lib/scoring/localization-score.ts`
- Leverage `/src/lib/db/schema/locations.ts` (already present)
- Key for African markets + multi-region agencies

**T4.3 — Pricing revamp** · *strategy work, ~2 days*
- Mirror Gossip's transparent credit economics: Free / $49 Pro / $149 Agency / +top-up packs
- PPP-adjusted for African markets (already a stated differentiator)
- Show per-action credit costs inline
- Keep PayFast + add Stripe for non-SA buyers

**T4.4 — Send-to-WordPress CTA on audit detail** · *1 day*
- Button on every audit-detail page → pushes artifact of choice into WP draft

**T4.5 — Public marketing: "GEO + SEO unified"** · *content marketing*
- Compare page: Apex vs Gossip vs traditional SEO tools
- Lead with our 7-engine coverage (vs their 5)
- Lead with unified SEO+GEO (vs their GEO-only)

---

## 6. Suggested execution order (8 weeks to clear parity + differentiate)

```
Week 1  T1.1 Quick-Fix panel · T1.5 Paste Content · T1.6 Credit UX
Week 2  T1.2 Artifacts tab · T1.3 Generate-per-suggestion
Week 3  T1.4 AI Co-pilot chat · T1.7 Projects
Week 4  T2.1 SEO overview page · T3.1 Prompt Lab
Week 5  T2.1 SEO keywords + SERP + on-page
Week 6  T2.1 SEO technical + vitals + schema + backlinks
Week 7  T3.2 Keyword Analytics · T3.3 Gap Finder multi-source · T3.4 Wix
Week 8  T3.6 Analysis Config · T4.2 Localization pillars · T4.3 Pricing
```

Tiers 4.1 (Workflow Builder) is a 3-4 week standalone stream — run in parallel with a separate sub-team or schedule as a Q3 project.

---

## 7. Things Gossip does that we should copy in UX patterns

1. **Inline credit cost on every primary action** — `Start Batch Simulation | 20.0 credits` — extremely effective at normalizing spend
2. **"Beta" badge on experimental tool sections** — manages expectations, lets us ship faster
3. **"Soon" markers on platform adapters** — honest about what isn't live yet
4. **Content Type dropdown on audit entry** — changes downstream scoring emphasis
5. **Severity-banded recommendations** with clear "N pages affected" count
6. **"Generate Content" on every suggestion** — closes the loop from "here's what to do" to "here's the content to paste"
7. **Cached artifacts per audit** — users can re-use the FAQ/schema/TL;DR without regeneration cost
8. **Playful emoji engine icons** — softens a technical product
9. **Upsell gates with *"Upgrade to Agency"* CTA** instead of hiding features entirely — lets free users see what exists
10. **Workspace-level branding called out as a distinct settings category** — good for agencies

---

## 8. Things Apex already beats Gossip on

1. **7 AI engines** (+ Claude, Grok, DeepSeek) vs their 5 (with Claude "Soon")
2. **A/B content-variant simulation** (baseline vs enriched) — they only run single-variant simulations
3. **Multi-brand portfolios** — they have only Projects
4. **Investor reports** — specialized PDF pipeline
5. **Integration hub** (Slack/Jira/Linear/Asana/GA/GSC) — they have none
6. **Z-score-based anomaly detector** with rolling baselines — they have "Scan for Anomalies" but depth unclear
7. **OpenAPI-specced public v1 API** — they gate API on Agency
8. **Autonomous agent framework** with approval workflows
9. **PayFast for African payments** — SA-first strategy
10. **White-label client view** (`/dashboard/client`)

---

## 9. Verification addendum (live-tested 2026-04-24 on apexgeo.app)

Driven interactively against `apexgeo.app` logged in as CrankMart brand, plus DB queries against the live `apexgeo-supabase-db` container, plus code inspection of `/src/app/dashboard/*` and `/src/app/api/*`.

### V1 — Paste-content audit mode → ✗ **NOT present**

Live `/dashboard/audit` entry has a single `<input type="text" placeholder="https://example.com">` field and a `Start Audit` submit button. No tabs, no paste-content mode, no textarea. Backend `/api/audit/route.ts` only accepts a URL.

**Impact:** Users can't audit raw text (draft copy before publishing, competitor text paste, etc.) — Gossip supports this. **Effort to add:** ~0.5 day (textarea + `{ mode: 'text' }` branch in API).

### V2 — Content Type selector → ✗ **NOT present**

The audit entry shows only: URL input + Start Audit button + "What We Analyze" explainer grid (Content Structure / Technical SEO / AI Readiness / Competitor Gap). No Content Type dropdown. Gossip's dropdown primes the scoring algorithm with content-type context (Blog/Article/FAQ/About/Product/How-To/Case Study/Comparison/Glossary).

**Impact:** Scoring treats all pages identically — can't weight pillars correctly (e.g., FAQ page should weight Structure + Answerability higher; Product page should weight Schema + Freshness higher). **Effort:** ~1 day (UI + pass-through to `/lib/scoring/*` weight selector).

### V3 — Per-suggestion Generate Content → ⚠ **Wired but broken**

**What exists:**
- `src/components/audit/results/RecommendationsList.tsx:95-103` — every recommendation has a "Fix Now" button that deep-links to `/dashboard/create?context=${encoded JSON}` carrying `{ recommendation, issues, auditUrl }`
- Bottom of the list has a "Generate Content to Fix Issues" CTA linking to `/dashboard/create`

**What's broken:**
- `src/app/dashboard/create/page.tsx` does **not** read `searchParams.context` — it ignores the payload entirely and lands on the default empty content list.
- Verified live: `/dashboard/create?context={...}` lands on the generic "No Content Yet" screen with 4 content-type cards (Briefs / Articles / Landing Pages / FAQs). No pre-population, no generation trigger.

**Impact:** Every "Fix Now" click is a dead-end from the user's perspective. **Effort to fix:** ~1 day (consume `context` param → pre-fill brief form → one-click generate) — existing `/lib/sub-agents/content-generation/` infra already does the work.

### V4 — Artifact caching per audit → ✗ **NOT present**

**Live DB check:** `docker exec apexgeo-supabase-db psql -U postgres -c '\dt public.*'` — no `audit_artifacts`, `artifacts`, or equivalent caching table. Only related: `audit_shares` (share links), `recommendations` (FK to audits).

**Live audit detail check:** `/dashboard/audit/results?id=phng25losjmgodhtjaigwu5h` (CrankMart's most recent audit) — 14.9 KB of rendered content. Contains scores, pillar breakdowns, Performance Deep Dive, AI Readiness Analysis, AI Platform Visibility per engine, AI Citation Potential, LLM Content Suitability, SEO Content Analysis, Keyword Opportunities, Indexation, Backlinks, Recommendations. **But no Summary / FAQ / Schema / TL;DR / Abstract cached artifact cards anywhere.**

**Capability exists but isn't surfaced:** `/src/lib/audit/generators/*` + `/src/lib/audit/html-codemods.ts` + `/src/lib/content/faq-extractor.ts` + `/src/lib/audit/llms-txt-builder.ts` can produce these artifacts on demand — they're just not stored or rendered.

**Effort:** ~2-3 days (schema migration + generator-on-first-view + Artifacts tab on audit page).

### V5 — AI co-pilot chat on audit detail → ✗ **NOT present**

**Grep:** `grep -rln -E 'copilot|co-pilot|audit.*chat|Chat.*Audit' src/app/dashboard/audit/ src/components/audit/` → **0 matches**.

**Live audit detail page:** no chat entry point, no "Ask about this audit" button, no sidebar chat widget. Only ancillary CTAs are Share, Export, and per-recommendation Fix Now (which itself is broken per V3).

**Capability exists but unsurfaced:** `/src/lib/agents/*` (competitor-audit, content-refresh, visibility-gap-brief) and `/src/lib/sub-agents/*` — no UI binding for per-audit conversational access. No `audit_chat_sessions` table in DB.

**Effort:** ~3-4 days (new `/dashboard/audit/results/chat` component wrapping Vercel AI SDK streaming chat + inject audit context + wire to existing agents).

### V6 — Credit economics on pricing page → ✗ **NOT present**

**Live `/dashboard/settings?tab=billing`:** shows `Free / Manage Billing / Upgrade Your Plan / View Plans` and nothing else. No plan matrix, no per-action credit costs, no usage meter.

**Live `/dashboard/settings/upgrade`:** → **404** (page file exists locally at `src/app/dashboard/settings/upgrade/page.tsx` but is untracked in git and not deployed — a work-in-progress).

**Local code (`src/app/api/settings/subscription/route.ts:9-32`):**

```ts
const PLAN_LIMITS = {
  starter:      { price: 0,   brandLimit: 1,   userLimit: 3,   features: ["basic_monitoring","basic_audit"] },
  professional: { price: 49,  brandLimit: 5,   userLimit: 10,  features: ["advanced_monitoring","advanced_audit","content_creation"] },
  enterprise:   { price: 199, brandLimit: 999, userLimit: 999, features: ["api_access","white_label","dedicated_support"] },
}
```

**Live `/dashboard/usage`:** → **404** (also untracked locally — work-in-progress, fetches `/api/usage/summary` + `/history` + `/breakdown` — tracks ai_tokens, api_calls, audits, mentions_tracked).

**What this means vs Gossip:**
- Apex pricing is **feature-tier-denominated** (category flags like `advanced_audit`, `white_label`) — not credit-per-action like Gossip's transparent `1 credit/URL, 3 credits/simulation, 0.5 credits/custom test`.
- Apex hides costs in server-side usage tracking, only shown post-hoc on the (unbuilt) usage page.
- Gossip shows cost inline **before** every action ("Total simulations: 40, Estimated credits: 20.0") — demonstrably better conversion UX.

**Effort:** ~2 days to ship the already-written `/dashboard/settings/upgrade` + `/dashboard/usage` pages. ~3 more days to add a credit-cost system that computes cost per action and surfaces it inline on every primary CTA.

### Verification summary table

| # | Item | Verdict | Fix effort |
|---|------|:-------:|:---------:|
| V1 | Paste-content audit | ✗ Missing | 0.5d |
| V2 | Content Type selector | ✗ Missing | 1d |
| V3 | Per-suggestion Generate | ⚠ Wired but broken (context param ignored) | 1d |
| V4 | Artifact cache + tab | ✗ Missing (no cache table, no UI) | 2-3d |
| V5 | AI co-pilot chat on audit | ✗ Missing | 3-4d |
| V6 | Credit economics | ✗ Missing (upgrade + usage pages untracked, no per-action costs) | 2-5d |

**Total Tier 1 fix effort:** ~2 weeks to close the full gap.

### Surprising positives found during verification

1. **Apex audit detail is richer per-URL than Gossip's.** Single-page audit includes Performance Deep Dive (full CWV breakdown), AI Citation Potential with category-segmented factors (Tech/Business/Education/Health/Science), LLM Content Suitability (6 factors with example evidence), SEO Content Analysis per discovered page, Keyword Opportunities (LSI / semantic / long-tail with current-vs-target counts), Indexation Status (reasons for non-indexation), Backlink Summary with top referring domains by authority. Gossip's per-URL report is much lighter — they compensate with the 6 tabs (Overview/Suggestions/Artifacts/Simulation/Competitors/Gap Finder). **Apex's content vs Gossip's layout** — we should keep the depth, adopt the tabbed IA.

2. **Apex already renders 6 AI engines per audit** (ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok) with per-engine coverage labels + scores + "last tested" timestamps — broader than Gossip's 5 engines with Claude+Copilot still "Soon". Confirmed on CrankMart audit detail.

3. **Apex has a `/dashboard/usage` page in flight** (untracked) that pulls `/api/usage/summary + /history + /breakdown` — when shipped this covers the spend-transparency half of Gossip's credit UX (but still needs per-action pre-cost signaling).

4. **"Fix Now" UX is the single highest-leverage bug to fix** — every recommendation in every audit report has a dead-end button. Fixing this (1 day) immediately closes what Gossip does well.

### Updated Week 1 sprint plan (post-verification)

Prioritised by blast radius × effort after verification:

1. **Fix V3** — wire `/dashboard/create` to consume the `?context=` param and pre-fill + auto-generate (1 day) — **highest ROI** because every Fix Now click in the product is currently broken
2. **Ship V6 partial** — merge the untracked `src/app/dashboard/settings/upgrade/page.tsx` + `src/app/dashboard/usage/page.tsx` files to git + production (0.5 day) — already written, just not deployed
3. **Ship V1** — add textarea + paste-content mode to audit entry (0.5 day)
4. **Ship V2** — add Content Type dropdown (1 day)
5. **Begin V4** — schema migration for `audit_artifacts` + Artifacts tab component (2 days, spills into week 2)
6. **Begin V5** — AI co-pilot chat scaffold (3 days, spills into week 2)

Week 1 ships V1+V2+V3+V6 — all visible UX improvements — while the heavier V4+V5 land in week 2.

---

## 10. Files / raw research artifacts

All captured text dumps are under `/tmp/gossipmedia_research/`:
- `01-dashboard.txt` — Dashboard
- `02-audit.txt` — Audit entry
- `03-reports.txt` — Reports list
- `04-auditreport-tabs.json` — all 6 tabs of URL audit report
- `05-all-pages.json` — every tool/insight/connector/settings page
- `06-customdashboard.txt` — Custom Dashboard shell
- `07-siteaudit-detail.txt` — Site audit top-level
- `07b-siteaudit-tabs.json` — all 6 site-audit tabs including Batch Simulation config
- `08-settings-categories.json` — Settings subsections + billing
- `09-api-calls.json` + `09b-api-calls.json` — network capture (mostly SSR → little client XHR)

Keep these for the Tier 1 kickoff.
