---
name: apex-social-browser
description: |
  Shared browser-automation foundation for posting to social platforms (X, LinkedIn, Reddit,
  YouTube, etc.) without using paid platform APIs. Handles per-brand credential vaulting,
  TOTP-based 2FA, session persistence, stealth Playwright config, human-like interaction
  primitives, per-platform action quotas, and a full audit log.

  This skill is NOT directly user-invoked — it's a foundation library consumed by the
  platform-specific skills (apex-x-twitter, apex-linkedin, apex-reddit, apex-youtube,
  apex-quora). If a user asks to post to a social platform, the platform-specific skill
  activates and imports from here.

  Admin use only: invoke this skill when the user says 'add a social browser account',
  'rotate session for <brand>', 'test login for <brand> on <platform>', 'list social
  browser accounts', or wants to inspect the audit log for social automation.
---

# apex-social-browser — Shared Browser-Automation Foundation

## Purpose

Every platform skill (X, LinkedIn, Reddit, YouTube, Quora) needs the same plumbing:
encrypted credentials, session persistence, TOTP 2FA, stealth config, human-like
interaction, action quotas, audit logging. Building it once here means:

- Consistent guardrails across every platform
- One place to fix detection-avoidance bugs
- Platform skills stay focused on platform-specific selectors and flows
- Audit trail is uniform

**Related PRD**: `docs/PRD/skills/apex-social-browser.md`

## Public API

Platform skills import from `@/lib/social/browser`:

```typescript
import {
  // Credential vault
  createCredential,
  getCredential,
  findCredential,
  updateSessionState,
  markFlagged,
  getOneTimeCode, // TOTP code — never returns the secret itself

  // Human-like interaction (wraps puppeteer)
  humanType,
  humanClick,
  humanScroll,
  humanKey,
  dwell,

  // Quota enforcement
  assertWriteQuota,
  checkWriteQuota,
  QuotaExceededError,

  // Audit log
  logAction,
} from '@/lib/social/browser';
```

## Core Rules (hard-enforced)

1. **Always human-gated in v1** — no auto-post. Platform skills draft and preview; the user approves each submit.
2. **Kill switch** — global env flag `APEX_SOCIAL_BROWSER_DISABLED=1` halts all automation immediately.
3. **Credential isolation** — credentials scoped per `organizationId` + `brandId`. Cross-org reads are impossible by design.
4. **TOTP secrets never leave the vault** — consumers only ever receive a computed 6-digit code, scoped to one login attempt.
5. **Detection-signal abort** — on CAPTCHA, unusual-activity warnings, or rate-limit redirects, immediately call `markFlagged()` and stop. No retry loop, no workaround attempts.
6. **Quota caps are floors-of-safety, not ceilings-of-ambition** — defaults sit well under platform thresholds. Never increase these to push volume.

## Database Schema

Two tables own this foundation (see `src/lib/db/schema/social-browser-auth.ts`):

- `social_browser_credentials` — one row per (brand, platform, username). Holds encrypted password, encrypted TOTP secret, encrypted session state, user-agent + viewport for fingerprint stability, status enum (`active` / `flagged` / `disabled`).
- `social_browser_actions` — full audit log of every automation action. One row per login, post, reply, navigation. Includes screenshot reference and error message.

Encryption uses the existing `src/lib/encryption.ts` AES-256-GCM helpers (same pattern as OAuth tokens, API keys).

## Browser Stack

- **Puppeteer** (already in dependencies) — not Playwright
- **Stealth plugin** — `puppeteer-extra-plugin-stealth` to be added when first login flow lands
- **Per-credential browser context** — persistent viewport + user-agent to keep fingerprint stable across sessions
- **Headless by default** — headed mode via Xvfb available for debugging stubborn flows

## Admin Commands

When the user invokes this skill directly (rare):

| Request | Action |
|---|---|
| "add a social browser account for <brand> on <platform>" | Prompt for username, password, TOTP secret (base32), then `createCredential()` |
| "list social browser accounts for <brand>" | `listCredentialsForBrand()` and render as table |
| "rotate session for <credential-id>" | Trigger full re-login flow via the platform-specific skill |
| "test login for <credential-id>" | Run the platform's login flow in headed mode, report success/failure |
| "show audit log for <credential-id>" | Query `social_browser_actions` for that credential |
| "flag <credential-id>" | Manual `markFlagged()` call with provided reason |

## What NOT to Do

- **Do not bypass `assertWriteQuota()`** — caps are intentional
- **Do not fabricate action log entries** — silent automation actions violate the audit invariant
- **Do not store credentials outside the vault** — no `.env` stashing, no in-memory caches that outlive the request
- **Do not recommend this foundation for platforms with free posting APIs** (like Reddit's OAuth) — use the API. This foundation is for platforms where we have no free alternative.

## Integration with Platform Skills

Platform skills sit on top of this foundation and add:
- Platform-specific login-form selectors (`src/lib/social/<platform>/login-flow.ts`)
- Platform-specific post/reply selectors (`src/lib/social/<platform>/post-composer.ts`)
- Platform-specific draft optimization (voice, hook, citation patterns)
- Platform-specific trigger phrases for the skill

First consumer: `apex-x-twitter`.
