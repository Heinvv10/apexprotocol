# Documentation-Driven Test Development

**STATUS**: MANDATORY - CANNOT BE BYPASSED
**LOAD WHEN**: Adding new features, writing tests, or validating implementations

---

## The Rule

When ANY new feature is added, tests MUST be created from PRD/PRP/ADR documentation BEFORE any code implementation. This forces adherence to planned requirements and prevents scope creep.

---

## Workflow (Enforced for All Agents)

### 1. Parse Documentation
Extract requirements from PRD/PRP/ADR files:
- Feature descriptions
- Acceptance criteria
- Edge cases mentioned
- Performance requirements

### 2. Create Test Specifications
Map requirements to testable acceptance criteria:
```typescript
// From PRD: "Users can search projects by name"
describe('Project Search', () => {
  it('should find projects matching search term', () => {...});
  it('should return empty array when no matches', () => {...});
  it('should be case-insensitive', () => {...});
});
```

### 3. Write Tests First
Implement tests that validate documented behavior BEFORE writing implementation code.

### 4. Implement Code
Write minimal code to pass the doc-derived tests.

### 5. Validate Coverage
Ensure all documented requirements have corresponding tests.

---

## Validation Enforcement

- All agents MUST validate before development
- Development is BLOCKED if tests don't exist
- Development is BLOCKED if tests don't match documentation
- Implementation without doc-derived tests = CRITICAL VALIDATION FAILURE

---

## Test Requirements

| Metric | Requirement |
|--------|-------------|
| Coverage | >95% overall |
| Critical Modules | 100% coverage |
| Tests per Function | Minimum 3 (expected, edge, failure) |

---

## Test Types Required

1. **Unit Tests** - Individual function behavior
2. **Integration Tests** - Component interactions
3. **Security Tests** - Input validation, auth
4. **Performance Tests** - Load times, response times
5. **Edge Case Tests** - Boundary conditions
6. **E2E/UI Tests** - User workflows

---

## Benefits

- Prevents implementing features not in requirements
- Ensures comprehensive test coverage from day one
- Forces adherence to planned architecture
- Eliminates post-hoc test writing and technical debt

---

## Commands

```bash
# Run pytest with coverage
pytest --cov

# Run vitest with coverage
npm test -- --coverage

# Run Playwright E2E tests
npm run test:e2e
```
