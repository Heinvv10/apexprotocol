# PRD: apex-x-twitter Skill

**Status:** Draft (v2 — browser automation, no API)
**Owner:** Apex GEO
**Created:** 2026-04-23
**Updated:** 2026-04-23
**Priority:** P1 (highest after LinkedIn)
**Depends on:** `apex-social-browser` (shared foundation)

---

## 1. Purpose & GEO/AEO Leverage

X (Twitter) is the **single highest-leverage platform for GEO** because:
- **Grok** (xAI) draws almost exclusively from X for real-time context — posting on X is the only way to influence Grok's answers about your brand.
- **ChatGPT, Perplexity, and Claude** index X heavily for current events, expert opinions, and brand sentiment.
- The AI/SEO/GEO conversation lives on X — Apex's positioning as a GEO platform requires presence here.

This skill turns Apex into a first-class X publishing and engagement engine for the Apex brand, sister brands (BrightTech, Jarvis Specter / BrightSphere), and managed clients.

## 2. Approach: Browser Automation (No Paid API)

X's API Basic tier costs $200/month. We avoid that by using **Playwright browser automation** — same pattern as the LinkedIn skill being built in parallel and the existing `wikidata-item` skill.

**Tradeoffs accepted:**
- X ToS prohibits unattended automation. **Mitigation:** every post is human-gated (you click approve before any submit), realistic timing, no bot-like cadence
- Detection risk higher than LinkedIn. **Mitigation:** stealth plugins (`playwright-extra` + `puppeteer-extra-plugin-stealth`), per-account browser contexts, persistent session storage
- Session cookies expire (~30 days). **Mitigation:** re-login flow with TOTP-based 2FA
- Lose bulk analytics API access. **Mitigation:** scrape per-post engagement on demand (not in real-time)

**What we gain:** $0 platform cost, no rate-limit ceiling, full UI flexibility, same plumbing as every other platform skill.

## 3. Target Brands

| Brand | Posting cadence | Voice |
|---|---|---|
| Apex GEO | 1–2x/day | Authoritative, data-driven, GEO/AEO thought leadership |
| BrightTech | 3x/week | Technical case studies, PSI lift demos |
| Jarvis Specter / BrightSphere | 2x/week | Agency POV, client wins, industry commentary |
| Clients (white-label) | Per contract | Brand voice from `brand_voice` table |

## 4. Trigger Phrases

- "post to X about <topic>"
- "draft an X thread on <topic>"
- "tweet from <brand> about <topic>"
- "schedule an X post"
- "what's <brand>'s X performance this week"
- "respond to this X mention"

## 5. Inputs

- **Brand context:** pulled from `brands` table — voice, tone, banned terms, target audience
- **Source content:** audit findings, case studies, blog posts, industry news links
- **Format:** single tweet, thread (2–10 tweets), reply, quote-tweet
- **Posting target:** which brand account, scheduled time (default: optimal slot via posting time analysis)

## 6. Workflow

1. **Research** — pull brand voice, recent posts (avoid repetition), target audience pain points
2. **Draft** — generate post/thread with hooks optimized for X algorithm + Grok citation patterns
3. **Optimize for AI citation** — embed entity names, data points, source links (Grok and Perplexity reward this)
4. **Human review gate** — show draft to user with screenshot of how it will render; accept/edit/reject
5. **Browser submission** — via `apex-social-browser` foundation:
   - Restore persisted session for the target brand account
   - If session expired → trigger re-login flow (TOTP code from vault)
   - Navigate to compose, type post text (with realistic typing cadence), upload media if any, click Post
   - Capture screenshot evidence of submission
   - Extract canonical post URL from the submitted tweet
6. **Log** — write to `social_posts` table with URL, brand, timestamp, status
7. **Measure** — scheduled scrape (separate cron) pulls engagement metrics 24h + 7d post-publish

## 7. Guardrails

- **Always human-gated** — no auto-post in v1. The Skill drafts and previews; the user clicks approve.
- **No fabricated stats** — every numerical claim must trace to a source (Apex audit, public study, brand data). Per project memory `feedback_no_fabricated_metrics`.
- **No engagement bait** — no "RT if you agree", reply-farming, or fake controversy
- **Disclosure** — sponsored / client posts tagged `#ad` or `#client` per FTC + ASA SA rules
- **Anti-pile-on** — never quote-tweet to dunk; only quote-tweet to add value
- **Detection avoidance:**
  - Max 10 posts/day per account (well below X's de facto 50 cap)
  - Min 30-min gap between posts on same account
  - Randomized typing cadence (not instant paste)
  - Persistent browser context per account (consistent fingerprint)
- **No automation if 2FA fails** — abort and surface error; never bypass 2FA

## 8. Success Metrics

| Metric | Target (90 days) |
|---|---|
| Apex brand mentions in Grok answers | +200% |
| Apex brand mentions in ChatGPT/Perplexity citing X | +100% |
| Follower growth (Apex account) | +500/month |
| Avg engagement rate per post | >2.5% |
| Click-through to apexgeo.app | +50/post avg |
| Posts referenced by AI engines (tracked via Apex monitor) | >5/month |
| Account suspensions / shadow-bans | 0 |

## 9. Integration Points

- **`apex-social-browser` foundation** — login, session persistence, stealth config, screenshot evidence (shared with apex-linkedin, apex-reddit, etc.)
- **Apex monitor module** — feed AI citation data back into skill to learn what works
- **Brand voice** — `brands.voice_profile` JSON column (existing)
- **Audit findings** — surface high-impact findings as post material via `audits.recommendations`
- **Posting calendar** — new `social_posts` table (X, LinkedIn, Reddit unified schema)
- **Image generation** — optional `mcp__ironman-creative__generate_image` for visual posts
- **Auth vault** — encrypted credentials + TOTP secrets in `social_credentials` table (multi-tenant, per-brand)

## 10. Open Questions

- Per-account TOTP setup: do we provision new TOTP secrets when adding accounts, or import from existing 2FA apps (Authy/Google Authenticator export)?
- Run browser headless on Velo server (low resource, harder to debug) or with Xvfb display (slightly heavier, easier to record sessions for replay)?
- For mention monitoring — scrape periodically, or use unofficial RSS bridges (Nitter etc.) which keep breaking?

## 11. Out of Scope (v1)

- Auto-posting (always human-gated in v1)
- DMs / inbox management
- X Spaces hosting
- Paid ad management
- X Premium video uploads
- Real-time mention alerts (v2 — needs persistent scraping daemon)
