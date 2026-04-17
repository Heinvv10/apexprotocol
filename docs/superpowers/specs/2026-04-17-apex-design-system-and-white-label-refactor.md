# Apex Design System Consolidation + White-Label Refactor

**Date**: 2026-04-17
**Author**: Hein + Claude (Opus 4.7)
**Status**: Draft — awaiting user review
**Scope**: All 126 pages, full refactor, 7 phases across multiple sessions

---

## 1. Problem statement

The Apex platform has two parallel design systems that never consolidated:

1. **APEX v3/v4** (`docs/APEX_DESIGN_SYSTEM.md`): cyan `#00E5CC` + purple `#8B5CF6` on deep-space navy `#0a0f1a`. Implemented as HSL CSS variables in `src/app/globals.css` (3541 lines).
2. **White-label preset** (`docs/WHITE_LABEL_ARCHITECTURE.md`): electric purple-blue `#4926FA` on neutral dark `#0A0A0B`. Exists as plan-only but has leaked into 27 hardcoded occurrences.

Consequences observed across the audit (Phase 0):

| Metric | Value | Target |
|---|---|---|
| Unique hex colors in `src/` | 130 | ≤ 30 |
| Raw hex `#00e5cc` hits | 219 | 0 (use `hsl(var(--primary))`) |
| Tailwind arbitrary `[#00E5CC]` | 51 | 0 |
| Inline `style={{}}` instances | 148 | ≤ 20 (only for dynamic values) |
| `.bak` files in `src/` | 10 | 0 |
| Files using CSS vars | 42 | ~All component files |
| Light theme colors match dark theme | No | Yes (a coherent pair) |

## 2. Goals

1. **Single source of truth** — one spec doc + one token file tree = every value.
2. **Zero hardcoded brand values** in components — all through `var(--*)`.
3. **White-label in ≤ 1 hour** — change ~20 env vars + drop in 1 preset file = rebranded.
4. **Uniform 126 pages** — every page passes Iron Man MCP critique against registered design system.
5. **Dark ↔ light pair that actually pairs** — same semantic tokens, swapped values only.

## 3. Non-goals

- Visual redesign. We're consolidating and tokenising what exists, not reinventing it.
- Component library migration (staying on Shadcn/ui + Radix).
- Light theme polish beyond making it coherent with dark.

---

## 4. Architecture

### 4.1 Token file tree

Replaces the current monolithic `src/app/globals.css` (3541 lines) with modular tokens:

```
src/styles/
├── tokens/
│   ├── _reset.css          # Tailwind import + base resets
│   ├── colors.css          # Palette: primitive + semantic + AI-platform
│   ├── typography.css      # Font families, scale, weights
│   ├── spacing.css         # 4px-based scale
│   ├── radii.css           # Border-radius tokens
│   ├── motion.css          # Duration + easing
│   ├── elevation.css       # Shadows, glows
│   ├── focus.css           # Focus-ring system (already solid, just moved)
│   └── index.css           # @imports all of the above
├── themes/
│   ├── _shared.css         # Tokens that don't change between themes
│   ├── dark.css            # :root — dark theme values
│   ├── light.css           # .light — light theme values (paired to dark)
│   └── brand/
│       ├── apex.css        # Default brand: cyan + purple
│       └── _template.css   # Copy this to add a new brand
└── components/
    ├── cards.css           # .card-primary/.secondary/.tertiary
    ├── badges.css          # Status/impact/citation badges
    ├── buttons.css          # Button variants (if any custom)
    └── layouts.css          # Page header, decorative elements
```

`src/app/globals.css` becomes a ~5-line file that imports `src/styles/index.css`.

### 4.2 Layered CSS-variable system (3 layers)

```
Layer 1 — Primitive tokens (brand-specific, never referenced by components)
  --palette-cyan-500: 170 100% 45%
  --palette-purple-500: 262 83% 66%
  --palette-neutral-900: 225 40% 6%
  ...

Layer 2 — Semantic tokens (components reference these; theme-swappable)
  --color-primary: var(--palette-cyan-500)
  --color-surface: var(--palette-neutral-900)
  --color-foreground: var(--palette-neutral-50)
  ...

Layer 3 — Component tokens (optional, for reusable component behaviours)
  --card-primary-border: var(--color-primary) / 0.25
  --card-primary-glow: var(--color-primary) / 0.08
  ...
```

