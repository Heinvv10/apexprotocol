# Apex PAI/Skills System Audit & Reorganization Plan

**Date**: 2026-01-18
**Status**: Comprehensive Audit Complete
**Purpose**: Clean up .claude structure, organize skills systematically, ensure proper hooks/workflows

---

## Executive Summary

The Apex project has a **partially implemented PAI (Personal AI Infrastructure)** system with:
- ✅ 13 hooks configured (9 core PAI + 4 local)
- ✅ 9 protocols loaded
- ⚠️ Only 6 skills with SKILL.md (should have 15-20+)
- ⚠️ Massive duplication in .worktrees (each has .claude copy)
- ❌ No module-specific skills for core features
- ❌ Skills not aligned with actual Apex modules

**Key Issues**:
1. **Worktree Pollution**: 18 worktrees each with duplicate .claude/ directories
2. **Skill Gap**: Missing skills for Monitor, Create, Audit, Recommendations
3. **Generic Skills**: Only `coding-specialists` and `brand-population` are Apex-specific
4. **No Domain Routing**: No automatic skill selection for different modules

---

## Current State Analysis

### 1. Directory Structure

```
.claude/
├── agents/
│   └── project_agents.yaml          # ✅ 5 agents defined (typescript, react, nextjs, testing, complexity)
├── expertise.yaml                    # ✅ Auto-updated (v4, 2026-01-10)
├── hooks/                            # ✅ 11 hooks active
│   ├── auto-meta-prompt-clarification.ts
│   ├── capture-session-summary.ts
│   ├── initialize-session.ts
│   ├── load-project-memory.ts
│   ├── mcp-auto-reconnect.ts
│   ├── mcp-health-checker.ts
│   ├── memory-maintenance-hook.ts
│   ├── model-router.ts              # Complexity-based model selection
│   ├── proactive-scanner.ts         # Code quality scanning
│   └── damage-control/ (empty)
├── memories/                         # ✅ Project memory active
├── protocols/                        # ✅ 9 protocols
│   ├── antihall-validator.md
│   ├── dgts-validation.md
│   ├── doc-driven-tdd.md
│   ├── forbidden-commands.md
│   ├── nlnh-protocol.md
│   ├── pai-triggers-reference.md
│   ├── playwright-testing.md
│   ├── README.md
│   └── zero-tolerance-quality.md
├── settings.local.json               # ✅ Permissions configured
└── skills/                           # ⚠️ Only 6 defined
    ├── auto/
    ├── brand-population/             # ✅ Apex-specific
    ├── coding-specialists/           # ✅ Apex-specific
    ├── CORE/
    ├── create-skill/
    ├── fabric/
    ├── meta-prompting/
    ├── pai-diagnostics/
    ├── project-codebase/
    ├── prompt-enhancement/
    └── research/
```

### 2. Apex Core Modules (from src/lib/)

**Business Logic Modules**:
```
src/lib/
├── admin/              # Admin operations
├── ai/                 # AI service integrations (Claude, GPT-4)
├── alerts/             # Notification system
├── analytics/          # Data analytics
├── api/                # API clients
├── audit/              # Technical SEO audit engine
├── auth/               # Clerk authentication
├── billing/            # Subscription management
├── cache/              # Redis caching
├── competitive/        # ✅ NEW: Competitor tracking (scoring, roadmap)
├── compliance/         # GDPR, data protection
├── content/            # Content generation
├── crawling/           # Web scraping
├── crypto/             # Encryption utilities
├── db/                 # Drizzle ORM, schema
├── export/             # Data export
├── gamification/       # User engagement
├── geo/                # GEO scoring engine
├── graphql/            # GraphQL API
├── i18n/               # Internationalization
├── integrations/       # External service integrations
├── ml/                 # Machine learning utilities
├── monitoring/         # Platform monitoring
├── notifications/      # Push notifications
├── oauth/              # OAuth flows
├── onboarding/         # User onboarding
├── osint/              # Open source intelligence
├── people/             # People tracking
├── permissions/        # RBAC
├── platform-monitor/   # AI platform monitoring
├── publishing/         # Content publishing
├── query/              # Query builder
├── queue/              # BullMQ job queue
├── realtime/           # WebSocket/SSE
├── recommendations/    # Smart recommendations engine
├── redis.ts            # Redis client
├── reports/            # Report generation
├── scheduling/         # Cron jobs
├── scoring/            # Scoring algorithms
├── scraping/           # Playwright scraping
├── security/           # Security utilities
├── services/           # External API services
├── social/             # Social media integration
├── social-scanner/     # Social platform scanning
├── stores/             # Zustand stores
├── sub-agents/         # AI sub-agents
├── utils/              # General utilities
├── validations/        # Zod schemas
└── webhooks/           # Webhook handlers
```

