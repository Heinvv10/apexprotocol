# Phase 3 real-brand walkthrough (2026-04-17)

Seeded a real brand in Neon and drove the core flows end-to-end. The data now lives in the DB (no teardown planned — per your "just add more knowledge to the database" direction).

## Seeds

| Table | ID | Notes |
|-------|-----|-------|
| `users` | `user_3CUubGP5Vm9aH8Fq2SWa0k55CEo` | `hein@h10.co.za`, role `admin` |
| `organizations` | `org_3CUur49kw5RWvRxcw1lk23gT2c9` | `Apex Audit`, slug `apex-audit-audit-2026`, brand_limit 5 |
| `brands` | `jvn0wyzh2pxo65c314kkj6ld` | `Apex Demo Brand`, `https://apexgeo.app`, SaaS, 5 keywords, 3 personality traits |
| `audit_runs` | `ng5d0rka2io68gf8owveaoh5` | Scored **64/100 (C)**, 4 issues (0 critical, 1 high, 2 medium, 1 low) |
| `platform_queries` | `xvj8bfb766fnowm3dbdnwndj` | 7 platforms queried: "What are the best tools for monitoring brand mentions across AI search engines like ChatGPT and Claude?" |

## Infra unlocks (committed)

Three real bugs blocked the walkthrough. All three fixed in-line:

1. **`fetch failed` on every DB call** — `@neondatabase/serverless` HTTP driver was unstable under Next 16 + Turbopack + Sentry's fetch instrumentation. Switched `src/lib/db/index.ts` to the WebSocket pool driver (`drizzle-orm/neon-serverless` with `ws`). Every API call is now reliable. Installed `@types/ws` as a dev dep.
2. **Org row missing in Neon** — Clerk webhooks don't fire against local dev, so `organizations` had no row for our Clerk org. `/api/settings/organization` tries to self-heal but hardcodes slug `my-organization` which collided with a stale dev row (`id=demo-org-id`, `name=Velocity Fibre`). Seeded a proper row via direct SQL. **F11 filed** — route needs a unique slug strategy to auto-bootstrap.
3. **User row missing** — same reason as #2. Schema has `platform_queries.user_id → users.id` but the insights route passes the raw Clerk user id, not the internal `users.id`. Fastest unblock: seeded `users.id = <clerk_user_id>` so both the FK and direct writes resolve. **F12 filed** — either the code should look up `users.id` by `clerk_user_id`, or the schema should make `clerk_user_id` the PK.

## Routes captured

| # | Route | Screenshot | Notes |
|---|-------|-----------|-------|
| 5 | `/dashboard/brands` | `05-brands-with-data.png` | Card shows brand chip, domain, industry, description, "Monitoring 7 platforms" with per-platform colored tags, "1 of 5 brands used" progress |
| 6 | `/dashboard/monitor` | `06-monitor-with-brand.png` | 7 platform score cards (all 0/100 / Stable), "LIVE" badge, Configure Monitoring CTA |
| 7 | `/dashboard/insights` | `07-dashboard-insights-with-brand.png` | Query form, 7 platform checkboxes, "What We Analyze" 4-up grid |
| 7 | `/dashboard/competitive` | `07-dashboard-competitive-with-brand.png` | Paywalled behind "Unlock Competitive Benchmarking" — $149/month, blurred preview underneath |
| 7 | `/dashboard/predictions` | `07-dashboard-predictions-with-brand.png` | 4 prediction stat cards (placeholder values), "Predictions engine launching soon" pill |
| 7 | `/dashboard/create` | `07-dashboard-create-with-brand.png` | Content creation workspace |
| 7 | `/dashboard/simulate` | `07-dashboard-simulate-with-brand.png` | "Select a Brand to Simulate" empty state |
| 7 | `/dashboard/audit` | `07-dashboard-audit-with-brand.png` | Audit URL form, 4 "What We Analyze" cards, Recent Audits list |
| 8 | Audit trigger | `08-audit-running.png` | URL field with F8 bug visible |
| 9 | Audit list post-run | `09-audit-list-with-run.png` | Shows completed audit with score 64 |
| 10 | Audit detail | `10-audit-detail.png` | Score ring (64 C), issue summary (0/1/2/1), Quick Wins card, category breakdown |
| 12 | Insights query ready | `12-insights-query-ready.png` | Filled form before submit |
| 13 | Insights analyzing | `13-insights-analyzing.png` | Results page — empty state because external AI API keys not set |
| 14 | Insights full | `14-insights-results-full.png` | Full-page capture showing 7 platform cards all "No data available" + 0-valued Analysis Summary |