Why three layers: white-label re-skinning touches only Layer 1 (one file: `brand/<name>.css`). Themes (dark/light) touch only Layer 2. Components never change.

### 4.3 White-label loading

Brand is selected at build time via `NEXT_PUBLIC_BRAND_PRESET`:

```ts
// src/config/brand-presets.ts
export const BRAND_PRESETS = {
  apex:      { css: 'apex.css',      name: 'Apex',      tagline: '...' },
  aurora:    { css: 'aurora.css',    name: 'Aurora',    tagline: '...' },
  // add more here — that's the entire code change needed
} as const;
```

`src/app/layout.tsx` imports `/styles/themes/brand/<preset>.css` based on env. For runtime switching in Phase 7, we lift this to React context + dynamic `<link>`.

### 4.4 Component consumption rule

Three enforced rules (Stylelint + ESLint):

1. **In `src/components/**` and `src/app/**/*.tsx`**: raw hex (`#...`), `rgb()`, `hsl()` literals, and Tailwind arbitrary `[#...]` are banned. Use semantic tokens only: `hsl(var(--color-*))` or Tailwind utilities that map to them (e.g. `bg-primary`, `text-muted-foreground`).
2. **In `src/styles/components/**.css`**: may reference Layer 2 semantic tokens (`var(--color-*)`) and Layer 3 component tokens, but NOT Layer 1 primitives (`var(--palette-*)`).
3. **Primitive tokens (`var(--palette-*)`) live only in `src/styles/themes/brand/*.css`.** They must never appear in `src/components/**`, `src/app/**`, or `src/styles/{tokens,components}/**`.

Rules are added in Phase 6 as a ratchet: existing violations are baselined, new ones fail CI.

### 4.5 Enforcement in Iron Man MCP

Register Apex tokens via `mcp__ironman-creative__register_design_system`. Every page audit screenshot is scored against these tokens via `critique_component_screenshot` on 8 dimensions. Drift is a tracked metric.

**Registered design system ID**: `ds-1776422240467-dn9siw` (registered 2026-04-17). Use this in all batch critiques.

---

## 5. Iron Man MCP audit methodology (Phases 2–5)

For every page:

1. Playwright navigates to the route.
2. Wait for network idle + a consistent sentinel (e.g. a known heading visible).
3. Full-page screenshot saved to `docs/audit/screenshots/<phase>/<slug>.png`.
4. Interactive-state screenshots: open each modal, hover each dropdown, screenshot.
5. `critique_component_screenshot` with `asset_id = <slug>` and the Apex design system.
6. Findings appended to `docs/audit/findings/<phase>.md` with severity + fix proposal.

Batching: end of each phase → `batch_critique_components` over all asset IDs for comparative metrics.

Success criterion: every page scores ≥ 7/10 on every dimension (colors, typography, spacing, hierarchy, alignment, contrast, whitespace, consistency).

---

## 6. Phase plan

| Phase | Goal | Output | Est. sessions |
|---|---|---|---|
| 0 | Foundation audit | This doc + `docs/audit/phase-0-inventory.md` | 1 (today) |
| 1 | Build token/theme architecture | `src/styles/**`, refactored `globals.css`, tests green | 1 |
| 2 | Audit 18 public + auth pages | `docs/audit/phase-2-findings.md` + screenshots | 1 |
| 3 | Audit 20 core dashboard pages | Same | 1–2 |
| 4 | Audit 30 secondary dashboard | Same | 2 |
| 5 | Audit 58 admin + marketing | Same | 2–3 |
| 6 | Refactor — replace hardcoded with tokens | Per-phase PRs, lint ratchet | 2–3 |
| 7 | Theme switcher + brand preset system | Runtime switcher, 2 extra presets, white-label runbook | 1 |

Total: **11–14 sessions** realistically. Each session produces committed code + a written findings file — no work is lost between sessions.

---

## 7. Phase 1 detail: token architecture (what ships next)

### Files to create

- `src/styles/tokens/{colors,typography,spacing,radii,motion,elevation,focus}.css`
- `src/styles/tokens/index.css`
- `src/styles/themes/{dark,light,_shared}.css`
- `src/styles/themes/brand/apex.css`
- `src/styles/themes/brand/_template.css`
- `src/styles/components/{cards,badges,buttons,layouts}.css`
- `src/config/brand-presets.ts`

