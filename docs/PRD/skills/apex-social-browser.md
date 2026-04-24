# PRD: apex-social-browser Skill (Shared Foundation)

**Status:** Draft
**Owner:** Apex GEO
**Created:** 2026-04-23
**Priority:** P0 — blocks apex-x-twitter, apex-linkedin, apex-reddit, apex-youtube
**Type:** Foundation skill (not user-facing — invoked by other social skills)

---

## 1. Purpose

Every social platform skill (X, LinkedIn, Reddit, YouTube, Quora) needs the same browser-automation plumbing:
- Multi-account session management with encrypted persistence
- Login flow including 2FA / TOTP
- Stealth configuration to reduce automation detection
- Realistic interaction patterns (typing cadence, mouse movement, dwell time)
- Screenshot evidence for every action
- Per-account browser contexts for fingerprint isolation

Building this once as a shared foundation saves ~4× implementation cost and guarantees consistent guardrails across platforms. Without it, every platform skill duplicates risky automation logic and divergent behaviour creates uneven detection risk.

This skill is **not invoked by users directly** — it's a library that other skills (`apex-x-twitter`, `apex-linkedin`, etc.) call into.

## 2. Target Consumers (Other Skills)

| Skill | Uses for |
|---|---|
| apex-linkedin | Login, post creation, comment, message sending |
| apex-x-twitter | Login, tweet/thread creation, reply, quote-tweet |
| apex-reddit | Login, post submission, comment reply |
| apex-youtube | Login, video metadata edit, comment posting (uploads still via API where free tier exists) |
| apex-quora | Login, answer drafting, answer submission |
| wikidata-item (existing) | Could migrate to use shared session/stealth layer in v2 |

## 3. Trigger Phrases

None — this skill is invoked programmatically by other skills via TypeScript imports.

(Optional internal admin commands: "list social accounts", "test login for <brand> on <platform>", "rotate session for <account>".)

## 4. Capabilities