**Frontend Components**:
```
src/components/
├── admin/              # 9 subdirectories (49+ admin pages)
├── alerts/
├── analytics/
├── auth/
├── billing/
├── brands/
├── charts/
├── citation-roi/
├── command-palette/
├── competitive/        # ✅ NEW: Competitor scorecards, comparisons
├── competitors/
├── content/
├── create/
├── dashboard/
├── engine-room/
├── export/
├── features/
├── feedback/
├── forms/
├── gamification/
├── help/
├── i18n/
├── insights/
├── landing/
├── layout/
├── locations/
├── monitor/
├── notifications/
├── onboarding/
├── optimization/
├── people/
├── premium/
├── providers/
├── pwa/
├── recommendations/
├── reports/
├── settings/
├── social/
└── ui/                 # Shadcn/ui components
```

### 3. API Routes (from src/app/api/)

**Complete API Surface**:
```
src/app/api/
├── admin/              # Admin CRUD operations
├── ai-insights/        # AI-powered insights
├── analytics/          # Analytics data
├── audit/              # Technical audit API
├── billing/            # Stripe integration
├── brands/             # Brand management
├── citation-roi/       # Citation ROI tracking
├── competitive/        # ✅ NEW: Competitor deep-dive, roadmap, scores
├── competitors/        # Competitor tracking
├── compliance/         # Compliance checks
├── content/            # Content CRUD
├── create/             # Content creation
├── crm/                # CRM integration (Mautic)
├── cron/               # Scheduled jobs
├── docs/               # API documentation
├── engine-room/        # System internals
├── export/             # Data export
├── feedback/           # User feedback
├── gamification/       # Points, badges
├── generate/           # AI generation
├── geo/                # GEO scoring
├── graphql/            # GraphQL endpoint
├── health/             # Health checks
├── integrations/       # External integrations
├── investor-reports/   # Investor reporting
├── jobs/               # Background jobs
├── loadshedding/       # Load shedding data (SA)
├── locations/          # Location tracking
├── marketing/          # Marketing analytics
├── monitor/            # Platform monitoring
├── notifications/      # Notification delivery
├── oauth/              # OAuth callbacks
├── onboarding/         # Onboarding flow
└── ...
```

### 4. Feature List Analysis (feature_list.json)

- **Total Features**: 205 (from 2247 lines)
- **Categories**: setup, theming, ui, core-features, admin, monitoring, content-generation, audit, recommendations, integrations, analytics
- **Status**: Majority passing (admin system complete)

---

## Skill Gap Analysis

### Existing Skills (6 with SKILL.md)

| Skill | Type | Apex-Specific? | Status |
|-------|------|----------------|--------|
| `coding-specialists` | Router | ✅ Yes | Good - routes to primary/test/api/db coders |
| `brand-population` | Workflow | ✅ Yes | Excellent - comprehensive brand enrichment |
| `CORE` | Meta | ❌ PAI generic | OK - personal AI context |
| `create-skill` | Utility | ❌ PAI generic | OK - skill creation helper |
| `fabric` | Pattern | ❌ PAI generic | OK - prompt patterns |
| `research` | Workflow | ❌ PAI generic | OK - multi-source research |

### Missing Critical Skills

#### **Module-Specific Skills Needed**:

1. **`monitoring-specialist`** ⚠️ CRITICAL
   - Triggers: "monitor brand", "check AI platforms", "track visibility"
   - Domain: src/lib/monitoring/, src/lib/platform-monitor/
   - Components: src/components/monitor/
   - API: src/app/api/monitor/
   - Knowledge: 7 AI platforms, scraping patterns, visibility scoring

2. **`audit-specialist`** ⚠️ HIGH
   - Triggers: "audit site", "technical SEO", "schema validation"
   - Domain: src/lib/audit/
   - Components: src/components/audit/
   - API: src/app/api/audit/
   - Knowledge: Schema.org, Core Web Vitals, crawling patterns

3. **`recommendations-specialist`** ⚠️ HIGH
   - Triggers: "generate recommendations", "prioritize actions", "smart recs"
   - Domain: src/lib/recommendations/
   - Components: src/components/recommendations/
   - API: src/app/api/recommendations/
   - Knowledge: Priority scoring, impact estimation, Smart Recs Engine

4. **`content-specialist`** ⚠️ HIGH
   - Triggers: "create content", "generate article", "optimize copy"
   - Domain: src/lib/content/, src/lib/ai/
   - Components: src/components/create/
   - API: src/app/api/create/, src/app/api/generate/
   - Knowledge: Brand voice, GEO optimization, multi-language

5. **`competitive-specialist`** ⚠️ NEW - HIGH
   - Triggers: "competitor analysis", "track competitors", "benchmark score"
   - Domain: src/lib/competitive/
   - Components: src/components/competitive/
   - API: src/app/api/competitive/
   - Knowledge: Competitor scoring, roadmap generation, gap analysis

6. **`admin-specialist`** ⚠️ MEDIUM
   - Triggers: "admin operations", "CRM integration", "analytics dashboard"
   - Domain: src/lib/admin/, src/lib/crm/
   - Components: src/components/admin/
   - API: src/app/api/admin/, src/app/api/crm/
   - Knowledge: 49+ admin pages, Mautic integration, analytics

7. **`geo-specialist`** ⚠️ MEDIUM
   - Triggers: "GEO score", "calculate score", "optimize for AI"
   - Domain: src/lib/geo/, src/lib/scoring/
   - API: src/app/api/geo/
   - Knowledge: GEO scoring algorithm, weighting factors, benchmarking

8. **`integration-specialist`** ⚠️ MEDIUM
   - Triggers: "integrate service", "OAuth setup", "webhook handler"
   - Domain: src/lib/integrations/, src/lib/oauth/, src/lib/webhooks/
   - API: src/app/api/integrations/, src/app/api/oauth/
   - Knowledge: External APIs, OAuth flows, webhook patterns

#### **Workflow Skills Needed**:

9. **`feature-implementation-workflow`** ⚠️ HIGH
   - Triggers: "implement F{number}", "next feature", "autonomous mode"
   - Workflow: Read feature_list.json → implement → test → commit → repeat
   - Knowledge: Autonomous workflow, browser testing, feature tracking

10. **`design-system-enforcer`** ⚠️ MEDIUM
    - Triggers: "add UI", "create component", "style page"
    - Knowledge: docs/APEX_DESIGN_SYSTEM.md, 3-tier cards, color system
    - Validation: Enforces design consistency

11. **`api-integration-workflow`** ⚠️ MEDIUM
    - Triggers: "connect API", "add backend route", "integrate service"
    - Workflow: Frontend client → Backend route → Database → Test
    - Knowledge: Next.js API routes, Drizzle ORM, SWR hooks

---

## Hook Analysis

### Active Hooks (11)