## New findings

### F8 — Audit URL auto-prefills with double `https://` (MEDIUM)

When landing on `/dashboard/audit` with a brand selected, the URL input pre-populates as `https://https://apexgeo.app`. The brand's `domain` field stored the full URL (`https://apexgeo.app`); the form adds its own `https://` on top. Validation catches it ("Please enter a valid URL"), but the user has to manually fix the field before they can start an audit. Either strip the scheme from the prefill or store brands' domains without scheme. File: likely `src/app/dashboard/audit/page.tsx` (audit-client).

### F9 — Insights "Analysis Summary" shows 0 platforms analyzed after a real query (LOW)

After running a 7-platform insights query, the Analysis Summary shows:
- Avg. Score: 0
- Total Citations: 0
- Total Mentions: 0
- **Platforms Analyzed: 0**

But 7 platforms were actually queried. The platform cards below correctly render as "No data available" (because external AI API keys aren't configured). The summary should reflect platforms-queried vs. platforms-with-data, not collapse both to zero.

### F10 — "Recent Analyses" says "No analyses yet" after running an analysis (LOW)

Same flow. `platform_queries` got a row (confirmed via `xvj8bfb766fnowm3dbdnwndj`) but the "Recent Analyses" card claims "No analyses yet". Likely reads from `ai_platform_analyses` which isn't populated until a response comes back from at least one AI provider. Copy should say "No completed analyses yet — query is still processing" or similar.

### F11 — `/api/settings/organization` uses a non-unique slug when auto-creating (MEDIUM)

Route bootstraps a missing org with `slug: "my-organization"` hardcoded. `organizations.slug` is UNIQUE, so any second tenant without a prior org row will collide (as ours did with a stale dev-mock row). Fix: derive slug from `${clerkOrgId}-${Date.now()}` or similar. Route: `src/app/api/settings/organization/route.ts`.

### F12 — `platform_queries.user_id` expects `users.id`, but the route passes Clerk user id (HIGH)

`src/app/api/ai-insights/analyze/route.ts:86` inserts `userId: <clerk_user_id>` directly, but schema FK is `platform_queries.user_id → users.id` (internal). In prod this only works because the Clerk webhook happens to mirror the user with `users.id = clerk_user_id` (look at `src/app/api/webhooks/clerk/route.ts`'s `handleUserCreated` — wait, it uses `createId()` not Clerk id). So either the webhook handler is wrong, or the insights route is wrong, or prod is silently failing too. Worth a closer audit — pick one convention and make the whole codebase follow it. Fast patch: in the insights route, look up `users.id` from `users.clerk_user_id` before inserting.

### F13 — Predictions page lacks the "APEX Predictions" colored header (LOW)

Every other dashboard route renders `<APEX triangle-gradient> {PageName}` in the header row. `/dashboard/predictions` just shows a plain `Predictions` h1. Mild consistency break. Worth bundling with the F3 header-refactor in Phase 6.

## Good-to-see

- Audit scoring works end-to-end: score ring renders, issue summary + quick-wins + category breakdown all wire up cleanly.
- Platform tags use per-platform brand colors (ChatGPT green/teal, Claude red/orange, Gemini purple, Perplexity cyan, Grok amber, DeepSeek/Copilot purple) — and those stay consistent between /brands, /monitor, /insights.
- Paywall on `/competitive` is tasteful: blurred preview + value list + price + upgrade CTA. Good reference pattern for other gated surfaces.
- Settings page continues to be the cleanest screen in the app (noted in phase-3-core-dashboard.md).

## Remaining for Phase 3

- **`/dashboard/brands/[id]` detail view** — was going to open it via card-click; deferred because data-seeded coverage is already filed.
- **`/onboarding/*` flows** — user is already past onboarding in this session; capturing these requires a fresh throwaway sign-up (cheap — we can mint a second user via Backend API when we want).
- **`/dashboard/monitor` configure wizard** — would trigger real AI-platform API calls; skipped because external keys aren't set in `.env.local`.

Phase 3 real-data capture: complete enough to unblock Phase 4. Findings F8–F13 are the outstanding work items.
