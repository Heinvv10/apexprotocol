/**
 * Action Plan Generator
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 * Requirements: FR-1.1 through FR-1.8
 *
 * Transforms recommendations into comprehensive, step-by-step action plans
 * with implementation instructions, code snippets, and verification checklists.
 *
 * Key features:
 * - Step-by-step implementation guides
 * - Code snippets for each technical action
 * - Expected GEO score impact calculations
 * - Priority grouping (Critical/High/Medium)
 * - Time-to-complete estimates
 * - Verification checklists
 */

import type {
  Recommendation,
  ImplementationStep,
  PlatformRelevance,
  ActionSnapshot,
} from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

/**
 * Priority levels for action grouping
 */
export type ActionPriority = "critical" | "high" | "medium" | "low";

/**
 * Effort levels for time estimation
 */
export type EffortLevel = "quick_win" | "moderate" | "major";

/**
 * Action item with full implementation details
 */
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  category: string;

  // Implementation details
  whyItMatters: string;
  steps: ImplementationStep[];
  codeSnippet?: string;
  codeLanguage?: string;

  // Impact and effort
  expectedScoreImpact: number; // Points
  estimatedTime: string; // e.g., "30 minutes", "2 hours"
  effort: EffortLevel;

  // Platform relevance
  platformRelevance: PlatformRelevance;
  affectedPlatforms: string[];

  // Verification
  verificationChecklist: string[];
}

/**
 * Grouped action items by priority
 */
export interface PrioritizedActions {
  critical: ActionItem[];
  high: ActionItem[];
  medium: ActionItem[];
  low: ActionItem[];
}

/**
 * Complete action plan
 */
export interface ActionPlan {
  // Metadata
  brandId: string;
  brandName: string;
  generatedAt: Date;
  version: string;
  knowledgeBaseVersion: string;

  // Summary
  summary: {
    totalActions: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    totalEstimatedTime: string;
    expectedScoreIncrease: number;
    currentScore: number;
    projectedScore: number;
  };

  // Actions grouped by priority
  actions: PrioritizedActions;

  // Schema code library (copy-paste ready)
  schemaLibrary: SchemaSnippet[];

  // Progress tracking
  progressTracker: ProgressItem[];
}

/**
 * Schema code snippet
 */
export interface SchemaSnippet {
  schemaType: string;
  description: string;
  code: string;
  validatorUrl: string;
  affectedActions: string[];
}

/**
 * Progress tracking item
 */
