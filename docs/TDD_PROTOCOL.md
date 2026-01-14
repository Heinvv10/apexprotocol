# Test-Driven Development (TDD) Protocol

## Overview

This document establishes the mandatory Test-Driven Development (TDD) protocol for all future Apex development work, following the correction and implementation of the TDD-first approach starting with Phase M2 (Webhook Integration & Real-Time Event Processing).

## What is TDD?

Test-Driven Development is a software development methodology where tests are written **BEFORE** implementation code:

1. **Write Tests First** - Define expected behavior through test cases
2. **Write Implementation Code** - Write code to pass the tests
3. **Verify All Tests Pass** - Ensure implementation satisfies all requirements
4. **Commit with Green Tests** - Only commit when all tests pass

## Phase M1 Retrospective

### What Went Wrong
- Implementation was done FIRST
- Tests were added RETROACTIVELY (after implementation was complete)
- This violated core TDD principles
- Tests should have been created before any code was written

### Correction Made
- Created comprehensive test suite for Phase M1 (204 tests)
- All tests now PASSING ✓
- Established this protocol for all future phases
- Commit: `951bbee4` - "tests(marketing): Complete Phase M1 test suite (204 tests)"

### Phase M1 Test Results
```
Test Files:     8 passed
Tests:         204 passed

Coverage:
- API Wrappers (4 clients):
  • Mautic: 8 tests (OAuth2 authentication, campaign retrieval)
  • ListMonk: 11 tests (Basic auth, list/campaign management)
  • Postiz: 13 tests (Bearer token, social post scheduling)
  • Matomo: 17 tests (URL param auth, analytics metrics)

- Webhook Handlers (3 handlers):
  • Mautic: 23 tests (lead/email events)
  • ListMonk: 31 tests (subscriber/campaign events)
  • Postiz: 36 tests (social post/engagement events)

- Database Schema:
  • 65 comprehensive schema validation tests
  • Relationships, constraints, and enums tested
```

## Going Forward: Mandatory TDD Workflow

### For EVERY Feature/Component

**STEP 1: Write Tests First**
```bash
# Create test file BEFORE any implementation
tests/[feature]/[component].test.ts
```

Test should cover:
- Happy path (normal operation)
- Error cases (failures, validation)
- Edge cases (boundary conditions)
- Data transformations
- External integrations
- Database operations

**STEP 2: Run Tests (They Will Fail)**
```bash
npm test -- tests/[feature]/[component].test.ts
# Expected: All tests FAIL (red)
```

**STEP 3: Implement Code to Pass Tests**
```bash
# Write implementation in src/
# Minimum code needed to pass tests
```

**STEP 4: Run Tests Again (They Will Pass)**
```bash
npm test -- tests/[feature]/[component].test.ts
# Expected: All tests PASS (green)
```

**STEP 5: Refactor if Needed**
- Improve code quality
- Extract common patterns
- Maintain test coverage
- Re-run tests to ensure nothing broke

**STEP 6: Commit Only When Green**
```bash
# Commit ONLY when all tests pass
git commit -m "feat: [feature name]"
```

## Phase M1 Example Structure

### API Wrapper Tests
```typescript
describe('MauticClient', () => {
  describe('Authentication', () => {
    it('should authenticate with OAuth2 password grant', async () => {
      // Test implementation
    });
  });

  describe('getCampaigns', () => {
    it('should fetch campaigns with pagination', async () => {
      // Test implementation
    });
  });
});
```

### Webhook Handler Tests
```typescript
describe('Mautic Webhook Handler', () => {
  describe('lead.create event', () => {
    it('should create new lead in database', async () => {
      // Test implementation
    });
  });

  describe('email.open event', () => {
    it('should increment lead score by 5', () => {
      // Test implementation
    });
  });
});
```

### Database Schema Tests
```typescript
describe('Marketing Database Schema', () => {
  describe('Leads Table', () => {
    it('should have required contact fields', () => {
      // Test implementation
    });

    it('should support all lead statuses', () => {
      // Test implementation
    });
  });
});
```

## Test Quality Standards

### What Tests Must Include

1. **Assertions** - Every test must verify specific behavior
   ```typescript
   expect(result).toBe(expectedValue);
   expect(array).toHaveLength(3);
   expect(function).toThrow(Error);
   ```

2. **Mocking** - External dependencies must be mocked
   ```typescript
   global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });
   const mockDb = { insert: vi.fn().mockReturnThis() };
   ```

3. **Setup/Teardown** - Initialize state before each test
   ```typescript
   beforeEach(() => {
     mockDb = createMockDatabase();
     vi.clearAllMocks();
   });
   ```

4. **Edge Cases** - Test boundary conditions
   ```typescript
   it('should handle empty input', () => { /* ... */ });
   it('should handle null values', () => { /* ... */ });
   it('should handle very large numbers', () => { /* ... */ });
   ```

5. **Error Handling** - Verify error scenarios
   ```typescript
   it('should throw error on authentication failure', () => {
     expect(client.authenticate()).rejects.toThrow('Auth failed');
   });
   ```

### Test Naming Convention

Tests should be named to describe the behavior:
```typescript
// Good
it('should increment lead score by 5 on email open')
it('should create new lead with correct fields')
it('should throw error for missing email address')

// Bad
it('test 1')
it('should work')
it('email handling')
```

## Phase M2 Implementation (Starting Point)

Phase M2: "Webhook Integration & Real-Time Event Processing"

### Task 1: Create Tests First
1. Define what webhook events need to be processed
2. Write tests for event processing logic
3. Write tests for database operations
4. Write tests for error handling

### Task 2: Implement Code to Pass Tests
1. Implement webhook event handlers
2. Implement database operations
3. Implement error handling
4. Verify all tests pass

### Task 3: Commit with Green Tests
1. Ensure 100% test pass rate
2. Create meaningful commit message
3. Include test count in commit

## Useful Commands

```bash
# Run all tests
npm test

# Run tests for specific feature
npm test -- tests/api/marketing

# Run tests with watch mode (auto-rerun on file changes)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/api/marketing/mautic.test.ts --run

# Run specific test by name pattern
npm test -- --grep "should increment lead score"
```

## Benefits of TDD

1. **Fewer Bugs** - Tests catch errors early
2. **Better Design** - Tests drive cleaner code
3. **Faster Debugging** - Tests pinpoint issues
4. **Regression Prevention** - Tests prevent breaking changes
5. **Documentation** - Tests show how code works
6. **Confidence** - Green tests = working code

## Anti-Patterns to Avoid

❌ **Don't do this:**
- Write implementation first, tests later
- Write tests that just check the same logic as code
- Skip testing edge cases
- Skip testing error conditions
- Write tests that always pass (even if implementation is wrong)
- Commit code with failing tests

✅ **Do this:**
- Write tests first (red → green → refactor)
- Test expected behavior, not implementation details
- Test happy path AND error cases
- Test edge cases and boundaries
- Write failing tests that pass only when code is correct
- Commit ONLY when all tests pass

## Questions?

Refer to Phase M1 test examples in:
- `tests/api/marketing/*.test.ts` - API wrapper tests
- `tests/webhooks/*-webhook.test.ts` - Webhook handler tests
- `tests/lib/db/schema/marketing.test.ts` - Database schema tests

All contain examples of:
- How to structure tests
- How to mock external dependencies
- How to test authentication
- How to test data transformations
- How to test error handling
