# Apex Skill System - Visual Guide

**Quick reference for understanding the reorganized skill structure**

---

## 📊 Before vs After

### Before Reorganization (Cluttered)

```
❌ PROBLEMS:
- Flat structure (no organization)
- Only 6 skills defined
- 31 duplicate .claude/ in worktrees
- No module coverage
- No automatic routing

.claude/skills/
├── auto/                        (orphaned)
├── brand-population/            (where does this belong?)
├── coding-specialists/          (development?)
├── CORE/                        (what category?)
├── create-skill/                (generic?)
├── fabric/                      (PAI generic?)
├── meta-prompting/              (PAI generic?)
├── pai-diagnostics/             (PAI generic?)
├── project-codebase/            (auto-generated?)
├── prompt-enhancement/          (PAI generic?)
└── research/                    (PAI generic?)

.worktrees/
├── 005-monitor/.claude/         (duplicate!)
├── 006-clerk/.claude/           (duplicate!)
├── 008-api-keys/.claude/        (duplicate!)
...31 total duplicates
```

### After Reorganization (Organized)

```
✅ SOLUTIONS:
- 4-tier categorization
- 21 skills defined (10 implemented, 11 roadmapped)
- Cleanup script for duplicates
- 100% module coverage
- Automatic routing via registry

.claude/skills/
├── _core/                       # PAI Generic (7 skills)
│   ├── CORE/                   # @kai personal AI
│   ├── create-skill/           # Skill creation guide
│   ├── fabric/                 # Pattern selection
│   ├── meta-prompting/         # Prompt clarification
│   ├── pai-diagnostics/        # System health
│   ├── prompt-enhancement/     # Prompt optimization
│   └── research/               # Multi-source research
│
├── _development/                # Dev Workflows (2 skills)
│   ├── coding-specialists/     # ✅ Primary/API/DB/Test coders
│   └── auto/                   # ✅ Autonomous dev workflow
│
├── _apex-workflows/             # Apex Workflows (4 skills)
│   ├── brand-population/       # ✅ Brand enrichment
│   ├── feature-implementation-workflow/  # ⚠️ TODO
│   ├── design-system-enforcer/ # ⚠️ TODO
│   └── api-integration-workflow/  # ⚠️ TODO
│
├── _apex-modules/               # Module Specialists (8 skills)
│   ├── monitoring-specialist/  # ⚠️ TODO - CRITICAL
│   ├── competitive-specialist/ # ⚠️ TODO - CRITICAL
│   ├── recommendations-specialist/  # ⚠️ TODO - CRITICAL
│   ├── audit-specialist/       # ⚠️ TODO - HIGH
│   ├── content-specialist/     # ⚠️ TODO - HIGH
│   ├── admin-specialist/       # ⚠️ TODO - MEDIUM
│   ├── geo-specialist/         # ⚠️ TODO - MEDIUM
│   └── integration-specialist/ # ⚠️ TODO - MEDIUM
│
├── registry.ts                  # ✅ Central skill index
└── README.md                    # ✅ Complete docs

scripts/
└── cleanup-worktree-claude-dirs.sh  # ✅ Safe cleanup
```

---

## 🗺️ Module → Skill → Files Mapping

### Critical Skills (Week 1 Priority)

#### 1. monitoring-specialist
```
USER SAYS: "Monitor brand mentions on ChatGPT"
↓
LOADS: monitoring-specialist
↓
KNOWLEDGE FROM:
├── src/lib/monitoring/
│   ├── platform-scraper.ts
│   ├── mention-detector.ts
│   └── visibility-scorer.ts
├── src/lib/platform-monitor/
│   ├── platforms.ts           # 7 platforms defined
│   └── scoring.ts
├── src/components/monitor/
│   ├── platform-grid.tsx
│   └── visibility-chart.tsx
└── src/app/api/monitor/
    ├── route.ts
    └── platforms/route.ts
```

#### 2. competitive-specialist
```
USER SAYS: "Analyze competitor X and generate roadmap"
↓
LOADS: competitive-specialist
↓
KNOWLEDGE FROM:
├── src/lib/competitive/
│   ├── competitor-scoring.ts  # NEW (2026-01-18)
│   ├── roadmap-generator.ts   # NEW (2026-01-18)
│   └── index.ts
├── src/components/competitive/
│   ├── competitor-scorecard.tsx
│   ├── gap-visualization.tsx
│   └── milestone-card.tsx
└── src/app/api/competitive/
    ├── deep-dive/route.ts
    ├── roadmap/route.ts
    └── scores/route.ts
```

