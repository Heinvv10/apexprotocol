# Phase 0 Inventory — Design System Audit

**Date**: 2026-04-17
**Scope**: All of `src/`
**Method**: Static grep for hardcoded values; no browser inspection yet.

---

## Summary

| Metric | Value |
|---|---|
| Pages (`page.tsx` files) | 126 |
| Dashboard sub-modules | 24 |
| `globals.css` size | 3541 lines |
| Unique hex colors in `src/` | **130** (target: ≤ 30) |
| Raw hex literals in tsx/ts | ~1500+ (sum of top 30) |
| Tailwind arbitrary `[#hex]` usage | 350+ instances |
| Inline `style={{}}` instances | 148 |
| `.bak` files in `src/` | 10 |
| Files using `var(--*)` | 42 |
| `.card-primary/.secondary/.tertiary` usage | 1050 (good) |

---

## Top hardcoded colors (raw hex, codebase-wide)

| Rank | Color | Hex | Raw count | Arbitrary `[#]` | Purpose | Token that should replace it |
|---|---|---|---|---|---|---|
| 1 | Apex primary | `#00e5cc` | 219 | 51 | Primary brand | `hsl(var(--color-primary))` |
| 2 | Purple accent | `#8b5cf6` | 113 | 12 | Secondary accent | `hsl(var(--color-accent-purple))` |
| 3 | Deep bg | `#0a0f1a` | 67 | 61 | Page background | `hsl(var(--color-surface-deep))` |
| 4 | Card bg | `#141930` | 61 | 50 | Card background | `hsl(var(--color-surface-card))` |
| 5 | Gemini | `#4285f4` | 36 | 7 | AI platform | `hsl(var(--ai-gemini))` |
| 6 | Error red | `#ef4444` | 35 | 0 | Semantic error | `hsl(var(--color-error))` |
| 7 | ChatGPT | `#10a37f` | 35 | 8 | AI platform | `hsl(var(--ai-chatgpt))` |
| 8 | Claude orange | `#d97757` | 32 | 6 | AI platform | `hsl(var(--ai-claude))` |
| 9 | Neutral `#27272a` | 31 | 20 | Grey neutral | Not in token set — audit usage |
| 10 | Perplexity | `#20b8cd` | 31 | 2 | AI platform | `hsl(var(--ai-perplexity))` |
| 11 | White | `#ffffff`/`#fff` | 28 + 21 | 0 | Various | `hsl(var(--color-foreground))` |
| 12 | White-label purple | `#4926fa` | 27 | 0 | **Drift from `WHITE_LABEL_ARCHITECTURE.md`** — should not be in code |
| 13 | Success green | `#22c55e` | 27 | 1 | Semantic success | `hsl(var(--color-success))` |
| 14 | Warning amber | `#f59e0b` | 26 | 1 | Semantic warning | `hsl(var(--color-warning))` |
| 15 | Slate-400 | `#64748b` | 25 | 0 | Muted text | `hsl(var(--color-muted))` |
| 16 | Neutral `#18181b` | 25 | 12 | Grey neutral | Not in token set — audit |
| 17 | Blue info | `#3b82f6` | 24 | 0 | Info state | `hsl(var(--color-info))` |
| 18 | Twitter brand | `#1da1f2` | 24 | 16 | Social icon | `hsl(var(--social-twitter))` |
| 19 | bg-base | `#0d1224` | 24 | 12 | Main content bg | `hsl(var(--color-surface-base))` |
| 20 | Slate-300 | `#94a3b8` | 22 | 0 | Secondary text | `hsl(var(--color-text-secondary))` |
| 21 | Red raw | `#ff0000` | 16 | 12 | Should not exist | Replace with `--color-error` |

**Observation 1**: Colors 1–4 (core brand) account for ~400 raw occurrences + ~200 arbitrary = **600 replacements** in the refactor. Mechanical — can be done with a codemod.

**Observation 2**: `#4926fa` (27 occurrences) is a zombie from the white-label plan. Must be eliminated.

