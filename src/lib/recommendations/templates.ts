/**
 * Recommendation Templates System (F112)
 * Database-driven recommendation templates with customizable action items
 */

import { createId } from "@paralleldrive/cuid2";
import type {
  Recommendation,
  RecommendationCategory,
  RecommendationSource,
  PriorityLevel,
  ActionItem,
} from "./types";

// Template definition
export interface RecommendationTemplate {
  id: string;
  name: string;
  category: RecommendationCategory;
  source: RecommendationSource;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultPriority: PriorityLevel;
  defaultImpact: number;
  defaultEffort: number;
  actionItemTemplates: ActionItemTemplate[];
  variables: TemplateVariable[];
  codeSnippetTemplate?: string;
  metadata: TemplateMetadata;
}

export interface ActionItemTemplate {
  order: number;
  titleTemplate: string;
  descriptionTemplate: string;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  required: boolean;
  default?: unknown;
  description: string;
}

export interface TemplateMetadata {
  version: number;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  successRate?: number;
  tags: string[];
}

// Built-in templates
export const BUILT_IN_TEMPLATES: RecommendationTemplate[] = [
  // Schema Templates
  {
    id: "tpl_missing_org_schema",
    name: "Missing Organization Schema",
    category: "schema",
    source: "audit",
    titleTemplate: "Add Organization schema to {{domain}}",
    descriptionTemplate: "Your site {{domain}} is missing Organization schema markup. This structured data helps AI engines understand your brand identity and improves visibility in AI search results.",
    defaultPriority: "high",
    defaultImpact: 75,
    defaultEffort: 30,
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Create Organization JSON-LD",
        descriptionTemplate: "Generate Organization schema with your brand details: name, logo, social profiles",
      },
      {
        order: 2,
        titleTemplate: "Add schema to website header",
        descriptionTemplate: "Insert the JSON-LD script in the <head> section of {{domain}}",
      },
      {
        order: 3,
        titleTemplate: "Validate with Schema.org Validator",
        descriptionTemplate: "Test the implementation at validator.schema.org",
      },
    ],
    variables: [
      { name: "domain", type: "string", required: true, description: "Website domain" },
      { name: "brandName", type: "string", required: true, description: "Brand name" },
    ],
    codeSnippetTemplate: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{brandName}}",
  "url": "https://{{domain}}",
  "logo": "https://{{domain}}/logo.png",
  "sameAs": []
}
</script>`,
    metadata: {
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      usageCount: 0,
      tags: ["schema", "organization", "seo"],
    },
  },
  {
    id: "tpl_missing_faq_schema",
    name: "Missing FAQ Schema",
    category: "schema",
    source: "audit",
    titleTemplate: "Add FAQ schema for {{pageTitle}}",
    descriptionTemplate: "The page '{{pageTitle}}' contains Q&A content but lacks FAQPage schema markup. Adding this schema can improve visibility in featured snippets and AI responses.",
    defaultPriority: "medium",
    defaultImpact: 65,
    defaultEffort: 25,
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Identify Q&A pairs on page",
        descriptionTemplate: "Review {{pageTitle}} and identify all question-answer pairs",
      },
      {
        order: 2,
        titleTemplate: "Generate FAQPage JSON-LD",
        descriptionTemplate: "Create structured data for {{questionCount}} Q&A pairs",
      },
      {
        order: 3,
        titleTemplate: "Implement and test",
        descriptionTemplate: "Add schema to page and validate",
      },
    ],
    variables: [
      { name: "pageTitle", type: "string", required: true, description: "Page title" },
      { name: "pageUrl", type: "string", required: true, description: "Page URL" },
      { name: "questionCount", type: "number", required: false, default: 5, description: "Number of Q&A pairs" },
    ],
    metadata: {
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      usageCount: 0,
      tags: ["schema", "faq", "featured-snippets"],
    },
  },

  // Content Templates
  {
    id: "tpl_low_ai_visibility",
    name: "Low AI Platform Visibility",
    category: "content",
    source: "monitor",
    titleTemplate: "Improve visibility on {{platform}}",
    descriptionTemplate: "Your brand is mentioned in only {{mentionRate}}% of relevant queries on {{platform}}. Competitors average {{competitorRate}}%. Creating AI-optimized content can significantly improve your presence.",
    defaultPriority: "high",
    defaultImpact: 80,
    defaultEffort: 60,
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Analyze top queries on {{platform}}",
        descriptionTemplate: "Review queries where competitors appear but you don't",
      },
      {
        order: 2,
        titleTemplate: "Create targeted content",
        descriptionTemplate: "Develop content addressing {{topQueryCount}} key queries",
      },
      {
        order: 3,
        titleTemplate: "Optimize for AI extraction",
        descriptionTemplate: "Structure content with clear headings, Q&A format, and schema markup",
      },
      {
        order: 4,
        titleTemplate: "Monitor improvement",
        descriptionTemplate: "Track mention rate changes over 2-4 weeks",
      },
    ],
    variables: [
      { name: "platform", type: "string", required: true, description: "AI platform name" },
      { name: "mentionRate", type: "number", required: true, description: "Current mention rate %" },
      { name: "competitorRate", type: "number", required: false, default: 50, description: "Competitor mention rate %" },
      { name: "topQueryCount", type: "number", required: false, default: 10, description: "Number of target queries" },
    ],
    metadata: {
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      usageCount: 0,
      tags: ["ai-visibility", "content", "competitive"],
    },
  },
  {
    id: "tpl_negative_sentiment",
    name: "Negative Sentiment Alert",
    category: "content",
    source: "monitor",
    titleTemplate: "Address negative sentiment on {{platform}}",
    descriptionTemplate: "Brand mentions on {{platform}} show {{sentimentScore}} negative sentiment. {{topIssue}} This may affect how AI engines present your brand to users.",
    defaultPriority: "high",
    defaultImpact: 70,
    defaultEffort: 50,
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Analyze negative mentions",
        descriptionTemplate: "Review {{negativeCount}} negative mentions to identify patterns",
      },
      {
        order: 2,
        titleTemplate: "Develop response strategy",
        descriptionTemplate: "Create content addressing top concerns",
      },
      {
        order: 3,
        titleTemplate: "Publish corrective content",
        descriptionTemplate: "Release factual, positive content to balance sentiment",
      },
    ],
    variables: [
      { name: "platform", type: "string", required: true, description: "AI platform" },
      { name: "sentimentScore", type: "string", required: true, description: "Sentiment score description" },
      { name: "topIssue", type: "string", required: false, default: "", description: "Top issue description" },
      { name: "negativeCount", type: "number", required: false, default: 10, description: "Number of negative mentions" },
    ],
    metadata: {
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      usageCount: 0,
      tags: ["sentiment", "reputation", "urgent"],
    },
  },

  // Voice Optimization Templates
  {
    id: "tpl_voice_readability",
    name: "Voice Readability Improvement",
    category: "voice",
    source: "audit",
    titleTemplate: "Optimize {{pageTitle}} for voice search",
    descriptionTemplate: "The page '{{pageTitle}}' has a Flesch-Kincaid score of {{readabilityScore}}, which is {{readabilityGrade}} for voice search. Simplifying the content will improve AI assistant responses.",
    defaultPriority: "medium",
    defaultImpact: 55,
    defaultEffort: 40,
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Simplify sentence structure",
        descriptionTemplate: "Reduce average sentence length to under 15 words",
      },
      {
        order: 2,
        titleTemplate: "Use simpler vocabulary",
        descriptionTemplate: "Replace complex words with common alternatives",
      },
      {
        order: 3,
        titleTemplate: "Add conversational Q&A",
        descriptionTemplate: "Include natural question-answer sections",
      },
    ],
    variables: [
      { name: "pageTitle", type: "string", required: true, description: "Page title" },
      { name: "readabilityScore", type: "number", required: true, description: "Flesch-Kincaid score" },
      { name: "readabilityGrade", type: "string", required: true, description: "Grade description" },
    ],
    metadata: {
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      usageCount: 0,
      tags: ["voice", "readability", "content"],
    },
  },

  // Technical Templates
  {
    id: "tpl_missing_meta",
    name: "Missing Meta Description",
    category: "seo",
    source: "audit",
    titleTemplate: "Add meta description to {{pageTitle}}",
    descriptionTemplate: "The page '{{pageTitle}}' is missing a meta description. This affects how AI engines summarize your content and can reduce click-through from AI-powered search results.",
    defaultPriority: "medium",
    defaultImpact: 50,
    defaultEffort: 15,
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Write compelling meta description",
        descriptionTemplate: "Create a 150-160 character description that summarizes the page",
      },
      {
        order: 2,
        titleTemplate: "Add to page head",
        descriptionTemplate: "Insert <meta name='description'> tag",
      },
    ],
    variables: [
      { name: "pageTitle", type: "string", required: true, description: "Page title" },
      { name: "pageUrl", type: "string", required: true, description: "Page URL" },
    ],
    metadata: {
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      usageCount: 0,
      tags: ["meta", "seo", "quick-win"],
    },
  },
];

/**
 * Template Registry for managing templates
 */
export class TemplateRegistry {
  private templates: Map<string, RecommendationTemplate> = new Map();

  constructor() {
    // Load built-in templates
    for (const template of BUILT_IN_TEMPLATES) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Get all templates
   */
  getAllTemplates(): RecommendationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): RecommendationTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: RecommendationCategory): RecommendationTemplate[] {
    return this.getAllTemplates().filter((t) => t.category === category);
  }

  /**
   * Get templates by source
   */
  getTemplatesBySource(source: RecommendationSource): RecommendationTemplate[] {
    return this.getAllTemplates().filter((t) => t.source === source);
  }

  /**
   * Register a new template
   */
  registerTemplate(template: Omit<RecommendationTemplate, "id">): RecommendationTemplate {
    const id = `tpl_${createId()}`;
    const fullTemplate: RecommendationTemplate = {
      ...template,
      id,
      metadata: {
        ...template.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      },
    };
    this.templates.set(id, fullTemplate);
    return fullTemplate;
  }

  /**
   * Update a template
   */
  updateTemplate(
    id: string,
    updates: Partial<Omit<RecommendationTemplate, "id">>
  ): RecommendationTemplate | undefined {
    const existing = this.templates.get(id);
    if (!existing) return undefined;

    const updated: RecommendationTemplate = {
      ...existing,
      ...updates,
      id, // Preserve ID
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };
    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Search templates by tags
   */
  searchByTags(tags: string[]): RecommendationTemplate[] {
    return this.getAllTemplates().filter((t) =>
      tags.some((tag) => t.metadata.tags.includes(tag))
    );
  }
}

/**
 * Render a template with variables
 */
export function renderTemplate(
  template: RecommendationTemplate,
  variables: Record<string, unknown>,
  options: {
    brandId: string;
    urgency?: number;
    confidence?: number;
  }
): Recommendation {
  // Validate required variables
  for (const v of template.variables) {
    if (v.required && !(v.name in variables)) {
      throw new Error(`Missing required variable: ${v.name}`);
    }
  }

  // Merge with defaults
  const mergedVariables: Record<string, unknown> = {};
  for (const v of template.variables) {
    mergedVariables[v.name] = variables[v.name] ?? v.default;
  }

  // Render strings
  const title = interpolate(template.titleTemplate, mergedVariables);
  const description = interpolate(template.descriptionTemplate, mergedVariables);

  // Render action items
  const actionItems: ActionItem[] = template.actionItemTemplates.map((ait) => ({
    id: createId(),
    order: ait.order,
    title: interpolate(ait.titleTemplate, mergedVariables),
    description: interpolate(ait.descriptionTemplate, mergedVariables),
    completed: false,
  }));

  // Render code snippet if present
  const codeSnippet = template.codeSnippetTemplate
    ? interpolate(template.codeSnippetTemplate, mergedVariables)
    : undefined;

  // Calculate priority score
  const urgency = options.urgency ?? 50;
  const confidence = options.confidence ?? 70;
  const priorityScore =
    template.defaultImpact * 0.4 +
    (100 - template.defaultEffort) * 0.3 +
    urgency * 0.2 +
    confidence * 0.1;

  return {
    id: createId(),
    brandId: options.brandId,
    source: template.source,
    category: template.category,
    priority: template.defaultPriority,
    priorityScore: Math.round(priorityScore),
    title,
    description,
    impact: {
      score: template.defaultImpact,
      description: `Impact score: ${template.defaultImpact}/100`,
      expectedOutcome: "Improvement in AI visibility",
      affectedMetrics: ["ai_visibility"],
    },
    effort: {
      score: template.defaultEffort,
      description: `Effort score: ${template.defaultEffort}/100`,
      estimatedTime: getEstimatedTime(template.defaultEffort),
      requiredSkills: getRequiredSkills(template.category),
    },
    urgency,
    confidence,
    actionItems,
    metadata: {
      generatedBy: `template:${template.id}`,
      sourceData: { templateId: template.id, variables: mergedVariables },
      lastUpdated: new Date(),
      version: template.metadata.version,
    },
    codeSnippet,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Find best matching template for a given context
 */
export function findMatchingTemplate(
  registry: TemplateRegistry,
  context: {
    category?: RecommendationCategory;
    source?: RecommendationSource;
    tags?: string[];
    issueType?: string;
  }
): RecommendationTemplate | undefined {
  let templates = registry.getAllTemplates();

  if (context.category) {
    templates = templates.filter((t) => t.category === context.category);
  }

  if (context.source) {
    templates = templates.filter((t) => t.source === context.source);
  }

  if (context.tags && context.tags.length > 0) {
    templates = templates.filter((t) =>
      context.tags!.some((tag) => t.metadata.tags.includes(tag))
    );
  }

  // Sort by usage count (most used first)
  templates.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);

  return templates[0];
}

// Helper functions

function interpolate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

function getEstimatedTime(effort: number): string {
  if (effort <= 20) return "minutes";
  if (effort <= 40) return "hours";
  if (effort <= 70) return "days";
  return "weeks";
}

function getRequiredSkills(category: RecommendationCategory): string[] {
  const skillMap: Record<RecommendationCategory, string[]> = {
    schema: ["developer", "seo"],
    content: ["content-writer", "seo"],
    technical: ["developer"],
    seo: ["seo", "marketing"],
    voice: ["content-writer"],
    entity: ["content-writer", "seo"],
    qa: ["content-writer"],
  };
  return skillMap[category] || ["developer"];
}

/**
 * Create a template from an existing recommendation
 * This allows converting ad-hoc recommendations into reusable templates
 */
export function createTemplateFromRecommendation(
  recommendation: {
    title: string;
    description: string;
    category: string;
    priority: string;
  },
  name: string,
  variableNames: string[]
): RecommendationTemplate {
  // Extract variables from the recommendation text
  const variables: TemplateVariable[] = variableNames.map((varName) => ({
    name: varName,
    type: "string" as const,
    required: true,
    description: `Variable extracted from recommendation: ${varName}`,
  }));

  // Convert text to templates by wrapping variable names in {{}}
  let titleTemplate = recommendation.title;
  let descriptionTemplate = recommendation.description;

  for (const varName of variableNames) {
    const regex = new RegExp(varName, "gi");
    titleTemplate = titleTemplate.replace(regex, `{{${varName}}}`);
    descriptionTemplate = descriptionTemplate.replace(regex, `{{${varName}}}`);
  }

  // Map string category to RecommendationCategory
  const categoryMap: Record<string, RecommendationCategory> = {
    schema: "schema",
    content: "content",
    technical: "technical",
    seo: "seo",
    voice: "voice",
    entity: "entity",
    qa: "qa",
  };

  // Map string priority to PriorityLevel
  const priorityMap: Record<string, PriorityLevel> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };

  const category = categoryMap[recommendation.category.toLowerCase()] || "technical";
  const priority = priorityMap[recommendation.priority.toLowerCase()] || "medium";

  return {
    id: `tpl_custom_${createId()}`,
    name,
    category,
    source: "audit", // Default source for custom templates
    titleTemplate,
    descriptionTemplate,
    defaultPriority: priority,
    defaultImpact: priority === "critical" ? 90 : priority === "high" ? 75 : priority === "medium" ? 50 : 30,
    defaultEffort: 50, // Default medium effort
    actionItemTemplates: [
      {
        order: 1,
        titleTemplate: "Review and implement recommendation",
        descriptionTemplate: descriptionTemplate,
      },
    ],
    variables,
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      tags: ["custom", category],
    },
  };
}

// Export singleton registry
export const templateRegistry = new TemplateRegistry();