export interface ProgressItem {
  actionId: string;
  actionTitle: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

// ============================================================================
// Implementation Step Templates
// ============================================================================

/**
 * Step templates for common action types
 */
const STEP_TEMPLATES: Record<string, ImplementationStep[]> = {
  // FAQ Schema implementation
  add_faq_schema: [
    {
      stepNumber: 1,
      instruction: "Identify your most frequently asked customer questions",
      verificationMethod: "List at least 5-10 common questions",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Write clear, concise answers for each question (2-3 sentences)",
      verificationMethod: "Each answer is under 300 words and directly addresses the question",
      estimatedTime: "30 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Open your homepage HTML in your CMS or code editor",
      platformNotes: {
        wordpress: "Go to Appearance > Theme Editor > header.php",
        shopify: "Go to Online Store > Themes > Actions > Edit code > theme.liquid",
        nextjs: "Open pages/index.tsx or app/page.tsx",
      },
      verificationMethod: "File is open and editable",
      estimatedTime: "2 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Add the FAQ schema JSON-LD code in the <head> section",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [Your Product]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[Your answer here - 2-3 sentences]"
    }
  }]
}
</script>`,
      verificationMethod: "Code is added without syntax errors",
      estimatedTime: "10 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Test your schema at https://validator.schema.org/",
      verificationMethod: "Validator shows no errors",
      estimatedTime: "5 minutes",
    },
    {
      stepNumber: 6,
      instruction: "Publish changes and wait 24-48 hours for AI platforms to recrawl",
      verificationMethod: "Changes are live on your website",
      estimatedTime: "2 minutes",
    },
  ],

  // Organization Schema implementation
  add_organization_schema: [
    {
      stepNumber: 1,
      instruction: "Gather your organization information (name, URL, logo, social profiles)",
      verificationMethod: "All required information is collected",
      estimatedTime: "10 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Open your homepage HTML template",
      platformNotes: {
        wordpress: "Go to Appearance > Theme Editor > header.php",
        shopify: "Go to Online Store > Themes > Actions > Edit code > theme.liquid",
        nextjs: "Open app/layout.tsx or pages/_document.tsx",
      },
      verificationMethod: "File is open and editable",
      estimatedTime: "2 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Add the Organization schema JSON-LD code",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Your Company Name]",
  "url": "https://yourwebsite.com",
  "logo": "https://yourwebsite.com/logo.png",
  "description": "[One-sentence description of your company]",
  "sameAs": [
    "https://linkedin.com/company/yourcompany",
    "https://twitter.com/yourcompany"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-XXX-XXX-XXXX",
    "contactType": "customer service"
  }
}
</script>`,
      verificationMethod: "Code is added without syntax errors",
      estimatedTime: "10 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Validate at https://validator.schema.org/",
      verificationMethod: "No validation errors",
      estimatedTime: "5 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Publish and verify the schema is live",
      verificationMethod: "Schema appears in page source",
      estimatedTime: "5 minutes",
    },
  ],

  // Content optimization
  optimize_content_structure: [
    {
      stepNumber: 1,
      instruction: "Audit your top 10 traffic pages for content structure",
      verificationMethod: "List of pages with current structure noted",
      estimatedTime: "20 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Add a clear \"Key Takeaway\" or \"Summary\" section at the top of each article",
      verificationMethod: "Each page has a summary within the first 200 words",
      estimatedTime: "30 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Use proper heading hierarchy (H1 > H2 > H3) throughout",
      verificationMethod: "Each page has exactly one H1 and logical H2/H3 structure",
      estimatedTime: "20 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Add bullet points and numbered lists for key information",
      verificationMethod: "Complex information is broken into scannable lists",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Include a Table of Contents for articles over 1500 words",
      verificationMethod: "Long articles have navigable TOC",
      estimatedTime: "10 minutes",
    },
  ],

  // Meta description optimization
  optimize_meta_descriptions: [
    {
      stepNumber: 1,
      instruction: "Export a list of all your pages and their current meta descriptions",
      verificationMethod: "Spreadsheet with all pages listed",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Identify pages with missing, duplicate, or generic meta descriptions",
      verificationMethod: "Problem pages are highlighted",
      estimatedTime: "10 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Write unique meta descriptions using this template: \"[Brand] [verb] [what] for [who]. [Key differentiator or stat].\"",
      verificationMethod: "Each description is 150-160 characters and includes brand name",
      estimatedTime: "45 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Update meta descriptions in your CMS or HTML",
      platformNotes: {
        wordpress: "Use Yoast SEO or edit in post editor",
        shopify: "Edit in each page's SEO settings",
        nextjs: "Update metadata in page components",
      },
      verificationMethod: "All meta descriptions are updated",
      estimatedTime: "30 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Verify changes in Google Search Console after 1-2 weeks",
      verificationMethod: "New descriptions appear in search results",
      estimatedTime: "5 minutes",
    },
  ],

  // Create brand definition page
  create_brand_page: [
    {
      stepNumber: 1,
      instruction: "Create a new page at yoursite.com/about or /what-is-[brand]",
      verificationMethod: "Page URL is created and accessible",
      estimatedTime: "5 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Write a clear H1 heading: \"What is [Brand]?\"",
      verificationMethod: "H1 matches the query users would ask AI",
      estimatedTime: "2 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Write a one-sentence brand definition in the first paragraph",
      codeSnippet: `<p><strong>[Brand]</strong> is [one-sentence definition].
Founded in [year], we [core value proposition].</p>`,
      verificationMethod: "Definition is clear and factual",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Add sections for Key Features, Who Uses [Brand], and Comparison to Alternatives",
      verificationMethod: "All three sections are complete",
      estimatedTime: "45 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Add Organization schema to the page",
      verificationMethod: "Schema validates without errors",
      estimatedTime: "10 minutes",
    },
    {
      stepNumber: 6,
      instruction: "Link the page from your homepage and main navigation",
      verificationMethod: "Page is discoverable within 2 clicks from homepage",
      estimatedTime: "10 minutes",
    },
  ],

  // Weekly content publishing
  establish_content_calendar: [
    {
      stepNumber: 1,
      instruction: "Define your content calendar structure using this rotation:",
      codeSnippet: `Week 1: Industry News Analysis (what happened this week)
Week 2: How-To Guide (solve a customer problem)
Week 3: Case Study (customer success story)
Week 4: Data/Research (original statistics or survey)`,
      verificationMethod: "Calendar template is documented",
      estimatedTime: "30 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Create a content queue with at least 4 weeks of topics",
      verificationMethod: "Topics are assigned to dates",
      estimatedTime: "45 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Set up a workflow for research, writing, editing, and publishing",
      verificationMethod: "Process is documented with owners assigned",
      estimatedTime: "30 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Use this content template for optimal AI visibility:",
      codeSnippet: `<h1>How to [Achieve Goal]: A Complete Guide</h1>

<p class="summary">
<strong>Key Takeaway:</strong> [One sentence summary that AI can quote]
</p>

<h2>What You'll Learn</h2>
<ul>
  <li>Point 1</li>
  <li>Point 2</li>
  <li>Point 3</li>
</ul>

<h2>Step 1: [First Step]</h2>
[Detailed explanation with examples]

<h2>Frequently Asked Questions</h2>
<h3>Q: [Common question]?</h3>
<p>A: [Direct answer]</p>`,
      verificationMethod: "Template is adopted by content team",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Publish first piece of content following the template",
      verificationMethod: "Content is live and follows structure",
      estimatedTime: "2-4 hours",
    },
  ],
};

