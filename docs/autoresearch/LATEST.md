# Apex AutoResearch Report
**Date:** 2026-11-22
**Commit:** `54c4d64` (latest — docs only) | Last code commit: `75efebf` — **212-day dev freeze** since 2026-04-24
**Issues Found:** 7 critical, 13 warnings, 9 suggestions

---

## Executive Summary

The codebase enters its **212th consecutive day of development freeze** with all critical issues still unresolved. No application code was committed this reporting period — only autoresearch docs. The `@tanstack/react-query` missing-dependency critical issue is now in its **31+ consecutive week** unpatched, with **43,622 TypeScript errors** on `tsc --noEmit` (unchanged for 4+ weeks). The XSS vulnerability in `content-preview-modal` enters week **28**. The `: any` annotation count rose from **178 to 209** (+31, +17.4%) and total catch blocks increased from 1,220 to 1,347 (+127). Overall health remains at **5.5/10** with no measurable improvement and the dev freeze extending into its 8th month.

---

## Health Scores

| Dimension | Score | Notes | vs 2026-10-25 |
|-----------|-------|-------|--------------|
| Architecture | 7/10 | App Router well-structured; 305 API routes; `graphql/schema.ts` (2,284 lines) still a god file; 31 prod files >1,000 lines; 581 files >300 lines; 22 TODO/FIXME markers (stable) | ↔ Stable |
| Code Quality | 4/10 | **209** explicit `: any` annotations (+31); **3** `console.log` leaks (stable); **569** `console.error/warn`; **1,347** catch blocks (+127); 22 TODO/FIXME; **134** `as any` casts | ↓ Slight regression |
| Performance | 6/10 | **0 React.memo** across entire codebase; **4** raw `<img>` tags; 52 files importing missing `@tanstack/react-query`; 195 useMemo/useCallback | ↔ Stable |
| Security | 3/10 | XSS in `content-preview-modal` (28 weeks unfixed); `@tanstack/react-query` absent (31+ weeks); **43,622** TS errors; 196/305 routes lack Zod validation; all cron routes validate `CRON_SECRET` ✅ | ↔ Stable |
| DX | 6/10 | Logger configured; Sentry configured; CSP headers in next.config.ts ✅; **212-day dev freeze**; 24 e2e specs untouched since April; 0 code commits; 22 TODOs unactioned | ↔ Stable |
| Dependencies | 4/10 | `@tanstack/react-query` absent from `package.json` prod deps; **52 files** import it; `next@16.1.1` (above stable 15.x); supabase (283 files) + clerk (9 files) dual auth complexity; npm 12.x available | ↔ Stable |
| Design System | 5.5/10 | **1,120** card-tier class usages (+15); **332** bg-gray/zinc/neutral off-palette (+1); **37** backdrop-blur outside modals/overlays (-3); **0** `#000000` inline violations | ↔ Stable |
| Feature Coverage | 7/10 | 205/205 claim `passes:true` (self-reported, unverified); no Playwright e2e since April; silent regressions expected at 212-day dev freeze | ↔ Stable |
| **Overall** | **5.5/10** | Dev frozen 212 days; 7 critical issues unresolved 24+ weeks | ↔ Stable |

---

## Trend vs Previous Reports

