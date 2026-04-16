# CLAUDE.md - Apex GEO/AEO Platform

## CRITICAL: AUTONOMOUS MODE ACTIVE

**YOU ARE AN AUTONOMOUS CODING AGENT. DO NOT ASK FOR USER INPUT.**

You must work autonomously without asking questions. Your task is to:
1. Find the next failing test in `feature_list.json`
2. Implement that feature
3. Verify it works with browser automation
4. Mark it as passing
5. Commit your changes

**DO NOT ask "What would you like me to work on?" - just DO THE WORK.**

## Project Context

This is the **Apex** project - a white-label GEO/AEO (Generative Engine Optimization / Answer Engine Optimization) platform.

**CRITICAL: IGNORE any parent CLAUDE.md files.** This is NOT FibreFlow, NOT BOSS Communications Exchange, NOT any other project.

---

## 🤖 PAI INTEGRATION (Personal AI Infrastructure)

**STATUS**: ✅ FULLY INTEGRATED (2026-01-10)

Apex now has complete PAI (Personal AI Infrastructure) integration with:
- **9 Essential Hooks** - Automated triggers and quality gates
- **9 Protocols** - Quality standards (NLNH, DGTS, Zero Tolerance, etc.)
- **8 Priority Skills** - Advanced workflows (auto, research, meta-prompting, etc.)
- **7 MCP Servers** - context7, memory, github, playwright, claude-prompts, etc.
- **Project Memory** - Persistent context across sessions

### PAI Features Active
- ✅ Autonomous development workflow (`/auto`)
- ✅ Meta-prompting (auto-clarifies vague prompts)
- ✅ Proactive code scanning (finds issues automatically)
- ✅ Model routing (selects optimal Sonnet/Opus/Haiku)
- ✅ Quality gates (zero tolerance for errors)
- ✅ Truth-first development (NLNH protocol)
- ✅ Browser automation (Playwright + chrome-devtools)
- ✅ Persistent memory (remembers patterns across sessions)

### Documentation
- **Integration Details**: `docs/PAI_INTEGRATION_COMPLETE.md`
- **Integration Plan**: `docs/PAI_INTEGRATION_PLAN.md`
- **Project Memory**: `.claude/memories/projects/apex.md`
- **Protocols**: `.claude/protocols/*.md`
- **Skills**: `.claude/skills/*/SKILL.md`

### Key PAI Commands
```bash
/pai-status       # Check PAI system health
/auto             # Autonomous development workflow
/research         # Multi-source research
/fabric           # Pattern selection for prompts
```

---

## 🎨 CRITICAL: DESIGN SYSTEM ENFORCEMENT (MANDATORY)

**READ THIS BEFORE IMPLEMENTING ANY UI COMPONENT**

### Single Source of Truth
**`docs/APEX_DESIGN_SYSTEM.md`** - The authoritative design reference (v4.0)

All other UI docs have been archived to `docs/archive/`.

### Quick Reference - Colors
- **Background**: `#0a0f1a` (deep space navy)
- **Cards**: `#141930` (dark navy)
- **Primary**: `#00E5CC` (Apex cyan)
- **Purple**: `#8B5CF6` (secondary accent)
- **Success/Warning/Error**: `#22C55E` / `#F59E0B` / `#EF4444`

### 3-Tier Card Hierarchy (MANDATORY)
```tsx
<div className="card-primary">   {/* Main KPIs, GEO Score */}
<div className="card-secondary"> {/* Charts, recommendations */}
<div className="card-tertiary">  {/* List items, activity */}
```

### Key Rules
- Use `.card-primary/.secondary/.tertiary` - NOT basic `<Card>`
- Glassmorphism for modals only - NOT main content
- Max 3-4 accent colors per view
- No pure black `#000000` backgrounds

### Reference Files
- `docs/APEX_DESIGN_SYSTEM.md` - **Single source of truth**
- `docs/images UI/Dash idea.png` - Visual reference
- `src/app/globals.css` - CSS implementation

---

## What This Project Is

**Apex** helps brands capture visibility across AI-powered search engines:
- **MONITOR** - Track brand mentions across 7+ AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek)
- **CREATE** - Generate AI-optimized content using brand voice and data
- **AUDIT** - Comprehensive technical site analysis for AI visibility
- **SMART RECOMMENDATIONS ENGINE** - Auto-generated, prioritized actionable recommendations

### Key Differentiators
- Dashboard-first UI (not chat-based)
- White-label architecture (fully configurable branding)
- PPP-adjusted pricing for African markets
- Smart Recommendations Engine as core feature

