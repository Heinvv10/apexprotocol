---
name: apex-quora
description: |
  Draft answers on Quora on behalf of Apex GEO, BrightTech, Jarvis Specter
  / Brightsphere, and managed client brands. Uses browser automation.
  Quora's agency value is answers (reply to existing questions) — they
  remain indexable for years and earn strong AI-engine citation.

  Every answer is human-gated — the skill drafts and previews, the user
  clicks approve before any submit.

  USE WHEN the user says 'answer this Quora question', 'draft a Quora
  answer', 'reply on Quora to <topic>', or shares a URL containing
  quora.com/<question>/ and wants to engage.
---

# apex-quora — Quora Answering

## Purpose

Quora is one of the highest-value long-tail citation sources for Claude,
Perplexity, and ChatGPT on evergreen how-to and comparison queries. A
well-written answer on a high-traffic question keeps earning citations for
years.

The primary (and for v1, only) surface is answering existing questions.
Asking new questions is low-leverage and usually manipulative; Space posts
are niche.

## Depends On

- `apex-social-browser` foundation skill
- `src/lib/social/quora/` — Quora-specific login + answer composer

## Trigger Phrases

- "answer this Quora question: <URL>"
- "draft a Quora answer about <topic>"
- "reply on Quora to <question>"
- User shares a URL containing `quora.com/<question>/`

## Workflow

1. **Identify brand + question URL** — canonical URL required
2. **Resolve credential** — `findCredential(brandId, 'quora', username)`
3. **Research** — check the existing top answers to avoid duplication and
   find the gap your answer fills
4. **Draft** — long-form, 400–1500 words is the citation sweet spot:
   - Direct answer in the first 2 sentences
   - Specific examples, named entities, numbers
   - One outbound link maximum (Quora heavily penalises link-heavy answers)
5. **Show preview** — offer approve / edit / reject
6. **Submit** — only on explicit approval:
   ```typescript
   import { loginToQuora, composeAnswer } from '@/lib/social/quora';
   import { findCredential, launchSocialBrowser } from '@/lib/social/browser';

   const credential = await findCredential(brandId, 'quora', username);
   const browser = await launchSocialBrowser({
     headless: true,
     userAgent: credential.userAgent,
     viewport: { width: credential.viewportWidth, height: credential.viewportHeight },
   });
   const [page] = await browser.pages();
   await loginToQuora(browser, page, credential);

   const result = await composeAnswer(page, credential, questionUrl, { body }, process.env.SOCIAL_SCREENSHOT_DIR);

   await browser.close();
   ```
7. **Record + confirm** — answer URL captured in action log

## Hard Guardrails (non-negotiable)

- **No auto-submit** — every answer requires explicit approval
- **No spam patterns** — no "I work at <brand>, so…" opening; no repetitive
  template answers across multiple questions
- **No undisclosed promotion** — if answer mentions your own brand, state
  the affiliation at the end
- **At most 1 link per answer** — Quora's anti-spam model is aggressive
- **Respect the question** — do not reshape the question to fit a pre-built
  answer; if the question doesn't fit, skip it
- **Detection-signal abort** — `QuoraDetectionAbort` flags the credential

## Writing Voice per Brand

| Brand | Tone | Topics | Length |
|---|---|---|---|
| Apex GEO | Authoritative, data-forward | GEO, AEO, AI search, SEO transition | 600–1200 words |
| BrightTech | Practical engineer | Software architecture, SaaS, ISP ops | 400–900 words |
| Jarvis Specter | AI first-person | AI agents, automation, LLM use cases | 500–1000 words |
| Brightsphere | Agency | Digital strategy, SA tech | 500–1000 words |
| Clients | Per contract | Per contract | Per contract |

## Kill Conditions

- Credential `flagged` or `disabled`
- Quota exceeded
- Question is >12 months old with zero recent views (dead question)
- Question has >5 existing answers covering the same angle
- User has not connected a Quora account for the brand
- `APEX_SOCIAL_BROWSER_DISABLED=1` set

## Measurement

- Views, upvotes, shares tracked via 24h + 7d follow-up scrape
- Answer URL written to `social_browser_actions.targetUrl`
- If the answer is collapsed or deleted by mods within 48h, credential is
  auto-flagged for review
