/**
 * Platform-Specific Recommendation Templates
 *
 * Provides template-based recommendations for improving brand visibility
 * on different AI platforms (ChatGPT, Claude, Gemini, Perplexity).
 *
 * Templates are selected based on visibility score analysis and customized
 * with platform-specific best practices.
 */

import type { Recommendation, AIPlatform, ContentType } from "./types";

/**
 * Template ID type for recommendation categorization
 */
export type TemplateId =
  // General optimization templates
  | "increase_mentions"
  | "improve_citations"
  | "boost_prominence"
  | "create_authoritative_content"
  | "optimize_structured_data"
  // Platform-specific templates
  | "chatgpt_optimize_qa"
  | "chatgpt_technical_docs"
  | "chatgpt_conversational_content"
  | "claude_detailed_analysis"
  | "claude_code_examples"
  | "claude_structured_thinking"
  | "gemini_multimedia_content"
  | "gemini_factual_content"
  | "gemini_comprehensive_guides"
  | "perplexity_citations"
  | "perplexity_recent_content"
  | "perplexity_authoritative_sources"
  // Content type optimization
  | "optimize_blog_posts"
  | "optimize_documentation"
  | "optimize_case_studies"
  | "optimize_tutorials";

/**
 * Recommendation template with placeholder support
 */
export interface RecommendationTemplate {
  id: TemplateId;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  impact: "high" | "medium" | "low";
  difficulty: "easy" | "moderate" | "hard";
  actionItems: string[];
  examples?: string[];
  platforms: AIPlatform[];
  applicableWhen?: (metrics: {
    visibilityScore: number;
    mentionCount: number;
    citationCount: number;
    prominence: number;
    bestContentType?: ContentType;
  }) => boolean;
}

/**
 * Template selection context
 */
export interface TemplateSelectionContext {
  platform: AIPlatform;
  visibilityScore: number;
  mentionCount: number;
  citationCount: number;
  prominence: number;
  bestContentType?: ContentType;
  worstContentType?: ContentType;
}

// ============================================================================
// General Optimization Templates
// ============================================================================

