# Protocol Documentation - Progressive Disclosure

**Purpose**: Detailed protocol documentation loaded on-demand to reduce context consumption

---

## Progressive Disclosure Strategy

Instead of loading ALL protocol details into every session, protocols are loaded only when needed:
- **System Prompt**: Contains only brief protocol summaries and pointers
- **On-Demand Loading**: Full protocol details read when relevant to current task
- **Context Efficiency**: Saves 10,000+ tokens by loading only what's needed

---

## Available Protocols

### dgts-validation.md
**Load When**: Running validation, code review, test verification, quality checks
**Purpose**: Prevent agents from gaming the system with fake tests or implementations
**Key Content**: 60+ gaming patterns, validation process, scoring system

### nlnh-protocol.md
**Load When**: Need to verify truthfulness, accuracy, or when uncertainty exists
**Purpose**: Enforce absolute truthfulness and prevent hallucinations
**Key Content**: Anti-arrogance rules, confidence scales, response formats

### doc-driven-tdd.md
**Load When**: Adding new features, writing tests, validating implementations
**Purpose**: Force tests from documentation BEFORE implementation
**Key Content**: TDD workflow, test requirements, coverage standards

### playwright-testing.md
**Load When**: Working on UI, after feature builds, before deployments
**Purpose**: Ensure comprehensive E2E testing for UI changes
**Key Content**: Test categories, execution flow, minimum coverage

### antihall-validator.md
**Load When**: Suggesting code changes, referencing methods, working with codebase
**Purpose**: Validate code exists before suggesting it
**Key Content**: Validation commands, required checks, common patterns

### zero-tolerance-quality.md
**Load When**: Code review, pre-commit validation, quality checks
**Purpose**: Enforce automatic blocking of quality violations
**Key Content**: Critical patterns, validation commands, standards

### forbidden-commands.md
**Load When**: Any terminal operations, process management, system commands
**Purpose**: Prevent data loss from destructive commands
**Key Content**: Banned commands, safe alternatives, emergency protocol

---

## Loading Instructions

### For Claude (Agent)
When you encounter a task that relates to a protocol:

1. **Identify relevant protocol** based on task type
2. **Read the protocol file** using Read tool
3. **Apply the protocol** to your current task
4. **Only load what you need** - don't load all protocols upfront

Example:
```
User asks to validate code quality
→ Read .claude/protocols/zero-tolerance-quality.md
→ Read .claude/protocols/dgts-validation.md
→ Apply validation rules
```

### For Users
Protocols are automatically available to Claude. You can:
- Reference protocols by name: "Use NLNH protocol"
- Point to specific protocol files if needed
- Edit protocols to customize for your workflow

---

## Context Savings

| Scenario | Old Approach | New Approach | Tokens Saved |
|----------|-------------|--------------|--------------|
| Simple query | All protocols (~15k tokens) | No protocols (0 tokens) | ~15,000 |
| Code validation | All protocols (~15k tokens) | 3 protocols (~4k tokens) | ~11,000 |
| UI testing | All protocols (~15k tokens) | 2 protocols (~3k tokens) | ~12,000 |

**Average savings**: ~10,000 tokens per session that can be used for actual work!

---

## Protocol Updates

To update a protocol:
1. Edit the relevant .md file in this directory
2. Changes take effect immediately (no restart needed)
3. Claude will read the updated content on next load

---

## Integration with Memory System

Protocols work alongside the memory system:
- **Protocols**: Reusable rules and processes (static knowledge)
- **Memories**: Session-specific context and state (dynamic knowledge)
- Together they provide Claude with the right context at the right time
