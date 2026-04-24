# PRD: apex-youtube Skill

**Status:** Draft
**Owner:** Apex GEO
**Created:** 2026-04-23
**Priority:** P2

---

## 1. Purpose & GEO/AEO Leverage

YouTube is heavily surfaced by **Perplexity, Gemini, and Google AI Overviews**, particularly for:
- "How to" / tutorial queries
- Product demos and comparisons
- Case study walkthroughs

Apex has a uniquely strong YouTube angle: **screen-recorded before/after audit demos** (e.g., the BrightTech 62→93 PSI lift) are visceral proof that no competitor can fake. Each video is a citable artifact AI engines can point to.

## 2. Target Brands

| Brand | Content type |
|---|---|
| Apex GEO | Audit walkthroughs, GEO/AEO explainers, platform demos |
| BrightTech | Performance fix case studies (live PSI lifts) |
| Jarvis Specter / BrightSphere | Agency methodology, client transformations |
| Clients | Custom video assets per contract (white-label channel possible) |

## 3. Trigger Phrases

- "create a YouTube video script for <topic>"
- "draft chapters and description for <video file>"
- "generate YouTube SEO for <brand>"
- "what should we make a video about this week"
- "transcribe and chapter <video URL>" (chains to existing `video` skill)

## 4. Inputs

- **Source material:** audit data, screen recording, blog post, case study, customer interview
- **Video metadata:** title, description, tags, chapters, thumbnail concept
- **Channel context:** which brand channel, target persona, related videos
- **Format:** short (<60s), standard (3–10min), long-form (10–30min), live demo

## 5. Workflow

1. **Ideate** — pull from audit findings, BrightTech demos, client wins; rank by AI-citation potential (how-to queries score higher)
2. **Script** — hook in first 8s, structured chapters, explicit entity naming for AI parsing
3. **Visual plan** — screen recording shot list, b-roll needs, thumbnail concept
4. **Production handoff** — script + shot list to recording (manual or future agent)
5. **Post-production metadata:**
   - SEO-optimized title (AI engines + YouTube algorithm)
   - Description with timestamps + transcript + canonical link to apexgeo.app
   - Tags + category
   - Pinned comment with key resources
6. **Publish + cross-promote** — chain to apex-x-twitter and apex-linkedin skills for distribution

## 6. Guardrails

- **No clickbait titles** — title must accurately describe content (Apex's reputation is on the line)
- **Disclose sponsorships** — YouTube `paid_promotion` flag set when applicable
- **No fabricated case studies** — every demo must be real; if anonymized, say so
- **Captions required** — auto-generated then manually corrected (accessibility + AI parsing)
- **Music licensing** — only YouTube Audio Library or licensed tracks
- **Per project memory `feedback_no_fabricated_metrics`** — every PSI/score number must come from a real audit run

## 7. Success Metrics

| Metric | Target (90 days) |
|---|---|
| Videos cited by Perplexity/Gemini for GEO queries | 3+ |
| Total channel watch time | 500+ hours |
| Subscribers (Apex channel) | 300+ |
| Avg view duration | >40% |
| Click-through to apexgeo.app from descriptions | 5+ per video |
| Videos appearing in Google AI Overviews | 1+ |

## 8. Integration Points

- **Existing `video` skill** — for transcription, frame extraction, clip cutting
- **Audit module** — auto-suggest video topics from high-traffic audit findings
- **Brand assets** — channel art, intro/outro stings stored in `brand_assets` table
- **YouTube Data API** — upload, metadata management, analytics pull
- **Apex monitor** — feed YouTube AI-citation data back into ranking algorithm

## 9. Open Questions

- One Apex GEO channel covering all brands, or separate channels per brand (BrightTech, Jarvis Specter)?
- Do we invest in YouTube Shorts as a separate workflow, or only as repurposed clips?
- Live streaming (audit-in-real-time format) — v1 or later?

## 10. Out of Scope (v1)

- Live streaming infrastructure
- YouTube Premium / Memberships setup
- Full video editing automation (script + metadata only; humans cut)
- YouTube Ads management