**Observation 3**: `#ff0000` (16 occurrences) and grey neutrals `#27272a`, `#18181b`, `#6b7280` indicate ad-hoc color choices that bypass the semantic system.

---

## Hardcoded-style hotspots (files with most pain)

### By raw hex count (top 12 excluding `.bak`)

| Hex count | File | Note |
|---|---|---|
| 172 | `src/app/globals.css` | Source of truth — stays, gets modularized |
| 65 | `src/app/api/docs/route.ts` | API doc HTML — low priority |
| 40 | `src/app/dashboard/brands/page.tsx` | Brands list — priority Phase 4 |
| 33 | `src/app/admin/audit-logs/page.tsx` | Admin — priority Phase 5 |
| 31 | `src/app/globals-light.css` | Merge into `themes/light.css` |
| 29 | `src/components/brands/brand-detail-view.tsx` | Priority — component |
| 28 | `src/app/api/marketing/templates/[id]/route.ts` | Email template HTML — OK as-is |
| 25 | `src/app/admin/api-keys/page.tsx` | Admin |
| 21 | `src/components/brands/completion-wizard.tsx` | Priority — component |
| 19 | `src/components/providers/clerk-provider.tsx` | Auth theming — careful |
| 19 | `src/components/dashboard/geo-score-trend.tsx` | Chart colors |
| 17 | `src/components/ui/apex-logo.tsx` | Brand asset — keep logo hex |

### By inline `style={{}}` count (top 10)

| Count | File | Note |
|---|---|---|
| 72 | `src/components/brands/scrape-wizard.tsx` | Severe — rewrite recommended |
| 64 | `src/app/report/[brandId]/[period]/page.tsx` | Report page — likely PDF-target |
| 49 | `src/components/brands/brand-detail-view.tsx` | Rewrite candidate |
| 41 | `src/app/dashboard/brands/page.tsx` | High priority |
| 41 | `src/components/brands/completion-wizard.tsx` | High priority |
| 12 | `src/app/dashboard/page.tsx` | Main dashboard — highest visibility |
| 12 | `src/app/dashboard-light-demo/page.tsx` | Demo — maybe delete |

---

## `.bak` files (candidates for deletion)

All dead; not imported; verified by `grep -r "importing filename" src/`:

```
src/app/api/onboarding/complete/route.ts.bak
src/app/api/monitor/run/browser-query-handler.ts.bak
src/app/api/realtime/route.ts.bak
src/components/brands/completion-wizard.tsx.bak
src/lib/db/schema/browser-sessions.ts.bak
src/lib/monitoring/integrations/perplexity-browser.ts.bak
src/lib/redis.ts.bak
src/lib/browser-query/types.ts.bak
src/lib/browser-query/base-browser-query.ts.bak
src/lib/queue/workers/audit-worker.ts.bak
```

Action: `git rm` all in Phase 1.

---

## Design-system drift evidence

Two coexisting systems in docs + code:

1. **APEX v3/v4** (`docs/APEX_DESIGN_SYSTEM.md`, `globals.css` `:root`):
   - Primary: `#00E5CC` (cyan, HSL `170 100% 45%`)
   - Accent: `#8B5CF6` (purple)
   - Bg: `#0a0f1a` (deep space navy)

2. **White-label default** (`docs/WHITE_LABEL_ARCHITECTURE.md`):
   - Primary: `#4926FA` (electric purple-blue)
   - Bg: `#0A0A0B` (neutral dark)

Evidence of leak: 27 occurrences of `#4926fa` in components, plus `#0a0a0b` variants.

**Decision**: APEX v4 is the canonical brand. `WHITE_LABEL_ARCHITECTURE.md` colors become an example preset (`aurora.css`), not a source of truth.

---

## Light theme coherence

`globals-light.css` + `.light` block in `globals.css`:

- Light primary `180 100% 35%` vs dark primary `170 100% 45%` — different *hue*, not just brightness. Intentional or drift?
- Light success/warning/error: undefined (fall back to dark values). Contrast broken on white bg.
- `--focus-ring-destructive-opacity`: dark 0.4, light 0.2 — same hue but different a11y math. OK.
- `--focus-bg-menu`: dark `232 40% 15%` (dark blue), light `235 20% 95%` (near-white). OK — paired.

**Conclusion**: Light theme is *partially* paired. Phase 1 must fully pair semantic tokens. Phase 2+ audit will catch specific pages that are broken in light mode.

---

## Iron Man MCP integration

- No design systems registered yet (confirmed via `list_design_systems`).
- Plan: `register_design_system(name="Apex", tokens=<colors + fonts + spacing + radii from spec>)` in this phase.
- All page screenshots will use `asset_id = <phase>-<slug>` for traceability.
- Output: structured critique JSON per page → `docs/audit/findings/<phase>.md`.

---

## Critical port correction — Apex is on :4200 (NOT :3010)

The Phase 0 subagent for the baseline task misidentified port 3010 as Apex because `curl http://localhost:3010/` returned 200 with `X-Powered-By: Next.js`. This was **wrong**. Further investigation on 2026-04-17:

**Actual local port map on this host:**

| Port | Service | Notes |
|---|---|---|
| **4200** | **Apex** (production standalone build) | `<title>ApexGEO - AI Visibility Platform</title>` — serves from `/home/hein/apexgeo/.next/standalone/` via `next-server` process |
| 3000 | Unknown Next.js app (build-version `7777a254b`) | Not Apex |
| 3001 | Redirects to `/dashboard` (unknown Next.js app) | Not Apex |
| 3010 | **Dokploy** self-hosted deploy platform | Title "Dokploy"; itself built on Next.js so `X-Powered-By: Next.js` misled the scan. Returns 400 for arbitrary paths like `/sign-in`. |
| 3200 | ISAFlow (BrightTech accounting) | Not Apex |

**Key facts for Phase 2 browser audit:**
1. Audit URL base: `http://localhost:4200` — not 3010.
2. `/sign-in` returns 200 on 4200; `/dashboard` returns 404 (route is auth-gated or lives elsewhere); `/pricing` returns 404 (no such route in the repo).
3. The running :4200 build is the PRE-Phase-1 production standalone (built ~2026-04-16 from the master branch). It does NOT include the `feature/phase-1-token-architecture` changes.
4. `package.json` declares `"dev": "next dev --port 3010"` — that port is held by Dokploy. When running a dev server for Phase 1 verification, use `--port 3011` (or another free port) and start from `/home/hein/Workspace/ApexGEO/`.
5. The earlier Playwright screenshot `00-sign-in.png` that showed a Dokploy 400 page — it went to the wrong port. The screenshot is kept as evidence of the mistake, not as Apex state.

## Remaining Phase 2 setup tasks

1. Confirm Playwright/chrome-devtools can reach `http://localhost:4200` cleanly.
2. Figure out how an authenticated Clerk session is established for dashboard routes — Playwright `storageState` file, or a local-dev bypass.
3. Decide whether Phase 2 audit screenshots reflect pre-Phase-1 state (the live :4200) or post-Phase-1 (build + deploy our feature branch first). Recommendation: audit pre-Phase-1 first to establish baseline findings, re-run after Phase 1 merge to verify visual equivalence.

---

## Next actions (Phase 1)

1. Create `src/styles/` tree per spec section 4.1.
2. Split `globals.css` into modular token files.
3. Define Layer 1 primitives (palette), Layer 2 semantic, Layer 3 component.
4. Merge `globals-light.css` into `themes/light.css` with paired tokens.
5. Register Apex design system in Iron Man MCP.
6. Delete 10 `.bak` files.
7. Add lint rule (warning-only initially) banning raw hex in `src/components/**` and `src/app/**/*.tsx`.
8. Visual-regression baseline: 5 representative pages screenshotted pre-refactor.

---

*Phase 0 complete. This document + the design spec unblock Phase 1.*
