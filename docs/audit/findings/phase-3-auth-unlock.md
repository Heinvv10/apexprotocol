# Phase 3 auth unlock — Clerk sign_in_token replay (2026-04-17)

## Problem

Phase 3 needed an authenticated session for dashboard screenshots. Clerk Dev was blocking two ways:

1. Sign-up required email verification via a link Clerk's test SMTP wasn't delivering.
2. Password sign-in triggered "new device verification" → another email code that also wasn't arriving.

## Unlock pattern (reusable for E2E tests)

Create the user pre-verified via the Clerk Backend API, then mint a **sign-in token** (one-time ticket) and pass it to our sign-in page. ClerkJS picks up `__clerk_ticket` and creates a session without any email round-trip.

### 1 — Create a pre-verified user

```bash
curl -s -X POST "https://api.clerk.com/v1/users" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email_address":["hein@h10.co.za"],
    "password":"ApexGeo2026",
    "first_name":"Hein",
    "last_name":"van Vuuren"
  }'
```

Response includes `id: user_...` and `email_addresses[0].verification.status = "verified"` (strategy `admin`). No email round-trip needed — Backend API marks admin-created emails as verified automatically.

### 2 — Mint a sign-in token

```bash
curl -s -X POST "https://api.clerk.com/v1/sign_in_tokens" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_...","expires_in_seconds":600}'
```

Response contains `token: eyJ...` — a JWT usable exactly once within 10 minutes.

### 3 — Pass ticket to our sign-in page

```
http://localhost:3011/sign-in?__clerk_ticket=<TOKEN>
```

Clerk's `<SignIn>` component reads `__clerk_ticket` from the URL, calls `/v1/client/sign_ins` internally, gets a session. No password entry, no device verification, no MFA.

### 4 — Complete session tasks

After ticket redemption, session has `status: "pending"` with `tasks: [{key: "choose-organization"}]` because this app requires an org. The UI routes to `/sign-in/tasks/choose-organization` — fill in org name, submit, session becomes `active`, lands on `/dashboard`.

For E2E, you can pre-create the org via Backend API (`POST /v1/organizations` + `POST /v1/organizations/{id}/memberships`) so the user skips this step entirely.

## Replay script (pseudocode for e2e/auth-setup.ts)

```ts
import { clerkClient } from "@clerk/backend";

export async function buildAuthenticatedSession(email: string) {
  const client = clerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  // Create or find user
  let user = (await client.users.getUserList({ emailAddress: [email] })).data[0];
  user ??= await client.users.createUser({
    emailAddress: [email],
    password: process.env.E2E_TEST_PASSWORD!,
  });

  // Ensure user has an organization (skip if already set)
  const orgs = await client.users.getOrganizationMembershipList({ userId: user.id });
  if (orgs.data.length === 0) {
    const org = await client.organizations.createOrganization({
      name: "E2E Test Org",
      createdBy: user.id,
    });
  }

  // Mint a single-use ticket
  const { token } = await client.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 600,
  });

  return `http://localhost:3011/sign-in?__clerk_ticket=${token}`;
}
```

Playwright `globalSetup` calls this once, navigates to the URL, waits for `/dashboard`, then dumps `storageState`. Subsequent tests load that state and start authenticated.

## Current session

- User created: `user_3CUubGP5Vm9aH8Fq2SWa0k55CEo` — `hein@h10.co.za` / `ApexGeo2026`
- Org created: "Apex Audit"
- Session via Playwriter Chrome extension — live cookies, no `storageState.json` (extension API doesn't expose it).

## Risks / caveats

- `sign_in_tokens` is a single-use ticket. If the browser refuses the redirect (e.g. ad-blocker strips query params), mint a fresh one and retry.
- The `choose-organization` session task is app-specific (we require orgs). If we relax that constraint later, the flow becomes a one-step redirect.
- Clerk rate-limits both `users` and `sign_in_tokens` at ~10/min per instance — fine for CI, not for load testing.
- The Backend API key (`CLERK_SECRET_KEY`) must never leak to a client bundle. This flow belongs in `globalSetup` / server-only test fixtures.
