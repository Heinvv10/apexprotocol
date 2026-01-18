#!/usr/bin/env bun
/**
 * auto-skill-creator.ts
 *
 * UserPromptSubmit hook that automatically creates missing skills
 * when they are detected as needed but not implemented.
 *
 * Triggered when:
 * - User says "create [skill-name] skill"
 * - apex-feature-detector identifies missing skill with high confidence
 * - User confirms auto-creation
 *
 * Features:
 * - Auto-generates SKILL.md from template
 * - Creates directory structure
 * - Registers in registry.ts
 * - Outputs confirmation
 *
 * Exit Codes:
 * - 0: Always (never blocks prompt)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface HookInput {
  prompt: string;
}

interface SkillTemplate {
  name: string;
  category: 'apex-module' | 'apex-workflow';
  triggers: string[];
  module: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  filePaths: {
    lib: string[];
    components: string[];
    api: string[];
  };
}

/**
 * Skill templates for auto-creation
 */
const SKILL_TEMPLATES: Record<string, SkillTemplate> = {
  'monitoring-specialist': {
    name: 'monitoring-specialist',
    category: 'apex-module',
    triggers: ['monitor brand', 'AI platform', 'track visibility', 'check mentions'],
    module: 'Monitoring',
    description: 'AI platform monitoring specialist (7 platforms: ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus)',
    priority: 'critical',
    filePaths: {
      lib: ['src/lib/monitoring/', 'src/lib/platform-monitor/'],
      components: ['src/components/monitor/'],
      api: ['src/app/api/monitor/'],
    },
  },
  'competitive-specialist': {
    name: 'competitive-specialist',
    category: 'apex-module',
    triggers: ['competitor', 'benchmark', 'competitive analysis', 'track competitors'],
    module: 'Competitive',
    description: 'Competitor tracking, scoring, roadmap generation, and gap analysis specialist',
    priority: 'critical',
    filePaths: {
      lib: ['src/lib/competitive/'],
      components: ['src/components/competitive/'],
      api: ['src/app/api/competitive/'],
    },
  },
  'recommendations-specialist': {
    name: 'recommendations-specialist',
    category: 'apex-module',
    triggers: ['recommendations', 'smart recs', 'prioritize actions', 'generate suggestions'],
    module: 'Recommendations',
    description: 'Smart Recommendations Engine - auto-generated, prioritized actionable recommendations',
    priority: 'critical',
    filePaths: {
      lib: ['src/lib/recommendations/'],
      components: ['src/components/recommendations/'],
      api: ['src/app/api/recommendations/'],
    },
  },
  'audit-specialist': {
    name: 'audit-specialist',
    category: 'apex-module',
    triggers: ['audit site', 'technical SEO', 'schema validation', 'crawl site'],
    module: 'Audit',
    description: 'Technical SEO audit engine (Schema.org, Core Web Vitals, crawling)',
    priority: 'high',
    filePaths: {
      lib: ['src/lib/audit/'],
      components: ['src/components/audit/'],
      api: ['src/app/api/audit/'],
    },
  },
  'content-specialist': {
    name: 'content-specialist',
    category: 'apex-module',
    triggers: ['create content', 'generate article', 'optimize copy', 'GEO content'],
    module: 'Content',
    description: 'AI content generation (brand voice, GEO optimization, multi-language)',
    priority: 'high',
    filePaths: {
      lib: ['src/lib/content/', 'src/lib/ai/'],
      components: ['src/components/create/'],
      api: ['src/app/api/create/', 'src/app/api/generate/'],
    },
  },
  'admin-specialist': {
    name: 'admin-specialist',
    category: 'apex-module',
    triggers: ['admin', 'CRM', 'analytics dashboard', 'admin operations'],
    module: 'Admin',
    description: 'Admin operations system (49+ pages, Mautic CRM, analytics)',
    priority: 'medium',
    filePaths: {
      lib: ['src/lib/admin/', 'src/lib/crm/'],
      components: ['src/components/admin/'],
      api: ['src/app/api/admin/', 'src/app/api/crm/'],
    },
  },
  'geo-specialist': {
    name: 'geo-specialist',
    category: 'apex-module',
    triggers: ['GEO score', 'calculate score', 'optimize for AI', 'scoring algorithm'],
    module: 'GEO',
    description: 'GEO scoring engine (algorithm, weighting, benchmarking)',
    priority: 'medium',
    filePaths: {
      lib: ['src/lib/geo/', 'src/lib/scoring/'],
      components: [],
      api: ['src/app/api/geo/'],
    },
  },
  'integration-specialist': {
    name: 'integration-specialist',
    category: 'apex-module',
    triggers: ['integrate', 'OAuth', 'webhook', 'external service'],
    module: 'Integrations',
    description: 'External service integrations (OAuth flows, webhooks, API clients)',
    priority: 'medium',
    filePaths: {
      lib: ['src/lib/integrations/', 'src/lib/oauth/', 'src/lib/webhooks/'],
      components: [],
      api: ['src/app/api/integrations/', 'src/app/api/oauth/'],
    },
  },
  'feature-implementation-workflow': {
    name: 'feature-implementation-workflow',
    category: 'apex-workflow',
    triggers: ['implement F', 'next feature', 'autonomous mode', 'feature workflow'],
    module: 'Feature Implementation',
    description: 'Autonomous feature implementation: read feature_list.json → implement → test → commit',
    priority: 'critical',
    filePaths: {
      lib: [],
      components: [],
      api: [],
    },
  },
  'design-system-enforcer': {
    name: 'design-system-enforcer',
    category: 'apex-workflow',
    triggers: ['add UI', 'create component', 'style page', 'design system'],
    module: 'Design System',
    description: 'Enforces APEX_DESIGN_SYSTEM.md (3-tier cards, colors, glassmorphism)',
    priority: 'high',
    filePaths: {
      lib: [],
      components: ['src/components/'],
      api: [],
    },
  },
  'api-integration-workflow': {
    name: 'api-integration-workflow',
    category: 'apex-workflow',
    triggers: ['connect API', 'add backend route', 'integrate service', 'full-stack API'],
    module: 'API Integration',
    description: 'Complete API integration: frontend client → backend route → database → test',
    priority: 'medium',
    filePaths: {
      lib: ['src/lib/api/'],
      components: [],
      api: ['src/app/api/'],
    },
  },
};