const GENERAL_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "increase_mentions",
    title: "Increase Brand Mention Frequency",
    description:
      "Your brand is mentioned infrequently in AI responses. Create more comprehensive, brand-focused content that establishes your expertise in key topic areas.",
    priority: 1,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Publish in-depth guides and tutorials that demonstrate your expertise",
      "Create FAQ sections addressing common questions in your industry",
      "Develop case studies showcasing your solutions and results",
      "Ensure brand name appears naturally in headings, summaries, and key sections",
      "Build topic clusters around your core offerings to increase topical authority",
    ],
    examples: [
      "Write comprehensive guides like 'Complete Guide to [Topic] by [Brand]'",
      "Create comparison content: '[Brand] vs Alternatives: A Complete Analysis'",
      "Develop resource hubs: 'The Ultimate [Topic] Resource Center by [Brand]'",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.mentionCount < 3,
  },
  {
    id: "improve_citations",
    title: "Improve Citation Quality and Frequency",
    description:
      "AI platforms are not citing your content frequently or with high relevance. Focus on creating authoritative, well-structured content that's easy to cite.",
    priority: 1,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Add clear, quotable statements and key takeaways to your content",
      "Structure content with clear headings, bullet points, and summaries",
      "Include data, statistics, and research findings that can be referenced",
      "Create definitive resources that become go-to references in your field",
      "Ensure technical accuracy and provide sources for your claims",
    ],
    examples: [
      "Add summary boxes: 'Key Takeaway: [Important insight from your brand]'",
      "Include data: '[Brand] research shows X% improvement in Y metric'",
      "Create quotable definitions: '[Term] is defined by [Brand] as...'",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.citationCount < 2,
  },
  {
    id: "boost_prominence",
    title: "Boost Early Visibility in Responses",
    description:
      "Your brand appears late in AI responses, reducing visibility. Optimize content to be surfaced earlier when relevant queries are made.",
    priority: 2,
    impact: "medium",
    difficulty: "moderate",
    actionItems: [
      "Front-load key information and brand mentions in content",
      "Create strong, descriptive page titles and meta descriptions",
      "Use schema markup to help AI platforms understand your content structure",
      "Build content around high-intent, specific queries in your niche",
      "Establish thought leadership through original research and insights",
    ],
    examples: [
      "Start articles with: '[Brand] offers [solution] for [problem]'",
      "Use title patterns: 'How [Brand] Solves [Problem]: A Complete Guide'",
      "Create hero sections with clear value propositions and brand positioning",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.prominence < 10,
  },
  {
    id: "create_authoritative_content",
    title: "Establish Content Authority",
    description:
      "Build authoritative, comprehensive content that AI platforms recognize as a trusted source in your industry.",
    priority: 2,
    impact: "high",
    difficulty: "hard",
    actionItems: [
      "Publish original research, surveys, or industry reports",
      "Create comprehensive, long-form content (2000+ words) on key topics",
      "Include expert quotes, interviews, and third-party validation",
      "Maintain content freshness with regular updates and new insights",
      "Build backlinks from authoritative sites in your industry",
    ],
    examples: [
      "Publish annual industry reports: '[Brand] 2024 State of [Industry] Report'",
      "Create ultimate guides: 'The Definitive Guide to [Topic] - [Brand]'",
      "Develop benchmark studies: '[Brand] Benchmark Study: Industry Standards'",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.visibilityScore < 40,
  },
  {
    id: "optimize_structured_data",
    title: "Implement Structured Data Markup",
    description:
      "Add schema markup and structured data to help AI platforms better understand and cite your content.",
    priority: 3,
    impact: "medium",
    difficulty: "easy",
    actionItems: [
      "Implement Article schema for blog posts and news content",
      "Add FAQPage schema for Q&A content",
      "Use HowTo schema for tutorials and guides",
      "Add Organization schema with brand details and social profiles",
      "Include BreadcrumbList schema for site navigation",
    ],
    examples: [
      "Add JSON-LD schema to all major content pages",
      "Use schema.org markup for product information",
      "Implement VideoObject schema for video content",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.visibilityScore < 60,
  },
];

// ============================================================================
// ChatGPT-Specific Templates
// ============================================================================

const CHATGPT_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "chatgpt_optimize_qa",
    title: "Optimize for ChatGPT's Q&A Format",
    description:
      "ChatGPT excels at answering questions directly. Structure your content in Q&A format to increase citation likelihood.",
    priority: 1,
    impact: "high",
    difficulty: "easy",
    actionItems: [
      "Create comprehensive FAQ sections addressing user questions",
      "Structure content with clear question headings and direct answers",
      "Use conversational language that matches how users ask questions",
      "Include 'People Also Ask' sections with related questions",
      "Provide concise answers followed by detailed explanations",
    ],
    examples: [
      "Format: 'What is [topic]? [Brand] defines [topic] as...'",
      "Create dedicated FAQ pages for each product/service",
      "Use H2/H3 tags for question headings: 'How does [Brand] help with [problem]?'",
    ],
    platforms: ["chatgpt"],
    applicableWhen: (metrics) => metrics.visibilityScore < 60,
  },
  {
    id: "chatgpt_technical_docs",
    title: "Create Technical Documentation",
    description:
      "ChatGPT frequently cites technical documentation and API references. Create detailed technical content for developer-focused topics.",
    priority: 2,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Publish comprehensive API documentation with code examples",
      "Create developer guides and integration tutorials",
      "Include troubleshooting sections with common issues and solutions",
      "Provide code snippets in multiple programming languages",
      "Maintain a changelog and versioning documentation",
    ],
    examples: [
      "Create '[Brand] API Reference' with detailed endpoint documentation",
      "Publish '[Brand] Integration Guide for [Platform]'",
      "Write 'Common [Brand] Issues and How to Fix Them'",
    ],
    platforms: ["chatgpt"],
    applicableWhen: (metrics) =>
      metrics.bestContentType === "documentation" ||
      metrics.bestContentType === "tutorial",
  },
  {
    id: "chatgpt_conversational_content",
    title: "Use Conversational Content Style",
    description:
      "ChatGPT responds well to conversational, accessible content. Write in a friendly, direct tone that mimics natural dialogue.",
    priority: 3,
    impact: "medium",
    difficulty: "easy",
    actionItems: [
      "Write in second person ('you') to create direct engagement",
      "Use simple, clear language avoiding unnecessary jargon",
      "Break down complex topics into digestible sections",
      "Include real-world examples and scenarios",
      "Add personal insights and practical tips",
    ],
    examples: [
      "Write: 'Here's how you can use [Brand] to solve [problem]...'",
      "Use phrases like: 'The easiest way to [task] with [Brand] is...'",
      "Create step-by-step walkthroughs: 'Step 1: First, you'll...'",
    ],
    platforms: ["chatgpt"],
    applicableWhen: (metrics) => metrics.mentionCount < 5,
  },
];

