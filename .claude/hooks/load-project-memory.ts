#!/usr/bin/env bun

/**
 * load-project-memory.ts
 *
 * Automatically loads project-specific memory at session start.
 * Uses dynamic registry for project detection - supports auto-registered projects.
 *
 * What it does:
 * - Reads project registry from ~/.claude/memories/projects/registry.json
 * - Detects which project you're in based on current working directory
 * - Loads the corresponding project memory file
 * - Injects the memory as system-reminder for context continuity
 *
 * Setup:
 * Add this hook to settings.json SessionStart hooks (after load-core-context.ts)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface ProjectEntry {
  path: string;
  sessionId: string;
  memoryFile: string;
  alias: string;
  registeredAt: string;
}

interface Registry {
  projects: Record<string, ProjectEntry>;
  version: string;
  lastUpdated: string;
}

function loadRegistry(registryPath: string): Registry | null {
  if (!existsSync(registryPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch {
    return null;
  }
}

function findProjectByPath(registry: Registry, currentPath: string): [string, ProjectEntry] | null {
  const normalizedCurrent = currentPath.replace(/\\/g, '/').toLowerCase();

  for (const [name, project] of Object.entries(registry.projects)) {
    const normalizedProject = project.path.replace(/\\/g, '/').toLowerCase();
    // Check if current path contains project path or vice versa
    if (normalizedCurrent.includes(normalizedProject) ||
        normalizedCurrent.startsWith(normalizedProject) ||
        normalizedProject.includes(normalizedCurrent)) {
      return [name, project];
    }
  }
  return null;
}

async function main() {
  try {
    // Check if this is a subagent session - if so, exit silently
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/agents/') ||
                      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      console.error('Subagent session - skipping project memory loading');
      process.exit(0);
    }

    const paiDir = process.env.PAI_DIR || join(homedir(), '.claude');
    const memoriesDir = join(paiDir, 'memories');
    const registryPath = join(memoriesDir, 'projects', 'registry.json');
    const currentDir = process.cwd();

    // Load registry
    const registry = loadRegistry(registryPath);
    if (!registry) {
      console.error('Project registry not found - skipping project memory load');
      process.exit(0);
    }

    // Find project by current path
    const result = findProjectByPath(registry, currentDir);
    if (!result) {
      console.error('No registered project detected for current directory');
      console.error(`   Current: ${currentDir}`);
      process.exit(0);
    }

    const [projectName, project] = result;
    const memoryPath = join(memoriesDir, 'projects', project.memoryFile);

    if (!existsSync(memoryPath)) {
      console.error(`Project memory file not found: ${memoryPath}`);
      process.exit(0);
    }

    console.error(`Detected project: ${projectName}`);
    console.error(`Loading project memory from: ${memoryPath}`);

    const memoryContent = readFileSync(memoryPath, 'utf-8');
    console.error(`Loaded ${memoryContent.length} characters of project memory`);

    // Output as system-reminder
    const message = `<system-reminder>
PROJECT MEMORY CONTEXT (Auto-loaded at Session Start)

Project: ${projectName}
Session ID: ${project.sessionId}
Alias: ${project.alias}
Memory File: ${memoryPath}

---
${memoryContent}
---

This project-specific context is now active. Use it to maintain continuity with previous sessions on this project.
</system-reminder>`;

    console.log(message);

    console.error('Project memory injected into session');
    process.exit(0);
  } catch (error) {
    console.error('Error in load-project-memory hook:', error);
    process.exit(1);
  }
}

main();