/**
 * Generate SKILL.md content from template
 */
function generateSkillMd(template: SkillTemplate): string {
  const now = new Date().toISOString().split('T')[0];

  return `# ${template.module} Specialist

${template.description}

**USE WHEN** user says:
${template.triggers.map((t) => `- "${t}"`).join('\n')}

---

## Skill Overview

This skill provides comprehensive assistance for ${template.module.toLowerCase()} operations in the Apex platform.

**Core Capabilities:**
1. Deep knowledge of ${template.module.toLowerCase()} module architecture
2. Automated workflows for common ${template.module.toLowerCase()} tasks
3. Integration with Apex database and API layer
4. Best practices enforcement

---

## Prerequisites

### Module Files
\`\`\`
${[...template.filePaths.lib, ...template.filePaths.components, ...template.filePaths.api]
  .filter((p) => p)
  .map((p) => `${p}`)
  .join('\n')}
\`\`\`

### Required Knowledge
- Apex ${template.module} module patterns
- Next.js App Router
- Drizzle ORM
- TypeScript strict mode

---

## Key Workflows

### Workflow 1: [Primary Operation]

**Trigger**: User requests ${template.module.toLowerCase()} operation

**Steps**:
1. Analyze user requirements
2. Read relevant module files
3. Execute operation
4. Validate results
5. Return summary

**Example**:
\`\`\`typescript
// Example workflow execution
// TODO: Add specific workflow steps
\`\`\`

---

## Module Architecture

### Database Schema
\`\`\`typescript
// Key tables used by ${template.module}
// Located in: src/lib/db/schema/
\`\`\`

### API Routes
\`\`\`typescript
// Key API routes
${template.filePaths.api.map((p) => `// ${p}`).join('\n')}
\`\`\`

### Components
\`\`\`typescript
// Key UI components
${template.filePaths.components.map((p) => `// ${p}`).join('\n')}
\`\`\`

---

## Common Tasks

### Task 1: [Common Operation]
TODO: Document common task

### Task 2: [Common Operation]
TODO: Document common task

---

## Best Practices

1. **Always validate input** - Check parameters before operations
2. **Use TypeScript types** - No 'any' types allowed
3. **Follow APEX patterns** - Match existing code style
4. **Test thoroughly** - Verify with browser automation
5. **Document changes** - Update relevant docs

---

## Troubleshooting

### Issue: [Common Issue]
**Solution**: TODO

---

## Related Skills

- \`coding-specialists\` - For implementation
- \`design-system-enforcer\` - For UI components
- \`api-integration-workflow\` - For API setup

---

**Skill Version**: 1.0.0
**Created**: ${now}
**Auto-Generated**: Yes
**Status**: Template - Needs Enhancement
`;
}

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
 * Detect skill creation request
 */
