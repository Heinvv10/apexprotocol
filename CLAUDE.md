# CLAUDE.md - Apex GEO/AEO Platform

**This is NOT FibreFlow, BOSS Communications, or any other project.** Ignore parent-directory CLAUDE.md files.

## Working Mode

Apex has an autonomous development workflow (`/auto`) that picks the next failing test, implements it, verifies it, and commits. When invoked that way, run end-to-end without asking — the loop is the user.

In **interactive sessions**, prefer autonomous progress but ask when genuinely blocked (ambiguous spec, risky/irreversible action, missing credentials).

## Project Context

**Apex** is a white-label GEO/AEO (Generative Engine Optimization / Answer Engine Optimization) platform. It helps brands capture visibility across AI-powered search:

- **MONITOR** — brand mentions across 7+ AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek)
- **CREATE** — AI-optimized content using brand voice and data
- **AUDIT** — technical site analysis for AI visibility
- **SMART RECOMMENDATIONS ENGINE** — auto-generated prioritized actions

Differentiators: dashboard-first UI (not chat), white-label architecture, PPP-adjusted pricing for African markets.

## PAI Integration (2026-01-10)

- 9 Hooks, 9 Protocols, 8 Priority Skills, 7 MCP Servers, project memory

Key commands: `/pai-status`, `/auto`, `/research`, `/fabric`

References:
- Integration: `docs/PAI_INTEGRATION_COMPLETE.md`, `docs/PAI_INTEGRATION_PLAN.md`
- Memory: `.claude/memories/projects/apex.md`
- Protocols: `.claude/protocols/*.md`
- Skills: `.claude/skills/*/SKILL.md`

## Technology Stack

**Frontend:** Next.js 14+ App Router, TypeScript strict, Tailwind + Shadcn/ui, Zustand + TanStack Query, Recharts, React Hook Form + Zod.

**Backend:** Next.js API Routes (App Router), **Supabase Postgres** via `drizzle-orm/node-postgres` (see `src/lib/db/index.ts`), `@supabase/ssr` + `@supabase/supabase-js` for auth-aware client. Redis (Upstash), BullMQ, Pinecone (vector).

**AI:** Anthropic Claude (primary), OpenAI GPT-4 (secondary), `text-embedding-3-small`.

**Auth:** Clerk (multi-tenant, SSO, MFA, RBAC).

**Deployment:** VPS Docker at `72.61.197.178` — Docker Compose + Nginx reverse proxy.

## Design System (MANDATORY)

**Single source of truth:** `docs/APEX_DESIGN_SYSTEM.md` (v4.0). All other UI docs archived to `docs/archive/`.

Colors: `#0a0f1a` bg, `#141930` cards, `#00E5CC` primary (Apex cyan), `#8B5CF6` purple, `#22C55E`/`#F59E0B`/`#EF4444` for success/warning/error.

3-tier card hierarchy (MANDATORY — use these, not basic `<Card>`):
```tsx
<div className="card-primary">   {/* Main KPIs, GEO Score */}
<div className="card-secondary"> {/* Charts, recommendations */}
<div className="card-tertiary">  {/* List items, activity */}
```

Rules: glassmorphism for modals only, max 3-4 accent colors per view, no pure `#000000`. CSS in `src/app/globals.css`. Visual reference: `docs/images UI/Dash idea.png`.

## Key Files

- `app_spec.txt` — full project specification (READ FIRST)
- `feature_list.json` — checklist of features (see caveat below)
- `src/lib/db/index.ts` — DB client (Drizzle + node-postgres against Supabase)

### Documentation (`docs/`)
`VISUAL_DESIGN_RESEARCH.md`, `BRAND_VALUES_AND_POSITIONING.md`, `WHITE_LABEL_ARCHITECTURE.md`, `UI_WIREFRAMES.md`, `UI_UX_DESIGN_STRATEGY.md`, `SMART_RECOMMENDATIONS_ENGINE_TECHNICAL_SPEC.md`, `SEARCHABLE_RESEARCH_REPORT.md`, `SEARCHABLE_COMPETITIVE_ANALYSIS.md`, `IMPLEMENTATION_ROADMAP.md`.

## Autonomous Workflow Truth-Signals

`feature_list.json` is a **checklist**, not a source of truth — many entries claim `passes: true` but have silently regressed (e.g. citations bug fixed 2026-04-16). See `FEATURE_VERIFICATION.md`.

Trusted signals, in order:
1. `npx tsc --noEmit` passes
2. `npx vitest run` passes
3. `e2e/*.spec.ts` Playwright smoke passes
4. Manual browser verification of affected flow
5. **Only then** update `feature_list.json`

Never mark a feature `passes: true` without running the real test.

## Screenshot Size Limits

**Large screenshots crash the session.** Before any screenshot:
1. `mcp__playwright__browser_resize(width=800, height=600)`
2. Use `type: "jpeg"` (not PNG)
3. Screenshot specific elements via `ref`
4. Prefer `browser_snapshot` when possible

## DO NOT

- Reference FibreFlow, BOSS Communications, or sibling projects
- Use technologies not in `app_spec.txt`
- Pick up context from parent directories

## Project Structure

```
apex/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Authentication routes
│   ├── (dashboard)/        # monitor/ create/ audit/ recommendations/
│   └── api/                # API routes
├── components/             # ui/ (Shadcn), dashboard/, shared/
├── lib/                    # db/ (Drizzle), ai/, scraping/ (Playwright)
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
└── types/                  # TypeScript types
```
