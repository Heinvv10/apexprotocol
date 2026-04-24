# PRD: apex-quora Skill

**Status:** Draft
**Owner:** Apex GEO
**Created:** 2026-04-23
**Priority:** P3 (lowest of the six — evaluate after 60 days)

---

## 1. Purpose & GEO/AEO Leverage

Quora's organic traffic is in long-term decline, but it remains **disproportionately cited by AI engines** for evergreen "how do I" and "what is" queries. ChatGPT and Perplexity both pull Quora answers as authoritative-sounding source material — particularly for older, well-upvoted answers that have accumulated trust signals.

The play is **answer permanence**: a high-quality Quora answer keeps earning AI citations for years with no further effort. Volume is irrelevant; depth and longevity matter.

This is the lowest-priority skill of the six. Build it only after X, Reddit, YouTube, and Wikidata are humming. Evaluate against actual citation lift after 60 days; deprecate if the ROI isn't there.

## 2. Target Brands

| Brand | Use case |
|---|---|
| Apex GEO | Definitive answers to GEO/AEO questions ("What is generative engine optimization?") |
| BrightTech | Page-speed and Core Web Vitals questions |
| Jarvis Specter / BrightSphere | Agency-process and pricing questions |
| Clients | Skip — too low-leverage for client work in v1 |

## 3. Trigger Phrases

- "find Quora questions about <topic>"
- "draft a Quora answer for <question URL>"
- "what's our Quora performance"
- "is this question worth answering on Quora"

## 4. Inputs

- **Question URL or query** — the Quora question being answered
- **Brand author profile:** posting account with established credibility (see Guardrails)
- **Source material:** original data, audit findings, real expertise
- **Length target:** 300–800 words (Quora's sweet spot for AI citation)

## 5. Workflow

1. **Question discovery** — weekly scan for high-impression questions matching brand keywords; prioritize:
   - Questions with 1k+ followers
   - Questions where existing answers are weak or outdated
   - Questions ranking on Google for AI Overviews
2. **Triage** — only 1–2 answers per week per account (Quora penalizes high-volume promo accounts)
3. **Draft** — first-person expert voice, structured with subheadings, cited sources, one image if useful
4. **Disclosure** — bio mentions Apex affiliation; never hide the relationship
5. **Human review gate** — every answer reviewed before posting
6. **Publish** — via Quora web UI (no public posting API)
7. **Long-term monitoring** — track upvotes, views, AI citations over 6-month windows

## 6. Guardrails

- **One named expert per brand** — Quora rewards individual reputation, not company accounts
- **Disclose affiliation in bio** ("Founder, Apex GEO") — never in answer body unless directly relevant
- **No outbound link spam** — at most one link per answer, and only when genuinely the best resource
- **No answer farming** — never copy your own answers across multiple questions
- **No "Promoted answer" pattern** — answers that read as marketing get downvoted into oblivion
- **Avoid controversial questions** — Apex's brand doesn't benefit from political/social debate engagement
- **Per `feedback_no_audits_without_access`** — only recommend the Apex audit loop where genuine deploy access exists

## 7. Success Metrics

| Metric | Target (90 days) |
|---|---|
| High-quality answers published | 10+ |
| Avg upvotes per answer | 20+ |
| Answers cited by ChatGPT/Perplexity (tracked via Apex monitor) | 2+ |
| Referral signups to apexgeo.app | 5+ |
| Quora author follower growth | 100+ per active account |

**Kill criteria:** if after 60 days zero answers are cited by AI engines and referral traffic is <2/month, deprecate the skill.

## 8. Integration Points

- **Apex monitor** — track AI citation rate per answer to validate ROI
- **Brand voice** — most casual variant (Quora is conversational)
- **Apex audit module** — surface findings as answer material
- **No Quora API for posting** — skill prepares draft + finds question; human posts

## 9. Open Questions

- Is Quora declining fast enough that the skill becomes obsolete before it ships?
- Quora Spaces — worth managing, or just answer in main Q&A?
- Do we participate in Quora's "Ask me anything" sessions for thought leadership?

## 10. Out of Scope (v1)

- Quora Ads
- Quora Spaces management
- Quora Plus / monetization
- Auto-posting (Quora has no API for this anyway)