// ============================================================================
// Claude-Specific Templates
// ============================================================================

const CLAUDE_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "claude_detailed_analysis",
    title: "Provide In-Depth Analysis and Context",
    description:
      "Claude excels at detailed analysis and nuanced responses. Create comprehensive content with deep analysis, context, and multiple perspectives.",
    priority: 1,
    impact: "high",
    difficulty: "hard",
    actionItems: [
      "Write long-form analysis pieces (3000+ words) on complex topics",
      "Include multiple perspectives and balanced viewpoints",
      "Provide historical context and evolution of concepts",
      "Analyze trade-offs, pros/cons, and edge cases thoroughly",
      "Include detailed case studies with lessons learned",
    ],
    examples: [
      "Write: '[Brand] Analysis: The Evolution of [Topic] and Future Trends'",
      "Create: 'Understanding [Topic]: A Deep Dive by [Brand]'",
      "Publish: '[Brand] Perspective: Why [Trend] Matters for [Industry]'",
    ],
    platforms: ["claude"],
    applicableWhen: (metrics) => metrics.visibilityScore < 60,
  },
  {
    id: "claude_code_examples",
    title: "Include Detailed Code Examples",
    description:
      "Claude frequently references content with well-documented code examples. Include comprehensive code samples with explanations.",
    priority: 2,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Provide complete, working code examples for all features",
      "Include detailed inline comments explaining code logic",
      "Show before/after examples for code improvements",
      "Demonstrate error handling and edge cases",
      "Provide examples in multiple programming languages where relevant",
    ],
    examples: [
      "Create '[Brand] Code Examples: Complete Implementation Guide'",
      "Write 'How to Implement [Feature] with [Brand]: Code Walkthrough'",
      "Publish '[Brand] Best Practices: Code Examples and Patterns'",
    ],
    platforms: ["claude"],
    applicableWhen: (metrics) =>
      metrics.bestContentType === "documentation" ||
      metrics.bestContentType === "tutorial",
  },
  {
    id: "claude_structured_thinking",
    title: "Use Structured, Logical Content Organization",
    description:
      "Claude responds well to logically structured content with clear hierarchies and reasoning chains. Organize content with strong logical flow.",
    priority: 2,
    impact: "medium",
    difficulty: "moderate",
    actionItems: [
      "Create clear content hierarchies with descriptive headings (H1-H6)",
      "Use numbered lists for sequential processes and steps",
      "Include decision trees or flowcharts for complex decisions",
      "Provide 'Why this matters' sections explaining significance",
      "Connect concepts with clear logical progression",
    ],
    examples: [
      "Structure content: Introduction â†’ Problem â†’ Solution â†’ Implementation â†’ Results",
      "Use clear hierarchies: '1. Main Topic â†’ 1.1 Subtopic â†’ 1.1.1 Detail'",
      "Add context boxes: 'Why this approach works: [explanation]'",
    ],
    platforms: ["claude"],
    applicableWhen: (metrics) => metrics.prominence < 15,
  },
];

// ============================================================================
// Gemini-Specific Templates
// ============================================================================

