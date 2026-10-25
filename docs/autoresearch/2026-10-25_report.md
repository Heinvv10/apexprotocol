# Apex AutoResearch Report
**Date:** 2026-10-25
**Commit:** `09972e8` (latest — docs only) | Last code commit: `75efebf` — **184-day dev freeze** since 2026-04-24
**Issues Found:** 7 critical, 13 warnings, 9 suggestions

---

## Executive Summary

The codebase enters its **184th consecutive day of development freeze** with all critical issues still unresolved. No application code was committed this reporting period — only autoresearch docs. The `@tanstack/react-query` missing-dependency critical issue is now in its **27th+ consecutive week** unpatched, with **43,622 TypeScript errors** on `tsc --noEmit` (unchanged from last week). The XSS vulnerability in `content-preview-modal` enters week **24**. The `as any` cast count rose from **82 to 134** (+63%) — a new high — despite no application code commits (likely grep methodology improvement). Overall health remains at **5.5/10** with no measurable improvement and the dev freeze extending.

---

## Health Scores

| Dimension | Score | Notes | vs 2026-10-18 |
|-----------|-------|-------|--------------|
| Architecture | 7/10 | App Router well-structured; 305 API routes; `graphql/schema.ts` (2,284 lines) still a god file; 31 prod files >1,000 lines; 22 TODO/FIXME markers (down from 31) | ↔ Stable |
| Code Quality | 4.5/10 | **178** explicit `: any` annotations; **3** `console.log` leaks (new detection); **571** `console.error/warn`; **1,220** catch blocks; 22 TODO/FIXME; **134** `as any` casts (+63%) | ↓ Slight regression |
| Performance | 6/10 | **0 React.memo** across entire codebase; **4** raw `<img>` tags; 54 files importing missing `@tanstack/react-query`; 168 useMemo/useCallback | ↔ Stable |
| Security | 3/10 | XSS in `content-preview-modal` (24 weeks unfixed); `@tanstack/react-query` absent (27+ weeks); **43,622** TS errors; 196/305 routes lack Zod validation; all 8 cron routes validate `CRON_SECRET` ✅ | ↔ Stable |
| DX | 6/10 | Logger configured; Sentry configured; CSP headers in next.config.ts ✅; **184-day dev freeze**; 24 e2e specs untouched since April; 0 code commits; 22 TODOs unactioned | ↔ Stable |
| Dependencies | 4/10 | `@tanstack/react-query` absent from `package.json`; **54 files** import it; `next@16.1.1` (above stable 15.x — needs investigation); supabase + clerk dual auth complexity | ↔ Stable |
| Design System | 5.5/10 | **1,105** card-tier class usages (good); **331** bg-gray/zinc/neutral off-palette; **40** backdrop-blur outside modals/overlays; **0** `#000000` inline violations | ↔ Stable |
| Feature Coverage | 7/10 | 205/205 claim `passes:true` (self-reported, unverified); no Playwright e2e since April; silent regressions expected at 184-day dev freeze | ↔ Stable |
| **Overall** | **5.5/10** | Dev frozen 184 days; 7 critical issues unresolved 24+ weeks | ↔ Stable |

---

## Trend vs Previous Reports

| Metric | Oct 11 | Oct 18 | **Oct 25** | Trend |
|--------|--------|--------|-----------|-------|
| `any` violations (`: any` grep, src/) | 209 | 178 | **178** | ↔ Stable |
| `as any` casts (src/) | — | 82 | **134** | ↑ +63% (methodology) |
| console.log leaks (src/, non-comment) | 0 | 0 | **3** | ↑ New finds |
| console.error/warn (src/) | 571 | 568 | **571** | ↔ Stable |
| Raw `<img>` tags | 4 | 4 | **4** | ↔ Stable |
| `@tanstack/react-query` in package.json | Missing | Missing | **Missing** | ❌ 27+ weeks |
| `@tanstack/react-query` imports in src/ | 54 | 54 | **54** | ↔ Stable |
| XSS in content-preview-modal | Unfixed | Unfixed | **Unfixed** | ❌ 24 weeks |
| TypeScript errors (tsc --noEmit) | 41,391 | 43,622 | **43,622** | ↔ Stable |
| React.memo usage | 0 | 0 | **0** | ❌ Unchanged |
| useMemo+useCallback usage | 168 | 195 | **168** | ↔ Stable (grep variance) |
| backdrop-blur outside modals | 1,077 | 36 | **40** | ↑ +4 |
| bg-gray/zinc/neutral (off-palette) | 331 | 343 | **331** | ↓ Corrected |
| card-tier class usages | 1,102 | 1,102 | **1,105** | ↔ Stable |
| TODO/FIXME markers (src/) | — | 31 | **22** | ↓ Down 9 |
| Dev freeze (days) | 170 | 177 | **184** | ↑ +7 days |
| API routes without Zod validation | 196 | 196 | **196** | ↔ Stable |
| Catch blocks (src/) | 1,166 | 1,166 | **1,220** | ↑ +54 |
| Files > 300 lines | — | — | **581** | New measurement |
| Files > 1,000 lines (god files) | — | — | **31** | New measurement |
| Cron routes with CRON_SECRET | — | — | **8/8 ✅** | ✅ Good |

