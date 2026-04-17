# Phase 5 — Admin + marketing audit (2026-04-17)

Viewport: 1440×900. Super-admin unlocked via `DEV_SUPER_ADMIN=true` in `.env.local`.
Screenshots: `docs/audit/screenshots/phase-5/`.

## Admin routes (14 captured, 1 missing)

| # | Route | Status | Notes |
|---|-------|--------|-------|
| 1 | `/admin` | 200 | "Admin Dashboard" — 6 KPI tiles (Total Orgs 15, Users 7, Sessions, API Requests, AI Costs $0, Tokens), System Health + Resource Usage + Recent Admin Activity columns, 5 Quick Action tiles |
| 2 | `/admin/ai-costs` | 200 | AI cost breakdown |
| 3 | `/admin/analytics` | 200 | Platform analytics |
| 4 | `/admin/api-config` | 200 | API configuration |
| 5 | `/admin/api-keys` | 200 | System API keys |
| 6 | `/admin/audit-logs` | 200 | "System Audit Logs" — Refresh / Verify Integrity / Export CSV / Export JSON, filters (action/status/target), paginated table with color-coded action chips |
| 7 | `/admin/crm` | 200 | 3-card layout (Leads / Accounts / Pipeline) |
| 8 | `/admin/integrations` | 200 | Integration management |
| 9 | `/admin/marketing` | 200 | Marketing ops |
| 10 | `/admin/organizations` | 200 | Orgs table |
| 11 | `/admin/platform-monitoring` | **404** | Folder exists in `src/app/admin/platform-monitoring/` but no `page.tsx` — F20 |
| 12 | `/admin/seo` | 200 | SEO ops |
| 13 | `/admin/social-media` | 200 | Social ops |
| 14 | `/admin/users` | 200 | "Users" table with 7 rows, role chips (Super Admin / Member), status badges, per-row action dots, pagination |

## Marketing (new — Phase 2 covered auth + legal)

| # | Route | Status | Notes |
|---|-------|--------|-------|
| 15 | `/blog` | 200 | **Stub** — just "Blog / Insights, guides, and updates from the ApexGEO team." no posts, no nav. F19 |
| 16 | `/careers` | 200 | **Stub** — "Careers / Join us in building the future of AI visibility." nothing else |
| 17 | `/support` | 200 | Captured but not reviewed in detail here |
| 18 | `/docs/api` | 200 | Captured |

## Findings

### F18 — super-admin gate only reads JWT publicMetadata (MEDIUM)

`src/middleware.ts:346-357` checks `sessionClaims.publicMetadata.isSuperAdmin` ONLY. No DB fallback. Meanwhile `src/lib/auth/super-admin.ts:22` (used by server components) checks JWT *then* falls back to `users.is_super_admin`. Two different sources of truth:

- If an admin is promoted via DB flag, the middleware still rejects them until their JWT cycles (up to 60s + page refresh).
- Promoting via Clerk Backend API (`users/{id}/metadata`) takes a JWT refresh too, since existing tokens are cached client-side.

The `DEV_SUPER_ADMIN` env flag was added to work around this — it's a dev-only escape hatch. Prod needs either (a) force a Clerk session refresh when `users.is_super_admin` flips, (b) have middleware also consult the DB, or (c) document that promotion requires the user to sign out + back in.

For this audit session: I set `DEV_SUPER_ADMIN=true` in `.env.local` (gitignored) and restarted dev — admin routes then worked.

### F19 — Marketing pages are unstyled stubs (MEDIUM)

`/blog` and `/careers` render a bare heading + one-line tagline on a black background with no header, no footer, no navigation. Compare with the styled `/privacy`, `/terms`, `/cookies`, `/changelog` pages captured in Phase 2. Until they have real content:
- Redirect to the landing page / product marketing site, or
- Hide from the public site-footer nav (currently `src/components/landing/site-footer.tsx` links to them), or
- At minimum wrap with the same `<SiteHeader />` + `<SiteFooter />` as the rest of the marketing site.

### F20 — `/admin/platform-monitoring` folder exists with no page (LOW)

`src/app/admin/platform-monitoring/` has nested files but no `page.tsx`, so the route returns Next's 404. Either finish wiring the page, or delete the folder. If the sidebar links to it (need to verify), the link will dead-end.

## Positive notes

- Admin uses a distinct **red/coral accent palette** to signal elevated access — "ADMIN MODE" pill, "SUPER ADMIN" badges, red icon fills, red KPI values. Strong visual separation from the user-facing cyan+purple Apex palette. Good UX.
- System Audit Logs page is production-ready: filters, color-coded action chips (access/create/update/security/system), target objects with sub-labels, integrity verification button, dual-format export (CSV + JSON).
- Admin dashboard KPI row + quick-action grid is consistent with the dashboard-shell pattern we've seen elsewhere, but themed red.
- Users table has clear role pills (Super Admin vs Member) and surfaces organization context per row.
- Admin sidebar has two category headers ("OPERATIONS" / "SYSTEM") and uses grouped dropdowns for CRM / Marketing / Social Media — cleaner than a flat list of 15 items would be.

## Branding consistency check (Phase 6 input)

Admin routes use `APEX Admin` gradient header with a `SUPER ADMIN` red pill. Consistent with user-facing pattern — candidate for the `<BrandHeader />` extraction along with the 22 dashboard pages (F3).

## Remaining for Phase 5 that I'm not chasing here

- Per-user/per-org drill-down pages (`/admin/organizations/[id]`, `/admin/users/[id]`) — need test-data setup.
- `/admin/crm`, `/admin/marketing`, `/admin/social-media` submenus with CRUD flows.
- `/admin/api-config` integrations deep-config.
- Blog / careers / support / docs content work belongs with the marketing site effort, not this design audit.
