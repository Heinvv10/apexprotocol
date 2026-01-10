# Apex - Project Memory

**Path**: `C:\Jarvis\AI Workspace\Apex`
**Session ID**: `apex-pai-integrated`
**Last Updated**: 2026-01-10

---

## Current State

**PAI Integration Complete**: Apex now has full PAI infrastructure integration with hooks, skills, protocols, and MCP servers.

### Active Features
- GEO/AEO Platform - White-label for AI search engine visibility
- Dashboard-first UI (not chat-based)
- 7+ AI platform monitoring (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek)
- Smart Recommendations Engine
- Content generation with brand voice
- Technical site audit
- Autonomous feature implementation via feature_list.json

### Technology Stack
- **Frontend**: Next.js 14+ App Router, React 19, TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Next.js API Routes, PostgreSQL (Neon), Drizzle ORM
- **Auth**: Clerk (multi-tenant, SSO, MFA, RBAC)
- **AI**: Anthropic Claude API (primary), OpenAI GPT-4 (secondary)
- **Deployment**: VPS Docker (72.61.197.178), Nginx reverse proxy
- **Testing**: Vitest, Playwright
- **State**: Zustand (client), TanStack Query (server)

---

## Recent Progress

### PAI Integration (2026-01-10)
- ✅ Created complete .claude directory structure
- ✅ Copied 9 essential hooks (session-start, user-prompt-submit, session-stop)
- ✅ Copied all 9 protocols (NLNH, DGTS, Zero Tolerance, etc.)
- ✅ Copied 8 priority skills (CORE, auto, research, meta-prompting, etc.)
- ✅ Configured 7 MCP servers (context7, memory, github, playwright, etc.)
- ✅ Set up project memory system
- ✅ Updated settings.local.json with PAI permissions

### Active Hooks
- `initialize-session.ts` - Session initialization
- `load-project-memory.ts` - Load project context
- `mcp-auto-reconnect.ts` - Reconnect MCP servers
- `mcp-health-checker.ts` - Health check MCPs
- `auto-meta-prompt-clarification.ts` - Auto-clarify vague prompts
- `model-router.ts` - Route to optimal model tier
- `proactive-scanner.ts` - Scan for code quality issues
- `capture-session-summary.ts` - Capture session summary
- `memory-maintenance-hook.ts` - Update memories

### Active Skills
- **CORE** - PAI system core
- **auto** - Autonomous development workflow
- **create-skill** - Skill creation guide
- **fabric** - Pattern selection for prompts
- **meta-prompting** - Prompt clarification system
- **pai-diagnostics** - Health checks
- **prompt-enhancement** - Prompt optimization
- **research** - Multi-source research
- **coding-specialists** - Next.js specialists (existing)
- **project-codebase** - Codebase analysis (existing)

### Active Protocols
- **antihall-validator.md** - Prevent hallucinations
- **dgts-validation.md** - "Don't Give Them Shit" quality
- **nlnh-protocol.md** - "No Lies, No Hallucinations" truthfulness
- **doc-driven-tdd.md** - Test-driven development
- **zero-tolerance-quality.md** - Zero errors policy
- **forbidden-commands.md** - Safety protocols
- **playwright-testing.md** - Browser automation
- **pai-triggers-reference.md** - PAI commands

---

## Key Decisions

### Design System
- Single source of truth: `docs/APEX_DESIGN_SYSTEM.md` (v4.0)
- 3-tier card hierarchy mandatory: card-primary/secondary/tertiary
- Colors: Deep space navy (#0a0f1a), Apex cyan (#00E5CC), Purple (#8B5CF6)
- No pure black backgrounds, glassmorphism for modals only

### Architecture
- White-label system (5-layer customization)
- Autonomous coding agent personality
- Feature tracking via feature_list.json
- Truth-first development (NLNH protocol)
- Zero tolerance for errors (TypeScript strict, no console.log, proper error handling)

### Workflow
1. Find next failing test in feature_list.json
2. Implement feature
3. Test with Playwright browser automation
4. Update feature_list.json to mark as passing
5. Commit changes
6. Repeat

---

## Tech Stack & Context

### Frontend Patterns
- Server components by default
- Client components with "use client" directive
- Form validation: React Hook Form + Zod
- Data fetching: TanStack Query
- State management: Zustand for global state
- UI components: Shadcn/ui with Radix primitives

### Backend Patterns
- API routes in app/api/
- Database queries via Drizzle ORM
- Redis caching (Upstash)
- Background jobs: BullMQ
- Vector search: Pinecone

### Testing Patterns
- Unit tests: Vitest
- E2E tests: Playwright
- Visual regression: Playwright screenshots
- Browser automation: chrome-devtools-mcp

---

## Important Notes

### Critical Rules
- NEVER ask "What would you like me to work on?" - autonomous agent
- ALWAYS use APEX_DESIGN_SYSTEM.md for UI implementation
- ALWAYS validate against feature_list.json
- NEVER use pure black (#000000) backgrounds
- ALWAYS use 3-tier card hierarchy
- NEVER commit without Zero Tolerance validation
- ALWAYS test with Playwright browser automation

### Safety Protocols
- No destructive git commands without confirmation
- No force push to main/master
- No process killing without user permission
- No secrets in commits (.env, credentials.json)

### PAI Integration Benefits
1. Automated quality gates via pre-commit hooks
2. Smart prompt clarification via meta-prompting
3. Autonomous development via auto skill
4. Truth-first development via NLNH/DGTS protocols
5. Browser automation via Playwright/chrome-devtools
6. Persistent memory via memory MCP
7. Documentation lookup via context7 MCP
8. Prompt enhancement via claude-prompts MCP

---

## Blockers & Questions

None currently.

---

## Next Steps

1. Test PAI integration works correctly
2. Verify all hooks execute properly
3. Test MCP servers connectivity
4. Validate protocols enforcement
5. Continue autonomous feature implementation

---

This project-specific context is now active with full PAI integration.
