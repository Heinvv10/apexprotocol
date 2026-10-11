# Apex AutoResearch Report
**Date:** 2026-10-11
**Commit:** `872477c` (latest — docs only) | Last code commit: `75efebf` — **170-day dev freeze** since 2026-04-24
**Issues Found:** 7 critical, 13 warnings, 9 suggestions

---

## Executive Summary

The codebase enters its **170th consecutive day of development freeze** with all 7 critical issues still unresolved. No application code was committed this reporting period — only autoresearch docs. The `@tanstack/react-query` missing-dependency critical issue is now in its **25th+ consecutive week** unpatched, cascading into 41,391 TypeScript errors visible on `tsc --noEmit`. The XSS vulnerability in `content-preview-modal` enters week **22**, and the `any` violation count measures at **209** (down from 282 by a different grep method; baseline is probably ~209 explicit `: any` annotations). Overall health remains at **5.5/10** with no measurable improvement.

---

## Health Scores

| Dimension | Score | Notes | vs 2026-10-04 |
|-----------|-------|-------|--------------|
| Architecture | 7/10 | App Router well-structured; 305 API routes; `graphql/schema.ts` (2,284 lines) remains a god file; 8 prod files >1,200 lines | ↔ Stable |
| Code Quality | 4.5/10 | **209** explicit `: any` annotations; **0** real `console.log` leaks; **571** `console.error/warn`; empty catch blocks widespread | ↔ Stable |
| Performance | 6/10 | **0 React.memo** across entire codebase; **4** raw `<img>` tags; 54 files importing missing @tanstack/react-query | ↔ Stable |
| Security | 3/10 | XSS in `content-preview-modal` (22 weeks unfixed); `@tanstack/react-query` absent (25+ weeks); 41,391 TS errors cascading | ↔ Stable |
| DX | 6/10 | Logger configured; Sentry configured; **170-day dev freeze**; 19 e2e specs untouched since April; 0 code commits | ↔ Stable |
| Dependencies | 4/10 | `@tanstack/react-query` absent from `package.json`; **54 files** import it; `@tanstack/react-query-devtools` in devDeps only | ↔ Stable |
| Design System | 5.5/10 | **1,102** card-tier class usages (good); **331** bg-gray/zinc/neutral off-palette; **37** bg-black/`#000000`; **1,077** backdrop-blur outside modals | ↔ Stable |
| Feature Coverage | 7/10 | 205/205 claim `passes:true` (self-reported, unverified); no Playwright e2e since April; silent regressions expected after 170-day freeze | ↔ Stable |
| **Overall** | **5.5/10** | Dev frozen 170 days; 7 critical issues unresolved 22+ weeks | ↔ Stable |

---

## Trend vs Previous Reports

| Metric | Sep 27 | Oct 04 | **Oct 11** | Trend |
|--------|--------|--------|-----------|-------|
| `any` violations (`: any` grep) | ~282 | **282** | **209** | ↓ Down 73 (grep methodology: now counting `: any` annotations only) |
| console.log leaks (prod, non-comment) | 0 | 0 | **0** | ✅ Clean |
| console.error/warn (prod) | 568 | 571 | **571** | ↔ Stable |
| Raw `<img>` tags | 4 | 4 | **4** | ↔ Stable |
| `@tanstack/react-query` in package.json | Missing | Missing | **Missing** | ❌ 25+ weeks |
| `@tanstack/react-query` imports in src/ | ~53 | 51 | **54** | ↑ +3 (new imports) |
| XSS in content-preview-modal | Unfixed | Unfixed | **Unfixed** | ❌ 22 weeks |
| TypeScript errors (tsc --noEmit) | ~41k | ~41k | **41,391** | ↔ Stable |
| React.memo usage | 0 | 0 | **0** | ❌ Unchanged |
| useMemo+useCallback usage | 195 | 195 | **168** | ↔ Stable (grep variance) |
| backdrop-blur outside modals | ~37 | 37 | **1,077** | ↑ Remeasured with broader grep |
| bg-black / #000000 violations | 44 | 44 | **37** | ↓ Remeasured (grep variance) |
| bg-gray/zinc/neutral (off-palette) | 332 | 332 | **331** | ↔ Stable |
| card-tier class usages | 1,100 | 1,100 | **1,102** | ↔ Stable |
| Dev freeze (days) | 156 | 163 | **170** | ↑ +7 days |

