---
name: apex-x-twitter
description: |
  Draft and post to X (Twitter) on behalf of Apex GEO, BrightTech, Jarvis Specter /
  BrightSphere, and managed client brands. Uses browser automation (no paid X API).
  Every post is human-gated — the skill drafts and previews, the user clicks approve
  before any submit.

  Optimised for AI-engine citation: Grok (xAI) pulls almost exclusively from X for
  real-time context, and ChatGPT / Perplexity / Claude all index X heavily.

  USE WHEN the user says 'post to X', 'draft an X thread', 'tweet from <brand>',
  'tweet about', 'post to Twitter', 'draft a tweet', 'respond to this X mention',
  'schedule an X post', or shares a URL containing x.com / twitter.com and wants
  to engage with it.
---

# apex-x-twitter — X (Twitter) Publishing

## Purpose

X is the single highest-leverage platform for GEO because Grok draws almost entirely
from X and the major AI engines index it aggressively. Posting on X is also the only
way to influence Grok's answers about a brand.

**Related PRD**: `docs/PRD/skills/apex-x-twitter.md`

## Depends On

- `apex-social-browser` foundation skill — credentials, session persistence, TOTP 2FA, quotas, audit log
- `src/lib/social/x/` — X-specific login and post-composer logic

## Trigger Phrases

- "post to X about <topic>"
- "draft an X thread on <topic>"
- "tweet from <brand> about <topic>"
- "respond to this X mention <URL>"
- "quote-tweet this: <URL>"
- "what should <brand> tweet today"

## Workflow

1. **Identify brand + account** — from the trigger message or by asking if ambiguous (use `findCredential(brandId, 'twitter', username)`)
2. **Research** — pull brand voice, recent posts (avoid near-duplicate), target-audience pain points, the GEO-citation angle
3. **Draft** — generate tweet or thread (2–10 tweets). Each tweet ≤ 280 chars.
   - Hook in first line (AI engines + algorithm both reward this)
   - Named entities + concrete numbers (improves Grok / Perplexity citation rates)
   - At most one outbound link; prefer adding it in the last tweet of a thread
4. **Show preview to user** — draft rendered in chat, offer: approve / edit / reject
5. **Submit** — only on explicit approval:
   ```typescript
   import { loginToX, composePost, composeThread } from '@/lib/social/x';
   import { findCredential } from '@/lib/social/browser';

   const credential = await findCredential(brandId, 'twitter', username);
   // open puppeteer browser with stealth plugin
   await loginToX(browser, page, credential);
   const result = await composePost(page, credential, text, screenshotDir);
   ```
6. **Record + confirm** — return canonical post URL to the user, confirm `social_browser_actions` row exists

## Hard Guardrails (non-negotiable)

- **No auto-post** — every submission requires explicit user approval in chat. Never submit without that.
- **No fabricated stats** — every numerical claim must trace to a source (Apex audit, public study, brand data). Per global memory `feedback_no_fabricated_metrics`.
- **No engagement bait** — no "RT if you agree", reply-farming, or manufactured controversy.
- **No dunk quote-tweets** — only quote-tweet when adding genuine value.
- **Quota enforcer blocks you for a reason** — if `QuotaExceededError` is thrown, do not retry. Tell the user how long until the next eligible window (`result.nextEligibleAt`).
- **Detection-signal abort** — if `XDetectionAbort` is thrown, the credential is already flagged in the DB. Tell the user what happened and stop. Do not attempt workarounds.
- **Disclosure** — for sponsored / client posts, include `#ad` or `#client` per FTC + ASA SA rules.

## Writing Voice per Brand

Pulled from `brands.voice_profile` JSON, with these overlays for X specifically:

| Brand | Tone | Cadence | Hook style |
|---|---|---|---|
| Apex GEO | Authoritative, data-forward | 1–2/day | "We audited X sites — here's what broke" |
| BrightTech | Technical, proof-driven | 3/week | Before/after PSI numbers |
| Jarvis Specter / BrightSphere | Agency POV, punchy | 2/week | Hot take + a number |
| Clients | From `voice_profile` | Per contract | Per contract |

## Thread Optimization

Threads reward structure. When drafting:
- Tweet 1: the hook — the most interesting single sentence
- Tweet 2–N: build the argument, one claim per tweet, backed by data
- Last tweet: the payoff + one outbound link (apexgeo.app or source)

## Kill Conditions (stop drafting immediately and alert user)

- Credential status is `flagged` or `disabled`
- Quota check fails with `daily_cap` at current attempt
- Message content would require fabricating a statistic
- User has not yet connected an X account for the target brand
- `APEX_SOCIAL_BROWSER_DISABLED=1` is set

## Measurement

Every successful post writes a `social_browser_actions` row AND a `social_posts` row
(the existing one in `src/lib/db/schema/social.ts`). A separate scheduled scrape
(out of scope here) pulls engagement metrics 24h and 7d after publish to feed the
Apex monitor module.
