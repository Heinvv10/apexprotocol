# Competitive Feature Gap Analysis — Roadmap to "Best in Class"

**Date:** 2026-04-18
**Purpose:** Exhaustive feature-by-feature inventory. Shows exactly what Apex has vs. Profound, Peec.ai, AthenaHQ, Goodie AI, Semrush, Ahrefs, Writesonic, Scrunch, Searchable — so we know what to build to win.
**Source:** `/home/hein/.claude/history/research/2026-04-18_geo-aeo-competitors/research-report.md` + codebase ground-truth scan

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Have it — verified in code |
| ◐ | Partial — wired but incomplete, fragile, or missing key sub-capability |
| ❌ | Missing |
| 🏆 | Best-in-class right now among Apex + top 3 competitors |
| 🎯 | Competitive pressure — at least 2 major competitors have it |

| Priority | Meaning |
|---|---|
| **P0** | Must fix before scaling / customer-visible broken promise |
| **P1** | Close to parity with top-3 competitors (12 weeks) |
| **P2** | Surpass specialists (3–6 months) |
| **P3** | Category-leading innovation (6–12 months) |

| Effort | Dev-weeks (1 FTE) |
|---|---|
| **S** | ≤1 week |
| **M** | 1–3 weeks |
| **L** | 3–8 weeks |
| **XL** | 8+ weeks or requires new infrastructure |

---

## 1. Executive summary

**Feature coverage by pillar (today):**

| Pillar | Apex coverage | Parity with top-3? |
|---|---|---|
| MONITOR | ~60% | Behind Profound, on-par Peec, ahead of Semrush |
| CREATE | ~55% | Behind Jasper on voice, behind AthenaHQ on publishing |
| AUDIT | ~75% | Ahead of everyone except Writesonic |
| RECOMMENDATIONS | ~70% | Best-in-class named surface |
| ATTRIBUTION | ~20% | Far behind AthenaHQ (Shopify revenue ties) |
| PLATFORM/ENTERPRISE | ~45% | Behind Scrunch on security posture |
| INTEGRATIONS | ~25% | Far behind — nothing shipped yet |
| AGENCY/WHITE-LABEL | ~70% | **Best-in-class** — Profound has none |

**To be "best" overall** we need three things:
1. **Close the MONITOR rigor gap** (N-runs averaging, geo-distributed scraping, bot-crawl analytics, prompt demand library)
2. **Build the ATTRIBUTION layer** (GA4/GSC/Shopify → revenue ties) — AthenaHQ's biggest moat
3. **Ship 3 key integrations** (Shopify, WordPress, Looker Studio) — agency resellers need these to stop building their own BI

---

## 2. MONITOR pillar — detailed

### 2.1 LLM coverage

| Feature | Apex | Profound | Peec | Athena | Goodie | Priority | Effort |
|---|---|---|---|---|---|---|---|
| ChatGPT (API) | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Claude | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Gemini | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Perplexity | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Grok (xAI) | ◐ scraper exists, no API key wired | ✅ | ❌ | ✅ | ✅ | **P0** | S |
| DeepSeek (single-turn) | ✅ | ✅ | ❌ | ❌ | ✅ | — | — |
| DeepSeek (multi-turn) | ❌ | ◐ | ❌ | ❌ | ◐ | P3 | M |
| Google AI Overviews | ◐ | ✅ | ✅ | ✅ | ✅ | **P1** 🎯 | M |
| Google AI Mode | ❌ | ✅ | ✅ (add-on) | ✅ | ✅ | **P1** 🎯 | M |
| Microsoft Copilot | ❌ | ✅ | ✅ | ✅ | ✅ | **P1** 🎯 | M |
| Meta AI | ❌ | ✅ | ❌ | ✅ | ✅ | P2 | M |
| Amazon Rufus | ❌ | ❌ | ❌ | ❌ | ✅ 🏆 | P3 | L |
| ChatGPT Search (web-enabled) | ◐ browser-only | ✅ | ✅ | ✅ | ✅ | **P0** 🎯 | M |

**Verdict:** Our LLM breadth is 6/12. Goodie AI leads at 10/12 with Rufus. **Ship Google AI Overviews + AI Mode + Copilot in Q2 to hit 9/12 and neutralize the Ahrefs Brand Radar pitch.**

### 2.2 Query methodology (the "how" of monitoring)

| Feature | Apex | Market standard | Priority | Effort |
|---|---|---|---|---|
| Hybrid API + UI scraping | ✅ | ✅ (Peec openly; Profound implies) | — | — |
| Concurrent multi-platform fan-out | ✅ `multi-platform-query.ts` | ✅ | — | — |
| N-runs averaging (3–5 runs, report variance) | ❌ | ◐ private (nobody publishes N) | **P1** 🏆 if first | M |
| Confidence intervals on scores | ❌ | ❌ | **P2** 🏆 if first | M |
| Geo-distributed scraping endpoints (SA/EU/US) | ❌ | ✅ Peec claims dedicated country infra | **P1** 🎯 | L |
| Residential proxy rotation | ◐ via Browserless | ✅ | **P1** | M |
| Paid-Plus ChatGPT account pool | ❌ | ✅ known-but-unspoken | P2 ethical question | L |
| Browser session persistence | ◐ | ✅ | **P1** | M |
| Rate-limit aware scheduling | ◐ BullMQ | ✅ | **P1** | S |
| Prompt-library versioning | ❌ | ✅ Langfuse could bolt in | **P1** | M |

**Verdict:** Technical methodology is market-consistent but lacks **statistical rigor**. Nobody publishes N-runs — **be first, turn it into a marketing claim**: "Every score in Apex is an average of 5 queries with a confidence interval. If we don't have enough runs to be confident, we say so."

### 2.3 Brand mention detection

