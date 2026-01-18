# Apex Skills System

**Organized skill structure for the Apex GEO/AEO platform**

Last Updated: 2026-01-18

---

## Directory Structure

```
.claude/skills/
├── _core/                       # PAI generic skills (7 skills)
│   ├── CORE/                   # Personal AI Infrastructure
│   ├── create-skill/           # Skill creation guide
│   ├── fabric/                 # Fabric pattern selection
│   ├── meta-prompting/         # Prompt clarification system
│   ├── pai-diagnostics/        # PAI health checker
│   ├── prompt-enhancement/     # Prompt optimization
│   └── research/               # Multi-source research
├── _development/                # Dev workflow skills (2 skills)
│   ├── coding-specialists/     # Project-specific coders
│   └── auto/                   # Autonomous dev workflow
├── _apex-workflows/             # Apex-specific workflows (4 skills)
│   ├── brand-population/       # ✅ Brand enrichment
│   ├── feature-implementation-workflow/  # ⚠️ TODO
│   ├── design-system-enforcer/ # ⚠️ TODO
│   └── api-integration-workflow/  # ⚠️ TODO
├── _apex-modules/               # Module specialists (8 skills)
│   ├── monitoring-specialist/  # ⚠️ TODO - CRITICAL
│   ├── competitive-specialist/ # ⚠️ TODO - CRITICAL
│   ├── recommendations-specialist/  # ⚠️ TODO - CRITICAL
│   ├── audit-specialist/       # ⚠️ TODO - HIGH
│   ├── content-specialist/     # ⚠️ TODO - HIGH
│   ├── admin-specialist/       # ⚠️ TODO - MEDIUM
│   ├── geo-specialist/         # ⚠️ TODO - MEDIUM
│   └── integration-specialist/ # ⚠️ TODO - MEDIUM
├── registry.ts                  # ✅ Skill registry (central index)
└── README.md                    # This file
```

---

## Skill Categories

### 1. Core PAI Skills (`_core/`)

**Purpose**: Generic PAI (Personal AI Infrastructure) skills that work across all projects.

**When to Use**: Universal AI assistance, research, prompt optimization, system diagnostics.

| Skill | Triggers | Status |
|-------|----------|--------|
| `CORE` | @kai, @PAI, pai mode | ✅ Implemented |
| `create-skill` | create skill, new skill | ✅ Implemented |
| `fabric` | fabric pattern, use fabric | ✅ Implemented |
| `meta-prompting` | clarify, meta-prompt | ✅ Implemented |
| `pai-diagnostics` | /pai-status, PAI health | ✅ Implemented |
| `prompt-enhancement` | enhance prompt, improve prompt | ✅ Implemented |
| `research` | do research, investigate | ✅ Implemented |

### 2. Development Skills (`_development/`)

**Purpose**: General development workflows for any codebase.

**When to Use**: Writing code, running tests, autonomous development.

| Skill | Triggers | Status |
|-------|----------|--------|
| `coding-specialists` | implement, build, fix bug | ✅ Implemented |
| `auto` | auto workflow, autonomous dev | ✅ Implemented |

### 3. Apex Workflow Skills (`_apex-workflows/`)

**Purpose**: Apex-specific workflows that span multiple modules.

**When to Use**: Cross-cutting Apex operations (brand enrichment, feature development, design enforcement).

| Skill | Triggers | Status |
|-------|----------|--------|
| `brand-population` | populate brands, enrich brands | ✅ Implemented |
| `feature-implementation-workflow` | implement F{number}, next feature | ⚠️ TODO |
| `design-system-enforcer` | add UI, create component | ⚠️ TODO |
| `api-integration-workflow` | connect API, add backend route | ⚠️ TODO |

### 4. Apex Module Skills (`_apex-modules/`)

**Purpose**: Module-specific specialists with deep domain knowledge.

**When to Use**: Working on specific Apex features (monitoring, audit, content generation, etc.).

| Skill | Triggers | Module | Priority | Status |
|-------|----------|--------|----------|--------|
| `monitoring-specialist` | monitor brand, AI platform | src/lib/monitoring/, src/lib/platform-monitor/ | CRITICAL | ⚠️ TODO |
| `competitive-specialist` | competitor, benchmark | src/lib/competitive/ | CRITICAL | ⚠️ TODO |
| `recommendations-specialist` | recommendations, smart recs | src/lib/recommendations/ | CRITICAL | ⚠️ TODO |
| `audit-specialist` | audit site, technical SEO | src/lib/audit/ | HIGH | ⚠️ TODO |
| `content-specialist` | create content, generate article | src/lib/content/, src/lib/ai/ | HIGH | ⚠️ TODO |
| `admin-specialist` | admin, CRM, analytics | src/lib/admin/, src/components/admin/ | MEDIUM | ⚠️ TODO |
| `geo-specialist` | GEO score, calculate score | src/lib/geo/, src/lib/scoring/ | MEDIUM | ⚠️ TODO |
| `integration-specialist` | integrate, OAuth, webhook | src/lib/integrations/, src/lib/oauth/ | MEDIUM | ⚠️ TODO |

