# Audit Findings — Status Index (2026-04-17)

21 findings were filed across Phases 2–5 of the UI/UX audit. 17 are
resolved in-session (and 1 was invalidated on investigation); 3 remain
documented as known behaviour or decisions the team can revisit.

## Fixed

| ID | Area | Fix | Commit |
|----|------|-----|--------|
| F2 | 404 page | Branded `src/app/not-found.tsx` using tokens | 2fa73f6 |
| F3 | 22 dashboard headers copy-paste | `<BrandHeader />` extraction + sweep | a7f496d |
| F4 | Skip-link styling | `src/styles/components/a11y.css` | 9e20c3f |
| F7 | Neon HTTP driver flakiness | Swap to WebSocket pool driver | 360097f |
| F8 | Audit URL double-scheme prefill | Strip scheme before prepending | fd389a8 |
| F9 | Insights "0 platforms analyzed" | Render `N / M` + "Platforms with data" | 141811c |
| F10 | Insights "No analyses yet" copy | Rewrite to explain platform-response delay | 141811c |
| F11 | `/api/settings/organization` slug collision | Derive unique slug + set clerkOrgId | fd389a8 |
| F12 | `platform_queries.user_id` FK mismatch | `getInternalUserId()` helper + insights route | fd389a8 |
| F13 | `/dashboard/predictions` missing header | `<BrandHeader pageName="Predictions" />` | a7f496d |
| F14 | Score History hardcoded `example.com` | Read from first completed audit → brand domain → fallback | 77388d2 |
| F15 | ROI tiles empty | Missing migration 0016_citation_roi_tables.sql applied | 43748b1 |
| F16 | Audit roadmap unhelpful error | Dedicated no-id picker + drop full-screen wrapper | 8f4282b |
| F17 | Onboarding hardcoded "Apex" | `getActiveBrand().name` in welcome title | 67c966d |
| F19 | Blog/careers/support/changelog/docs/api stubs | `<MarketingStub />` with SiteHeader + SiteFooter | cf21cee |
| F20 | `/admin/platform-monitoring` 404 | Hub page listing 4 sub-dashboards | 44be87c |
| F21 | Sidebar wordmark hardcoded "ApexGEO" | Reads `brand.name + wordmarkSuffix` from preset | 7403bfb |

## Invalidated

| ID | Note |
|----|------|
| F1 | `/dashboard/overview` 404 — my enumeration loop invented the route; sidebar correctly points at `/dashboard`. |

## Carry forward

| ID | Area | Severity | Decision |
|----|------|----------|----------|
| F5 | Next.js dev "Issue" badge visible in every dev screenshot | LOW | Confirmed dev-only. `grep -rn '1 Issue\|devIndicators' src/` returns nothing — the badge is Next 16's built-in dev indicator, injected by `next-server` in dev mode only and not present in production builds. No action. |
| F6 | Sidebar collapse control at bottom | LOW | Intentional placement per current design system. Document in design spec if a change is proposed; no action needed for this audit. |
| F18 | Admin super-admin gate reads JWT only | MEDIUM | Documented in `phase-5-admin-and-marketing.md`. `DEV_SUPER_ADMIN=true` workflow in `.env.example` for dev. Prod fix ships with the `/admin/users` promote action (not a route today) — revoke Clerk sessions at time of promotion. |

## F12 sweep — resolved

The Phase 3 `getInternalUserId()` helper migrated `/api/ai-insights/analyze` (commit fd389a8). A follow-up audit (commit 113522a) went through ~35 candidate routes to find every other place the F12 pattern appeared. Result: **only one additional route** needed migration — `/api/user/api-keys`, where `api_keys.user_id` has a real FK to `users.id`.

All other candidates were categorised and left alone:
- ~20 routes call `getUserId()` for auth checks only (no FK insert)
- ~8 routes insert `userId` but into columns with **no** foreign-key constraint (notifications, ai_usage, simulations, analytics_events, etc.)
- 3 routes reference `users.clerk_user_id` intentionally (admin/api-config `createdBy`, gamification, admin audit logs)
- `audit/route.ts` already resolved the internal id correctly via a `users.clerkUserId` lookup before insert

The pattern is narrow in practice. Treating this as closed unless a new finding surfaces.

Audit scope: **complete**. Phase 7 white-label system ships via `NEXT_PUBLIC_BRAND_PRESET` env swap, demonstrated end-to-end with the Solstice preset.