#### 3. recommendations-specialist
```
USER SAYS: "Generate smart recommendations for domain"
↓
LOADS: recommendations-specialist
↓
KNOWLEDGE FROM:
├── src/lib/recommendations/
│   ├── engine.ts
│   ├── priority-scorer.ts
│   └── impact-estimator.ts
├── src/components/recommendations/
│   ├── recommendation-card.tsx
│   └── priority-badge.tsx
└── src/app/api/recommendations/
    └── route.ts
```

---

## 🔄 Skill Routing Flow

### Automatic Detection (via registry.ts)

```
┌─────────────────────────────────┐
│ User Prompt                     │
│ "Monitor brand on ChatGPT"      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ registry.ts                     │
│ findSkillsByKeywords()          │
│ - Extracts: ["monitor","brand"] │
│ - Matches: monitoring-specialist│
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ monitoring-specialist/SKILL.md  │
│ - Loads domain knowledge        │
│ - Provides workflows            │
│ - Shows examples                │
└─────────────────────────────────┘
```

### Manual Invocation

```
User: /monitoring-specialist
→ Directly loads skill

User: Skill(monitoring-specialist)
→ Via Skill tool
```

---

## 📈 Implementation Progress

### Current Status (2026-01-18)

```
┌──────────────────────────────────────────┐
│ SKILL IMPLEMENTATION STATUS              │
├──────────────────────────────────────────┤
│ Total: 21 skills                         │
│ ✅ Implemented: 10 (48%)                 │
│ ⚠️ TODO: 11 (52%)                        │
└──────────────────────────────────────────┘

BY CATEGORY:
┌─────────────────┬─────────┬─────────────┐
│ Category        │ Total   │ Implemented │
├─────────────────┼─────────┼─────────────┤
│ Core PAI        │ 7       │ 7 (100%)    │
│ Development     │ 2       │ 2 (100%)    │
│ Apex Workflows  │ 4       │ 1 (25%)     │
│ Apex Modules    │ 8       │ 0 (0%)      │
└─────────────────┴─────────┴─────────────┘

BY PRIORITY:
┌─────────────┬─────────┬────────────────┐
│ Priority    │ Total   │ Not Implemented│
├─────────────┼─────────┼────────────────┤
│ Critical    │ 5       │ 3              │
│ High        │ 6       │ 3              │
│ Medium      │ 10      │ 5              │
└─────────────┴─────────┴────────────────┘
```

### 4-Week Roadmap

```
WEEK 1 (Critical):
┌─────────────────────────────────────┐
│ Day 1-2: monitoring-specialist      │
│ Day 3:   competitive-specialist     │
│ Day 4-5: recommendations-specialist │
└─────────────────────────────────────┘
Target: 3 skills → 13/21 (62%)

WEEK 2 (High):
┌─────────────────────────────────────┐
│ Day 1-2: audit-specialist           │
│ Day 3-4: content-specialist         │
│ Day 5:   feature-implementation     │
└─────────────────────────────────────┘
Target: 3 skills → 16/21 (76%)

WEEK 3 (Medium - Part 1):
┌─────────────────────────────────────┐
│ Day 1-2: admin-specialist           │
│ Day 3:   geo-specialist             │
│ Day 4-5: design-system-enforcer     │
└─────────────────────────────────────┘
Target: 3 skills → 19/21 (90%)

WEEK 4 (Supporting):
┌─────────────────────────────────────┐
│ Day 1-2: integration-specialist     │
│ Day 3-5: api-integration-workflow   │
└─────────────────────────────────────┘
Target: 2 skills → 21/21 (100%)
```

---

## 🎯 Trigger Keywords Reference

### Quick Lookup Table

