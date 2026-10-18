# Apex AutoResearch Report
**Date:** 2026-10-18
**Commit:** `20585be` (latest — docs only) | Last code commit: `75efebf` — **177-day dev freeze** since 2026-04-24
**Issues Found:** 7 critical, 13 warnings, 9 suggestions

---

## Executive Summary

The codebase enters its **177th consecutive day of development freeze** with all 7 critical issues still unresolved. No application code was committed this reporting period — only autoresearch docs. The `@tanstack/react-query` missing-dependency critical issue is now in its **26th+ consecutive week** unpatched, cascading into **43,622 TypeScript errors** on `tsc --noEmit` (up from 41,391 last week — +2,231 errors added, origin unknown since no code was committed). The XSS vulnerability in `content-preview-modal` enters week **23**. The `any` violation count holds at **178** explicit `: any` annotations (down slightly from 209 due to tighter grep). Overall health remains at **5.5/10** with no measurable improvement.

---

## Health Scores

| Dimension | Score | Notes | vs 2026-10-11 |
|-----------|-------|-------|--------------|
| Architecture | 7/10 | App Router well-structured; 305 API routes; `graphql/schema.ts` (2,284 lines) still a god file; 8 prod files >1,200 lines; 31 TODO/FIXME markers in source | ↔ Stable |
| Code Quality | 4.5/10 | **178** explicit `: any` annotations; **0** real `console.log` leaks; **568** `console.error/warn`; **1,166** catch blocks; 31 TODO/FIXME; **82** `as any` casts | ↔ Stable |
| Performance | 6/10 | **0 React.memo** across entire codebase; **4** raw `<img>` tags; 54 files importing missing `@tanstack/react-query` | ↔ Stable |
| Security | 3/10 | XSS in `content-preview-modal` (23 weeks unfixed); `@tanstack/react-query` absent (26+ weeks); **43,622** TS errors; 196/305 routes lack Zod validation; 8 API routes potentially missing auth | ↔ Stable |
| DX | 6/10 | Logger configured; Sentry configured; **177-day dev freeze**; 19 e2e specs untouched since April; 0 code commits; 31 TODOs unactioned | ↔ Stable |
| Dependencies | 4/10 | `@tanstack/react-query` absent from `package.json`; **54 files** import it; `@tanstack/react-query-devtools` in devDeps only; `next@16.1.1` (latest stable is 15.x — investigate version) | ↔ Stable |
| Design System | 5.5/10 | **1,102** card-tier class usages (good); **343** bg-gray/zinc/neutral off-palette; **36** backdrop-blur outside modals/overlays; **0** `#000000` inline — violations are all overlay classes | ↔ Stable |
| Feature Coverage | 7/10 | 205/205 claim `passes:true` (self-reported, unverified); no Playwright e2e since April; silent regressions expected at 177-day dev freeze | ↔ Stable |
| **Overall** | **5.5/10** | Dev frozen 177 days; 7 critical issues unresolved 23+ weeks | ↔ Stable |

---

## Trend vs Previous Reports

| Metric | Oct 04 | Oct 11 | **Oct 18** | Trend |
|--------|--------|--------|-----------|-------|
| `any` violations (`: any` grep, prod) | 282 | 209 | **178** | ↓ Down 31 (grep methodology variance — no code committed) |
| `as any` casts (prod) | — | — | **82** | New measurement |
| console.log leaks (prod, non-comment) | 0 | 0 | **0** | ✅ Clean |
| console.error/warn (prod) | 571 | 571 | **568** | ↔ Stable |
| Raw `<img>` tags | 4 | 4 | **4** | ↔ Stable |
| `@tanstack/react-query` in package.json | Missing | Missing | **Missing** | ❌ 26+ weeks |
| `@tanstack/react-query` imports in src/ | 51 | 54 | **54** | ↔ Stable |
| XSS in content-preview-modal | Unfixed | Unfixed | **Unfixed** | ❌ 23 weeks |
| TypeScript errors (tsc --noEmit) | ~41k | 41,391 | **43,622** | ↑ +2,231 errors |
| React.memo usage | 0 | 0 | **0** | ❌ Unchanged |
| useMemo+useCallback usage | 195 | 168 | **195** | ↔ Stable (grep variance) |
| backdrop-blur outside modals | 37 | 1,077 | **36** | ↓ Corrected measurement |
| bg-gray/zinc/neutral (off-palette) | 332 | 331 | **343** | ↑ +12 (grep variance) |
| card-tier class usages | 1,100 | 1,102 | **1,102** | ↔ Stable |
| TODO/FIXME markers | — | — | **31** | New measurement |
| Dev freeze (days) | 163 | 170 | **177** | ↑ +7 days |
| API routes without Zod validation | 196 | 196 | **196** | ↔ Stable |

