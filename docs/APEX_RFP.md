# Apex — Request for Proposal (RFP)

**Document ID:** APEX-RFP-001
**Version:** 1.0
**Date issued:** 2026-04-18
**Target delivery:** 2027-02-01 (9.5 months — includes 2-week Sprint 0 infra migration)
**Owner:** Hein van Vuuren
**Classification:** Internal — planning artifact

---

## 1. Executive summary

### 1.1 Project

Build **Apex** — a Rolls Royce-class, white-label Generative Engine Optimization / Answer Engine Optimization (GEO/AEO) platform — to outright lead the category on 6 of 11 pillars and tie-best on 3 more, with zero pillar losses, by Q1 2027.

### 1.2 Business objective

Capture the uncontested mid-market + agency + emerging-market segment of the GEO/AEO industry. The Tier-1 competitors (Profound, Peec.ai, AthenaHQ, Goodie AI) have collectively raised >$250M but have gaps: no true white-label, no PPP pricing, no bundled MONITOR+CREATE+AUDIT, no explainable scoring, no closed-loop recommendation lift measurement. Apex fills all five simultaneously.

### 1.3 Success criteria (end-of-program)

| Metric | Target |
|---|---|
| Pillar coverage | 6 🏆 outright leads, 3 tied-best, 2 near-parity, 0 losses |
| Tier-1 feature parity | 95% of Profound's publicly-marketed features |
| Uncontested "Rolls Royce" features shipped | 5 category-firsts (see §5.12) |
| White-label agency resellers onboarded | 20+ agencies with ≥5 client tenants each |
| Platform customers (direct) | 500 brands |
| MRR | $75,000 (unlocks Phase 3 panel-data tier) |
| SOC 2 Type II | Report signed |
| GDPR / POPIA compliance | Full DPA + sub-processor list live |
| Uptime | 99.9% rolling 90-day |
| p95 dashboard load | <100 ms |

### 1.4 Investment summary

| Category | 9-month estimate |
|---|---|
| Engineering (2–3 FTE sustained) | $600k – $900k |
| Data APIs (DataForSEO, AlsoAsked, GSC ops) | ~$12k/yr at launch |
| Infrastructure (self-hosted Supabase, Upstash, Pinecone/Qdrant, Cloudflare/Vercel) | ~$18k/yr (lower — no Neon/Clerk SaaS fees) |
| SOC 2 Type II audit + Vanta-equivalent trust platform | ~$45k one-time + $15k/yr |
| Legal (DPA templates, reseller contracts, EU AI Act review) | ~$25k one-time |
| Design (premium UX, branding polish, component library) | ~$40k |
| **Total program cost (9 months)** | **~$750k – $1.1M** |
| Post-launch recurring (data + infra + compliance) | ~$90k/yr |
| Panel-data tier trigger ($75k MRR reached) | +$75k–$200k/yr |

### 1.5 Prior-art reference

All competitive research, feature gap analysis, and prioritisation rationale lives in:
- `docs/COMPETITIVE_FEATURE_GAP_ANALYSIS.md` (full gap + roadmap)
- `/home/hein/.claude/history/research/2026-04-18_geo-aeo-competitors/research-report.md` (12-agent competitive research)
- `app_spec.txt` (original project specification)
- `docs/APEX_DESIGN_SYSTEM.md` (visual design single-source-of-truth)

---

## 2. Background & context

### 2.1 Market

The GEO/AEO market is mid-consolidation. Profound ($1B valuation, $96M Series C Feb 2026) leads top-enterprise; Peec.ai owns European SMB; AthenaHQ owns e-commerce; Goodie AI leads on LLM breadth. SEO giants (Semrush, Ahrefs, Moz) have bolted on ~40–50% of a dedicated GEO tool but independent tests show 40×+ undercounts. Open-source is immature — the best OSS project is ~70% of a GEO platform and still relies on paid scraping infra.

### 2.2 Target customers (ranked)

| Segment | Volume | Price point | Notes |
|---|---|---|---|
| **Marketing agencies (primary ICP)** | ~2,000 potential in SA/EU/UK | $299 Agency + client seats | White-label + sub-billing is the wedge |
| **African market SMB/mid-market** | ~10,000 serviceable | $39–$129 PPP tier | Uncontested — no competitor targets this |
| **Global mid-market direct** | ~50,000 serviceable | $129–$299 | Priced 30–50% below Profound/Athena |
| **Enterprise (>1,000 employees)** | ~5,000 serviceable | $999–$2,999 + custom | Requires SOC 2, SAML, data residency |

### 2.3 Out-of-scope (explicit)

- Detector-bypass / "undetectable" AI tools — reputational liability, regulatory headwind (EU AI Act Art. 50)
- Own SERP index — Ahrefs/Semrush moat is 20 years deep
- Native mobile apps (iOS/Android binaries) — PWA-first; native at 100k MAU
- Paid-Plus account pool scraping — ToS-risky, requires legal sign-off
- Adobe/Mixpanel analytics connectors — wait for explicit enterprise demand
- Own clickstream panel at launch — license panel data at $75k MRR trigger

---

## 3. Scope of work

### 3.1 In-scope deliverables

1. Functional build of all P0 and P1 requirements in §5
2. Non-functional conformance to all requirements in §6
3. Technical architecture per §7
4. Full test coverage per §8
5. Deployment & operational runbooks
6. Customer-facing documentation (API docs, help center, video walkthroughs)
7. Sales/marketing collateral tied to feature ship dates
8. SOC 2 Type II readiness + audit (kickoff Sprint 4, close by Sprint 6)

### 3.2 Dependencies & assumptions

- Existing Apex codebase (Next.js 14, TypeScript, BullMQ, Pinecone, Browserless) is the baseline — migrating Neon → self-hosted Supabase Postgres and Clerk → Supabase Auth as a prerequisite for Sprint 1
- Self-hosted Supabase runs on the same server as the application; Drizzle ORM is retained as the query layer on top of Supabase Postgres
- Anthropic, OpenAI, xAI, DeepSeek, Gemini API access (commercial tier) will be funded
- PageSpeed Insights (Google) remains free with 25k/day quota
- DataForSEO AI Optimization API access ($300–$800/mo depending on volume)
- Cloudflare and/or Vercel Edge infra for geo-distributed scraping
- Legal counsel available for EU AI Act Article 50, GDPR DPA, reseller contracts, ToS for scraping

---

## 4. Requirement notation

**Format:** `<TYPE>-<PILLAR>-<NUMBER>` e.g. `FR-MON-014`

**Types:**
- `FR` — Functional Requirement
- `NFR` — Non-Functional Requirement
- `TR` — Technical Requirement
- `DR` — Data Requirement