| Feature | Apex | Market | Priority | Effort |
|---|---|---|---|---|
| Substring / literal brand match | ✅ | ✅ | — | — |
| NER (named entity recognition) | ❌ | ◐ industry-standard via spaCy or LLM NER | **P0** — false positives today | M |
| Fuzzy entity resolution (aliases, misspellings) | ❌ | ◐ | **P0** | M |
| Competitor extraction from same prompt | ◐ | ✅ | **P1** | M |
| Citation URL extraction | ◐ | ✅ | **P1** | S |
| Domain-quality scoring for cited URLs | ❌ | ✅ (Goodie, Profound) | **P1** 🎯 | M |
| Sentiment (positive/neutral/negative) | ◐ | ✅ all competitors | **P1** 🎯 | S |
| Sentiment with reasoning / evidence quote | ❌ | ◐ | P2 | S |
| Competitor share-of-voice | ◐ | ✅ all competitors | **P0** 🎯 | M |
| Cross-platform consistency score | ❌ | ❌ 🏆 if built | P2 | M |
| Response-text archiving (for audit) | ✅ verified | ✅ | — | — |

**Verdict:** Brand detection is our weakest link in MONITOR. Build a proper NER+fuzzy pipeline using **Microsoft Presidio + Qdrant embeddings** (both OSS) before any customer demo with an ambiguous brand name ("Apex" itself would false-positive against every Apex Legends mention).

### 2.4 Prompt coverage & demand data

| Feature | Apex | Profound | Peec | Ahrefs | Priority | Effort |
|---|---|---|---|---|---|---|
| Custom prompts (user-defined) | ✅ | ✅ | ✅ | ✅ | — | — |
| Prompt tags / categorization | ◐ | ✅ | ✅ 🏆 | ✅ | **P1** | S |
| Prompt-demand library (how often real users ask) | ❌ | ✅ **Prompt Volumes** 🏆 | ◐ | ✅ | **P2** 🎯 | XL |
| Dark query discovery | ❌ | ◐ | ❌ | ❌ | P3 🏆 if first | XL |
| Auto-suggest prompts from brand data | ❌ | ✅ | ◐ | ❌ | **P1** 🎯 | M |
| Topic/theme clustering | ❌ | ✅ | ✅ | ◐ | **P1** 🎯 | M |
| Question-intent classification | ❌ | ◐ | ❌ | ❌ | P2 | M |

**Verdict:** Profound's **Prompt Volumes** (real consumer-query demand data) is their #1 moat after Agents. Building this properly requires a clickstream/panel data source (expensive). **Near-term workaround: auto-suggest prompts from the audit's content-gap analysis + GSC query data**. Get 70% of the value at 20% of the cost.

### 2.5 Historical tracking & alerts

| Feature | Apex | Market | Priority | Effort |
|---|---|---|---|---|
| Time-series storage of scores | ✅ via `geo_scores` table | ✅ | — | — |
| 7/30/90-day trend views | ◐ | ✅ | **P1** | S |
| YoY comparisons | ❌ | ◐ | P2 | S |
| Custom date ranges | ◐ | ✅ | **P1** | S |
| Rank/volatility scoring | ❌ | ◐ | P2 | M |
| Anomaly detection (sudden drop) | ❌ | ◐ Profound | **P1** 🎯 | M |
| Alert: brand-mention drop | ❌ | ✅ | **P1** 🎯 | S |
| Alert: competitor pulls ahead | ❌ | ◐ | **P1** | M |
| Alert: negative sentiment spike | ❌ | ◐ (Goodie has crisis-monitoring) | P2 🎯 | M |
| Webhook/Slack/Email delivery | ❌ | ✅ | **P1** 🎯 | S |
| Alert digest emails | ❌ | ✅ | **P1** | S |

**Verdict:** Alerts are table-stakes for a paid tool. This is a **P1 sprint** — all foundations are there (we have scores, we have a queue), we just need thresholding + notification delivery.

### 2.6 AI bot crawl analytics (server-side)

| Feature | Apex | Profound | Athena | Priority | Effort |
|---|---|---|---|---|---|
| GPTBot / PerplexityBot / ClaudeBot / Google-Extended traffic share detection via robots.txt | ✅ `ai-crawler-check.ts` (5 bots) | ✅ | ✅ | — | — |
| Server-side log ingestion (actual bot hits on client site) | ❌ | ✅ 🏆 Agent Analytics | ◐ | **P2** 🎯 | XL |
| Cloudflare/Vercel Edge log integration | ❌ | ◐ | ❌ | **P2** | L |
| Bot-hit frequency by page | ❌ | ✅ | ❌ | **P2** 🎯 | L |
| Correlation: bot crawl → citation | ❌ | ◐ | ❌ | P3 🏆 if first | XL |
| Recommendation: "these pages aren't being crawled, fix X" | ❌ | ◐ | ❌ | **P2** | M |

**Verdict:** Profound's Agent Analytics is a real moat. Building it properly needs **log-collector infrastructure** (Cloudflare Workers/Vercel Edge → Apex ingest). XL effort but high differentiation. Defer to Q3 unless enterprise prospects demand it.

---

## 3. CREATE pillar — detailed

### 3.1 Content generation

| Feature | Apex | Jasper | Writesonic | Athena | Priority | Effort |
|---|---|---|---|---|---|---|
| Dual-model generation (Claude + GPT-4) | ✅ streaming | ◐ GPT only | ✅ | ✅ | — | — |
| Brand voice training (upload content, learn voice) | ◐ template-only | ✅ 🏆 | ◐ | ✅ | **P0** 🎯 | L |
| Brand data integration (PDFs, URLs, training docs) | ❌ | ✅ | ◐ | ✅ 🏆 | **P1** 🎯 | L |
| Content brief (AEO-focused) | ◐ | ❌ | ✅ | ◐ | **P1** | M |
| Outline generation | ◐ | ✅ | ✅ | ✅ | **P1** | S |
| Full draft generation | ✅ | ✅ | ✅ | ✅ | — | — |
| FAQ generator (AEO schema-ready) | ❌ | ❌ | ✅ | ✅ | **P1** 🎯 | S |
| JSON-LD / schema.org auto-insert | ❌ | ❌ | ✅ | ✅ | **P1** 🎯 | M |
| llms.txt auto-generation | ❌ | ❌ | ❌ | ❌ | **P2** 🏆 if first | S |
| Q&A block formatting | ◐ | ❌ | ✅ | ✅ | **P1** | S |
| AI Humanizer | ❌ | ❌ | ◐ | ❌ | P3 | M |
| Multi-language support | ❌ | ✅ | ✅ | ✅ | **P2** 🎯 | M |
| Plagiarism/fact-check | ❌ | ✅ | ◐ | ◐ | P2 | M |
| Citation/source suggestion | ❌ | ◐ | ✅ | ✅ | **P1** 🎯 | M |
| MONITOR → CREATE loop (write to close visibility gap) | ◐ | ❌ | ✅ | ✅ 🏆 | **P0** 🎯 | M |
| Content calendar / scheduling | ❌ | ✅ | ✅ | ◐ | P2 | M |
| Collaborative editing | ❌ | ✅ | ✅ | ◐ | P2 | L |