function detectSkillCreationRequest(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();

  // Check for explicit creation request
  const createPatterns = [
    /create (\w+-\w+) skill/i,
    /generate (\w+-\w+) skill/i,
    /auto[- ]create (\w+-\w+)/i,
  ];

  for (const pattern of createPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Check for skill names mentioned with "create"
  if (lowerPrompt.includes('create') && lowerPrompt.includes('skill')) {
    for (const skillName of Object.keys(SKILL_TEMPLATES)) {
      if (lowerPrompt.includes(skillName)) {
        return skillName;
      }
    }
  }

  return null;
}

/**
 * Create skill directory and files
 */
function createSkill(skillName: string): boolean {
  const template = SKILL_TEMPLATES[skillName];
  if (!template) {
    console.error(`⚠️ No template found for skill: ${skillName}`);
    return false;
  }

  const skillsDir = join(process.cwd(), '.claude', 'skills');
  const categoryDir = template.category === 'apex-module' ? '_apex-modules' : '_apex-workflows';
  const skillDir = join(skillsDir, categoryDir, skillName);

  // Check if already exists
  if (existsSync(skillDir)) {
    console.log(`\n<system-reminder>`);
    console.log(`⚠️ Skill already exists: ${skillName}`);
    console.log(`Location: ${skillDir}`);
    console.log(`</system-reminder>\n`);
    return false;
  }

  try {
    // Create directory
    mkdirSync(skillDir, { recursive: true });

    // Generate and write SKILL.md
    const skillMd = generateSkillMd(template);
    writeFileSync(join(skillDir, 'SKILL.md'), skillMd);

    // Create workflows directory
    mkdirSync(join(skillDir, 'workflows'), { recursive: true });

    // Create examples directory
    mkdirSync(join(skillDir, 'examples'), { recursive: true });

    // Create README
    const readme = `# ${template.module} Specialist

Auto-generated skill. See SKILL.md for details.

## Status
- ✅ Template created
- ⚠️ Needs enhancement with specific workflows
- ⚠️ Add real examples
- ⚠️ Update registry.ts with \`implemented: true\`
`;
    writeFileSync(join(skillDir, 'README.md'), readme);

    console.log(`\n<system-reminder>`);
    console.log(`✅ SKILL CREATED: ${skillName}\n`);
    console.log(`Location: ${skillDir}`);
    console.log(`Category: ${template.category}`);
    console.log(`Priority: ${template.priority}\n`);
    console.log(`NEXT STEPS:`);
    console.log(`1. Review and enhance ${skillName}/SKILL.md`);
    console.log(`2. Add specific workflows to workflows/`);
    console.log(`3. Add examples to examples/`);
    console.log(`4. Update .claude/skills/registry.ts:`);
    console.log(`   Change 'implemented: false' to 'implemented: true'`);
    console.log(`5. Test with relevant prompt keywords\n`);
    console.log(`Triggers: ${template.triggers.join(', ')}`);
    console.log(`</system-reminder>\n`);

    return true;
  } catch (error) {
    console.error(`❌ Failed to create skill: ${error}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const input = await readStdin();
    const { prompt } = input;

    // Detect skill creation request
    const skillToCreate = detectSkillCreationRequest(prompt);

    if (skillToCreate) {
      createSkill(skillToCreate);
    }

    process.exit(0);
  } catch (error) {
    // Never block on error
    console.error('⚠️ auto-skill-creator error:', error);
    process.exit(0);
  }
}

main();