**Pillars:**
- `MON` Monitor · `CRE` Create · `AUD` Audit · `REC` Recommendations
- `ATT` Attribution · `AGT` Agents · `PRV` Prompt Volumes · `INT` Intelligence
- `ITG` Integrations · `AGY` Agency/White-label · `API` Developer platform
- `PER` Performance · `SEC` Security · `CMP` Compliance · `AVL` Availability
- `UX` User experience · `OBS` Observability · `ARC` Architecture

**Priority:**
- **P0** — launch blocker; contractual
- **P1** — required for feature parity with Tier-1 competitors
- **P2** — differentiator; "Rolls Royce" marker
- **P3** — nice-to-have; post-launch

**Acceptance criterion:** Each requirement includes a testable acceptance criterion. "Done" = AC verified in integration/E2E test + visual QA.

---

## 5. Functional requirements

### 5.1 MONITOR — Multi-LLM visibility tracking

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-MON-001 | Query ChatGPT (gpt-5 + gpt-4o) via official OpenAI API | P0 | Test: 10 canned prompts return non-null responses, logged to DB |
| FR-MON-002 | Query Claude (Opus 4.7 + Sonnet 4.6) via Anthropic API | P0 | As above |
| FR-MON-003 | Query Gemini (2.5 Pro + 2.5 Flash) via Google AI Studio API | P0 | As above |
| FR-MON-004 | Query Perplexity via Perplexity API | P0 | As above |
| FR-MON-005 | Query Grok via xAI API | P0 | xAI API key wired in `.env.example` and production; 10 prompts return responses |
| FR-MON-006 | Query DeepSeek via DeepSeek API (single-turn) | P0 | As above |
| FR-MON-007 | Query Microsoft Copilot via available API or UI scrape | P1 | 10 prompts return responses |
| FR-MON-008 | Query Google AI Overviews via SerpAPI or equivalent | P1 | AIO text extracted for 10 queries across 3 geos |
| FR-MON-009 | Query Google AI Mode via same path as AI Overviews | P1 | 10 prompts return responses |
| FR-MON-010 | Query Meta AI via official API or UI scrape | P2 | 10 prompts return responses |
| FR-MON-011 | Query Amazon Rufus (if API available) | P3 | Spike 1 week — defer if API not available |
| FR-MON-012 | Query ChatGPT Search (web-enabled / SearchGPT) separately from base GPT | P1 | Distinct response archive vs FR-MON-001 |
| FR-MON-013 | Parallel fan-out across all enabled LLMs for single prompt | P0 | p50 full-fan-out latency <60s for 10 LLMs |
| FR-MON-014 | N-runs averaging (configurable N=3/5/10) with variance reporting | P1 🏆 | UI shows score ±σ; confidence interval narrows as N increases |
| FR-MON-015 | Confidence intervals published on every metric | P2 🏆 | Every numeric score in UI has CI95 band |
| FR-MON-016 | Geo-distributed scraping endpoints: SA, EU, US, UK at minimum | P1 | Response archives tagged with origin region; measurable answer-diff by region |
| FR-MON-017 | Residential proxy rotation for UI-scraped LLMs | P1 | No consecutive same-IP within 1-hour window |
| FR-MON-018 | Browser session persistence (cookies, local storage) per persona | P1 | Multi-turn ChatGPT conversations preserve context across runs |
| FR-MON-019 | Rate-limit-aware scheduling (BullMQ + per-provider budgets) | P1 | No 429s across 24h with 10k-query volume |
| FR-MON-020 | Prompt library versioning (Langfuse) | P1 | Every prompt has v1/v2/v3 history with diff view |
| FR-MON-021 | NER-based brand mention detection (Microsoft Presidio) | P0 | False-positive rate <5% on ambiguous-brand test corpus |
| FR-MON-022 | Fuzzy entity resolution (aliases, misspellings) via Qdrant embeddings | P0 | "MSFT" and "Microsoft" collapse to one brand entity |
| FR-MON-023 | Competitor extraction from same prompt response | P0 | Extract top 5 competitor mentions per prompt per LLM |
| FR-MON-024 | Citation URL extraction + domain-quality scoring | P1 | Every response stores citation URLs + DR/authority score |
| FR-MON-025 | Sentiment analysis (pos/neutral/neg) + reasoning quote | P1 🎯 | Every mention has sentiment label + evidence span |
| FR-MON-026 | Cross-platform consistency score (how consistent is the answer across LLMs?) | P2 🏆 | Single score 0–100 per brand per prompt per day |
| FR-MON-027 | Time-series storage of all scores | P0 | `geo_scores` retains 2 years of daily snapshots |
| FR-MON-028 | 7/30/90-day trend views + YoY + custom ranges | P1 | UI charts with drillable periods |
| FR-MON-029 | Anomaly detection (brand drop, competitor surge, sentiment spike) | P1 🎯 | 3σ threshold fires alerts within 1hr of detection |
| FR-MON-030 | Alert delivery: email, Slack, Teams, webhook, in-app | P1 🎯 | All 5 channels tested with sample alert |
| FR-MON-031 | Alert digest daily/weekly email | P1 | Opt-in; renders HTML + plain-text fallback |
| FR-MON-032 | AI crawler robots.txt detection (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot) | P0 | Detects presence + rules for all 5+ bots |
| FR-MON-033 | Server-side log ingestion for AI bot hits (Cloudflare Logpush, Vercel Edge logs) | P2 🎯 | Per-page bot-hit count over last 30 days |
| FR-MON-034 | Real-time WebSocket stream of answer-diff events | P2 🏆 | Subscribe to `brand:*:prompt:*` and receive events within 60s of detection |

