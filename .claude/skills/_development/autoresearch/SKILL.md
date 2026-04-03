---
name: autoresearch
description: "Autonomous codebase analysis that spawns parallel agents to examine architecture, code quality, performance, security, DX, and dependencies — then synthesizes findings into a prioritized improvement report with auto-fix capabilities. USE WHEN the user says 'autoresearch', 'analyze codebase', 'codebase audit', 'code review everything', 'how can we improve', 'find issues', 'codebase health check', or wants a comprehensive automated review of the Apex project."
---

# AutoResearch Skill — Apex Edition

## Purpose

Perform a comprehensive, parallelized audit of the Apex GEO/AEO codebase by spawning specialized research agents. Each agent focuses on a different quality dimension. Findings are synthesized into a single prioritized improvement report and optionally auto-fixed.

## When to Use

- User says "autoresearch", "run autoresearch", "analyze this codebase"
- User asks "how can we improve this project"
- User wants a full codebase health check or audit
- Triggered by weekly cron schedule (Sunday 2 AM)

## Apex-Specific Focus Areas

Beyond standard code quality, Apex audits must check:
- **Design System Compliance** — 3-tier card hierarchy, color palette, glassmorphism rules
- **White-Label Architecture** — tenant isolation, config-driven branding
- **GEO/AEO Domain Logic** — scoring algorithms, AI platform integrations, monitoring accuracy
- **API Route Security** — Clerk auth on all routes, CRON_SECRET validation
- **Feature List Coverage** — feature_list.json pass/fail alignment with actual implementation

## Research Dimensions

Launch **8 parallel agents** (sonnet model), each investigating one dimension:

### 1. Architecture Agent
- Next.js App Router structure and organization
- Component coupling and cohesion
- Route organization (auth, dashboard, API)
- Shared vs duplicated code across modules
- Module boundaries: monitor, create, audit, recommendations, admin

### 2. Code Quality Agent
- TypeScript strictness (zero `any` types per Zero Tolerance)
- Error handling (no empty catches, no console.log — use proper logger)
- Code duplication (DRY violations)
- File sizes (flag files > 300 lines per PAI protocol)
- Dead code and unused exports
- Consistent naming conventions

### 3. Performance Agent
- Bundle size (large imports, tree-shaking issues)
- React re-render patterns (missing memo, unstable refs)
- Data fetching waterfalls (TanStack Query misuse)
- Image optimization (next/image usage)
- SSR vs CSR decisions on dashboard pages
- Redis caching effectiveness

### 4. Security Agent
- Exposed secrets or credentials
- Clerk auth middleware coverage
- CRON_SECRET validation on all cron routes
- Input validation with Zod on API routes
- XSS vectors in user-generated content
- SQL injection via Drizzle ORM misuse
- Dependency vulnerabilities (package.json audit)

### 5. Developer Experience (DX) Agent
- Build and dev tooling (scripts, bun config)
- Test coverage and quality (no fake tests per DGTS)
- Linting and formatting setup
- Documentation gaps
- CI/CD pipeline quality
- Dev environment setup friction

### 6. Dependencies & Infra Agent
- Outdated or vulnerable dependencies
- Unused dependencies in package.json
- Docker configuration health
- Nginx reverse proxy config
- Environment variable management
- Database migration state (Drizzle)

