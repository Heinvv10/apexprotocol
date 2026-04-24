# PRD: apex-reddit Skill

**Status:** Draft
**Owner:** Apex GEO
**Created:** 2026-04-23
**Priority:** P1

---

## 1. Purpose & GEO/AEO Leverage

Reddit is one of the **most-cited sources in ChatGPT and Perplexity answers** — particularly for "how do I", "is X worth it", and "best tool for Y" queries. Reddit threads also rank prominently in Google's AI Overviews.

This makes Reddit unusually high-leverage for GEO, but also unusually high-risk: Reddit communities have zero tolerance for marketing. The skill must enforce that line ruthlessly or it destroys the very brand equity it's meant to build.

## 2. Target Brands

| Brand | Use case |
|---|---|
| Apex GEO | Genuine participation in r/SEO, r/marketing, r/Entrepreneur, r/SaaS, r/PPC |
| BrightTech | Performance case studies in r/webdev, r/PageSpeed, r/Wordpress |
| Jarvis Specter / BrightSphere | Agency POV in r/agency, r/digital_marketing |
| Clients | Industry-specific subs (per client contract, with explicit subreddit list) |

Each brand needs a **named human posting account** with established history — not a fresh "BrandName_Official" handle. Skill assists; it does not impersonate.

## 3. Trigger Phrases

- "find Reddit threads about <topic>"
- "draft a Reddit reply to <thread URL>"
- "what's <brand>'s Reddit account doing this week"
- "is <topic> trending on r/<subreddit>"
- "post to r/<subreddit> from <brand account>"

## 4. Inputs

- **Subreddit context:** rules (auto-fetched from sidebar), recent top posts, community tone
- **Brand voice:** softened — Reddit voice ≠ LinkedIn voice
- **Source content:** genuine expertise, original data, real client stories (anonymized)
- **Account history:** posting account's karma, post history, mod-flag status

## 5. Workflow

1. **Listen** — daily scan of target subreddits for posts matching brand-relevant keywords
2. **Triage** — surface 5–10 threads/day where brand has genuine value to add
3. **Draft reply** — written in human conversational tone, NOT marketing copy; cite sources
4. **Mandatory human gate** — every reply requires user approval before posting (no auto-post)
5. **Post** — via Reddit API with the named human account
6. **Monitor** — track upvotes, replies, mod actions; flag if removed for review

## 6. Guardrails (CRITICAL — Reddit is unforgiving)

- **NEVER auto-post** without human approval. Hard rule, no exceptions.
- **9:1 rule** — posting account must contribute 9 non-promotional comments for every 1 with a brand mention
- **Disclose affiliation** when relevant ("I work on Apex, an AEO platform" — never hidden)
- **Respect subreddit rules** — fetch and parse sidebar rules before posting; abort if rule conflict
- **No karma farming** — no copy-pasted replies, no template detection patterns
- **No fabricated experience** — if the account hasn't actually used what it's recommending, don't recommend it
- **Mod-flag check** — if the account has any recent mod actions, pause posting and alert user
- **Per project memory `feedback_no_audits_without_access`** — only recommend Apex audits for sites Apex can actually fix

## 7. Success Metrics

| Metric | Target (90 days) |
|---|---|
| Apex/brand mentions in ChatGPT answers citing Reddit threads | +50% |
| Reddit referral traffic to apexgeo.app | 200+ uniques/month |
| Account karma growth | +500/month per active account |
| Posts removed by mods | <2% of posts |
| Genuine signups attributed to Reddit | 5+/month |

## 8. Integration Points

- **Reddit OAuth** — per-account credentials in `social_credentials`
- **Subreddit watchlist** — new `reddit_subreddit_watch` table per brand
- **Thread queue** — new `reddit_thread_queue` table for triage workflow
- **Brand voice** — separate `voice_profile.reddit` sub-config (more casual)
- **Apex audit data** — only cite for clients/brands Apex actually serves

## 9. Open Questions

- Do we use one shared Apex Reddit account, or separate accounts per team member?
- How do we handle subreddits that ban *any* commercial mention (e.g., r/SEO has strict rules)?
- Should this skill also detect competitor mentions and surface them for response?

## 10. Out of Scope (v1)

- Subreddit creation / moderation
- Reddit Ads
- DMs / chat
- Crosspost automation (too easily flagged as spam)
