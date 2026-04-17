# White-Label Runbook

**Goal:** rebrand the Apex platform for a new tenant in under an hour.

The design system is split into three layers:

1. **Primitives** (`src/styles/themes/brand/<slug>.css`) — per-brand palette in HSL triplets.
2. **Semantic** (`src/styles/themes/{dark,light}.css`) — maps `--color-*` tokens to the palette. Theme-aware, brand-agnostic.
3. **Components** (`src/styles/components/*.css`) — `.card-primary`, `.glassmorphism`, etc.

White-labelling only touches Layer 1. Every component and page reads the `--color-*` tokens, which resolve through `--palette-*` to the active brand.

## Adding a new brand in 6 steps

### 1 — Copy the template (1 min)

```bash
cp src/styles/themes/brand/_template.css \
   src/styles/themes/brand/<slug>.css
```

Replace `<slug>` with a kebab-case brand key (e.g. `solstice`, `aurora`, `ember`).

### 2 — Fill in the palette (15–20 min)

Open `src/styles/themes/brand/<slug>.css` and replace every `0 0% 0%` placeholder with an HSL triplet (format: `H S% L%`, no `hsl()` wrapper — the wrapper is added by consumers so opacity math `hsl(var(...) / 0.3)` works).

**What you must change:**

| Block | Role | Tip |
|-------|------|-----|
| `--palette-cyan-300..700` | Brand **primary** (five shades) | The 500 value is the "main" brand colour. 400 is the hover/bright variant. 600/700 are subdued/deep. |
| `--palette-purple-300..600` | Brand **accent** | Used for gradient pairs, links, purple chips. Needs contrast with primary. |
| `--palette-pink-500` | Tertiary accent | Used in a handful of decorative elements (leave alone if you don't have a third colour). |
| `--palette-blue-400/500` | Info/link colour | Keep as-is if you like the default blue. |
| `--palette-text-*` | Text colours (dark/light) | Usually just `0 0% 100%` for primary on dark, `222 47% 11%` for primary on light. |

**What you should NOT change:**

- `--palette-neutral-*` — dark/light dashboard chrome. Changing these breaks the UI shell. Only override if you have a very specific visual identity that needs a different dashboard background.
- `--palette-success`, `--palette-warning`, `--palette-error`, `--palette-info` — status semantics. Changing these will confuse users (red = error is a pattern).

Wrap the whole `:root { … }` block with the attribute selector:

```css
:root[data-brand="<slug>"] {
  --palette-cyan-500: …;
  …
}
```

(Apex also matches bare `:root` as a safety fallback. Don't copy that pattern — only the default brand should have it.)

### 3 — Register the brand (1 min)

Edit `src/config/brand-presets.ts`:

```ts
export const BRAND_PRESETS = {
  apex: { … },
  <slug>: {
    name: '<DisplayName>',
    tagline: '<short tagline>',
    cssFile: '<slug>.css',
    logoUrl: '/brands/<slug>/logo.svg',
    logoDarkUrl: '/brands/<slug>/logo-dark.svg',
    faviconUrl: '/brands/<slug>/favicon.ico',
  },
} as const satisfies Record<string, BrandPreset>;
```

### 4 — Wire into the index (1 min)

Edit `src/styles/index.css` to add the new import beneath apex.css:

```css
@import "./themes/brand/apex.css";
@import "./themes/brand/<slug>.css";
```

Every brand is loaded; only the one matching `:root[data-brand="<slug>"]` applies at runtime.

### 5 — Drop assets (10 min)

```bash
mkdir -p public/brands/<slug>
# Copy into that folder:
#   logo.svg         (light-bg variant)
#   logo-dark.svg    (dark-bg variant)
#   favicon.ico
```

SVG logos render crisp at every size and don't add build weight. If you only have PNG, that works too — just update the file extensions in `brand-presets.ts`.

### 6 — Activate (1 min)

Set the env var and rebuild:

```bash
# Dev
NEXT_PUBLIC_BRAND_PRESET=<slug> bun run dev

# Prod
NEXT_PUBLIC_BRAND_PRESET=<slug> bun run build
NEXT_PUBLIC_BRAND_PRESET=<slug> bun run start
```

Next inlines `NEXT_PUBLIC_*` vars at build time, so the built bundle is tied to the active brand — you cannot swap at runtime. For multi-tenant deployments, build one image per tenant and tag by slug.

`src/app/layout.tsx` reads the env at build, sets `<html data-brand="<slug>">`, and loads the matching logo / tagline from the preset.

## Verification checklist

After activating a new brand, open these pages and confirm:

- [ ] `/sign-in` — logo + wordmark use new brand
- [ ] `/dashboard` — sidebar wordmark, top-bar search, first-run step cards
- [ ] `/dashboard/monitor` with a brand selected — platform cards, LIVE indicator
- [ ] `/dashboard/audit` — URL input, "Start Audit" button, Run history
- [ ] `/dashboard/settings` — form accent, Save Changes CTA
- [ ] Light theme toggled — confirm the accent colour still has contrast
- [ ] `/admin` (as super-admin) — red admin palette should be untouched; admin intentionally uses a distinct palette for elevated access.

## Known gaps

- **F21 — sidebar wordmark is hardcoded "ApexGEO"** (`src/components/ui/apex-logo.tsx`). When rebranding, that component still renders "Apex" + cyan "GEO". Make `ApexWordmark` read from `getActiveBrand()` like `BrandHeader` does. Scheduled for a follow-up commit after this runbook lands.
- **F3 legacy inline references** — all 22 dashboard pages were migrated to `<BrandHeader />` in Phase 6. If you find a page that still shows "APEX" literally, grep for `>APEX<` — it escaped the sweep.
- **Clerk appearance overrides** (`src/components/providers/clerk-provider.tsx`) — the Clerk `<SignIn>` / `<SignUp>` styling reads from CSS variables via the `appearance.variables` prop. It's brand-aware. Verify the sign-in form looks right for the new brand.

## Example — the Solstice demo brand

`src/styles/themes/brand/solstice.css` is a working example. Amber primary (`38 92% 50%`), rose accent (`350 89% 60%`). Activate with `NEXT_PUBLIC_BRAND_PRESET=solstice`. Screenshots in `docs/audit/screenshots/phase-7/`:

- `01-apex-default.png` — current Apex look (cyan + purple)
- `03-solstice-fullbuild.png` — same page under Solstice (amber + rose)

Exactly the same layout, components, and copy; the only difference is what comes out of the palette tokens.

## Time budget

| Step | Estimated |
|------|-----------|
| Copy template | 1 min |
| Fill palette | 15–20 min |
| Register preset | 1 min |
| Wire into index | 1 min |
| Drop assets | 10 min |
| Verify | 10–15 min |
| **Total** | **~40–50 min** |

Under the one-hour promise.