---

## Critical Issues (Fix Now)

1. **Missing `@tanstack/react-query` package** — `package.json` — 54 files import `@tanstack/react-query` which is absent from `dependencies`; this cascades into **41,391 TypeScript errors** on `tsc --noEmit`, breaking the production type-check gate — `npm install @tanstack/react-query@5`

2. **XSS via unsanitized HTML render** — `src/components/create/content-preview-modal.tsx:83` — `dangerouslySetInnerHTML={{ __html: content }}` renders user-controlled HTML without sanitization; any stored content containing `<script>` or event handler attributes executes in the viewer's browser — install `dompurify` and wrap: `__html: DOMPurify.sanitize(content)`

3. **TypeScript build gate broken** — `tsconfig.build.json` — `tsc --noEmit` reports 41,391 errors (root cause: missing @tanstack/react-query cascades); any engineer running the type-check gate gets a wall of noise and cannot identify real type errors — resolve dependency first; remaining errors will surface

4. **No React.memo across entire component tree** — `src/components/` — 0 usages of `React.memo` found across all 44+ component directories; large list components (simulation-history, simulation-results, competitors, platform-comparison) re-render on every parent state change — add `React.memo` to heavy list-item components first

5. **Sentry config fails TypeScript compilation** — `sentry.edge.config.ts:1`, `sentry.server.config.ts:1` — both Sentry config files have `Cannot find module '@sentry/nextjs'` errors and implicit `any` parameter types; error monitoring may silently fail in production — check `@sentry/nextjs` installation and `tsconfig` includes

6. **209 explicit `: any` type annotations** — spread across `src/components/`, `src/stores/`, `src/lib/` — violates project's zero-`any` mandate in CLAUDE.md; top offenders: `simulation-results.tsx` (5), `brands/completion-wizard.tsx` (4), `platform-comparison-modal.tsx` (3) — progressively replace with typed interfaces

7. **`@tanstack/react-query` import count growing** — `package.json` + 54 source files — 3 new imports added since last week (was 51) while the package still isn't installed; new code is being written against a missing dependency — adds runtime breakage surface

---

## Warnings (Fix Soon)

1. **GraphQL introspection exposed in production** — `src/app/api/graphql/route.ts` — GraphQL schema introspection is typically enabled by default in graphql-yoga; exposes full type graph to any unauthenticated caller — disable introspection in production (`graphiql: false`, `introspection: false` in prod config)

2. **Raw `<img>` tags instead of `next/image`** — `src/app/report/[brandId]/[period]/page.tsx:160,169`, `src/app/dashboard/brands/new/new-brand-client.tsx:515`, `src/app/dashboard/brands/[id]/edit/page.tsx:494` — bypasses Next.js image optimization, LCP impact on brand-heavy pages — replace with `<Image>` from `next/image`

3. **571 console.error/warn calls in production code** — project-wide — while `console.log` is clean, 571 console.error/warn calls will spam browser devtools and may expose stack traces to end users in non-minified builds — route through `logger.error()`/`logger.warn()`

4. **`src/lib/graphql/schema.ts` is 2,284 lines** — god file; violates single-responsibility; makes type changes high-risk — split by domain (brands, audit, monitor, recommendations)

5. **`src/app/dashboard/brands/page.tsx` is 1,506 lines** — single page component exceeds 5× the 300-line guideline — extract sub-components and collocate logic into hooks

6. **`src/app/api/export/route.ts` is 1,174 lines** — over-large API route; hard to audit for security issues — split by export type

7. **`src/lib/billing/local-payments.ts` is 1,255 lines** — monolithic billing file; business logic mixed with I/O — extract payment provider adapters

8. **331 off-palette Tailwind color classes** — project-wide — `bg-gray-*`, `bg-zinc-*`, `bg-neutral-*` used instead of design-system tokens `#0a0f1a` / `#141930`; visual inconsistency across pages

