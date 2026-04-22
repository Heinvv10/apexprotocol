# ApexGEO Audit & Remediation Roadmap — 2026-04-22

Comprehensive audit of stubs, TODOs, silent failures, skipped tests, and deferred work across the ApexGEO codebase. Sourced from five parallel agent sweeps across `src/`, `tests/`, `e2e/`, `scripts/`, and config.

**Headline numbers**
- `tsc --noEmit`: clean
- `vitest run`: 6,187 passing, **56 skipped**, 0 failing
- 48 inline TODO/FIXME/STUB/MOCK/UNTESTED markers
- 4 critical stubs masquerading as real implementations
- 12 skipped tests on security-boundary paths (auth / RBAC / filtering)
- 17 drizzle migrations deleted from tree but applied to prod (archived in `drizzle/legacy/`)
- **205/205 features claim `passes: true` in feature_list.json** — self-certification, not verified

---

## P0 — Trust-breakers. Fix before the next paying customer sees the dashboard.

These items cause Apex to *lie to users* in production. They are the single biggest risk to the product's credibility.

### P0-1. Insights / Recommendations sub-agent returns `Math.random()`
**File:** `src/lib/sub-agents/insights-recommendations/src/insights-recommendations-sub-agent.ts:397-543`
**Problem:** Generates 10 data points with `Math.random() * 100`, then fabricates confidence scores (`75 + Math.random() * 20`), correlations (`0.5 + Math.random() * 0.4`), and anomalies (`Math.random() > 0.7`). Everything the user sees as "actionable insight" is noise.
**Fix:** Either (a) wire to the real `recommendation_lift` table and historical mention data that Phase 2 recommendations engine already uses, or (b) feature-flag the entire sub-agent off until a real implementation ships. Do not leave it live with random data.
**Effort:** 2–3 days (option a) / 30 min (option b as stopgap).

### P0-2. AI platform query confidence scores are hardcoded
**File:** `src/lib/services/ai-platform-query.ts:313-540, 645-760`
**Problem:** `queryChatGPT/Claude/Gemini` return `confidenceScore: 0.85|0.9|0.8` as constants regardless of the actual response. Perplexity constructs a fake citation URL (`https://www.${brandName}.com`). Grok + Copilot return `null` on any error and fall back to a `Math.random()` template — 2 of 7 advertised platforms are non-functional.
**Fix:**
- Derive confidence from response signal (mention found + position + sentiment + citation presence), not a constant.
- Remove the fake Perplexity URL — null is honest.
- Either implement Grok/Copilot properly or remove them from the Tier-1 platform list everywhere (landing page, platform picker, feature_list).
**Effort:** 3–4 days. Touches GEO Score composition, so regression-test the scoring pipeline carefully.

### P0-3. Citations render as "Omitted" for every row
**File:** UI transformer consuming `/api/monitor/citations` — documented in `FEATURE_VERIFICATION.md:4-7`
**Problem:** Known regression. API returns citations; UI data-shape mismatch shows every row as "Omitted". feature_list still says `passes: true`.
**Fix:** Align the UI transformer with the mention schema (`citationUrl` field). Add a Playwright test that asserts at least one non-"Omitted" citation rendered for a known-good brand.
**Effort:** 0.5 day.

### P0-4. Reports module is a placeholder
**File:** `src/lib/reports.ts:33-50`, `src/app/api/reports/pdf/route.ts:77`, `src/app/api/reports/investor/route.ts:12`
**Problem:** `fetchReportData()` returns hardcoded `{ brandName: "Brand" }`. `ReportDocument` renders a single `<div>`. PDF export will produce an empty doc. Marked UNTESTED in code comments.
**Fix:** Either ship the real report generator (pull from `computeGeoScore`, mentions, citations, recommendations) or hide the "Generate Report" CTA until it works. Do not let users pay for a PDF that says "Brand" on a blank page.
**Effort:** 3–5 days for real implementation.

