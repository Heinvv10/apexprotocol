---
name: apex-linkedin
description: |
  Draft and post to LinkedIn on behalf of Apex GEO, BrightTech, Jarvis Specter /
  Brightsphere, and managed client brands. Uses browser automation (no paid
  LinkedIn Marketing API — that path is pending CMA approval). Supports
  posting to the logged-in user's personal feed AND to Company Pages the
  user admins.

  Every post is human-gated — the skill drafts and previews, the user clicks
  approve before any submit. Reviewed-originals autonomy model.

  USE WHEN the user says 'post to LinkedIn', 'draft a LinkedIn post', 'post
  to the <brand> LinkedIn page', 'post as Jarvis', 'share on LinkedIn',
  'publish to Brightsphere LinkedIn', or shares a URL containing
  linkedin.com/company/ or linkedin.com/in/ and wants to engage with it.
---

# apex-linkedin — LinkedIn Publishing

## Purpose

LinkedIn is the primary surface for B2B brand authority and the main channel
for Jarvis Specter's agency voice (posts as Brightsphere Technologies). It's
also a strong citation source for Perplexity and Claude on corporate and
employee queries.

Two post surfaces are supported:
- **Personal feed** — posts as the authenticated user (e.g. Jarvis Specter)
- **Company Page** — posts as a Page the user admins (e.g. Brightsphere
  Technologies, company ID `34489687`)

## Depends On

- `apex-social-browser` foundation skill — credentials, session persistence,
  TOTP 2FA (if enabled), quotas, audit log, stealth launcher
- `src/lib/social/linkedin/` — LinkedIn-specific login and post-composer logic

## Trigger Phrases

- "post to LinkedIn about <topic>"
- "draft a LinkedIn post on <topic>"
- "post to the <brand> LinkedIn page"
- "post as Jarvis about <topic>"
- "share this on Brightsphere LinkedIn: <link>"
- "what should <brand> post on LinkedIn today"

## Workflow

1. **Identify brand + surface** — from the trigger message:
   - If "the <brand> LinkedIn page" → Company Page post (needs `companyId`)
   - Otherwise → personal feed post
   - If ambiguous, ask
2. **Resolve credential** — `findCredential(brandId, 'linkedin', username)`
   - For Brightsphere: username = `jarvis@h10.co.za`
3. **Resolve Company Page ID** (Page posts only) — from `brands.socialLinks`
   or the trigger message. For Brightsphere: `34489687`
4. **Research** — pull brand voice, recent posts (avoid near-duplicate),
   audit/GEO context when relevant
5. **Draft** — generate the post text (LinkedIn limit: 3000 chars). Long-form
   allowed and rewarded; first 2 lines are the above-fold hook.
   - Named entities + concrete numbers (improves Perplexity / Claude citation)
   - At most one outbound link
   - Avoid hashtag spam (1–5 relevant tags max)
6. **Show preview to user** — draft rendered in chat; if an image is
   provided, show its path. Offer: approve / edit / reject.
7. **Submit** — only on explicit approval:
   ```typescript
   import {
     loginToLinkedIn,
     composePost,
     composePagePost,
   } from '@/lib/social/linkedin';
   import {
     findCredential,
     launchSocialBrowser,
   } from '@/lib/social/browser';

   const credential = await findCredential(brandId, 'linkedin', username);
   const browser = await launchSocialBrowser({
     headless: true,
     userAgent: credential.userAgent,
     viewport: { width: credential.viewportWidth, height: credential.viewportHeight },
   });
   const [page] = await browser.pages();
   await loginToLinkedIn(browser, page, credential);

   // Personal feed:
   const result = await composePost(page, credential, { text, imagePath }, process.env.SOCIAL_SCREENSHOT_DIR);
   // OR Company Page:
   const result = await composePagePost(page, credential, { text, imagePath }, companyId, process.env.SOCIAL_SCREENSHOT_DIR);

   await browser.close();
   ```
8. **Record + confirm** — return the success toast screenshot path and confirm
   `social_browser_actions` row exists. LinkedIn doesn't reliably expose a
   canonical post URL immediately — the action log is the source of truth.

## Hard Guardrails (non-negotiable)

- **No auto-post** — every submission requires explicit user approval in chat.
- **No fabricated stats** — every numerical claim traces to a source.
- **No engagement bait** — no "agree if you comment", reply-farming, or
  manufactured controversy.
- **Quota enforcer blocks you for a reason** — if `QuotaExceededError` is
  thrown, do not retry. Tell the user when the next window opens.
- **Detection-signal abort** — if `LinkedInDetectionAbort` is thrown, the
  credential is flagged in the DB. Tell the user what happened and stop.
  Do not attempt workarounds — LinkedIn account restrictions are
  expensive to unwind.
- **Disclosure** — for sponsored / client posts, include `#ad`, `#client`,
  or `#sponsored` per FTC + ASA SA rules.
- **Privacy** — Brightsphere's own LinkedIn page may name Brightsphere.
  Client brand pages must follow each client's privacy policy. Do NOT
  apply the MCOS `social-scheduler` "no company names" rule here — that's
  for a different brand family.

## Writing Voice per Brand

Pulled from `brands.voice` JSON, with LinkedIn-specific overlays:

| Brand | Tone | Cadence | Hook style |
|---|---|---|---|
| Apex GEO | Authoritative, data-forward | 2/week | "We audited X sites — here's what broke" |
| BrightTech | Technical, proof-driven | 1/week | Before/after numbers, engineering posts |
| Jarvis Specter (personal) | Punchy, AI-first-person | 2/week | Hot take + a number |
| Brightsphere Technologies (Page) | Agency POV, production-grade | 1–2/week | Production systems, real numbers |
| Clients | From `voice` profile | Per contract | Per contract |

## Image Handling

Images live in `/tmp/` or on durable storage. The composer uploads via the
hidden `<input type="file">` after clicking "Add media", then clicks the
"Next" button before text entry.

Recommended aspect ratio: 1.91:1 (1200×628). LinkedIn also accepts 1:1
(square) and portrait.

## Success Signal

Per FINDINGS.md §3.2, the earlier bot's wait-for-dialog-hide was unreliable.
This composer instead races three positive signals:

1. Success toast (`.artdeco-toast-item--success`) appears
2. The composer dialog actually unmounts
3. URL navigates back to `/feed/` or the Page admin posts URL

Whichever wins first, we call it a success. If none fires within 30s we
capture a timeout screenshot, write a `failure` action-log row, and throw.

## Kill Conditions (stop drafting immediately and alert user)

- Credential status is `flagged` or `disabled`
- Quota check fails at current attempt
- Message content would require fabricating a statistic
- User has not yet connected a LinkedIn account for the target brand
- Company Page ID is unknown (for Page posts) and not provided
- `APEX_SOCIAL_BROWSER_DISABLED=1` is set

## Measurement

Every successful post writes a `social_browser_actions` row. A separate
scheduled scrape (future) pulls LinkedIn impressions and reactions 24h and
7d after publish to feed the Apex monitor module.

## Related

- LinkedIn Marketing API path (future): `App #2 BrightSphere Community API`,
  pending CMA approval (submitted ~2026-04-22, approval 2–6 weeks out).
  When approved, a parallel API path will supplement — not replace — the
  browser-automation flow for scheduled / high-volume posts.
- Previous bot workspace: `~/Workspace/linkedin-bot/` (superseded; flow
  absorbed into `src/lib/social/linkedin/`)