### 5.2 CREATE — AI-optimized content

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-CRE-001 | Dual-model generation (Claude Opus 4.7 + GPT-5) with streaming | P0 | Streaming tokens appear within 500ms of submit |
| FR-CRE-002 | Brand voice training from 1–5 uploaded writing samples | P0 | Generated drafts score ≥0.8 cosine similarity to sample corpus |
| FR-CRE-003 | Brand data integration — upload PDFs/URLs/docs as context | P1 | RAG pipeline retrieves relevant chunks with citation |
| FR-CRE-004 | AEO-focused content brief (H-structure, FAQ, schema hints, competitor angles) | P1 | Brief generated in <30s for any prompt |
| FR-CRE-005 | Outline generation (H1/H2/H3 tree with talking points) | P1 | Outline downloadable as Markdown |
| FR-CRE-006 | Full draft generation from brief | P0 | 800–2000 word drafts in <60s |
| FR-CRE-007 | FAQ generator (AEO schema-ready, 5–10 Q&A) | P1 🎯 | JSON-LD output validates against schema.org/FAQPage |
| FR-CRE-008 | JSON-LD / schema.org auto-insert in draft | P1 🎯 | Draft contains valid Article + Organization + FAQPage schemas |
| FR-CRE-009 | llms.txt auto-generation from brand data | P2 🏆 | Valid llms.txt per AnswerDotAI spec |
| FR-CRE-010 | Q&A block formatting (AEO-optimized answer structure) | P1 | Q followed by 1–2 sentence direct answer |
| FR-CRE-011 | **Editorial Polish** (brand voice + cliché removal + burstiness + readability) — NEVER as "detector bypass" | P1 | Polished draft scores higher Flesch-Kincaid + passes E-E-A-T checklist |
| FR-CRE-012 | Multi-language support (en, fr, es, de, pt, sw, zu, af) | P2 🎯 | Same brief produces brand-voice-consistent draft in target language |
| FR-CRE-013 | Citation/source suggestion with quality ranking | P1 🎯 | Suggested citations ranked by domain authority |
| FR-CRE-014 | MONITOR → CREATE loop — "you lost citation share on prompt X, here's the brief" | P0 🏆 | One-click: monitor gap → generated brief with context preserved |
| FR-CRE-015 | Content calendar + scheduling | P2 | Cron-scheduled drafts, approval queue |
| FR-CRE-016 | Collaborative editing (multi-user, comments, suggestions) | P2 | 2 users edit same draft, changes merge without loss |
| FR-CRE-017 | Direct publish: Shopify (blog + product description) | P1 🎯 | OAuth flow + one-click publish |
| FR-CRE-018 | Direct publish: WordPress (REST API) | P1 🎯 | OAuth/app-password + one-click publish |
| FR-CRE-019 | Direct publish: Webflow CMS | P2 | OAuth + one-click publish |
| FR-CRE-020 | Direct publish: HubSpot CMS | P2 | OAuth + one-click publish |
| FR-CRE-021 | Export: Markdown, HTML, Google Docs | P1 | All three render correctly |
| FR-CRE-022 | Plagiarism/fact-check pass (Copyleaks API or equivalent) | P2 | Flag claims without citation; flag >80% match |
| FR-CRE-023 | A/B test generator (two variants of same draft) | P3 | Generate 2 variants, track citations per variant |

### 5.3 AUDIT — Technical site + AI readiness

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-AUD-001 | Core Web Vitals via Google PSI API (LCP, INP, CLS, FCP, TBT, SI) | P0 ✅ | Already shipping; retain honest-empty fallback |
| FR-AUD-002 | Bulk site-wide Lighthouse via Unlighthouse (beyond PSI 25k/day quota) | P1 🏆 | Full-site crawl up to 1000 URLs; diff against prior run |
| FR-AUD-003 | Per-page CWV history (not just domain-level) | P1 🏆 | Individual URL trend over 90 days |
| FR-AUD-004 | CrUX field data integration | P1 🎯 | Real user metrics alongside lab metrics |
| FR-AUD-005 | Mobile vs desktop breakdown | P1 | Both reports generated per audit |
| FR-AUD-006 | JavaScript rendering check for AI crawlers (do crawlers see content?) | P1 🎯 | User-agent spoofed test per crawler; note what's visible |
| FR-AUD-007 | AI readiness weighted score (schema 25 + structure 25 + clarity 20 + metadata 15 + accessibility 15) | P0 ✅ | Already shipping |
| FR-AUD-008 | Schema.org validation per page (Article, Product, FAQPage, Organization, BreadcrumbList) | P1 | schema-dts + structured-data-testing-tool |
| FR-AUD-009 | llms.txt detection + validation | P1 🏆 | Parse + validate against spec; flag missing fields |
| FR-AUD-010 | robots.txt AI crawler rules (with traffic share per bot) | P0 ✅ | Already shipping — 5 bots tracked |
| FR-AUD-011 | Structured data completeness per page-type | P1 | "Blog post missing `author` field on 12 pages" |
| FR-AUD-012 | E-E-A-T signals audit (author bio, expertise citations, first-hand examples) | P2 🎯 | Flag pages missing E-E-A-T components |
| FR-AUD-013 | Content structure analysis (headings, Q&A, FAQ blocks, lists) | P1 | Per-page structure score 0–100 |
| FR-AUD-014 | Readability / LLM clarity (sentence length, paragraph length, passive voice) | P1 | Flesch-Kincaid + custom "LLM clarity" metric |
| FR-AUD-015 | Answer-quality score — is this page a good answer to a prompt? | P2 🎯 | Shadow LLM eval returns 0–100 |
| FR-AUD-016 | Internal linking graph analysis (orphan pages, hub pages) | P2 🎯 | Visualize link graph; flag orphans |
| FR-AUD-017 | Hreflang / multi-region audit | P2 | Detect mismatched hreflang pairs |
| FR-AUD-018 | Canonical / duplicate content detection | P1 🎯 | Flag pages with duplicate titles, descriptions, canonical mismatches |
| FR-AUD-019 | Sitemap coverage audit (every URL indexed?) | P1 🎯 | Diff sitemap.xml against crawled URLs + GSC |
| FR-AUD-020 | Accessibility (WCAG 2.2 AA basics) | P1 ✅ | axe-core integrated |

### 5.4 RECOMMENDATIONS — Smart Recommendations Engine

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-REC-001 | Auto-generate from audit signals | P0 ✅ | Already shipping |
| FR-REC-002 | Priority scoring (P0/P1/P2/P3) | P0 ✅ | Already shipping |
| FR-REC-003 | Impact + effort estimate per recommendation | P0 ✅ | Already shipping |
| FR-REC-004 | Confidence score (0–100) per recommendation | P0 ✅ | Already shipping |
| FR-REC-005 | Evidence / reasoning transparency (expandable "why?") | P1 🏆 | Click any rec → see signals used + formula |
| FR-REC-006 | Task assignment (to user) + due-date scheduling | P1 | Assigned user gets notification; shown in calendar view |
| FR-REC-007 | Completion tracking + lift measurement (did score move after fix?) | P1 🏆 | 30-day post-completion delta shown per recommendation |
| FR-REC-008 | Integration with Jira, Linear, Asana | P1 🎯 | One-click "push to Linear" creates issue with recommendation context |
| FR-REC-009 | Competitor-gap recommendations (their content, not ours) | P1 🎯 | "Competitor X is cited for prompt Y — write about this topic" |
| FR-REC-010 | Trend-based recommendations (your score is falling on prompt cluster Z) | P2 🏆 | Auto-suggest response to declining trends |
| FR-REC-011 | MONITOR → CREATE recommendations handoff | P0 🏆 | Rec "Fix citation gap on prompt X" → one-click brief generation |
| FR-REC-012 | Recommendation grouping / batching (reduce 50 recs to 5 themes) | P2 | User sees 5 themes, expand to see 50 atomic actions |
| FR-REC-013 | ROI modeling — projected $ impact + realized $ impact | P2 🏆 | "Complete this rec → projected +$1,200/mo; realized +$1,450 after 30d" |
| FR-REC-014 | Dismissal reasoning capture + learning | P3 | Ask why dismissed; use to improve future recs |

