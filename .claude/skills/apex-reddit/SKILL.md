---
name: apex-reddit
description: |
  Draft posts and comments on Reddit on behalf of Apex GEO, BrightTech,
  Jarvis Specter / Brightsphere, and managed client brands. Uses browser
  automation (no paid Reddit API — free-tier limits and recent pricing
  changes make it unfit for agency posting).

  Reddit's agency value is comments > posts. The skill supports both, but
  bias toward high-quality comments in topical subreddits.

  Every originals post is human-gated. Engagement (replies/comments)
  follows the brand's `engagement_autonomy_mode` flag — drafted by default,
  autonomous only after trust is earned (Phase 2).

  USE WHEN the user says 'post to Reddit', 'post to r/<sub>', 'comment on
  this Reddit thread', 'reply to this subreddit post', 'draft a Reddit
  comment', or shares a URL containing reddit.com and wants to engage.
---

# apex-reddit — Reddit Publishing + Commenting

## Purpose

Reddit is a strong long-tail citation source for ChatGPT, Perplexity, and
Claude — especially on technical, how-to, and comparison queries. Agency
posting on Reddit demands higher authenticity than LinkedIn or X because
subreddit mods aggressively ban promotional accounts.

Two surfaces are supported:
- **Post submission** — submit a text or link post to a specific subreddit
- **Comment / reply** — reply to an existing thread by URL

## Depends On

- `apex-social-browser` foundation skill
- `src/lib/social/reddit/` — Reddit-specific login, post-composer, comment-composer

## Trigger Phrases

- "post this to r/<sub>"
- "draft a Reddit post for r/<sub> about <topic>"
- "comment on this thread: <reddit URL>"
- "what should <brand> post on Reddit today"
- "reply to this: <reddit URL>"

## Workflow

1. **Identify brand + surface** — subreddit for posts, thread URL for comments
2. **Resolve credential** — `findCredential(brandId, 'reddit', username)`
3. **Subreddit fit check** (posts only) — do not post to subs the brand
   has no history in, or subs with heavy self-promo bans (r/SEO, r/marketing
   require 9:1 helpful:promotional ratio)
4. **Draft** — post (title + body / link) or comment. Reddit length limits:
   - Title: 300 chars
   - Body: 40,000 chars
   - Comment: 10,000 chars
5. **Show preview** — offer approve / edit / reject
6. **Submit** — only on explicit approval:
   ```typescript
   import {
     loginToReddit,
     composePost,
     composeComment,
   } from '@/lib/social/reddit';
   import { findCredential, launchSocialBrowser } from '@/lib/social/browser';

   const credential = await findCredential(brandId, 'reddit', username);
   const browser = await launchSocialBrowser({
     headless: true,
     userAgent: credential.userAgent,
     viewport: { width: credential.viewportWidth, height: credential.viewportHeight },
   });
   const [page] = await browser.pages();
   await loginToReddit(browser, page, credential);

   // Text post:
   const post = await composePost(page, credential, 'SEO', {
     kind: 'text', title, body,
   }, process.env.SOCIAL_SCREENSHOT_DIR);
   // Link post:
   const link = await composePost(page, credential, 'SEO', {
     kind: 'link', title, url,
   }, process.env.SOCIAL_SCREENSHOT_DIR);
   // Comment:
   const comment = await composeComment(page, credential, threadUrl, body, process.env.SOCIAL_SCREENSHOT_DIR);

   await browser.close();
   ```
7. **Record + confirm** — post URL reliably extractable (`/comments/<id>/`);
   comment URL defaults to the thread URL.

## Hard Guardrails (non-negotiable)

- **No auto-post for originals** — every post submission requires explicit
  approval in chat.
- **No promotional spam** — respect each subreddit's self-promo ratio.
  Default to <10% promotional per subreddit per 30 days.
- **No fabricated stats** — numerical claims trace to a source.
- **No sockpuppet replies** — one Reddit identity per brand. Do not use
  multiple accounts to upvote or cross-promote.
- **Rule read before first post** — every subreddit has custom rules; read
  the sidebar before first submission. Shadowban risk is real.
- **Detection-signal abort** — `RedditDetectionAbort` means the credential
  is flagged. Stop. Do not retry.
- **Disclosure** — client content must disclose relationship per FTC.

## Writing Voice per Brand

| Brand | Tone | Surface bias | Notes |
|---|---|---|---|
| Apex GEO | Expert, data-forward | Comments > posts | r/SEO, r/bigseo, r/marketing |
| BrightTech | Technical helper | Comments | r/programming, r/typescript, r/selfhosted |
| Jarvis Specter | AI-first-person | Posts | r/ChatGPT, r/agenticAI, r/SaaS |
| Brightsphere | Agency | Rare | r/entrepreneur, r/SaaS — only with real value |
| Clients | Per contract | Per contract | Agency discretion |

## Kill Conditions

- Credential `flagged` or `disabled`
- Quota exceeded
- Subreddit in the `AVOID_SUBS` list (see assets/avoid-subs.md — TBD)
- User has not connected a Reddit account for the brand
- `APEX_SOCIAL_BROWSER_DISABLED=1` set

## Measurement

- Upvotes, comments, and inbound link clicks tracked via 24h + 7d follow-up scrape
- Post/comment URL written to `social_browser_actions.targetUrl`
- Shadowban detection: follow-up fetch of the submitted post as anonymous
  — if the post 404s or shows [deleted], credential is auto-flagged
