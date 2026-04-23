# Wikidata entity template — ApexGEO

Ready-to-submit Wikidata template for `ApexGEO` (the SaaS platform at apexgeo.app). Submit at https://www.wikidata.org/wiki/Special:NewItem — no account is required beyond a standard Wikipedia login.

## Why this matters

Every major AI model (ChatGPT, Claude, Gemini, Perplexity, Grok) uses Wikidata as a structured-knowledge anchor for entity disambiguation. Today `"ApexGEO"` resolves to Apex Geoscience / Apex Geophysics / a generic geospatial consultancy in every engine we tested — because there is no Wikidata item for the real ApexGEO. Creating one flips the anchor in roughly 1–7 days for Perplexity/Gemini and 2–4 weeks for ChatGPT/Claude.

This is the single highest-leverage disambiguation fix and costs zero dollars.

---

## Entity: ApexGEO

### Labels

| Language | Label |
|----------|-------|
| English (en) | ApexGEO |
| Afrikaans (af) | ApexGEO |

### Description (en)

> Software-as-a-service platform for Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO), tracking brand visibility across AI search engines

### Aliases (en)

- Apex GEO
- Apex
- ApexGEO Platform
- apexgeo.app

---

## Statements

Submit each as a claim. References use the official website as the primary source — add Crunchbase / LinkedIn as additional references once those profiles exist.

| Property | Value | Notes |
|----------|-------|-------|
| **instance of** (P31) | [Q1371074] software as a service | Primary type |
| **instance of** (P31) | [Q131093] business | Secondary |
| **industry** (P452) | [Q118093823] AI search optimization | If missing, fall back to [Q46857] search engine optimization |
| **official website** (P856) | `https://apexgeo.app` | |
| **inception** (P571) | 2026 | |
| **founded by** (P112) | Hein van Vuuren | May need to create a separate Person item if one doesn't exist |
| **country of origin** (P495) | [Q258] South Africa | |
| **headquarters location** (P159) | [Q5465] Cape Town | |
| **logo image** (P154) | Upload `/apex-linkedin-logo-400x400.png` via Wikimedia Commons first | |
| **official name** (P1448) | ApexGEO (en) | |
| **different from** (P1889) | Apex Geoscience | Critical — disambiguates against the geophysical firm |
| **different from** (P1889) | Apex Geophysics | Critical |
| **social media followers** (P8687) | N/A yet | Add once meaningful |

### External identifiers (populate these as the accounts go live)

| Property | Value |
|----------|-------|
| **LinkedIn company ID** (P4264) | `apexgeo` |
| **X (Twitter) username** (P2002) | `apexgeoapp` |
| **Crunchbase organization ID** (P2088) | TBD |
| **GitHub username** (P2037) | `Heinvv10` (founder / org) |

---

## Founder sub-item (create separately if not already present)

### Entity: Hein van Vuuren (founder)

| Property | Value |
|----------|-------|
| **instance of** (P31) | [Q5] human |
| **occupation** (P106) | [Q15982795] software entrepreneur |
| **country of citizenship** (P27) | [Q258] South Africa |
| **employer** (P108) | ApexGEO (the item you just created) |
| **LinkedIn personal profile ID** (P6634) | `hein-van-vuuren` |
| **notable work** (P800) | ApexGEO, FibreFlow, WA Monitor |

---

## Submission checklist

1. Sign in at https://www.wikidata.org with a Wikipedia account.
2. Special:NewItem → paste the label, description, aliases above.
3. Add statements one at a time, attaching at least one reference per claim (official website is acceptable for most).
4. Critical: the two `different from` (P1889) statements pointing at Apex Geoscience and Apex Geophysics — these explicitly tell Wikidata (and downstream LLM training pipelines) that ApexGEO is a distinct entity.
5. Add the founder item, then link it back via `founded by` (P112) on the ApexGEO item.
6. Once approved, request indexing by pinging https://dumps.wikimedia.org/wikidatawiki/ — but it's usually picked up within 24 hours without any action.

## Post-submission verification

After 48 hours, re-run the Apex monitor against "What is ApexGEO known for?" on Perplexity first (it cites Wikidata most eagerly), then Gemini. Expect the "geoscience consulting" answer to drop out within 7 days as the new Wikidata item propagates through the RAG indices.
