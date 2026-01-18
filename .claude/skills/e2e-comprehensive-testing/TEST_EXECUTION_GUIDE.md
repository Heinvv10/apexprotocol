# 🎯 Apex E2E Test Execution Guide

## Running the Comprehensive Test Suite

### Prerequisites

```bash
# Ensure all dependencies installed
npm install

# Start development server
npm run dev

# In another terminal, ensure database ready
npm run db:push

# Start Redis (for rate limiting tests)
docker-compose up redis  # if using Docker

# Ensure environment variables set
# .env.local should contain:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - ANTHROPIC_API_KEY
# - DATABASE_URL
# - UPSTASH_REDIS_URL
```

---

## Test Execution by Category

### 1. Authentication Tests (Playwright)

```bash
# Run all auth tests
npx playwright test auth.spec.ts

# Run specific test
npx playwright test auth.spec.ts -g "should sign in"

# Run with headed browser (watch)
npx playwright test auth.spec.ts --headed

# Generate report
npx playwright test auth.spec.ts --reporter=html
# Opens: playwright-report/index.html
```

**What it tests:**
- Clerk sign-in integration
- Sign-up flow
- Role-based access (owner/admin/member/viewer)
- Protected route redirects
- Session persistence

---

### 2. Dashboard Tests (Playwright)

```bash
# Run dashboard tests
npx playwright test dashboard.spec.ts

# Run specific dashboard page
npx playwright test dashboard.spec.ts -g "homepage"

# Debug mode (step through)
npx playwright test dashboard.spec.ts --debug
```

**What it tests:**
- Page load performance
- All sections render
- Navigation works
- Responsive layouts
- Theme toggle
- Console errors

---

### 3. Brand Management Tests (Playwright + Vitest)

```bash
# Integration tests (Playwright)
npx playwright test brands.spec.ts

# Unit tests (Vitest)
npm run test -- brands.test.ts

# Combined coverage
npm run test:e2e
```

**What it tests:**
- Create brand form validation
- Brand creation API
- Brand list display
- Edit brand functionality
- Delete brand with confirmation
- Database CRUD operations

---

### 4. Audit Feature Tests (Playwright)

```bash
# Full audit workflow
npx playwright test audit.spec.ts

# Just results page
npx playwright test audit.spec.ts -g "results"

# Just roadmap
npx playwright test audit.spec.ts -g "roadmap"

# Debug specific test
npx playwright test audit.spec.ts -g "Phase 6" --debug
```

**What it tests:**
- Start audit flow
- Audit progress tracking
- Results page rendering
- All 5 audit phases (Performance, AI, SEO, Competitive, Roadmap)
- Export functionality
- Share functionality

---

### 5. API Endpoint Tests (Vitest)

```bash
# Test all API routes
npm run test -- api/

# Test specific endpoint
npm run test -- api/brands.test.ts

# Test with coverage
npm run test -- api/ --coverage

# Watch mode (re-run on file change)
npm run test -- api/ --watch
```

**Coverage includes:**
- `/api/brands` (CRUD)
- `/api/audit` (scan, results)
- `/api/monitor/mentions` (fetch, filter)
- `/api/create` (brief, generate, publish)
- `/api/competitive` (analysis, add, remove)
- Auth and error handling

---

### 6. Database Tests (Vitest)

```bash
# Test database operations
npm run test -- db/

# Test with actual database (integration)
NODE_ENV=test npm run test -- db/ --integration

# Generate DB schema report
npm run db:studio  # Open Drizzle Studio
```

**What it tests:**
- Insert/update/delete operations
- Relationships and foreign keys
- Cascading deletes
- Transaction atomicity
- Row-level security (if using PostgreSQL RLS)
- Query performance

---

### 7. Hook Tests (Vitest)

```bash
# Test React hooks
npm run test -- hooks/

# Test specific hook
npm run test -- useAudit.test.ts

# Watch mode
npm run test -- hooks/ --watch
```

**Hooks tested:**
- `useAudit` - audit data fetching
- `useContent` - content operations
- `useCompetitorComparison` - competitive data
- `useRoadmapGenerator` - roadmap generation
- `useBrandScrape` - web scraping