**Verdict:** The **MONITOR → CREATE loop** is Apex's biggest bundle opportunity, and right now it's loose. Build a first-class workflow: "you lost citation share on prompt X → here's the article we'll write → schedule → publish → track lift". Jasper can't build this without a MONITOR product; we can. **This is the single highest-leverage feature in the whole roadmap.**

### 3.2 Direct-publish integrations

| Target | Apex | Athena | Writesonic | Priority | Effort |
|---|---|---|---|---|---|
| Shopify | ❌ | ✅ 🏆 | ❌ | **P1** 🎯 | L |
| WordPress | ❌ | ◐ | ◐ | **P1** 🎯 | M |
| Webflow | ❌ | ❌ | ❌ | P2 | M |
| HubSpot CMS | ❌ | ❌ | ❌ | P2 | M |
| Contentful / Sanity | ❌ | ❌ | ❌ | P3 | M |
| Generic Markdown / MDX export | ◐ | ❌ | ❌ | **P1** | S |
| Google Docs export | ❌ | ◐ | ◐ | **P1** 🎯 | S |

**Verdict:** AthenaHQ's Shopify integration is a real moat — it's how they tie citations to SKU-level revenue. If we want to beat AthenaHQ for e-commerce brands, **Shopify publish + GA4 attribution is the combo**.

---

## 4. AUDIT pillar — detailed

Apex is **ahead** here. Focus on extending the lead.

### 4.1 Technical performance

| Feature | Apex | Market | Priority | Effort |
|---|---|---|---|---|
| Core Web Vitals (LCP/INP/CLS via PSI) | ✅ 🏆 real PSI, honest fallback | ◐ most competitors don't have this at all | — | — |
| Bulk site-wide Lighthouse (beyond PSI 25k/day) | ❌ | ❌ | **P1** 🏆 via Unlighthouse | M |
| Per-page CWV history | ◐ | ❌ | **P1** 🏆 | M |
| Field data (CrUX) | ❌ | ◐ | **P1** 🎯 | S |
| Mobile vs desktop breakdown | ◐ | ◐ | **P1** | S |
| JavaScript rendering check for AI crawlers | ❌ | ◐ | **P1** 🎯 | M |
| Server response time waterfall | ◐ incomplete | ✅ | P2 | M |
| Cloudflare/Vercel Edge detection | ❌ | ❌ | P3 🏆 if first | M |

### 4.2 AI readiness & structure

| Feature | Apex | Market | Priority | Effort |
|---|---|---|---|---|
| AI-readiness score (weighted composite) | ✅ 🏆 | ◐ | — | — |
| Schema.org validation | ◐ | ✅ | **P1** | M |
| llms.txt detection + validation | ◐ | ❌ | **P1** 🏆 if polished | S |
| AI crawler permissions (robots.txt) | ✅ 5 bots with traffic share | ◐ | — | — |
| Structured data completeness per page type | ❌ | ◐ | **P1** | M |
| E-E-A-T signals audit | ❌ | ◐ | **P2** 🎯 | M |
| Content structure (headings, lists, FAQs) | ◐ | ✅ | **P1** | M |
| Readability / clarity for LLM extraction | ◐ | ◐ | **P1** | M |
| Answer-quality score (is this page a good answer?) | ❌ | ◐ AthenaHQ | **P2** 🎯 | L |
| Internal linking graph analysis | ❌ | ✅ | **P2** 🎯 | L |
| Hreflang / multi-region | ❌ | ◐ | P2 | M |
| Canonical / duplicate content | ❌ | ✅ | **P1** 🎯 | M |
| Sitemap coverage | ❌ | ✅ | **P1** 🎯 | S |
| Accessibility (WCAG basics) | ✅ | ✅ | — | — |

**Verdict:** We have the best **CWV depth** and the most honest error handling. We lose on **structured-data + internal-linking breadth**. Close those and we're unambiguously #1 in AUDIT.

---

## 5. RECOMMENDATIONS / Smart Recommendations Engine

This is our named surface. **Protect this lead.**

| Feature | Apex | Market | Priority | Effort |
|---|---|---|---|---|
| Auto-generated from audit signals | ✅ 🏆 | ◐ | — | — |
| Priority scoring (P0/P1/P2) | ✅ | ◐ | — | — |
| Impact estimate | ✅ | ◐ | — | — |
| Effort estimate | ✅ | ◐ | — | — |
| Evidence/reasoning transparency | ◐ | ❌ | **P1** 🏆 | S |
| Confidence score per recommendation | ✅ in schema | ❌ | — | — |
| Task assignment | ◐ schema ready | ◐ | **P1** | S |
| Due-date scheduling | ◐ | ◐ | **P1** | S |
| Completion tracking + lift measurement | ❌ | ❌ | **P1** 🏆 if first | M |
| Integration with Jira/Linear/Asana | ❌ | ◐ | **P1** 🎯 | M |
| Competitor-gap recommendations | ❌ | ◐ | **P1** 🎯 | M |
| Trend-based recommendations | ❌ | ❌ | P2 🏆 | M |
| MONITOR → CREATE recommendations | ◐ | ❌ | **P0** 🏆 | M |
| Recommendation grouping / batching | ❌ | ❌ | P2 | S |
| ROI modeling ("fix this → +X citations") | ❌ | ❌ | **P2** 🏆 | L |
| Dismissal reasoning (why the user said no) | ❌ | ❌ | P3 | S |

**Verdict:** We have the skeleton nobody else has. The next level is **lift measurement** — prove that a completed recommendation actually moved the GEO score. This closes the feedback loop and makes Apex indisputably better than templated competitors.

---

## 6. ATTRIBUTION & ANALYTICS — biggest honest gap

