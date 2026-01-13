/**
 * Implementation Step Generator
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Transforms recommendation templates into rich, step-by-step implementation guides
 * with platform-specific notes, code snippets, and verification methods.
 */

import type { ImplementationStep, PlatformRelevance } from "../db/schema/geo-knowledge-base";
import type { RecommendationTemplate, TemplateId } from "./recommendation-templates";
import { SCHEMA_PLATFORM_RELEVANCE, generateSchema } from "../reports/schema-generator";
import type { BrandSchemaData, SchemaType } from "../reports/schema-generator";

/**
 * Rich step configuration for each recommendation template
 */
interface RichStepConfig {
  templateId: TemplateId;
  steps: ImplementationStep[];
  platformRelevance: PlatformRelevance;
  schemaType?: SchemaType;
  estimatedTime: string;
  expectedScoreImpact: number;
}

// ============================================================================
// Platform Relevance Scores for Recommendation Templates
// ============================================================================

const TEMPLATE_PLATFORM_RELEVANCE: Record<TemplateId, PlatformRelevance> = {
  // General optimization templates
  increase_mentions: {
    chatgpt: 90,
    claude: 90,
    gemini: 85,
    perplexity: 90,
    grok: 75,
    deepseek: 80,
    copilot: 85,
  },
  improve_citations: {
    chatgpt: 85,
    claude: 90,
    gemini: 85,
    perplexity: 95,
    grok: 70,
    deepseek: 75,
    copilot: 80,
  },
  boost_prominence: {
    chatgpt: 85,
    claude: 80,
    gemini: 80,
    perplexity: 90,
    grok: 70,
    deepseek: 75,
    copilot: 80,
  },
  create_authoritative_content: {
    chatgpt: 90,
    claude: 95,
    gemini: 90,
    perplexity: 95,
    grok: 75,
    deepseek: 80,
    copilot: 85,
  },
  optimize_structured_data: {
    chatgpt: 95,
    claude: 90,
    gemini: 90,
    perplexity: 95,
    grok: 70,
    deepseek: 80,
    copilot: 85,
  },
  // ChatGPT-specific templates
  chatgpt_optimize_qa: {
    chatgpt: 95,
    claude: 80,
    gemini: 75,
    perplexity: 85,
    grok: 65,
    deepseek: 70,
    copilot: 75,
  },
  chatgpt_technical_docs: {
    chatgpt: 90,
    claude: 95,
    gemini: 85,
    perplexity: 85,
    grok: 70,
    deepseek: 80,
    copilot: 90,
  },
  chatgpt_conversational_content: {
    chatgpt: 95,
    claude: 85,
    gemini: 75,
    perplexity: 70,
    grok: 80,
    deepseek: 70,
    copilot: 75,
  },
  // Claude-specific templates
  claude_detailed_analysis: {
    chatgpt: 80,
    claude: 95,
    gemini: 85,
    perplexity: 85,
    grok: 70,
    deepseek: 80,
    copilot: 75,
  },
  claude_code_examples: {
    chatgpt: 85,
    claude: 95,
    gemini: 85,
    perplexity: 80,
    grok: 70,
    deepseek: 85,
    copilot: 95,
  },
  claude_structured_thinking: {
    chatgpt: 85,
    claude: 95,
    gemini: 80,
    perplexity: 80,
    grok: 65,
    deepseek: 75,
    copilot: 80,
  },
  // Gemini-specific templates
  gemini_multimedia_content: {
    chatgpt: 75,
    claude: 70,
    gemini: 95,
    perplexity: 70,
    grok: 75,
    deepseek: 65,
    copilot: 70,
  },
  gemini_factual_content: {
    chatgpt: 85,
    claude: 90,
    gemini: 95,
    perplexity: 90,
    grok: 75,
    deepseek: 80,
    copilot: 80,
  },
  gemini_comprehensive_guides: {
    chatgpt: 85,
    claude: 90,
    gemini: 95,
    perplexity: 90,
    grok: 70,
    deepseek: 80,
    copilot: 80,
  },
  // Perplexity-specific templates
  perplexity_citations: {
    chatgpt: 80,
    claude: 85,
    gemini: 85,
    perplexity: 95,
    grok: 70,
    deepseek: 75,
    copilot: 80,
  },
  perplexity_recent_content: {
    chatgpt: 80,
    claude: 75,
    gemini: 80,
    perplexity: 95,
    grok: 80,
    deepseek: 75,
    copilot: 75,
  },
  perplexity_authoritative_sources: {
    chatgpt: 85,
    claude: 90,
    gemini: 90,
    perplexity: 95,
    grok: 75,
    deepseek: 80,
    copilot: 80,
  },
  // Content type optimization
  optimize_blog_posts: {
    chatgpt: 85,
    claude: 85,
    gemini: 85,
    perplexity: 90,
    grok: 75,
    deepseek: 75,
    copilot: 80,
  },
  optimize_documentation: {
    chatgpt: 90,
    claude: 95,
    gemini: 85,
    perplexity: 85,
    grok: 70,
    deepseek: 85,
    copilot: 95,
  },
  optimize_case_studies: {
    chatgpt: 85,
    claude: 90,
    gemini: 85,
    perplexity: 90,
    grok: 70,
    deepseek: 75,
    copilot: 75,
  },
  optimize_tutorials: {
    chatgpt: 90,
    claude: 90,
    gemini: 85,
    perplexity: 85,
    grok: 70,
    deepseek: 80,
    copilot: 85,
  },
};

