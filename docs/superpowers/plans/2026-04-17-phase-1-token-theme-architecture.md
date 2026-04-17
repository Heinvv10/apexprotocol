# Phase 1: Token/Theme Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3541-line monolithic `src/app/globals.css` with a modular, 3-layer CSS-variable system (`src/styles/{tokens,themes,components}/**`) that enables white-label rebranding via a single brand-preset file and supports a paired dark/light theme.

**Architecture:** Three layers of CSS variables — **Layer 1 primitives** (brand-scoped palette, lives only in `themes/brand/*.css`), **Layer 2 semantic** (theme-aware, lives in `themes/{dark,light}.css`), **Layer 3 component** (component-scoped, lives in `styles/components/*.css`). A single `src/styles/index.css` composes everything. Components and app code consume only Layer 2 semantic tokens (`hsl(var(--color-*))` or mapped Tailwind utilities).

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v4 (with `@theme inline`), TypeScript strict, Vitest, Playwright, CSS custom properties with HSL format.

**Related spec:** `docs/superpowers/specs/2026-04-17-apex-design-system-and-white-label-refactor.md`
**Related inventory:** `docs/audit/phase-0-inventory.md`

---

## Naming conventions (read before starting)

Tailwind v4's `@theme inline` block maps utility names (`bg-primary`, `text-muted-foreground`) to CSS custom properties. To keep existing Tailwind utilities working AND enable explicit semantic references in CSS, the theme layer defines **both** forms:

- **Unprefixed legacy names** (`--primary`, `--foreground`, `--card`, `--success`, etc.) — referenced by Tailwind `@theme inline` as `--color-primary: var(--primary)`. Components using `bg-primary` utility keep working. Never remove these.
- **`--color-*` prefixed explicit names** (`--color-primary`, `--color-surface-deep`, etc.) — for components that reference tokens directly in CSS (`hsl(var(--color-primary))`). These are the preferred form for new code.

Both resolve to the same primitive via dual mapping: `--primary: var(--palette-cyan-500)` AND `--color-primary: var(--palette-cyan-500)`. Yes, this is mildly redundant; the tradeoff is zero breakage for existing Shadcn/Tailwind components + explicit semantic references for new code.

---

## File Structure

### Files to create (new)

```
src/styles/
├── index.css                   # Single entry point — imports everything in correct cascade order
├── tokens/
│   ├── index.css               # @imports typography, spacing, radii, motion, elevation, focus
│   ├── typography.css          # --font-sans, --font-mono, type-scale tokens
│   ├── spacing.css             # --space-1 through --space-16
│   ├── radii.css               # --radius, --radius-sm/md/lg/xl
│   ├── motion.css              # --ease-*, --duration-*
│   ├── elevation.css           # --shadow-*, --glow-*
│   └── focus.css               # Focus-ring system (moved from globals.css)
├── themes/
│   ├── _shared.css             # Tokens that never change between themes (AI platform colors, chart colors, etc.)
│   ├── dark.css                # :root — dark theme Layer 2 mappings
│   ├── light.css               # .light — light theme Layer 2 mappings (paired to dark)
│   └── brand/
│       ├── apex.css            # Default brand: Layer 1 primitives (cyan + purple palette)
│       └── _template.css       # Commented template for adding new brands
└── components/
    ├── cards.css               # .card-primary/.secondary/.tertiary + variants
    ├── badges.css              # Status/impact/citation badges
    ├── layouts.css             # .dashboard-bg, page-header helpers
    ├── glassmorphism.css       # .glass-modal/.glass-card/.glass-tooltip
    └── third-party.css         # Clerk, Radix dropdown/select overrides

src/config/
└── brand-presets.ts            # { apex: {...}, aurora: {...} } + active-preset resolver

src/__tests__/styles/
└── tokens.test.ts              # Vitest: parse each CSS file, assert expected --var names exist
```

### Files to modify

- `src/app/globals.css` — shrinks from 3541 to ~10 lines (imports `src/styles/index.css`, keeps Tailwind directive + `@theme inline` block)
- `src/app/layout.tsx` — add `data-brand={preset}` attribute on `<html>` for future runtime switch
- `.env.example` — add `NEXT_PUBLIC_BRAND_PRESET`, `NEXT_PUBLIC_BRAND_NAME`, logo vars
- `package.json` — add `scripts.styles:verify` (runs the token resolution test)

### Files to delete

```
src/app/globals-light.css                                  # merged into themes/light.css
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

---

## Pre-flight

### Task 0: Pre-flight verification

**Files:**
- Read: `package.json`, `tsconfig.json`, `vitest.config.ts`

- [ ] **Step 1: Verify working tree is clean**

Run: `git status -s`
Expected: empty output (or only `logs/` untracked — ignore).
If dirty: stash or commit other work first. Do not proceed with a dirty tree.

- [ ] **Step 2: Record baseline — type check passes**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.
If failing: fix or baseline before starting Phase 1.

- [ ] **Step 3: Record baseline — unit tests pass**

Run: `npx vitest run --reporter=dot 2>&1 | tail -20`
Expected: all tests pass (or record current failures as `docs/audit/phase-1-baseline-test-failures.txt` so they're not mis-attributed to Phase 1).

- [ ] **Step 4: Record baseline — dev server starts clean**

Run: `bun run dev` (in one terminal, background), wait 10s, then in another terminal: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/`
Expected: `200`.
Kill dev server after check.

- [ ] **Step 5: Record baseline — CSS bundle size**

Run: `bun run build 2>&1 | tail -40`
Expected: build succeeds; note the First Load JS and CSS chunk sizes. Save to `docs/audit/phase-1-baseline-build.txt` for later comparison.

- [ ] **Step 6: Commit the baseline files**

```bash
git add docs/audit/phase-1-baseline-*.txt
git commit -m "chore: phase 1 baseline — tsc/vitest/build metrics before token refactor"
```

---

## Part A — Test infrastructure (TDD setup)

### Task 1: Add the tokens resolution test harness

**Files:**
- Create: `src/__tests__/styles/tokens.test.ts`
- Create: `scripts/parse-css-vars.ts` (tiny helper)

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/styles/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string): string => {
  const full = resolve(process.cwd(), p);
  if (!existsSync(full)) throw new Error(`Missing CSS file: ${p}`);
  return readFileSync(full, 'utf8');
};

const hasVar = (css: string, name: string): boolean =>
  new RegExp(`--${name}\\s*:`).test(css);