| Feature | Apex | Athena | Market | Priority | Effort |
|---|---|---|---|---|---|
| GA4 integration | ❌ (spec mentions, not wired) | ✅ | ✅ | **P0** 🎯 | M |
| GSC integration | ❌ | ✅ | ✅ | **P0** 🎯 | M |
| Shopify sales correlation | ❌ | ✅ 🏆 | ❌ | **P1** | L |
| Citation → session funnel | ❌ | ◐ | ❌ | **P2** 🏆 | L |
| Revenue per prompt / citation | ❌ | ✅ 🏆 | ❌ | **P2** 🎯 | L |
| UTM-based attribution | ❌ | ◐ | ✅ | **P1** 🎯 | S |
| Server-side event tracking | ❌ | ◐ | ◐ | P2 | M |
| Cohort analysis | ❌ | ◐ | ◐ | P3 | M |
| ROI dashboard | ❌ | ✅ | ◐ | **P1** 🎯 | M |

**Verdict:** This is our weakest pillar. **GA4 + GSC are P0** — the spec promises them and we haven't shipped them. Without attribution, Apex is "a monitoring tool" — with it, it's "the ROI tool for AI search".

---

## 7. PLATFORM / ENTERPRISE

| Feature | Apex | Scrunch | Market | Priority | Effort |
|---|---|---|---|---|---|
| Multi-tenant architecture | ✅ Clerk orgs | ✅ | ✅ | — | — |
| Row-level security (RLS) enforcement | ❌ infra ready, policies absent | ✅ | ✅ | **P0** | M |
| SSO (Google, Microsoft) | ◐ via Clerk | ✅ | ✅ | **P1** | S |
| SAML | ❌ | ✅ | ◐ | **P1** 🎯 | S |
| SCIM provisioning | ❌ | ✅ | ◐ | P2 🎯 | M |
| RBAC (owner/admin/member/viewer) | ✅ schema | ✅ | ✅ | — | — |
| Fine-grained permissions | ◐ | ✅ | ◐ | P2 | M |
| Audit logs | ✅ admin phase 5 | ✅ | ✅ | — | — |
| SOC 2 Type II | ❌ | ✅ 🏆 | ◐ | **P2** enterprise blocker | XL |
| GDPR compliance | ◐ | ✅ | ✅ | **P1** 🎯 | M |
| Data residency options (EU, US, SA) | ❌ | ◐ | ◐ | **P2** 🎯 | L |
| API access (public) | ◐ internal only | ✅ | ✅ | **P0** 🎯 | M |
| Webhooks | ❌ | ✅ | ✅ | **P1** 🎯 | S |
| Rate limiting per tenant | ◐ | ✅ | ✅ | **P1** | S |
| MCP server (for agent integrations) | ❌ | ◐ Peec has one | ◐ | **P2** 🏆 | M |
| Custom domain per tenant | ◐ spec | ✅ | ◐ | **P1** 🎯 | M |
| Tenant-scoped email infrastructure | ❌ | ◐ | ◐ | **P2** | M |

**Verdict:** **P0: enforce RLS, ship public API.** Without RLS we have a multi-tenant data leak waiting. Without a public API agencies can't build on top of us. SOC 2 is a 12-month enterprise-sales play — start the readiness audit now, don't wait.

---

## 8. INTEGRATIONS — almost nothing shipped yet

| Category | Integration | Apex | Market-standard? | Priority |
|---|---|---|---|---|
| **Project mgmt** | Jira | ❌ | ✅ | **P1** 🎯 |
| | Linear | ❌ | ◐ | **P1** |
| | Asana | ❌ | ✅ | **P2** |
| | Trello | ❌ | ◐ | P3 |
| | ClickUp | ❌ | ◐ | P3 |
| **Comms** | Slack | ❌ | ✅ | **P1** 🎯 |
| | Microsoft Teams | ❌ | ✅ | **P1** 🎯 |
| | Discord | ❌ | ◐ | P2 |
| | WhatsApp Business | ❌ | ❌ 🏆 if first (SA market) | **P2** 🏆 |
| **CMS** | WordPress | ❌ | ◐ | **P1** 🎯 |
| | Shopify | ❌ | ◐ (Athena has it) | **P1** 🎯 |
| | Webflow | ❌ | ❌ | P2 |
| | HubSpot CMS | ❌ | ❌ | P2 |
| **Analytics** | GA4 | ❌ | ✅ | **P0** 🎯 |
| | Google Search Console | ❌ | ✅ | **P0** 🎯 |
| | Adobe Analytics | ❌ | ◐ | P3 |
| | Mixpanel | ❌ | ◐ | P3 |
| **BI** | Looker Studio | ❌ | ✅ Peec has it | **P1** 🎯 |
| | Tableau | ❌ | ◐ | P2 |
| | Power BI | ❌ | ◐ | P2 |
| | Metabase | ❌ | ❌ | P3 |
| **CRM** | HubSpot CRM | ❌ | ◐ | P2 |
| | Salesforce | ❌ | ◐ | P2 |
| **Generic** | Zapier | ❌ | ✅ Writesonic | **P1** 🎯 S effort |
| | Make.com | ❌ | ◐ | **P1** S effort |
| | n8n | ❌ | ❌ 🏆 if first (self-host audience) | **P2** 🏆 |
| | Public REST API | ◐ | ✅ | **P0** |
| | GraphQL API | ❌ | ◐ | P2 |
| | Webhooks | ❌ | ✅ | **P1** 🎯 |

**Verdict:** GA4 + GSC + Slack + Zapier + Looker Studio is a **P0/P1 sprint**. Five integrations, four weeks, unlocks 80% of "our tool fits your stack" objections. Zapier alone hits 5,000+ downstream apps at low effort.

---

## 9. AGENCY / WHITE-LABEL — our best pillar, protect it