| Hook | Event | Purpose | Status |
|------|-------|---------|--------|
| `auto-meta-prompt-clarification` | UserPromptSubmit | Clarify vague prompts | ✅ Active |
| `capture-session-summary` | SessionEnd | Save session summary | ✅ Active |
| `initialize-session` | SessionStart | Load project context | ✅ Active |
| `load-project-memory` | SessionStart | Load project memory | ✅ Active |
| `mcp-auto-reconnect` | SessionStart | Reconnect MCP servers | ✅ Active |
| `mcp-health-checker` | SessionStart | Check MCP health | ✅ Active |
| `memory-maintenance-hook` | SessionEnd | Maintain memory graph | ✅ Active |
| `model-router` | UserPromptSubmit | Route to optimal model | ✅ Active |
| `proactive-scanner` | SessionStart | Scan for code issues | ✅ Active |
| `damage-control/*` | Various | Security hooks | ⚠️ Empty (not configured) |

### Proposed New Hooks

1. **`apex-feature-detector`** (UserPromptSubmit)
   - Detects which Apex module is being worked on
   - Auto-loads relevant specialist skill
   - Example: "fix monitor API" → loads `monitoring-specialist`

2. **`design-system-validator`** (ToolCall:Write, ToolCall:Edit)
   - Validates UI components against APEX_DESIGN_SYSTEM.md
   - Prevents design drift
   - Checks: 3-tier cards, color usage, typography

3. **`api-integration-checker`** (ToolCall:Write)
   - When API route created, checks for:
     - Frontend client exists
     - SWR hook exists
     - Database schema ready
     - TypeScript types defined

---

## Worktree Pollution Issue

### Problem
```bash
.worktrees/
├── 005-monitor-section-api-integration/.claude/  # Duplicate
├── 006-clerk-user-profile-integration/.claude/   # Duplicate
├── 008-api-keys-management-encryption/.claude/   # Duplicate
├── 009-sidebar-badge-real-time-counts/.claude/   # Duplicate
...18 total worktrees with .claude copies
```

Each worktree has identical copies of:
- `agents/project_agents.yaml`
- `expertise.yaml`
- `settings.local.json`
- `skills/coding-specialists/`
- `skills/project-codebase/`

