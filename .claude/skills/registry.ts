/**
 * Apex Skill Registry
 *
 * Central registry for all project skills with automatic routing.
 * Maps module keywords to specialist skills for context-aware assistance.
 *
 * Usage:
 * - Skills auto-load based on keywords in user prompts
 * - Manual invocation: /skill-name or Skill(skill-name)
 * - Hook-based detection: apex-feature-detector hook
 *
 * @version 1.0.0
 * @updated 2026-01-18
 */

export interface SkillDefinition {
  name: string;
  category: 'core' | 'development' | 'apex-module' | 'apex-workflow';
  path: string;
  triggers: string[];
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  implemented: boolean;
}

/**
 * Complete skill registry for Apex project
 */
export const APEX_SKILLS: Record<string, SkillDefinition> = {
  // ============================================================
  // CORE PAI SKILLS (Generic - not Apex-specific)
  // ============================================================
  'pai-core': {
    name: 'CORE',
    category: 'core',
    path: '_core/CORE',
    triggers: ['@kai', '@PAI', 'pai mode', 'activate kai'],
    description: 'Personal AI Infrastructure - universal AI coding assistant',
    priority: 'critical',
    implemented: true,
  },
  'create-skill': {
    name: 'create-skill',
    category: 'core',
    path: '_core/create-skill',
    triggers: ['create skill', 'new skill', 'skill template'],
    description: 'Guide for creating new skills following PAI patterns',
    priority: 'medium',
    implemented: true,
  },
  'fabric': {
    name: 'fabric',
    category: 'core',
    path: '_core/fabric',
    triggers: ['fabric pattern', 'prompt pattern', 'use fabric'],
    description: 'Intelligent pattern selection for Fabric CLI (242+ specialized prompts)',
    priority: 'medium',
    implemented: true,
  },
  'meta-prompting': {
    name: 'meta-prompting',
    category: 'core',
    path: '_core/meta-prompting',
    triggers: ['clarify', 'meta-prompt', 'specify requirements'],
    description: 'Two-phase prompt clarification and execution orchestration',
    priority: 'high',
    implemented: true,
  },
  'pai-diagnostics': {
    name: 'pai-diagnostics',
    category: 'core',
    path: '_core/pai-diagnostics',
    triggers: ['/pai-status', 'check PAI', 'PAI health'],
    description: 'PAI health diagnostics and system state checker',
    priority: 'medium',
    implemented: true,
  },
  'prompt-enhancement': {
    name: 'prompt-enhancement',
    category: 'core',
    path: '_core/prompt-enhancement',
    triggers: ['enhance prompt', 'improve prompt', 'optimize prompt'],
    description: 'Advanced prompt enhancement using claude-prompts-mcp server',
    priority: 'medium',
    implemented: true,
  },
  'research': {
    name: 'research',
    category: 'core',
    path: '_core/research',
    triggers: ['do research', 'investigate', 'find information about'],
    description: 'Multi-source comprehensive research (perplexity, claude, gemini)',
    priority: 'high',
    implemented: true,
  },

  // ============================================================
  // DEVELOPMENT SKILLS (Dev workflows)
  // ============================================================
  'coding-specialists': {
    name: 'coding-specialists',
    category: 'development',
    path: '_development/coding-specialists',
    triggers: ['implement', 'create', 'build', 'add feature', 'fix bug'],
    description: 'Project-specific coding specialists (primary, api, db, test)',
    priority: 'critical',
    implemented: true,
  },
  'auto-workflow': {
    name: 'auto',
    category: 'development',
    path: '_development/auto',
    triggers: ['auto workflow', 'autonomous development', 'kai develop'],
    description: 'Autonomous development workflow using PAI planning + ACH coding',
    priority: 'high',
    implemented: true,
  },

  // ============================================================
  // APEX WORKFLOW SKILLS (Apex-specific workflows)
  // ============================================================
  'brand-population': {
    name: 'brand-population',
    category: 'apex-workflow',
    path: '_apex-workflows/brand-population',
    triggers: ['populate brands', 'enrich brands', 'gather brand data'],
    description: 'Automate benchmark brand data collection and database population',
    priority: 'high',
    implemented: true,
  },
  'feature-implementation': {
    name: 'feature-implementation-workflow',
    category: 'apex-workflow',
    path: '_apex-workflows/feature-implementation-workflow',
    triggers: ['implement F', 'next feature', 'autonomous mode', 'feature workflow'],
    description: 'Autonomous feature implementation: read feature_list.json → implement → test → commit',
    priority: 'critical',
    implemented: false,
  },
  'design-enforcement': {
    name: 'design-system-enforcer',
    category: 'apex-workflow',
    path: '_apex-workflows/design-system-enforcer',
    triggers: ['add UI', 'create component', 'style page', 'design system'],
    description: 'Enforces APEX_DESIGN_SYSTEM.md (3-tier cards, colors, glassmorphism)',
    priority: 'high',
    implemented: false,
  },
  'api-integration': {
    name: 'api-integration-workflow',
    category: 'apex-workflow',
    path: '_apex-workflows/api-integration-workflow',
    triggers: ['connect API', 'add backend route', 'integrate service', 'full-stack API'],
    description: 'Complete API integration: frontend client → backend route → database → test',
    priority: 'medium',
    implemented: false,
  },

  // ============================================================
  // APEX MODULE SKILLS (Module-specific specialists)
  // ============================================================
  'monitoring': {
    name: 'monitoring-specialist',
    category: 'apex-module',
    path: '_apex-modules/monitoring-specialist',
    triggers: ['monitor brand', 'AI platform', 'track visibility', 'check mentions'],
    description: 'AI platform monitoring (7 platforms: ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus)',
    priority: 'critical',
    implemented: false,
  },
  'competitive': {
    name: 'competitive-specialist',
    category: 'apex-module',
    path: '_apex-modules/competitive-specialist',
    triggers: ['competitor', 'benchmark', 'competitive analysis', 'track competitors'],
    description: 'Competitor tracking, scoring, roadmap generation, gap analysis',
    priority: 'critical',
    implemented: false,
  },
  'recommendations': {
    name: 'recommendations-specialist',
    category: 'apex-module',
    path: '_apex-modules/recommendations-specialist',
    triggers: ['recommendations', 'smart recs', 'prioritize actions', 'generate suggestions'],
    description: 'Smart Recommendations Engine - auto-generated, prioritized actionable recommendations',
    priority: 'critical',
    implemented: false,
  },
  'audit': {
    name: 'audit-specialist',
    category: 'apex-module',
    path: '_apex-modules/audit-specialist',
    triggers: ['audit site', 'technical SEO', 'schema validation', 'crawl site'],
    description: 'Technical SEO audit engine (Schema.org, Core Web Vitals, crawling)',
    priority: 'high',
    implemented: false,
  },
  'content': {
    name: 'content-specialist',
    category: 'apex-module',
    path: '_apex-modules/content-specialist',
    triggers: ['create content', 'generate article', 'optimize copy', 'GEO content'],
    description: 'AI content generation (brand voice, GEO optimization, multi-language)',
    priority: 'high',
    implemented: false,
  },
  'admin': {
    name: 'admin-specialist',
    category: 'apex-module',
    path: '_apex-modules/admin-specialist',
    triggers: ['admin', 'CRM', 'analytics dashboard', 'admin operations'],
    description: 'Admin operations system (49+ pages, Mautic CRM, analytics)',
    priority: 'medium',
    implemented: false,
  },
  'geo': {
    name: 'geo-specialist',
    category: 'apex-module',
    path: '_apex-modules/geo-specialist',
    triggers: ['GEO score', 'calculate score', 'optimize for AI', 'scoring algorithm'],
    description: 'GEO scoring engine (algorithm, weighting, benchmarking)',
    priority: 'medium',
    implemented: false,
  },
  'integrations': {
    name: 'integration-specialist',
    category: 'apex-module',
    path: '_apex-modules/integration-specialist',
    triggers: ['integrate', 'OAuth', 'webhook', 'external service'],
    description: 'External service integrations (OAuth flows, webhooks, API clients)',
    priority: 'medium',
    implemented: false,
  },
};

