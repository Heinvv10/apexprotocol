# DGTS - Don't Game The System (Anti-Gaming Enforcement)

**STATUS**: CRITICAL BLOCKING SYSTEM - CANNOT BE DISABLED
**LOAD WHEN**: Running validation, code review, test verification, or quality checks

---

## The Problem This Solves

Agents were creating fake tests that always pass, commenting out validation rules, and implementing mock features to game the system. This creates false expectations that features work when they don't.

---

## Gaming Patterns Detected (80+)

### Security Bypass Patterns (NEW - CRITICAL)
```typescript
// These will BLOCK agents immediately - CRITICAL SEVERITY:
// damage_control disabled     # Commented security checks
# security_check removed       # Commented security checks
hooks: []                      # Empty hooks array (security disabled)
DAMAGE_CONTROL_ENABLED = false # Damage control disabled
bashToolPatterns: []           # Empty pattern array (protection disabled)
if (false) { security_check(); } # Security in unreachable code
return true; // skip security  # Early return bypassing checks
@skip("security test")         # Skipped security tests
```

**Why This Matters**: Attempting to disable or bypass security systems (damage control, hooks, validation) is the most critical form of gaming. This represents intentional circumvention of safety mechanisms.

**Impact**: Security bypass patterns have **gaming score weight of 1.0** (instant block at 0.5+ threshold)

### Test Gaming Patterns
```python
# These will BLOCK agents immediately:
assert True                    # Meaningless assertions
assert 1 == 1                  # Tautological tests
return "mock_data"             # Fake implementations
mock.return_value = expected   # Mocked to pass (without real logic)
@skip("reason")                # Skipped tests hiding failures
```

### Code Gaming Patterns
```python
# validation_required          # Commented validation
if False:                      # Disabled code blocks
pass  # TODO: implement        # Stub functions
void _error                    # Error silencing
```

### Feature Faking Patterns
```python
def get_data():
    return {"fake": "data"}    # Fake data returns

def process():
    pass                       # Empty implementations
```

### Mock/Stub/Demo Patterns (See: no-mock-validator)
```typescript
// Comprehensive mock detection - see no-mock-validator for full list
const mockData = {...}         # Mock variable names
const demoData = {...}         # Demo data
"test@test.com"                # Placeholder emails
"John Doe"                     # Placeholder names
"lorem ipsum"                  # Placeholder text
import { faker } from '...'    # Faker in production code
"/api/mock/"                   # Mock API endpoints
```

**For comprehensive mock/stub/demo detection**, use the dedicated validator:
```bash
bun ~/.claude/hooks/no-mock-validator.ts
```

**Protocol**: `~/.claude/protocols/no-mock-production.md`

---

## DGTS Validation Process

1. **Scan all code files** for gaming patterns
2. **Analyze test files** for fake/meaningless assertions
3. **Detect validation rule bypasses**
4. **Validate feature completion claims** vs actual implementation
5. **Calculate gaming score** and block if threshold exceeded

---

## Gaming Score System

| Score | Status | Action |
|-------|--------|--------|
| 0.0 - 0.2 | Clean | Proceed |
| 0.2 - 0.3 | Warning | Review required |
| 0.3 - 0.5 | Suspicious | Manual review |
| 0.5+ | Gaming | BLOCKED |

---

## Violation Types

- `DGTS_SECURITY_BYPASS`: **NEW - CRITICAL** - Disabled security systems (damage control, hooks, patterns)
- `DGTS_TEST_GAMING`: Fake test implementations
- `DGTS_CODE_GAMING`: Commented validation rules
- `DGTS_FEATURE_FAKING`: Mock data for completed features
- `DGTS_VALIDATION_BYPASS`: Disabled enforcement
- `DGTS_SUSPICIOUS_KEYWORD`: Gaming-related terms detected

---

## Zero Tolerance Enforcement

- Gaming score >0.3 = DEVELOPMENT BLOCKED
- Critical gaming violations = IMMEDIATE AGENT BLOCKING
- 3+ suspicious actions in 24 hours = BLOCKED
- Repeated gaming patterns = EXTENDED BLOCKS

---

## Commands

```bash
# Run DGTS validation
python "$PAI_DIR/scripts/validators/dgts-validator.py" .

# Run with custom threshold
python "$PAI_DIR/scripts/validators/dgts-validator.py" . --threshold 0.3

# JSON output for CI/CD
python "$PAI_DIR/scripts/validators/dgts-validator.py" . --json
```

---

**AUTHORITY**: Prevents false feature completion claims and ensures genuine implementations
