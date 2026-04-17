# Phase 2 C2 follow-up — Clerk dev keys resolved (2026-04-17)

## What happened

Phase 2 finding **C2**: `/sign-in` and `/sign-up` crashed on localhost with `useSession can only be used within <ClerkProvider />`.

## Root cause

`src/components/providers/clerk-provider.tsx` at line 14 reads `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and sets `IS_CLERK_CONFIGURED = false` when it's missing or placeholder. When false, the provider falls back to a `ClerkAvailabilityContext` stub but does NOT wrap children with `<BaseClerkProvider>`. Clerk's own `<SignIn>` component (used in `src/app/sign-in/[[...sign-in]]/page.tsx`) internally calls `useSession()`, which fails with no provider in the tree.

`.env.local` only had `ENCRYPTION_KEY` and `DATABASE_URL`. No Clerk keys. So sign-in broke on every local dev run.

## Why Option A (copy prod keys) failed

Production Clerk keys are domain-locked to `apexgeo.app`. Clerk's server rejects calls from `localhost` with:

> `Clerk: Production Keys are only allowed for domain "apexgeo.app". API Error: The Request HTTP Origin header must be equal to or a subdomain of the requesting URL.`

## Resolution (Option B — dev instance keys)

Apex already has both **Production** and **Development** instances in the Clerk dashboard under `Personal workspace / Apex`. We switched to the Development instance, grabbed its `pk_test_...` and `sk_test_...`, and wrote them to `.env.local` (gitignored). Dev keys have no domain restriction.

## How to reproduce this setup (for future devs / new machine)

1. Open <https://dashboard.clerk.com/apps/app_36mPFR0EGjBFo6aBsdkLJ8EHXCR> — requires dashboard login.
2. Click the "Production" / "Development" instance switcher (top bar, dropdown next to the colored pill) and select **Development**.
3. Navigate to **Configure → API keys**.
4. Copy the `.env.local` snippet from "Quick copy" with Framework = Next.js.
5. Paste into `.env.local` at the project root. Required keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   ```
6. Restart the dev server: `bun run dev -- --port 3011`.
7. `/sign-in` should render the real Clerk form (with "Development mode" badge at the bottom).

**Never commit `.env.local`** — it's in `.gitignore`. Confirmed via `git check-ignore -v .env.local`.

## Verification

Post-fix screenshot: `docs/audit/screenshots/phase-2/sign-in-with-dev-clerk.png` — shows working Clerk sign-in form with:

- "Sign in to Apex" heading
- Email input
- Cyan "Continue" button (our Apex primary — Phase 2 follow-up palette fix working)
- "Secured by Clerk" + "Development mode" badge

## Impact

- **C2 resolved** — Phase 3 dashboard audit is now unblocked (we can actually sign in).
- Production sign-in is NOT fixed by this change — this is a local-dev-only issue. The production build at `apexgeo.app` always had working Clerk (the production keys match the domain). The Phase 2 finding about the :4200 sign-in showing an empty form was probably caused by a different issue (the :4200 build predates Phase 1 and uses the pre-refactor `clerk-provider.tsx` which had its own hardcoded `#4926FA` palette). Once we merge Phase 1 + deploy, production sign-in should show the correct Apex-palette Clerk UI.

## Related Phase 3 prep needed

To audit authenticated dashboard routes in Phase 3, we still need either:
1. A Playwright `storageState.json` captured from a signed-in session, OR
2. A middleware bypass for `NODE_ENV=development`.

Option 1 is lower-risk (no code change). Plan: sign in once in Playwright, save `storageState`, reuse for Phase 3 screenshots.