// ============================================================================
// Rich Implementation Steps for Each Template
// ============================================================================

/**
 * Get rich implementation steps for FAQ Schema optimization
 */
function getFAQSchemaSteps(brandDomain: string): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Identify the top 5-10 questions customers ask about your product/service",
      platformNotes: {
        chatgpt: "ChatGPT prioritizes FAQ schema - this is critical for visibility",
        perplexity: "Perplexity uses FAQ schema as a primary citation source",
      },
      verificationMethod: "Review customer support tickets, chatbot logs, and search queries",
      estimatedTime: "30 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Write clear, concise answers (2-3 sentences each) for each question",
      platformNotes: {
        claude: "Claude prefers answers with context and nuance",
        chatgpt: "ChatGPT works best with direct, actionable answers",
      },
      verificationMethod: "Have team members review answers for accuracy and clarity",
      estimatedTime: "1 hour",
    },
    {
      stepNumber: 3,
      instruction: "Add the FAQ schema code to your page's <head> section",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [Your Product/Service]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Your 2-3 sentence answer here]"
      }
    },
    {
      "@type": "Question",
      "name": "How does [Your Product/Service] work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Your 2-3 sentence answer here]"
      }
    }
  ]
}
</script>`,
      platformNotes: {
        gemini: "Ensure answers include factual data for Gemini",
        perplexity: "Add publication dates for Perplexity preference",
      },
      verificationMethod: "Test at https://validator.schema.org/",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Test the schema implementation using Google's Rich Results Test",
      verificationMethod: `Visit https://search.google.com/test/rich-results and enter ${brandDomain}`,
      estimatedTime: "5 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Publish the page and wait 24-48 hours for AI platforms to recrawl",
      platformNotes: {
        perplexity: "Perplexity crawls frequently - you may see results within 24 hours",
        chatgpt: "ChatGPT may take 1-2 weeks to reflect changes in training data",
      },
      verificationMethod: "Monitor Apex dashboard for citation changes",
      estimatedTime: "Monitor over 48 hours",
    },
  ];
}

/**
 * Get rich implementation steps for Organization Schema
 */
function getOrganizationSchemaSteps(brandName: string): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Gather your organization's key information",
      platformNotes: {
        claude: "Claude heavily uses Organization schema for company information",
        chatgpt: "ChatGPT references this schema when answering 'What is [Brand]?' queries",
      },
      verificationMethod: "Verify all information is current and accurate",
      estimatedTime: "15 minutes",
    },
    {
      stepNumber: 2,
      instruction: "Add Organization schema to your homepage",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${brandName}",
  "url": "https://www.example.com",
  "logo": "https://www.example.com/logo.png",
  "description": "[Your company description - 1-2 sentences]",
  "foundingDate": "[YYYY]",
  "founders": [{
    "@type": "Person",
    "name": "[Founder Name]"
  }],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Street Address]",
    "addressLocality": "[City]",
    "addressRegion": "[State/Province]",
    "postalCode": "[Postal Code]",
    "addressCountry": "[Country Code]"
  },
  "sameAs": [
    "https://www.linkedin.com/company/[your-company]",
    "https://twitter.com/[your-handle]",
    "https://www.youtube.com/@[your-channel]"
  ]
}
</script>`,
      verificationMethod: "Validate at https://validator.schema.org/",
      estimatedTime: "20 minutes",
    },
    {
      stepNumber: 3,
      instruction: "Link social media profiles using the 'sameAs' property",
      platformNotes: {
        grok: "Grok (X's AI) specifically uses Twitter/X links from sameAs",
        gemini: "Gemini uses YouTube links from sameAs for video content discovery",
      },
      verificationMethod: "Verify all social links are active and correct",
      estimatedTime: "10 minutes",
    },
    {
      stepNumber: 4,
      instruction: "Add contact information schema",
      codeSnippet: `"contactPoint": {
  "@type": "ContactPoint",
  "telephone": "+1-XXX-XXX-XXXX",
  "contactType": "customer service",
  "availableLanguage": "English"
}`,
      verificationMethod: "Test contact information for accuracy",
      estimatedTime: "5 minutes",
    },
  ];
}

/**
 * Get rich implementation steps for content freshness optimization
 */
function getContentFreshnessSteps(): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Audit existing content for outdated information",
      platformNotes: {
        perplexity: "Perplexity strongly prioritizes content freshness - this is critical",
        grok: "Grok/X prefers recent content, especially for trending topics",
      },
      verificationMethod: "Create a spreadsheet of all content with last-updated dates",
      estimatedTime: "2 hours",
    },
    {
      stepNumber: 2,
      instruction: "Add visible 'Last Updated' dates to all content pages",
      codeSnippet: `<time datetime="2026-01-13" class="last-updated">
  Last updated: January 13, 2026
