/**
 * GEO Knowledge Base Seed Data
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Seeds the knowledge base with initial best practices and schema templates
 * for the GEO/AEO optimization system.
 */

import { db } from "@/lib/db";
import {
  geoBestPractices,
  schemaTemplates,
  type NewGeoBestPractice,
  type NewSchemaTemplate,
} from "@/lib/db/schema/geo-knowledge-base";

// ============================================================================
// Best Practices Seed Data
// ============================================================================

const INITIAL_BEST_PRACTICES: Omit<NewGeoBestPractice, "id" | "createdAt" | "updatedAt">[] = [
  // Schema Best Practices
  {
    platform: "all",
    category: "schema",
    title: "Implement FAQ Schema on Key Pages",
    description:
      "Add FAQ schema markup to pages with common questions. AI platforms like ChatGPT and Perplexity specifically look for FAQ schema to answer user questions directly.",
    implementationSteps: [
      "Identify top 10 most-asked customer questions",
      "Create FAQ section on relevant pages (homepage, product pages, support)",
      "Implement FAQPage schema using JSON-LD format",
      "Validate schema at validator.schema.org",
      "Submit sitemap for recrawling",
    ],
    impactScore: 9,
    effortScore: 3,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "all",
    category: "schema",
    title: "Add Organization Schema to Homepage",
    description:
      "Organization schema helps AI platforms understand your brand identity, contact information, and social profiles. This is essential for brand recognition in AI responses.",
    implementationSteps: [
      "Gather all official brand information (name, logo, description)",
      "Collect social media profile URLs",
      "Add Organization schema to homepage <head>",
      "Include sameAs property for all official channels",
      "Test with Google Rich Results Test",
    ],
    impactScore: 8,
    effortScore: 2,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "all",
    category: "schema",
    title: "Implement Article Schema on Blog Posts",
    description:
      "Article schema helps AI platforms understand content authorship, publication dates, and topic context. Properly structured articles are more likely to be cited.",
    implementationSteps: [
      "Add Article or BlogPosting schema to all blog content",
      "Include author information with Person schema",
      "Add datePublished and dateModified properties",
      "Include headline, description, and image properties",
      "Validate and test across multiple posts",
    ],
    impactScore: 7,
    effortScore: 3,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "all",
    category: "schema",
    title: "Add HowTo Schema for Tutorials",
    description:
      "HowTo schema provides step-by-step instructions in a format AI can parse and cite. Essential for tutorial and guide content.",
    implementationSteps: [
      "Identify all how-to/tutorial content",
      "Structure content with clear numbered steps",
      "Add HowTo schema with step property array",
      "Include estimated time and materials if applicable",
      "Add images for key steps",
    ],
    impactScore: 7,
    effortScore: 4,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },

  // Content Best Practices
  {
    platform: "perplexity",
    category: "content",
    title: "Publish Fresh Weekly Content",
    description:
      "Perplexity heavily favors recently updated content. Brands publishing weekly see 3x more citations than monthly publishers.",
    implementationSteps: [
      "Create a content calendar with weekly publishing schedule",
      "Focus on industry news, how-tos, and data-driven content",
      "Include 'Last Updated' dates on all content",
      "Maintain minimum 1500 words for comprehensive coverage",
      "Include a clear summary/key takeaway section",
    ],
    impactScore: 9,
    effortScore: 7,
    effectiveSince: new Date("2024-06-01"),
    version: 1,
  },
  {
    platform: "all",
    category: "content",
    title: "Create 'What is [Brand]?' Definitive Page",
    description:
      "When users ask AI 'What is [Brand]?', AI looks for a definitive page explaining your brand. Without this, AI may provide incomplete or inaccurate information.",
    implementationSteps: [
      "Create dedicated /about or /what-is-brand page",
      "Include one-sentence definition in first paragraph",
      "List key features and differentiators",
      "Describe target audience clearly",
      "Add honest comparison to alternatives",
    ],
    impactScore: 8,
    effortScore: 3,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "all",
    category: "content",
    title: "Add Key Takeaway Summaries",
    description:
      "AI platforms often quote the first clear summary they find. Adding a 'Key Takeaway' or 'Summary' section increases citation probability.",
    implementationSteps: [
      "Add summary section at top of long-form content",
      "Use clear formatting (bold, bullet points)",
      "Keep summaries under 150 words",
      "Make them self-contained and quotable",
      "Include the main keyword/topic naturally",
    ],
    impactScore: 7,
    effortScore: 2,
    effectiveSince: new Date("2024-03-01"),
    version: 1,
  },

  // Technical Best Practices
  {
    platform: "all",
    category: "technical",
    title: "Optimize Meta Descriptions for AI",
    description:
      "Meta descriptions serve as brief brand summaries that AI can reference. Well-crafted descriptions improve how AI presents your brand.",
    implementationSteps: [
      "Audit all page meta descriptions",
      "Include brand name and value proposition",
      "Keep descriptions 150-160 characters",
      "Make each description unique and specific",
      "Include relevant keywords naturally",
    ],
    impactScore: 6,
    effortScore: 3,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "all",
    category: "technical",
    title: "Ensure Mobile Responsiveness",
    description:
      "Mobile-friendly pages are more likely to be crawled and indexed by AI platforms. Poor mobile experience can hurt visibility.",
    implementationSteps: [
      "Test all pages on mobile devices",
      "Fix layout issues and touch targets",
      "Ensure readable font sizes (16px minimum)",
      "Optimize images for mobile loading",
      "Test Core Web Vitals scores",
    ],
    impactScore: 6,
    effortScore: 5,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },

  // Social Best Practices
  {
    platform: "grok",
    category: "social",
    title: "Maintain Active X/Twitter Presence",
    description:
      "Grok (X's AI) directly references Twitter/X content. Active presence significantly increases Grok visibility.",
    implementationSteps: [
      "Post 1-2 times daily on X/Twitter",
      "Include brand name naturally in tweets",
      "Share industry news with commentary",
      "Engage with industry conversations",
      "Use relevant hashtags moderately",
    ],
    impactScore: 8,
    effortScore: 5,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "gemini",
    category: "social",
    title: "Create YouTube Video Content",
    description:
      "Gemini specifically indexes YouTube content. Video content with transcripts significantly improves Gemini visibility.",
    implementationSteps: [
      "Create YouTube channel if not existing",
      "Post how-to and educational videos",
      "Add detailed descriptions with keywords",
      "Include full transcripts in descriptions",
      "Create playlists organized by topic",
    ],
    impactScore: 8,
    effortScore: 7,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
  {
    platform: "claude",
    category: "social",
    title: "Optimize LinkedIn Company Page",
    description:
      "Claude and ChatGPT reference LinkedIn for company and people information. LinkedIn presence affects brand descriptions in AI responses.",
    implementationSteps: [
      "Update company page with keyword-rich description",
      "Add all products/services with descriptions",
      "Post thought leadership content 2-3x weekly",
      "Ensure executive profiles are complete",
      "Build connections with industry influencers",
    ],
    impactScore: 7,
    effortScore: 4,
    effectiveSince: new Date("2024-01-01"),
    version: 1,
  },
];

// ============================================================================
// Schema Templates Seed Data
// ============================================================================

const INITIAL_SCHEMA_TEMPLATES: Omit<NewSchemaTemplate, "id" | "createdAt">[] = [
  {
    schemaType: "FAQPage",
    platformRelevance: {
      chatgpt: 9,
      perplexity: 9,
      claude: 8,
      gemini: 7,
      grok: 6,
      deepseek: 7,
    },
    templateCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{QUESTION_1}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_1}}"
      }
    },
    {
      "@type": "Question",
      "name": "{{QUESTION_2}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_2}}"
      }
    }
  ]
}
</script>`,
    usageInstructions: `1. Replace {{QUESTION_N}} with actual frequently asked questions