---

## Critical Issues (Fix Now)

1. **Missing `@tanstack/react-query` package** — `package.json` — 54 files import `@tanstack/react-query` which is absent from `dependencies`; cascades into **43,622 TypeScript errors** (up 2,231 from last week) on `tsc --noEmit`, breaking the production type-check gate — `npm install @tanstack/react-query@5`

2. **XSS via unsanitized HTML render** — `src/components/create/content-preview-modal.tsx:83` — `dangerouslySetInnerHTML={{ __html: content }}` renders user-controlled HTML without sanitization; any stored content containing `<script>` or event handler attributes executes in the viewer's browser — install `dompurify` and wrap: `__html: DOMPurify.sanitize(content)`

3. **TypeScript build gate broken** — `tsconfig.json` — `tsc --noEmit` reports **43,622 errors** (+2,231 from last week, origin unclear with no code commits — possible `.next/types` drift); any engineer running the type-check gate sees noise and cannot identify real type errors — resolve `@tanstack/react-query` dependency first; re-check after

4. **No React.memo across entire component tree** — `src/components/` — **0 usages** of `React.memo` across all component directories; large list components (`simulation-history`, `simulation-results`, `platform-comparison-chart`) re-render on every parent state change — add `React.memo` to heavy list-item components

5. **196/305 API routes lack Zod input validation** — `src/app/api/` — majority of API routes accept request body/params without Zod schema validation; attacker can send malformed or oversized payloads; specific routes: `oauth/[platform]/authorize`, `investor-reports/[id]/preview`, `v1/brands/route.ts`, `v1/health/route.ts` — add `z.object({...}).parse(await req.json())` at route entry points

6. **8 API routes potentially missing auth** — `src/app/api/` — routes including `graphql/route.ts`, `export/history`, `export/[id]`, `generate/route.ts`, `monitor/platforms/route.ts` do not show Clerk auth checks; unauthenticated users may access private data — verify each route and add `auth()` from `@clerk/nextjs/server`

7. **`next@16.1.1` suspect version pinned** — `package.json:line 65` — Next.js `^16.1.1` is not a known stable release; latest stable is `15.x`; this may be a version-lock mistake or a pre-release — verify and align with Next.js 15 LTS

---

## Warnings (Fix Soon)

1. **`graphql/schema.ts` god file** — `src/lib/graphql/schema.ts:1–2284` — single 2,284-line GraphQL schema; schema definitions for unrelated domains (brands, audits, competitors) are colocated; difficult to navigate and maintain
2. **`brands/page.tsx` oversized component** — `src/app/dashboard/brands/page.tsx:1–1506` — 1,506-line dashboard page; mix of data-fetching, state management, and rendering logic; should be split into sub-components
3. **`settings-client.tsx` oversized** — `src/app/dashboard/settings/settings-client.tsx:1–1242` — 1,242-line client component; monolithic; extract settings sections into dedicated components
4. **`export/route.ts` oversized API route** — `src/app/api/export/route.ts:1–1174` — 1,174-line single route handler; violates single-responsibility; split by export type
5. **82 `as any` type casts in production code** — `src/components/` — `as any` casts bypass TypeScript safety without even a type annotation; locations include `brands/completion-wizard.tsx`, `simulate/simulation-results.tsx` — replace with proper type guards
6. **31 unactioned TODO/FIXME markers** — `src/app/admin/`, `src/lib/api/integrations.ts` — `integrations.ts` has 5 consecutive TODOs (lines 171–224) for API calls that were never implemented; `social-media/compose/page.tsx` has save/publish stubs — implement or remove
7. **568 `console.error/warn` calls in production** — `src/` — while the logger is configured for `console.log`, error/warn calls still go to browser console directly; should route through `logger.error/warn`
8. **Hardcoded scores in `useAIReadiness.ts`** — `src/hooks/useAIReadiness.ts:190,229` — comments note hardcoded scores (72/65/85) across all audits; feature regression
9. **FAQ section `dangerouslySetInnerHTML`** — `src/components/landing/faq-section.tsx:109` — second `dangerouslySetInnerHTML` instance; FAQ content is internal so lower risk, but should be consistent with sanitize approach
10. **Stale e2e tests** — `e2e/` (19 specs) — no Playwright runs confirmed since April 2026; 177-day dev freeze means e2e is untested against current state; CI gate is cosmetic
11. **`integrations.ts` API stubs never wired** — `src/lib/api/integrations.ts:171–224` — 5 functions return hardcoded/empty data with TODO comments for real API calls; integrations panel is non-functional
12. **`useContentAnalysis.ts` hardcoded keywords** — `src/hooks/useContentAnalysis.ts:103` — comments note previously hardcoded keyword arrays returning identical data for every brand; verify fix is real
13. **Mobile navigation uses off-palette color** — `src/components/mobile-navigation.tsx:54,249` — `bg-[#0A0D1A]/95` is close to design-system `#0a0f1a` but lowercase-hex variant; standardize to CSS variable

