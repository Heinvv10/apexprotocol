#!/usr/bin/env bun

/**
 * mcp-health-checker.ts
 *
 * Ensures MCP servers are connected when starting a session.
 * Runs on SessionStart to detect and report disconnected servers.
 *
 * Problem Solved:
 * - MCP servers disconnect when switching between projects
 * - Status shows "16 configured" but servers aren't actually connected
 * - Users have to manually run /mcp to reconnect
 *
 * Solution:
 * - Check which servers are configured in settings.json and .mcp.json
 * - Output instructions for reconnecting if servers appear disconnected
 * - Provide quick fix commands for common issues
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PAI_DIR = process.env.PAI_DIR || join(homedir(), '.claude');
const PROJECT_ROOT = process.cwd();

interface McpServerConfig {
  command?: string;
  args?: string[];
  type?: string;
  url?: string;
  env?: Record<string, string>;
  description?: string;
}

interface McpHealthReport {
  globalServers: string[];
  projectServers: string[];
  allServers: string[];
  potentialIssues: string[];
  recommendations: string[];
}

function getMcpServers(): McpHealthReport {
  const report: McpHealthReport = {
    globalServers: [],
    projectServers: [],
    allServers: [],
    potentialIssues: [],
    recommendations: []
  };

  // 1. Check global settings.json
  const globalSettingsPath = join(PAI_DIR, 'settings.json');
  if (existsSync(globalSettingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(globalSettingsPath, 'utf-8'));
      if (settings.mcpServers) {
        report.globalServers = Object.keys(settings.mcpServers);
      }

      // Check if enableAllProjectMcpServers is set
      if (!settings.enableAllProjectMcpServers) {
        report.potentialIssues.push('enableAllProjectMcpServers is not enabled in global settings');
        report.recommendations.push('Add "enableAllProjectMcpServers": true to ~/.claude/settings.json');
      }
    } catch (e) {
      report.potentialIssues.push('Could not parse global settings.json');
    }
  }

  // 2. Check project .mcp.json
  const projectMcpPath = join(PROJECT_ROOT, '.mcp.json');
  if (existsSync(projectMcpPath)) {
    try {
      const mcpConfig = JSON.parse(readFileSync(projectMcpPath, 'utf-8'));
      if (mcpConfig.mcpServers) {
        report.projectServers = Object.keys(mcpConfig.mcpServers);

        // Check for servers that require environment variables
        for (const [name, config] of Object.entries(mcpConfig.mcpServers as Record<string, McpServerConfig>)) {
          if (config.env) {
            for (const [envVar, value] of Object.entries(config.env)) {
              if (value.startsWith('${') && value.endsWith('}')) {
                const actualEnvVar = value.slice(2, -1);
                if (!process.env[actualEnvVar]) {
                  report.potentialIssues.push(`${name}: Missing env var ${actualEnvVar}`);
                  report.recommendations.push(`Set ${actualEnvVar} in your environment or settings.json`);
                }
              }
            }
          }

          // Check for HTTP servers that might not be running
          if (config.type === 'http' && config.url) {
            if (config.url.includes('localhost')) {
              report.potentialIssues.push(`${name}: Uses localhost - server may not be running`);
              if (name === 'veritas') {
                report.recommendations.push('Start Veritas: docker compose -f docker-compose.veritas.yml up -d');
              }
            }
          }
        }
      }
    } catch (e) {
      report.potentialIssues.push('Could not parse project .mcp.json');
    }
  }

  // 3. Check project .claude/.mcp.json (nested location)
  const projectClaudeMcpPath = join(PROJECT_ROOT, '.claude', '.mcp.json');
  if (existsSync(projectClaudeMcpPath)) {
    try {
      const mcpConfig = JSON.parse(readFileSync(projectClaudeMcpPath, 'utf-8'));
      if (mcpConfig.mcpServers) {
        const nestedServers = Object.keys(mcpConfig.mcpServers);
        report.projectServers = [...new Set([...report.projectServers, ...nestedServers])];
      }
    } catch (e) {
      // Silently ignore
    }
  }

  // Combine all servers
  report.allServers = [...new Set([...report.globalServers, ...report.projectServers])];

  // Check for common issues
  const essentialServers = ['context7', 'memory', 'sequential-thinking'];
  for (const server of essentialServers) {
    if (!report.allServers.includes(server)) {
      report.potentialIssues.push(`Essential server '${server}' not configured`);
    }
  }

  return report;
}

function displayHealthReport(report: McpHealthReport): void {
  const projectName = PROJECT_ROOT.split(/[/\\]/).pop() || 'unknown';

  console.error('\n' + '='.repeat(60));
  console.error('🔌 MCP HEALTH CHECK');
  console.error('='.repeat(60));
  console.error(`📁 Project: ${projectName}`);
  console.error(`🌐 Global Servers: ${report.globalServers.length} (${report.globalServers.slice(0, 5).join(', ')}${report.globalServers.length > 5 ? '...' : ''})`);
  console.error(`📦 Project Servers: ${report.projectServers.length} (${report.projectServers.slice(0, 5).join(', ')}${report.projectServers.length > 5 ? '...' : ''})`);
  console.error(`📊 Total Configured: ${report.allServers.length}`);

  if (report.potentialIssues.length > 0) {
    console.error('\n⚠️  POTENTIAL ISSUES:');
    report.potentialIssues.forEach(issue => console.error(`   • ${issue}`));
  }

  if (report.recommendations.length > 0) {
    console.error('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.error(`   • ${rec}`));
  }

  // Always show reconnection tip
  console.error('\n🔧 TO RECONNECT MCP SERVERS:');
  console.error('   • Run: /mcp (shows status and allows reconnection)');
  console.error('   • Or restart Claude Code in this project');
  console.error('='.repeat(60) + '\n');

  // Output system reminder for Claude to act on
  if (report.potentialIssues.length > 0) {
    console.log(`<system-reminder>
MCP_HEALTH_WARNING
Some MCP servers may be disconnected or misconfigured.
Issues found: ${report.potentialIssues.length}
- ${report.potentialIssues.join('\n- ')}

If MCP tools fail, suggest user runs /mcp to check connection status.
</system-reminder>`);
  }
}

async function main() {
  try {
    // Skip for subagents
    const isSubagent = process.env.CLAUDE_AGENT_TYPE !== undefined ||
                       (process.env.CLAUDE_PROJECT_DIR || '').includes('/.claude/agents/');

    if (isSubagent) {
      process.exit(0);
    }

    const report = getMcpServers();
    displayHealthReport(report);

    process.exit(0);
  } catch (error) {
    console.error('MCP health check error:', error);
    process.exit(1);
  }
}

main();
