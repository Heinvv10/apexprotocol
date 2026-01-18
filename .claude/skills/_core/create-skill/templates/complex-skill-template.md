---
name: skill-name
description: |
  Comprehensive description. Mention key methods and tools.
  USE WHEN user says 'trigger phrase 1', 'trigger phrase 2', or requests related capabilities.

  === CONTEXT CONTRACT (2025 Optimization) ===
  max_total_tokens: 4000
  max_system_tokens: 300
  max_context_tokens: 2700
  max_output_reserve: 1000
  priority_order: [user_query, relevant_entities, recent_context, knowledge_chunks]

  === EFFORT MAPPING ===
  simple_lookup: low (Haiku, minimal tokens)
  semantic_search: medium (Sonnet, standard budget)
  complex_analysis: high (Opus, extended thinking)

  === LATENCY TARGETS ===
  cache_hit: 15ms
  cache_miss: 800ms
  p95_response: 1500ms
  p99_response: 3000ms

triggers:
  - trigger phrase 1
  - trigger phrase 2
  - related capability request

model: sonnet  # haiku for simple, sonnet for standard, opus for complex
---

# Skill Name

## When to Activate This Skill
- Building/creating [domain] applications
- Implementing [capability]
- User requests [specific feature]
- Working with [technology stack]
- [Domain]-related tasks

## Core Workflow

### Phase 1: [Setup/Initialization]
**Command:** `/command-name` (if applicable)

[Quick setup instructions]

**Key actions:**
- Action 1
- Action 2
- Action 3

### Phase 2: [Main Work]
**Command:** `/command-name` (if applicable)

[Core execution steps]

**Key actions:**
- Action 1
- Action 2
- Action 3

### Phase 3: [Validation/Completion]
**Command:** `/command-name` (if applicable)

[Validation and completion steps]

**Key actions:**
- Action 1
- Action 2
- Action 3

## Key Components

- **Component 1**: Brief description and purpose
- **Component 2**: Brief description and purpose
- **Component 3**: Brief description and purpose

## Default Configuration / Stack

Standard setup for this skill:
- Technology 1
- Technology 2
- Technology 3
- Tool 1 (not Tool 2)
- Package manager preference

## Critical Requirements

- **Requirement 1** (MANDATORY) - Explanation
- **Requirement 2** (MANDATORY) - Explanation
- **Requirement 3** (MANDATORY) - Explanation

## Supplementary Resources

For full methodology: `read ${PAI_DIR}/skills/[skill-name]/CLAUDE.md`
For component details: `read ${PAI_DIR}/skills/[skill-name]/[component-dir]/`
For stack info: `read ${PAI_DIR}/skills/[skill-name]/primary-stack/CLAUDE.md`

## Available Commands

- `/command-1` - What it does and when to use
- `/command-2` - What it does and when to use
- `/command-3` - What it does and when to use

## Key Principles

1. Principle 1 with brief explanation
2. Principle 2 with brief explanation
3. Principle 3 with brief explanation
4. Principle 4 with brief explanation
5. Principle 5 with brief explanation

## Deferred Tool Loading

```yaml
tools:
  always_loaded:
    - core_tool_1
    - core_tool_2
  defer_loading: true
  deferred_tools:
    - expensive_tool_1
    - expensive_tool_2
```

**Benefit**: Reduces initial context by 40-60% while maintaining full capability.

---

## Agent Routing Display

When routing to this skill, display:

```
╔═══════════════════════════════════════════╗
║ 🤖 AGENT ROUTING                          ║
╠═══════════════════════════════════════════╣
║ Task: [User's task description]           ║
║ Selected: [skill-name]                    ║
║ Reason: [Why this skill matches]          ║
║ Confidence: [X]%                          ║
╚═══════════════════════════════════════════╝
```

---

## Quick Reference

### Common Tasks

**Task 1:**
```bash
command-sequence-1
```

**Task 2:**
```bash
command-sequence-2
```

**Task 3:**
```bash
command-sequence-3
```

---

## MCP Integration (if applicable)

### Available MCP Servers
- **context7**: Use `use context7` for real-time documentation
- **memory**: Cross-session knowledge persistence
- **sequential-thinking**: Complex problem decomposition
- **veritas**: Truth enforcement with DGTS + NLNH

### Usage Pattern
```
"use context7 to look up [library] [version] documentation"
```
