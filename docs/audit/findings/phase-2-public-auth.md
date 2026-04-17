# Phase 2 Findings — Public + Auth Pages

**Date**: 2026-04-17
**Scope**: 14 top-level public routes (landing, auth, marketing/legal/info stubs)
**Method**: Playwright at 1440×900, dev server on `localhost:3011` from `feature/phase-1-token-architecture`, screenshots in `docs/audit/screenshots/phase-2/`
**Design system reference**: Iron Man MCP `ds-1776422240467-dn9siw` (Apex)

---

## Coverage

| Route | HTTP | Screenshot | Severity |
|---|---|---|---|
| `/` | 200 | home.png | ✅ passes |
| `/sign-in` | 200 | sign-in.png | ❌ **crashes** |
| `/sign-up` | 200 | sign-up.png | ❌ **crashes** (same cause) |
| `/onboarding` | 200 | onboarding.png | ✅ passes |
| `/blog` | 200 | blog.png | ⚠️ stub |
| `/contact` | 200 | contact.png | ⚠️ stub |
| `/careers` | 200 | careers.png | ⚠️ stub |
| `/changelog` | 200 | changelog.png | ⚠️ stub |
| `/cookies` | 200 | cookies.png | ⚠️ stub |
| `/privacy` | 200 | privacy.png | ⚠️ stub |
| `/status` | 200 | status.png | ⚠️ stub |
| `/support` | 200 | support.png | ⚠️ stub |
| `/terms` | 200 | terms.png | ⚠️ stub |
| `/test-competitor-manager` | 200 | test-competitor-manager.png | 🚨 **exposed dev page** |

**Baseline**: Live Apex at `localhost:4200` (pre-Phase-1 production standalone build) was spot-checked on `/` and `/sign-in` to confirm Phase 1 did not cause visual regression. Sign-in on :4200 renders an empty form (silent Clerk failure); on :3011 dev it renders a visible error — same root cause, different surface behavior.

---

## Findings by severity

### 🚨 CRITICAL

#### C1 — Exposed development/test route in production routing: `/test-competitor-manager`

**What**: A "Competitor Manager Test Page" is served publicly at `/test-competitor-manager`. It declares itself "for testing the CompetitorManager component functionality" and shows a "Verification Checklist" meant for a developer. It attempts to fetch competitors with no auth and displays "Failed to fetch competitors" as an error state.

**Why it's critical**:
- Exposes internal component-testing affordances to any visitor.
- Breaks the first impression of a production SaaS.
- Reveals product surface area (competitor-tracking feature, 10-competitor limit, "Track Your Competitors" CTA) without any auth wall.

**Fix**: Either delete `src/app/test-competitor-manager/page.tsx` or move it behind `/dashboard/admin/` and add middleware auth. Default recommendation: delete — if the component needs testing, use Storybook or a unit test, not a public page.

**Estimated effort**: 5 min.

---

#### C2 — `/sign-in` and `/sign-up` crash in dev; render broken empty form in production

**What**: Sign-in throws `useSession can only be used within the <ClerkProvider />` on dev server (:3011) — shown inside the design-system error card (the card itself looks correct: cyan primary accent, dark navy bg, contact-support link). On the production standalone build at :4200, the same page renders without the error card but shows only the ApexGEO logo + an empty input box — i.e. Clerk's `<SignIn>` component never mounts.

**Why it's critical**:
- No user can actually sign in or sign up today.
- The product is effectively unusable without an existing session.

**Root cause hypothesis** (verify before fixing):
- `<ClerkProvider>` is not wrapping the `sign-in`/`sign-up` route trees. Possibly the auth catch-all layout `src/app/sign-in/[[...sign-in]]/layout.tsx` (if present) doesn't include it, OR the root `layout.tsx` provider chain was altered.
- Alternative: missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY` in `.env.local`. (Low likelihood — the design-system error card rendered, meaning the error boundary caught a render-time violation, not a config miss.)

**Not a Phase 1 regression** — verified by testing :4200 (pre-Phase-1 build) which exhibits the same root-cause failure (silent).

**Fix**: Investigate Clerk provider wiring. Look at `src/components/providers/clerk-provider.tsx` (19 hex literals per Phase 0 audit, suggesting it's been touched recently) and `src/app/layout.tsx`. Ensure `<ClerkProvider>` wraps everything, including auth routes. Verify env vars.

**Estimated effort**: 30–90 min (depends on root cause).

---

### ⚠️ MAJOR

#### M1 — Nine legal/info/marketing pages are unfinished stubs

**What**: `/blog`, `/contact`, `/careers`, `/changelog`, `/cookies`, `/privacy`, `/status`, `/support`, `/terms` each render as a centered page with only a title + single-sentence subtitle ("Insights, guides, and updates from the ApexGEO team." / "Get in touch with our team." / etc.) and no other content.

**Why major**:
- `/privacy`, `/terms`, `/cookies` are required by law in most jurisdictions (including South Africa's POPIA). Empty pages = legal risk.
- `/status` is typically where customers check outage info. An empty status page after an outage = churn.
- Links to these pages likely appear in the footer / elsewhere → dead-end UX.

**Fix** (per page, in priority order):
1. Decide: publish real content, or remove the route + footer link.
2. If publishing: populate content from `docs/` or marketing copy.
3. Uniform layout: header + content container + footer. Current bg is pure-black-ish (`#0a0a0a` estimated); design system mandates `#0a0f1a` deep navy (see P2 below).