### 7. Design System Compliance Agent
- Card hierarchy usage (card-primary/secondary/tertiary)
- Color palette adherence (#0a0f1a, #141930, #00E5CC, #8B5CF6)
- Glassmorphism restricted to modals only
- Typography consistency
- Responsive design patterns
- Component library (Shadcn/ui) usage

### 8. Feature Coverage Agent
- Parse feature_list.json for pass/fail status
- Cross-reference with actual implementation
- Identify features marked passing but broken
- Identify features marked failing but actually implemented
- Calculate real completion percentage
- Flag stale or orphaned test entries

## Execution Workflow

### Step 1: Context Gathering (Main Agent)
Before spawning researchers, quickly gather:
```
- package.json (deps, scripts, versions)
- tsconfig.json (TS strictness config)
- Project structure (top-level + src/ dirs)
- Git log --oneline -20 (recent activity)
- CLAUDE.md (project rules)
- feature_list.json summary (total/passing/failing counts)
```

### Step 2: Spawn 8 Parallel Research Agents
Launch all 8 agents simultaneously using the Agent tool with `model: "sonnet"`. Each agent:
- Receives the project context from Step 1
- Focuses ONLY on its assigned dimension
- Uses Glob, Grep, Read tools to investigate
- Returns findings as a structured report with:
  - **Critical Issues** (must fix — blocks deployment or breaks functionality)
  - **Warnings** (should fix — tech debt or degraded quality)
  - **Suggestions** (nice to have — improvements for maintainability)
  - Each item includes: file path, line number, description, suggested fix

### Step 3: Synthesis (Main Agent — Opus)
After all agents return, synthesize into a single report:

```markdown
# Apex AutoResearch Report
**Date:** YYYY-MM-DD
**Commit:** [short hash]
**Files Analyzed:** N
**Issues Found:** N critical, N warnings, N suggestions

## Executive Summary
[2-3 sentence overview of codebase health]

## Health Scores
| Dimension | Score | Trend |
|-----------|-------|-------|
| Architecture | X/10 | ↑↓→ |
| Code Quality | X/10 | ↑↓→ |
| Performance | X/10 | ↑↓→ |
| Security | X/10 | ↑↓→ |
| DX | X/10 | ↑↓→ |
| Dependencies | X/10 | ↑↓→ |
| Design System | X/10 | ↑↓→ |
| Feature Coverage | X/10 | ↑↓→ |
| **Overall** | **X/10** | ↑↓→ |

## Critical Issues (Fix Now)
1. [Issue] — `file:line` — [why it matters] — [suggested fix]

## Warnings (Fix Soon)
1. [Issue] — `file:line` — [why it matters]

## Suggestions (Improve Over Time)
1. [Issue] — `file:line` — [why it matters]

## Quick Wins (< 30 min each)
- [ ] Fix 1
- [ ] Fix 2

## Feature Progress
- Total: N features
- Passing: N (X%)
- Failing: N
- Next priority: [feature name]

## Recommended Roadmap
1. **This week:** [critical fixes]
2. **Next 2 weeks:** [warnings]
3. **Ongoing:** [suggestions]
```

### Step 4: Save Report
Save to: `docs/autoresearch/YYYY-MM-DD_report.md`

Also maintain a rolling summary at: `docs/autoresearch/LATEST.md` (symlink or copy)

### Step 5: Compare with Previous (if exists)
If a previous report exists in `docs/autoresearch/`:
- Calculate trend arrows (↑ improved, ↓ regressed, → stable)
- Highlight newly introduced issues since last report
- Call out resolved issues

## Agent Prompt Template

Each agent receives:
```
You are a [DIMENSION] specialist analyzing the Apex GEO/AEO platform at /home/hein/Workspace/Apex.

Project: Next.js 14+ App Router, TypeScript, Tailwind, Shadcn/ui, Drizzle ORM, PostgreSQL, Redis, Clerk auth.

Context: [CONTEXT FROM STEP 1]

Investigate [DIMENSION] concerns using Glob, Grep, and Read tools.
Focus on actionable findings with specific file paths and line numbers.
Do NOT make code changes — research only.

Return findings in this format:
## [DIMENSION] Analysis

### Critical Issues
- `file:line` — Description. **Fix:** suggestion.

### Warnings
- `file:line` — Description. **Fix:** suggestion.

### Suggestions
- `file:line` — Description. **Fix:** suggestion.

### Score: X/10
### Summary: [2 sentences]
```

## Auto-Fix Mode (Optional)

When invoked with `--fix` or when the user says "fix the issues":
1. Run the full audit first
2. For each Quick Win, spawn a fix agent (sonnet) to implement the change
3. Run the project's lint/type-check after fixes
4. Commit fixes with message: `fix: autoresearch quick wins [YYYY-MM-DD]`

## Important Rules

- Do NOT make code changes during research phase — read-only
- Always include specific file paths and line numbers
- Prioritize actionable findings over theoretical concerns
- Use `model: "sonnet"` for all 8 research agents
- Main synthesis done by the invoking agent (opus)
- Respect PAI protocols: NLNH (no hallucinated issues), DGTS (real findings only)
- Reports are cumulative — compare with previous runs when available
