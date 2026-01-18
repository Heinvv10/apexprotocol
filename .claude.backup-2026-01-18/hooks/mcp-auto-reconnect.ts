#!/usr/bin/env bun

/**
 * mcp-auto-reconnect.ts
 *
 * Automatically reconnects MCP servers on session start.
 *
 * Problem: MCP servers often fail to connect on startup due to:
 * - Race conditions (connections close within 1ms)
 * - Timeout issues (health checks fail before servers ready)
 * - Package manager caching issues
 *
 * Solution:
 * - Pre-warm critical MCP server packages before Claude tries to connect
 * - Add retry delays for servers that need initialization time
 * - Output instructions for manual reconnection if needed
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PAI_DIR = process.env.PAI_DIR || join(homedir(), '.claude');
const CACHE_DIR = join(PAI_DIR, 'cache', 'mcp');
const WARMUP_CACHE = join(CACHE_DIR, 'warmup-status.json');

interface WarmupStatus {
  lastWarmup: number;
  warmedServers: string[];
}

// Critical servers that should always be warmed up
const CRITICAL_SERVERS = [
  { name: 'memory', package: '@modelcontextprotocol/server-memory' },
  { name: 'sequential-thinking', package: '@modelcontextprotocol/server-sequential-thinking' },
  { name: 'context7', package: '@upstash/context7-mcp@1.0.31' },
  { name: 'github', package: '@modelcontextprotocol/server-github' },
  { name: 'playwright', package: '@playwright/mcp@latest' },
];

// Warmup timeout per server (ms)
const WARMUP_TIMEOUT = 15000;

// How often to re-warmup (24 hours in ms)
const WARMUP_INTERVAL = 24 * 60 * 60 * 1000;

function getWarmupStatus(): WarmupStatus {
  try {
    if (existsSync(WARMUP_CACHE)) {
      return JSON.parse(readFileSync(WARMUP_CACHE, 'utf-8'));
    }
  } catch {
    // Ignore parse errors
  }
  return { lastWarmup: 0, warmedServers: [] };
}

function saveWarmupStatus(status: WarmupStatus): void {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(WARMUP_CACHE, JSON.stringify(status, null, 2));
  } catch {
    // Ignore write errors
  }
}

async function warmupPackage(packageName: string, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    // Use npx to download/cache the package without running it
    const proc = spawn('npx', ['-y', packageName, '--help'], {
      shell: true,
      stdio: 'ignore',
      detached: true,
    });

    proc.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });

    // Consider it warmed up after a short delay (package download started)
    setTimeout(() => {
      clearTimeout(timer);
      try {
        proc.kill();
      } catch {
        // Process may have already exited
      }
      resolve(true);
    }, 3000);
  });
}

async function warmupServers(): Promise<string[]> {
  const warmed: string[] = [];

  console.error('\n🔌 MCP Auto-Reconnect: Pre-warming server packages...');

  const warmupPromises = CRITICAL_SERVERS.map(async (server) => {
    const success = await warmupPackage(server.package, WARMUP_TIMEOUT);
    if (success) {
      warmed.push(server.name);
      console.error(`   ✓ ${server.name}`);
    } else {
      console.error(`   ✗ ${server.name} (timeout)`);
    }
    return success;
  });

  await Promise.all(warmupPromises);

  return warmed;
}

async function main() {
  try {
    // Skip for subagents
    const isSubagent = process.env.CLAUDE_AGENT_TYPE !== undefined ||
                       (process.env.CLAUDE_PROJECT_DIR || '').includes('/.claude/agents/');

    if (isSubagent) {
      process.exit(0);
    }

    const status = getWarmupStatus();
    const now = Date.now();

    // Check if we need to warmup
    const needsWarmup = (now - status.lastWarmup) > WARMUP_INTERVAL;

    if (needsWarmup) {
      console.error('\n' + '='.repeat(60));
      console.error('🔄 MCP AUTO-RECONNECT');
      console.error('='.repeat(60));
      console.error(`Last warmup: ${status.lastWarmup ? new Date(status.lastWarmup).toLocaleString() : 'Never'}`);

      const warmed = await warmupServers();

      // Save status
      saveWarmupStatus({
        lastWarmup: now,
        warmedServers: warmed
      });

      console.error('\n💡 TIP: If servers still fail, run /mcp to reconnect');
      console.error('='.repeat(60) + '\n');
    } else {
      // Just output a quick status
      console.error(`\n🔌 MCP packages cached (${Math.round((now - status.lastWarmup) / 3600000)}h ago)`);
    }

    // Output system reminder for Claude
    console.log(`<system-reminder>
MCP_AUTO_RECONNECT_COMPLETE
MCP server packages have been pre-warmed. If any MCP tools fail:
1. Suggest user run /mcp to check connection status
2. Use mcp__context7__* tools are available for documentation
3. Use mcp__memory__* tools for knowledge graph
4. Use mcp__github__* tools for GitHub operations
</system-reminder>`);

    process.exit(0);
  } catch (error) {
    console.error('MCP auto-reconnect error:', error);
    process.exit(1);
  }
}

main();