// ============================================================================
// Impact Score Calculations
// ============================================================================

/**
 * Expected GEO score impact by action type
 */
const IMPACT_SCORES: Record<string, { min: number; max: number }> = {
  add_faq_schema: { min: 8, max: 12 },
  add_organization_schema: { min: 3, max: 5 },
  add_article_schema: { min: 4, max: 6 },
  add_howto_schema: { min: 3, max: 5 },
  create_brand_page: { min: 5, max: 8 },
  optimize_meta_descriptions: { min: 3, max: 5 },
  optimize_content_structure: { min: 4, max: 7 },
  establish_content_calendar: { min: 10, max: 15 },
  linkedin_optimization: { min: 3, max: 6 },
  twitter_optimization: { min: 2, max: 4 },
  youtube_optimization: { min: 4, max: 8 },
  technical_seo: { min: 5, max: 10 },
};

/**
 * Time estimates by effort level
 */
const TIME_ESTIMATES: Record<EffortLevel, string> = {
  quick_win: "30 minutes",
  moderate: "1-2 hours",
  major: "4+ hours",
};

// ============================================================================
// Action Plan Generator
// ============================================================================

/**
 * Generate a complete action plan from recommendations
 */
export function generateActionPlan(
  recommendations: Recommendation[],
  brandId: string,
  brandName: string,
  currentScore: number = 0
): ActionPlan {
  const now = new Date();
  const version = generateVersionNumber();
  const knowledgeBaseVersion = getKnowledgeBaseVersion();

  // Transform recommendations to action items
  const actionItems = recommendations.map((rec) =>
    transformRecommendationToAction(rec, brandName)
  );

  // Group by priority
  const actions = groupByPriority(actionItems);

  // Calculate summary statistics
  const totalEstimatedMinutes = actionItems.reduce(
    (sum, item) => sum + estimateMinutes(item.estimatedTime),
    0
  );

  const totalScoreImpact = actionItems.reduce(
    (sum, item) => sum + item.expectedScoreImpact,
    0
  );

  // Generate schema library
  const schemaLibrary = extractSchemaSnippets(actionItems);

  // Create progress tracker
  const progressTracker: ProgressItem[] = actionItems.map((item) => ({
    actionId: item.id,
    actionTitle: item.title,
    completed: false,
  }));

  return {
    brandId,
    brandName,
    generatedAt: now,
    version,
    knowledgeBaseVersion,
    summary: {
      totalActions: actionItems.length,
      criticalCount: actions.critical.length,
      highCount: actions.high.length,
      mediumCount: actions.medium.length,
      lowCount: actions.low.length,
      totalEstimatedTime: formatTime(totalEstimatedMinutes),
      expectedScoreIncrease: totalScoreImpact,
      currentScore,
      projectedScore: Math.min(100, currentScore + totalScoreImpact),
    },
    actions,
    schemaLibrary,
    progressTracker,
  };
}

/**
 * Transform a recommendation into a detailed action item
 */