2. Replace {{ANSWER_N}} with concise, accurate answers (under 300 words each)
3. Add more Question objects as needed
4. Place in <head> section or before closing </body> tag
5. Validate at validator.schema.org before publishing`,
    version: 1,
    isCurrent: true,
  },
  {
    schemaType: "Organization",
    platformRelevance: {
      chatgpt: 9,
      claude: 9,
      perplexity: 8,
      gemini: 8,
      grok: 7,
      deepseek: 7,
    },
    templateCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{COMPANY_NAME}}",
  "url": "{{WEBSITE_URL}}",
  "logo": "{{LOGO_URL}}",
  "description": "{{COMPANY_DESCRIPTION}}",
  "foundingDate": "{{FOUNDING_YEAR}}",
  "founders": [
    {
      "@type": "Person",
      "name": "{{FOUNDER_NAME}}"
    }
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "{{PHONE_NUMBER}}",
    "contactType": "customer service",
    "email": "{{EMAIL_ADDRESS}}"
  },
  "sameAs": [
    "{{LINKEDIN_URL}}",
    "{{TWITTER_URL}}",
    "{{FACEBOOK_URL}}",
    "{{YOUTUBE_URL}}"
  ]
}
</script>`,
    usageInstructions: `1. Replace all {{PLACEHOLDER}} values with your company information
2. Remove any sameAs entries for platforms you don't use
3. Add additional social profiles as needed
4. Place in homepage <head> section
5. Ensure logo URL points to high-quality image`,
    version: 1,
    isCurrent: true,
  },
  {
    schemaType: "Article",
    platformRelevance: {
      perplexity: 9,
      chatgpt: 8,
      claude: 8,
      gemini: 8,
      grok: 7,
      deepseek: 7,
    },
    templateCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ARTICLE_TITLE}}",
  "description": "{{ARTICLE_DESCRIPTION}}",
  "image": "{{FEATURED_IMAGE_URL}}",
  "datePublished": "{{PUBLISH_DATE}}",
  "dateModified": "{{MODIFIED_DATE}}",
  "author": {
    "@type": "Person",
    "name": "{{AUTHOR_NAME}}",
    "url": "{{AUTHOR_URL}}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{{COMPANY_NAME}}",
    "logo": {
      "@type": "ImageObject",
      "url": "{{LOGO_URL}}"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "{{PAGE_URL}}"
  }
}
</script>`,
    usageInstructions: `1. Use for all blog posts and news articles
