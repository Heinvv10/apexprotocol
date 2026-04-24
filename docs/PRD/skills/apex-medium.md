# PRD: apex-medium Skill

**Status:** Draft
**Owner:** Apex GEO
**Created:** 2026-04-23
**Priority:** P3

---

## 1. Purpose & GEO/AEO Leverage

Medium and Substack are **long-form thought leadership distribution channels** with strong indexing by AI engines. Articles get cited in:
- ChatGPT and Claude answers for in-depth queries
- Perplexity for "explain X" responses
- Google AI Overviews for evergreen content

Medium specifically has high domain authority and gets crawled aggressively. Substack adds an email-list angle: subscribers compound over time and create owned distribution.

This skill is lower priority than X/Reddit/YouTube because it's **higher-effort per piece** and the AI-citation lift compounds over months, not days. But it's the foundation of the "thought leader" positioning Apex needs to win agency-tier deals.

## 2. Target Brands

| Brand | Publication strategy |
|---|---|
| Apex GEO | Medium publication "Apex GEO Insights" + Substack newsletter (2x/month) |
| BrightTech | Medium tag-based posting (no dedicated pub) — technical case studies |
| Jarvis Specter / BrightSphere | Substack "BrightSphere Briefing" — agency POV (1x/month) |
| Clients | Ghostwritten on client-named publications (white-label) |

## 3. Trigger Phrases

- "draft a Medium article on <topic>"
- "write a Substack issue for <brand>"
- "what should we publish this month"
- "repurpose <blog post URL> as a Medium piece"
- "publish to Medium" (queues for human review first)

## 4. Inputs

- **Topic angle:** drawn from audit data, client wins, industry events, original research
- **Brand voice:** longer-form variant of brand voice profile
- **Source material:** raw notes, interview transcripts, audit findings, public datasets
- **Length target:** 800–2500 words (Medium sweet spot for AI citation)
- **CTA:** newsletter signup, audit booking, demo request

## 5. Workflow

1. **Topic mining** — weekly scan of audit themes, X conversations, Reddit threads for emerging questions
2. **Research** — original data analysis (e.g., aggregate audit metrics across Apex portfolio); cite primary sources
3. **Outline** — H2-driven structure (AI engines parse headings as answer chunks)
4. **Draft** — written in author voice, not corporate voice; include named examples + numbers
5. **Optimization for AI citation:**
   - Clear H2 questions ("What is GEO?") that match common queries
   - Schema-rich first paragraph (entities, dates, definitions)
   - Internal links to apexgeo.app cornerstone content
6. **Human review gate** — author reviews before publish (this is high-stakes long-form)
7. **Publish + cross-promote** — chain to apex-x-twitter (thread teaser) + apex-linkedin

## 6. Guardrails

- **No AI-slop tells** — banned phrases ("In today's fast-paced world", "Let's dive in", "It's not just X, it's Y", emojis as bullets)
- **Original data preferred** — repurposing public stats is fine; fabricating them is forbidden (per `feedback_no_fabricated_metrics`)
- **Author bylines** — every piece has a real human author. If ghostwritten for client, the named human approves.
- **Honest disclosure** — if the article promotes Apex's own product, say so up front
- **No SEO-hack patterns** — no keyword stuffing, no "[2026 Updated]" title gimmicks, no excessive H2 keyword-cloning
- **Substack monetization opt-in only** — paywall decisions are per-publication, not skill-default

## 7. Success Metrics

| Metric | Target (90 days) |
|---|---|
| Articles published (Apex pub) | 6+ |
| Avg read ratio | >50% |
| Articles cited by ChatGPT/Perplexity | 1+ |
| Substack subscribers (Apex) | 200+ |
| Newsletter open rate | >40% |
| Referral signups to apexgeo.app | 20+/article |

## 8. Integration Points

- **Apex audit data** — anonymized aggregate data is great article fodder ("We audited 500 sites — here's what we found")
- **`brand_voice` profile** — long-form variant
- **Image generation** — `mcp__ironman-creative__generate_image` for hero images (avoid generic stock)
- **Cross-posting** — feed into apex-x-twitter (thread summary) + apex-linkedin (article summary post)
- **Medium API** — drafting via API; final publish through web UI (Medium API is read-mostly now)
- **Substack** — publish via web UI (no public API); skill prepares draft + assets

## 9. Open Questions

- Do we own a Medium publication or post to authors' personal profiles (better for thought leader brand)?
- Substack vs. Beehiiv vs. self-hosted (Ghost) — newsletter platform decision is upstream of this skill
- How aggressively do we repurpose audit findings publicly without exposing client data?

## 10. Out of Scope (v1)

- Substack podcast integration
- Paid newsletter monetization workflow
- Translation / multi-language publishing
- LinkedIn Newsletter (covered by apex-linkedin skill)