function transformRecommendationToAction(
  rec: Recommendation,
  brandName: string
): ActionItem {
  // Determine action type from category
  const actionType = mapCategoryToActionType(rec.category);

  // Get implementation steps
  const steps = getImplementationSteps(actionType, brandName);

  // Calculate impact score
  const impactRange = IMPACT_SCORES[actionType] || { min: 3, max: 5 };
  const expectedScoreImpact = Math.round(
    (impactRange.min + impactRange.max) / 2
  );

  // Determine effort level
  const effort = mapEffortLevel(rec.effort);

  // Get time estimate
  const estimatedTime = TIME_ESTIMATES[effort];

  // Get code snippet if available
  const codeSnippet = getCodeSnippet(actionType, brandName);

  // Determine affected platforms
  const platformRelevance = getPlatformRelevance(actionType);
  const affectedPlatforms = Object.entries(platformRelevance)
    .filter(([_, score]) => score && score > 50)
    .map(([platform]) => platform);

  // Generate verification checklist
  const verificationChecklist = steps.map(
    (step) => step.verificationMethod || `Step ${step.stepNumber} completed`
  );

  return {
    id: rec.id,
    title: rec.title,
    description: rec.description,
    priority: mapPriority(rec.priority),
    category: rec.category,
    whyItMatters: generateWhyItMatters(actionType),
    steps,
    codeSnippet,
    codeLanguage: codeSnippet ? "html" : undefined,
    expectedScoreImpact,
    estimatedTime,
    effort,
    platformRelevance,
    affectedPlatforms,
    verificationChecklist,
  };
}

/**
 * Map recommendation category to action type
 */
function mapCategoryToActionType(category: string): string {
  const mapping: Record<string, string> = {
    schema_markup: "add_faq_schema",
    technical_seo: "optimize_meta_descriptions",
    content_optimization: "optimize_content_structure",
    content_freshness: "establish_content_calendar",
    brand_consistency: "create_brand_page",
    citation_building: "add_organization_schema",
    authority_building: "establish_content_calendar",
    competitor_analysis: "optimize_content_structure",
  };

  return mapping[category] || "optimize_content_structure";
}

/**
 * Get implementation steps for an action type
 */
function getImplementationSteps(
  actionType: string,
  brandName: string
): ImplementationStep[] {
  const template = STEP_TEMPLATES[actionType] || STEP_TEMPLATES.optimize_content_structure;

  // Personalize steps with brand name
  return template.map((step) => ({
    ...step,
    instruction: step.instruction.replace(/\[Brand\]/g, brandName),
    codeSnippet: step.codeSnippet?.replace(/\[Brand\]/g, brandName),
  }));
}

/**
 * Get code snippet for action type
 */