2. Dates should be in ISO 8601 format (YYYY-MM-DD)
3. Always include dateModified when content is updated
4. Author URL should link to author bio page
5. Image should be at least 1200px wide`,
    version: 1,
    isCurrent: true,
  },
  {
    schemaType: "HowTo",
    platformRelevance: {
      perplexity: 9,
      chatgpt: 8,
      gemini: 8,
      claude: 7,
      grok: 6,
      deepseek: 7,
    },
    templateCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "{{HOWTO_TITLE}}",
  "description": "{{HOWTO_DESCRIPTION}}",
  "totalTime": "PT{{TOTAL_MINUTES}}M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "{{COST}}"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "{{SUPPLY_1}}"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "{{TOOL_1}}"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "{{STEP_1_NAME}}",
      "text": "{{STEP_1_TEXT}}",
      "image": "{{STEP_1_IMAGE_URL}}"
    },
    {
      "@type": "HowToStep",
      "name": "{{STEP_2_NAME}}",
      "text": "{{STEP_2_TEXT}}",
      "image": "{{STEP_2_IMAGE_URL}}"
    }
  ]
}
</script>`,
    usageInstructions: `1. totalTime uses ISO 8601 duration format (PT30M = 30 minutes)
2. supply and tool arrays are optional - remove if not applicable
3. Each step should have clear, actionable instructions
4. Images for steps are recommended but optional
5. Add more steps as needed`,
    version: 1,
    isCurrent: true,
  },
  {
    schemaType: "Product",
    platformRelevance: {
      chatgpt: 8,
      perplexity: 8,
      gemini: 7,
      claude: 7,
      grok: 6,
      deepseek: 6,
    },
    templateCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{PRODUCT_NAME}}",
  "description": "{{PRODUCT_DESCRIPTION}}",
  "image": "{{PRODUCT_IMAGE_URL}}",
  "brand": {
    "@type": "Brand",
    "name": "{{BRAND_NAME}}"
  },
  "offers": {
    "@type": "Offer",
    "url": "{{PRODUCT_PAGE_URL}}",
    "priceCurrency": "USD",
    "price": "{{PRICE}}",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{RATING}}",
    "reviewCount": "{{REVIEW_COUNT}}"
  }
}
</script>`,
    usageInstructions: `1. Include on all product pages
