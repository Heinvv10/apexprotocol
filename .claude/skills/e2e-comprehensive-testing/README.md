# 🧪 Apex Comprehensive E2E Testing Skill

## Overview

This is a **complete, exhaustive end-to-end testing skill** for the Apex GEO/AEO platform. It provides everything needed to validate **every feature, button, function, hook, API endpoint, database operation, and user workflow** before production launch.

**Think of this as**: The final quality assurance pass that a professional QA team would do before shipping to customers.

---

## 📂 Skill Contents

### 1. **SKILL.md** (Main Reference)
   - **Purpose**: Complete testing protocol with 20 major test categories
   - **Coverage**:
     - Authentication & access control
     - Dashboard & core UI
     - Brand management (CRUD)
     - Audit feature (all 5 phases)
     - Monitor/mentions
     - Content creation
     - Competitive analysis
     - Responsive design
     - Theme & styling
     - API endpoints
     - Database operations
     - React hooks
     - State management (Zustand)
     - Component rendering
     - Error handling & edge cases
     - User workflows
     - Visual regression
     - Browser compatibility
     - Security
     - Console & error monitoring

   - **Use When**: You need detailed specifications for what to test and how to verify

### 2. **TEST_EXECUTION_GUIDE.md** (How-To Guide)
   - **Purpose**: Step-by-step instructions for running tests
   - **Includes**:
     - Prerequisites and setup
     - Commands for each test category
     - Unit tests (Vitest)
     - Integration tests
     - E2E tests (Playwright)
     - Performance testing
     - Security testing
     - Browser compatibility testing
     - Full suite execution workflow
     - Pre-launch testing sequence (~4 hours)
     - CI/CD integration
     - Debugging failed tests
     - Test report interpretation
     - Performance benchmarks

   - **Use When**: You need to actually run the tests and want the exact commands

### 3. **LIVE_TEST_CHECKLIST.md** (Executable Checklist)
   - **Purpose**: Checkbox-based testing form for QA testing sessions
   - **Includes**:
     - 20 test categories with detailed checkboxes
     - Pre-test setup checklist
     - Authentication checks (15 min)
     - Dashboard checks (20 min)
     - Brand management checks (20 min)
     - Audit feature checks (45 min)
     - Monitor/mentions checks (20 min)
     - Content creation checks (30 min)
     - Competitive analysis checks (25 min)
     - Responsive design verification (15 min)
     - Theme & styling (10 min)
     - API testing (30 min)
     - Database operations (20 min)
     - Hook testing (15 min)
     - State management (10 min)
     - Component rendering (20 min)
     - Error handling (15 min)
     - Security (15 min)
     - Console & network (20 min)
     - Workflow testing (45 min)
     - Browser compatibility (15 min)
     - Final verification (10 min)
     - Test summary table
     - Approval signature section

   - **Use When**: Actively testing the application - print it out and check off items as you test

---

## 🚀 Quick Start

### For Developers/Testers
1. **First time?** Read `SKILL.md` to understand what's being tested
2. **Ready to test?** Follow `TEST_EXECUTION_GUIDE.md` for command-line instructions
3. **Testing now?** Use `LIVE_TEST_CHECKLIST.md` to track progress

### For QA Teams
1. Print out or open `LIVE_TEST_CHECKLIST.md`
2. Follow each section in order
3. Check off items as verified
4. Fill in the approval signature at the end

### For CI/CD Integration
1. Review the CI/CD section in `TEST_EXECUTION_GUIDE.md`
2. Copy the GitHub Actions workflow
3. Configure for your repository
4. Tests run automatically on every PR and deployment

---

## 🎯 What This Skill Tests

### Frontend (User-Facing)
- ✅ Page rendering and layout
- ✅ Form validation and submission
- ✅ Navigation and routing
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Theme switching (light/dark mode)
- ✅ Component interactions
- ✅ User workflows
- ✅ Error messages and handling
- ✅ Loading states
- ✅ Empty states

