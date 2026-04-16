# Feature verification status

## TL;DR

`feature_list.json` reports **205/205 passing**, but that number is self-certification from earlier autonomous sessions — it is NOT backed by an automated test that runs on each commit. Features marked `passes: true` have been *implemented at some point*; they have **not** been verified to still work end-to-end.

Example: the "Citations render correctly" feature was marked `passes: true`, but the UI was silently showing every row as "Omitted" because of a data-shape mismatch between the mentions API and the UI transformer. The feature_list did not catch this.

## What IS verified

| Source | Coverage | CI? |
|---|---|---|
| `vitest` unit/integration tests | ~8,026 tests, 99.96% pass rate | Run manually; no CI gate yet |
| `e2e/*.spec.ts` (Playwright) | 25 spec files, coverage unknown | Run manually |
| Type check (`tsc --noEmit`) | All source code | Run manually; now passes cleanly after Phase 1 |
| `feature_list.json` | None — it's a checklist, not a test | N/A |

## How to use `feature_list.json`

- Treat `passes: true` as **"implementation exists"**, not **"currently working"**.
- Before trusting any feature flagged `passes: true`, run the relevant test or manually verify in the browser.
- When adding new features, the honest answer to "does it pass?" is usually *I don't know yet* — use `passes: false` until there's a test proving it.

## What we're doing about it

Phase 2 of production-readiness introduces a small set of Playwright smoke tests that cover the 5 core flows (sign-in → monitor → create → audit → recommendations). These flows ARE the source of truth for whether the app works end-to-end. If they pass, `feature_list.json` is allowed to claim features pass; if they fail, it's lying.

## Don't

- Don't rely on `feature_list.json` as a ship/no-ship signal.
- Don't update `passes: true` without running the real test.
- Don't treat the file as a contract — it's a scratchpad.