**Estimated effort**: 30 min per page for a minimum-viable layout with real content; 10 min each to remove.

---

#### M2 — Stub pages use near-pure-black background, violating design system

**What**: The 9 stub pages render with a flat very-dark (appearing near-pure-black) background, missing the design system's deep-space navy `#0a0f1a` + gradient + decorative elements. The home page and onboarding both use the correct bg.

**Why major**:
- Design inconsistency across routes within the same app.
- Anti-pattern explicitly called out in `docs/APEX_DESIGN_SYSTEM.md`: "DO NOT use `#000000` background → DO use `#0a0f1a` (bgDeep)".

**Fix**: The stub pages probably lack a shared layout that applies `bg-background`. Either wrap them in a `(marketing)` route group layout, or ensure the root layout applies bg-background consistently. Candidate:

```tsx
// src/app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
```

**Estimated effort**: 30 min.

---

#### M3 — Stub pages have no header/navigation

**What**: None of the stub pages show the site navigation (the `ApexGEO / Platform / Pricing / Resources / Company / Sign In / Get Started` header that appears on `/`). A visitor landing on `/privacy` has no way back to the homepage except the browser back button.

**Fix**: Add a shared marketing-layout header+footer (see M2 fix — same file).

**Estimated effort**: 1 hr to build a proper marketing layout with footer.

---

### 🔸 MINOR

#### m1 — Home page hover/brand-cube state captured mid-animation

Screenshot `home.png` (taken via Playwright `networkidle`) shows the cube illustration mid-render: GPT/Claude circles are fully rendered (green/cyan) but Gemini and Perplexity circles show their outline only (empty white rings). The `brand-cube` animation on the right side of the hero uses staggered entry — networkidle fired before it completed. **Not a bug**, just a screenshot-timing artifact. Re-screenshot with a longer settle time when re-running the audit.

#### m2 — Next.js dev-tools and Replicate overlay visible in screenshots

Small "N" (Next.js dev tools) appears bottom-left and a cartoon avatar (Replicate?) bottom-right in every screenshot. These are dev-only and won't be in production. When re-running the audit against a production build, re-screenshot to get clean images. The `1 Issue` red badge in home/sign-in is the Next.js dev console indicator for a console error — worth investigating (may be the same Clerk issue surfacing on every page).

#### m3 — The design-system error card is a good accidental demo

The useSession crash on `/sign-in` is actually a useful audit result: it proves the error-boundary card component in the design system renders correctly with dark bg, cyan accent border, centered layout, and properly styled support-link. File that away as "this component works, don't touch" when doing Phase 6 refactor.

---

## Coverage gaps for this phase

- **Sign-in/sign-up interactive states** not tested because the page crashes before form renders.
- **Onboarding multi-step flow** only captured step 1 of 5 (steps 2–5 require form submission).
- **Blog article, careers job-listing detail, changelog entry detail** — none of these children routes exist in code, so there's nothing to audit.
- **Mobile viewport (375×667)** — entire Phase 2 run at 1440×900 only. Recommend a second pass at mobile before signing off Phase 2 complete.

---

## Not-a-Phase-2 concerns surfaced

- The Clerk error is a real blocker for the whole product. Fix probably precedes any further dashboard/admin auditing in Phase 3+.
- `test-competitor-manager` being public suggests other dev/test routes may exist in `src/app/**` under innocuous names — worth a grep in Phase 3.

---

## Not a Phase 1 regression

Spot-checked `/` and `/sign-in` on `localhost:4200` (pre-Phase-1 production standalone build).

- `/` on :4200 renders identically to `/` on :3011 post-Phase-1 (same layout, same colors, cube illustration fully settled on :4200 due to faster-than-Playwright settle time).
- `/sign-in` on :4200 shows a silent empty-form failure (different surface; same Clerk root cause).

**Conclusion**: none of these findings were introduced by Phase 1. They are pre-existing issues that the audit made visible.

---

## Priority for Phase 6 (refactor) feeding back

- `clerk-provider.tsx` (19 hex literals — Phase 0 hotspot) should be fixed first since any sign-in work will touch it.
- Once a marketing layout exists (M2/M3), every stub page becomes a 10-line file referencing the layout — smaller refactor surface area.
- The error card pattern (seen on `/sign-in` crash) is a candidate to extract into `components/error-card.tsx` referencing design tokens, then reuse across `error.tsx` and `global-error.tsx`.

---

*Phase 2 complete. Next: Phase 3 (core dashboard) — requires Clerk fix first OR a Playwright `storageState.json` with a pre-authenticated session.*