---

### 8. Component Tests (Vitest + React Testing Library)

```bash
# Test all components
npm run test -- components/

# Test specific component
npm run test -- components/AuditResultsHeader.test.ts

# With coverage
npm run test -- components/ --coverage

# Watch mode
npm run test -- components/ --watch
```

**Component coverage:**
- Rendering without errors
- Props handling
- State management
- User interactions (clicks, form inputs)
- Loading and error states
- Responsive behavior

---

### 9. End-to-End Workflow Tests (Playwright)

```bash
# Run all E2E workflow tests
npx playwright test workflows.e2e.ts

# Test specific workflow
npx playwright test workflows.e2e.ts -g "Setup and Monitor"

# Test with slow motion (easier to watch)
npx playwright test workflows.e2e.ts --headed --slow-mo=500

# Trace on failure (captures network, DOM, console)
npx playwright test workflows.e2e.ts --trace on
# View trace: npx playwright show-trace trace.zip
```

**Workflows tested:**
1. Brand setup and monitoring
2. Audit generation and roadmap
3. Content creation and publishing
4. Competitive analysis

---

### 10. Performance Tests (Lighthouse + Vitest)

```bash
# Run Lighthouse performance audit
npm run lighthouse

# Test Core Web Vitals
npm run test -- performance/

# Test API response times
npm run test -- api/performance.test.ts
```

**Measured:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- API response times
- Database query times

---

### 11. Visual Regression Tests (Playwright)

```bash
# Create baseline screenshots
npx playwright test visual.spec.ts --update-snapshots

# Run visual regression tests
npx playwright test visual.spec.ts

# Show diff if mismatch
npx playwright test visual.spec.ts --reporter=list
```

**Pages captured:**
- Dashboard homepage
- Audit results page
- Competitive analysis page
- Roadmap page
- Mobile layouts (375px, 768px, 1920px)

---

### 12. Security Tests (Vitest + Custom Checks)

```bash
# Run security tests
npm run test -- security/

# OWASP dependency check
npm audit

# Static code analysis
npm run lint

# Environment variable check
npm run check:env

# SQL injection tests
npm run test -- security/sql-injection.test.ts

# XSS prevention tests
npm run test -- security/xss-prevention.test.ts
```

---

### 13. Browser Compatibility Tests (Playwright)

```bash
# Run on multiple browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on all browsers
npx playwright test

# Mobile browsers
npx playwright test --project="Mobile Safari"
npx playwright test --project="Pixel 5"

# Generate report
npx playwright test --reporter=html
```

---

### 14. Full Suite (All Tests)

```bash
# Run everything
npm run test:all

# Or manually run all categories
npm run test:unit && npm run test:integration && npm run test:e2e

# Generate combined coverage
npm run test -- --coverage

# Generate HTML report
npm run test:report
```

---

## Test Execution Workflow for Pre-Launch

### Step 1: Local Development Testing (1 hour)

```bash
# 1. Start fresh
npm run db:reset  # Reset to clean state
npm run dev

# 2. Run all unit tests
npm run test

# 3. Run all component tests
npm run test -- components/

# 4. Run all hook tests
npm run test -- hooks/

# 5. Check for console warnings
npm run lint

# Expected: All green ✓
```

### Step 2: API & Database Testing (30 min)

```bash
# 1. Run API tests
npm run test -- api/

# 2. Run database tests
npm run test -- db/

# 3. Run integration tests
npm run test:integration

# Expected: All passing ✓
```

### Step 3: E2E Workflow Testing (1.5 hours)

```bash
# 1. Run all E2E tests
npx playwright test

# 2. Watch for any failures
# If failures, investigate and fix

# 3. Run again after fixes
npx playwright test

# 4. Generate report
npx playwright test --reporter=html

# Expected: 100% pass rate ✓
```

### Step 4: Performance Testing (30 min)

