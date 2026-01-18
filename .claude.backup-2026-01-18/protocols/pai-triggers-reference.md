# PAI Triggers Reference

**Version**: 1.0
**Last Updated**: 2025-12-22

This document defines the standardized PAI trigger system across all projects.

---

## Overview

PAI has **four distinct trigger systems** with different purposes:

| Trigger | Purpose | Scope | Implementation |
|---------|---------|-------|----------------|
| **@PAI / @Kai** | Load full PAI context | Global (all projects) | Hooks system |
| **@pai-auto** | TDD autonomous loop | Project-specific | Project CLAUDE.md |
| **/auto** | ACH (Autonomous Coding from PRD) | Global skill | `/auto` skill |
| **CPD** | Commit, Push, Deploy with validation | Global (all projects) | Protocol system |

---

## 1. @PAI / @Kai - Global PAI Context Loader

### Purpose
Load extended PAI system context with full details.

### Triggers (Case-insensitive)
- `@PAI` / `@pai`
- `@Kai` / `@kai`
- `hey Kai` / `hi Kai`
- `activate PAI` / `activate Kai`
- `PAI mode` / `Kai mode`

### What It Loads
- Full CORE skill context from `~/.claude/skills/CORE/SKILL.md`
- Complete contact list
- Voice IDs for text-to-speech
- Detailed security procedures
- Extended operational instructions

### Token Impact
- **Without trigger**: ~500 tokens (Tier 2 context only)
- **With trigger**: ~2,750 additional tokens
- **Savings**: ~2,250 tokens per session via progressive disclosure

### Implementation
Handled by global hooks system (`smart-context-loader.ts`).

### Usage Example
```
User: @PAI
Claude: [Loads full PAI context with extended capabilities]
```

---

## 2. @pai-auto - Test-Driven Development Loop

### Purpose
Autonomous agent for TDD workflow within a project.

### Trigger
- `@pai-auto` (recommended standardized trigger)
- **Legacy**: `@pai` (only in projects with TDD CLAUDE.md)

### Behavior
1. **Orient** - Run `pwd && ls -la` to understand project structure
2. **Find Failing Test** - Read `feature_list.json` to find tests with `"passes": false`
3. **Implement Feature** - Read `app_spec.txt` for requirements and write code
4. **Test with Browser** - Verify feature works using Playwright
5. **Mark as Passing** - Update `feature_list.json`
6. **Commit Changes** - Create descriptive git commit
7. **Repeat** - Move to next failing test

### Implementation
Defined in project's `CLAUDE.md` file.

### Requirements
- `feature_list.json` - Test list with pass/fail status
- `app_spec.txt` - Feature requirements documentation

### Usage Example
```
User: @pai-auto
Claude: [Starts autonomous TDD workflow]
  → Checking feature_list.json for failing tests...
  → Found test #42: "User login validation"
  → Reading requirements from app_spec.txt...
  → Implementing feature...
  → Testing with Playwright...
  → Test passing! Committing changes...
  → Moving to next failing test...
```

---

## 3. /auto - Autonomous Coding from PRD (ACH)

### Purpose
Implement features from Product Requirements Document.

### Trigger
- `/auto` (skill invocation)

### Behavior
1. **Read PRD** - Parse Product Requirements Document
2. **Analyze Requirements** - Break down into implementation tasks
3. **Create Plan** - Generate step-by-step implementation plan
4. **Execute Plan** - Implement each task autonomously
5. **Test** - Verify implementation works
6. **Commit** - Create commits for completed work

### Implementation
Global skill system (`/auto` skill).

### Requirements
- PRD document (markdown or structured format)
- Clear feature requirements
- Acceptance criteria

### Scope
Larger feature/epic level implementation (not test-driven).

### Usage Example
```
User: /auto
Claude: [Launches ACH agent]
  → Reading PRD...
  → Found 3 features to implement...
  → Planning implementation strategy...
  → Implementing Feature 1: User Dashboard...
  → Testing Feature 1...
  → Committing Feature 1...
  → Moving to Feature 2...
```

