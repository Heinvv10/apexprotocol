# Apex AutoResearch Report
**Date:** 2026-04-26
**Commit:** `75efebf61d17b22eb6363bfa7f1b144778e306e4`
**Issues Found:** 3 critical, 7 warnings, 6 suggestions

---

## Executive Summary

The Apex GEO/AEO platform is architecturally solid with good middleware-level auth, a proper structured logger, Zod validation on most routes, and a thorough DB schema. The primary risks are a missing production dependency (`@tanstack/react-query`), an unsanitized `dangerouslySetInnerHTML` for AI-generated content (XSS vector), and 268 `any`-type violations that erode TypeScript's safety guarantees. Design system compliance is mixed — the card hierarchy CSS classes are used extensively (1,100+ usages) but 228 raw `<Card>` components bypass the tier system.

---

## Health Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 7/10 | Well-structured App Router; 6 oversized files (>1000 lines) need splitting |
| Code Quality | 5/10 | 268 `any` violations, 5 `console.log` leaks, 1 `console.error` vs logger |
| Performance | 7/10 | Good memoization (168 usages); 4 raw `<img>` instead of `next/image` |
| Security | 6/10 | XSS vector in content preview; brands API in publicRoutes; rate limiter fails open |
| DX | 7/10 | Good logger, Prettier, ESLint; `@tanstack/react-query` missing from prod deps |
| Dependencies | 6/10 | `@tanstack/react-query` not in `dependencies`; SWR+RQ coexist; Next "^16.1.1" unusual |
| Design System | 7/10 | 1,100+ tier-class usages; 228 raw `<Card>`s bypass system; backdrop-blur in dashboard |
| Feature Coverage | 8/10 | All 205 features claim `passes: true` but CLAUDE.md warns checklist is aspirational |
| **Overall** | **6.6/10** | Functional and deployable; address the 3 criticals before next major release |

---

## Critical Issues (Fix Now)

### 1. XSS — Unsanitized AI HTML in Content Preview
**File:** `src/components/create/content-preview-modal.tsx:83`

AI-generated HTML is passed directly to `dangerouslySetInnerHTML` with no sanitization. A poisoned AI response containing `<script>` or `<img onerror=...>` tags would execute in the user's browser.

```tsx
// CURRENT — unsafe
dangerouslySetInnerHTML={{ __html: content || "<p class='…'>…</p>" }}

// FIX — add DOMPurify (already a common dep pattern in TipTap apps)
import DOMPurify from "dompurify";
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
```

Install: `npm install dompurify @types/dompurify`

---

### 2. Missing Production Dependency — `@tanstack/react-query`
**File:** `package.json`

`@tanstack/react-query` is imported in production components (`competitor-comparison.tsx:4`, `notifications-bell.tsx:22`, `query-provider.tsx:3`) but only `@tanstack/react-query-devtools` appears in `devDependencies`. The library is currently available as a transitive dep of devtools, but this is fragile — removing devtools or running `npm install --production` will silently break these components at runtime.

```bash
# Fix
npm install @tanstack/react-query
```

---

### 3. 268 `any`-Type Violations in Production Code
**Locations:** 84 `as any`, 184 `: any` casts across `src/` (excluding tests)

Examples:
- `src/components/simulate/simulation-history.tsx:48` — `.map((sim: any) => …)`
- `src/components/audit/performance/PerformanceWaterfall.tsx:38` — `(props: any)`
- `src/components/features/content/GenerateContentForm.tsx:14` — `data: any`
- `src/app/admin/crm/pipeline/page.tsx:137` — multiple `(deal: any)` casts

`tsconfig.json` has `"strict": true` and the project CLAUDE.md mandates zero `any`. ESLint currently downgrades this to a warning (see `eslint.config.mjs:28`). At minimum the ESLint rule should be an error on new code; ideally a dedicated cleanup sprint fixes existing debt.

---