```bash
# 1. Run Lighthouse
npm run lighthouse

# 2. Check Core Web Vitals
# Expected: Green scores (90+)

# 3. Test on mobile network
npx playwright test --headed --device="Pixel 5"

# 4. Check load times
# Expected: Page loads <2s, API <500ms
```

### Step 5: Security Checks (20 min)

```bash
# 1. Run security tests
npm run test -- security/

# 2. Check dependencies
npm audit

# 3. Check environment
npm run check:env

# 4. Code review for hardcoded secrets
grep -r "password\|secret\|key" src/

# Expected: No hardcoded secrets ✓
```

### Step 6: Browser Compatibility (30 min)

```bash
# 1. Test on all browsers
npx playwright test

# 2. Test on mobile browsers
npx playwright test --device="iPhone 12"
npx playwright test --device="Pixel 5"
npx playwright test --device="iPad Pro"

# 3. Test responsive
# Desktop, Tablet, Mobile at key breakpoints

# Expected: Works on all ✓
```

### Step 7: Final Visual Check (20 min)

```bash
# 1. Manual walkthrough
# - Visit all main pages
# - Test key interactions
# - Verify theme switching
# - Check on mobile

# 2. Visual regression check
npx playwright test visual.spec.ts

# 3. Screenshot comparison
# Expected: No unexpected changes ✓
```

### Total Time: ~4 hours for comprehensive pre-launch testing

---

## Continuous Integration (CI/CD)

### GitHub Actions Workflow

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres

      redis:
        image: redis

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run db:migrate

      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Failed Tests

### If tests fail locally:

```bash
# 1. Run in headed mode to watch
npx playwright test --headed --headed

# 2. Use debug mode to step through
npx playwright test --debug

# 3. Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# 4. Capture traces (network, DOM, console)
npx playwright test --trace on
npx playwright show-trace trace.zip

# 5. Check network tab
# Open DevTools Network tab while running --headed

# 6. Check console errors
# Open DevTools Console tab

# 7. Increase timeout for slow tests
# Add: test.setTimeout(60000) in test file

# 8. Check test logs
# Run: npm run test -- --reporter=verbose
```

---

## Test Report Interpretation

### Green (✓) Checkmarks
- Feature works correctly
- Edge cases handled
- No errors or warnings
- Ready for production

### Red (✗) X Marks
- Feature broken
- Error thrown
- Data incorrect
- **Must fix before launch**

### Yellow (⚠) Warnings
- Deprecation warning
- Performance suboptimal
- Non-blocking issue
- Address before launch

### Skip (◯) Marks
- Test skipped (usually during development)
- Should not be skipped at launch
- All tests must run

---

## Performance Benchmarks (Expected)

| Metric | Target | Status |
|--------|--------|--------|
| Page Load Time | < 2s | ✓ |
| API Response | < 500ms | ✓ |
| Auth Token Validation | < 100ms | ✓ |
| Database Query | < 100ms | ✓ |
| Image Load | < 1s | ✓ |
| First Contentful Paint | < 1.5s | ✓ |
| Largest Contentful Paint | < 2.5s | ✓ |
| Cumulative Layout Shift | < 0.1 | ✓ |

---

## Sign-Off Checklist

Before marking as "Ready for Production":

```
✓ All unit tests passing (100%)
✓ All integration tests passing (100%)
✓ All E2E tests passing (100%)
✓ No console errors in any page
✓ No console errors in any workflow
✓ Performance benchmarks met
✓ Security tests passing
✓ API response times acceptable
✓ Mobile responsive verified
✓ Browser compatibility verified (Chrome, Firefox, Safari, Mobile)
✓ Theme switching works (light/dark)
✓ All user workflows tested manually
✓ No visual regressions
✓ Error handling verified
✓ Edge cases tested
✓ Database migrations applied
✓ Environment variables configured
✓ Monitoring/logging configured
✓ Error tracking (Sentry, etc.) configured
✓ Analytics configured

APPROVED FOR PRODUCTION: [DATE] [TESTER NAME]
```

---

**Last Updated**: 2026-01-19
**Version**: 1.0.0

This guide ensures comprehensive testing before every production release. No feature goes live without passing these tests.
