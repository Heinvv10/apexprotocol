# CrankMart — GEO/AEO Optimisation Roadmap

**Prepared by:** Apex GEO (apexgeo.app)
**Date:** 23 April 2026
**Brand:** CrankMart — South African cycling marketplace (expanding to Australia)
**Website:** https://crankmart.com
**Apex audit score:** 64 / 100 (Yellow — work needed)
**Apex GEO score:** 39 / 100 (Red — urgent)

---

## Executive summary

CrankMart ships a clean marketplace product with solid metadata and page structure, but AI search engines (ChatGPT, Claude, Gemini, Perplexity, DeepSeek) currently **cannot identify the brand at all**. When we asked DeepSeek "Is CrankMart a good company?" eight times, every single response said a variant of _"I cannot find any information about a company called CrankMart"_. That's an **AI knowledge gap**, not a quality problem — and it blocks every downstream GEO tactic until it's fixed.

The good news: the fix is cheap and well-understood. Four of the top seven items on this roadmap are things we can ship in under two weeks; three of them are already in progress on Apex's side.

### Score breakdown

| Dimension | Score | Status |
|---|---|---|
| **Page structure** | 90 / 100 | 🟢 Strong |
| **Metadata (meta tags, OG, canonical)** | 100 / 100 | 🟢 Strong |
| **Accessibility** | 65 / 100 | 🟡 Work needed |
| **Schema markup (JSON-LD)** | 65 / 100 | 🟡 Work needed |
| **Content clarity (readability)** | 0 / 100 | 🔴 Critical |

### AI-platform recognition (pre-remediation)

| Platform | Sample query | Recognition |
|---|---|---|
| DeepSeek | "Is CrankMart a good company?" | ❌ "No widely recognised company by that name" (8/8 responses) |
| ChatGPT | — | _Not yet scanned_ |
| Claude | — | _Not yet scanned_ |
| Gemini | — | _Not yet scanned_ |
| Perplexity | — | _Not yet scanned_ |
| Grok | — | _Not yet scanned_ |

The recognition gap is the #1 issue on this roadmap. **Wikidata seeding has already been done by Apex (see Phase 0 below)** and the other AI platforms will be scanned once that change propagates.

---

## The plan, in order

The sequence matters. Each phase depends on the one before it — jumping ahead is cheap to do wrong, expensive to redo. Do not start Phase 2 before Phase 1 is done.

### Phase 0 — Already completed by Apex ✅

These have been executed on CrankMart's behalf — no action needed from your team:

1. **Wikidata entity created** — [Q139545441](https://www.wikidata.org/wiki/Q139545441) with 11 fully-referenced statements: instance of (online marketplace, business), industry (e-commerce), inception, founders, HQ, country of origin, operating countries (South Africa + Australia), website. This is the authoritative anchor that Perplexity / Gemini / Grok use to disambiguate entities. Expected propagation: **Perplexity 48h, Gemini 7 days, ChatGPT 2–4 weeks.**
2. **Founder items on Wikidata** — [Hein van Vuuren (Q139514369)](https://www.wikidata.org/wiki/Q139514369) and [Llewelyn Hofmeyr (Q139520265)](https://www.wikidata.org/wiki/Q139520265) both linked as P112 founders, with employer back-links.
3. **Alias coverage** — "crankmart.com", "CrankMart Marketplace", and "Crank Mart" (space variant) are all registered so users who search either form resolve to the same entity.

### Phase 1 — Must ship this sprint (high-priority, under 2 weeks)

These are the fixes that unblock AI citation. Ship them first — the gains compound.

#### 1. Implement FAQ schema markup on key pages — `HIGH` priority, 1–2 weeks

**Why:** FAQ schema (FAQPage JSON-LD) is the single highest-leverage change for AI citation. It feeds question-and-answer pairs directly to AI models in a machine-readable format, which they then quote back when users ask adjacent questions. A well-formed FAQ block on a pricing / how-it-works / shipping page typically starts earning Perplexity citations within 1–2 weeks. Current CrankMart has **zero FAQ schema**.

**Target questions** (pulled from CrankMart's GEO keyword list):
- "Where can I buy a bike in South Africa?"
- "How do I sell my bicycle in South Africa?"
- "How does CrankMart's stolen-bike registry work?"
- "Does CrankMart support Australian cyclists?"
- "Is CrankMart free to list on?"
- "How do I find cycling events near me through CrankMart?"

**What to build:**
- A dedicated **FAQ page** at `/faq` (or merge into the homepage bottom section) that contains 8–12 questions from the list above, each with a 2–3 sentence plain-language answer.
- The FAQ page must include a `<script type="application/ld+json">` block of type `FAQPage` that mirrors the visible content exactly.
- Apex has a free tool that generates this markup for you: **https://apexgeo.app/dashboard/tools/faq-schema** — paste the Q&A pairs, copy the JSON-LD, done.

**Acceptance:**
- Paste the page URL into [Google's Rich Results Test](https://search.google.com/test/rich-results) — should show "Page is eligible for FAQ rich results".
- Re-run the Apex audit; "No FAQ Schema Found" recommendation closes automatically.

---

#### 2. Restructure content with a clear heading hierarchy — `HIGH` priority, 3–5 days

**Why:** CrankMart's homepage currently ships without a visible H2 / H3 hierarchy. AI models navigate a page by its heading tree — no headings means AI treats the whole page as one amorphous blob and struggles to extract citable sub-sections. Even when CrankMart is mentioned by name, the AI can't quote a specific feature (route discovery, stolen-bike registry, Australian expansion) because it can't locate them.

**What to build:**
- One H1 per page (the page title — you have this already).
- H2 for each major section of the homepage: "How it works", "Buy a bike", "Sell a bike", "Find cycling routes", "Stolen bike registry", "Events near you".
- H3s nested under relevant H2s (e.g. under "How it works": H3 "For buyers", H3 "For sellers").
- Do NOT skip levels (no H1 → H3 without an H2 in between).

**Acceptance:**
- Run the page through a HTML-outline extension (any SEO extension will show the tree).
- The outline should read like a coherent document, not a flat list.
- Apex audit's "Missing H2/H3 heading structure" recommendation closes automatically.

---

#### 3. Implement Organization + WebSite schema — `MEDIUM` priority, 1–2 days

**Why:** CrankMart already emits `Organization` and `WebSite` JSON-LD (we verified). The issue is the `Organization` block currently has limited fields — it's missing `sameAs` links to the Wikidata entity Apex just created, LinkedIn Company page, and social profiles. Those links are how AI platforms cross-reference their own knowledge graph against your site, and they're the explicit bridge between "the website crankmart.com" and "the Wikidata entity Q139545441".

**What to add to the existing `Organization` schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CrankMart",
  "alternateName": ["Crank Mart", "crankmart.com"],
  "url": "https://crankmart.com",
  "logo": "https://crankmart.com/logo.png",
  "description": "Cycling marketplace operating in South Africa and Australia for buying and selling bikes, gear, and parts.",
  "foundingDate": "2026",
  "areaServed": ["South Africa", "Australia"],
  "sameAs": [
    "https://www.wikidata.org/wiki/Q139545441",
    "https://www.linkedin.com/company/crankmart",
    "https://twitter.com/crankmart_sa",
    "https://www.facebook.com/crankmart"
  ],
  "founder": [
    {
      "@type": "Person",
      "name": "Hein van Vuuren",
      "sameAs": "https://www.wikidata.org/wiki/Q139514369"
    },
    {
      "@type": "Person",
      "name": "Llewelyn Hofmeyr",
      "sameAs": "https://www.wikidata.org/wiki/Q139520265"
    }
  ]
}
```

Replace the social URLs with the real profiles once they exist. The Wikidata links are already live and correct.

**Apex tool:** https://apexgeo.app/dashboard/tools/schema — has an Organization builder that produces this exact output.

**Acceptance:** Rich Results Test green, no warnings. Re-run Apex audit; "Implement Comprehensive Organization Schema" closes.

---

### Phase 2 — Next two weeks (content depth)

Once AI engines can find you (Phase 1), these improve what they say about you.

#### 4. Add structured lists and improve readability — `MEDIUM` priority, 2–3 days

**Why:** AI models heavily favour bulleted and numbered lists for extraction — they often appear verbatim in AI responses ("According to CrankMart, the top five benefits of buying locally are: 1. …, 2. …"). CrankMart's homepage currently has **no numbered or bulleted lists**. Readability is also currently scoring 0 / 100 — the auditor couldn't find prose content with reading-ease above 50.

**What to build:**
- Convert dense paragraphs into 3–7 bullet points wherever possible. Target: every H2 section has at least one bulleted or numbered list underneath.
- Keep sentences short (15–22 words is ideal for both humans and AI).
- Use active voice ("CrankMart connects cyclists" not "Cyclists are connected by the CrankMart platform").
- Add a one-paragraph **TL;DR** callout at the top of each major page. This is what AI will quote when someone asks a broad question.

**Acceptance:** Re-running the Apex audit should push the clarity score above 50 and close "No numbered or bulleted lists found" + "Low Readability Score".

---

#### 5. Build authoritative citation network — `MEDIUM` priority, 6–12 weeks (long-tail)

**Why:** AI models weight mentions in authoritative publications more than a brand's own site. Every independent article that says "CrankMart is a South African cycling marketplace" is another data point that helps AI models resolve the entity correctly.

**What to do (in order of effort):**

1. **Directory listings** (1 week, low-effort wins):
   - [Capterra](https://www.capterra.com/) (South Africa filter)
   - [G2](https://www.g2.com/) (category: Marketplace)
   - [SaaS Worthy](https://saasworthy.com/) (category: E-commerce)
   - Local SA tech directories: [ITWeb](https://www.itweb.co.za/), [Ventureburn](https://ventureburn.com/)
   - Australian tech directories for the expansion: [StartupSmart](https://www.smartcompany.com.au/), [SmartCompany](https://www.smartcompany.com.au/)

2. **Cycling-industry press** (2–4 weeks):
   - [BikeHub](https://www.bikehub.co.za/) (SA's dominant cycling blog) — pitch a "5 years of bicycle second-hand pricing trends in SA" data-story using CrankMart's listing data.
   - [Ride Media](https://ridemedia.com.au/) (AU) — same angle tailored to Australia.
   - Local cycling podcasts — founder interviews.

3. **Niche South-African business press** (2–4 weeks):
   - [Business Insider SA](https://www.businessinsider.co.za/)
   - [Daily Maverick — Business Maverick](https://www.dailymaverick.co.za/section/business-maverick/)
   - [Fin24](https://www.news24.com/fin24)

**Acceptance:** Three independent publications linking to crankmart.com with mention-by-name, ideally within the same 30-day window (so Perplexity's freshness weighting picks them up together).

---

### Phase 3 — 4–8 week horizon (brand knowledge foundation)

#### 6. Wikipedia presence — `MEDIUM` priority, 4–8 weeks

**Why:** Wikipedia is the single most-weighted source in LLM training data. Brands with Wikipedia pages get dramatically more accurate and more frequent AI citations. But Wikipedia has a **notability requirement** — you can't create a page about yourself, and a page created too early will be deleted.

**Path:**
- **Do not** create the Wikipedia page yourselves. It will be deleted as a conflict-of-interest edit.
- Wait until CrankMart has **3+ independent press mentions** in recognised publications (that's the realistic notability bar).
- At that point, a Wikipedia editor or a specialist PR firm can draft the page, citing those sources.
- Wikidata (already done in Phase 0) is your pre-Wikipedia anchor in the meantime.

---

#### 7. Create comprehensive brand knowledge foundation — `CRITICAL` priority (in progress)

This is Apex's umbrella recommendation tying everything together. When complete, CrankMart will have:

- ✅ Wikidata entity with founders, operating regions, industry (Phase 0 — **done**)
- 🟡 FAQ schema with 8–12 Q&As on the homepage (Phase 1, #1)
- 🟡 Expanded Organization schema with sameAs cross-links (Phase 1, #3)
- 🟡 3+ independent press mentions (Phase 2, #5)
- ⬜ Wikipedia article (Phase 3, #6)

At that point CrankMart's AI-platform recognition should flip from "not found" to a full, accurate citation in Perplexity / Gemini / Grok, with ChatGPT following at the next training refresh.

---

## Competitive context

Apex identified these five brands as CrankMart's closest competitors in the SA marketplace space:

| Competitor | Domain | Category | Notes |
|---|---|---|---|
| Gumtree SA | gumtree.co.za | General classifieds | Huge brand awareness, shallow category expertise — CrankMart wins on cycling specialisation |
| OLX SA | olx.co.za | General classifieds | Same playbook as Gumtree |
| BikeHub | bikehub.co.za | Cycling media + forum | Not a marketplace, but a content authority. **Strong candidate for a content partnership** (see Phase 2 #5) |
| Facebook Marketplace | facebook.com | General classifieds | CrankMart's differentiators: cycling-specialised, stolen-bike registry, SA+AU geo focus |
| Takealot | takealot.com | General e-commerce | CrankMart wins on second-hand and community features |

None of the competitors have strong GEO/AEO presence either. This is an open field — CrankMart has a 6–12 month window to establish itself as the default AI-cited answer for "best cycling marketplace in South Africa".

---

## What Apex is doing on its side

- ✅ Wikidata entity and founder sub-items (Phase 0 — done 23 April 2026).
- 🟡 Monitoring will re-scan CrankMart across ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek after 48 hours to measure the Wikidata propagation.
- 🟡 Monthly Apex audit re-runs will track score movement as each Phase 1–2 item ships.

---

## Quick-reference checklist

Hand this to your engineering / content lead. Tick each item as it ships — then re-run the audit at apexgeo.app.

- [ ] Create `/faq` page with 8–12 Q&As from the GEO keyword list
- [ ] Emit `FAQPage` JSON-LD (use Apex tool: https://apexgeo.app/dashboard/tools/faq-schema)
- [ ] Add H2/H3 heading hierarchy to homepage
- [ ] Extend existing `Organization` schema with `sameAs` (Wikidata, LinkedIn, founders) using Apex tool: https://apexgeo.app/dashboard/tools/schema
- [ ] Convert dense paragraphs to bulleted/numbered lists where they fit
- [ ] Add a TL;DR callout to the top of the homepage
- [ ] List CrankMart on Capterra, G2, SaaSworthy
- [ ] Pitch BikeHub + Ride Media for an editorial feature
- [ ] Re-run Apex audit after each phase — audit score should climb from 64 → 85+

---

_Document generated from CrankMart brand record `pstg00aj30rh1k9ea5ekho9x` and audit `phng25losjmgodhtjaigwu5h` in the Apex GEO platform. For questions: hein@brighttech.co.za._