### P0-5. Dashboard analytics API calls return placeholder data
**File:** `src/lib/api/analytics.ts:258, 275, 292, 309, 349, 398`
**Problem:** Six TODO-marked functions feeding the main analytics dashboard — `unifiedScore`, `analyticsTimeSeries`, `leadsOverTime`, `revenueOverTime`, `sentimentAnalysis`, `conversionFunnel` — return hard-coded placeholders with `// TODO: Replace with actual API call when backend is ready`.
**Fix:** Wire each to its corresponding backend route (most already exist — e.g. `/api/analytics/geo-score` for unifiedScore). Where a backend route is missing, add it.
**Effort:** 2–3 days. Largely glue code.

### P0-6. `public/splash/` PWA assets uncommitted
**File:** 14 Apple splash screens (8.7 MB) under `public/splash/`, referenced by `public/manifest.json`
**Problem:** Untracked in git. Next prod Docker build will strip them → PWA install on iOS serves blank splash → broken install UX.
**Fix:** `git add public/splash/ && git commit`. Five minutes.
**Effort:** 5 minutes. Just do it.

### P0-7. Billing processor collision (Stripe vs PayFast)
**File:** `src/app/api/billing/route.ts` (Stripe SDK) vs `docs/PREMIUM_ROADMAP.md:183` (PayFast marked shipped) vs `src/lib/billing/local-payments.ts:161-175` (bank account numbers are `62XXXXXXXX` placeholders)
**Problem:** Two payment systems coexist; no clarity on which is live. Local bank transfer option shows masked placeholder account numbers.
**Fix:** Hein chooses one processor. Remove the other. Fill in real bank account numbers (from env or CMS) or remove the bank-transfer option from the UI.
**Effort:** 0.5 day for the decision + cleanup.

---

## P1 — Silent failures that will bite in production within weeks.

These don't lie to users outright, but they hide errors that will eventually surface as "why is my score wrong?" support tickets.

### P1-1. Audit worker swallows external-check failures
**File:** `src/lib/queue/workers/audit-worker.ts:124-132`
**Problem:** `safeCheck()` returns `[]` or `{ issues: [], score: 0 }` on any error. AI crawler detection, entity authority, content chunking, and page-speed all route through this. If any external API times out, the audit silently reports a clean bill of health.
**Fix:** Surface failures as explicit issues in the audit report ("Could not check X — try again") rather than omitting them. Log to Bugsink.
**Effort:** 1 day.

### P1-2. GEO score history persistence fails silently
**File:** `src/lib/analytics/geo-score-compute.ts:112-158`
**Problem:** Two independent try/catches around DB insert and notification dispatch. Both return `historyPersisted: false` silently on failure. Users see today's score but no trend line; no one notices for days.
**Fix:** Log to Bugsink on catch. If persistence fails for >1 day, surface a banner to the user ("Score history temporarily unavailable") instead of a silently-empty graph.
**Effort:** 0.5 day.

### P1-3. Brand scraper returns null on Playwright failure with no retry
**File:** `src/lib/services/brand-scraper-multipage.ts:162-164, 218-220`
**Problem:** Single try/catch around all scraping logic returns `null` with no logging of which method failed (Playwright vs static fallback). Missing brand metadata silently degrades GEO Score inputs.
**Fix:** Distinguish failure modes. Log to Bugsink. Retry static fallback when Playwright fails. Return a structured `{ ok: false, reason }` so callers can decide.
**Effort:** 1 day.

### P1-4. Reputation intelligence benchmarks are `Math.random()`
**File:** `src/lib/sub-agents/social-media-correlation/src/services/reputation-intelligence-service.ts:576-648`
**Problem:** `getBenchmarkData()` returns `averageScore: 55 + Math.random() * 20` with no DB query. Competitor position (`40 + Math.random() * 40`) is also fabricated.
**Fix:** Either persist real benchmarks from aggregated platform data or hide the "industry comparison" widget until real data is available.
**Effort:** 2 days (real impl) / 15 min (hide UI).

### P1-5. 12 skipped auth/RBAC tests in admin routes
**Files:** `src/app/api/admin/api-config/route.test.ts:386-425`, `src/app/api/admin/users/route.test.ts:289-758`
**Problem:** Tests covering 401/403 auth boundaries, super-admin role checks, suspended-user filtering, etc. are all `.skip`-ed because of vitest mock-hoisting issues. Security-critical paths are untested.
**Fix:** Refactor the mock strategy — use `vi.hoisted` or module factories so per-test overrides work. Unskip and verify.
**Effort:** 1–2 days.

