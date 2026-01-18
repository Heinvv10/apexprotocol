#!/usr/bin/env bun
/**
 * apex-feature-detector.ts
 *
 * UserPromptSubmit hook that automatically detects which Apex module
 * is being worked on and loads the appropriate specialist skill.
 *
 * Features:
 * - Analyzes user prompt for module keywords
 * - Checks working directory for file context
 * - Auto-loads relevant specialist skills
 * - Creates missing skills on-demand
 * - Non-blocking (suggestions only, never forces)
 *
 * Flow:
 * 1. Read user prompt
 * 2. Extract keywords and file paths
 * 3. Match to skills in registry
 * 4. Output skill loading suggestion
 * 5. If no skill exists but needed → suggest creation
 *
 * Exit Codes:
 * - 0: Always (never blocks prompt)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface HookInput {
  prompt: string;
  context?: {
    working_directory?: string;
    recent_files?: string[];
  };
}

interface SkillMatch {
  skill: string;
  confidence: number;
  reason: string;
  triggers: string[];
}

/**
 * Module → Skill mapping
 */
const MODULE_SKILLS = {
  // Apex Modules
  monitoring: {
    skill: 'monitoring-specialist',
    keywords: ['monitor', 'platform', 'visibility', 'mention', 'track', 'chatgpt', 'claude', 'gemini', 'perplexity'],
    paths: ['src/lib/monitoring/', 'src/lib/platform-monitor/', 'src/components/monitor/', 'src/app/api/monitor/'],
    priority: 'critical',
    implemented: false,
  },
  competitive: {
    skill: 'competitive-specialist',
    keywords: ['competitor', 'competitive', 'benchmark', 'roadmap', 'gap', 'scorecard', 'deep-dive'],
    paths: ['src/lib/competitive/', 'src/components/competitive/', 'src/app/api/competitive/'],
    priority: 'critical',
    implemented: false,
  },
  recommendations: {
    skill: 'recommendations-specialist',
    keywords: ['recommendation', 'smart rec', 'prioritize', 'action', 'suggestion', 'impact'],
    paths: ['src/lib/recommendations/', 'src/components/recommendations/', 'src/app/api/recommendations/'],
    priority: 'critical',
    implemented: false,
  },
  audit: {
    skill: 'audit-specialist',
    keywords: ['audit', 'seo', 'schema', 'validation', 'crawl', 'technical', 'core web vitals'],
    paths: ['src/lib/audit/', 'src/components/audit/', 'src/app/api/audit/'],
    priority: 'high',
    implemented: false,
  },
  content: {
    skill: 'content-specialist',
    keywords: ['content', 'generate', 'article', 'optimize', 'copy', 'geo content', 'brand voice'],
    paths: ['src/lib/content/', 'src/lib/ai/', 'src/components/create/', 'src/app/api/create/', 'src/app/api/generate/'],
    priority: 'high',
    implemented: false,
  },
  admin: {
    skill: 'admin-specialist',
    keywords: ['admin', 'crm', 'analytics', 'mautic', 'dashboard', 'operations'],
    paths: ['src/lib/admin/', 'src/components/admin/', 'src/app/api/admin/', 'src/app/admin/'],
    priority: 'medium',
    implemented: false,
  },
  geo: {
    skill: 'geo-specialist',
    keywords: ['geo score', 'scoring', 'algorithm', 'weighting', 'calculate', 'optimize for ai'],
    paths: ['src/lib/geo/', 'src/lib/scoring/', 'src/app/api/geo/'],
    priority: 'medium',
    implemented: false,
  },
  integrations: {
    skill: 'integration-specialist',
    keywords: ['integration', 'oauth', 'webhook', 'external', 'api client', 'third-party'],
    paths: ['src/lib/integrations/', 'src/lib/oauth/', 'src/lib/webhooks/', 'src/app/api/integrations/'],
    priority: 'medium',
    implemented: false,
  },

  // Apex Workflows
  'brand-population': {
    skill: 'brand-population',
    keywords: ['populate brand', 'enrich brand', 'benchmark brand', 'gather brand data'],
    paths: [],
    priority: 'high',
    implemented: true,
  },
  'feature-implementation': {
    skill: 'feature-implementation-workflow',
    keywords: ['implement F', 'next feature', 'autonomous mode', 'feature workflow', 'feature_list.json'],
    paths: ['feature_list.json'],
    priority: 'critical',
    implemented: false,
  },
  'design-system': {
    skill: 'design-system-enforcer',
    keywords: ['design system', 'ui component', 'add ui', 'create component', 'style', 'card', 'glassmorphism'],
    paths: ['src/components/', 'docs/APEX_DESIGN_SYSTEM.md'],
    priority: 'high',
    implemented: false,
  },
  'api-integration': {
    skill: 'api-integration-workflow',
    keywords: ['connect api', 'backend route', 'full-stack', 'api endpoint', 'integrate service'],
    paths: ['src/app/api/', 'src/lib/api/'],
    priority: 'medium',
    implemented: false,
  },

  // Development
  coding: {
    skill: 'coding-specialists',
    keywords: ['implement', 'create', 'build', 'fix bug', 'write code', 'add feature'],
    paths: [],
    priority: 'critical',
    implemented: true,
  },
};