const GEMINI_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "gemini_multimedia_content",
    title: "Create Multimedia-Rich Content",
    description:
      "Gemini excels at understanding multimodal content. Enhance your content with images, diagrams, videos, and infographics.",
    priority: 1,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Add descriptive images with detailed alt text to all content",
      "Create infographics summarizing key concepts and data",
      "Include diagrams, flowcharts, and visual explanations",
      "Embed videos with detailed transcripts",
      "Use charts and graphs to visualize data and trends",
    ],
    examples: [
      "Create '[Brand] Visual Guide to [Topic]' with step-by-step diagrams",
      "Publish infographics: '[Brand] Data Visualization: Industry Trends'",
      "Add comparison tables with visual indicators for features/benefits",
    ],
    platforms: ["gemini"],
    applicableWhen: (metrics) => metrics.visibilityScore < 60,
  },
  {
    id: "gemini_factual_content",
    title: "Emphasize Factual, Data-Driven Content",
    description:
      "Gemini prioritizes factual accuracy and data. Create content with strong factual foundations, statistics, and verifiable information.",
    priority: 1,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Include statistics, data points, and research findings",
      "Cite sources for all factual claims and data",
      "Use precise numbers and specific measurements",
      "Provide dates and version numbers for technical information",
      "Include methodology explanations for research and testing",
    ],
    examples: [
      "Write: '[Brand] research shows 45% improvement in efficiency (Study, 2024)'",
      "Include: 'Based on analysis of 10,000+ customer interactions...'",
      "Add data sections: 'Performance Metrics: 99.9% uptime, <50ms latency'",
    ],
    platforms: ["gemini"],
    applicableWhen: (metrics) => metrics.citationCount < 3,
  },
  {
    id: "gemini_comprehensive_guides",
    title: "Create Comprehensive, All-in-One Guides",
    description:
      "Gemini frequently cites comprehensive guides that cover topics thoroughly. Create definitive, all-encompassing resources.",
    priority: 2,
    impact: "high",
    difficulty: "hard",
    actionItems: [
      "Develop pillar content covering topics from beginner to advanced",
      "Include glossaries, definitions, and terminology sections",
      "Provide comparison matrices for features, tools, or approaches",
      "Add reference sections with additional resources",
      "Create table of contents with jump links for easy navigation",
    ],
    examples: [
      "Publish: 'The Complete [Topic] Guide by [Brand]: Everything You Need to Know'",
      "Create: '[Brand] Encyclopedia: [Topic] from A to Z'",
      "Develop: '[Brand] Resource Hub: Tools, Guides, and Best Practices'",
    ],
    platforms: ["gemini"],
    applicableWhen: (metrics) => metrics.visibilityScore < 50,
  },
];

// ============================================================================
// Perplexity-Specific Templates
// ============================================================================

const PERPLEXITY_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "perplexity_citations",
    title: "Optimize for Citation-Friendly Format",
    description:
      "Perplexity heavily emphasizes citations and sources. Structure content to be easily citable with clear attribution.",
    priority: 1,
    impact: "high",
    difficulty: "easy",
    actionItems: [
      "Add clear bylines and author credentials to all content",
      "Include publication dates and last-updated timestamps",
      "Use descriptive, SEO-friendly URLs that indicate content topic",
      "Add 'Quick Facts' or 'Key Takeaways' sections that are easy to cite",
      "Include source attribution for all data and research mentioned",
    ],
    examples: [
      "Add metadata: 'By [Expert Name], [Brand] | Published: [Date] | Updated: [Date]'",
      "Create citation-friendly URLs: '/guides/complete-guide-to-[topic]'",
      "Include source boxes: 'According to [Brand] research (2024)...'",
    ],
    platforms: ["perplexity"],
    applicableWhen: (metrics) => metrics.citationCount < 2,
  },
  {
    id: "perplexity_recent_content",
    title: "Publish Fresh, Timely Content",
    description:
      "Perplexity prioritizes recent, up-to-date information. Regularly publish new content and update existing articles.",
    priority: 1,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Publish fresh content regularly (weekly or more frequently)",
      "Update existing content with current data and trends",
      "Add 'Last Updated' timestamps to all pages",
      "Cover breaking news and trends in your industry",
      "Create time-sensitive content (monthly updates, quarterly reports)",
    ],
    examples: [
      "Publish: '[Brand] Weekly Update: Latest [Industry] Trends'",
      "Update: '[Topic] Best Practices - Updated [Current Month] 2024'",
      "Create: '[Brand] Q4 2024 Industry Report: What's Changing'",
    ],
    platforms: ["perplexity"],
    applicableWhen: (metrics) => metrics.visibilityScore < 50,
  },
  {
    id: "perplexity_authoritative_sources",
    title: "Build Domain Authority and Trust Signals",
    description:
      "Perplexity favors authoritative sources with strong trust signals. Strengthen your domain authority and credibility markers.",
    priority: 2,
    impact: "high",
    difficulty: "hard",
    actionItems: [
      "Build high-quality backlinks from authoritative industry sites",
      "Publish original research that others will cite and reference",
      "Establish author expertise with detailed bios and credentials",
      "Get featured in industry publications and media outlets",
      "Maintain E-E-A-T (Experience, Expertise, Authoritativeness, Trust) signals",
    ],
    examples: [
      "Create: '[Brand] Original Research: [Topic] Industry Survey'",
      "Develop thought leadership: 'Expert Opinion: [Topic] by [Brand] CEO'",
      "Build partnerships: Get quoted in major industry publications",
    ],
    platforms: ["perplexity"],
    applicableWhen: (metrics) => metrics.prominence < 10,
  },
];