### Backend (API & Database)
- ✅ API endpoint functionality
- ✅ Authentication & authorization
- ✅ Database CRUD operations
- ✅ Data relationships & integrity
- ✅ Transaction atomicity
- ✅ Error responses
- ✅ Response formatting
- ✅ Query performance
- ✅ Foreign key constraints

### Integrations
- ✅ Clerk authentication
- ✅ Claude/OpenAI API calls
- ✅ Drizzle ORM queries
- ✅ React Query caching
- ✅ Zustand state management

### Quality Attributes
- ✅ Performance (load times, API responses)
- ✅ Security (SQL injection, XSS, CSRF, data isolation)
- ✅ Accessibility (contrast, keyboard nav)
- ✅ Browser compatibility
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Data integrity

---

## 📊 Test Coverage by Category

| Category | Items | Time |
|----------|-------|------|
| Authentication | 6 tests | 15 min |
| Dashboard | 10 tests | 20 min |
| Brands | 10 tests | 20 min |
| Audit | 50+ tests | 45 min |
| Monitor | 8 tests | 20 min |
| Create | 12 tests | 30 min |
| Competitive | 12 tests | 25 min |
| Responsive | 6 breakpoints | 15 min |
| Theme | 6 tests | 10 min |
| API | 25 endpoints | 30 min |
| Database | 15 operations | 20 min |
| Hooks | 5 hooks | 15 min |
| State | 4 stores | 10 min |
| Components | 20+ components | 20 min |
| Errors | 12 scenarios | 15 min |
| Security | 8 checks | 15 min |
| Network | 10 checks | 20 min |
| Workflows | 4 complete | 45 min |
| Browsers | 5 browsers | 15 min |
| Final | 20 items | 10 min |
| **TOTAL** | **250+** | **~4 hours** |

---

## 🏗️ Test Execution Architecture

```
┌─────────────────────────────────────────────────────┐
│           APEX COMPREHENSIVE E2E TESTING            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Unit Tests (Vitest)                             │
│  ├─ Components                                    │
│  ├─ Hooks                                         │
│  └─ Utilities                                     │
│                                                     │
│  Integration Tests (Vitest + RTL)                 │
│  ├─ API Routes                                    │
│  ├─ Database Operations                           │
│  └─ Multi-component workflows                     │
│                                                     │
│  E2E Tests (Playwright)                           │
│  ├─ User journeys                                 │
│  ├─ Browser compatibility                         │
│  ├─ Responsive design                             │
│  └─ Real workflows                                │
│                                                     │
│  Performance Tests (Lighthouse)                   │
│  ├─ Core Web Vitals                               │
│  ├─ API response times                            │
│  └─ Page load times                               │
│                                                     │
│  Security Tests (Manual + Automated)              │
│  ├─ Injection prevention                          │
│  ├─ Cross-origin checks                           │
│  └─ Data isolation                                │
│                                                     │
│  Accessibility Tests (axe-core)                   │
│  ├─ Color contrast                                │
│  ├─ Keyboard navigation                           │
│  └─ ARIA labels                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
           ↓
    Test Report & Analytics
           ↓
    PASS/FAIL Decision
```

---

## 🎬 Pre-Launch Testing Sequence

### Timeline: ~4 hours total

```
Hour 1: Local Development Testing
├─ Unit tests: npm run test (10 min)
├─ Component tests: npm run test -- components/ (10 min)
├─ Hook tests: npm run test -- hooks/ (10 min)
└─ Lint check: npm run lint (5 min)
  Expected: All green ✓

Hour 2: API & Database Testing
├─ API tests: npm run test -- api/ (15 min)
├─ Database tests: npm run test -- db/ (15 min)
└─ Integration tests: npm run test:integration (10 min)
  Expected: All passing ✓

Hour 3: E2E Workflow Testing
├─ All E2E tests: npx playwright test (45 min)
├─ Failed test debugging (5 min)
└─ Report generation: npx playwright test --reporter=html (5 min)
  Expected: 100% pass rate ✓

Hour 4: Manual Verification
├─ Performance testing: npm run lighthouse (10 min)
├─ Security checks: npm run test -- security/ (10 min)
├─ Browser compatibility: manual on 3+ browsers (15 min)
├─ Visual regression: npx playwright test visual.spec.ts (10 min)
└─ Final walkthrough: key workflows tested (5 min)
  Expected: All working ✓
```