| Metric | Oct 11 | Oct 18 | Oct 25 | **Nov 22** | Trend |
|--------|--------|--------|--------|-----------|-------|
| `any` violations (`: any` grep, src/) | 209 | 178 | 178 | **209** | ↑ +31 (regression) |
| `as any` casts (src/) | — | 82 | 134 | **134** | ↔ Stable |
| console.log leaks (src/, non-comment) | 0 | 0 | 3 | **3** | ↔ Stable |
| console.error/warn (src/) | 571 | 568 | 571 | **569** | ↓ Slight improvement |
| Raw `<img>` tags | 4 | 4 | 4 | **4** | ↔ Stable |
| `@tanstack/react-query` in package.json | Missing | Missing | Missing | **Missing** | ❌ 31+ weeks |
| `@tanstack/react-query` imports in src/ | 54 | 54 | 54 | **52** | ↓ Slight improvement |
| XSS in content-preview-modal | Unfixed | Unfixed | Unfixed | **Unfixed** | ❌ 28 weeks |
| TypeScript errors (tsc --noEmit) | 41,391 | 43,622 | 43,622 | **43,622** | ↔ Stable |
| React.memo usage | 0 | 0 | 0 | **0** | ❌ Unchanged |
| useMemo+useCallback usage | 168 | 195 | 168 | **195** | ↔ Stable |
| backdrop-blur outside modals | 1,077 | 36 | 40 | **37** | ↓ Slight improvement |
| bg-gray/zinc/neutral (off-palette) | 331 | 343 | 331 | **332** | ↔ Stable |
| card-tier class usages | 1,102 | 1,102 | 1,105 | **1,120** | ↑ +15 (expected growth) |
| TODO/FIXME markers (src/) | — | 31 | 22 | **22** | ↔ Stable |
| Dev freeze (days) | 170 | 177 | 184 | **212** | ↑ +28 days |
| API routes without Zod validation | 196 | 196 | 196 | **196** | ↔ Stable |
| Catch blocks (src/) | 1,166 | 1,166 | 1,220 | **1,347** | ↑ +127 (regression) |
| Files > 300 lines | — | — | 581 | **581** | ↔ Stable |
| Files > 1,000 lines (god files) | — | — | 31 | **31** | ↔ Stable |
| Supabase files (dual-auth complexity) | — | — | — | **283** | New measurement |
| Clerk files | — | — | — | **9** | New measurement |

---

## Critical Issues (Fix Now)

1. **Missing `@tanstack/react-query` dependency** — `package.json` (root) — 52 files import `@tanstack/react-query` but it is absent from `dependencies`; only `@tanstack/react-query-devtools` in `devDependencies`; every server render relies on transitive resolution which will break on clean installs — **Fix**: `npm install @tanstack/react-query@^5` — **31+ weeks unpatched**

2. **XSS vulnerability in content preview** — `src/components/create/content-preview-modal.tsx:83` — `dangerouslySetInnerHTML={{ __html: content || "..." }}` with unsanitized user content; also present in `src/components/landing/faq-section.tsx:109` — **Fix**: wrap with DOMPurify before rendering — **28 weeks unpatched**

3. **43,622 TypeScript compilation errors** — `npx tsc --noEmit` — the entire type system is broken; production builds may pass via loose tsconfig but type safety is illusory at this error volume — **Fix**: begin systematic error reduction by fixing god files first (`graphql/schema.ts`, `brands/page.tsx`)

4. **196/305 API routes lack Zod input validation** — `src/app/api/` — 64% of API routes do not validate request bodies; arbitrary input accepted — **Fix**: add `z.object({...}).parse(await req.json())` guards to all POST/PUT/PATCH handlers

5. **Supabase + Clerk dual-auth complexity** — 283 files reference Supabase, 9 reference Clerk — authentication is split across two identity systems; this is a maintenance liability and potential security boundary confusion — **Fix**: consolidate to one auth provider

6. **`:any` type annotations at 209 occurrences** — spread across 73 files in `src/` — strict TypeScript is configured but `any` violations undermine it; count rose +31 this period — **Fix**: ban new `: any` with ESLint `@typescript-eslint/no-explicit-any: error` rule

7. **`next@16.1.1` above stable 15.x line** — `package.json` — running Next.js 16 (a major version above the stable 15.x series); verify compatibility and stability with the React 19 / RSC ecosystem — **Fix**: pin to a stable long-term version or confirm 16.x is the intended version

---

## Warnings (Fix Soon)

1. **`as any` casts: 134 occurrences** — `src/` — runtime type safety bypassed in 134 locations — `src/lib/graphql/schema.ts`, `src/lib/billing/local-payments.ts` are top sources

2. **0 React.memo usage** — `src/components/` — zero memoization of any component; dashboard pages with many child renders will re-render on every parent state change — add memo to pure display components

3. **`graphql/schema.ts` god file at 2,284 lines** — `src/lib/graphql/schema.ts` — largest non-test file; coupled to entire data model; hard to test or modify safely

4. **`brands/page.tsx` at 1,506 lines** — `src/app/dashboard/brands/page.tsx` — the brands dashboard page is a monolith; extract sub-components