### 4.1 Account Management
- Register new account (brand + platform + username + password + TOTP secret)
- Encrypted storage in `social_credentials` table (per-org, per-brand, per-platform)
- Rotate credentials (password change, TOTP regeneration)
- Deactivate account (don't delete — preserve audit trail)

### 4.2 Browser Lifecycle
- Per-account persistent browser context (Playwright `BrowserContext` with `storageState`)
- Headless or headed (configurable per environment — headed in dev for debugging)
- Stealth plugins: `playwright-extra` + `puppeteer-extra-plugin-stealth`
- Per-account user-agent and viewport (kept consistent across sessions for fingerprint stability)
- Optional residential proxy support (config flag, not v1)

### 4.3 Login Flow
- Detect login page vs. logged-in state
- Submit credentials with realistic typing cadence
- Handle 2FA: TOTP code computation from stored secret (RFC 6238)
- Handle email/SMS code challenges → human-in-the-loop prompt with timeout
- Handle CAPTCHA → human-in-the-loop prompt (no auto-solve services in v1)
- Persist session state to vault on successful login
- Re-login flow when persisted session is invalid

### 4.4 Interaction Primitives
- `humanType(selector, text)` — typing with randomized inter-key delays
- `humanClick(selector)` — mouse-move-then-click with small delay
- `humanScroll(distance)` — multi-step scroll with pauses
- `dwell(min, max)` — randomized wait between actions
- `screenshotEvidence(label)` — capture + store with timestamp + action label

### 4.5 Action Logging
- Every action (navigation, click, type, submit) logged to `social_action_log` table
- Screenshots stored in object storage with references in log
- Log includes: account, platform, action type, target URL, timestamp, success/failure, screenshot ref
- Retention: 90 days (compliance + debugging)

### 4.6 Safety Rails
- **Action quotas per account per day** — hard cap configurable per platform (X: 50, LinkedIn: 30, Reddit: 20)
- **Min interval between actions** — configurable per platform (X: 30 min, LinkedIn: 1 hour)
- **Detection signals** — abort if encountered:
  - "Unusual activity" warnings
  - CAPTCHA challenges mid-session
  - Account-locked redirects
  - Rate-limit error pages
- **Kill switch** — single config flag to disable all automation across all platforms

## 5. Architecture

```
src/lib/social/
├── browser/
│   ├── context-manager.ts      # Per-account BrowserContext lifecycle
│   ├── stealth.ts              # Stealth plugin config
│   ├── human-interaction.ts    # humanType, humanClick, humanScroll, dwell
│   └── screenshot.ts           # Evidence capture
├── auth/
│   ├── credential-vault.ts     # Encrypted creds (uses existing encryption layer)
│   ├── totp.ts                 # RFC 6238 implementation
│   └── login-flows/
│       ├── x.ts                # X-specific login selectors + flow
│       ├── linkedin.ts         # LinkedIn-specific
│       ├── reddit.ts           # Reddit-specific
│       └── ...
├── logging/
│   ├── action-log.ts           # social_action_log writes
│   └── quota-enforcer.ts       # daily/interval quota checks
└── types.ts                    # SocialAccount, SocialAction, ActionResult
```

### Database Schema (Drizzle migration)

```sql
-- social_credentials: encrypted account credentials
CREATE TABLE social_credentials (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  platform TEXT NOT NULL,           -- 'x', 'linkedin', 'reddit', etc.
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  totp_secret_encrypted TEXT,
  session_state_encrypted TEXT,     -- Playwright storageState JSON
  session_expires_at TIMESTAMPTZ,
  user_agent TEXT NOT NULL,
  viewport_width INT NOT NULL,
  viewport_height INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'flagged', 'disabled'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand_id, platform, username)
);

-- social_action_log: full audit trail of automation actions
CREATE TABLE social_action_log (
  id UUID PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES social_credentials(id),
  action_type TEXT NOT NULL,        -- 'login', 'post', 'comment', 'navigate', etc.
  target_url TEXT,
  status TEXT NOT NULL,             -- 'success', 'failure', 'aborted'
  error_message TEXT,
  screenshot_ref TEXT,              -- object storage path
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 6. Guardrails

- **No credential plain-text in logs, errors, or screenshots** — sanitization required at every output boundary
- **TOTP secrets never returned from credential vault** — only the computed 6-digit code, scoped to single login attempt
- **Encryption key in env, not in DB** — uses existing Apex encryption pattern
- **Action quotas are hard caps** — refusing requests is correct behaviour, not a bug
- **Detection-signal abort is non-negotiable** — once aborted, account marked `flagged` until manual review
- **Per-org isolation** — credentials never accessible across organizations (multi-tenant safety)
- **Kill switch must work in <5 seconds** — single flag flip pauses every running automation

## 7. Success Metrics

| Metric | Target |
|---|---|
| Account suspensions across all platforms | 0 in first 90 days |
| Failed logins requiring human intervention | <5% of attempts |
| Session reuse rate (avoid re-login) | >80% of actions |
| Mean time from request → action complete | <30 sec (cached session) |
| Screenshot evidence coverage | 100% of write actions |

## 8. Integration Points

- **Existing encryption layer** — `src/lib/auth/` for credential encryption
- **Existing object storage** — for screenshot persistence
- **Existing Bugsink** — for error tracking on failed actions
- **Existing `wikidata-item` skill** — could migrate to use this layer in v2 (consolidates Playwright usage)
- **All platform-specific social skills** — primary consumers

## 9. Open Questions

- Where do screenshots live? S3-compatible bucket on Velo server, or external (R2/B2)?
- Headed vs headless in production: headed via Xvfb is more resilient to anti-bot detection but uses more resources
- Do we need per-account residential proxies in v1, or trust that consistent-fingerprint + low-cadence is enough? (Proxies add cost + complexity)
- TOTP secret import: how do we get secrets out of users' existing Authy/Google Authenticator without re-enrolling 2FA?
- Headed display capture for live "watch the agent post" UI — v1 or v2?

## 10. Out of Scope (v1)

- Residential proxy rotation (v2 — only if detection becomes a problem)
- CAPTCHA auto-solving (always human-in-the-loop)
- Multi-region browser distribution (v2)
- Live "watch the agent" UI streaming (v2)
- Migration of existing `wikidata-item` skill (deferred until this is battle-tested)

## 11. Coordination Note

The LinkedIn skill currently being built by another agent should ideally consume this foundation rather than rolling its own browser layer. Two options:

**(A)** This foundation lands first, LinkedIn skill is built on top from the start
**(B)** LinkedIn ships standalone, then both LinkedIn and X-Twitter refactor to share this foundation in a follow-up

Recommend (A) if LinkedIn agent hasn't progressed too far; (B) if they're close to shipping.