### Files to modify

- `src/app/globals.css` → shrinks to ~5 lines (imports `src/styles/index.css`)
- `src/app/layout.tsx` → loads brand preset CSS based on env
- `.env.example` → add `NEXT_PUBLIC_BRAND_PRESET` and related vars
- `package.json` → add scripts `brand:add`, `audit:screenshot`

### Files to delete

- 10 `.bak` files (already dead)
- `docs/archive/UI_DESIGN_SYSTEM.md` (superseded)
- `docs/APEX_LIGHT_THEME_GUIDE.md` (consolidated here)
- `src/app/globals-light.css` (merged into `themes/light.css`)

### Testing

- Before/after screenshots on 5 representative pages (landing, dashboard, monitor, create, settings). Must render pixel-equivalent — no visual regression allowed.
- `npx tsc --noEmit` passes.
- `npx vitest run` passes.
- A playwright e2e spec navigates those 5 pages and validates no console errors.

### Rollback plan

Git revert the Phase 1 commit. `globals.css` restored from the previous commit.

---

## 8. Phase 7 detail: theme switcher + white-label runtime

### Features

1. **Theme switcher** — dropdown in user menu: Dark / Light / System. Persists in `localStorage`. Applies via `class="dark"` or `class="light"` on `<html>`.
2. **Brand preset runtime loader** — for multi-tenant: on org load, fetches `brand_preset` from Clerk org metadata, dynamically swaps `<link rel="stylesheet">` to the correct `brand/<name>.css`.
3. **Preview mode** — `?brand=aurora` URL param switches the preset in-page for demo/QA without org changes.

### White-label runbook (goal: ≤ 1 hour setup)

1. Copy `src/styles/themes/brand/_template.css` → `brand/<newbrand>.css`.
2. Update ~20 primitive CSS variables (palette colors, font families, radius).
3. Add entry to `src/config/brand-presets.ts` (3 lines).
4. Drop brand assets in `public/brands/<newbrand>/` (logo.svg, logo-dark.svg, favicon.ico).
5. Set env: `NEXT_PUBLIC_BRAND_PRESET=<newbrand>` + brand name + tagline + URL.
6. `bun run build && bun start` — rebranded.

No component edits. No rebuild per-tenant if using runtime loader.

---

## 9. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Visual regression during Phase 1 token migration | Pixel-diff screenshots on 5 representative pages before merging |
| Component library (Shadcn) assumes specific CSS var names | Keep the existing names where Shadcn references them; add new names alongside, not replace |
| `.bak` files may be someone's in-progress work | Ask Hein before deleting; investigate with `git log --follow <file>` first |
| Iron Man MCP scoring is subjective | Use scores for relative comparison (page-to-page within Apex), not absolute targets |
| Light theme has never worked properly | Phase 1 treats light as a first-class citizen with paired tokens; QA flag it for Phase 2+ specifically |
| Refactor touches 250+ files | Per-phase PRs, never a big-bang merge. Lint ratchet prevents regression. |

---

## 10. Success criteria

Session-level (this engagement completes when):

1. `src/styles/**` exists as described; `globals.css` is ≤ 10 lines.
2. Zero `#hex` or `[#hex]` literals in `src/components/**` and `src/app/**/*.tsx` (except inside `src/styles/**`).
3. Iron Man MCP registers Apex design system; every audited page scores ≥ 7/10.
4. `NEXT_PUBLIC_BRAND_PRESET=<other>` produces a fully rebranded app, verified with screenshot diff.
5. Dark ↔ light toggle works on all 126 pages without visual breakage.
6. Added `aurora` and one other example brand preset.
7. Lint ratchet prevents new hardcoded hex values.
8. `docs/audit/findings/` has a file per phase with every finding + fix.

---

## 11. What ships this session (Phase 0 completion)

- [x] This spec document
- [x] `docs/audit/phase-0-inventory.md` (hardcoded-value scan, top-offender files, unique-colors list)
- [x] `docs/audit/screenshots/00-sign-in.png` (first screenshot + browser connectivity verified)
- [x] Apex design system registered in Iron Man MCP
- [x] All 10 phase tasks created and tracked
- [ ] User review gate on this spec → next session starts Phase 1

---

*End of spec. Next: user review; then invoke writing-plans skill for Phase 1 implementation plan.*