</time>`,
      platformNotes: {
        perplexity: "Perplexity uses this date as a ranking signal",
        gemini: "Gemini factors freshness into citation decisions",
      },
      verificationMethod: "Verify dates are visible and in ISO 8601 format in markup",
      estimatedTime: "30 minutes per page",
    },
    {
      stepNumber: 3,
      instruction: "Create a content calendar for regular updates",
      platformNotes: {
        perplexity: "Weekly content updates significantly improve Perplexity visibility",
        chatgpt: "Monthly updates help maintain ChatGPT citation relevance",
      },
      verificationMethod: "Set up calendar reminders and assign content owners",
      estimatedTime: "1 hour to set up",
    },
    {
      stepNumber: 4,
      instruction: "Update statistics, data, and examples with current information",
      verificationMethod: "Cross-reference all statistics with original sources",
      estimatedTime: "Variable per piece of content",
    },
    {
      stepNumber: 5,
      instruction: "Implement automated content freshness monitoring",
      platformNotes: {
        all: "Set alerts for content older than 6 months",
      },
      verificationMethod: "Configure Apex to track content age and alert on stale content",
      estimatedTime: "30 minutes",
    },
  ];
}

/**
 * Get rich implementation steps for authoritative content creation
 */
function getAuthorityBuildingSteps(brandName: string): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Identify your top 3-5 topic areas where you have unique expertise",
      platformNotes: {
        claude: "Claude values nuanced, expert perspectives",
        chatgpt: "ChatGPT prioritizes content from recognized authorities",
      },
      verificationMethod: "Survey customers about your perceived expertise areas",
      estimatedTime: "1 hour",
    },
    {
      stepNumber: 2,
      instruction: "Create detailed author bios with credentials for all content creators",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "[Author Name]",
  "jobTitle": "[Job Title] at ${brandName}",
  "description": "[Author expertise description]",
  "sameAs": [
    "https://www.linkedin.com/in/[profile]",
    "https://twitter.com/[handle]"
  ],
  "alumniOf": {
    "@type": "Organization",
    "name": "[University/Previous Company]"
  }
}
</script>`,
      platformNotes: {
        perplexity: "Author credentials significantly impact Perplexity citations",
        gemini: "Gemini factors E-E-A-T (Experience, Expertise, Authority, Trust) into rankings",
      },
      verificationMethod: "Review author bios for accuracy and completeness",
      estimatedTime: "30 minutes per author",
    },
    {
      stepNumber: 3,
      instruction: "Publish original research or industry surveys",
      platformNotes: {
        all: "Original research is highly cited across all AI platforms",
      },
      verificationMethod: "Plan and execute at least one research study per quarter",
      estimatedTime: "Variable (weeks to months)",
    },
    {
      stepNumber: 4,
      instruction: "Get featured in reputable industry publications",
      platformNotes: {
        perplexity: "External citations boost Perplexity trust scores",
        claude: "Claude values cross-referenced expert opinions",
      },
      verificationMethod: "Track press mentions and backlinks from authoritative sources",
      estimatedTime: "Ongoing outreach effort",
    },
  ];
}

/**
 * Get rich implementation steps for Q&A content optimization (ChatGPT-focused)
 */
