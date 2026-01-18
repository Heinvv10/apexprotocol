# AntiHall Validator - AI Hallucination Prevention

**STATUS**: MANDATORY BEFORE CODING
**LOAD WHEN**: Suggesting code changes, referencing methods, or working with existing codebase

---

## Purpose

Validate ALL AI-suggested code exists in codebase BEFORE suggesting it. Prevents hallucinating methods, components, or APIs that don't exist.

---

## Required Validations

Before suggesting ANY code, validate:

| Type | Example | Command |
|------|---------|---------|
| Service Methods | `authService.login` | `npm run antihall:check "authService.login"` |
| Components | `ProjectListComponent` | `npm run antihall:check "ProjectListComponent"` |
| Hooks | `useNeonProjects` | `npm run antihall:check "useNeonProjects"` |
| Routes | `/app/projects` | `npm run antihall:check "/app/projects"` |
| Database Collections | `projects collection` | `npm run antihall:check "projects collection"` |

---

## Commands

```bash
# Parse codebase (run after major changes)
npm run antihall:parse

# Validate code exists
npm run antihall:check "code to validate"

# Find correct names
npm run antihall:find "searchTerm"

# Show statistics
npm run antihall:stats
```

---

## Validation Protocol

1. **Before referencing any method/component**, run antihall:check
2. **If validation fails**, use antihall:find to locate correct name
3. **If method doesn't exist**, state clearly it needs to be created
4. **Never assume** - always verify

---

## Impact Metrics

| Metric | Value |
|--------|-------|
| Time saved per hallucination | ~40 minutes |
| Detection speed | 2 seconds vs 40 minutes debugging |
| Accuracy | 100% prevention of non-existent code |

---

## The Rule

**NEVER suggest code without validation. If unsure, check first!**

Common hallucination patterns to watch for:
- Suggesting methods that "should" exist but don't
- Referencing components from similar projects
- Assuming API endpoints follow a pattern
- Using hooks that were never created
- Calling services with wrong method names

---

## When AntiHall Fails

If antihall:check returns "NOT FOUND":
1. Do NOT proceed with the suggestion
2. Use antihall:find to search for similar names
3. If nothing found, clearly state: "This method does not exist and needs to be created"
4. Provide implementation if requested