### 5.5 ATTRIBUTION — Revenue & traffic correlation

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-ATT-001 | GA4 integration (OAuth, Measurement Protocol, BigQuery export) | P0 🎯 | Pulls sessions, conversions per landing page |
| FR-ATT-002 | Google Search Console integration | P0 🎯 | Pulls impressions, clicks, queries per URL |
| FR-ATT-003 | Shopify sales integration (Storefront + Admin APIs) | P1 | Pulls orders by landing-page referral |
| FR-ATT-004 | Citation → session funnel attribution | P2 🏆 | "ChatGPT cited you for X → 47 sessions → 3 conversions → $890 revenue" |
| FR-ATT-005 | Revenue per prompt / revenue per citation | P2 🎯 | Dashboard shows $/prompt ranking |
| FR-ATT-006 | UTM-based attribution pipeline | P1 🎯 | Auto-UTM recommended content; track it |
| FR-ATT-007 | Server-side event tracking (for cookie-less attribution) | P2 | GTM server-side container or equivalent |
| FR-ATT-008 | Cohort analysis (sessions acquired from AI → retention) | P3 | 30/60/90-day retention curves |
| FR-ATT-009 | ROI dashboard (program-wide attribution summary) | P1 🎯 | Single view: $ from AI across all clients/brands |

### 5.6 AGENTS — Apex Agents (autonomous actions)

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-AGT-001 | **Visibility Gap → Brief Agent** (flagship) | P1 | Detects <20% citation prompts → generates brief → approval queue → publish draft |
| FR-AGT-002 | **Competitor Audit Agent** (monthly) | P1 | Monthly run diffs top 3 competitors' GEO/content vs. last month |
| FR-AGT-003 | **Content Refresh Agent** (monitors declining pages) | P1 | Flags declining share-of-voice → suggests targeted updates |
| FR-AGT-004 | Approval-gated run queue (never auto-publish without human approval) | P0 | No agent output reaches external system without explicit "approve" action |
| FR-AGT-005 | Run history + telemetry (tokens used, cost, duration, outcomes) | P1 | Every agent run logged with full replay |
| FR-AGT-006 | Built on Claude Agent SDK (deepest MCP story, TS-native) | P1 | SDK version pinned; upgrade plan documented |
| FR-AGT-007 | Rate-limit-aware per tenant | P1 | Per-tenant token/run budgets |
| FR-AGT-008 | Agent marketplace / templates (v2, post-launch) | P3 | Defer unless customers demand |
| FR-AGT-009 | Drag-drop workflow builder (v2+, post-launch) | P3 | Defer; ship fixed agents first |

### 5.7 PROMPT INTELLIGENCE — Prompt Volumes (phased)

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-PRV-001 | DataForSEO AI Optimization API integration (ChatGPT + Gemini volume) | P1 | Pull keyword-level volume + 12mo trend per client industry |
| FR-PRV-002 | GSC query-level ingestion per client domain | P0 🎯 | Pulls top 10k queries per client |
| FR-PRV-003 | AlsoAsked PAA mining integration | P1 | PAA questions per seed query |
| FR-PRV-004 | LMSYS-Chat-1M + WildChat-1M corpus ingest for industry clustering | P1 | 2M real prompts clustered into industries |
| FR-PRV-005 | Reddit / Quora question mining (via DataForSEO SERP) | P2 | Long-tail questions per vertical |
| FR-PRV-006 | LLM-synthesized prompt expansion (GPT-5 brainstorms long-tail) | P2 | Calibrated against real volumes |
| FR-PRV-007 | 1–5 volume score bands (Peec-style — no fake exact numbers) | P1 🏆 | Score framing: "High / Moderate / Low" with source data |
| FR-PRV-008 | Topic/theme clustering (embed → HDBSCAN or similar) | P1 | User sees 20 topic clusters per industry |
| FR-PRV-009 | Intent classification (informational / transactional / navigational / comparison) | P2 | Per-prompt intent label |
| FR-PRV-010 | **Phase 3: Similarweb/Datos panel license** (triggered at $75k MRR) | P3 | Contract signed, panel data integrated, session-level follow-up turns |

### 5.8 INTELLIGENCE — Premium analytics surfaces

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-INT-001 | **Explainable score decomposition** — show the math per score | P2 🏆 | Every aggregate score has per-factor breakdown + evidence |
| FR-INT-002 | **What-if simulator** — predict score delta before publishing | P2 🏆 | "Add this FAQ → predicted +8 score points" with confidence |
| FR-INT-003 | **Peer benchmarking panel** (anonymized, opt-in) | P3 🏆 | "Rank 12th of 47 in your vertical" |
| FR-INT-004 | **Ask-your-data NL query** — natural language over metrics | P2 🎯 | "Show me prompts where we're losing share to competitor X" returns correct result |
| FR-INT-005 | Vertical benchmarks (bootstrapped from public-web scrape initially) | P2 | Median peer score per vertical |

### 5.9 INTEGRATIONS

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-ITG-001 | Slack — alerts + digest | P1 🎯 | OAuth app, message delivery tested |
| FR-ITG-002 | Microsoft Teams — alerts | P1 🎯 | App registered, webhook delivery tested |
| FR-ITG-003 | WhatsApp Business — alerts (SA market advantage) | P2 🏆 | WhatsApp Cloud API tested |
| FR-ITG-004 | Zapier — event-trigger integration (5000+ downstream apps) | P1 🎯 | Zapier app published, 3 triggers + 3 actions |
| FR-ITG-005 | Make.com integration | P1 | App published |
| FR-ITG-006 | n8n integration (self-host audience) | P2 🏆 | Community node published |
| FR-ITG-007 | Jira — push recommendation as issue | P1 🎯 | OAuth + field mapping |
| FR-ITG-008 | Linear — push recommendation as issue | P1 🎯 | OAuth + field mapping |
| FR-ITG-009 | Asana — push recommendation as task | P2 | OAuth + task creation |
| FR-ITG-010 | Looker Studio — community connector | P1 🎯 | Connector published + documented |
| FR-ITG-011 | Tableau / Power BI — data source | P2 | Documented connection pattern |
| FR-ITG-012 | HubSpot CRM — activity timeline integration | P2 | Contact timeline shows Apex events |
| FR-ITG-013 | Salesforce — activity integration | P2 | AppExchange listing |

