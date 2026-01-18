# Zero Tolerance Quality Gates

**STATUS**: AUTOMATIC BLOCKING
**LOAD WHEN**: Code review, pre-commit validation, quality checks

---

## Critical Patterns - Automatic Blocking

### Console.log Statements
**ZERO TOLERANCE** - All console.* statements BLOCKED

```typescript
// BLOCKED
console.log('debug');
console.error('error');
console.warn('warning');

// CORRECT - Use proper logger
import { log } from '@/lib/logger';
log.info('message', data, 'component');
```

### Undefined Error References
**ZERO TOLERANCE** - All catch blocks must have error parameters

```typescript
// BLOCKED
catch {
  // no error parameter
}

// BLOCKED
catch (_error) {
  // unused error
}

// CORRECT
catch (error: unknown) {
  log.error('Operation failed', error, 'component');
}
```

### Bundle Size Violations
**ZERO TOLERANCE** - Max 500kB per chunk

### Void Error Anti-patterns
**ZERO TOLERANCE** - No error silencing

```typescript
// BLOCKED
void _error;

// BLOCKED
catch { }

// CORRECT
catch (error: unknown) {
  handleError(error);
}
```

---

## Validation Command

```bash
# Run Zero Tolerance validation
python "$PAI_DIR/scripts/validators/zero-tolerance-validator.py" .

# Run DGTS validation
python "$PAI_DIR/scripts/validators/dgts-validator.py" .

# Run both (full PAI validation)
python "$PAI_DIR/scripts/validators/zero-tolerance-validator.py" . && \
python "$PAI_DIR/scripts/validators/dgts-validator.py" .
```

---

## Quality Standards

| Standard | Requirement |
|----------|-------------|
| Type Coverage | 100% - No implicit 'any' |
| File Size | Max 300 lines |
| Typing | 100% TypeScript/Python |
| Testing | >95% coverage |
| Linting | Zero errors, zero warnings |
| Security | Input validation, error handling |
| Performance | Page load <1.5s, API <200ms |

---

## Pre-Commit Validation Checks

1. Zero TypeScript compilation errors (CRITICAL)
2. Zero ESLint errors/warnings (CRITICAL)
3. Zero console.log statements (CRITICAL)
4. Zero catch block violations (CRITICAL)
5. Zero bundle size violations (CRITICAL)
6. Zero void error anti-patterns (CRITICAL)
7. No commented-out code
8. Playwright tests passing
9. All rules compliance

---

## Blocking Behavior

**Commits are BLOCKED if ANY validation fails**

This prevents:
- Debug statements in production
- Silent error swallowing
- Type safety violations
- Bundle bloat
- Test failures reaching main branch