## Warnings (Fix Soon)

### 4. `/api/brands` Listed in `publicRoutes` — Weakened Defense-in-Depth
**File:** `src/middleware.ts:39`

`/api/brands(.*)` appears in `publicRoutes`, meaning Supabase session middleware does not enforce auth at the edge for brand endpoints. The route handler (`src/app/api/brands/route.ts:104`) does check `getOrganizationId()` and returns 401, so requests are rejected — but if the route handler ever changes or a new handler is added under `/api/brands/`, the middleware won't catch unauthorized access.

**Fix:** Remove `/api/brands(.*)` from `publicRoutes` and rely solely on `apiKeyAuthRoutes` + Supabase session middleware for protection. Alternatively, document the intentional decision clearly.

---

### 5. Raw `<img>` Instead of `next/image`
**Files:**
- `src/app/report/[brandId]/[period]/page.tsx:160,169`
- `src/app/dashboard/brands/new/new-brand-client.tsx:515`
- `src/app/dashboard/brands/[id]/edit/page.tsx:494`

Raw `<img>` tags skip Next.js image optimization (WebP conversion, lazy loading, LCP hints). The report page is especially impactful as it may be used for client-facing PDF exports.

---

### 6. Rate Limiter Silently Fails Open
**Files:** `src/middleware.ts:122-131`, `src/middleware.ts:176-190`

When Redis/Upstash is unavailable, the `catch {}` blocks silently allow all requests through with no logging. This means a Redis outage disables rate limiting entirely with no alerting.

```ts
// CURRENT
} catch {
  // rate limiter unavailable — fail open
}

// BETTER — log the failure so the team knows
} catch (err) {
  logger.warn("rate-limiter unavailable, failing open", { err });
}
```

---

### 7. Oversized Files Violating Separation of Concerns
Files above 1,000 lines are harder to review, test, and refactor safely:

| File | Lines | Problem |
|------|-------|---------|
| `src/lib/graphql/schema.ts` | 2,284 | Schema + resolvers + types all in one file |
| `src/app/dashboard/brands/page.tsx` | 1,506 | Page, business logic, and 3+ sub-views mixed |
| `src/app/dashboard/settings/settings-client.tsx` | 1,242 | All settings tabs in a single client component |
| `src/lib/db/queries/competitor-queries.ts` | 1,370 | Monolithic query file |
| `src/app/api/export/route.ts` | 1,174 | Multiple export formats in single route |
| `src/lib/billing/local-payments.ts` | 1,255 | Full billing logic without service split |

---

### 8. SWR and TanStack Query Coexisting
**Files:** `src/hooks/usePlatformMonitoring.ts:7` (SWR), `src/components/competitors/competitor-comparison.tsx:4` (TanStack)

Two data-fetching libraries coexist, adding ~30KB to the bundle and creating inconsistent patterns. Consolidate on TanStack Query (already set up via `query-provider.tsx`) and remove SWR (`npm uninstall swr`).

---

### 9. 228 Raw `<Card>` Usages Bypass Design System Tier Hierarchy
The design system mandates `.card-primary`, `.card-secondary`, `.card-tertiary` class variants. 228 raw Shadcn `<Card>` usages exist without tier qualification, making the UI visually inconsistent (all same elevation/border).

---

### 10. `console.error` in Production Route
**File:** `src/app/api/brands/route.ts:350`

```ts
console.error("[BrandCreate] Validation error:", JSON.stringify(error.issues, null, 2));
```

Should use `logger.error(...)` to maintain structured JSON logging in production.

---

## Suggestions

### 11. Feature List May Be Stale — All 205 Features Claim `passes: true`
`feature_list.json` shows 100% pass rate (205/205). CLAUDE.md itself warns: *"every entry currently claims `passes: true` but many features have silently regressed."* The autonomous workflow should run `npx tsc --noEmit` and `npx vitest run` before trusting this checklist.

