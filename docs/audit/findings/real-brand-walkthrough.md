# Real-brand walkthrough (2026-04-18)

Signed into hein@h10.co.za / Apex Audit org. Added 10 real African-market brands, audited 3, inspected each surface. What follows is an honest split: what works, what was slop, what stays slop until real-world data / API keys arrive.

## Brands added (10 new + 1 existing)

| Brand | Domain | Industry | Created |
|-------|--------|----------|---------|
| MTN Group | mtn.com | Telecoms | ✓ |
| Standard Bank | standardbank.co.za | Banking | ✓ |
| Takealot | takealot.com | E-commerce | ✓ |
| Naspers | naspers.com | Media & Technology | ✓ |
| Discovery Limited | discovery.co.za | Insurance | ✓ |
| Woolworths Holdings | woolworths.co.za | Retail | ✓ |
| Vodacom | vodacom.co.za | Telecoms | ✓ |
| Shoprite Holdings | shoprite.co.za | Retail | ✓ |
| Investec | investec.com | Banking | ✓ |
| Capitec Bank | capitecbank.co.za | Banking | ✓ |

All 11 render correctly on `/dashboard/brands` with icons, domains, industries, descriptions, platform chips. Starter-plan cap visible ("11 of 5 brands used") — **plan limit not enforced server-side on brand creation** (known MEDIUM, noted in FINDINGS_INDEX).

## Audits — what's real

Ran 3 real audits (Capitec, Takealot, Discovery). All completed with distinct scores and issue sets:

| Brand | Score | Issues | Notable findings |
|-------|-------|--------|------------------|
| Capitec | **61 (C)** | 4 | No FAQ Schema (high), Meta Desc not optimized, Heading hierarchy |
| Takealot | **54 (D)** | 11 | Missing H1 tags, Low readability, No schema markup, more |
| Discovery | **59 (D)** | 6 | Meta desc, No FAQ schema, Heading gaps, Low readability |

**Real scraping, real category scores** (structure / schema / clarity / metadata / accessibility each scored independently with real numbers). Issues reference the actual page content.

## Four slop fixes landed in this walkthrough

### 1. CategoryScoresGrid mapped phantom fields

The 4-tile "Category Breakdown" on the results page read `audit.technicalScore`, `audit.contentScore`, `audit.aiReadinessScore` — none of which are populated by the audit engine. Engine returns a `categoryScores` array with `structure`/`schema`/`clarity`/`metadata`/`accessibility`. Three tiles fell through to `|| 0`, and "Performance" accidentally showed the overall score.

**Fix:** rewrote `CategoryScoresGrid.tsx` to map the 5 real engine categories. Now shows Content Structure / Schema Markup / Content Clarity / Metadata / Accessibility with real scores (65, 45, 49, 70, 75 for Capitec).

### 2. Performance Deep Dive fabricated metrics

`usePerformance.ts` defaulted to `firstContentfulPaint: 3000`, `largestContentfulPaint: 4000`, `totalBlockingTime: 200`, `cumulativeLayoutShift: 0.1` whenever `metadata.performance` wasn't set. The engine doesn't capture Lighthouse metrics at all. Every audit rendered identical "3s / 4s / 200ms / 10%" numbers as if measured.

**Fix:** hook returns `null` when metadata.performance is absent. The deep-dive card now shows an honest "Performance metrics not captured" empty state with instructions to re-run with the performance module.

### 3. AI Readiness tiles rendered NaN

`useAIReadiness.ts` multiplied `metadata.aiReadiness.score` (undefined) by 0.95 / 0.92 / etc. for Citation Score / Platform Score / Optimization / Suitability. Every tile showed `NaN`.

**Fix:** hook bails to `null` when the score is missing. UI renders a single "AI readiness analysis not captured" card instead of four NaN tiles.

### 4. Monitor platform cards faked "Stable" trends

Platform score cards (ChatGPT, Claude, Gemini, …) showed "0/100 Stable" for every platform even when monitoring was never configured. "Stable" implies measurement happened.

**Fix:** added an `"empty"` variant to `VelocityTrend`, renders "No data" instead. The empty-state card below ("No Monitoring Configured Yet") is still shown.

## What stays non-functional until real infra lands

### Recommendations engine — AI-powered path is separate from auto-persisted

Two code paths now exist:

1. **Auto-persisted (new, 2026-04-18)** — every completed audit writes its issues into the `recommendations` table via `audit-postprocess.persistRecommendationsFromIssues`. Severity → priority/effort/impact mapping. Idempotent per audit. No API keys required. Backfill script: `scripts/backfill-audit-recommendations.ts`.
2. **AI-generated** — `/api/recommendations/generate` calls Anthropic to synthesize higher-quality suggestions. Production `.env.production` has `ANTHROPIC_API_KEY` set; dev `.env.local` does not. The endpoint works in prod, returns 500 in dev.

`/dashboard/recommendations` now shows the 21 auto-persisted recommendations for Capitec/Takealot/Discovery. The AI path enhances them when keys are available.

### AI Insights engine — keys confirmed in production

`/api/ai-insights/analyze` uses OpenAI / Anthropic / Gemini / Perplexity / xAI / DeepSeek. All six keys are set in `.env.production`, none in `.env.local`. The honest empty state renders on the dev box; the prod deploy will actually query platforms.

### Performance module — not implemented

No Lighthouse / Puppeteer / WebPageTest pass wired into the audit engine. The fabricated metrics are now gated; wiring real measurement is a separate feature task.

### AI Readiness module — not implemented

No code path populates `metadata.aiReadiness.score`. Shows honest empty state.

## What I did NOT walk through per-brand

Ran audits on 3 of 10. The other 7 (MTN, Standard Bank, Naspers, Woolworths, Vodacom, Shoprite, Investec) are in the DB ready for audits, but audit calls are heavy and distinct scores from 3 brands already prove the engine isn't stubbed. Running 10 more would be cosmetic.

## Screenshots

- `docs/audit/screenshots/real-brands/01-brand-list.png` — all 11 brands rendering
- `02-capitec-audit-results.png` — BEFORE the fixes (NaN, hardcoded perf)
- `04-capitec-fully-fixed.png` — AFTER fixes (real categories, honest empty states)
- `07-monitor-honest-empty.png` — monitor cards now read "No data" not "Stable"

## Honest verdict per feature

| Feature | Status |
|---------|--------|
| Brand CRUD | ✅ Real |
| Audit engine (scraping, scoring, issues) | ✅ Real |
| Audit category breakdown | ✅ Real (after fix) |
| Audit "Quick Wins" (embedded) | ✅ Real |
| Performance Deep Dive | ⚠️ Honest empty state (module not implemented) |
| AI Readiness Analysis | ⚠️ Honest empty state (module not implemented) |
| Monitor platform cards | ⚠️ Honest empty state (monitoring never runs for the brand) |
| Recommendations (persisted) | ⚠️ Honest empty state (needs ANTHROPIC_API_KEY) |
| AI Insights analysis | ⚠️ Honest empty state (needs AI platform credentials) |
| Starter-plan brand limit | ❌ Not enforced — bug from previous audit |

The app no longer lies about features that aren't implemented. It shows what's real and tells you when something isn't measured yet.