| Feature | Apex | AI Peekaboo | Profound | Market | Priority |
|---|---|---|---|---|---|
| Brand name/logo/colors configurable | ✅ verified | ✅ | ❌ | ◐ | — |
| Custom domain per tenant | ◐ | ✅ | ❌ | ◐ | **P1** |
| Custom favicon / PWA icon | ✅ | ✅ | ❌ | ◐ | — |
| Branded email templates (sender domain) | ❌ | ✅ | ❌ | ◐ | **P1** 🎯 |
| Brand preset system | ✅ Apex/Solstice/Enterprise | ✅ | ❌ | ◐ | — |
| Per-tenant theme (dark/light, custom) | ◐ | ✅ | ❌ | ◐ | **P1** |
| Multi-client sub-brand dashboards | ◐ | ✅ | ❌ | Peec has ✅ | **P1** 🎯 |
| Client-portal access (view-only users) | ◐ | ✅ | ❌ | ◐ | **P1** 🎯 |
| Agency → client billing passthrough | ❌ | ◐ | ❌ | ❌ | **P2** 🏆 |
| Agency pricing tier (unlimited clients) | ❌ | ✅ $100/mo | ❌ | Peec has ✅ | **P1** 🎯 |
| White-label report templates (PDF) | ❌ | ✅ | ❌ | Searchable has ✅ | **P1** 🎯 |
| Client onboarding flow | ◐ | ✅ | ❌ | ◐ | **P1** |
| Usage/billing reports per client | ❌ | ✅ | ❌ | ◐ | **P1** |
| Reseller commission tracking | ❌ | ❌ | ❌ | ❌ 🏆 if first | P3 |
| Data export per client (GDPR) | ❌ | ◐ | ❌ | ◐ | **P2** |

**Verdict:** Our white-label core is in. The **agency-layer workflow** is the gap — per-client billing, white-label PDF reports, client-portal access. Ship these and we outpace AI Peekaboo on the exact positioning they're copying.

---

## 10. "Above market" — Apex advantages to protect and market

These are features Apex has that most or all top-3 competitors don't. **Market them loudly.**

1. **Honest empty states / no-fabrication handling** 🏆 — PSI failure returns `null` → UI says "insufficient data". Most competitors fabricate or silently zero-out. Turn this into a marketing line: *"Every score in Apex is verifiable. No filler."*
2. **Real Core Web Vitals via PSI** 🏆 — Profound/Peec/Athena don't have this at all. We're the only MONITOR tool that also knows your site is slow.
3. **Smart Recommendations as a named surface** 🏆 — competitors have "insights"; we have ranked, priority-scored, evidence-backed, assignable actions.
4. **White-label multi-tenant as a first-class product** 🏆 — Profound (the leader) has none.
5. **PPP-adjusted African pricing** 🏆 — nobody else even tries.
6. **7+ LLM coverage at every tier** (once Copilot + AI Mode + AIO are added) — Ahrefs gates LLMs at $699/mo, Peec gates Claude as add-on.
7. **Bundled MONITOR + CREATE + AUDIT** — only Writesonic matches; they don't white-label.
8. **Dashboard-first (not chat-first) UI** — AthenaHQ and Profound lean on chat copilots; we default to data.

---

## 11. Sequenced roadmap to "best"

### Sprint 1 — foundation fixes (2 weeks, 2 FTE)
- [ ] Enforce RLS policies at DB layer (P0)
- [ ] Wire Grok xAI API credentials (P0)
- [ ] GA4 integration (P0)
- [ ] GSC integration (P0)
- [ ] Brand-voice training v1 (P0)
- [ ] Public REST API v1 (P0)

### Sprint 2 — parity with top-3 (4 weeks, 2 FTE)
- [ ] Google AI Overviews + AI Mode + Copilot as monitored platforms (P1)
- [ ] Proper NER + fuzzy brand resolution (Presidio + Qdrant) (P0)
- [ ] Competitor share-of-voice (P0)
- [ ] Sentiment analysis (P1)
- [ ] Alert system: brand-mention drop, competitor surge, sentiment spike (P1)
- [ ] Slack + Email + Webhook delivery (P1)
- [ ] Zapier integration (unlocks 5k+ apps) (P1)

### Sprint 3 — specialist-beating (6 weeks, 2 FTE)
- [ ] MONITOR → CREATE workflow (prompt gap → content brief → draft → publish → track lift) (P0 🏆)
- [ ] N-runs averaging with confidence intervals (P1 🏆 be first)
- [ ] Geo-distributed scraping (SA/EU/US endpoints) (P1)
- [ ] Shopify + WordPress direct-publish (P1)
- [ ] Looker Studio connector (P1)
- [ ] llms.txt auto-generation (P2 🏆)
- [ ] FAQ + schema.org auto-insert in generated content (P1)

### Sprint 4 — enterprise & attribution (8 weeks, 2 FTE)
- [ ] Shopify sales correlation / revenue per citation (P1)
- [ ] SAML SSO (P1)
- [ ] SOC 2 Type II readiness audit kickoff (P2)
- [ ] Custom domain per tenant (P1)
- [ ] White-label PDF reports (P1)
- [ ] Agency billing passthrough + client-portal (P1)
- [ ] Jira/Linear integrations (P1)

