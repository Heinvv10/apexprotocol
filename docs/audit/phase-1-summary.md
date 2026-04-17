# Phase 1 Complete — 2026-04-17

## What shipped

- `src/styles/**` token/theme/component system (17 files, 3345 lines)
- `src/app/globals.css` shrunk from 3541 → 89 lines (-97.5%)
- `src/config/brand-presets.ts` registry + 4 unit tests
- `src/app/layout.tsx` wired with `getActiveBrand()` + `data-brand` attribute
- `.env.example` documents `NEXT_PUBLIC_BRAND_PRESET`

## Removed

- `src/app/globals-light.css` (merged into `themes/light.css`)
- 12 `.bak` files in `src/` (1 was git-tracked, 11 were untracked)
- Superseded design docs: `docs/archive/UI_DESIGN_SYSTEM.md`, `docs/APEX_LIGHT_THEME_GUIDE.md`

## Verification

- 10/10 styles contract tests pass (`bun run styles:verify`)
- 4/4 brand-preset tests pass
- tsc: 196 `error TS` occurrences — matches baseline exactly (no new errors)
- vitest: 3 files failed / 4-5 tests failed — all in `tests/integration/` (DB connection timeouts, same category as baseline). Fewer failures than baseline (8 tests).
- Build: Static pages generated successfully (`✓ Compiled successfully in 15.8s`)
- CSS bundle: baseline ~326K → final ~317K (-2.8%)
- `#4926FA` drift: 0 actual CSS value occurrences in `src/styles/**` (1 documentary comment in `third-party.css` is intentional)

## Open items for Phase 2+

- ~44 hardcoded hex values remaining in `src/styles/components/layouts.css` (flagged with TODO — need additional semantic tokens for lighter tints, slate sidebar, sky gradients)
- Phase 2 browser blocker: Playwright attached to wrong tab (see `docs/audit/phase-0-inventory.md`)
- Phase 6 (Refactor) will sweep `src/components/**` + `src/app/**` to replace ~1500+ raw hex with tokens