---

## Priority & Conflict Resolution

### Trigger Priority (Highest to Lowest)
1. **Project-specific `@pai-auto`** in CLAUDE.md (if exists)
2. **Global `/auto`** skill invocation
3. **Global `@PAI`** context loader from hooks

### Conflict Handling
- If a project has `@pai-auto` defined in CLAUDE.md → Project-specific TDD agent activates
- If no project-specific definition → Global PAI hook activates
- `/auto` skill is always independent (explicit skill invocation)

---

## Implementation Checklist

### For Project Maintainers

When setting up a new project:

- [ ] **TDD Workflow?**
  - YES → Add `@pai-auto` trigger to project's CLAUDE.md
  - NO → Rely on global `@PAI` context loader

- [ ] **PRD-Based Development?**
  - Use `/auto` skill (no CLAUDE.md changes needed)

- [ ] **Just Need PAI Context?**
  - Use `@PAI` / `@Kai` triggers (no setup needed)

### CLAUDE.md Template for TDD Projects

```markdown
# Project Name - AI Assistant Context

## @pai-auto - Autonomous TDD Agent

When you invoke `@pai-auto`, start the autonomous TDD workflow:

1. Orient: Run `pwd && ls -la`
2. Find next failing test in `feature_list.json`
3. Read requirements from `app_spec.txt`
4. Implement the feature
5. Test with Playwright
6. Mark test as passing in `feature_list.json`
7. Commit changes with descriptive message
8. Repeat until all tests pass

## Project Structure
- `feature_list.json` - Test cases with pass/fail status
- `app_spec.txt` - Feature requirements
- `tests/` - Test files
- `src/` - Application code
```

---

## Migration Guide

### From Legacy `@pai` to Standardized Triggers

**Old (Ambiguous)**:
```
@pai  # Could mean context OR TDD depending on project
```

**New (Clear)**:
```
@PAI       # Always loads PAI context (global)
@pai-auto  # Always starts TDD loop (project-specific)
/auto      # Always starts ACH from PRD (global skill)
```

### Steps to Migrate

1. **Find projects with `@pai` in CLAUDE.md**:
   ```bash
   grep -r "@pai" */CLAUDE.md
   ```

2. **Update to `@pai-auto`**:
   ```bash
   sed -i 's/@pai/@pai-auto/g' ProjectName/CLAUDE.md
   ```

3. **Test in each project**:
   ```
   @pai-auto  # Should trigger TDD workflow
   @PAI       # Should load global context
   /auto      # Should start ACH
   ```

---

## Troubleshooting

### Issue: `@PAI` triggers TDD instead of loading context
**Cause**: Project has legacy `@pai` in CLAUDE.md
**Fix**: Update CLAUDE.md to use `@pai-auto`

### Issue: `/auto` skill not found
**Cause**: ACH skill not installed
**Fix**: Install `/auto` skill in PAI skills directory

### Issue: `@pai-auto` does nothing
**Cause**: Project CLAUDE.md missing TDD definition
**Fix**: Add TDD workflow definition to CLAUDE.md (see template above)

---

## 4. CPD - Commit, Push, Deploy

### Purpose
Complete deployment workflow with full quality validation.

### Trigger
- `CPD` (case-insensitive)

### Full Workflow

**Step 1: Pre-Commit Validation**
1. Run TypeScript type checking (`tsc --noEmit` or equivalent)
2. Run ESLint validation
3. Run Zero Tolerance Quality Check:
   - Zero console.log statements (CRITICAL)
   - Zero catch block violations (CRITICAL)
   - Zero bundle size violations (CRITICAL)
   - All tests passing
4. Run project-specific pre-commit hooks
5. Verify DGTS validation passes
6. Check for AntiHall violations (no hallucinated code)