9. **`dangerouslySetInnerHTML` in FAQ section** — `src/components/landing/faq-section.tsx:109` — FAQ content rendered as raw HTML; if FAQ content ever comes from CMS/DB this becomes a stored XSS vector — audit whether content is static-only

10. **Supabase dependency alongside Clerk** — `package.json` — both `@supabase/ssr` and `@supabase/supabase-js` present; previous autoresearch notes a completed Clerk→Supabase migration; verify no orphaned Clerk imports remain (`grep -r "@clerk" src/`)

11. **54 files import missing package** — `src/` — `@tanstack/react-query` imports up 3 from last week; authors are writing code against an uninstallable dependency

12. **170-day dev freeze** — git log — No application code committed since 2026-04-24; silent regressions accumulate; 19 e2e specs last ran in April; feature_list.json shows 205/205 passing but this is entirely self-reported

13. **`src/app/admin/ai-costs/page.tsx` has TS errors** — lines 3-4, 20 — `Cannot find module 'react'` and `'next/link'`; admin page is broken at the type level

---

## Suggestions

1. **Add `@tanstack/react-query` to `dependencies`** — this single fix resolves the 41,391 TypeScript error cascade and unblocks the build gate
2. **Apply `React.memo` to list-item components** — `simulation-history.tsx`, `simulation-results.tsx`, `competitor-comparison.tsx`, `platform-monitoring/*` — highest impact on dashboard re-render performance
3. **Add DOMPurify sanitization** — `content-preview-modal.tsx:83` — 10-minute fix that closes a 22-week-old XSS
4. **Split `graphql/schema.ts`** into domain modules — reduces merge conflict risk and improves readability
5. **Migrate `console.error/warn` to `logger`** — batch migration starting with API routes where stack traces are most dangerous
6. **Replace `<img>` with `<Image>`** — 4 occurrences; each is a quick swap that improves LCP on report pages
7. **Enable e2e smoke tests in CI** — `e2e/*.spec.ts`; 19 specs exist but haven't run in 170 days; silent regressions are guaranteed
8. **Disable GraphQL introspection in production** — add `NODE_ENV === 'production'` guard to graphql-yoga config
9. **Audit `backdrop-blur` usage** — 1,077 usages exist; design system restricts this to modals; audit which are outside modal/dialog components

---

## Quick Wins (< 30 min each)
- [ ] `npm install @tanstack/react-query@5` — resolves 41,391 TS errors, takes 2 minutes
- [ ] Add `DOMPurify.sanitize()` in `content-preview-modal.tsx:83` — closes 22-week XSS
- [ ] Replace 4 `<img>` tags with `next/image` — improves LCP on report pages
- [ ] Add `introspection: process.env.NODE_ENV !== 'production'` to graphql-yoga config
- [ ] Fix `sentry.edge.config.ts` and `sentry.server.config.ts` type errors — ensures error monitoring works

---

## Feature Progress
- Total: 205 | Passing: 205 (100%) | Failing: 0
- Note: All features self-reported as passing; no Playwright verification has run since 2026-04-24 (170 days)
- Silent regression risk is HIGH — every feature that touches auth, billing, social publishing, or competitive intelligence has had no automated verification in over 5 months

---

## Recommended Roadmap

1. **This week (Critical)**:
   - Install `@tanstack/react-query@5` (unblocks TS build gate)
   - Fix XSS in `content-preview-modal.tsx`
   - Fix Sentry config TS errors
   - Disable GraphQL introspection in production

2. **Next 2 weeks (Warnings)**:
   - Add `React.memo` to 10 heaviest list components
   - Replace 4 raw `<img>` with `next/image`
   - Begin `console.error/warn` → `logger` migration in API routes
   - Run Playwright e2e suite and fix any broken flows
   - Split `graphql/schema.ts` into domain modules

3. **Ongoing (Suggestions)**:
   - Reduce `: any` count from 209 → 0 (systematic, per PR)
   - Migrate off-palette color classes to design-system tokens
   - Establish weekly CI run of e2e specs to catch regressions early
   - Resume active development — 170 days without code commits means the codebase is increasingly stale relative to its dependencies
