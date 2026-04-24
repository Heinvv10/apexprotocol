# PRD: apex-wikidata Skill

**Status:** Draft
**Owner:** Apex GEO
**Created:** 2026-04-23
**Priority:** P2

---

## 1. Purpose & GEO/AEO Leverage

Wikidata is the **foundational entity layer for every major AI engine**. ChatGPT, Claude, Gemini, and Perplexity all rely on Wikidata (directly or via Wikipedia) for:
- Disambiguating brand names
- Resolving entity relationships (founders, parent companies, products)
- Pulling structured facts that get presented as authoritative

A brand without a Wikidata entity is **invisible to AI engines as a discrete concept** — the engine has no anchor to attach mentions to. This skill industrialises the brand-entity creation process Apex already started (see commit `30c0f62 feat(disambiguation): /what-is-apexgeo landing + Wikidata entity template`).

This skill **extends the existing `wikidata-item` skill** rather than replacing it — that one handles single-entity creation via Playwright; this one orchestrates the full lifecycle for Apex's brand portfolio.

## 2. Target Brands

| Brand | Wikidata status | Action |
|---|---|---|
| Apex GEO | Q-item template exists (commit 30c0f62) | Complete + reference |
| BrightTech | Not created | Create + link to Apex parent |
| Jarvis Specter | Persona — handle carefully | Create as fictional/persona entity |
| BrightSphere Technologies | Not created | Create as agency entity |
| Apex clients | Per contract | Create on request, white-label disclosure |

## 3. Trigger Phrases

- "create a Wikidata entity for <brand>"
- "add Wikidata reference to <Q-item>"
- "check Wikidata coverage for <brand>"
- "what's the Q-id for <brand>"
- "audit our Wikidata footprint"
- "add <statement> to <Q-item>"

## 4. Inputs

- **Brand profile:** name, founding date, founders, HQ, parent/subsidiary, products, website
- **Source documents:** press releases, registered company docs, news coverage (for references)
- **Existing Q-items:** check duplicates before creating
- **Disambiguation context:** is this brand likely to be confused with another entity?

## 5. Workflow

1. **Discovery** — search Wikidata for existing entity; check Wikipedia for related articles
2. **Reference gathering** — collect 3+ independent verifiable sources before any statement
3. **Entity creation** — via existing `wikidata-item` skill (Playwright-based)
4. **Statement population** — instance of, country, founder, official website, logo, social handles
5. **Cross-linking** — link to parent/subsidiary entities, link from Wikipedia drafts (when notable enough)
6. **Reference attachment** — every statement gets at least one reference (Wikidata core requirement)
7. **Monitor** — track edits to brand entities; alert on vandalism or notability challenges

## 6. Guardrails

- **Notability is real** — Wikidata accepts more than Wikipedia, but persistent paid-PR-style entities still get deleted. Only create entities for brands with genuine public footprint.
- **No COI violations** — disclose paid-editing relationship per Wikimedia Terms of Use when editing client entities
- **References are mandatory** — every statement must have a verifiable source; never cite the brand's own website as the only source for a factual claim
- **No promotional language** — Wikidata is structured data, not copy. The skill should reject any "leading", "innovative", "premier" framing
- **Don't fight reverts** — if a Wikidata editor reverts a change, queue for human review, never auto-revert
- **Disambiguation first** — if the brand name conflicts with a notable existing entity, create a properly disambiguated label (e.g., "Apex (GEO platform)")

## 7. Success Metrics

| Metric | Target (90 days) |
|---|---|
| Apex portfolio brands with Wikidata entities | 5+ |
| Statements per entity | 15+ avg |
| References per statement | 1.5+ avg |
| Entities surviving 30 days without deletion challenge | 100% |
| AI engines correctly disambiguating "Apex" → Apex GEO | measurable via apex-monitor |

## 8. Integration Points

- **Existing `wikidata-item` skill** — primary execution layer (Playwright)
- **`/what-is-apexgeo` landing page** — canonical reference target for the Apex Q-item
- **Brand profile data** — `brands` table provides structured input
- **Apex monitor** — track AI engine disambiguation accuracy as feedback loop
- **Wikidata Query Service (SPARQL)** — for coverage audits across portfolio

## 9. Open Questions

- Do we publish a public statement about Apex's paid Wikidata editing on the brand page (transparency play)?
- For client work, do we create entities under the client's name or our shared service account?
- Should we also pursue Wikipedia article creation for Apex (much higher bar — risks deletion if rushed)?

## 10. Out of Scope (v1)

- Wikipedia article creation (separate skill, much higher notability bar)
- Wikimedia Commons asset uploads (could be v2)
- Wikidata Lexeme creation (linguistics — not relevant)
- Other open knowledge graphs (Crunchbase, etc.) — separate skills if needed
