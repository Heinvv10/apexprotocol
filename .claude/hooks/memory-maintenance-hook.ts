#!/usr/bin/env bun

/**
 * memory-maintenance-hook.ts
 *
 * Stop hook that enforces memory system updates at the end of each conversation turn.
 * Uses dynamic registry for project detection - supports auto-registered projects.
 *
 * Setup: Add to settings.json Stop hooks array
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

interface ProjectEntry {
  path: string;
  sessionId: string;
  memoryFile: string;
  alias: string;
  registeredAt: string;
}

interface Registry {
  projects: Record<string, ProjectEntry>;
}

function loadRegistry(registryPath: string): Registry | null {
  if (!existsSync(registryPath)) return null;
  try {
    return JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch {
    return null;
  }
}

function findProjectByPath(registry: Registry, currentPath: string): [string, ProjectEntry] | null {
  const normalizedCurrent = currentPath.toLowerCase().split('\\').join('/');
  for (const [name, project] of Object.entries(registry.projects)) {
    const normalizedProject = project.path.toLowerCase().split('\\').join('/');
    if (normalizedCurrent.includes(normalizedProject) || normalizedProject.includes(normalizedCurrent)) {
      return [name, project];
    }
  }
  return null;
}

async function main() {
  try {
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/agents/') || process.env.CLAUDE_AGENT_TYPE !== undefined;
    if (isSubagent) {
      console.error('Subagent session - skipping memory maintenance');
      process.exit(0);
    }

    const paiDir = process.env.PAI_DIR || join(homedir(), '.claude');
    const memoriesDir = join(paiDir, 'memories');
    const registryPath = join(memoriesDir, 'projects', 'registry.json');
    const currentDir = process.cwd();

    const registry = loadRegistry(registryPath);
    let projectMemorySection = '';
    let projectInstructions = '';
    let projectName = '';

    if (registry) {
      const result = findProjectByPath(registry, currentDir);
      if (result) {
        const [name, project] = result;
        projectName = name;
        const projectMemoryPath = join(memoriesDir, 'projects', project.memoryFile);
        if (existsSync(projectMemoryPath)) {
          projectMemorySection = `

3. **${projectMemoryPath}** (PROJECT: ${name}) - Update with:
   - Progress made on ${name}
   - Key decisions for this project
   - Technical context (stack, patterns, blockers)
   - What to continue next session`;
          projectInstructions = `
- For ${name}: Update the project-specific memory file with technical context`;
        }
      }
    }

    const reminder = `
<system-reminder>
**MEMORY SYSTEM UPDATE REQUIRED**

Before finishing your response, you MUST update the memory system.

**Memory Files to Update**:
1. **${memoriesDir}/current.md** - Update with:
   - Tasks completed in this turn
   - Important decisions made
   - Context needed for next turn
   - Any blockers or questions

2. **${memoriesDir}/project-index.md** - Update if:
   - Working on a new project
   - Project status changed
   - Important project info to track${projectMemorySection}

**Instructions**:
- Read the current memory files first
- Add new information, don't erase existing context
- Use concise, clear language
- Move old items from current.md to archive.md if they're no longer active
- Keep current.md focused on immediate context${projectInstructions}

**When to Skip**:
- Trivial queries (e.g., "what time is it?")
- Simple questions that don't change project state
- User just said "thanks" or similar

For all other interactions, update the memory system now.

Read: ${memoriesDir}/README.md for memory system documentation.
</system-reminder>
`;

    console.log(reminder);
    console.error('Memory maintenance reminder injected' + (projectName ? ' (Project: ' + projectName + ')' : ''));
    process.exit(0);
  } catch (error) {
    console.error('Memory maintenance hook error:', error);
    process.exit(1);
  }
}

main();