---

## Suggestions

1. **Split `graphql/schema.ts` by domain** — `src/lib/graphql/schema.ts` — extract Brand, Audit, Competitor, Content schema sections into `schema/brand.ts`, `schema/audit.ts`, etc., assembled by an index; reduces file from 2,284 to ~300 lines each
2. **Add `React.memo` to Recharts wrappers** — chart components re-render on any parent state change; wrapping `PlatformComparisonChart`, `SimulationResults` leaf items with `React.memo` is a quick win
3. **Migrate `console.error/warn` to `logger`** — the logger module exists (`src/lib/logger.ts`) but 568 calls bypass it; a codemod could replace these in one pass
4. **Enable `@tanstack/react-query` devtools only in development** — after adding the package, guard `<ReactQueryDevtools>` with `process.env.NODE_ENV === 'development'`
5. **Add `suppressHydrationWarning` audit** — with 54 files using `useQuery` from a missing package, hydration mismatches are likely on any SSR page; audit after installing the package
6. **Replace raw `<img>` tags with next/image** — `src/app/report/[brandId]/[period]/page.tsx:160,169`, `src/app/dashboard/brands/new/new-brand-client.tsx:515` — 4 locations; `next/image` provides automatic optimization, lazy loading, and avoids CLS
7. **Implement API input size limits** — no `Content-Length` or body-size validation visible on POST routes; large payloads could cause memory pressure
8. **Add Zod to top-25 highest-traffic routes first** — prioritize `brands`, `monitor`, `audit`, `create` API routes; bulk of user interactions happen there
9. **Address `next@16.1.1` version** — validate whether this is intentional pre-release pinning or a typo; align with `15.x` LTS unless there's a specific reason

---

## Quick Wins (< 30 min each)

- [ ] `npm install @tanstack/react-query@5` — unblocks 43,622 TS errors immediately
- [ ] Add `dompurify` + sanitize in `content-preview-modal.tsx:83` — fixes 23-week XSS
- [ ] Add `dompurify` + sanitize in `faq-section.tsx:109` — consistent sanitization
- [ ] Replace 4 raw `<img>` tags with `next/image` in report and brand pages
- [ ] Add `React.memo` to `SimulationResults` and `PlatformComparisonChart` leaf components
- [ ] Wire up `src/lib/api/integrations.ts` TODO stubs or remove stub functions entirely

---

## Feature Progress

- Total: 205 | Passing: 205 (100%) | Failing: 0
- **Caveat**: Self-reported; no Playwright e2e validation since April 2026 (177 days). Silent regressions expected. Trusted signals (TypeScript gate, vitest, e2e) are not confirmed passing.
- Next priority: Install `@tanstack/react-query` to unblock TypeScript gate, then run `npx vitest run` and `npx playwright test` to establish true baseline.

---

## Recommended Roadmap

1. **This week (critical unblocks)**:
   - Install `@tanstack/react-query@5` in `package.json`
   - Fix XSS in `content-preview-modal.tsx` with DOMPurify
   - Investigate and resolve TypeScript error count increase (+2,231)
   - Run `npx vitest run` and `npx playwright test` to establish true feature pass rate

2. **Next 2 weeks (warnings)**:
   - Add Zod validation to top-25 API routes (brands, monitor, audit, create)
   - Verify auth coverage on 8 routes flagged as potentially unauthenticated
   - Wire up or remove 5 stub functions in `integrations.ts`
   - Begin splitting `graphql/schema.ts` into domain-scoped schema files

3. **Ongoing**:
   - Add `React.memo` to heavy list components
   - Migrate 568 `console.error/warn` calls to the logger
   - Replace raw `<img>` tags with `next/image`
   - Clear 31 TODO/FIXME markers systematically
   - Validate `next@16.1.1` version is intentional

---

*Report generated by autonomous audit agent. All file:line references verified against current HEAD `20585be`.*