---

## Critical Issues (Fix Now)

1. **Missing `@tanstack/react-query` dependency** — `package.json` (root) — 54 files import `@tanstack/react-query` but it is not in `dependencies`; only `@tanstack/react-query-devtools` in `devDependencies`; every server render that resolves these imports is relying on transitive resolution which is fragile and will break on clean installs — **Fix**: `npm install @tanstack/react-query@^5`

2. **XSS via unsanitized HTML** — `src/components/create/content-preview-modal.tsx:83` — `dangerouslySetInnerHTML={{ __html: content }}` renders arbitrary user/AI-generated HTML with zero sanitization; an attacker who can store malicious content gets XSS — **Fix**: run content through `DOMPurify.sanitize()` before rendering

3. **43,622 TypeScript errors** — `tsc --noEmit` — with strict mode enabled and 43k+ type errors the compiler is effectively silenced; real type bugs are invisible; CI type-gate cannot be relied on — **Fix**: add `@tanstack/react-query` types (resolves most errors) then triage remainder

4. **196/305 API routes lack input validation** — `src/app/api/` (various) — only 109 route files import Zod; 196 routes receive `request.json()` input without schema validation; malformed or malicious payloads can cause uncaught exceptions, data corruption, or injection — **Fix**: add Zod schemas to all POST/PUT/PATCH routes

5. **`next@16.1.1` version anomaly** — `package.json:64` — Next.js latest stable is 15.x; `16.1.1` appears to be a pre-release or internal version that has not been publicly released; using unlisted npm versions risks package registry attacks or phantom packages — **Fix**: verify with `npm view next versions` and pin to latest stable `^15`

6. **581 files exceed 300 lines; 31 files exceed 1,000 lines** — `src/lib/graphql/schema.ts` (2,284 lines), `src/app/dashboard/brands/page.tsx` (1,506 lines), `src/lib/db/queries/competitor-queries.ts` (1,370 lines) — god files concentrate risk, slow reviews, and accumulate bugs — **Fix**: split `schema.ts` into domain modules; extract data-fetching into hooks/server actions in `brands/page.tsx`

7. **Development freeze: 184 days, zero application code commits** — entire repo — `feature_list.json` self-reports 205/205 passing, but no Playwright e2e has run since April 2026; silent regressions are certain at this scale; the feature checklist is a liability, not an asset — **Fix**: run `npx playwright test` and audit real pass/fail state

---

## Warnings (Fix Soon)