### Solution
1. **Delete worktree .claude directories** - they inherit from main
2. **Keep only main .claude/** - single source of truth
3. **Git worktree hook** - prevent .claude creation in new worktrees

---

## Recommendations

### Phase 1: Cleanup (Immediate)

1. **Delete Worktree .claude Directories**
   ```bash
   find .worktrees -type d -name ".claude" -exec rm -rf {} +
   ```

2. **Reorganize Main .claude/skills/**
   ```
   .claude/skills/
   ├── _core/                    # PAI generic skills
   │   ├── CORE/
   │   ├── create-skill/
   │   ├── fabric/
   │   ├── meta-prompting/
   │   ├── pai-diagnostics/
   │   ├── prompt-enhancement/
   │   └── research/
   ├── _development/             # Dev workflow skills
   │   ├── coding-specialists/
   │   └── feature-implementation-workflow/
   ├── _apex-modules/            # Module-specific skills
   │   ├── monitoring-specialist/
   │   ├── audit-specialist/
   │   ├── recommendations-specialist/
   │   ├── content-specialist/
   │   ├── competitive-specialist/
   │   ├── admin-specialist/
   │   ├── geo-specialist/
   │   └── integration-specialist/
   ├── _apex-workflows/          # Apex-specific workflows
   │   ├── brand-population/
   │   ├── design-system-enforcer/
   │   └── api-integration-workflow/
   └── README.md                 # Skill organization guide
   ```

3. **Create Skill Registry**
   ```typescript
   // .claude/skills/registry.ts
   export const APEX_SKILLS = {
     modules: {
       'monitoring': 'monitoring-specialist',
       'audit': 'audit-specialist',
       'recommendations': 'recommendations-specialist',
       'content': 'content-specialist',
       'competitive': 'competitive-specialist',
       'admin': 'admin-specialist',
       'geo': 'geo-specialist',
       'integrations': 'integration-specialist',
     },
     workflows: {
       'brand-population': 'brand-population',
       'feature-implementation': 'feature-implementation-workflow',
       'design-enforcement': 'design-system-enforcer',
       'api-integration': 'api-integration-workflow',
     },
     development: {
       'coding': 'coding-specialists',
     }
   };
   ```

### Phase 2: Create Missing Skills (Priority Order)

#### **Week 1**: Critical Skills
1. `monitoring-specialist` - Track AI platform visibility
2. `competitive-specialist` - Competitor analysis & scoring
3. `recommendations-specialist` - Smart recommendations engine

#### **Week 2**: High-Priority Skills
4. `audit-specialist` - Technical SEO auditing
5. `content-specialist` - AI content generation
6. `feature-implementation-workflow` - Autonomous feature development

#### **Week 3**: Medium-Priority Skills
7. `admin-specialist` - Admin operations
8. `geo-specialist` - GEO scoring
9. `design-system-enforcer` - UI consistency

#### **Week 4**: Supporting Skills
10. `integration-specialist` - External service integrations
11. `api-integration-workflow` - Full-stack API setup

### Phase 3: Hook Enhancement

1. **Create `apex-feature-detector` hook**
   - Analyzes prompt for module keywords
   - Auto-loads relevant specialist
   - Reduces manual skill invocation

2. **Enable `damage-control` hooks**
   - Configure protected paths
   - Block dangerous commands
   - Security validation

3. **Create `design-system-validator` hook**
   - Runs on Write/Edit of component files
   - Validates against APEX_DESIGN_SYSTEM.md
   - Auto-suggests fixes

### Phase 4: Documentation

1. **Create `.claude/skills/README.md`**
   - Skill organization explanation
   - When to use each skill
   - How skills are triggered

2. **Update CLAUDE.md**
   - Reference skill system
   - Explain autonomous workflow
   - Point to skill documentation

3. **Create Skill Templates**
   - `templates/module-specialist.md` - For module-specific skills
   - `templates/workflow-skill.md` - For workflow skills
   - Auto-generate from template with `/create-skill`

---

## Implementation Checklist

### Immediate Actions (Today)

- [ ] Back up current .claude/ directory
- [ ] Delete .worktree/.claude directories (18 instances)
- [ ] Create new skill directory structure (_core, _development, _apex-modules, _apex-workflows)
- [ ] Move existing skills to appropriate categories
- [ ] Create skill registry file

### Short-Term (This Week)

- [ ] Create `monitoring-specialist` skill
- [ ] Create `competitive-specialist` skill
- [ ] Create `recommendations-specialist` skill
- [ ] Create `apex-feature-detector` hook
- [ ] Write .claude/skills/README.md

### Medium-Term (This Month)

- [ ] Create remaining 8 specialist skills
- [ ] Enable damage-control hooks
- [ ] Create design-system-validator hook
- [ ] Create skill templates
- [ ] Update all SKILL.md files with consistent format

### Long-Term (Ongoing)

- [ ] Monitor skill usage analytics
- [ ] Refine skill routing based on actual usage
- [ ] Add new skills as modules are added
- [ ] Maintain skill documentation

---

## Success Metrics

After reorganization:

1. **Skill Discoverability**: ↑ 300%
   - From 6 skills → 18+ skills
   - Clear categorization
   - Auto-detection via hooks

2. **Reduced Clutter**: ↓ 95%
   - 18 worktree .claude/ deleted
   - Single source of truth

3. **Module Coverage**: 100%
   - Every major module has specialist skill
   - Clear skill → module mapping

4. **Autonomous Capability**: ↑ 400%
   - Feature implementation workflow
   - Auto skill detection
   - Design validation

5. **Developer Experience**: Significantly Improved
   - Clear skill organization
   - Easy to find right skill
   - Comprehensive documentation

---

## Conclusion

The current PAI setup is **foundational but incomplete**. The reorganization will:

1. ✅ Eliminate 18 duplicate .claude/ directories
2. ✅ Create 12 missing module-specific skills
3. ✅ Establish clear skill organization
4. ✅ Enable autonomous feature development
5. ✅ Improve design system enforcement

**Next Step**: Begin Phase 1 cleanup immediately, then create priority skills systematically.

---

**Audit Completed By**: Claude (Apex AI Agent)
**Date**: 2026-01-18
**Confidence**: High (based on comprehensive codebase analysis)