function getCodeSnippet(actionType: string, brandName: string): string | undefined {
  const snippets: Record<string, string> = {
    add_faq_schema: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is ${brandName}?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[Your answer here]"
    }
  }, {
    "@type": "Question",
    "name": "How does ${brandName} work?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[Your answer here]"
    }
  }]
}
</script>`,

    add_organization_schema: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${brandName}",
  "url": "https://yourwebsite.com",
  "logo": "https://yourwebsite.com/logo.png",
  "description": "[Your company description]",
  "sameAs": [
    "https://linkedin.com/company/${brandName.toLowerCase().replace(/\s+/g, "")}",
    "https://twitter.com/${brandName.toLowerCase().replace(/\s+/g, "")}"
  ]
}
</script>`,

    add_article_schema: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Article Title]",
  "author": {
    "@type": "Organization",
    "name": "${brandName}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "${brandName}",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yourwebsite.com/logo.png"
    }
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]"
}
</script>`,
  };

  return snippets[actionType];
}

/**
 * Get platform relevance scores for action type
 */
function getPlatformRelevance(actionType: string): PlatformRelevance {
  const relevance: Record<string, PlatformRelevance> = {
    add_faq_schema: {
      chatgpt: 90,
      claude: 85,
      gemini: 80,
      perplexity: 95,
      grok: 70,
      deepseek: 75,
      copilot: 80,
    },
    add_organization_schema: {
      chatgpt: 85,
      claude: 90,
      gemini: 85,
      perplexity: 80,
      grok: 75,
      deepseek: 70,
      copilot: 80,
    },
    optimize_content_structure: {
      chatgpt: 80,
      claude: 85,
      gemini: 80,
      perplexity: 90,
      grok: 70,
      deepseek: 75,
      copilot: 75,
    },
    establish_content_calendar: {
      chatgpt: 75,
      claude: 75,
      gemini: 70,
      perplexity: 95,
      grok: 65,
      deepseek: 70,
      copilot: 70,
    },
    linkedin_optimization: {
      chatgpt: 70,
      claude: 85,
      gemini: 60,
      perplexity: 65,
      grok: 50,
      deepseek: 55,
      copilot: 60,
    },
    twitter_optimization: {
      chatgpt: 60,
      claude: 55,
      gemini: 55,
      perplexity: 50,
      grok: 95,
      deepseek: 50,
      copilot: 55,
    },
    youtube_optimization: {
      chatgpt: 65,
      claude: 60,
      gemini: 95,
      perplexity: 70,
      grok: 55,
      deepseek: 60,
      copilot: 60,
    },
  };

  return (
    relevance[actionType] || {
      chatgpt: 70,
      claude: 70,
      gemini: 70,
      perplexity: 70,
      grok: 60,
      deepseek: 60,
      copilot: 65,
    }
  );
}

/**
 * Generate "Why It Matters" explanation
 */
function generateWhyItMatters(actionType: string): string {
  const explanations: Record<string, string> = {
    add_faq_schema:
      "AI platforms like ChatGPT and Perplexity specifically look for FAQ schema to answer user questions. Without it, your answers won't be cited even if you have the best content.",
    add_organization_schema:
      "When users ask AI 'What is [Brand]?', AI looks for Organization schema to provide accurate company information. Without it, AI may make up answers or say it doesn't have information.",
    optimize_content_structure:
      "AI platforms extract information more effectively from well-structured content. Clear headings, bullet points, and summaries make your content 3x more likely to be cited.",
    optimize_meta_descriptions:
      "Meta descriptions are often the first thing AI reads about your page. Clear, keyword-rich descriptions help AI understand what your page offers and when to cite it.",
    create_brand_page:
      "When users ask AI 'What is [Brand]?', AI looks for a definitive page that explains your brand. Without this, AI makes up answers or says 'I don't have information about that.'",
    establish_content_calendar:
      "Perplexity heavily favors fresh, recently-updated content. Brands that publish weekly get 3x more citations than those publishing monthly.",
    linkedin_optimization:
      "Claude and ChatGPT reference LinkedIn for company and people information. Your LinkedIn presence directly affects how AI describes your brand.",
    twitter_optimization:
      "Grok (X's AI) directly references Twitter/X content. Being active on X increases Grok visibility significantly.",
    youtube_optimization:
      "Gemini specifically indexes YouTube content. Video content with transcripts improves Gemini visibility by up to 40%.",
  };

  return (
    explanations[actionType] ||
    "This action improves your brand's visibility across AI platforms by making your content easier to discover and cite."
  );
}

/**
 * Map recommendation priority to action priority
 */
function mapPriority(priority: string): ActionPriority {
  const mapping: Record<string, ActionPriority> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };
  return mapping[priority] || "medium";
}

/**
 * Map effort level
 */
function mapEffortLevel(effort: string): EffortLevel {
  const mapping: Record<string, EffortLevel> = {
    quick_win: "quick_win",
    moderate: "moderate",
    major: "major",
  };
  return mapping[effort] || "moderate";
}

/**
 * Group action items by priority
 */
function groupByPriority(items: ActionItem[]): PrioritizedActions {
  return {
    critical: items.filter((i) => i.priority === "critical"),
    high: items.filter((i) => i.priority === "high"),
    medium: items.filter((i) => i.priority === "medium"),
    low: items.filter((i) => i.priority === "low"),
  };
}

/**
 * Extract schema snippets from action items
 */
function extractSchemaSnippets(items: ActionItem[]): SchemaSnippet[] {
  const snippets: SchemaSnippet[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (item.codeSnippet && item.category === "schema_markup") {
      const schemaType = extractSchemaType(item.codeSnippet);
      if (!seen.has(schemaType)) {
        seen.add(schemaType);
        snippets.push({
          schemaType,
          description: `${schemaType} schema for ${item.title}`,
          code: item.codeSnippet,
          validatorUrl: "https://validator.schema.org/",
          affectedActions: [item.id],
        });
      }
    }
  }

  return snippets;
}

/**
 * Extract schema type from code snippet
 */
function extractSchemaType(code: string): string {
  const match = code.match(/"@type"\s*:\s*"(\w+)"/);
  return match ? match[1] : "Unknown";
}

/**
 * Estimate minutes from time string
 */
function estimateMinutes(timeStr: string): number {
  if (timeStr.includes("minute")) {
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }
  if (timeStr.includes("hour")) {
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) * 60 : 120;
  }
  return 60; // default
}

/**
 * Format minutes to readable time
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minutes`;
}

/**
 * Generate version number based on date
 */