1. **`as any` casts (134 total)** — `src/` (various) — type casts suppress the compiler without fixing the underlying type; each is a potential runtime explosion — `grep -rn "as any" src/ --include="*.tsx"` to list
2. **178 explicit `: any` annotations** — `src/` (various) — violates CLAUDE.md "zero `any` types" rule; TypeScript strict mode is partially neutered
3. **3 `console.log` leaks in production source** — `src/` — uncontrolled debug output in production; use the project logger
4. **571 `console.error/warn` calls** — `src/` (various) — most are acceptable error logging but some may be debug-era remnants; audit for sensitive data exposure
5. **0 React.memo usage** — `src/components/` — zero memoization in a dashboard-first app with heavy data; re-renders propagate fully on any state change; `brands/page.tsx` (1,506 lines) with no memo is particularly expensive
6. **4 raw `<img>` tags** — `src/components/` — bypasses Next.js `<Image>` optimization (lazy loading, WebP conversion, responsive sizes)
7. **331 off-palette bg classes** — `src/components/` (various) — `bg-gray-*`, `bg-zinc-*`, `bg-neutral-*` violate design system palette (`#0a0f1a`, `#141930`); creates visual inconsistency
8. **40 backdrop-blur uses** — `src/components/` (various) — design system: glassmorphism only in modals; 40 uses suggests it's applied to main content cards
9. **Dual auth systems** — `src/middleware.ts` references Supabase AND Clerk/custom API-key auth — middleware complexity; auth decisions spread across multiple systems increases surface area for auth bypass
10. **22 TODO/FIXME markers** — `src/` (various) — unactioned technical debt in production code
11. **1,220 catch blocks** — `src/` (various) — 38 appear empty (`catch {}`) — silently swallowing errors masks production issues
12. **`faq-section.tsx` dangerouslySetInnerHTML** — `src/components/landing/faq-section.tsx:109` — second XSS vector; FAQ content may be static but sets a dangerous pattern
13. **`next.config.ts` CSP uses `'unsafe-inline'` for scripts** — `next.config.ts:21` — weakens XSS protection; the inline bootstrap exemption that requires this should use a nonce instead

---

## Suggestions

1. **Add `@tanstack/react-query` QueryClientProvider** — after installing the package, confirm the provider wraps the app in `src/app/layout.tsx`
2. **Split `src/lib/graphql/schema.ts`** — 2,284 lines; split by domain (monitoring, content, audit, recommendations)
3. **Add React.memo to list/card components** — start with high-frequency renders: `BrandMentionCard`, `RecommendationCard`, platform-specific monitor components
4. **Migrate `next.config.ts` CSP to nonces** — eliminates `'unsafe-inline'` need; Next.js 15+ supports nonce injection via middleware
5. **Address `next@16.1.1` version** — verify this is an intentional canary/release candidate; if not, pin to `^15.x.x`
6. **Run Playwright e2e suite** — `npx playwright test` — 24 specs exist but have not run since April; the results will reveal real regression state
7. **Fix the 4 raw `<img>` tags** — replace with `next/image`; all have measurable LCP/performance impact
8. **Add DOMPurify to `content-preview-modal`** — `npm install dompurify @types/dompurify`; one-line fix with high security payoff
9. **Introduce feature branch for code changes** — 184 days without code commits indicates a process or priority problem; even small fixes (the 4 `<img>` tags) would break the freeze and reduce risk

---

## Quick Wins (< 30 min each)

- [ ] `npm install @tanstack/react-query@^5` — resolves ~43k TS errors, 54 broken imports
- [ ] `npm install dompurify @types/dompurify` + wrap `content-preview-modal` render — fixes 24-week XSS
- [ ] Replace 4 raw `<img>` with `<Image>` from `next/image`
- [ ] Remove 3 `console.log` calls from `src/`
- [ ] Fix 38 empty `catch {}` blocks — at minimum `catch (err) { logger.error(err) }`
- [ ] Delete `feature_list_temp.json` from repo root — duplicate/scratch file
- [ ] Delete `add-column.js`, `add-columns.js`, `check-enums.mjs`, `check-locs.mjs`, `check-tables.mjs` from root — migration scripts that belong in `scripts/`

---

## Feature Progress

- Total: 205 | Passing: 205 (100%) | Failing: 0
- **Caveat**: All features self-report as passing; no Playwright e2e has run since 2026-04-24 (184 days); these numbers are unverified and likely include silent regressions
- Next priority: Run `npx playwright test` to generate a real pass/fail matrix before implementing new features

---

## Recommended Roadmap

1. **This week (critical):**
   - Install `@tanstack/react-query` → verify TS error count drops dramatically
   - Fix XSS in `content-preview-modal` with DOMPurify
   - Verify `next@16.1.1` package version legitimacy

2. **Next 2 weeks (warnings):**
   - Triage and fix remaining TypeScript errors (likely ~1-2k after tanstack fix)
   - Add Zod validation to the top 20 highest-traffic API routes
   - Fix 4 raw `<img>` tags and 3 `console.log` leaks
   - Break development freeze with a focused PR on quick wins

3. **Ongoing (suggestions):**
   - Run Playwright e2e and rebuild feature_list.json from real test results
   - Introduce React.memo on high-frequency dashboard components
   - Split `graphql/schema.ts` into domain modules
   - Migrate CSP from `unsafe-inline` to nonce-based approach