### 5.10 AGENCY / WHITE-LABEL

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-AGY-001 | Per-tenant brand (logo, colors, favicon) | P0 ✅ | Already shipping |
| FR-AGY-002 | Per-tenant custom domain (`*.agency.com` or apex subdomain) | P1 | DNS + SSL auto-provisioned |
| FR-AGY-003 | Branded email templates with agency sender domain | P1 🎯 | Domain-authenticated sending (SPF/DKIM) |
| FR-AGY-004 | Multi-client sub-brand dashboards (agency sees rollup) | P1 🎯 | One agency → N clients → N brands per client |
| FR-AGY-005 | Client portal (view-only) access per brand | P1 🎯 | Client user has scoped read-only access |
| FR-AGY-006 | Agency → client billing passthrough | P2 🏆 | Stripe Connect + Metronome metering |
| FR-AGY-007 | Agency pricing tier (unlimited clients) | P1 🎯 | Billing plan exists in Stripe |
| FR-AGY-008 | White-label PDF report templates | P1 🎯 | Branded PDF from any dashboard |
| FR-AGY-009 | Client onboarding flow (agency creates client in <5 min) | P1 | Onboarding wizard tested |
| FR-AGY-010 | Usage/billing reports per client (for agency) | P1 | Monthly PDF per client |
| FR-AGY-011 | **Embeddable iframe widgets** for client reports | P2 🏆 | `<iframe src="apex.com/embed/score?token=...">` renders correctly |
| FR-AGY-012 | Signed-URL client reports (no-login share) | P1 | Time-limited link grants read access |
| FR-AGY-013 | Reseller commission tracking | P3 🏆 | Per-agency dashboard of own-revenue + commissions earned |
| FR-AGY-014 | Data export per client (GDPR right-to-portability) | P2 | JSON export of all client data |

### 5.11 DEVELOPER PLATFORM / API

| ID | Requirement | Priority | Acceptance criterion |
|---|---|---|---|
| FR-API-001 | Public REST API (v1) with OpenAPI 3.1 spec | P0 🎯 | Spec published; 95% of UI capabilities exposed |
| FR-API-002 | API key management (per-tenant, scoped, rotation) | P0 | UI for create/revoke/rotate keys |
| FR-API-003 | Rate limiting per key (configurable per tier) | P0 | Tier quotas enforced; 429s returned |
| FR-API-004 | Webhooks for all major events (score changes, recs, alerts, audit completions) | P1 🎯 | HMAC-signed webhooks, retry policy |
| FR-API-005 | GraphQL API | P2 | Schema introspection, query UI |
| FR-API-006 | TypeScript SDK (`@apex/sdk`) | P2 | npm-published, typed |
| FR-API-007 | Python SDK | P2 | PyPI-published, typed |
| FR-API-008 | Go SDK | P3 | Generated from OpenAPI |
| FR-API-009 | Terraform provider (`apex_tenant`, `apex_brand`, `apex_prompt`) | P2 🏆 | Published to Terraform Registry |
| FR-API-010 | **Public MCP server** — users query Apex from Claude/ChatGPT | P2 🏆 | MCP endpoint live; top 20 queries tested |
| FR-API-011 | Postman collection | P1 | Published workspace |
| FR-API-012 | CLI (`apex` binary) | P3 | Homebrew + npm install |

### 5.12 Category-leading innovations (5 🏆)

Restate as dedicated priority surfaces:

| ID | Feature | Priority | Source |
|---|---|---|---|
| FR-INT-001 | Explainable score decomposition | P2 🏆 | §5.8 / FR-INT-001 |
| FR-INT-002 | What-if simulator | P2 🏆 | §5.8 / FR-INT-002 |
| FR-MON-034 | Real-time answer-diff WebSocket stream | P2 🏆 | §5.1 / FR-MON-034 |
| FR-REC-013 | Revenue-attributed recommendation ROI | P2 🏆 | §5.4 / FR-REC-013 |
| FR-INT-003 | Peer benchmarking panel (anonymized) | P3 🏆 | §5.8 / FR-INT-003 |

---

## 6. Non-functional requirements

### 6.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PER-001 | Dashboard p95 load time | <100 ms (Linear/Superhuman tier) |
| NFR-PER-002 | Dashboard p99 load time | <300 ms |
| NFR-PER-003 | API p95 response | <200 ms |
| NFR-PER-004 | LLM fan-out p50 (10 LLMs, 1 prompt) | <60 s |
| NFR-PER-005 | Full audit p95 | <10 min for 1000-URL site |
| NFR-PER-006 | Content draft generation p50 | <60 s |
| NFR-PER-007 | Cmd+K command palette response | <30 ms keystroke-to-result |
| NFR-PER-008 | Real-time answer-diff stream latency | <5 s from source to client |

### 6.2 Security

| ID | Requirement | Acceptance |
|---|---|---|
| NFR-SEC-001 | All data encrypted at rest (Postgres LUKS/pgcrypto on server + R2/S3 SSE) | Storage-level encryption verified |
| NFR-SEC-002 | All data in transit via TLS 1.3 | HSTS preload, A+ SSL Labs rating |
| NFR-SEC-003 | Row-Level Security enforced on every tenant-scoped table | RLS policies applied; negative test case fails correctly |
| NFR-SEC-004 | Supabase Auth + API-key auth with per-tenant scoping | Cross-tenant access test fails |
| NFR-SEC-005 | SSO (Google, Microsoft, Okta via Supabase Auth + GoTrue providers) | 3 providers tested |
| NFR-SEC-006 | SAML 2.0 for enterprise tier | 1 sandbox SAML IdP tested |
| NFR-SEC-007 | SCIM 2.0 provisioning for enterprise | Okta SCIM tested |
| NFR-SEC-008 | MFA enforced on admin + owner roles | Test: admin login without MFA fails |
| NFR-SEC-009 | Audit log of every state-change action | 100% coverage of create/update/delete |
| NFR-SEC-010 | Security-headers (CSP, X-Frame-Options, Referrer-Policy) | securityheaders.com A rating |
| NFR-SEC-011 | Dependency scanning (Snyk, Dependabot) | No high/critical CVEs unpatched >7 days |
| NFR-SEC-012 | Quarterly penetration test | External pentest report filed |
| NFR-SEC-013 | Bug bounty program (public) | HackerOne or equivalent live |
| NFR-SEC-014 | Secrets management (never in code; Vault/Doppler) | Git-secrets CI check passes |
| NFR-SEC-015 | Rate limiting (per-tenant, per-endpoint) | 429s emitted over quota |
| NFR-SEC-016 | DDoS protection (Cloudflare Enterprise) | Attack-simulation test passes |