| Module | Keywords | Skill |
|--------|----------|-------|
| **Monitor** | monitor, AI platform, track visibility, check mentions | monitoring-specialist |
| **Competitive** | competitor, benchmark, competitive analysis, track competitors | competitive-specialist |
| **Recommendations** | recommendations, smart recs, prioritize actions, generate suggestions | recommendations-specialist |
| **Audit** | audit site, technical SEO, schema validation, crawl site | audit-specialist |
| **Content** | create content, generate article, optimize copy, GEO content | content-specialist |
| **Admin** | admin, CRM, analytics dashboard, admin operations | admin-specialist |
| **GEO** | GEO score, calculate score, optimize for AI, scoring algorithm | geo-specialist |
| **Integrations** | integrate, OAuth, webhook, external service | integration-specialist |

### Examples

```
✅ User: "Monitor our brand on Perplexity and Claude"
→ Triggers: "monitor", "brand"
→ Loads: monitoring-specialist

✅ User: "Generate recommendations for improving our GEO score"
→ Triggers: "recommendations", "GEO score"
→ Loads: recommendations-specialist, geo-specialist

✅ User: "Audit our site for schema markup"
→ Triggers: "audit", "schema"
→ Loads: audit-specialist

✅ User: "Track competitor Searchable.ai"
→ Triggers: "competitor", "track"
→ Loads: competitive-specialist
```

---

## 🔧 Usage Examples

### Example 1: Monitor Brand Visibility

```typescript
// User prompt (automatic)
"Check brand mentions on ChatGPT, Claude, and Gemini"

// System behavior
1. registry.ts detects keywords: ["check", "brand", "mentions"]
2. Loads: monitoring-specialist
3. Skill provides workflow:
   - Initialize browser sessions (3 platforms)
   - Query each platform with brand keywords
   - Detect mentions and positioning
   - Calculate visibility scores
   - Store results in database
4. Returns summary with visibility metrics
```

### Example 2: Competitor Analysis

```typescript
// User prompt (manual)
"/competitive-specialist analyze Searchable.ai"

// System behavior
1. Explicitly loads: competitive-specialist
2. Skill provides workflow:
   - Scrape competitor website
   - Analyze features and pricing
   - Calculate competitive scores
   - Generate roadmap to close gaps
   - Create deep-dive report
3. Returns scorecard + roadmap + recommendations
```

### Example 3: Create GEO-Optimized Content

```typescript
// User prompt (automatic)
"Generate an article about 'AI-powered market research' optimized for GEO"

// System behavior
1. registry.ts detects: ["generate", "article", "GEO"]
2. Loads: content-specialist
3. Skill provides workflow:
   - Load brand voice from database
   - Generate GEO-optimized outline
   - Write conversational FAQ sections
   - Add schema markup recommendations
   - Optimize for AI platform citations
4. Returns draft article + metadata
```

---

## 🛠️ Development Workflow

### Creating a New Skill

```bash
# Step 1: Use template
/create-skill

# Step 2: Follow prompts
Name: my-specialist
Category: apex-module
Triggers: keyword1, keyword2
Priority: high

# Step 3: Skill directory created
.claude/skills/_apex-modules/my-specialist/
├── SKILL.md           # Generated from template
├── workflows/         # Empty (add workflows)
└── examples/          # Empty (add examples)

# Step 4: Register in registry.ts
'my-module': {
  name: 'my-specialist',
  category: 'apex-module',
  path: '_apex-modules/my-specialist',
  triggers: ['keyword1', 'keyword2'],
  description: 'What this does',
  priority: 'high',
  implemented: true,
}

# Step 5: Test
User: "keyword1 test"
→ Should load my-specialist
```

---

## 📚 Related Documentation

- **Main Audit**: `docs/APEX_SKILL_AUDIT_2026.md`
- **Summary**: `docs/SKILL_REORGANIZATION_SUMMARY.md`
- **This Visual Guide**: `docs/SKILL_SYSTEM_VISUAL_GUIDE.md`
- **Skill README**: `.claude/skills/README.md`
- **Skill Registry**: `.claude/skills/registry.ts`

---

## ✅ Quick Commands

```bash
# View skill status
/pai-status

# Load specific skill
/monitoring-specialist
/competitive-specialist
/recommendations-specialist

# Create new skill
/create-skill

# Check registry stats
node -e "const r = require('./.claude/skills/registry.ts'); console.log(r.getImplementationStats())"

# Clean worktree duplicates
bash scripts/cleanup-worktree-claude-dirs.sh
```

---

**Visual Guide Created**: 2026-01-18
**Last Updated**: 2026-01-18
**Status**: Phase 1 Complete