---

## 🔧 How to Use This Skill

### Scenario 1: Testing Before Production Deployment

1. **Print the checklist**
   ```bash
   open .claude/skills/e2e-comprehensive-testing/LIVE_TEST_CHECKLIST.md
   ```

2. **Follow the sequence**
   - Start with authentication (15 min)
   - Continue through each category
   - Check off items as verified

3. **Run automated tests**
   ```bash
   npm run test:all
   npx playwright test
   npm run lighthouse
   ```

4. **Sign off**
   - Fill in tester name, date, time
   - Mark as APPROVED FOR PRODUCTION
   - Get manager signature

### Scenario 2: Debugging a Failing Test

1. **Read the error** in test output
2. **Consult TEST_EXECUTION_GUIDE.md**
   ```bash
   # Run with headed browser
   npx playwright test --headed

   # Debug mode
   npx playwright test --debug

   # Trace on failure
   npx playwright test --trace on
   ```
3. **Fix the issue**
4. **Re-run the failing test**
5. **Run full suite to verify no regressions**

### Scenario 3: Adding a New Feature

1. **Identify all testable surfaces** for the new feature
2. **Add tests to SKILL.md** in the appropriate category
3. **Add execution commands** to TEST_EXECUTION_GUIDE.md
4. **Add checklist items** to LIVE_TEST_CHECKLIST.md
5. **Run tests for the new feature**
6. **Verify no regressions** in related features

### Scenario 4: CI/CD Integration

1. **Copy the GitHub Actions workflow** from TEST_EXECUTION_GUIDE.md
2. **Save to `.github/workflows/e2e-tests.yml`**
3. **Configure services** (PostgreSQL, Redis)
4. **Tests run automatically** on every PR and push
5. **Fail deployment** if tests don't pass
6. **Archive reports** for compliance

---

## 📈 Test Success Metrics

**Before shipping to production, all of these should be ✅:**

- ✅ 100% of unit tests passing
- ✅ 100% of integration tests passing
- ✅ 100% of E2E tests passing
- ✅ 0 critical bugs found
- ✅ 0 console errors
- ✅ 0 security vulnerabilities
- ✅ 0 SQL injection vulnerabilities
- ✅ 0 XSS vulnerabilities
- ✅ 0 CSRF vulnerabilities
- ✅ 0 cross-org data leaks
- ✅ Page load time < 2s
- ✅ API response time < 500ms
- ✅ Largest Contentful Paint (LCP) < 2.5s
- ✅ Cumulative Layout Shift (CLS) < 0.1
- ✅ Works on Chrome, Firefox, Safari, Mobile
- ✅ Responsive on mobile (375px), tablet (768px), desktop (1920px)
- ✅ Theme toggle works (light/dark)
- ✅ All user workflows complete without errors
- ✅ Database integrity verified
- ✅ All recommended features work

---

## 🎓 Learning Resources

### Understanding What's Tested

1. **SKILL.md** - Read each section to understand
2. **Apex codebase** - Explore the actual code being tested
3. **Test files** - See examples in `tests/` directory
4. **Playwright docs** - https://playwright.dev
5. **Vitest docs** - https://vitest.dev

### Running Your First Test

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Run one test file
npx playwright test auth.spec.ts

# 4. Watch the test run with headed browser
npx playwright test auth.spec.ts --headed