/**
 * Read JSON input from stdin
 */
async function readStdin(): Promise<HookInput> {
  const decoder = new TextDecoder();
  const reader = Bun.stdin.stream().getReader();
  let input = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    input += decoder.decode(value, { stream: true });
  }

  return JSON.parse(input);
}

/**
 * Extract file paths from prompt
 */
function extractFilePaths(prompt: string): string[] {
  const pathPattern = /(?:src|docs|\.claude)\/[a-zA-Z0-9_\-\/\.]+/g;
  return Array.from(prompt.matchAll(pathPattern)).map((m) => m[0]);
}

/**
 * Find matching skills based on keywords
 */
function findSkillsByKeywords(prompt: string, filePaths: string[]): SkillMatch[] {
  const lowerPrompt = prompt.toLowerCase();
  const matches: SkillMatch[] = [];

  for (const [module, config] of Object.entries(MODULE_SKILLS)) {
    let confidence = 0;
    const matchedTriggers: string[] = [];

    // Check keyword matches
    for (const keyword of config.keywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        confidence += 30;
        matchedTriggers.push(keyword);
      }
    }

    // Check file path matches
    for (const filePath of filePaths) {
      for (const modulePath of config.paths) {
        if (filePath.includes(modulePath)) {
          confidence += 40;
          matchedTriggers.push(`path:${modulePath}`);
          break;
        }
      }
    }

    // Priority boost
    if (config.priority === 'critical') confidence += 10;
    else if (config.priority === 'high') confidence += 5;

    if (confidence > 20) {
      matches.push({
        skill: config.skill,
        confidence: Math.min(confidence, 100),
        reason: `Matched: ${matchedTriggers.join(', ')}`,
        triggers: matchedTriggers,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if skill is implemented
 */
function isSkillImplemented(skillName: string): boolean {
  const skillPath = join(process.cwd(), '.claude', 'skills');

  // Check in all category directories
  const categories = ['_core', '_development', '_apex-modules', '_apex-workflows'];

  for (const category of categories) {
    const fullPath = join(skillPath, category, skillName, 'SKILL.md');
    if (existsSync(fullPath)) {
      return true;
    }
  }

  // Check root level (legacy)
  const legacyPath = join(skillPath, skillName, 'SKILL.md');
  return existsSync(legacyPath);
}

/**
 * Format skill suggestion output
 */
function formatSkillSuggestion(matches: SkillMatch[]): string {
  if (matches.length === 0) {
    return '';
  }

  const topMatch = matches[0];
  const implemented = isSkillImplemented(topMatch.skill);

  let output = '\n<system-reminder>\n';
  output += '🎯 APEX FEATURE DETECTED\n\n';
  output += `Skill: ${topMatch.skill}\n`;
  output += `Confidence: ${topMatch.confidence}%\n`;
  output += `Reason: ${topMatch.reason}\n`;

  if (implemented) {
    output += `Status: ✅ Implemented\n\n`;
    output += `SUGGESTED ACTION:\n`;
    output += `Load skill with: /${topMatch.skill}\n`;
    output += `Or let it auto-load from context.\n`;
  } else {
    output += `Status: ⚠️ Not Implemented\n\n`;
    output += `SUGGESTED ACTION:\n`;
    output += `This skill hasn't been created yet.\n`;
    output += `Auto-creating skill template...\n\n`;
    output += `Use: /create-skill to generate ${topMatch.skill}\n`;
    output += `Or say "create ${topMatch.skill} skill" to auto-generate.\n`;
  }

  // Show other matches if confidence is close
  const otherMatches = matches.slice(1, 3).filter((m) => m.confidence > 30);
  if (otherMatches.length > 0) {
    output += `\nOther relevant skills:\n`;
    for (const match of otherMatches) {
      const status = isSkillImplemented(match.skill) ? '✅' : '⚠️';
      output += `  ${status} ${match.skill} (${match.confidence}%)\n`;
    }
  }

  output += '</system-reminder>\n';
  return output;
}

/**
 * Main execution
 */
async function main() {
  try {
    const input = await readStdin();
    const { prompt, context } = input;

    // Extract file paths from prompt
    const filePaths = extractFilePaths(prompt);

    // Add context file paths if available
    if (context?.recent_files) {
      filePaths.push(...context.recent_files);
    }

    // Find matching skills
    const matches = findSkillsByKeywords(prompt, filePaths);

    // Output suggestion
    if (matches.length > 0) {
      const suggestion = formatSkillSuggestion(matches);
      console.log(suggestion);
    }

    process.exit(0);
  } catch (error) {
    // Never block on error
    console.error('⚠️ apex-feature-detector error:', error);
    process.exit(0);
  }
}

main();
