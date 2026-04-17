# Phase 4 — Secondary dashboard audit (2026-04-17)

Viewport: 1440×900. Session: `hein@h10.co.za` / org "Apex Audit" with "Apex Demo Brand" selected.
Screenshots: `docs/audit/screenshots/phase-4/`.

## Routes captured

| # | Route | Status | Notes |
|---|-------|--------|-------|
| 1 | `/dashboard/analytics` | 200 | Analytics dashboard |
| 2 | `/dashboard/engine-room` | 200 | "APEX Engines" — brand perception, competitive radar, citation analysis cards; "Configure Brand Profile" CTA |
| 3 | `/dashboard/feedback` | 200 | "APEX Feedback — Knowledge Graph Corrections" — 3-step detect/correct/verify flow, Configure Monitoring CTA |
| 4 | `/dashboard/notifications` | 200 | Notifications inbox |
| 5 | `/dashboard/people` | 200 | "APEX People" — PPO score card, Team Suggestions with Add Role CTAs, Key People / Recent AI Mentions sections |
| 6 | `/dashboard/portfolios` | 200 | "APEX Portfolios" — empty state with New Portfolio CTAs |
| 7 | `/dashboard/recommendations` | 200 | "APEX Recommendations" — Schema Opt / Content / Technical cards, "Run First Audit" CTA |
| 8 | `/dashboard/reports` | 200 | "APEX Reports — Executive Reports" — 4 stats (Total, Completed, Scheduled, Portfolios), empty Recent Reports |
| 9 | `/dashboard/reports/investor` | 200 | "APEX Investor Intelligence" — portfolio picker + date range, 3 stat tiles, empty Generated Reports |
| 10 | `/dashboard/reports/effectiveness` | 200 | "APEX Effectiveness Report" — clean empty state |
| 11 | `/dashboard/reports/roi` | 200 | "APEX Citation ROI" — **F15** (see below) |
| 12 | `/dashboard/audit/history` | 200 | "Score History" with our real audit data point — **F14** (see below) |
| 13 | `/dashboard/audit/scheduled` | 200 | Scheduled audits list |
| 14 | `/dashboard/audit/roadmap` | 200 | **F16** (see below) |
| 15 | `/onboarding` | 200 | Welcome wizard step 1/5, clean 2×2 feature grid, "Continue →" |

## Findings

### F14 — `/dashboard/audit/history` shows hardcoded `https://example.com` URL (LOW)

The page correctly renders our real audit data (Current Score: 64, +64 from last audit, Audits Completed: 1, score-trend-over-time dot at Apr 17). But the header URL label reads `https://example.com` instead of the actual audited URL (`https://apexgeo.app`). Looks like the page uses a placeholder rather than reading from the loaded audit record.

### F15 — `/dashboard/reports/roi` renders 4 empty KPI tiles (MEDIUM)

Top of the page shows four cards with cyan outlines but zero content (no labels, no values, no icons). Likely a data-fetch that returned `undefined` and the tile component is rendering the shell without a fallback. Should either (a) show skeleton loaders while loading, (b) show empty-state copy like "No ROI data yet — set up tracking links below", or (c) hide the tile grid entirely when there's no data.

### F16 — `/dashboard/audit/roadmap` without an audit id shows an error (MEDIUM)

Hitting the route directly renders:
> "Roadmap unavailable — Could not generate the improvement roadmap."
> [Back to audit]

Sidebar navigation appears broken (no sidebar visible on the page — likely the dashboard-shell wrapper isn't rendering). The route probably expects `?auditId=<id>` but doesn't handle the missing-param case gracefully. Fix: either redirect to `/dashboard/audit` when no id is present, or render a picker that lets the user choose which audit run's roadmap to view.

### F17 — Onboarding uses "Apex" while rest of app uses "ApexGEO" (LOW)

Step 1 of the onboarding wizard reads "Welcome to Apex" and "AI Visibility Platform", while the sidebar everywhere else reads "ApexGEO". Pick one — probably "Apex" (shorter, cleaner), then bundle with F3 in Phase 6.

## Positive notes

- Every secondary route uses the `APEX <PageName>` branded header pattern except predictions (F13) and onboarding (context-appropriate). Strong design consistency.
- Empty states are excellent: each has a themed icon, explainer copy, and a primary-gradient CTA. The pattern is repeated consistently across portfolios, recommendations, reports, feedback.
- "APEX People" page has a genuinely useful Team Suggestions block — 0/8 roles tracker, specific "Add CEO / CTO / Founder" cards with `high` priority pills and improvement impact text. Best example of gamified onboarding in the app.
- "APEX Engines" (`/dashboard/engine-room`) has clean 3-row action list (Brand Perception / Competitive Radar / Citation Analysis) with small icons + descriptions.
- Score history chart renders real data for our audit — the single data point shows up correctly on the trend + sub-score breakdown charts.

## Carry-over to Phase 5 / Phase 6

- F14, F15, F16 are all simple fixes — probably 10-30 min each in Phase 6.
- F17 folds into F3's broader branding consistency work.
- 24 of 30 secondary routes have the "APEX <Name>" gradient header — clean candidates for a `<BrandHeader pageName={...} />` extraction.