# 5. Debug step-by-step
npx playwright test auth.spec.ts --debug
```

---

## 🔍 Troubleshooting

### Tests Timing Out
- Increase timeout: `test.setTimeout(60000)` in test file
- Check database is available
- Check API services running

### Flaky Tests
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Avoid hardcoded timeouts (use page.waitFor instead)
- Clear state between tests

### Missing Test Coverage
- Run coverage report: `npm run test -- --coverage`
- Check hotspots in coverage report
- Add tests for uncovered code paths

### API Failures
- Check `.env.local` has all required variables
- Verify API services are running
- Check network tab in DevTools for 401/403/500 errors

---

## 📋 Sign-Off Checklist Template

Use this before deploying to production:

```
Pre-Launch Sign-Off Checklist
================================

Date: [INSERT]
Tester: [INSERT]
Build: [INSERT COMMIT HASH]

Unit Tests:        ✓ Passing
Integration Tests: ✓ Passing
E2E Tests:         ✓ Passing
Performance Tests: ✓ Passing
Security Tests:    ✓ Passing
Browser Tests:     ✓ Passing
Mobile Tests:      ✓ Passing
Console Errors:    ✓ 0 errors
API Status:        ✓ All responding
Database:          ✓ Integrity verified
Auth:              ✓ Working
Theme:             ✓ Working

All Workflows:
- Brand Setup:     ✓ Complete
- Audit & Roadmap: ✓ Complete
- Content Create:  ✓ Complete
- Competitive:     ✓ Complete

Status: READY FOR PRODUCTION ✅

Manager Approval: ___________
Date: ___________
```

---

## 🚀 Advanced Usage

### Running Tests in Parallel
```bash
# Run all tests in parallel for faster feedback
npm run test -- --jobs=4
npx playwright test --workers=4
```

### Capturing Videos on Failure
```bash
npx playwright test --video=retain-on-failure
# Videos saved to test-results/ directory
```

### Generating HTML Report
```bash
npx playwright test --reporter=html
open playwright-report/index.html
```

### Custom Test Filtering
```bash
# Run only tests matching pattern
npm run test -- -g "should create brand"

# Run tests in specific file
npm run test -- components/GeoScoreTrend.test.ts

# Run tests excluding pattern
npm run test -- -g "!@slow"
```

---

## 📞 Support

- **Found a bug in a test?** Check LIVE_TEST_CHECKLIST.md for similar items
- **Test not running?** See Troubleshooting section
- **Want to add tests?** See "Adding a New Feature" scenario
- **Need more coverage?** Reference SKILL.md for comprehensive checklist

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-19 | Initial comprehensive testing skill created |
| | | 250+ test items across 20 categories |
| | | 4-hour pre-launch testing sequence |
| | | Complete audit phase coverage (Phases 4-8) |
| | | Ready for production use |

---

## ✨ Features of This Skill

- ✅ **Comprehensive** - 250+ test items covering every feature
- ✅ **Structured** - 20 organized categories
- ✅ **Actionable** - Specific checkboxes for every test
- ✅ **Executable** - Commands ready to run
- ✅ **Documented** - Clear explanations throughout
- ✅ **Timely** - ~4 hours for complete pre-launch testing
- ✅ **Professional** - Enterprise-grade QA standards
- ✅ **Repeatable** - Same process every release
- ✅ **Auditable** - Sign-off and approval tracking
- ✅ **Extensible** - Easy to add new tests

---

## 🎯 Goal

**Every feature in Apex should be tested as if it's the last test before going live.**

This skill ensures that goal is achieved systematically, comprehensively, and with professional QA standards.

**No feature goes to production without passing these tests.**

---

**Created**: 2026-01-19
**For**: Apex GEO/AEO Platform
**Status**: Production Ready
**Last Updated**: 2026-01-19

---

## Quick Navigation

- 📖 [Full Testing Reference (SKILL.md)](./SKILL.md)
- 🏃 [Test Execution Guide (TEST_EXECUTION_GUIDE.md)](./TEST_EXECUTION_GUIDE.md)
- ✅ [Live Testing Checklist (LIVE_TEST_CHECKLIST.md)](./LIVE_TEST_CHECKLIST.md)