// ============================================================================
// Content Type Optimization Templates
// ============================================================================

const CONTENT_TYPE_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "optimize_blog_posts",
    title: "Optimize Blog Post Format and Structure",
    description:
      "Improve your blog posts to increase visibility and citation likelihood across AI platforms.",
    priority: 2,
    impact: "medium",
    difficulty: "easy",
    actionItems: [
      "Use descriptive, keyword-rich titles that clearly state the topic",
      "Start with a compelling introduction summarizing key points",
      "Break content into scannable sections with clear H2/H3 headings",
      "Include a conclusion with key takeaways and next steps",
      "Add internal links to related content on your site",
    ],
    examples: [
      "Title format: 'How to [Achieve Goal]: [Brand]'s Complete Guide'",
      "Introduction: 'In this guide, [Brand] will show you...'",
      "Conclusion: 'Key Takeaways: [3-5 main points from article]'",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.bestContentType === "blog_post",
  },
  {
    id: "optimize_documentation",
    title: "Enhance Technical Documentation",
    description:
      "Improve documentation structure and completeness to become the go-to technical reference.",
    priority: 1,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Create a clear documentation hierarchy (Getting Started â†’ Advanced)",
      "Include code examples for every feature and API endpoint",
      "Provide troubleshooting guides with common errors and solutions",
      "Add search functionality and comprehensive index",
      "Keep documentation synchronized with product updates",
    ],
    examples: [
      "Structure: Overview â†’ Installation â†’ Quick Start â†’ API Reference â†’ Examples",
      "Add searchable code snippets with copy buttons",
      "Include versioned docs for different product releases",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.bestContentType === "documentation",
  },
  {
    id: "optimize_case_studies",
    title: "Strengthen Case Study Impact",
    description:
      "Create compelling case studies that demonstrate real-world value and results.",
    priority: 2,
    impact: "high",
    difficulty: "moderate",
    actionItems: [
      "Follow clear structure: Challenge â†’ Solution â†’ Results",
      "Include specific, quantifiable results and metrics",
      "Add customer quotes and testimonials for credibility",
      "Provide before/after comparisons",
      "Make case studies scannable with clear section headers",
    ],
    examples: [
      "Format: 'How [Company] Achieved [X% Improvement] with [Brand]'",
      "Include metrics: 'Results: 3x increase in efficiency, 50% cost reduction'",
      "Add quotes: '[Customer]: Working with [Brand] transformed our [process]'",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.bestContentType === "case_study",
  },
  {
    id: "optimize_tutorials",
    title: "Create Effective Tutorial Content",
    description:
      "Build step-by-step tutorials that are easy to follow and frequently cited.",
    priority: 2,
    impact: "medium",
    difficulty: "easy",
    actionItems: [
      "Use numbered steps with clear, actionable instructions",
      "Include screenshots or screen recordings for visual guidance",
      "Provide expected outcomes for each step",
      "Add troubleshooting tips for common issues",
      "Include a 'What you'll learn' section at the beginning",
    ],
    examples: [
      "Start with: 'In this tutorial, you'll learn how to [goal] using [Brand]'",
      "Format: 'Step 1: [Action]. You should see [expected result]'",
      "Add: 'Common Issues: If you see [error], try [solution]'",
    ],
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    applicableWhen: (metrics) => metrics.bestContentType === "tutorial",
  },
];