### 6.3 Compliance

| ID | Requirement | Target date |
|---|---|---|
| NFR-CMP-001 | SOC 2 Type II audit | Kickoff Sprint 4, signed by Sprint 6 |
| NFR-CMP-002 | GDPR compliance (DPA, sub-processor list, DSR flows) | Sprint 2 |
| NFR-CMP-003 | POPIA (South Africa) compliance | Sprint 2 |
| NFR-CMP-004 | EU AI Act Article 50 disclosure (AI-generated content watermark/metadata) | Sprint 3 |
| NFR-CMP-005 | CCPA (California) compliance | Sprint 3 |
| NFR-CMP-006 | ISO 27001 readiness | Post-launch Q2 2027 |
| NFR-CMP-007 | Right-to-erasure + right-to-portability flows | UI + API both tested |
| NFR-CMP-008 | Cookie consent (EU + CA) | Cookiebot or equivalent integrated |
| NFR-CMP-009 | Trust Center UI — downloadable policies in-app | `/trust` route live |
| NFR-CMP-010 | Data Residency selector (EU, US, ZA) at workspace creation | 3 regions offered; data doesn't leave region |

### 6.4 Availability & reliability

| ID | Requirement | Target |
|---|---|---|
| NFR-AVL-001 | Uptime SLA | 99.9% rolling 90-day (max 43 min downtime/month) |
| NFR-AVL-002 | RPO (recovery point objective) | ≤15 min |
| NFR-AVL-003 | RTO (recovery time objective) | ≤1 hour |
| NFR-AVL-004 | Daily Postgres backups + 30-day retention | Automated + restore tested monthly |
| NFR-AVL-005 | Multi-region failover capable | Failover runbook tested quarterly |
| NFR-AVL-006 | Public status page (status.apex.com) | 90-day incident history visible |
| NFR-AVL-007 | Incident postmortems published within 5 business days | Last 12 months visible on trust page |

### 6.5 User experience / premium feel

| ID | Requirement | Acceptance |
|---|---|---|
| NFR-UX-001 | Cmd+K command palette with fuzzy search across entities | <30ms response; all entities searchable |
| NFR-UX-002 | Optimistic UI (state updates before server confirms) | Mutation feels instant; reconciliation on error |
| NFR-UX-003 | Keyboard-first navigation (J/K/Enter/Esc throughout) | All primary actions keyboard-accessible |
| NFR-UX-004 | Dark + Light themes (per tenant configurable) | Both render correctly, no hardcoded colors |
| NFR-UX-005 | Design-system compliance (per APEX_DESIGN_SYSTEM.md v4.0) | No hex colors in components; only var() |
| NFR-UX-006 | Honest empty states (no fabricated data, no zero-fills) | PSI fail → "insufficient data", never "0" |
| NFR-UX-007 | Loading skeletons (no blank flashes) | Every route has skeleton within 100ms |
| NFR-UX-008 | Error boundaries + graceful degradation | Component error doesn't crash page |
| NFR-UX-009 | Accessibility WCAG 2.2 AA | axe-core passes; screen-reader tested |
| NFR-UX-010 | PWA with offline read-only support | Install prompt; 7-day offline data cache |
| NFR-UX-011 | Push notifications for visibility drops (PWA) | Web Push API integrated |

### 6.6 Observability

| ID | Requirement | Acceptance |
|---|---|---|
| NFR-OBS-001 | All LLM calls traced via Langfuse | 100% coverage; replayable |
| NFR-OBS-002 | Application errors tracked in Sentry | Source-mapped stack traces |
| NFR-OBS-003 | Structured logs (JSON) to centralized aggregator | Queryable in Grafana Loki or equivalent |
| NFR-OBS-004 | OpenTelemetry spans for all HTTP + DB + LLM | Traces in Grafana Tempo or equivalent |
| NFR-OBS-005 | Custom business metrics (MRR, active tenants, alerts delivered) | Dashboard built |
| NFR-OBS-006 | Alerting on error rate, p95 latency, queue depth | PagerDuty / Opsgenie integrated |
| NFR-OBS-007 | Customer-facing usage metrics (in-UI) | Per-tenant quota consumption visible |

---

## 7. Technical architecture requirements

### 7.1 Stack (existing baseline — retain)

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ App Router, TypeScript strict, Tailwind + Shadcn/ui |
| State | Zustand (client) + TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Backend | Next.js API Routes (App Router) |
| Database | Self-hosted Supabase Postgres (on-server, Docker) + Drizzle ORM |
| Cache | Upstash Redis |
| Queue | BullMQ |
| Vector | Pinecone (migrate to Qdrant self-host at $30k MRR) |
| Auth | Supabase Auth / GoTrue (multi-tenant orgs via Postgres RLS) |
| Storage | Supabase Storage (S3-compatible, self-hosted) |
| Realtime | Supabase Realtime (for answer-diff WebSocket stream FR-MON-034) |
| LLM observability | **ADD Langfuse (self-host)** |
| LLM routing | **ADD LiteLLM (self-host proxy)** |
| Scraping | Playwright + Browserless + **ADD Crawl4AI** |
| Deployment | Vercel (primary) + Cloudflare Workers (edge scraping) |
| CDN | Vercel Edge Network + Cloudflare |
| Monitoring | Sentry + OpenTelemetry (Grafana stack) |

### 7.2 New architectural components

| ID | Requirement | Priority |
|---|---|---|
| TR-ARC-000 | **Self-hosted Supabase stack** on-server (Postgres, GoTrue Auth, Storage, Realtime, Edge Functions, Studio) via official docker-compose | P0 |
| TR-ARC-001 | Langfuse self-hosted for every LLM call | P0 |
| TR-ARC-002 | LiteLLM proxy for provider routing + budgets | P0 |
| TR-ARC-003 | Crawl4AI for AI-friendly scraping (cheaper than Browserless) | P1 |
| TR-ARC-004 | Unlighthouse for bulk audit (bypass PSI quota) | P1 |
| TR-ARC-005 | SearXNG sidecar for SERP context (optional, AGPL caveat) | P2 |
| TR-ARC-006 | Qdrant self-host migration from Pinecone (cost reduction at scale) | P2 |
| TR-ARC-007 | Claude Agent SDK for Apex Agents | P1 |
| TR-ARC-008 | MCP server (`@modelcontextprotocol/sdk`) | P2 |
| TR-ARC-009 | Presidio NER service (containerized sidecar) | P0 |
| TR-ARC-010 | Stripe Connect + Metronome for tenant sub-billing | P2 |
| TR-ARC-011 | Vanta-equivalent for SOC 2 automation | P1 |
| TR-ARC-012 | Cloudflare Workers (regional scraping endpoints SA/EU/US) | P1 |