---

## How Skills Work

### Automatic Skill Detection

Skills are automatically loaded based on **keywords in your prompt**:

```
User: "Monitor brand mentions on ChatGPT"
→ Detects: "monitor", "brand"
→ Loads: monitoring-specialist
```

### Manual Skill Invocation

You can explicitly invoke a skill:

```bash
/monitoring-specialist         # Load skill by name
Skill(monitoring-specialist)   # Via Skill tool
```

### Skill Routing (via registry.ts)

The `registry.ts` file maps keywords → skills:

```typescript
'monitoring': {
  triggers: ['monitor brand', 'AI platform', 'track visibility'],
  path: '_apex-modules/monitoring-specialist',
}
```

---

## Implementation Priority

### Week 1: Critical Skills
1. **monitoring-specialist** - Track AI platform visibility (7 platforms)
2. **competitive-specialist** - Competitor analysis & scoring
3. **recommendations-specialist** - Smart recommendations engine

### Week 2: High-Priority Skills
4. **audit-specialist** - Technical SEO auditing
5. **content-specialist** - AI content generation
6. **feature-implementation-workflow** - Autonomous feature development

### Week 3: Medium-Priority Skills
7. **admin-specialist** - Admin operations (49+ pages)
8. **geo-specialist** - GEO scoring algorithm
9. **design-system-enforcer** - UI consistency validation

### Week 4: Supporting Skills
10. **integration-specialist** - External service integrations
11. **api-integration-workflow** - Full-stack API setup

---

## Creating New Skills

### Using the Template

```bash
/create-skill
```

Follow the prompts to generate a new skill from template.

### Manual Creation

1. Create directory: `.claude/skills/_apex-modules/my-specialist/`
2. Create `SKILL.md` with structure:
   - Name and description
   - Triggers (keywords)
   - Prerequisites
   - Workflows
   - Examples

3. Register in `registry.ts`:
```typescript
'my-module': {
  name: 'my-specialist',
  category: 'apex-module',
  path: '_apex-modules/my-specialist',
  triggers: ['keyword1', 'keyword2'],
  description: 'What this skill does',
  priority: 'high',
  implemented: true,
}
```

---

## Skill Best Practices

### 1. Clear Triggers
Use specific, unambiguous keywords:
- ✅ Good: `'monitor brand'`, `'track visibility'`
- ❌ Bad: `'check'`, `'look'` (too generic)

### 2. Domain Knowledge
Include comprehensive module context:
- File paths (`src/lib/monitoring/`)
- API routes (`src/app/api/monitor/`)
- Components (`src/components/monitor/`)
- Database schema
- External services

### 3. Workflows
Provide step-by-step execution:
- Prerequisite checks
- Tool invocations
- Error handling
- Example usage

### 4. Maintainability
- Version skills (`v1.0.0`)
- Update last modified date
- Document breaking changes
- Link to related docs

---

## Registry Stats

**Total Skills**: 21
- ✅ **Implemented**: 10 (48%)
- ⚠️ **TODO**: 11 (52%)

**By Category**:
- Core PAI: 7/7 (100%)
- Development: 2/2 (100%)
- Apex Workflows: 1/4 (25%)
- Apex Modules: 0/8 (0%)

**Priority Breakdown**:
- Critical: 3 not implemented
- High: 3 not implemented
- Medium: 5 not implemented

---

## Hooks Integration

### apex-feature-detector Hook (Planned)

Auto-detects module context and loads appropriate skill:

```typescript
// When editing src/lib/monitoring/platform-scraper.ts
→ Auto-loads: monitoring-specialist

// When editing src/components/competitive/scorecard.tsx
→ Auto-loads: competitive-specialist
```

### design-system-validator Hook (Planned)

Validates UI components against `APEX_DESIGN_SYSTEM.md`:

```typescript
// On Write/Edit of *.tsx in src/components/
→ Checks: 3-tier card usage, color system, glassmorphism rules
→ Auto-suggests: Design fixes if violations found
```

---

## Related Documentation

- **Audit Report**: `docs/APEX_SKILL_AUDIT_2026.md` - Complete system analysis
- **Design System**: `docs/APEX_DESIGN_SYSTEM.md` - UI/UX guidelines
- **PAI Protocols**: `.claude/protocols/*.md` - Quality standards
- **Project Agents**: `.claude/agents/project_agents.yaml` - Agent configuration

---

## Troubleshooting

### Skill Not Loading

1. Check triggers in `registry.ts`
2. Verify skill has `SKILL.md`
3. Ensure `implemented: true` in registry
4. Check hook output for errors

### Wrong Skill Loading

1. Refine trigger keywords (avoid overlap)
2. Use explicit skill invocation: `/skill-name`
3. Check priority in registry (higher priority = chosen first)

### Skill Outdated

1. Update `SKILL.md` with new patterns
2. Increment version number
3. Update `last_updated` field
4. Test with sample prompts

---

**For Questions**: Check `docs/APEX_SKILL_AUDIT_2026.md` or run `/pai-status`