describe('styles/tokens — structural contract', () => {
  it('tokens/typography.css defines font + type-scale vars', () => {
    const css = read('src/styles/tokens/typography.css');
    expect(hasVar(css, 'font-sans')).toBe(true);
    expect(hasVar(css, 'font-mono')).toBe(true);
    expect(hasVar(css, 'text-display-xl')).toBe(true);
    expect(hasVar(css, 'text-body')).toBe(true);
  });

  it('tokens/spacing.css defines space-1 through space-16', () => {
    const css = read('src/styles/tokens/spacing.css');
    for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]) {
      expect(hasVar(css, `space-${n}`)).toBe(true);
    }
  });

  it('tokens/radii.css defines radius tokens', () => {
    const css = read('src/styles/tokens/radii.css');
    expect(hasVar(css, 'radius')).toBe(true);
  });

  it('tokens/motion.css defines duration + easing', () => {
    const css = read('src/styles/tokens/motion.css');
    expect(hasVar(css, 'duration-fast')).toBe(true);
    expect(hasVar(css, 'ease-default')).toBe(true);
  });

  it('tokens/focus.css defines focus-ring system', () => {
    const css = read('src/styles/tokens/focus.css');
    expect(hasVar(css, 'focus-ring-primary')).toBe(true);
    expect(hasVar(css, 'focus-ring-width-default')).toBe(true);
  });

  it('themes/brand/apex.css defines the Apex palette (Layer 1)', () => {
    const css = read('src/styles/themes/brand/apex.css');
    expect(hasVar(css, 'palette-cyan-500')).toBe(true);
    expect(hasVar(css, 'palette-purple-500')).toBe(true);
    expect(hasVar(css, 'palette-neutral-900')).toBe(true);
  });

  it('themes/dark.css maps semantic tokens to palette primitives', () => {
    const css = read('src/styles/themes/dark.css');
    expect(hasVar(css, 'color-primary')).toBe(true);
    expect(hasVar(css, 'color-surface-deep')).toBe(true);
    expect(hasVar(css, 'color-foreground')).toBe(true);
    // Semantic tokens reference primitives, not literal values:
    expect(/--color-primary\s*:\s*var\(--palette-/.test(css)).toBe(true);
  });

  it('themes/light.css pairs every semantic token from dark.css', () => {
    const dark = read('src/styles/themes/dark.css');
    const light = read('src/styles/themes/light.css');
    const semanticVars = Array.from(
      dark.matchAll(/--(color-[a-z0-9-]+)\s*:/g),
      (m) => m[1]
    );
    for (const v of semanticVars) {
      expect(hasVar(light, v)).toBe(true);
    }
  });

  it('components/cards.css defines the 3-tier card system', () => {
    const css = read('src/styles/components/cards.css');
    expect(/\.card-primary\b/.test(css)).toBe(true);
    expect(/\.card-secondary\b/.test(css)).toBe(true);
    expect(/\.card-tertiary\b/.test(css)).toBe(true);
  });

  it('styles/index.css imports tokens, themes, components in order', () => {
    const css = read('src/styles/index.css');
    const lines = css.split('\n');
    const tokensIdx = lines.findIndex((l) => l.includes('tokens/index.css'));
    const themesIdx = lines.findIndex((l) => l.includes('themes/dark.css'));
    const componentsIdx = lines.findIndex((l) => l.includes('components'));
    expect(tokensIdx).toBeGreaterThan(-1);
    expect(themesIdx).toBeGreaterThan(-1);
    expect(componentsIdx).toBeGreaterThan(-1);
    expect(tokensIdx).toBeLessThan(themesIdx);
    expect(themesIdx).toBeLessThan(componentsIdx);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts --reporter=verbose`
Expected: 9 tests fail with "Missing CSS file" errors (files don't exist yet).

- [ ] **Step 3: Commit the failing test harness**

```bash
git add src/__tests__/styles/tokens.test.ts
git commit -m "test: add CSS token resolution contract (failing)"
```

---

## Part B — Create the directory skeleton + Layer 1 primitives

### Task 2: Create `src/styles/` directory tree

**Files:**
- Create: directory structure

- [ ] **Step 1: Create all directories**

```bash
mkdir -p src/styles/tokens src/styles/themes/brand src/styles/components
```

- [ ] **Step 2: Verify structure**

Run: `find src/styles -type d | sort`
Expected:
```
src/styles
src/styles/components
src/styles/themes
src/styles/themes/brand
src/styles/tokens
```

- [ ] **Step 3: No commit yet — empty dirs are not tracked by git. Continue to next task.**

---

### Task 3: Extract Layer 1 primitive palette → `themes/brand/apex.css`

**Files:**
- Create: `src/styles/themes/brand/apex.css`
- Read: `src/app/globals.css:92-275` (the `:root` block — contains both primitives and semantic mixed together)

- [ ] **Step 1: Write `themes/brand/apex.css`**

Create `src/styles/themes/brand/apex.css`:

```css
/*
 * Apex — Default Brand Preset (Layer 1 primitives)
 *
 * THIS FILE DEFINES THE APEX BRAND PALETTE.
 *
 * To rebrand Apex as another tenant, copy this file to `brand/<name>.css`,
 * change the palette values below, and set `NEXT_PUBLIC_BRAND_PRESET=<name>`.
 *
 * ONLY Layer 1 primitives live here (--palette-*). Do NOT add semantic
 * tokens (--color-*) — those live in themes/{dark,light}.css and map to
 * these primitives.
 *
 * All values are in HSL-triplet form ("H S% L%") so they can be wrapped
 * with hsl() and / for opacity math: hsl(var(--palette-cyan-500) / 0.3).
 */

:root {
  /* ===== Brand palette — Cyan (primary) ===== */
  --palette-cyan-300: 170 100% 58%;
  --palette-cyan-400: 170 100% 50%;   /* #00FFE0 - hover/bright */
  --palette-cyan-500: 170 100% 45%;   /* #00E5CC - Apex primary */
  --palette-cyan-600: 170 70% 38%;    /* #00B8A3 - subdued */
  --palette-cyan-700: 170 70% 30%;

  /* ===== Brand palette — Purple (secondary accent) ===== */
  --palette-purple-300: 262 83% 80%;
  --palette-purple-400: 262 83% 74%;  /* #A78BFA */
  --palette-purple-500: 262 83% 66%;  /* #8B5CF6 */
  --palette-purple-600: 262 83% 46%;  /* #6D28D9 */

  /* ===== Brand palette — Pink (tertiary accent) ===== */
  --palette-pink-500: 330 81% 56%;    /* #EC4899 */

  /* ===== Brand palette — Blue (info/link) ===== */
  --palette-blue-400: 213 94% 68%;    /* #60A5FA - link */
  --palette-blue-500: 217 91% 60%;    /* #3B82F6 - info */

  /* ===== Brand palette — Neutrals (dark-side) ===== */
  --palette-neutral-950: 230 67% 2%;   /* #02030A - deepest */
  --palette-neutral-900: 225 40% 6%;   /* #0a0f1a - page bg (dark) */
  --palette-neutral-850: 227 50% 9%;   /* #0d1224 - main content (dark) */
  --palette-neutral-800: 228 40% 11%;  /* #111827 - elevated (dark) */
  --palette-neutral-750: 232 35% 12%;  /* #141930 - card (dark) */
  --palette-neutral-700: 232 30% 16%;  /* #1a2040 - card hover (dark) */
  --palette-neutral-650: 230 35% 10%;  /* #101828 - input (dark) */

  /* ===== Brand palette — Neutrals (light-side) ===== */
  --palette-neutral-50:  0 0% 98%;     /* #FAFAFA - page bg (light) */
  --palette-neutral-100: 220 20% 99%;  /* #FCFDFE - card (light) */
  --palette-neutral-150: 220 25% 96%;  /* #F3F5F8 - card hover (light) */
  --palette-neutral-200: 220 15% 97%;  /* #F8F9FB - elevated (light) */

  /* ===== Brand palette — Text (dark-side) ===== */
  --palette-text-primary-dark: 0 0% 100%;     /* #FFFFFF */
  --palette-text-secondary-dark: 215 16% 58%; /* #94A3B8 slate-400 */
  --palette-text-muted-dark: 215 16% 47%;     /* #64748B slate-500 */

  /* ===== Brand palette — Text (light-side) ===== */
  --palette-text-primary-light: 222 47% 11%;  /* #0F172A */
  --palette-text-secondary-light: 235 20% 40%;
  --palette-text-muted-light: 235 20% 55%;

  /* ===== Semantic primitives (brand-agnostic but brand-tunable) ===== */
  --palette-success: 142 71% 45%;    /* #22C55E */
  --palette-warning: 38 92% 50%;     /* #F59E0B */
  --palette-error: 0 84% 60%;        /* #EF4444 */
  --palette-info: 217 91% 60%;       /* #3B82F6 */
}
```

- [ ] **Step 2: Run the CSS test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "Apex palette" --reporter=verbose`
Expected: the "defines the Apex palette (Layer 1)" test passes. Other tests still fail.

- [ ] **Step 3: Commit**

```bash
git add src/styles/themes/brand/apex.css
git commit -m "feat(styles): extract Apex brand palette to Layer 1 primitives"
```

---

### Task 4: Create `themes/brand/_template.css` (for future white-label brands)

**Files:**
- Create: `src/styles/themes/brand/_template.css`

- [ ] **Step 1: Write the template**

Create `src/styles/themes/brand/_template.css`:

```css
/*
 * Brand Template — COPY THIS FILE TO ADD A NEW WHITE-LABEL BRAND
 *
 * Steps:
 *   1. cp src/styles/themes/brand/_template.css src/styles/themes/brand/<yourbrand>.css
 *   2. Replace every PALETTE VALUE below with your brand's values.
 *   3. Add your brand to src/config/brand-presets.ts.
 *   4. Drop logo/favicon into public/brands/<yourbrand>/.
 *   5. Set env: NEXT_PUBLIC_BRAND_PRESET=<yourbrand>
 *   6. bun run build && bun start → rebranded.
 *
 * RULES:
 *   - Only change Layer 1 primitives (--palette-*).
 *   - Never add semantic tokens (--color-*) here — those live in themes/{dark,light}.css.
 *   - Keep HSL-triplet format ("H S% L%") so opacity math works.
 *   - Keep the same variable names; the semantic layer references them by name.
 */

:root {
  /* Replace these with your brand palette: */
  --palette-cyan-300: 0 0% 0%;
  --palette-cyan-400: 0 0% 0%;
  --palette-cyan-500: 0 0% 0%;   /* Your brand primary */
  --palette-cyan-600: 0 0% 0%;
  --palette-cyan-700: 0 0% 0%;

  --palette-purple-300: 0 0% 0%;
  --palette-purple-400: 0 0% 0%;
  --palette-purple-500: 0 0% 0%;  /* Your brand accent */
  --palette-purple-600: 0 0% 0%;

  --palette-pink-500: 0 0% 0%;

  --palette-blue-400: 0 0% 0%;
  --palette-blue-500: 0 0% 0%;

  --palette-neutral-950: 0 0% 0%;
  --palette-neutral-900: 0 0% 0%;
  --palette-neutral-850: 0 0% 0%;
  --palette-neutral-800: 0 0% 0%;
  --palette-neutral-750: 0 0% 0%;
  --palette-neutral-700: 0 0% 0%;
  --palette-neutral-650: 0 0% 0%;

  --palette-neutral-50:  0 0% 100%;
  --palette-neutral-100: 0 0% 98%;
  --palette-neutral-150: 0 0% 94%;
  --palette-neutral-200: 0 0% 96%;

  --palette-text-primary-dark: 0 0% 100%;
  --palette-text-secondary-dark: 0 0% 70%;
  --palette-text-muted-dark: 0 0% 50%;
  --palette-text-primary-light: 0 0% 10%;
  --palette-text-secondary-light: 0 0% 40%;
  --palette-text-muted-light: 0 0% 55%;

  --palette-success: 142 71% 45%;
  --palette-warning: 38 92% 50%;
  --palette-error: 0 84% 60%;
  --palette-info: 217 91% 60%;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/themes/brand/_template.css
git commit -m "feat(styles): add _template.css for future white-label brands"
```

---

## Part C — Extract token files (Layer 2 + shared)

### Task 5: Extract typography tokens → `tokens/typography.css`

**Files:**
- Create: `src/styles/tokens/typography.css`
- Read: `src/app/globals.css:12-17` (font var wires), `src/app/globals.css:354-380` (base typography)
- Reference: `docs/APEX_DESIGN_SYSTEM.md` section "Typography"

- [ ] **Step 1: Write `tokens/typography.css`**

Create `src/styles/tokens/typography.css`:

```css
/*
 * Typography tokens — Layer 2 semantic (theme-agnostic; fonts don't change per light/dark).
 * Overridable by brand via Next.js font loader in src/app/layout.tsx.
 */

:root {
  /* Font families */
  --font-sans: var(--font-inter, 'Inter'), system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-geist-mono, 'JetBrains Mono'), 'Fira Code', monospace;
  --font-heading: var(--font-inter, 'Inter Display'), 'Inter', sans-serif;

  /* Type scale — sizes */
  --text-display-xl: 48px;
  --text-display: 36px;
  --text-h1: 24px;
  --text-h2: 20px;
  --text-h3: 16px;
  --text-body: 14px;
  --text-small: 12px;
  --text-tiny: 10px;

  /* Type scale — weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Type scale — line heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.65;

  /* Letter spacing */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
}
```

- [ ] **Step 2: Run the typography test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "typography" --reporter=verbose`
Expected: the "typography.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens/typography.css
git commit -m "feat(styles): extract typography tokens"
```

---

### Task 6: Extract spacing tokens → `tokens/spacing.css`

**Files:**
- Create: `src/styles/tokens/spacing.css`
- Read: `src/app/globals.css:227-237`

- [ ] **Step 1: Write `tokens/spacing.css`**

Create `src/styles/tokens/spacing.css`:

```css
/*
 * Spacing tokens — Layer 2 semantic (theme-agnostic; spacing doesn't change per brand).
 * Base unit: 4px. Use `var(--space-N)` everywhere; avoid raw px values.
 */

:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Layout */
  --layout-max-width: 1440px;
  --layout-page-padding-desktop: 32px;
  --layout-page-padding-mobile: 16px;
  --layout-card-gap-desktop: 24px;
  --layout-card-gap-mobile: 16px;
}
```

- [ ] **Step 2: Run the spacing test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "spacing" --reporter=verbose`
Expected: the "spacing.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens/spacing.css
git commit -m "feat(styles): extract spacing tokens"
```

---

### Task 7: Extract radii tokens → `tokens/radii.css`

**Files:**
- Create: `src/styles/tokens/radii.css`
- Read: `src/app/globals.css:80-84, 92-94`

- [ ] **Step 1: Write `tokens/radii.css`**

Create `src/styles/tokens/radii.css`:

```css
/*
 * Border-radius tokens — Layer 2 semantic. Brand-tunable via --radius override
 * in themes/brand/*.css if needed.
 */

:root {
  --radius: 0.75rem;              /* 12px — base */
  --radius-sm: calc(var(--radius) - 4px); /* 8px */
  --radius-md: calc(var(--radius) - 2px); /* 10px */
  --radius-lg: var(--radius);             /* 12px */
  --radius-xl: calc(var(--radius) + 4px); /* 16px */
  --radius-2xl: calc(var(--radius) + 8px);/* 20px */
  --radius-full: 9999px;
}
```

- [ ] **Step 2: Run the radii test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "radius" --reporter=verbose`
Expected: the "radii.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens/radii.css
git commit -m "feat(styles): extract border-radius tokens"
```

---

### Task 8: Extract motion tokens → `tokens/motion.css`

**Files:**
- Create: `src/styles/tokens/motion.css`
- Read: `src/app/globals.css:215-225`

- [ ] **Step 1: Write `tokens/motion.css`**

Create `src/styles/tokens/motion.css`:

```css
/*
 * Motion tokens — Layer 2 semantic. Brand-tunable.
 */

:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-gauge: 800ms;

  /* Easings */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-modal: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-gauge: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- [ ] **Step 2: Run the motion test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "motion" --reporter=verbose`
Expected: the "motion.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens/motion.css
git commit -m "feat(styles): extract motion tokens"
```

---

### Task 9: Extract elevation tokens → `tokens/elevation.css`

**Files:**
- Create: `src/styles/tokens/elevation.css`
- Read: scan `src/app/globals.css` for `box-shadow` patterns to consolidate

- [ ] **Step 1: Write `tokens/elevation.css`**

Create `src/styles/tokens/elevation.css`:

```css
/*
 * Elevation tokens — Layer 2 semantic. Theme-aware shadows + glows.
 * Shadows use pure black/primary rgba (not palette vars) because they overlay
 * arbitrary backgrounds and are brand-independent by design.
 */

:root {
  /* Soft shadows (used on cards, popovers) */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  /* Primary glow (cyan accent — references --color-primary via hsl()) */
  --glow-primary-sm: 0 0 12px hsl(var(--color-primary) / 0.15);
  --glow-primary-md: 0 0 30px hsl(var(--color-primary) / 0.08);
  --glow-primary-lg: 0 0 40px hsl(var(--color-primary) / 0.15);

  /* Card-specific composite elevations (shadow + glow for primary cards) */
  --elevation-card-primary: var(--glow-primary-md), 0 4px 24px rgba(0, 0, 0, 0.4);
  --elevation-card-secondary: 0 2px 12px rgba(0, 0, 0, 0.3);
  --elevation-modal: 0 0 40px hsl(var(--color-primary) / 0.08),
                     0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens/elevation.css
git commit -m "feat(styles): extract elevation + glow tokens"
```

---

### Task 10: Extract focus tokens → `tokens/focus.css`

**Files:**
- Create: `src/styles/tokens/focus.css`
- Read: `src/app/globals.css:239-275, 305-326` (existing focus system — copy verbatim)

- [ ] **Step 1: Write `tokens/focus.css`**

Create `src/styles/tokens/focus.css`:

```css
/*
 * Focus-ring tokens — Layer 2 semantic. Already well-structured in the
 * existing globals.css — extracted verbatim. Dark values in :root, light
 * overrides in .light (theme layer handles the swap).
 */

:root {
  /* Focus Ring Thickness */
  --focus-ring-width-default: 3px;
  --focus-ring-width-offset: 2px;
  --focus-ring-width-strong: 3px;

  /* Focus Ring Offset */
  --focus-ring-offset-default: 0px;
  --focus-ring-offset-gap: 2px;

  /* Focus Ring Colors — dark mode defaults (light overrides in themes/light.css) */
  --focus-ring-primary: var(--palette-cyan-500);
  --focus-ring-primary-opacity: 0.5;
  --focus-ring-input: var(--palette-cyan-500);
  --focus-ring-input-opacity: 0.3;
  --focus-ring-destructive: var(--palette-error);
  --focus-ring-destructive-opacity: 0.4;
  --focus-ring-offset-color: var(--palette-cyan-500);
  --focus-ring-offset-opacity: 1;

  /* Focus Border Colors */
  --focus-border-primary: var(--palette-cyan-500);
  --focus-border-input: var(--palette-cyan-500);
  --focus-border-destructive: var(--palette-error);

  /* Focus Background Colors (for menu items) */
  --focus-bg-menu: 232 40% 15%;
  --focus-bg-menu-foreground: 0 0% 100%;

  /* Focus Outline */
  --focus-outline-width: 1px;
  --focus-outline-color: var(--palette-cyan-500);
}
```

- [ ] **Step 2: Run the focus test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "focus" --reporter=verbose`
Expected: the "focus.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens/focus.css
git commit -m "feat(styles): extract focus-ring tokens"
```

---

### Task 11: Create `tokens/index.css` that composes all token files

**Files:**
- Create: `src/styles/tokens/index.css`

- [ ] **Step 1: Write the index**

Create `src/styles/tokens/index.css`:

```css
/* tokens/index.css — composes all Layer 2 semantic tokens (non-color). */
@import "./typography.css";
@import "./spacing.css";
@import "./radii.css";
@import "./motion.css";
@import "./elevation.css";
@import "./focus.css";
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens/index.css
git commit -m "feat(styles): add tokens/index.css aggregator"
```

---

## Part D — Theme layer (Layer 2 color mappings)

### Task 12: Create `themes/dark.css` — semantic color mappings for dark theme

**Files:**
- Create: `src/styles/themes/dark.css`
- Read: `src/app/globals.css:92-213` (extract ONLY the semantic color mappings, not primitives)

- [ ] **Step 1: Write `themes/dark.css`**

Create `src/styles/themes/dark.css`:

```css
/*
 * Dark theme — Layer 2 semantic color mappings.
 *
 * This file maps semantic tokens (--color-*) to Layer 1 primitives
 * (--palette-*). To swap themes, only these mappings change — never
 * the primitive palette.
 *
 * Consumers (components, app code) reference ONLY --color-* semantic
 * tokens. They do not reference --palette-* primitives directly.
 *
 * Applied by default on :root (the app is dark-first). The .light class
 * in themes/light.css overrides these with paired light values.
 */

:root {
  color-scheme: dark;

  /* Surfaces */
  --color-surface-deep:     var(--palette-neutral-900); /* page bg */
  --color-surface-base:     var(--palette-neutral-850); /* main content */
  --color-surface-elevated: var(--palette-neutral-800); /* elevated surfaces */
  --color-surface-card:     var(--palette-neutral-750); /* card bg */
  --color-surface-card-hover: var(--palette-neutral-700);
  --color-surface-input:    var(--palette-neutral-650);

  /* Brand */
  --color-primary:          var(--palette-cyan-500);
  --color-primary-bright:   var(--palette-cyan-400);
  --color-primary-muted:    var(--palette-cyan-600);
  --color-primary-foreground: var(--palette-neutral-950);

  --color-accent-purple:        var(--palette-purple-500);
  --color-accent-purple-light:  var(--palette-purple-400);
  --color-accent-purple-dark:   var(--palette-purple-600);
  --color-accent-pink:          var(--palette-pink-500);
  --color-accent-blue:          var(--palette-blue-500);

  /* Text */
  --color-foreground:        var(--palette-text-primary-dark);
  --color-text-primary:      var(--palette-text-primary-dark);
  --color-text-secondary:    var(--palette-text-secondary-dark);
  --color-text-muted:        var(--palette-text-muted-dark);
  --color-text-accent:       var(--palette-cyan-500);
  --color-text-link:         var(--palette-blue-400);
  --color-muted-foreground:  var(--palette-text-secondary-dark);

  /* Semantic */
  --color-success:  var(--palette-success);
  --color-warning:  var(--palette-warning);
  --color-error:    var(--palette-error);
  --color-info:     var(--palette-info);
  --color-destructive: var(--palette-error);

  /* Borders (rgba over foreground for opacity math) */
  --color-border-subtle:  255 255 255 / 0.05;
  --color-border-default: 255 255 255 / 0.08;
  --color-border-strong:  255 255 255 / 0.12;
  --color-border-accent:  var(--palette-cyan-500) / 0.3;
  --color-border-glow:    var(--palette-cyan-500) / 0.5;

  /* Shadcn/Tailwind compatibility (UNPREFIXED) — existing utilities depend on these */
  --background: var(--palette-neutral-900);
  --foreground: var(--palette-text-primary-dark);
  --card: var(--palette-neutral-750);
  --card-foreground: var(--palette-text-primary-dark);
  --popover: var(--palette-neutral-850);
  --popover-foreground: var(--palette-text-primary-dark);
  --primary: var(--palette-cyan-500);
  --primary-foreground: var(--palette-neutral-950);
  --secondary: 235 35% 18%;
  --secondary-foreground: var(--palette-text-primary-dark);
  --muted: 240 20% 15%;
  --muted-foreground: var(--palette-text-secondary-dark);
  --accent: 232 40% 15%;
  --accent-foreground: var(--palette-text-primary-dark);
  --destructive: var(--palette-error);
  --border: 0 0% 100% / 0.08;
  --input: var(--palette-neutral-650);
  --ring: var(--palette-cyan-500);
  --success: var(--palette-success);
  --success-muted: var(--palette-success) / 0.15;
  --warning: var(--palette-warning);
  --warning-muted: var(--palette-warning) / 0.15;
  --error: var(--palette-error);
  --error-muted: var(--palette-error) / 0.15;
  --info: var(--palette-info);
  --info-muted: var(--palette-info) / 0.15;

  /* Sidebar */
  --sidebar: 225 40% 7%;
  --sidebar-foreground: var(--palette-text-primary-dark);
  --sidebar-primary: var(--palette-cyan-500);
  --sidebar-primary-foreground: var(--palette-neutral-950);
  --sidebar-accent: 227 50% 12%;
  --sidebar-accent-foreground: var(--palette-text-primary-dark);
  --sidebar-border: 0 0% 100% / 0.08;
  --sidebar-ring: var(--palette-cyan-500);
}
```

- [ ] **Step 2: Run the dark theme test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "dark" --reporter=verbose`
Expected: the "dark.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/themes/dark.css
git commit -m "feat(styles): add dark theme semantic mappings"
```

---

### Task 13: Create `themes/light.css` — paired semantic mappings for light theme

**Files:**
- Create: `src/styles/themes/light.css`
- Read: `src/app/globals-light.css` (whole file — consolidate into paired form) and `src/app/globals.css:278-326` (.light block)

- [ ] **Step 1: Write `themes/light.css`**

Create `src/styles/themes/light.css`:

```css
/*
 * Light theme — Layer 2 semantic mappings, paired to dark.css.
 *
 * Every --color-* token defined in dark.css MUST have a paired value here,
 * otherwise the CSS contract test will fail.
 *
 * Applied via .light class on <html>.
 */

.light {
  color-scheme: light;

  /* Surfaces — inverted neutrals */
  --color-surface-deep:        var(--palette-neutral-50);
  --color-surface-base:        0 0% 100%;
  --color-surface-elevated:    var(--palette-neutral-200);
  --color-surface-card:        var(--palette-neutral-100);
  --color-surface-card-hover:  var(--palette-neutral-150);
  --color-surface-input:       var(--palette-neutral-200);

  /* Brand — darker cyan for better contrast on light backgrounds */
  --color-primary:          174 72% 38%;   /* #1BA890 */
  --color-primary-bright:   174 72% 45%;   /* #20C9A8 */
  --color-primary-muted:    174 50% 30%;   /* #0C7A65 */
  --color-primary-foreground: 0 0% 100%;

  --color-accent-purple:        var(--palette-purple-600);
  --color-accent-purple-light:  var(--palette-purple-500);
  --color-accent-purple-dark:   262 83% 36%;
  --color-accent-pink:          var(--palette-pink-500);
  --color-accent-blue:          217 91% 50%;

  /* Text */
  --color-foreground:       var(--palette-text-primary-light);
  --color-text-primary:     var(--palette-text-primary-light);
  --color-text-secondary:   var(--palette-text-secondary-light);
  --color-text-muted:       var(--palette-text-muted-light);
  --color-text-accent:      174 72% 38%;
  --color-text-link:        217 91% 50%;
  --color-muted-foreground: var(--palette-text-secondary-light);

  /* Semantic — darker for contrast */
  --color-success:  142 71% 35%;
  --color-warning:  38 92% 45%;
  --color-error:    0 72% 51%;
  --color-info:     217 91% 50%;
  --color-destructive: 0 72% 51%;

  /* Borders — darker for visibility on light */
  --color-border-subtle:  222 47% 11% / 0.05;
  --color-border-default: 222 47% 11% / 0.1;
  --color-border-strong:  222 47% 11% / 0.16;
  --color-border-accent:  174 72% 38% / 0.3;
  --color-border-glow:    174 72% 38% / 0.5;

  /* Shadcn/Tailwind compatibility (UNPREFIXED) — paired to dark.css */
  --background: var(--palette-neutral-50);
  --foreground: var(--palette-text-primary-light);
  --card: var(--palette-neutral-100);
  --card-foreground: var(--palette-text-primary-light);
  --popover: 0 0% 100%;
  --popover-foreground: var(--palette-text-primary-light);
  --primary: 174 72% 38%;
  --primary-foreground: 0 0% 100%;
  --secondary: 235 20% 95%;
  --secondary-foreground: var(--palette-text-primary-light);
  --muted: 235 20% 95%;
  --muted-foreground: 235 20% 40%;
  --accent: 235 20% 95%;
  --accent-foreground: var(--palette-text-primary-light);
  --destructive: 0 72% 51%;
  --border: 222 47% 11% / 0.1;
  --input: 222 47% 11% / 0.1;
  --ring: 174 72% 38%;
  --success: 142 71% 35%;
  --success-muted: 142 71% 35% / 0.12;
  --warning: 38 92% 45%;
  --warning-muted: 38 92% 45% / 0.12;
  --error: 0 72% 51%;
  --error-muted: 0 72% 51% / 0.12;
  --info: 217 91% 50%;
  --info-muted: 217 91% 50% / 0.12;

  /* Sidebar */
  --sidebar: 235 20% 98%;
  --sidebar-foreground: var(--palette-text-primary-light);
  --sidebar-primary: 174 72% 38%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 235 20% 95%;
  --sidebar-accent-foreground: var(--palette-text-primary-light);
  --sidebar-border: 222 47% 11% / 0.1;
  --sidebar-ring: 174 72% 38%;

  /* Focus ring light-mode overrides */
  --focus-ring-primary: 174 72% 38%;
  --focus-ring-input: 174 72% 38%;
  --focus-ring-destructive: 0 72% 51%;
  --focus-ring-destructive-opacity: 0.2;
  --focus-ring-offset-color: 174 72% 38%;
  --focus-border-primary: 174 72% 38%;
  --focus-border-input: 174 72% 38%;
  --focus-border-destructive: 0 72% 51%;
  --focus-bg-menu: 235 20% 95%;
  --focus-bg-menu-foreground: var(--palette-text-primary-light);
  --focus-outline-color: 174 72% 38%;
}
```

- [ ] **Step 2: Run the light pairing test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "pairs every" --reporter=verbose`
Expected: the "pairs every semantic token" test passes (proves light defines every color-* token that dark defines).

- [ ] **Step 3: Commit**

```bash
git add src/styles/themes/light.css
git commit -m "feat(styles): add light theme paired to dark"
```

---

### Task 14: Create `themes/_shared.css` — theme-invariant tokens

**Files:**
- Create: `src/styles/themes/_shared.css`
- Read: `src/app/globals.css:202-213` (AI platform colors, sentiment colors), `181-190` (chart colors)

- [ ] **Step 1: Write `themes/_shared.css`**

Create `src/styles/themes/_shared.css`:

```css
/*
 * Theme-invariant tokens — same in dark and light. Includes brand-partner
 * colors (AI platform brands) where the brand owner dictates the color,
 * and chart colors where visual series identity must not change per theme.
 */

:root {
  /* AI Platform Colors (brand-owner dictated; same in dark + light) */
  --ai-chatgpt:    160 84% 35%;    /* #10A37F */
  --ai-claude:     20 64% 59%;     /* #D97757 */
  --ai-gemini:     217 91% 60%;    /* #4285F4 */
  --ai-perplexity: 187 83% 47%;    /* #20B8CD */
  --ai-grok:       0 0% 100%;      /* #FFFFFF — appears on dark bg only */
  --ai-deepseek:   239 84% 67%;    /* #6366F1 */
  --ai-copilot:    207 100% 42%;   /* #0078D4 */

  /* Chart series — stable identity across themes */
  --chart-1: var(--palette-cyan-500);
  --chart-2: var(--palette-purple-500);
  --chart-3: var(--palette-success);
  --chart-4: var(--palette-blue-500);
  --chart-5: var(--palette-pink-500);

  /* Sentiment colors — align with semantic */
  --sentiment-positive: var(--palette-success);
  --sentiment-neutral:  var(--palette-text-secondary-dark);
  --sentiment-negative: var(--palette-error);

  /* Social brand colors (for social-media icons) */
  --social-twitter:   203 89% 53%;   /* #1DA1F2 */
  --social-linkedin:  204 100% 40%;  /* #0A66C2 */
  --social-facebook:  221 44% 41%;   /* #1877F2 */
  --social-instagram: 340 75% 53%;   /* #E4405F */
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/themes/_shared.css
git commit -m "feat(styles): extract theme-invariant AI/chart/social tokens"
```

---

## Part E — Component layer

### Task 15: Extract card components → `components/cards.css`

**Files:**
- Create: `src/styles/components/cards.css`
- Read: `src/app/globals.css:382-483` (card-primary, card-secondary, card-tertiary, variants)

- [ ] **Step 1: Write `components/cards.css`**

Create `src/styles/components/cards.css`:

```css
/*
 * 3-Tier card system — Apex canonical pattern.
 * Consumers: use .card-primary/.card-secondary/.card-tertiary in JSX,
 * NEVER reconstruct the styles inline.
 */

/* ============================================================
   Tier 1: Primary cards — hero metrics, main KPIs, GEO Score
   ============================================================ */
.card-primary {
  @apply relative rounded-2xl p-4;
  background: linear-gradient(
    135deg,
    hsl(var(--color-surface-base) / 0.9) 0%,
    hsl(var(--color-surface-deep) / 0.95) 100%
  );
  border: 1.5px solid hsl(var(--color-primary) / 0.25);
  box-shadow: var(--elevation-card-primary);
  overflow: hidden;
}

.card-primary::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--color-primary) / 0.5) 50%,
    transparent 100%
  );
}

.card-primary-gradient {
  @apply relative rounded-2xl p-4;
  background: linear-gradient(
    135deg,
    hsl(var(--color-surface-base) / 0.95) 0%,
    hsl(var(--color-surface-deep) / 0.98) 100%
  );
  overflow: hidden;
}

.card-primary-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    135deg,
    hsl(var(--color-primary) / 0.6) 0%,
    hsl(var(--color-accent-blue) / 0.4) 25%,
    hsl(var(--color-accent-purple) / 0.6) 50%,
    hsl(var(--color-accent-purple) / 0.4) 75%,
    hsl(var(--color-accent-purple) / 0.6) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.card-primary-gradient::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    hsl(var(--color-primary) / 0.1),
    hsl(var(--color-accent-purple) / 0.1)
  );
  filter: blur(16px);
  z-index: -1;
  pointer-events: none;
}

/* ============================================================
   Tier 2: Secondary cards — charts, recommendations, tables
   ============================================================ */
.card-secondary {
  @apply rounded-xl p-5;
  background: hsl(var(--color-surface-base) / 0.4);
  border: 1px solid hsl(var(--color-border-default));
  box-shadow: var(--elevation-card-secondary);
  transition: border-color var(--duration-fast) var(--ease-default);
}

.card-secondary:hover {
  border-color: hsl(var(--color-border-strong));
}

/* ============================================================
   Tier 3: Tertiary cards — list items, activity rows, stats
   ============================================================ */
.card-tertiary {
  @apply rounded-lg p-4;
  background: hsl(var(--color-surface-base) / 0.4);
  border: 1px solid hsl(var(--color-border-subtle));
  transition: border-color var(--duration-fast) var(--ease-default);
}

.card-tertiary:hover {
  border-color: hsl(var(--color-border-default));
}
```

- [ ] **Step 2: Run the cards test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "3-tier card" --reporter=verbose`
Expected: the "components/cards.css" test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/components/cards.css
git commit -m "feat(styles): extract 3-tier card system, reference tokens"
```

---

### Task 16: Extract glassmorphism → `components/glassmorphism.css`

**Files:**
- Create: `src/styles/components/glassmorphism.css`
- Read: `src/app/globals.css:485-516`

- [ ] **Step 1: Write `components/glassmorphism.css`**

Create `src/styles/components/glassmorphism.css`:

```css
/*
 * Glassmorphism — RESERVED for modals, tooltips, and floating overlays.
 * DO NOT apply to main content cards (use .card-primary/secondary/tertiary).
 */

.glass-modal {
  background: hsl(var(--color-surface-card));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--color-border-default) / 0.5);
  border-radius: var(--radius-xl);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 0 1px hsl(var(--color-border-default) / 0.1);
}

.glass-card {
  background: hsl(var(--color-surface-card) / 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--color-border-default) / 0.2);
}

.glass-tooltip {
  background: hsl(var(--color-surface-base) / 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid hsl(var(--color-border-default) / 0.3);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/components/glassmorphism.css
git commit -m "feat(styles): extract glassmorphism, reference tokens"
```

---

### Task 17: Extract third-party overrides → `components/third-party.css`

**Files:**
- Create: `src/styles/components/third-party.css`
- Read: `src/app/globals.css:518-627` (Radix dropdown/select/select, Clerk overrides)

- [ ] **Step 1: Write `components/third-party.css`**

Create `src/styles/components/third-party.css`:

```css
/*
 * Third-party component overrides — Clerk + Radix need !important to beat
 * their inline styles. Keep these in one place; never scatter.
 *
 * IMPORTANT: these must use semantic tokens — the Clerk overrides currently
 * in globals.css hardcode #4926FA (electric purple-blue from the abandoned
 * white-label plan) which is WRONG. This extraction fixes that drift.
 */

/* ============================================================
   Radix — Dropdown / Select / Popover
   ============================================================ */
[data-slot="dropdown-menu-content"],
[data-radix-popper-content-wrapper] [role="menu"],
[data-radix-popper-content-wrapper] [role="listbox"],
[data-radix-select-content] {
  background-color: hsl(var(--color-surface-base)) !important;
  color: hsl(var(--color-foreground)) !important;
  border: 1px solid hsl(var(--color-border-default) / 0.5) !important;
}

[data-radix-select-content] [role="option"] {
  color: hsl(var(--color-foreground)) !important;
}

[data-radix-select-content] [role="option"]:hover,
[data-radix-select-content] [role="option"][data-highlighted] {
  background-color: hsl(var(--color-primary) / 0.15) !important;
  color: hsl(var(--color-foreground)) !important;
}

[data-radix-select-content] [role="option"][data-state="checked"] {
  background-color: hsl(var(--color-primary) / 0.25) !important;
}

/* ============================================================
   Clerk — Modal + UserProfile + UserButton
   ============================================================ */
.cl-modalContent,
.cl-card,
.cl-userProfile-root,
.cl-profilePage,
.cl-navbar,
.cl-pageScrollBox,
.cl-scrollBox,
.cl-page,
.cl-userProfile__account,
.cl-profileSection__profile,
.cl-profileSectionContent,
.cl-accordionContent,
.cl-formContainer,
.cl-form,
[data-localization-key] {
  background-color: hsl(var(--color-surface-base)) !important;
  color: hsl(var(--color-foreground)) !important;
}

.cl-modalBackdrop {
  background-color: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px) !important;
}

.cl-userButtonPopoverCard,
.cl-userButtonPopoverMain,
.cl-userButtonPopoverFooter,
.cl-userButtonPopoverActions {
  background-color: hsl(var(--color-surface-base)) !important;
}

.cl-profileSection,
.cl-profileSectionHeader {
  border-color: hsl(var(--color-border-default) / 0.5) !important;
}

.cl-profileSectionTitle__profile,
.cl-profileSectionTitle__emailAddresses,
.cl-profileSectionTitle__connectedAccounts,
.cl-headerTitle,
.cl-profileSectionTitleText,
.cl-formFieldLabel,
.cl-identityPreviewText,
.cl-userPreviewMainIdentifier,
.cl-userPreviewSecondaryIdentifier,
.cl-internal-1e1g7t0 {
  color: hsl(var(--color-foreground)) !important;
}

.cl-profileSectionContent__profile,
.cl-profileSectionContent__emailAddresses,
.cl-profileSectionPrimaryButton,
.cl-formFieldAction {
  color: hsl(var(--color-primary)) !important;
}

.cl-navbarButton,
.cl-navbarButtonIcon {
  color: hsl(var(--color-text-muted)) !important;
}

.cl-navbarButton:hover,
.cl-navbarButton[data-active="true"] {
  background-color: hsl(var(--color-primary) / 0.1) !important;
  color: hsl(var(--color-primary)) !important;
}

.cl-formButtonPrimary {
  background-color: hsl(var(--color-primary)) !important;
  color: hsl(var(--color-primary-foreground)) !important;
}

.cl-formButtonPrimary:hover {
  background-color: hsl(var(--color-primary) / 0.9) !important;
}

.cl-avatarBox {
  border: 2px solid hsl(var(--color-primary) / 0.3) !important;
}

.cl-formFieldSuccessText {
  color: hsl(var(--color-success)) !important;
}

.cl-formFieldErrorText {
  color: hsl(var(--color-error)) !important;
}

.cl-formFieldHintText,
.cl-dividerText,
.cl-footerPages,
.cl-formFieldInputShowPasswordButton {
  color: hsl(var(--color-text-muted)) !important;
}

.cl-formFieldInputShowPasswordButton:hover {
  color: hsl(var(--color-text-secondary)) !important;
}

.cl-alert {
  background: hsl(var(--color-error) / 0.1) !important;
  border: 1px solid hsl(var(--color-error) / 0.3) !important;
  color: hsl(var(--color-error)) !important;
  border-radius: var(--radius-sm) !important;
}

.cl-internal-card,
.cl-internal-rootBox {
  background: transparent !important;
}

.cl-footer {
  opacity: 0.6;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/components/third-party.css
git commit -m "feat(styles): extract Clerk + Radix overrides, fix #4926FA drift"
```

---

### Task 18: Extract remaining component CSS from globals.css (badges, layouts, status)

**Files:**
- Create: `src/styles/components/badges.css`
- Create: `src/styles/components/layouts.css`
- Read: `src/app/globals.css:629-3541` — the remaining 2900 lines contain badges, status dots, decorative helpers, keyframes, etc.

- [ ] **Step 1: Inventory what's left in globals.css**

Run: `grep -nE '^[\.#@]' src/app/globals.css | head -100`
Take note of all remaining class definitions, keyframes, and @layer blocks.

- [ ] **Step 2: Split into badges.css and layouts.css**

Move each class to the file that matches its purpose:
- **badges.css**: anything matching `.badge-*`, `.status-*` (dots, pills), impact badges, citation badges
- **layouts.css**: `.dashboard-bg`, `.page-header-*`, `.decorative-star-*`, page wrappers
- Any `@keyframes` go to the component that consumes them
- `.light-theme` in `globals-light.css` is handled by Task 13 already — do NOT duplicate here

Write both files using only semantic tokens. **Any `#RRGGBB` encountered gets replaced** with the matching `hsl(var(--color-*))` — use this mapping:

| Hardcoded value | Replace with |
|---|---|
| `#00E5CC` / `#00e5cc` | `hsl(var(--color-primary))` |
| `#8B5CF6` / `#8b5cf6` | `hsl(var(--color-accent-purple))` |
| `#0a0f1a` / `#0A0F1A` | `hsl(var(--color-surface-deep))` |
| `#0d1224` / `#0D1224` | `hsl(var(--color-surface-base))` |
| `#141930` / `#141930` | `hsl(var(--color-surface-card))` |
| `#22C55E` / `#22c55e` | `hsl(var(--color-success))` |
| `#F59E0B` / `#f59e0b` | `hsl(var(--color-warning))` |
| `#EF4444` / `#ef4444` | `hsl(var(--color-error))` |
| `#FFFFFF` / `#ffffff` / `#fff` | `hsl(var(--color-foreground))` |
| `#94A3B8` | `hsl(var(--color-text-secondary))` |
| `#64748B` | `hsl(var(--color-text-muted))` |
| `#4926FA` (drift) | `hsl(var(--color-primary))` — REMOVE this value, not in Apex brand |
| `rgba(0, 229, 204, X)` | `hsl(var(--color-primary) / X)` |
| `rgba(139, 92, 246, X)` | `hsl(var(--color-accent-purple) / X)` |

- [ ] **Step 3: Verify the split**

Run: `wc -l src/styles/components/*.css`
Expected: no single file > 500 lines; total lines across components ~= (`wc -l src/app/globals.css` minus ~600 lines of tokens/themes already extracted).

- [ ] **Step 4: Commit**

```bash
git add src/styles/components/badges.css src/styles/components/layouts.css
git commit -m "feat(styles): extract badges + layouts, drop #4926FA drift"
```

---

## Part F — Compose and wire up

### Task 19: Create `src/styles/index.css` — master composition file

**Files:**
- Create: `src/styles/index.css`

- [ ] **Step 1: Write the master composition**

Create `src/styles/index.css`:

```css
/*
 * src/styles/index.css — single entry point for the Apex design system.
 *
 * Import order matters:
 *   1. Brand primitives (--palette-*) — Layer 1
 *   2. Tokens (font, spacing, etc.)   — Layer 2 (non-color)
 *   3. Theme mappings (dark base)     — Layer 2 (color)
 *   4. Theme invariants (AI, chart)
 *   5. Light theme override (.light)  — Layer 2 (color)
 *   6. Components
 *
 * The brand preset is selected at build time via NEXT_PUBLIC_BRAND_PRESET.
 * The brand loader lives in src/app/layout.tsx; only Apex is imported here
 * as the default. To use a different brand, change the import below AND
 * set NEXT_PUBLIC_BRAND_PRESET to the corresponding key in brand-presets.ts.
 */

/* 1. Brand primitives (Layer 1) */
@import "./themes/brand/apex.css";

/* 2. Non-color tokens */
@import "./tokens/index.css";

/* 3. Dark theme color mappings (:root) */
@import "./themes/dark.css";

/* 4. Theme-invariant tokens */
@import "./themes/_shared.css";

/* 5. Light theme (.light class) */
@import "./themes/light.css";

/* 6. Component classes */
@import "./components/cards.css";
@import "./components/glassmorphism.css";
@import "./components/third-party.css";
@import "./components/badges.css";
@import "./components/layouts.css";
```

- [ ] **Step 2: Run the composition test**

Run: `npx vitest run src/__tests__/styles/tokens.test.ts -t "imports tokens, themes" --reporter=verbose`
Expected: the index composition test passes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(styles): add index.css master composition"
```

---

### Task 20: Shrink `src/app/globals.css` to the minimal shim

**Files:**
- Modify: `src/app/globals.css` (was 3541 lines → becomes ~20 lines)

- [ ] **Step 1: Replace the file contents**

Overwrite `src/app/globals.css` with:

```css
/*
 * src/app/globals.css — minimal Next.js entry for the Apex design system.
 * All tokens, themes, and component CSS live in src/styles/**.
 *
 * Do not add styles here. Add them to:
 *   - src/styles/tokens/*         — non-color tokens
 *   - src/styles/themes/dark.css  — dark theme semantic mappings
 *   - src/styles/themes/light.css — light theme semantic mappings (paired)
 *   - src/styles/themes/brand/*   — Layer 1 palette (brand-specific)
 *   - src/styles/components/*     — component classes
 */

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* Load the Apex design system (composed from src/styles/**) */
@import "../styles/index.css";

/* Tailwind v4 inline theme — references the CSS vars defined in styles/. */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { color-scheme: dark; }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: var(--font-sans);
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight);
  }
  h1 { @apply text-3xl font-bold tracking-tight; }
  h2 { @apply text-2xl font-semibold tracking-tight; }
  h3 { @apply text-xl font-semibold; }
  h4 { @apply text-lg font-medium; }
}
```

- [ ] **Step 2: Verify the file is small**

Run: `wc -l src/app/globals.css`
Expected: ≤ 90 lines.

- [ ] **Step 3: Verify build succeeds**

Run: `bun run build 2>&1 | tail -40`
Expected: build completes without errors. Note the new CSS bundle size and compare with baseline in `docs/audit/phase-1-baseline-build.txt`. A slight increase is acceptable (duplicated tokens between old and new); a large increase (> 50 KB) indicates a problem.

- [ ] **Step 4: Verify tsc still passes**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(styles): shrink globals.css from 3541 to ~90 lines"
```

---

## Part G — Brand presets + config

### Task 21: Create `src/config/brand-presets.ts`

**Files:**
- Create: `src/config/brand-presets.ts`

- [ ] **Step 1: Write the preset module**

Create `src/config/brand-presets.ts`:

```ts
/**
 * Brand Preset Registry — single source of truth for white-label tenants.
 *
 * To add a new brand:
 *   1. Copy src/styles/themes/brand/_template.css to brand/<name>.css
 *   2. Customize its palette values
 *   3. Add an entry here
 *   4. Drop assets into public/brands/<name>/
 *   5. Set env NEXT_PUBLIC_BRAND_PRESET=<name>
 */

export type BrandPresetKey = keyof typeof BRAND_PRESETS;

export interface BrandPreset {
  readonly name: string;            // Display name in UI ("Apex", "Aurora")
  readonly tagline: string;         // Subtitle/tagline
  readonly cssFile: string;         // Filename under src/styles/themes/brand/
  readonly logoUrl: string;         // Light-bg logo
  readonly logoDarkUrl: string;     // Dark-bg logo
  readonly faviconUrl: string;
}

export const BRAND_PRESETS = {
  apex: {
    name: 'Apex',
    tagline: 'The Credibility Engine for African Business',
    cssFile: 'apex.css',
    logoUrl: '/brands/apex/logo.svg',
    logoDarkUrl: '/brands/apex/logo-dark.svg',
    faviconUrl: '/brands/apex/favicon.ico',
  },
} as const satisfies Record<string, BrandPreset>;

const FALLBACK: BrandPresetKey = 'apex';

/**
 * Resolve the active brand preset from env, with safe fallback.
 * Called in src/app/layout.tsx at build time.
 */
export function getActiveBrand(): BrandPreset {
  const envKey = process.env.NEXT_PUBLIC_BRAND_PRESET;
  if (envKey && envKey in BRAND_PRESETS) {
    return BRAND_PRESETS[envKey as BrandPresetKey];
  }
  return BRAND_PRESETS[FALLBACK];
}

/** Type guard — used for validating env input. */
export function isBrandPresetKey(v: string): v is BrandPresetKey {
  return v in BRAND_PRESETS;
}
```

- [ ] **Step 2: Write a unit test for `getActiveBrand`**

Create `src/__tests__/config/brand-presets.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BRAND_PRESETS, getActiveBrand, isBrandPresetKey } from '@/config/brand-presets';

describe('brand-presets', () => {
  const original = process.env.NEXT_PUBLIC_BRAND_PRESET;
  afterEach(() => {
    process.env.NEXT_PUBLIC_BRAND_PRESET = original;
  });

  it('defaults to apex when env is unset', () => {
    delete process.env.NEXT_PUBLIC_BRAND_PRESET;
    expect(getActiveBrand().name).toBe('Apex');
  });

  it('defaults to apex when env is invalid', () => {
    process.env.NEXT_PUBLIC_BRAND_PRESET = 'not-a-brand';
    expect(getActiveBrand().name).toBe('Apex');
  });

  it('isBrandPresetKey correctly guards keys', () => {
    expect(isBrandPresetKey('apex')).toBe(true);
    expect(isBrandPresetKey('nope')).toBe(false);
  });

  it('every preset has required fields', () => {
    for (const key of Object.keys(BRAND_PRESETS)) {
      const preset = BRAND_PRESETS[key as keyof typeof BRAND_PRESETS];
      expect(preset.name).toBeTruthy();
      expect(preset.cssFile).toMatch(/\.css$/);
      expect(preset.logoUrl).toMatch(/^\/brands\//);
    }
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run src/__tests__/config/brand-presets.test.ts --reporter=verbose`
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/config/brand-presets.ts src/__tests__/config/brand-presets.test.ts
git commit -m "feat(config): add brand-presets registry + tests"
```

---

### Task 22: Wire brand preset into `src/app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read current layout.tsx**

Run: `cat src/app/layout.tsx`
Note the current `<html>` element and `<head>` content.

- [ ] **Step 2: Add brand attributes + meta**

Modify `src/app/layout.tsx` to:

1. Import `getActiveBrand` from `@/config/brand-presets`.
2. Inside the RootLayout function, call `const brand = getActiveBrand();`.
3. Add `data-brand={brand.name.toLowerCase()}` attribute on the `<html>` element.
4. Replace the current title/description metadata with dynamic values from `brand.name` and `brand.tagline`.
5. Use `brand.faviconUrl` in the favicon link.

For example (adjust to match existing structure):

```tsx
import { getActiveBrand } from '@/config/brand-presets';
// ... existing imports

const brand = getActiveBrand();

export const metadata = {
  title: brand.name,
  description: brand.tagline,
  icons: { icon: brand.faviconUrl },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-brand={brand.name.toLowerCase()}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify tsc + build**

Run: `npx tsc --noEmit && bun run build 2>&1 | tail -10`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(app): wire brand preset metadata + data-brand attr"
```

---

### Task 23: Add `.env.example` brand variables

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Read current .env.example**

Run: `head -30 .env.example`

- [ ] **Step 2: Append the brand block**

Add to `.env.example` (at the top):

```env
# ==========================================
# BRAND / WHITE-LABEL CONFIGURATION
# ==========================================
# Active brand preset. Matches a key in src/config/brand-presets.ts.
# Default: apex
NEXT_PUBLIC_BRAND_PRESET=apex
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs(env): document NEXT_PUBLIC_BRAND_PRESET"
```

---

## Part H — Cleanup

### Task 24: Delete `globals-light.css`

**Files:**
- Delete: `src/app/globals-light.css`
- Search: any imports of this file

- [ ] **Step 1: Find imports**

Run: `grep -rn "globals-light" src/ --include='*.tsx' --include='*.ts' --include='*.css'`
Expected: hopefully empty. If any results, replace with appropriate import of `src/styles/index.css` or note that the `.light` class already triggers the light theme via `src/styles/themes/light.css`.

- [ ] **Step 2: Delete**

Run: `git rm src/app/globals-light.css`
Expected: file removed from git.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && bun run build 2>&1 | tail -5`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(styles): remove globals-light.css — merged into themes/light.css"
```

---

### Task 24b: Delete superseded design docs + add verify script

**Files:**
- Delete: `docs/archive/UI_DESIGN_SYSTEM.md`, `docs/APEX_LIGHT_THEME_GUIDE.md`
- Modify: `package.json`

- [ ] **Step 1: Delete superseded design docs**

```bash
git rm docs/archive/UI_DESIGN_SYSTEM.md 2>/dev/null || echo "already removed"
git rm docs/APEX_LIGHT_THEME_GUIDE.md 2>/dev/null || echo "already removed"
```

Note: if either path doesn't exist, skip (no error). They're superseded by `APEX_DESIGN_SYSTEM.md` + this spec/plan.

- [ ] **Step 2: Add `styles:verify` script to `package.json`**

Edit `package.json` `scripts` block — add:

```json
"styles:verify": "vitest run src/__tests__/styles/tokens.test.ts",
```

(Place it alphabetically or next to `test:run`.)

- [ ] **Step 3: Run it to confirm it works**

Run: `bun run styles:verify`
Expected: the tokens contract test runs and passes.

- [ ] **Step 4: Commit**

```bash
git add package.json docs/
git commit -m "chore: add styles:verify script, drop superseded design docs"
```

---

### Task 25: Delete 10 `.bak` files

**Files:**
- Delete: 10 `.bak` files listed in spec section "Files to delete"

- [ ] **Step 1: Verify none are imported**

Run: `grep -rn "\.bak" src/ --include='*.tsx' --include='*.ts'`
Expected: no results (import paths don't include `.bak`).

- [ ] **Step 2: Git-remove**

```bash
git rm src/app/api/onboarding/complete/route.ts.bak \
       src/app/api/monitor/run/browser-query-handler.ts.bak \
       src/app/api/realtime/route.ts.bak \
       src/components/brands/completion-wizard.tsx.bak \
       src/lib/db/schema/browser-sessions.ts.bak \
       src/lib/monitoring/integrations/perplexity-browser.ts.bak \
       src/lib/redis.ts.bak \
       src/lib/browser-query/types.ts.bak \
       src/lib/browser-query/base-browser-query.ts.bak \
       src/lib/queue/workers/audit-worker.ts.bak
```

Expected: 10 files staged for deletion.

- [ ] **Step 3: Verify tsc still passes**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove 10 .bak files (dead code)"
```

---

## Part I — Final verification

### Task 26: Full test suite + build

**Files:**
- Run commands only; no file changes.

- [ ] **Step 1: Run full vitest suite**

Run: `npx vitest run --reporter=dot 2>&1 | tail -30`
Expected: all tests pass OR only the baseline failures from Task 0 (compared against `docs/audit/phase-1-baseline-test-failures.txt`). Any NEW failures are a Phase 1 regression — fix before proceeding.

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Run production build**

Run: `bun run build 2>&1 | tee docs/audit/phase-1-final-build.txt | tail -30`
Expected: build succeeds. Compare CSS bundle sizes:

```bash
grep -E '^\s*[├└].*\.css' docs/audit/phase-1-baseline-build.txt docs/audit/phase-1-final-build.txt
```

Acceptable: ±20% CSS bundle size change vs. baseline. Larger changes need investigation.

- [ ] **Step 4: Smoke-test dev server**

Run: `bun run dev` (background), wait 10s, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/`
Expected: `200`. Kill dev server.

- [ ] **Step 5: Commit the final-build report**

```bash
git add docs/audit/phase-1-final-build.txt
git commit -m "chore: record phase 1 final build metrics"
```

---

### Task 27: Visual-regression sanity check

**Files:**
- Create: `scripts/phase-1-visual-check.sh` (ephemeral, optional cleanup after)
- Screenshots to: `docs/audit/phase-1-screenshots/`

Note: Playwright is broken in the current workspace (see `docs/audit/phase-0-inventory.md` "Known blocker"). For Phase 1, use `curl` + headless Chromium via `chromium --headless --screenshot` or rely on manual verification. The "visual regression" here is coarse: does the app still LOOK like Apex?

- [ ] **Step 1: Start dev server**

Run: `bun run dev &`
Wait: `sleep 15`

- [ ] **Step 2: Hand-check 5 routes render without errors**

For each URL, `curl -s -o /dev/null -w "%{http_code}\n" <url>`:

| URL | Expected |
|---|---|
| `http://localhost:3010/` | 200 |
| `http://localhost:3010/sign-in` | 200 |
| `http://localhost:3010/dashboard` | 200 or 302 (redirect to auth) |
| `http://localhost:3010/dashboard/monitor` | 200 or 302 |
| `http://localhost:3010/dashboard/settings` | 200 or 302 |

All 5 URLs must respond; no 500 errors.

- [ ] **Step 3: Hand-verify the home page visually**

Open `http://localhost:3010/` in a real browser (Chrome/Firefox) and confirm:
- Background is deep-space navy (#0a0f1a range)
- Cyan accents still cyan (#00E5CC)
- No console errors in DevTools
- No layout breakage vs. pre-refactor memory

If anything looks broken: `git log --oneline` since Task 0, bisect to the breaking commit, fix.

- [ ] **Step 4: Take reference screenshots (optional; for Phase 2 baseline)**

If a working screenshotter is available:

```bash
chromium --headless --disable-gpu --window-size=1440,900 \
  --screenshot=docs/audit/phase-1-screenshots/home.png http://localhost:3010/
```

- [ ] **Step 5: Stop dev server**

Find and kill by PID (per CLAUDE.md — never `pkill -f next` or similar):

```bash
ss -ltnp | grep :3010
kill <specific-PID-of-next-server>
```

- [ ] **Step 6: Commit any screenshots + the visual-check script**

```bash
git add docs/audit/phase-1-screenshots/ scripts/phase-1-visual-check.sh 2>/dev/null || true
git commit -m "chore: phase 1 visual-regression sanity pass" --allow-empty
```

---

### Task 28: Update design spec with Phase 1 completion

**Files:**
- Modify: `docs/superpowers/specs/2026-04-17-apex-design-system-and-white-label-refactor.md`

- [ ] **Step 1: Mark Phase 1 complete in spec section 6**

Update the `| 1 |` row in the phase table: change `| 1 |` to show status "✅ Complete (YYYY-MM-DD)".

- [ ] **Step 2: Add a note to section 11 ("What ships this session") with Phase 1 deliverables list.**

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-17-apex-design-system-and-white-label-refactor.md
git commit -m "docs: mark Phase 1 complete in design spec"
```

---

## Self-review (executor: run this before declaring Phase 1 done)

- [ ] `src/styles/tokens/` has 6 files + `index.css`
- [ ] `src/styles/themes/` has `dark.css`, `light.css`, `_shared.css`, and `brand/{apex,_template}.css`
- [ ] `src/styles/components/` has `cards.css`, `glassmorphism.css`, `third-party.css`, `badges.css`, `layouts.css`
- [ ] `src/app/globals.css` is ≤ 90 lines
- [ ] `src/app/globals-light.css` is deleted
- [ ] All 10 `.bak` files are deleted
- [ ] `src/config/brand-presets.ts` exists with test coverage
- [ ] `src/__tests__/styles/tokens.test.ts` all pass
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` has no new failures vs. baseline
- [ ] `bun run build` succeeds; CSS bundle size within ±20% of baseline
- [ ] `#4926FA` has ZERO occurrences in `src/styles/**`
  - Run: `grep -rE '#4926[Ff][Aa]' src/styles/ || echo 'clean'`
  - Expected: `clean`
- [ ] dev server starts + home page returns 200

---

## Rollback

If Phase 1 causes a production regression:

```bash
git log --oneline | head -40     # find the phase 0 commit (the one before Task 0)
git revert <phase-0-commit>..HEAD
```

This reverts every Phase 1 commit as a chain. Since each task committed separately, you can also partial-revert individual tasks.

---

*End of Phase 1 plan.*