### 7.3 Data architecture requirements

| ID | Requirement |
|---|---|
| DR-001 | Row-Level Security policies on every tenant-scoped table |
| DR-002 | Data residency — single-region tenants don't cross borders |
| DR-003 | Time-series scores retained 2 years; archived to cold storage after |
| DR-004 | LLM responses archived raw + embedded for retrieval |
| DR-005 | GDPR right-to-erasure cascades correctly |
| DR-006 | Backup + PITR + restore test documented |
| DR-007 | Migration strategy (Drizzle migrations, never manual SQL in prod) |

---

## 8. Acceptance criteria & success metrics

### 8.1 Functional acceptance

- 100% of P0 requirements: integration + E2E tested, shipped to production
- 95% of P1 requirements: shipped
- 70% of P2 requirements: shipped
- All Playwright e2e tests passing at release
- TypeScript strict mode, zero `any` across src/

### 8.2 Non-functional acceptance

- SOC 2 Type II report signed
- securityheaders.com A rating
- WCAG 2.2 AA (axe-core clean)
- 99.9% uptime demonstrated over launch-month
- p95 dashboard <100 ms

### 8.3 Business acceptance

- 20 agency reseller customers onboarded
- 500 direct brand customers paid
- $75k MRR
- <5% monthly churn
- NPS >50
- 3 Tier-1 enterprise logos (Fortune 1000 or equivalent)

---

## 9. Timeline & milestones

| Sprint | Duration | Milestone | Go-live features |
|---|---|---|---|
| **Sprint 0** | 2w | **Infrastructure migration** | Neon→self-hosted Supabase Postgres; Clerk→Supabase Auth; RLS policies migrated; dual-write cutover; full restore drill |
| **Sprint 1** | 2w | Foundation fixes | RLS enforcement (now on Supabase); Grok API wired; GA4+GSC; Brand voice v1; Public API v1; Status page |
| **Sprint 2** | 4w | Parity + premium feel I | AIO/AI Mode/Copilot; NER+fuzzy; SoV; Sentiment; Alerts → Slack/Email/Webhook; Zapier; Cmd+K palette; Comments/@mentions |
| **Sprint 3** | 6w | Specialist-beating + Rolls Royce I | MONITOR→CREATE loop; N-runs averaging; Geo-distributed scraping; Shopify+WP publish; Looker Studio; Editorial Polish; Prompt Radar v1; MCP server; Explainable score decomposition |
| **Sprint 4** | 8w | Enterprise + attribution + Rolls Royce II | Shopify sales correlation; SAML; SOC 2 kickoff; Custom domains; White-label PDFs; Agency billing+portal; Jira/Linear; Apex Agents v1 (3 agents); Audit log + versioned dashboards; Trust Center; Embeddable widgets |
| **Sprint 5** | 12w | Category-leading + Rolls Royce III | Bot-crawl analytics; Lift measurement; Answer-quality score; ROI modeling; What-if simulator; Real-time answer-diff stream; Revenue-attributed ROI; Ask-your-data NL; GraphQL+SDKs+Terraform; Sub-billing+auto-tax |
| **Sprint 6+** | ongoing | Leadership innovation | Prompt Volumes Phase 3 (panel license); Peer benchmarking; Dark query discovery; Multi-language; WhatsApp |

**Total: 34 weeks (~9.5 months) to Sprint 5 completion (+2w for Sprint 0 migration); Sprint 6 open-ended post-launch.**

### 9.0 Sprint 0 — Infrastructure migration (prerequisite)

**Duration:** 2 weeks
**Goal:** Move the entire data + auth stack from Neon + Clerk SaaS to self-hosted Supabase on the project server, with zero data loss and minimal user-facing disruption.

| Task | Owner | Acceptance |
|---|---|---|
| Provision self-hosted Supabase via official docker-compose (Postgres 15 + GoTrue + Storage + Realtime + Studio + Kong gateway) on server `100.x.x.x` | DevOps | Studio reachable on internal port; health checks green |
| pg_dump all Neon databases + restore to Supabase Postgres in staging | DevOps | Row-count parity verified against Neon; Drizzle migrations re-applied idempotently |
| Migrate Drizzle schema + connection strings to Supabase | Backend | `npx drizzle-kit push` succeeds against new Postgres; integration tests pass |
| Apply RLS policies for every tenant-scoped table (was NFR-SEC-003 / DR-001 — now enforceable natively) | Backend | Cross-tenant access test fails with 42501 error |
| Export Clerk users + organizations + memberships via Clerk Backend API | Backend | JSON dump with clerk_user_id + email + org_id + role |
| Import users into Supabase `auth.users` via admin API; generate Supabase user IDs; create mapping table `clerk_to_supabase_migration` | Backend | All users imported; mapping retained 90 days per R-012 |
| Replace `@clerk/nextjs` usage with `@supabase/ssr` + `@supabase/supabase-js` in app + API middleware | Frontend+Backend | No `@clerk/*` imports remain; session flow tested E2E |
| Configure SSO providers in GoTrue (Google, Microsoft OAuth) | Backend | 3 OAuth flows tested |
| Migrate file/asset uploads from R2/S3 → Supabase Storage (or retain R2 via S3-compat and point Supabase Storage at it) | Backend | All tenant logos load post-migration |
| Dual-write window: write to both Neon and Supabase for 48h to validate parity | Backend | No drift between systems over window |
| Cutover: DNS/connection-string swap during maintenance window; force user re-login | DevOps | Production traffic on Supabase; Neon read-only for 7 days then decommissioned |
| Decommission Clerk + Neon subscriptions | Ops | Billing cancellation confirmed |
| Supabase backup strategy: daily `pg_dump` → encrypted offsite (Cloudflare R2) + weekly full + WAL archive | DevOps | Backup + restore drill passes |
| HA consideration documented (defer Patroni until $50k MRR per R-009) | Tech Lead | Runbook in `docs/infra/supabase-ha-runbook.md` |

**Gate to Sprint 1:** Supabase running in production, all users logging in via Supabase Auth, RLS policies active, Neon marked read-only.

