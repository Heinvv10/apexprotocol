# Claude Agent SDK Workshop - Key Concepts

**Video**: Claude Agent SDK Workshop (2+ hours)
**Presenter**: Anthropic Team
**Source**: https://youtu.be/TqC1qOfiVcQ
**Transcript Lines**: 2,858 segments

---

## 🎯 Core Concepts

### 1. **Evolution of AI Features**
- **Single LLM Features** → Simple categorization, classification
- **Workflows** → Structured tasks (email labeling, RAG-based code completion)
- **Agents** → Autonomous decision-making, build own context, multi-step trajectories
  - **Example**: Claude Code - first true agent working 10-30 minutes autonomously

### 2. **What is the Claude Agent SDK?**

**Built on top of Claude Code** - Packages everything needed for agent development:

```
┌─────────────────────────────────────┐
│     Claude Agent SDK Components     │
├─────────────────────────────────────┤
│ • Models (Claude)                   │
│ • Tools (custom + filesystem)       │
│ • Agent Loop (harness)              │
│ • Prompts (core agent instructions) │
│ • File System (context engineering) │
│ • Skills (progressive context)      │
│ • Sub-agents                        │
│ • Web Search                        │
│ • Compacting & Memory               │
│ • Hooks                             │
└─────────────────────────────────────┘
```

**Why built on Claude Code?**
- People used Claude Code for **non-coding tasks** (finance, marketing, data science)
- The **bash tool** made it universally applicable
- Emergent pattern: Claude Code harness works for all agent types

---

## 🏗️ Agent Design Philosophy

### The 3-Part Agent Loop

```
1. GATHER CONTEXT
   └─> How does agent find information?
   └─> What context does it need?
   └─> Does it have right tools?

2. TAKE ACTION
   └─> What actions can it perform?
   └─> How does it modify state?

3. VERIFY/ITERATE
   └─> Check results
   └─> Continue or exit loop
```

### Key Insight: "Read the Traces"
> "The meta-learning for designing an agent loop is just to read the traces"

- Watch what the agent does
- Observe where it struggles
- Iterate based on actual behavior

---

## 🛠️ Tools vs Bash vs Code Generation

### Comparison Matrix

| Approach | Pros | Cons | Use When |
|----------|------|------|----------|
| **Tools** | • Extremely structured<br>• Minimal retries<br>• Deterministic | • High context usage<br>• Not composable<br>• 100 tools = bloat | Well-defined APIs<br>Structured data |
| **Bash Scripts** | • Low context usage<br>• Highly composable<br>• Flexible | • Higher latency<br>• Error-prone<br>• Requires good CLI design | Complex workflows<br>Dynamic operations |
| **Code Generation** | • Most flexible<br>• Can do anything | • Highest latency<br>• Compilation issues<br>• Complex debugging | Novel problems<br>One-off tasks |

### Best Practice: **Hybrid Approach**
- Start with **few core tools** (5-10 max)
- Use **bash for composability**
- Reserve **code generation** for edge cases

---

## 📚 Skills System

### What are Skills?

**Skills = Progressive Context Loading**

```markdown
Skills are documentation/context that tell the agent:
- How to perform specific tasks
- Domain-specific knowledge
- Best practices for workflows
```

### Characteristics:
- Released ~2 weeks before workshop
- Form of **context engineering**
- Not tools, but **instructions/knowledge**
- Can be specific (frontend design) or general

### Examples:
- **Frontend Design Skill** - Teaches agent design patterns
- **Domain-specific** - Industry knowledge (legal, finance)
- **Task-specific** - How to use particular APIs/frameworks

### Future Vision:
- Possible **skills marketplace**
- Some skills may become **part of model** over time
- Best way to handle **variety of tasks** without bloating context

---

## 🎨 System Design Principles

### 1. **Context Engineering is Key**
> "Context is not just the prompt - it's the tools, the files, and scripts"

- File system structure matters
- Tool availability shapes behavior
- Progressive disclosure (skills) reduces context bloat

### 2. **API Design Matters**
- CLI scripts should have **structured output** (JSON, TSV)
- Think about composability
- Design for agent consumption

### 3. **Opinionated Stack**
The SDK is **highly opinionated** based on:
- Lessons from deploying Claude Code at scale
- Best practices for tool use errors
- Context compacting strategies
- Memory management patterns

### 4. **Start Simple, Iterate**
```
1. Start with Agent SDK (don't build harness from scratch)
2. Add minimal tools (5-10 max)
3. Use bash for complex workflows
4. Add skills for domain knowledge
5. Read traces and iterate
```

---

## 🚀 When to Use Agent SDK

### ✅ Good Use Cases:
- **Software agents** - Reliability, security, bug triaging
- **Site/dashboard builders** - Extremely popular
- **Office automation** - Finance, legal, healthcare
- **Research agents** - Information gathering, analysis
- **Multi-step workflows** - Tasks requiring planning

### ⚠️ Consider Alternatives When:
- Simple single-step tasks
- Highly deterministic workflows
- Real-time requirements (<1s latency)
- Want full control over every detail

---

## 🔧 Technical Implementation Notes

### Harness Components:
```python
# Core agent loop pseudo-code
while not_done:
    context = gather_context()  # Read files, search, use tools
    action = decide_action(context)  # Model decides next step
    result = execute_action(action)  # Run tool/bash/codegen
    verify_and_continue(result)  # Check success, iterate
```

### Sub-agents:
- Can spawn **specialized sub-agents** for specific tasks
- Useful for parallelization
- Example: Research sub-agent while main agent continues

### Memory & Compacting:
- SDK handles **context compacting** automatically
- Memory tools available for persistence
- Best practices baked in from Claude Code deployment

---

## 💡 Key Quotes

> "Agents build their own context, decide their own trajectories, work very autonomously"

> "When building agents at Anthropic, we kept rebuilding the same parts over and over"

> "People were using Claude Code for non-coding tasks - finance, marketing, data science"

> "The bash tool is what makes it universally applicable"

> "Skills are a form of progressive context loading"

> "The meta-learning for designing an agent loop is to read the traces"

> "Tools are extremely structured but high context usage - you don't want 100 tools"

> "Context is not just the prompt - it's the tools, the files, scripts the agent can use"

---

## 🎓 Workshop Structure

1. **Introduction** (0:00-10:00) - What is SDK, why use it
2. **Agent Design Philosophy** (10:00-25:00) - How to think about agents
3. **Tools vs Bash** (25:00-40:00) - Technical implementation choices
4. **Skills & Context** (30:00-40:00) - Progressive context loading
5. **Live Coding** (40:00+) - Building agents with SDK
6. **Q&A Throughout** - Collaborative discussion

---

## 🔗 Related to PAI

### Alignments with PAI:
- ✅ Skills-based architecture (PAI has 45 skills)
- ✅ Progressive context loading (PAI CLAUDE.md pattern)
- ✅ Bash-first approach (PAI uses bash heavily)
- ✅ Context engineering focus
- ✅ Hook system integration

### Potential Enhancements:
- Consider sub-agent patterns from SDK
- Review tools vs bash balance
- Explore skills marketplace concept
- Apply "read the traces" debugging methodology

---

**Full Transcript**: `.temp/claude-agent-sdk-workshop-transcript.txt`