// ============================================================================
// Template Registry
// ============================================================================

/**
 * All available recommendation templates
 */
export const ALL_TEMPLATES: RecommendationTemplate[] = [
  ...GENERAL_TEMPLATES,
  ...CHATGPT_TEMPLATES,
  ...CLAUDE_TEMPLATES,
  ...GEMINI_TEMPLATES,
  ...PERPLEXITY_TEMPLATES,
  ...CONTENT_TYPE_TEMPLATES,
];

/**
 * Get templates for a specific platform
 *
 * @param platform - AI platform to get templates for
 * @returns Array of templates applicable to the platform
 */
export function getTemplatesForPlatform(
  platform: AIPlatform
): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter((template) =>
    template.platforms.includes(platform)
  );
}

/**
 * Select appropriate templates based on analysis context
 *
 * @param context - Template selection context with metrics
 * @param maxRecommendations - Maximum number of recommendations to return (default: 5)
 * @returns Array of selected recommendation templates
 *
 * @example
 * ```typescript
 * const recommendations = selectTemplates({
 *   platform: 'chatgpt',
 *   visibilityScore: 35,
 *   mentionCount: 2,
 *   citationCount: 1,
 *   prominence: 8,
 *   bestContentType: 'blog_post'
 * }, 5);
 * ```
 */
export function selectTemplates(
  context: TemplateSelectionContext,
  maxRecommendations: number = 5
): RecommendationTemplate[] {
  // Get all templates applicable to this platform
  const platformTemplates = getTemplatesForPlatform(context.platform);

  // Filter templates based on applicability conditions
  const applicableTemplates = platformTemplates.filter((template) => {
    // If template has no condition, it's always applicable
    if (!template.applicableWhen) return true;

    // Check if template's condition is met
    return template.applicableWhen({
      visibilityScore: context.visibilityScore,
      mentionCount: context.mentionCount,
      citationCount: context.citationCount,
      prominence: context.prominence,
      bestContentType: context.bestContentType,
    });
  });

  // Sort by priority (1 = highest) and impact
  const impactScore = { high: 3, medium: 2, low: 1 };
  applicableTemplates.sort((a, b) => {
    // First sort by priority (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then sort by impact (high > medium > low)
    return impactScore[b.impact] - impactScore[a.impact];
  });

  // Return top N recommendations
  return applicableTemplates.slice(0, maxRecommendations);
}

/**
 * Convert template to Recommendation object
 *
 * @param template - Recommendation template
 * @returns Recommendation object ready for use
 */
export function templateToRecommendation(
  template: RecommendationTemplate
): Recommendation {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    priority: template.priority,
    impact: template.impact,
    difficulty: template.difficulty,
    actionItems: template.actionItems,
    examples: template.examples,
  };
}

/**
 * Generate recommendations for a platform analysis
 *
 * @param context - Template selection context
 * @param maxRecommendations - Maximum number of recommendations (default: 5)
 * @returns Array of Recommendation objects
 *
 * @example
 * ```typescript
 * const recommendations = generateRecommendations({
 *   platform: 'claude',
 *   visibilityScore: 45,
 *   mentionCount: 3,
 *   citationCount: 2,
 *   prominence: 12,
 *   bestContentType: 'documentation'
 * });
 * console.log(`Generated ${recommendations.length} recommendations`);
 * ```
 */
export function generateRecommendations(
  context: TemplateSelectionContext,
  maxRecommendations: number = 5
): Recommendation[] {
  const templates = selectTemplates(context, maxRecommendations);
  return templates.map(templateToRecommendation);
}