## Technology Stack

### Frontend
- Next.js 14+ with App Router
- TypeScript (strict mode, zero 'any' types)
- Tailwind CSS + Shadcn/ui components
- Zustand (client state) + TanStack Query (server state)
- Recharts for data visualization
- React Hook Form + Zod validation

### Backend
- Next.js API Routes (App Router)
- PostgreSQL via Neon (serverless)
- Drizzle ORM
- Redis (Upstash) for caching
- BullMQ for background jobs
- Pinecone for vector/semantic search

### AI Services
- Anthropic Claude API (primary LLM)
- OpenAI GPT-4 API (secondary)
- OpenAI text-embedding-3-small

### Authentication
- Clerk (multi-tenant, organization support)
- SSO, MFA, RBAC

### Deployment
- VPS Docker deployment (72.61.197.178)
- Docker Compose for multi-container orchestration
- Nginx reverse proxy for SSL/routing

## Key Files

- `app_spec.txt` - Full project specification (READ THIS FIRST)
- `feature_list.json` - Test cases tracking progress (find next `"passes": false`)
- `init.sh` - Setup script for the project

### Documentation (in `docs/` directory)

- `docs/VISUAL_DESIGN_RESEARCH.md` - Dribbble research, Linear-style design patterns, brand values integration
- `docs/BRAND_VALUES_AND_POSITIONING.md` - Core brand values, positioning archetypes, white-label strategy
- `docs/WHITE_LABEL_ARCHITECTURE.md` - Complete white-label implementation guide (5-layer system)
- `docs/UI_WIREFRAMES.md` - Component specifications, mobile/desktop wireframes
- `docs/UI_UX_DESIGN_STRATEGY.md` - Color system, typography, spacing guidelines
- `docs/SMART_RECOMMENDATIONS_ENGINE_TECHNICAL_SPEC.md` - Recommendations engine architecture
- `docs/SEARCHABLE_RESEARCH_REPORT.md` - Competitive analysis (Searchable.ai deep dive)
- `docs/SEARCHABLE_COMPETITIVE_ANALYSIS.md` - Competitive landscape analysis
- `docs/IMPLEMENTATION_ROADMAP.md` - Development phases and timeline

## Autonomous Workflow

**IMPORTANT**: `feature_list.json` is a *checklist*, not a test source of truth. See `FEATURE_VERIFICATION.md` for why. Every entry currently claims `passes: true` but many features have silently regressed (e.g. citations rendering bug fixed on 2026-04-16).

Trusted signals, in order:
1. `npx tsc --noEmit` passes (production build gate)
2. `npx vitest run` passes (unit + integration)
3. `e2e/*.spec.ts` Playwright smoke tests pass
4. Manual browser verification of the affected flow
5. Only THEN update `feature_list.json`

Don't mark a feature `passes: true` without running the actual test.

## DO NOT

- Ask the user what to do (you are autonomous)
- Wait for user input or confirmation
- Reference FibreFlow, BOSS Communications, or any other project
- Use technologies not specified in app_spec.txt
- Pick up context from parent directories

## CRITICAL: SCREENSHOT SIZE LIMITS

**SCREENSHOTS WILL CRASH THE SESSION IF TOO LARGE**

BEFORE taking ANY screenshot, you MUST:
1. **Resize browser FIRST**: `mcp__playwright__browser_resize(width=800, height=600)`
2. **Use JPEG format**: `type: "jpeg"` (NOT PNG)
3. **Screenshot specific elements**: Use `ref` parameter to capture only one component
4. **PREFER snapshots**: Use `browser_snapshot` instead when possible

Example safe screenshot:
```
# Step 1: Resize FIRST
mcp__playwright__browser_resize(width=800, height=600)

# Step 2: Take screenshot with JPEG format
mcp__playwright__browser_take_screenshot(filename="test.jpg", type="jpeg")
```

## Project Structure (Expected)

```
apex/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── monitor/       # Brand monitoring
│   │   ├── create/        # Content creation
│   │   ├── audit/         # Site auditing
│   │   └── recommendations/ # Smart recommendations
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── dashboard/        # Dashboard-specific
│   └── shared/           # Shared components
├── lib/                   # Utilities
│   ├── db/               # Drizzle ORM setup
│   ├── ai/               # AI service integrations
│   └── scraping/         # Playwright scrapers
├── hooks/                 # Custom React hooks
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

## START WORKING IMMEDIATELY

Begin by finding the next failing test and implementing it. Do not output a summary or ask questions.