**Why this is Sprint 0 not Sprint 1:** RLS enforcement (the #1 P0 in Sprint 1) depends on being on Supabase. Supabase's native RLS tooling + Studio editor make the policies drastically easier to maintain than bare Postgres + app-layer checks.

### 9.1 Launch gates

| Gate | Trigger |
|---|---|
| **Alpha** | End of Sprint 2 — 10 friendly customers |
| **Beta** | End of Sprint 3 — 50 early-access customers |
| **GA** | End of Sprint 5 — public launch |
| **SOC 2 signed** | End of Sprint 6 — enterprise tier unlocked |

---

## 10. Team & resourcing

### 10.1 Required roles

| Role | FTE | Duration |
|---|---|---|
| Tech lead / architect | 1.0 | Full program |
| Senior full-stack engineer | 2.0 | Full program |
| Frontend engineer (design polish) | 0.5 | Sprints 2–5 |
| Product designer | 0.5 | Sprints 1–5 |
| DevOps / SRE | 0.5 | Sprints 3–6 |
| Security / compliance consultant | 0.25 | Sprints 4–6 (SOC 2 window) |
| QA engineer | 0.5 | Sprints 2–5 |
| Technical writer (docs) | 0.25 | Sprints 3–5 |

**Peak headcount:** 5.5 FTE at Sprint 4–5. Pre-launch minimum 3.5 FTE.

### 10.2 External vendors

- DataForSEO (API subscription, $300–$800/mo)
- AlsoAsked ($59/mo)
- Vanta or Drata (SOC 2 automation, ~$15k/yr)
- SOC 2 Type II auditor (~$30k one-time)
- Legal counsel (EU AI Act, GDPR DPA, reseller contracts)
- Stripe Connect + Metronome (usage-based billing)
- Cloudflare Enterprise (DDoS + geo scraping)

---

## 11. Risks & mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | Profound ships Apex-equivalent features first | High | High | Focus on white-label + PPP (Profound won't touch); accelerate MCP + agents |
| R-002 | LLM ToS change breaks UI-scraping | Medium | High | Hybrid API-first; fallback to scraping; maintain legal review |
| R-003 | SOC 2 audit fails on first attempt | Medium | Medium | Vanta-guided readiness; mock audit at Sprint 5 |
| R-004 | Panel data cost exceeds MRR growth | Low | Medium | Triggered only at $75k MRR; Phase 1 DataForSEO stack sufficient until then |
| R-005 | RLS policy gap leaks cross-tenant data | Low | Critical | RLS + unit tests per policy + quarterly pentest |
| R-006 | Editorial Polish gets mis-framed as bypass tool | Medium | Medium | Strict marketing review; no detector-score UI; legal-approved copy |
| R-007 | Agent hallucinations publish bad content | Medium | High | Approval-gate enforced; never auto-publish; user can revoke |
| R-008 | PSI quota exhausted as customer base grows | High | Medium | Unlighthouse bulk path; self-host Lighthouse runners |
| R-009 | Self-hosted Supabase single-server failure | Medium | High | Daily pg_dump offsite + documented restore runbook; move to HA Postgres (Patroni) at $50k MRR |
| R-011 | Neon→Supabase migration data loss or downtime | Medium | High | Run dual-write during cutover; full pg_dump before switch; staging-environment dry-run first; cutover during maintenance window |
| R-012 | Clerk→Supabase Auth migration breaks existing sessions | High | Medium | Force re-login at cutover; pre-communicate to all users; map clerk_user_id and clerk_org_id → supabase auth.users.id with mapping table retained for 90 days |
| R-010 | Vercel costs scale non-linearly | Medium | Medium | Cloudflare Workers for scraping; consider hybrid deploy |

---

## 12. Evaluation & sign-off

### 12.1 Sprint-end review checklist

Each sprint ends with:
- [ ] All committed P0 requirements have passing acceptance tests
- [ ] All committed P1 requirements have passing acceptance tests
- [ ] No regressions in existing Playwright e2e suite
- [ ] TypeScript strict clean (`npx tsc --noEmit`)
- [ ] Vitest unit/integration suite green
- [ ] Security headers A-rated
- [ ] Design-system compliance (no hardcoded hex)
- [ ] Documentation updated for shipped features
- [ ] Demo recording posted for stakeholder review

### 12.2 Go/no-go for GA (end of Sprint 5)

Must pass:
- All P0 requirements shipped
- 95% of P1 requirements shipped
- Load test at 10x expected launch traffic passes
- Penetration test report clean (no high/critical)
- 50 beta customers, ≥40 retained, NPS >50
- SOC 2 Type II audit in progress (mock audit clean)
- Documentation complete (API reference + help center + 10 walkthroughs)

---

## 13. Appendices

### A. Feature traceability matrix

Each requirement in §5–§6 maps to:
- Gap reference (`COMPETITIVE_FEATURE_GAP_ANALYSIS.md` section)
- Competitor parity (which Tier-1 has it)
- Research source (`research-report.md` section)

Maintained in `docs/APEX_RFP_TRACEABILITY.csv` (to be generated during Sprint 1).

### B. Glossary

- **AEO** — Answer Engine Optimization
- **GEO** — Generative Engine Optimization
- **Tier-1 competitor** — Profound, Peec.ai, AthenaHQ, Goodie AI (funded, >$5M ARR)
- **PPP** — Purchasing Power Parity (pricing adjusted for local economies)
- **NER** — Named Entity Recognition
- **RLS** — Row-Level Security
- **CWV** — Core Web Vitals (LCP, INP, CLS)
- **PSI** — PageSpeed Insights (Google)
- **MCP** — Model Context Protocol (Anthropic standard)
- **E-E-A-T** — Experience, Expertise, Authoritativeness, Trustworthiness (Google quality signal)
- **SoV** — Share of Voice
- **AIO** — AI Overviews (Google)
- **CI95** — 95% Confidence Interval

### C. Related documents

- `docs/COMPETITIVE_FEATURE_GAP_ANALYSIS.md` — full gap analysis with priorities
- `/home/hein/.claude/history/research/2026-04-18_geo-aeo-competitors/research-report.md` — 12-agent competitive research
- `app_spec.txt` — original product specification
- `docs/APEX_DESIGN_SYSTEM.md` — design single-source-of-truth
- `feature_list.json` — legacy checklist (NOT a reliable ground-truth per CLAUDE.md)
- `FEATURE_VERIFICATION.md` — trusted-signals framework for feature completion

### D. Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Program Owner | Hein van Vuuren | _____ | _____ |
| Tech Lead | _____ | _____ | _____ |
| Product / Design | _____ | _____ | _____ |
| Security / Compliance | _____ | _____ | _____ |
| Legal | _____ | _____ | _____ |

---

**End of RFP.**

Next step: generate `APEX_RFP_TRACEABILITY.csv` mapping every FR/NFR/TR/DR ID to competitor parity, gap-analysis section, and research-report section. Use this as the source-of-truth for Sprint 1 planning — convert each P0 requirement into a Linear/Jira issue with the RFP ID as the primary tag.