5. **1,347 catch blocks** — `src/` — up 127 from last period; risk of silent error swallowing increasing; audit new catch blocks added this period for empty bodies

6. **Empty CRON_SECRET pattern** — `src/app/api/cron/*/route.ts` — CRON_SECRET is validated (11 usages ✅) but rely on `|| ""` fallback which allows unauthenticated calls when env var is unset in development

7. **Raw `<img>` tags: 4** — `src/` — not using `next/image`; missing automatic optimisation, lazy loading and WebP conversion

8. **281 files with Supabase direct client usage** — authentication and data access mixed; some API routes may bypass RLS if using `serviceRole` without intent

9. **3 `console.log` statements in production src** — find with: `grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx"` — replace with structured logger

10. **332 off-palette color classes** — `bg-gray/bg-zinc/bg-neutral` used 332 times; design system calls for `#141930` card backgrounds — systematic replacement needed

11. **37 backdrop-blur outside modals/overlays** — `src/` — glassmorphism should be modal-only per design system; 37 violations remain

12. **196/305 API routes lack input validation** — high surface area for injection attacks and unhandled runtime errors (see Critical #4)

13. **`competitor-queries.ts` at 1,370 lines** — `src/lib/db/queries/competitor-queries.ts` — query layer god file; should be split by domain

---

## Suggestions

1. **Add ESLint rule `no-explicit-any`** — `.eslintrc.*` — enforce zero-new-any policy to stop score regression

2. **Add `React.memo` to pure display components** — `src/components/dashboard/` — prioritise stat-tile and chart wrapper components

3. **Split `graphql/schema.ts`** — `src/lib/graphql/schema.ts` — decompose into domain-specific schema modules (monitor, create, audit, billing, admin)

4. **Add Zod validation to top-50 high-traffic API routes** — start with `/api/monitor/`, `/api/create/`, `/api/audit/`

5. **Sanitize HTML in content-preview-modal with DOMPurify** — `src/components/create/content-preview-modal.tsx:83` — one-line fix with npm install dompurify

6. **Replace raw `<img>` with `next/image`** — 4 files; immediate performance win with no effort

7. **Pin npm to 10.x in engines** — `package.json` — remove drift risk from npm 12.x major version warning

8. **Run Playwright e2e against current build** — `e2e/` — 24 specs untouched since April; likely multiple silent regressions waiting to surface

9. **Consolidate dual auth to single provider** — Supabase or Clerk, not both; reduces bundle size, simplifies RLS reasoning

---

## Quick Wins (< 30 min each)

- [ ] `npm install @tanstack/react-query@^5` — fixes critical dependency gap instantly
- [ ] `npm install dompurify @types/dompurify` + 2-line fix in `content-preview-modal.tsx:83`
- [ ] Replace 4 raw `<img>` tags with `<Image>` from `next/image`
- [ ] Remove 3 `console.log` calls from `src/` (find with grep)
- [ ] Add `@typescript-eslint/no-explicit-any: "error"` to ESLint config to gate new violations

---

## Feature Progress

- **Total:** 205 | **Passing:** 205 (100%) | **Failing:** 0
- Note: All 205 features self-report `passes: true`; no Playwright e2e has run since April 2026 (212 days ago); ground truth is unknown
- **Next priority:** Run actual e2e verification; prioritise monitor, create, and audit flows

---

## Recommended Roadmap

1. **This week (critical unblocks):**
   - `npm install @tanstack/react-query@^5` (31-week blocker, 5-minute fix)
   - Sanitize `content-preview-modal.tsx` XSS (28-week blocker, 15-minute fix)
   - Remove 3 `console.log` leaks

2. **Next 2 weeks (security hardening):**
   - Add Zod validation to top-50 API routes
   - Add ESLint `no-explicit-any` to freeze the `: any` count
   - Replace 4 `<img>` with `next/image`

3. **Ongoing (quality improvement):**
   - Reduce TypeScript errors (target: < 10,000 errors within 60 days)
   - Add `React.memo` to pure display components
   - Split god files: `graphql/schema.ts`, `brands/page.tsx`, `competitor-queries.ts`
   - Run Playwright e2e against current state to establish true feature coverage baseline

---

*Report generated: 2026-11-22 | Session: automated autoresearch routine*