### P1-6. WhatsApp + SMS alert channels silently no-op
**File:** `src/lib/alerts/delivery.ts:357, 372`
**Problem:** Both channels are selectable in the UI but the handlers just `console.warn('TODO')`. Users configure alerts that never fire.
**Fix:** Remove both options from the UI until implemented (or implement via Twilio/WhatsApp Business API if they're near-term commitments).
**Effort:** 30 min to hide; 2–3 days per channel to implement.

### P1-7. Logs committed to the repo
**Files:** `logs/ui/critiques.jsonl`, `logs/health/health-checks.jsonl`
**Problem:** Log files tracked in git → repo bloat + accidental data leakage risk.
**Fix:** Add `logs/` to `.gitignore`. `git rm --cached logs/ui/ logs/health/`. Route logs to `/tmp` or a mounted volume in Docker.
**Effort:** 15 min.

### P1-8. Duplicate PWA install-prompt / sw-register modules
**Files:** `src/components/providers/install-prompt.tsx` + `sw-register.tsx` (both untracked) vs `src/components/pwa/install-prompt.tsx` (tracked, committed earlier)
**Problem:** Two implementations exist. `layout.tsx` imports the providers/ version. The pwa/ version is dead code or vice versa.
**Fix:** Diff both, pick the winner, delete the loser, commit.
**Effort:** 30 min.

---

## P2 — Feature gaps with explicit TODOs but clear scope.

These are honestly-marked incomplete integrations. Safe to sequence after P0/P1.

### P2-1. Platform integration connectors (Slack / Discord / Teams / Webhook)
- `src/lib/api/integrations.ts:171, 190, 204, 214, 224` — 5 TODOs for connector implementations.
- Ship the webhook one first (simplest), then Slack (highest demand), Discord, Teams.
- **Effort:** 1 day per connector.

### P2-2. Social media platform APIs
- `src/lib/api/social.ts:201, 259, 316` — 3 TODOs for platform post/engagement APIs.
- Likely requires OAuth for each — scope before committing.
- **Effort:** 2–4 days per platform.

### P2-3. LinkedIn scraper is a stub
- `src/lib/services/linkedin-scraper.ts:11, 330-339` — interface only, silent empty-array return.
- LinkedIn actively blocks scraping. Pivot to a third-party API (Proxycurl, Coresignal) or remove the LinkedIn data surfaces from the audit.
- **Effort:** 1 day to swap to a paid API, or 30 min to remove.

### P2-4. Platform-monitor change-detector
- `src/lib/platform-monitor/change-detector.ts:402-417` — explicit `throw new Error('Not implemented')` for DB history queries.
- Not silently broken — fail-loud is better than the other items here — but the feature is advertised as live.
- **Effort:** 1 day.

### P2-5. Brand-scraper metadata extraction
- `src/lib/services/brand-scraper-multipage.ts:354, 401` — TODOs for meta-description and schema-type extraction.
- Small scope. Add cheerio-based extractors.
- **Effort:** 0.5 day.

### P2-6. Settings, Compose, People UI wiring
- `src/app/dashboard/settings/settings-client.tsx:678` (save to API), `src/app/dashboard/people/page.tsx:689` (add-person modal), `src/app/admin/social-media/compose/page.tsx:12,18` (draft + publish).
- All small — UI exists, backend wiring missing.
- **Effort:** 0.5 day each.

### P2-7. OAuth flows + disconnect endpoints
- `src/components/settings/settings-sections.tsx:477, 483`.
- Required for integrations to be usable end-to-end.
- **Effort:** 1–2 days.

---

## P3 — Test-quality debt.

None of these break users, but they erode confidence in "tsc + vitest pass" as a quality signal.

### P3-1. 15 tautological tests (`expect(true).toBe(true)`)
- `tests/lib/browser-query/o1-browser-query.test.ts:280-800` — 8 tests explicitly marked "Placeholder for integration test".
- `src/lib/db/queries/competitor-queries.test.ts:112-138` — 4 type-export checks that tsc already covers.
- `tests/integration/edge-cases.test.ts:445,483`, `tests/integration/brands.test.ts:581` — 3 placeholders.
- **Fix:** Either write the real test or delete. Placeholders that always pass are worse than no test — they give false confidence.
- **Effort:** 1–2 days to triage and clean up.

### P3-2. 30+ existence-only tests (`expect(fn).toBeDefined()`)
- `src/lib/db/queries/competitor-queries.test.ts:13-79` + `src/lib/sub-agents/social-media-correlation/tests/influencer-analysis-service.test.ts:911-1203`.
- These duplicate what tsc already checks. Replace with tests that call the function and assert behaviour.
- **Effort:** 2–3 days.

### P3-3. 2 integration tests skipped pending multi-org support
- `tests/integration/user-api-keys.test.ts:698`, `tests/integration/admin-api-keys.test.ts:840` — explicit "re-enable after multi-org" comments.
- Honest; clean up when multi-org ships.

---

## P4 — Code-quality & infra cleanup.

### P4-1. TypeScript escape hatches
- `src/lib/llm/observability.ts` — 8 × `eslint-disable no-explicit-any` (lines 119, 152, 168, 193, 213, 230, 262, 298).
- `src/components/forms/form-wrapper.tsx` — 4 × no-explicit-any.
- `src/components/monitor/platform-card.tsx:111` — `@ts-expect-error` for CSS custom property.
- **Fix:** Type the observability payloads and form-wrapper generics properly.
- **Effort:** 0.5 day.

### P4-2. tsconfig hardening
- Add `noUncheckedIndexedAccess: true`. Expect 100–200 new type errors; fix in batches.
- **Effort:** 1–2 days.

### P4-3. Drizzle migration consolidation
- 17 hand-written migrations applied to prod, moved to `drizzle/legacy/`, not in `meta/_journal.json`. New environments run 0000–0010 then must introspect to match prod.
- **Fix:** On next major schema sync, run `drizzle-kit introspect` to produce a canonical baseline, document the bridge, delete `drizzle/legacy/` once a fresh-env bootstrap has been verified.
- **Effort:** 1 day + verification in a throwaway DB.

### P4-4. .env.example drift
- 30+ `process.env.*` references in code that aren't documented in `.env.example`. One is a typo — `process.env.E`.
- **Fix:** Grep and reconcile. Fix the typo.
- **Effort:** 0.5 day.

### P4-5. package.json engines + runtime coherence
- No `engines` field. Dockerfile uses `bun` for installs but `node` for runtime. Dev onboarding unclear.
- **Fix:** Pin Node version in `engines`. Document the bun/node split in README.
- **Effort:** 30 min.

### P4-6. .gitignore additions
- `tmp/` (2.2 MB of dev scratch currently committed).
- `tsconfig.build.tsbuildinfo` (TS cache artifact).
- **Effort:** 5 min.

---

## Suggested sequencing

**Week 1 (this week):**
- P0-6 (splash commit) — 5 min
- P0-3 (citations) — 0.5 day
- P0-7 (billing decision) — 0.5 day
- P0-5 (analytics API wiring) — 2–3 days

**Week 2:**
- P0-2 (AI platform confidence) — 3–4 days
- P0-1 (insights sub-agent feature-flag off, real impl behind it) — 1 day stopgap

**Week 3–4:**
- P0-4 (reports module) — 3–5 days
- P1-1 through P1-8 (silent failures) — ~2 weeks

**Week 5+:**
- P2 items — scoped sprint-by-sprint
- P3/P4 — background cleanup

---

## Honest framing for feature_list.json

Replace the `passes: true / false` flag with a three-state: `{ implemented, verified, silent_degradation_risk }`. The current single flag has been the primary enabler of the regressions found here. The citations bug (P0-3) is already documented in `FEATURE_VERIFICATION.md` — extend that model to everything.

The feature list should be regenerated from a Playwright suite that exercises each listed feature on a seeded test tenant, not from a checklist Hein (or a subagent) ticks off. That's a separate project — call it P2-8.