2. aggregateRating should only be included if you have actual reviews
3. price should be numeric only (no currency symbols)
4. availability should match your actual stock status
5. image should show the actual product clearly`,
    version: 1,
    isCurrent: true,
  },
  {
    schemaType: "LocalBusiness",
    platformRelevance: {
      chatgpt: 8,
      gemini: 9,
      claude: 7,
      perplexity: 7,
      grok: 6,
      deepseek: 6,
    },
    templateCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{{BUSINESS_NAME}}",
  "description": "{{BUSINESS_DESCRIPTION}}",
  "image": "{{BUSINESS_IMAGE_URL}}",
  "telephone": "{{PHONE_NUMBER}}",
  "email": "{{EMAIL_ADDRESS}}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{STREET_ADDRESS}}",
    "addressLocality": "{{CITY}}",
    "addressRegion": "{{STATE}}",
    "postalCode": "{{ZIP_CODE}}",
    "addressCountry": "{{COUNTRY}}"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{{LATITUDE}}",
    "longitude": "{{LONGITUDE}}"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "priceRange": "{{PRICE_RANGE}}"
}
</script>`,
    usageInstructions: `1. Essential for businesses with physical locations
2. Include accurate geo coordinates for map features
3. openingHoursSpecification should match actual hours
4. priceRange uses $ symbols ($ for budget, $$$$ for luxury)
5. Consider using more specific type (Restaurant, Store, etc.)`,
    version: 1,
    isCurrent: true,
  },
];

// ============================================================================
// Seed Functions
// ============================================================================

/**
 * Seed the knowledge base with initial best practices
 */
export async function seedBestPractices(): Promise<{
  inserted: number;
  errors: number;
}> {
  let inserted = 0;
  let errors = 0;

  for (const practice of INITIAL_BEST_PRACTICES) {
    try {
      await db.insert(geoBestPractices).values(practice);
      inserted++;
    } catch (err) {
      console.error(`Failed to insert best practice "${practice.title}":`, err);
      errors++;
    }
  }

  return { inserted, errors };
}

/**
 * Seed the knowledge base with schema templates
 */
export async function seedSchemaTemplates(): Promise<{
  inserted: number;
  errors: number;
}> {
  let inserted = 0;
  let errors = 0;

  for (const template of INITIAL_SCHEMA_TEMPLATES) {
    try {
      await db.insert(schemaTemplates).values(template);
      inserted++;
    } catch (err) {
      console.error(`Failed to insert schema template "${template.schemaType}":`, err);
      errors++;
    }
  }

  return { inserted, errors };
}

/**
 * Seed all knowledge base data
 */
export async function seedKnowledgeBase(): Promise<{
  bestPractices: { inserted: number; errors: number };
  schemaTemplates: { inserted: number; errors: number };
}> {
  console.log("Seeding GEO knowledge base...");

  const bestPracticesResult = await seedBestPractices();
  console.log(
    `Best practices: ${bestPracticesResult.inserted} inserted, ${bestPracticesResult.errors} errors`
  );

  const schemaTemplatesResult = await seedSchemaTemplates();
  console.log(
    `Schema templates: ${schemaTemplatesResult.inserted} inserted, ${schemaTemplatesResult.errors} errors`
  );

  return {
    bestPractices: bestPracticesResult,
    schemaTemplates: schemaTemplatesResult,
  };
}

/**
 * Check if knowledge base needs seeding
 */
export async function needsSeeding(): Promise<boolean> {
  const [practicesCount] = await db
    .select({ count: db.$count(geoBestPractices) })
    .from(geoBestPractices);

  return (practicesCount?.count || 0) === 0;
}

export default seedKnowledgeBase;