function generateVersionNumber(): string {
  const now = new Date();
  const major = now.getFullYear();
  const minor = String(now.getMonth() + 1).padStart(2, "0");
  const patch = String(now.getDate()).padStart(2, "0");
  return `${major}.${minor}.${patch}`;
}

/**
 * Get current knowledge base version
 */
function getKnowledgeBaseVersion(): string {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}.${String(week).padStart(2, "0")}`;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ============================================================================
// Export utilities
// ============================================================================

/**
 * Convert action plan to ActionSnapshot array for versioning
 */
export function actionPlanToSnapshots(plan: ActionPlan): ActionSnapshot[] {
  const allActions = [
    ...plan.actions.critical,
    ...plan.actions.high,
    ...plan.actions.medium,
    ...plan.actions.low,
  ];

  return allActions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    category: action.category,
    priority: action.priority,
    impact: action.expectedScoreImpact > 5 ? "high" : action.expectedScoreImpact > 3 ? "medium" : "low",
    effort: action.effort,
    steps: action.steps,
    schemaCode: action.codeSnippet,
    platformRelevance: action.platformRelevance,
    expectedScoreImpact: action.expectedScoreImpact,
  }));
}

/**
 * Format action plan for PDF export
 */
export function formatActionPlanForPdf(plan: ActionPlan): string {
  const lines: string[] = [];

  lines.push("═".repeat(65));
  lines.push(`APEX GEO ACTION PLAN v${plan.version}`);
  lines.push(`Generated: ${plan.generatedAt.toLocaleDateString()}`);
  lines.push(`Knowledge Base Version: ${plan.knowledgeBaseVersion}`);
  lines.push("═".repeat(65));
  lines.push("");
  lines.push("SUMMARY");
  lines.push("─".repeat(65));
  lines.push(`Total Actions: ${plan.summary.totalActions}`);
  lines.push(`Critical: ${plan.summary.criticalCount} | High: ${plan.summary.highCount} | Medium: ${plan.summary.mediumCount}`);
  lines.push(`Estimated Time: ${plan.summary.totalEstimatedTime}`);
  lines.push(`Current GEO Score: ${plan.summary.currentScore}/100`);
  lines.push(`Expected Score After Completion: ${plan.summary.projectedScore}/100 (+${plan.summary.expectedScoreIncrease} points)`);
  lines.push("");

  // Critical actions
  if (plan.actions.critical.length > 0) {
    lines.push("CRITICAL PRIORITY (Do This Week)");
    lines.push("─".repeat(65));
    plan.actions.critical.forEach((action, i) => {
      lines.push(...formatActionForPdf(action, i + 1));
    });
  }

  // High priority actions
  if (plan.actions.high.length > 0) {
    lines.push("HIGH PRIORITY (Do This Month)");
    lines.push("─".repeat(65));
    plan.actions.high.forEach((action, i) => {
      lines.push(...formatActionForPdf(action, i + 1));
    });
  }

  // Medium priority actions
  if (plan.actions.medium.length > 0) {
    lines.push("MEDIUM PRIORITY (Do Next Month)");
    lines.push("─".repeat(65));
    plan.actions.medium.forEach((action, i) => {
      lines.push(...formatActionForPdf(action, i + 1));
    });
  }

  return lines.join("\n");
}

/**
 * Format single action for PDF
 */
function formatActionForPdf(action: ActionItem, index: number): string[] {
  const lines: string[] = [];

  lines.push("");
  lines.push(`ACTION #${index}: ${action.title}`);
  lines.push("━".repeat(40));
  lines.push(`Impact: +${action.expectedScoreImpact} GEO points | Effort: ${action.estimatedTime} | Affects: ${action.affectedPlatforms.join(", ")}`);
  lines.push("");
  lines.push("WHY THIS MATTERS:");
  lines.push(action.whyItMatters);
  lines.push("");
  lines.push("STEP-BY-STEP INSTRUCTIONS:");
  lines.push("");

  action.steps.forEach((step) => {
    lines.push(`Step ${step.stepNumber}: ${step.instruction}`);
    if (step.codeSnippet) {
      lines.push("┌" + "─".repeat(60) + "┐");
      step.codeSnippet.split("\n").forEach((codeLine) => {
        lines.push("│ " + codeLine);
      });
      lines.push("└" + "─".repeat(60) + "┘");
    }
    lines.push("");
  });

  lines.push("VERIFICATION:");
  action.verificationChecklist.forEach((item) => {
    lines.push(`□ ${item}`);
  });

  lines.push("");
  return lines;
}