function getQAOptimizationSteps(): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Research the questions users ask about your product/industry",
      platformNotes: {
        chatgpt: "ChatGPT excels at Q&A - this is your highest-impact optimization",
      },
      verificationMethod: "Use tools like AnswerThePublic, search autocomplete, and support logs",
      estimatedTime: "1 hour",
    },
    {
      stepNumber: 2,
      instruction: "Structure content with question headings (H2/H3 tags)",
      codeSnippet: `<h2>How does ${"{Brand}"} help with ${"{problem}"}?</h2>
<p><strong>Short answer:</strong> [1-2 sentence direct answer]</p>
<p>[Detailed explanation with examples...]</p>`,
      platformNotes: {
        chatgpt: "Use exact question phrasing that users would type",
        claude: "Follow up with nuanced context and examples",
      },
      verificationMethod: "Verify H2/H3 tags are properly formatted questions",
      estimatedTime: "Variable per page",
    },
    {
      stepNumber: 3,
      instruction: "Provide concise answers followed by detailed explanations",
      platformNotes: {
        chatgpt: "ChatGPT prefers direct answers in the first sentence",
        perplexity: "Perplexity quotes short, clear statements",
      },
      verificationMethod: "First sentence should answer the question completely",
      estimatedTime: "15 minutes per question",
    },
    {
      stepNumber: 4,
      instruction: "Add FAQ schema to pages with Q&A content",
      verificationMethod: "Validate schema at validator.schema.org",
      estimatedTime: "20 minutes",
    },
    {
      stepNumber: 5,
      instruction: "Create a dedicated FAQ page with comprehensive coverage",
      platformNotes: {
        chatgpt: "Dedicated FAQ pages get high citation rates from ChatGPT",
        all: "Organize FAQs by category for better user experience",
      },
      verificationMethod: "Page should answer at least 10-15 common questions",
      estimatedTime: "2-3 hours",
    },
  ];
}

/**
 * Get rich implementation steps for multimedia content (Gemini-focused)
 */
function getMultimediaOptimizationSteps(): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Audit existing content for multimedia opportunities",
      platformNotes: {
        gemini: "Gemini is multimodal - it processes images, videos, and text together",
      },
      verificationMethod: "List all pages that could benefit from visual content",
      estimatedTime: "1 hour",
    },
    {
      stepNumber: 2,
      instruction: "Add descriptive images with detailed alt text to all key pages",
      codeSnippet: `<img
  src="/images/your-image.jpg"
  alt="Detailed description of what the image shows, including relevant keywords and context"
  loading="lazy"
/>`,
      platformNotes: {
        gemini: "Gemini reads alt text to understand image content",
        all: "Alt text improves accessibility and AI understanding",
      },
      verificationMethod: "Alt text should describe image content in 125 characters or less",
      estimatedTime: "5 minutes per image",
    },
    {
      stepNumber: 3,
      instruction: "Create infographics summarizing key data and concepts",
      platformNotes: {
        gemini: "Gemini processes infographic content effectively",
        all: "Infographics are highly shareable and linkable",
      },
      verificationMethod: "Infographics should include text labels Gemini can read",
      estimatedTime: "2-4 hours per infographic",
    },
    {
      stepNumber: 4,
      instruction: "Embed videos with transcripts on relevant pages",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "[Video Title]",
  "description": "[Video description]",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "uploadDate": "2026-01-13",
  "duration": "PT5M30S",
  "contentUrl": "https://example.com/video.mp4",
  "transcript": "[Full video transcript text...]"
}
</script>`,
      platformNotes: {
        gemini: "Gemini indexes YouTube content heavily - prioritize YouTube embeds",
        perplexity: "Perplexity cites video content with transcripts",
      },
      verificationMethod: "Verify transcript accuracy and video schema validation",
      estimatedTime: "30 minutes per video",
    },
    {
      stepNumber: 5,
      instruction: "Add charts, graphs, and data visualizations where relevant",
      platformNotes: {
        gemini: "Gemini interprets data visualizations effectively",
        claude: "Include data tables alongside visualizations for Claude",
      },
      verificationMethod: "Charts should have text labels and be accessible",
      estimatedTime: "1 hour per visualization",
    },
  ];
}

/**
 * Get rich implementation steps for citation optimization (Perplexity-focused)
 */
function getCitationOptimizationSteps(): ImplementationStep[] {
  return [
    {
      stepNumber: 1,
      instruction: "Add clear author bylines and credentials to all content",
      codeSnippet: `<article>
  <header>
    <h1>[Article Title]</h1>
    <p class="byline">
      By <a href="/authors/jane-doe" rel="author">Jane Doe</a>,
      Senior [Role] at [Brand] |
      <time datetime="2026-01-13">January 13, 2026</time> |
      <time datetime="2026-01-13" class="updated">Updated: January 13, 2026</time>
    </p>
  </header>
  ...
