# Playwright E2E/UI Testing Protocol

**STATUS**: MANDATORY FOR UI PROJECTS
**LOAD WHEN**: Working on UI, after feature builds, before deployments

---

## Automatic Triggers (MUST RUN)

Playwright tests are MANDATORY after:
1. **UI Changes** - Any component/page modifications
2. **Feature Build** - Completing new features/modules
3. **Big Module** - After major module implementation
4. **UI Error Fix** - After fixing any UI-related bugs
5. **Before Deploy** - Always before production deployment
6. **Theme Changes** - After any theme/styling updates
7. **Responsive Updates** - After mobile/tablet adjustments
8. **Design Changes** - After modifying visual elements

---

## Test Categories

| Category | Tag | Purpose |
|----------|-----|---------|
| Smoke | @smoke | Critical path validation |
| Regression | @regression | Previous bug fixes |
| Visual | @visual | UI appearance/layout |
| Accessibility | @a11y | WCAG compliance |
| Performance | @perf | Load times, interactions |
| Mobile | @mobile | Touch, viewport testing |

---

## Minimum Test Coverage

- **Navigation**: All routes accessible
- **Forms**: Validation, submission, errors
- **Data Display**: Tables, lists, cards render
- **Interactions**: Clicks, hovers, drags work
- **Responsive**: Mobile, tablet, desktop views
- **Themes**: Light/dark/custom themes apply
- **Error States**: 404, 500, network failures
- **Auth Flows**: Login, logout, protected routes

---

## Test Execution Flow

```bash
# 1. Before starting UI work (baseline check)
npx playwright test --grep @smoke

# 2. After implementing feature
npx playwright test tests/e2e/new-feature.spec.ts

# 3. Before marking task complete (full suite)
npx playwright test

# 4. Before deployment
npx playwright test --grep "@smoke|@regression"
```

---

## Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/feature.spec.ts

# Run tests in specific browser
npx playwright test --browser=chromium

# Run only smoke tests
npx playwright test --grep @smoke
```

---

## Failure Protocol

If Playwright tests fail:
1. **STOP** - Do not proceed with deployment
2. **ANALYZE** - Check failure screenshots/videos
3. **FIX** - Resolve the UI issues
4. **RETEST** - Run failed tests again
5. **FULL RUN** - Execute complete suite after fix

---

## Project Setup Requirements

Every UI project MUST have:
- `/tests/e2e/` or `/tests/ui/` directory
- `playwright.config.ts` configured
- `.github/workflows/playwright.yml` for CI
- package.json scripts:
  ```json
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
  ```