**Step 2: Commit**
1. Stage all relevant changes
2. Generate descriptive commit message following project conventions
3. Create commit with Claude Code signature:
   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```
4. Run post-commit hooks if configured

**Step 3: Pre-Push Validation**
1. Verify commit was successful
2. Check remote repository status
3. Confirm branch is up to date
4. Run pre-push hooks if configured

**Step 4: Push**
1. Push changes to remote repository
2. Verify push was successful
3. Check for any push hook failures

**Step 5: Deploy (if applicable)**
1. Check if project has deployment configuration
2. Trigger deployment process:
   - Vercel deployment for Next.js apps
   - Custom deployment scripts if configured
   - Docker builds if applicable
3. Monitor deployment status
4. Report deployment URL/status

### Validation Gates (BLOCKING)

These checks **MUST PASS** or CPD will abort:

- ✅ **TypeScript**: Zero type errors
- ✅ **ESLint**: Zero linting errors
- ✅ **Console Logs**: Zero console.log in production code
- ✅ **Error Handling**: All catch blocks properly handled
- ✅ **Tests**: All tests passing
- ✅ **Bundle Size**: Within configured limits
- ✅ **Git Status**: Clean working directory (all changes staged)
- ✅ **Branch Status**: Up to date with remote

### Implementation
Global trigger with project-aware validation.

### Usage Example
```
User: CPD
Claude: [Starting CPD workflow...]

  [1/5] PRE-COMMIT VALIDATION
  → Running TypeScript check... ✅ 0 errors
  → Running ESLint... ✅ 0 errors
  → Running Zero Tolerance check... ✅ All checks passed
  → Running pre-commit hooks... ✅ Passed
  → DGTS validation... ✅ Passed
  → AntiHall check... ✅ No violations

  [2/5] COMMIT
  → Staging changes...
  → Creating commit: "feat: Add user authentication flow"
  → Commit successful (abc123d)

  [3/5] PRE-PUSH VALIDATION
  → Checking remote status... ✅ Up to date
  → Running pre-push hooks... ✅ Passed

  [4/5] PUSH
  → Pushing to origin/main... ✅ Successful

  [5/5] DEPLOY
  → Detected Vercel project
  → Triggering deployment... ✅ Started
  → Deployment URL: https://your-app.vercel.app
  → Status: Building... ✅ Success

  ✅ CPD Complete!
```

### Error Handling

If ANY validation fails, CPD will:
1. **STOP** immediately (fail-fast)
2. **REPORT** which check failed
3. **SUGGEST** how to fix the issue
4. **NOT PROCEED** to next steps

Example failure:
```
User: CPD
Claude: [Starting CPD workflow...]

  [1/5] PRE-COMMIT VALIDATION
  → Running TypeScript check... ❌ FAILED

  Found 3 type errors:
  - src/utils/auth.ts:45 - Type 'string | undefined' is not assignable to type 'string'
  - src/components/Login.tsx:12 - Property 'user' does not exist on type '{}'
  - src/pages/dashboard.tsx:89 - Cannot find name 'userData'

  ❌ CPD ABORTED - Fix TypeScript errors before committing

  Suggested fix: Run `npm run type-check` to see full errors
```

---

## Best Practices

1. **Use Explicit Triggers**: Don't rely on ambiguous triggers like `@pai`
2. **Document in CLAUDE.md**: Clearly document which triggers are available in each project
3. **Test After Changes**: Always test triggers after updating CLAUDE.md
4. **Keep Consistent**: Use the same naming across all projects
5. **Version Control**: Commit CLAUDE.md changes with clear messages
6. **CPD for Production**: Always use CPD instead of manual commits for production code

---

## Reference Links

- **Global PAI Context**: `~/.claude/skills/CORE/SKILL.md`
- **Smart Context Loader**: `~/.claude/hooks/smart-context-loader.ts`
- **Protocol System**: `~/.claude/protocols/`
- **Skills Directory**: `~/.claude/skills/`

---

**Questions?** Invoke `@PAI` to load full PAI context with detailed operational procedures.