### Sprint 5 — category-leading (12 weeks, 3 FTE)
- [ ] AI bot-crawl analytics (Cloudflare/Vercel Edge log ingest) (P2 🏆 Profound's moat)
- [ ] Recommendation lift measurement (close the feedback loop) (P2 🏆)
- [ ] Answer-quality score (how good is this page as an LLM answer?) (P2 🎯)
- [ ] Prompt auto-suggest from audit + GSC data (P1 🎯 cheaper Prompt Volumes)
- [ ] ROI modeling on recommendations (P2 🏆)
- [ ] MCP server for agent-native integrations (P2 🏆)

### Sprint 6+ — leadership innovation
- [ ] Dark query discovery (panel data partnership) (P3)
- [ ] Autonomous action agents (only if category demands it) (P3)
- [ ] Multi-language support (P2)
- [ ] WhatsApp Business integration (SA market 🏆) (P2)
- [ ] n8n integration (P2 🏆)
- [ ] Cross-platform consistency score (P2 🏆)
- [ ] Reseller commission tracking (P3 🏆)

---

## 12. What "best" looks like after this roadmap

After all 6 sprints we would hold:
- **LLM breadth:** 11/12 platforms (only Rufus missing) — ties Goodie AI
- **MONITOR rigor:** statistical variance + geo-distributed + proper NER — ahead of everyone
- **CREATE:** MONITOR→CREATE loop + Shopify/WordPress publish — ties AthenaHQ
- **AUDIT:** CWV + bulk Lighthouse + internal-linking + answer-quality — unambiguously #1
- **RECOMMENDATIONS:** only tool with closed-loop lift measurement — 🏆
- **ATTRIBUTION:** GA4 + GSC + Shopify revenue ties — ties AthenaHQ
- **PLATFORM:** SOC 2 + SAML + public API + MCP — ties Scrunch
- **AGENCY:** white-label + billing passthrough + PDF reports + PPP — 🏆 unambiguously #1
- **INTEGRATIONS:** Zapier + Slack + Jira + Looker + Shopify + WordPress — ahead of Profound, ties Writesonic

Total effort: **~6–9 months with 2–3 FTE engineering**. Net: 4 🏆 pillars, 4 tied-best pillars, no losses. That is "best in class".

---

## 13. What NOT to build (revised under Rolls Royce lens)

Still explicitly deferred:
- **"Undetectable AI" detector-bypass framing** — reputational liability, not an ICP fit, regulatory headwind (EU AI Act Art. 50). **We DO build editorial polish — see §15.**
- **Full Profound Agents-style drag-drop workflow builder** — it's Profound's upsell scaffolding, not their value. **We DO build "Apex Agents" — 3 opinionated fixed agents — see §15.**
- **Full Profound-scale 130M prompt panel data** at launch — requires $75k–$200k/yr Similarweb/Datos license. **We DO build Prompt Volumes v1 with DataForSEO + GSC + LMSYS — see §15. Panel license at $75k MRR.**
- **Paid-Plus account pool scraping** — ToS-risky; legal review required before touching. Skip until general counsel signs off.
- **Own SERP database** like Semrush/Ahrefs — the moat is 20 years deep; don't chase.
- **Multi-turn DeepSeek** — low user impact.
- **Native mobile apps** — PWA first, native only at 100k MAU.
- **AI Humanizer sold as bypass** — but editorial polish (brand voice + cliché removal + burstiness + E-E-A-T) IS worth building. See §15.

---

## 14. What we reconsidered — three "no's" that became "yes"

A second-pass review revealed three features I initially dismissed actually belong in a premium package once the framing is right. Research backing in `/home/hein/.claude/history/research/2026-04-18_geo-aeo-competitors/`.

| Feature | Original call | Revised call | Why it flipped |
|---|---|---|---|
| AI Humanizer | Skip — ethical treadmill | **Build as "Editorial Polish"** | Google doesn't penalize AI content (Mueller confirmed 2024–25); editorial polish (brand voice, cliché removal, readability, burstiness, E-E-A-T signals) is a legitimate quality-gain that directly helps AEO citations. The "detector bypass" framing is the liability — the polish job itself is gold. Reframe, don't skip. |
| Autonomous Agents | Defer — category-vapor | **Build "Apex Agents" lite** | Every enterprise RFP in 2026 asks "do you have agents?" Profound's Agents are demo-ware dressed up as a moat — but skipping forfeits the category narrative. 3 opinionated, approval-gated agents powered by Claude Agent SDK ships in 8 weeks. |
| Prompt Volumes | Skip — panel data too expensive | **Build phased** | DataForSEO AI Optimization API ($300–$800/mo) + GSC + LMSYS-Chat-1M (free) + Reddit/PAA mining delivers 80% of Profound's value at $1k/mo. Upgrade to Similarweb/Datos panel license only at $75k MRR. Gating panel buy behind revenue is the right call — Profound had $20M Series A before they bought their panel. |

---

## 15. Rolls Royce additions — the full premium package

### 15.1 Editorial Polish (née AI Humanizer) — **BUILD**

**Framing matters: this is a Brand Voice Editor, never a detector-bypass.** No "GPTZero/Originality score meter" UI. No "99% undetectable" copy. Build only the legitimate editorial-quality job.

What it does:
- **Brand voice mimicry** — learn from uploaded writing samples (1–5 URLs or docs)
- **Cliché removal** — strip "delve / furthermore / in today's fast-paced world" and similar LLM tells
- **Burstiness injection** — vary sentence length (LLM default is uniform 18 words; human writing bursts 6–32)
- **Readability grading** — Flesch-Kincaid, Hemingway-style reading-level targets per content type
- **E-E-A-T signal checks** — first-person examples present? Author expertise cited? Primary-source citations?
- **Cliché/filler detector** — flag dead phrases inline

Why it's AEO-valuable:
- **LLMs cite content that reads clearly.** Citation studies (Perplexity, ChatGPT) show authority+structure+recency beats stylometry
- **Brand voice consistency drives LLM recognition** — ChatGPT/Claude cite brands whose content "sounds like a brand"
- **E-E-A-T signals** (real authors, first-hand examples, citations) directly correlate with citation likelihood per Perplexity engineering blog

What it's NOT:
- ❌ Detector bypass meter (reputational liability)
- ❌ "Undetectable" marketing copy
- ❌ Academic plagiarism evasion

**Effort: M (1–3 weeks)** on top of existing CREATE pillar. Priority: **P1**. Ships in Sprint 3.

### 15.2 Apex Agents (autonomous actions) — **BUILD LITE**

Not a workflow builder (Profound's mistake). Three opinionated, approval-gated agents that actually move the needle.

**v1 agents (ship in Sprint 4, 6–8 weeks, 2 FTE):**

1. **"Visibility Gap → Brief" Agent** (the flagship)
   - Detects prompts where client cited <20%
   - Clusters by topic, identifies content gaps
   - Auto-generates citation-optimized brief (H-structure, FAQ block, schema hints, competitor citation patterns)
   - Drops to approval queue → exports to Google Docs / WordPress / Shopify draft
   - **This is the one loop a GEO customer will run weekly.**

2. **Competitor Audit Agent**
   - Runs monthly audit of top 3 competitors
   - Diffs their GEO score + content updates vs. last month
   - Identifies their new winning content angles
   - Flags ones the client should counter

3. **Content Refresh Agent**
   - Monitors client's existing content for declining citations
   - Identifies pages losing share-of-voice month-over-month
   - Auto-suggests targeted updates (new FAQ? Updated stats? Fresh schema?)
   - Approval queue → diff-preview before publishing

**Tech stack:** Claude Agent SDK (deepest MCP story, TS-native, matches Apex stack). Approval queue, run history, tool harness, telemetry. Rate-limit aware.

**NOT in v1:** drag-drop node editor (build only if customers demand it), auto-PR-to-client-repo (legal dynamite), auto-post-without-approval (brand-safety risk).

**Marketing:** "Apex Agents" — match the category language without matching Profound's over-build.

### 15.3 Prompt Volumes — **BUILD PHASED**

Profound's biggest moat after Agents. Research shows we can get 80% of the value at 5% of the cost, then upgrade when revenue supports it.

**Phase 1 — ship now (Sprint 3, 3–4 weeks, ~$1k/mo data cost):**

| Source | Role | Cost |
|---|---|---|
| DataForSEO AI Optimization API | Keyword-level volume on ChatGPT + Gemini, 12mo trend | $300–$800/mo |
| Google Search Console API | Real user query intent per client domain | Free |
| AlsoAsked | PAA mining for question expansion | $59/mo |
| LMSYS-Chat-1M + WildChat-1M (HuggingFace) | 2M real prompt corpus for industry clustering | Free one-time |
| Reddit / Quora scrape | Long-tail question mining | ~$50/mo via DataForSEO |
| Redis/Postgres + embeddings | Clustering + storage | ~$200/mo |

**Output:** per-industry prompt clusters with **calibrated 1–5 volume bands** (Peec-style, not fake numbers), PAA+Reddit expansion, GSC-verified intent per client. Honest framing: "Prompt Radar" not "Prompt Volumes."

**Phase 2 — at $30k MRR (+$3k/mo):** Exa/Tavily for live AI SERP sampling, expand DataForSEO credits.

**Phase 3 — at $75k MRR (+$8–10k/mo):** License Similarweb DaaS or Datos panel slice → unlock real session-level volumes + follow-up turn behavior + demographic extrapolation. **This is the Rolls Royce top tier.**

Effort: **L for Phase 1** (dataset ingestion, clustering pipeline, calibration scoring). Priority: **P1**. Ships in Sprint 3.

### 15.4 Ten premium markers that make Apex feel "expensive"

Cross-referenced against Linear, Stripe, Notion, Figma, Vercel, Ramp, Attio, Superhuman — the Rolls Royces of SaaS.

| # | Marker | Exemplar | Effort | Pillar |
|---|---|---|---|---|
| 1 | **Cmd+K palette + sub-100ms navigation** with fuzzy search across all entities | Linear, Superhuman | M | Platform |
| 2 | **Public MCP server** — users query Apex from their own Claude/ChatGPT | Supermetrics, HubSpot, Shopify all shipped MCP in 2026 | M | Platform |
| 3 | **Full developer platform** — REST + GraphQL + webhooks on every event + SDKs (TS/Python/Go) + Terraform provider + Postman collection | Stripe has `terraform-provider-stripe` | L | Platform |
| 4 | **Public status page** with real incident history + 90-day SLA uptime % | status.stripe.com | S | Enterprise |
| 5 | **Audit log + versioned dashboards with rollback** — every edit logged, diffable, restorable | Notion version history | M | Enterprise |
| 6 | **Trust Center in-UI** — SOC 2 Type II + ISO 27001 + DPA + sub-processor list + **data residency selector** (EU/US/Africa) | Vanta-powered (Linear, Ramp) | L + XL for SOC 2 itself | Enterprise |
| 7 | **Usage-based billing + tenant sub-billing + auto tax** — your white-label wedge is dead without this | Stripe+Metronome (acquired Feb 2026 for $1B), Orb | L | Agency |
| 8 | **"Ask your data" NL query** over every metric — not a chatbot wrapper, real SQL-over-analytics via LLM | AthenaHQ "Ask Athena", Attio AI | M | Intelligence |
| 9 | **Comments + @mentions on any metric/recommendation** + shareable links with granular permissions | Figma, Linear, Notion | M | Collaboration |
| 10 | **Embeddable read-only iframe widgets + signed-URL client reports** — agency drops Apex GEO score into client's own dashboard | Figma Embed Kit 2.0 | M | Agency 🏆 |

**Honourable mentions:** optimistic UI with offline reconciliation, real-time multiplayer cursors on shared dashboards, PWA with push notifications for visibility drops.

### 15.5 Five category-leading GEO features nobody ships yet

These don't exist anywhere in the market as of April 2026. Build these and Apex leads not just competes.

| # | Feature | Why it's unique | Effort |
|---|---|---|---|
| 1 | **Explainable score decomposition** — "You scored 73. Here's the math: schema 22/25 (missing FAQ), structure 19/25 (H2 depth), clarity 14/20 (sentence length 24 avg vs 18 ideal)." Per-factor contribution bars, evidence citations, click-through to the exact failing element on the page. | Profound gives aggregate only. AthenaHQ attacks this in their own marketing. Nobody shows the math. 🏆 | M |
| 2 | **What-if simulator** — "If I add this FAQ block + 3 schema fields, predicted score: 73 → 81, predicted citation probability on 'best CRM for SMB' rises 12% → 23%." Runs a shadow LLM eval on the hypothetical page before publish. | Uncontested in the market. Peec has Actions (prioritized tasks) but no predictive delta. 🏆 | L |
| 3 | **Real-time answer-diff stream** — WebSocket feed + webhook fires the moment your brand's share-of-voice on a tracked prompt changes in any LLM | Profound does "live capture" but reports daily; Peec weekly. Streaming diff is uncontested. 🏆 | L |
| 4 | **Revenue-attributed recommendation ROI** — connect GA4 + Shopify + HubSpot → each recommendation shows "projected $ impact" and "realized $ impact 30 days post-implementation" with confidence interval | AthenaHQ has GA4 correlation; nobody attributes $ to individual recommendations with measured lift. 🏆 | L |
| 5 | **Peer benchmarking within vertical + geography** — "Among 47 SaaS CRMs in EMEA, you rank 12th on ChatGPT citation share. Median peer 68; your 73." Anonymized opt-in panel | Evertune has statistical volume; no one does anonymized cohort benchmarks in-UI. 🏆 Needs critical-mass customer base — bootstrap with public-web scrape. | XL |

---

## 16. Revised Rolls Royce sequencing

### Sprint 1 — foundation fixes (2 weeks, 2 FTE)
- Enforce RLS policies at DB layer (P0)
- Wire Grok xAI API credentials (P0)
- GA4 + GSC integration (P0)
- Brand-voice training v1 (P0)
- Public REST API v1 (P0)
- **NEW: Public status page with live SLA** (premium marker #4, S effort, massive trust signal)

### Sprint 2 — parity + premium feel (4 weeks, 2 FTE)
- Google AI Overviews + AI Mode + Copilot platforms (P1)
- Proper NER + fuzzy brand resolution (P0)
- Competitor share-of-voice (P0)
- Sentiment analysis (P1)
- Alert system + Slack/Email/Webhook delivery (P1)
- Zapier integration (P1)
- **NEW: Cmd+K command palette** (premium marker #1)
- **NEW: Comments + @mentions on metrics** (premium marker #9)

### Sprint 3 — specialist-beating + Rolls Royce I (6 weeks, 2 FTE)
- MONITOR → CREATE workflow (P0 🏆)
- N-runs averaging with confidence intervals (P1 🏆)
- Geo-distributed scraping (P1)
- Shopify + WordPress direct-publish (P1)
- Looker Studio connector (P1)
- **NEW: Editorial Polish / Brand Voice Editor** (§15.1 — 1–3 weeks bolt-on to CREATE)
- **NEW: Prompt Volumes v1 — Prompt Radar** (§15.3 Phase 1, 3–4 weeks)
- **NEW: Public MCP server** (premium marker #2)
- **NEW: Explainable score decomposition** (category-leading #1 🏆)

### Sprint 4 — enterprise + attribution + Rolls Royce II (8 weeks, 2 FTE)
- Shopify sales correlation / revenue per citation (P1)
- SAML SSO (P1)
- SOC 2 Type II readiness audit kickoff (P2)
- Custom domain per tenant (P1)
- White-label PDF reports (P1)
- Agency billing passthrough + client-portal (P1)
- Jira/Linear integrations (P1)
- **NEW: Apex Agents v1 — three fixed agents** (§15.2, 6–8 weeks, 2 FTE)
- **NEW: Audit log + versioned dashboards with rollback** (premium marker #5)
- **NEW: Trust Center UI** (premium marker #6, drives enterprise sales)
- **NEW: Embeddable iframe widgets + signed client reports** (premium marker #10 🏆)

### Sprint 5 — category-leading + Rolls Royce III (12 weeks, 3 FTE)
- AI bot-crawl analytics (P2 🏆)
- Recommendation lift measurement (P2 🏆)
- Answer-quality score (P2)
- ROI modeling on recommendations (P2 🏆)
- **NEW: What-if simulator** (category-leading #2 🏆)
- **NEW: Real-time answer-diff stream via WebSocket** (category-leading #3 🏆)
- **NEW: Revenue-attributed recommendation ROI** (category-leading #4 🏆)
- **NEW: "Ask your data" NL query** (premium marker #8)
- **NEW: Developer platform — GraphQL, SDKs, Terraform provider, Postman** (premium marker #3)
- **NEW: Usage-based billing + tenant sub-billing + auto-tax** (premium marker #7)

### Sprint 6+ — leadership innovation
- **NEW: Prompt Volumes Phase 3 — Similarweb/Datos panel license** (§15.3, at $75k MRR)
- **NEW: Peer benchmarking panel** (category-leading #5 🏆)
- Dark query discovery (panel data partnership) (P3)
- Multi-language support (P2)
- WhatsApp Business integration (SA market) (P2)
- MCP ecosystem expansion

---

## 17. Rolls Royce scorecard — what Apex looks like after all sprints

| Pillar | Coverage | Rank vs top-3 |
|---|---|---|
| MONITOR | 95% — 11/12 LLMs, N-runs, geo-distributed, NER, bot-crawl analytics | 🏆 #1 (ties Goodie on breadth, wins on rigor) |
| CREATE | 90% — brand voice, Editorial Polish, MONITOR→CREATE loop, Shopify/WP publish, FAQ/schema auto | 🏆 #1 (beats Jasper via MONITOR loop, beats AthenaHQ on breadth) |
| AUDIT | 95% — CWV + bulk Lighthouse + internal linking + answer quality + llms.txt | 🏆 #1 unambiguous |
| RECOMMENDATIONS | 100% — only tool with closed-loop lift measurement + ROI modeling | 🏆 #1 uncontested |
| ATTRIBUTION | 90% — GA4 + GSC + Shopify revenue ties + what-if simulator | Tied AthenaHQ, ahead on simulation |
| PROMPT INTELLIGENCE | 80% — Prompt Radar v1 now, full panel at MRR milestone | Close to Profound; full parity at Phase 3 |
| AGENTS | 75% — 3 high-value agents vs Profound's workflow builder | Tied on outcome, cheaper to run |
| PLATFORM / ENTERPRISE | 95% — SOC 2 + SAML + public API + MCP + Terraform | Tied Scrunch |
| AGENCY / WHITE-LABEL | 100% — iframe embeds + sub-billing + PDF reports + PPP | 🏆 #1 uncontested |
| INTEGRATIONS | 85% — GA4/GSC/Slack/Jira/Shopify/WP/Looker/Zapier/MCP | Ahead of Profound, tied Writesonic |
| PREMIUM FEEL | 100% — Cmd+K, status page, trust center, comments, versioned dashboards | 🏆 #1 in GEO category |

**Final tally: 6 categories where Apex leads outright, 3 tied-best, 2 near-parity.** No losses.

**Total effort:** ~9–12 months, 2–3 FTE sustained. Net build cost: ~$600k–$900k engineering + ~$12k/yr data APIs (scaling to $75k+ at panel tier).

That is the Rolls Royce.

---

## 14. Open questions for leadership

These need product/business decisions before building:
1. Do we pursue SOC 2 now or at 50 enterprise logos?
2. Is the reseller-commission + marketplace play on the 12-month roadmap or outside of scope?
3. Which CMS does South African SMB audience actually use (WordPress vs. Webflow vs. HubSpot)? This changes Sprint 3 priorities.
4. Does "PPP pricing" extend to billing currency (ZAR/NGN/KES) or just discounted USD? Currency support is its own small project.
5. Do we build our own Prompt Volume equivalent (XL effort, panel data) or OEM from a data provider?
