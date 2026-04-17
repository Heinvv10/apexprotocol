# Phase 3 — Core dashboard audit (2026-04-17)

Viewport: 1440×900. Session: `hein@h10.co.za` / org "Apex Audit" (Clerk Dev).
Screenshots: `docs/audit/screenshots/phase-3/`.

## Routes captured

| # | Route | Status | Screenshot | Notes |
|---|-------|--------|------------|-------|
| 1 | `/dashboard` | 200 | `01-dashboard-root.png` | Onboarding hero — "Let's optimize your ..."; 4 step cards all "Completed" |
| 2 | `/dashboard/overview` | **404** | `02-dashboard-overview.png` | **Default Next.js 404, unstyled, light mode** |
| 3 | `/dashboard/brands` | 200 | `02-dashboard-brands.png` | Good empty state — cyan wireframe + dashed outline card |
| 4 | `/dashboard/monitor` | 200 | `02-dashboard-monitor.png` | "OFFLINE" badge; "Select a Brand" empty state |
| 5 | `/dashboard/competitive` | 200 | `02-dashboard-competitive.png` | Empty state similar to monitor |
| 6 | `/dashboard/insights` | 200 | `02-dashboard-insights.png` | "Select a Brand to View AI Insights" |
| 7 | `/dashboard/predictions` | 200 | `02-dashboard-predictions.png` | Predictions view |
| 8 | `/dashboard/create` | 200 | `02-dashboard-create.png` | Create view |
| 9 | `/dashboard/simulate` | 200 | `02-dashboard-simulate.png` | Simulate view |
| 10 | `/dashboard/audit` | 200 | `02-dashboard-audit.png` | Audit view |
| 11 | `/dashboard/settings` | 200 | `02-dashboard-settings.png` | Best reference implementation — form + toggles + preview |
| 12 | `/dashboard/help` | 200 | `02-dashboard-help.png` | Help Center with category cards — clean layout |

## Findings

### HIGH severity

**F1 — `/dashboard/overview` returns 404.** The sidebar has an "Overview" nav item linking to `/dashboard/overview`, but the route doesn't exist. Clicking it drops the user into an unbranded Next.js default error page. Either:
- Move the Overview content out of `/dashboard` and into `/dashboard/overview`, or
- Remove/rename the sidebar link to point at `/dashboard` (the root).

### MEDIUM severity

**F2 — Default Next.js 404 page bleeds through unstyled.** When an auth'd user hits a missing route they get a white-background Next error page with no Apex chrome, no nav back home, no dark mode. Ship a branded `src/app/not-found.tsx` inside `(dashboard)` using the token system (and another at the root for public routes).

**F3 — "ApexGEO" logo vs "APEX" page headers.** Sidebar logo renders `Apex**GEO**` (cyan suffix) while page breadcrumbs show uppercase `APEX`. Pick one — either `ApexGEO` everywhere or `APEX`/`Apex` everywhere. Today both appear on the same viewport (brands, monitor, insights, settings, audit).

### LOW severity

**F4 — Accessibility "Skip" links render visually.** "Skip to main content / Skip to navigation" text is visible in the top-left on every dashboard route. These should be `sr-only` with a `:focus-visible` override so they only appear during keyboard navigation. Current state clutters the viewport.

**F5 — Next.js dev indicator ("1 Issue" badge, bottom-left).** Visible in every screenshot. Dev-only — verify it's stripped in `next build`. If Sentry, audit the telemetry scope.

**F6 — "Collapse" sidebar control lives at the bottom.** Unusual; most dashboard UX places sidebar toggle at the top (opposite the logo). Document intent in the design system or move it. Not a bug, just an opinion call.

### Positive notes

- **Settings page (F-ref)** is the best example of the token system in action — left-rail nav card with cyan active state, card-primary form, card-secondary preview, proper toggle styling, cyan `Save Changes` CTA. Use it as the pattern reference when refactoring other pages in Phase 6.
- Empty states on `/monitor`, `/insights`, `/competitive` are consistent (centered icon + heading + explainer + CTA button). Design system is holding up.
- Help Center (`/dashboard/help`) has a clean 4-up quick-access grid + 6-up category grid. Iconography consistent.
- No `#4926FA` drift visible anywhere in these 12 routes — Phase 1 token migration is clean.

## Next in this phase

Still owed for Phase 3 scope (~20 pages):
- `/dashboard/brands/[id]` detail view (requires a brand)
- `/dashboard/monitor/citations` and sub-routes
- `/dashboard/audit/[runId]`
- `/dashboard/create/[contentId]`
- `/onboarding/*` (post-signup flow)

These all need data seeded — defer to after we scaffold a test brand via API (or after you add one through the UI).