### 12. `next: "^16.1.1"` Is an Unusual Version
**File:** `package.json:118`

Next.js stable releases as of early 2026 are in the 15.x range. Version `^16.1.1` may be a custom fork, a pre-release, or a mistake. Verify the installed version matches the team's intent and that it receives security patches.

### 13. No HTML Sanitization Audit for TipTap Editor Output
The TipTap rich-text editor (`@tiptap/react`) outputs HTML. If that content is stored and later rendered with `dangerouslySetInnerHTML` anywhere, it's a stored XSS vector. Audit all TipTap output rendering paths.

### 14. `@google/generative-ai` and `@google/genai` Both in Dependencies
**File:** `package.json`

Both `@google/generative-ai` (^0.21.0) and `@google/genai` (^1.34.0) are listed. These appear to be the old and new Google Gemini SDKs. Consolidate on `@google/genai` and remove the legacy package.

### 15. Test Coverage Mostly Concentrated in Test-Only Files
88 test files found across `src/`, but most large test suites are integration/mock tests (e.g., `src/lib/sub-agents/social-media-correlation/tests/` alone has 4 files × ~1,300 lines). Unit test coverage for individual utility functions and components appears sparse. Consider adding `vitest run --coverage` to CI with a coverage gate.

### 16. `docs/` Directory Contains 80+ Documentation Files
The `docs/` root has grown to 80+ markdown files without subdirectory organization. Many appear to be session artifacts (e.g., `BROWSER-TEST-NOTES.md`, `BRAND_ENRICHMENT_INVESTIGATION_COMPLETE.md`). Archive completed investigation docs to `docs/archive/` to reduce cognitive overhead.

---

## Quick Wins (< 30 min each)

- [ ] Install `dompurify` and sanitize `content-preview-modal.tsx:83` — **fixes Critical #1**
- [ ] Run `npm install @tanstack/react-query` — **fixes Critical #2**
- [ ] Run `npm uninstall swr` and migrate `usePlatformMonitoring.ts` to TanStack Query — **fixes Warning #8**
- [ ] Replace `console.error` at `brands/route.ts:350` with `logger.error` — **fixes Warning #10**
- [ ] Replace `<img>` with `<Image>` from `next/image` in 4 files — **fixes Warning #5**
- [ ] Add `logger.warn("rate-limiter unavailable")` to both catch blocks in `middleware.ts` — **fixes Warning #6**
- [ ] Remove `@google/generative-ai` from deps — **fixes Suggestion #14**

---

## Feature Progress

- **Total:** 205 | **Passing:** 205 (100%) | **Failing:** 0
- **Note:** CLAUDE.md warns this list is aspirational/stale. Trusted signals are: `npx tsc --noEmit`, `npx vitest run`, Playwright e2e tests — run these before updating the checklist.
- **Next priority:** Run TypeScript check (`npx tsc --noEmit`) and fix any real failures before new feature development.

---

## Recommended Roadmap

### This Week (Critical Fixes)
1. Add DOMPurify to `content-preview-modal.tsx` — eliminates XSS vector
2. Add `@tanstack/react-query` to production deps — prevents silent prod breakage
3. Raise `@typescript-eslint/no-explicit-any` to `"error"` in ESLint for new code

### Next 2 Weeks (Warnings)
4. Consolidate SWR → TanStack Query; remove SWR
5. Replace 4 raw `<img>` with `next/image`
6. Split top 3 oversized files (graphql schema, brands page, settings client)
7. Add `logger.warn` to rate-limiter catch blocks
8. Remove `/api/brands` from `publicRoutes` or document decision

### Ongoing (Technical Debt)
9. Audit and fix `any` types — target zero in new code, reduce existing count sprint by sprint
10. Consolidate dual Google Gemini SDKs
11. Organize `docs/` — archive session artifacts
12. Increase unit test coverage with vitest coverage gate in CI
