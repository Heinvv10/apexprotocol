#!/usr/bin/env bun

/**
 * proactive-scanner.ts
 *
 * Claude Code hook that proactively scans projects for actionable suggestions.
 * Runs on session start to provide immediate context about issues, TODOs,
 * security concerns, and missing tests.
 *
 * Features:
 * - Universal project detection (works with any project)
 * - Scans for TODOs, quality issues, security concerns, missing tests
 * - Persists suggestions to queue for tracking
 * - Outputs summary for context injection
 * - Non-blocking (never prevents session from starting)
 *
 * Exit Codes:
 * - 0: Always (never blocks session start)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

// Hardcoded path for Windows compatibility
const HOME = process.env.USERPROFILE || process.env.HOME || '';
const PROACTIVE_DIR = join(HOME, '.claude', 'proactive');

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
  working_directory?: string;
}

interface ScanConfig {
  enabled: boolean;
  scanOnStart: boolean;
  minTimeBetweenScans: number; // minutes
  outputToContext: boolean;
  maxSuggestions: number;
}

const DEFAULT_CONFIG: ScanConfig = {
  enabled: true,
  scanOnStart: true,
  minTimeBetweenScans: 30, // Don't re-scan within 30 minutes
  outputToContext: true,
  maxSuggestions: 5
};

/**
 * Read JSON input from stdin
 */
async function readStdin(): Promise<HookInput> {
  const decoder = new TextDecoder();
  const reader = Bun.stdin.stream().getReader();
  let input = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    input += decoder.decode(value, { stream: true });
  }

  return JSON.parse(input);
}

/**
 * Load scanner config
 */
function loadConfig(): ScanConfig {
  const configPath = join(PROACTIVE_DIR, 'config.json');

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Check if we should skip scanning (too recent)
 */
function shouldSkipScan(projectPath: string, minMinutes: number): boolean {
  const queueDir = join(PROACTIVE_DIR, 'suggestions', 'data');
  const safeName = projectPath
    .replace(/[:\\\/]/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  const queuePath = join(queueDir, `${safeName}.json`);

  if (!existsSync(queuePath)) {
    return false; // No previous scan, should scan
  }

  try {
    const content = readFileSync(queuePath, 'utf-8');
    const queue = JSON.parse(content);
    const lastScan = new Date(queue.lastScan);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastScan.getTime()) / (1000 * 60);

    return diffMinutes < minMinutes;
  } catch {
    return false;
  }
}

/**
 * Check if project is worth scanning
 */
function isValidProject(projectRoot: string): boolean {
  const indicators = [
    'package.json',
    'pyproject.toml',
    'requirements.txt',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'Makefile',
    'composer.json',
    'Gemfile',
    '.git',           // Any git repo
    'CLAUDE.md',      // Claude project
    'src',            // Has source directory
    'lib',            // Has lib directory
    '.claude'         // Has claude config
  ];

  return indicators.some(file => existsSync(join(projectRoot, file)));
}

/**
 * Run the scanner dynamically
 */
async function runScanner(projectRoot: string): Promise<{ summary: string; suggestionCount: number } | null> {
  try {
    // Dynamically import scanner modules
    const scannerPath = join(PROACTIVE_DIR, 'scanner', 'index.ts');
    const queuePath = join(PROACTIVE_DIR, 'suggestions', 'queue.ts');

    if (!existsSync(scannerPath)) {
      console.error('[proactive-scanner] Scanner not found:', scannerPath);
      return null;
    }

    // Import scanner
    const { scanProject, generateSummary } = await import(scannerPath);
    const { loadQueue, mergeQueues, saveQueue } = await import(queuePath);

    // Run scan
    const result = await scanProject(projectRoot, {
      todos: true,
      quality: true,
      security: true,
      testing: true,
      maxFiles: 300, // Limit for faster startup
      minConfidence: 0.6
    });

    // Merge with existing queue
    const existingQueue = loadQueue(projectRoot);
    const mergedQueue = mergeQueues(
      existingQueue,
      result.suggestions,
      result.profile.name,
      projectRoot,
      result.scanDuration
    );

    // Save updated queue
    saveQueue(mergedQueue);

    // Generate summary
    const summary = generateSummary(result);

    return {
      summary,
      suggestionCount: result.suggestions.length
    };

  } catch (error: any) {
    console.error('[proactive-scanner] Scanner error:', error.message);
    return null;
  }
}

/**
 * Main hook execution
 */
async function main() {
  // Debug: Write to file to verify hook execution
  const debugFile = join(HOME, '.claude', 'proactive', 'debug.log');
  writeFileSync(debugFile, `Hook started at ${new Date().toISOString()}\n`);

  try {
    // Read hook input
    const hookInput = await readStdin();
    const projectRoot = hookInput.working_directory || process.cwd();

    // Debug: Log input
    writeFileSync(debugFile, `Input: ${JSON.stringify(hookInput)}\nProject: ${projectRoot}\n`, { flag: 'a' });

    // Load configuration
    const config = loadConfig();

    if (!config.enabled || !config.scanOnStart) {
      process.exit(0);
    }

    // Check if valid project
    writeFileSync(debugFile, `Checking if valid project...\n`, { flag: 'a' });
    if (!isValidProject(projectRoot)) {
      writeFileSync(debugFile, `Not a valid project, exiting\n`, { flag: 'a' });
      process.exit(0);
    }
    writeFileSync(debugFile, `Valid project!\n`, { flag: 'a' });

    // Check if we should skip (recent scan exists)
    if (shouldSkipScan(projectRoot, config.minTimeBetweenScans)) {
      // Load existing suggestions for context
      try {
        const queuePath = join(PROACTIVE_DIR, 'suggestions', 'queue.ts');
        if (existsSync(queuePath)) {
          const { getSuggestionsForContext } = await import(queuePath);
          const context = getSuggestionsForContext(projectRoot, config.maxSuggestions);
          if (context && config.outputToContext) {
            console.log('\n' + context);
          }
        }
      } catch {
        // Silent
      }
      process.exit(0);
    }

    // Run scanner
    console.error('[proactive-scanner] Scanning project...');
    const result = await runScanner(projectRoot);

    if (result && result.summary && config.outputToContext) {
      // Output to user (stderr) AND to Claude context (stdout)
      console.error('\n' + result.summary);
      console.log(`<system-reminder>
PROACTIVE SCANNER RESULTS
${result.summary}
Use "show suggestions" or "fix [type]" commands to help the user address these.
</system-reminder>`);
    }

    process.exit(0);

  } catch (error: any) {
    // Never block session start
    console.error('[proactive-scanner] Hook error:', error.message);
    process.exit(0);
  }
}

main();