/**
 * Get skill by name
 */
export function getSkill(name: string): SkillDefinition | undefined {
  return APEX_SKILLS[name];
}

/**
 * Find skills matching keywords
 */
export function findSkillsByKeywords(keywords: string[]): SkillDefinition[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  return Object.values(APEX_SKILLS).filter((skill) =>
    skill.triggers.some((trigger) =>
      lowerKeywords.some((keyword) => trigger.toLowerCase().includes(keyword))
    )
  );
}

/**
 * Get all skills by category
 */
export function getSkillsByCategory(
  category: 'core' | 'development' | 'apex-module' | 'apex-workflow'
): SkillDefinition[] {
  return Object.values(APEX_SKILLS).filter((skill) => skill.category === category);
}

/**
 * Get implementation stats
 */
export function getImplementationStats() {
  const total = Object.keys(APEX_SKILLS).length;
  const implemented = Object.values(APEX_SKILLS).filter((s) => s.implemented).length;
  const notImplemented = total - implemented;

  return {
    total,
    implemented,
    notImplemented,
    percentComplete: Math.round((implemented / total) * 100),
  };
}

/**
 * Get priority skills (critical + high)
 */
export function getPrioritySkills(): SkillDefinition[] {
  return Object.values(APEX_SKILLS)
    .filter((s) => s.priority === 'critical' || s.priority === 'high')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Get next skills to implement (not implemented, high/critical priority)
 */
export function getNextToImplement(limit: number = 5): SkillDefinition[] {
  return Object.values(APEX_SKILLS)
    .filter((s) => !s.implemented && (s.priority === 'critical' || s.priority === 'high'))
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, limit);
}