</article>`,
      platformNotes: {
        perplexity: "Perplexity strongly prefers content with clear attribution",
        all: "Author bylines increase trust and citation likelihood",
      },
      verificationMethod: "Every piece of content should have visible author info",
      estimatedTime: "10 minutes per article",
    },
    {
      stepNumber: 2,
      instruction: "Include publication and last-updated dates on all content",
      platformNotes: {
        perplexity: "Perplexity weights recent content heavily",
        gemini: "Dates help Gemini assess content freshness",
      },
      verificationMethod: "Dates should be in both visible text and structured data",
      estimatedTime: "5 minutes per page",
    },
    {
      stepNumber: 3,
      instruction: "Create 'Key Takeaways' or 'Quick Facts' sections",
      codeSnippet: `<aside class="key-takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Point 1:</strong> [Concise, quotable statement]</li>
    <li><strong>Point 2:</strong> [Concise, quotable statement]</li>
    <li><strong>Point 3:</strong> [Concise, quotable statement]</li>
  </ul>
</aside>`,
      platformNotes: {
        perplexity: "Perplexity often quotes 'Key Takeaways' sections directly",
        chatgpt: "ChatGPT cites bullet points and summaries frequently",
      },
      verificationMethod: "Each takeaway should be self-contained and citable",
      estimatedTime: "15 minutes per article",
    },
    {
      stepNumber: 4,
      instruction: "Use descriptive, SEO-friendly URLs",
      platformNotes: {
        perplexity: "URLs help Perplexity understand content topic",
        all: "Clean URLs improve click-through and trust",
      },
      verificationMethod: "URLs should include topic keywords and be human-readable",
      estimatedTime: "5 minutes per page",
    },
    {
      stepNumber: 5,
      instruction: "Include source citations for all data and claims",
      platformNotes: {
        perplexity: "Perplexity values well-sourced content",
        claude: "Claude checks for logical consistency and sourcing",
      },
      verificationMethod: "Every statistic should link to or cite its source",
      estimatedTime: "Variable based on content",
    },
  ];
}

// ============================================================================
// Step Generator Functions
// ============================================================================

/**
 * Generate rich implementation steps for a recommendation template
 */
export function generateStepsForTemplate(
  template: RecommendationTemplate,
  brandData?: BrandSchemaData
): ImplementationStep[] {
  const brandName = brandData?.name ?? "[Your Brand]";
  const brandDomain = brandData?.domain ?? "yourdomain.com";

  switch (template.id) {
    case "optimize_structured_data":
      return getFAQSchemaSteps(brandDomain);

    case "chatgpt_optimize_qa":
      return getQAOptimizationSteps();

    case "gemini_multimedia_content":
      return getMultimediaOptimizationSteps();

    case "perplexity_citations":
      return getCitationOptimizationSteps();

    case "create_authoritative_content":
      return getAuthorityBuildingSteps(brandName);

    case "perplexity_recent_content":
      return getContentFreshnessSteps();

    // Convert action items to basic steps for templates without rich steps
    default:
      return convertActionItemsToSteps(template.actionItems, template.examples);
  }
}

/**
 * Convert simple action items to ImplementationStep format
 */
function convertActionItemsToSteps(
  actionItems: string[],
  examples?: string[]
): ImplementationStep[] {
  return actionItems.map((item, index) => ({
    stepNumber: index + 1,
    instruction: item,
    codeSnippet: examples?.[index],
    verificationMethod: "Review completion and test results",
    estimatedTime: "Variable",
  }));
}

/**
 * Get platform relevance for a template
 */
export function getPlatformRelevance(templateId: TemplateId): PlatformRelevance {
  return TEMPLATE_PLATFORM_RELEVANCE[templateId] ?? {
    chatgpt: 70,
    claude: 70,
    gemini: 70,
    perplexity: 70,
    grok: 60,
    deepseek: 60,
    copilot: 70,
  };
}

/**
 * Get schema type associated with a template (if applicable)
 */
export function getSchemaTypeForTemplate(templateId: TemplateId): SchemaType | undefined {
  const schemaMap: Partial<Record<TemplateId, SchemaType>> = {
    optimize_structured_data: "FAQPage",
    chatgpt_optimize_qa: "FAQPage",
    optimize_documentation: "HowTo",
    optimize_blog_posts: "Article",
    gemini_comprehensive_guides: "Article",
    optimize_case_studies: "Article",
  };

  return schemaMap[templateId];
}

/**
 * Generate schema code for a template (if applicable)
 */
export function generateSchemaForTemplate(
  templateId: TemplateId,
  brandData: BrandSchemaData
): string | undefined {
  const schemaType = getSchemaTypeForTemplate(templateId);
  if (!schemaType) return undefined;

  const schema = generateSchema(schemaType, brandData);
  return schema?.code;
}

/**
 * Get estimated time for a template
 */
export function getEstimatedTimeForTemplate(templateId: TemplateId): string {
  const timeMap: Partial<Record<TemplateId, string>> = {
    optimize_structured_data: "1-2 hours",
    chatgpt_optimize_qa: "2-3 hours",
    increase_mentions: "4-8 hours",
    improve_citations: "2-4 hours",
    boost_prominence: "2-3 hours",
    create_authoritative_content: "8-16 hours",
    chatgpt_technical_docs: "4-8 hours",
    chatgpt_conversational_content: "2-3 hours",
    claude_detailed_analysis: "8-12 hours",
    claude_code_examples: "4-6 hours",
    claude_structured_thinking: "2-4 hours",
    gemini_multimedia_content: "4-8 hours",
    gemini_factual_content: "3-5 hours",
    gemini_comprehensive_guides: "8-16 hours",
    perplexity_citations: "2-3 hours",
    perplexity_recent_content: "Ongoing (weekly)",
    perplexity_authoritative_sources: "Ongoing (monthly)",
    optimize_blog_posts: "1-2 hours per post",
    optimize_documentation: "4-8 hours",
    optimize_case_studies: "4-6 hours per study",
    optimize_tutorials: "2-4 hours per tutorial",
  };

  return timeMap[templateId] ?? "2-4 hours";
}

/**
 * Get expected score impact for a template
 */
export function getExpectedScoreImpact(templateId: TemplateId): number {
  const impactMap: Partial<Record<TemplateId, number>> = {
    optimize_structured_data: 8,
    chatgpt_optimize_qa: 10,
    increase_mentions: 12,
    improve_citations: 10,
    boost_prominence: 6,
    create_authoritative_content: 15,
    chatgpt_technical_docs: 8,
    chatgpt_conversational_content: 5,
    claude_detailed_analysis: 10,
    claude_code_examples: 8,
    claude_structured_thinking: 6,
    gemini_multimedia_content: 8,
    gemini_factual_content: 8,
    gemini_comprehensive_guides: 12,
    perplexity_citations: 10,
    perplexity_recent_content: 8,
    perplexity_authoritative_sources: 12,
    optimize_blog_posts: 5,
    optimize_documentation: 8,
    optimize_case_studies: 6,
    optimize_tutorials: 6,
  };

  return impactMap[templateId] ?? 5;
}

/**
 * Enrich a recommendation template with full implementation details
 */
export interface EnrichedRecommendation {
  templateId: TemplateId;
  title: string;
  description: string;
  steps: ImplementationStep[];
  platformRelevance: PlatformRelevance;
  schemaCode?: string;
  estimatedTime: string;
  expectedScoreImpact: number;
  priority: number;
  impact: "high" | "medium" | "low";
  difficulty: "easy" | "moderate" | "hard";
}

/**
 * Enrich a recommendation template with all implementation details
 */
export function enrichRecommendation(
  template: RecommendationTemplate,
  brandData?: BrandSchemaData
): EnrichedRecommendation {
  return {
    templateId: template.id,
    title: template.title,
    description: template.description,
    steps: generateStepsForTemplate(template, brandData),
    platformRelevance: getPlatformRelevance(template.id),
    schemaCode: brandData ? generateSchemaForTemplate(template.id, brandData) : undefined,
    estimatedTime: getEstimatedTimeForTemplate(template.id),
    expectedScoreImpact: getExpectedScoreImpact(template.id),
    priority: template.priority,
    impact: template.impact,
    difficulty: template.difficulty,
  };
}

/**
 * Enrich multiple recommendations
 */
export function enrichRecommendations(
  templates: RecommendationTemplate[],
  brandData?: BrandSchemaData
): EnrichedRecommendation[] {
  return templates.map((template) => enrichRecommendation(template, brandData));
}
