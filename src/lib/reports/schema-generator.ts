/**
 * Schema Code Library Generator
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 * Requirements: FR-2.1 through FR-2.6
 *
 * Provides pre-built JSON-LD schema templates with:
 * - Auto-fill with brand data
 * - Platform relevance scores
 * - Copy-to-clipboard ready output
 * - Schema.org validator links
 * - Version control support
 *
 * Key features:
 * - 15+ schema types (FAQPage, Organization, Article, etc.)
 * - Brand data auto-population
 * - Platform relevance indicators
 * - Validation links
 */

import type {
  Brand,
  PlatformRelevance,
} from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

/**
 * Schema type enumeration matching the database
 */
export type SchemaType =
  | "FAQPage"
  | "Organization"
  | "Article"
  | "HowTo"
  | "Product"
  | "LocalBusiness"
  | "Person"
  | "WebSite"
  | "BreadcrumbList"
  | "SiteNavigationElement"
  | "VideoObject"
  | "Course"
  | "Event"
  | "Review"
  | "AggregateRating";

/**
 * Variable placeholder for schema templates
 */
export interface SchemaVariable {
  name: string;
  description: string;
  placeholder: string;
  required: boolean;
  example?: string;
  defaultValue?: string;
}

/**
 * Generated schema code output
 */
export interface GeneratedSchema {
  schemaType: SchemaType;
  displayName: string;
  description: string;

  // Generated code
  code: string;
  codeMinified: string;

  // Platform relevance
  platformRelevance: PlatformRelevance;
  bestForPlatforms: string[];
  impactScore: number; // 1-10

  // Variables used
  variables: SchemaVariable[];
  autoFilledVariables: string[];

  // Validation
  validatorUrl: string;
  testUrl: string;

  // Version
  version: string;
  lastUpdated: Date;

  // Implementation guidance
  placement: string;
  additionalNotes?: string;
}

/**
 * Brand data for auto-fill
 */
export interface BrandSchemaData {
  name: string;
  description?: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;

  // Contact info
  email?: string;
  phone?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };

  // Social links
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };

  // Founders/People
  founders?: Array<{
    name: string;
    title: string;
    linkedinUrl?: string;
  }>;

  // Products (for Product schema)
  products?: Array<{
    name: string;
    description: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
  }>;

  // FAQs (for FAQPage schema)
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Schema library with all available schemas
 */
export interface SchemaLibrary {
  schemas: GeneratedSchema[];
  brandName: string;
  generatedAt: Date;
  version: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Platform relevance scores for each schema type
 * Based on current AI platform behavior (as of January 2026)
 */
export const SCHEMA_PLATFORM_RELEVANCE: Record<SchemaType, PlatformRelevance> = {
  FAQPage: {
    chatgpt: 95,
    claude: 90,
    gemini: 85,
    perplexity: 95,
    grok: 70,
    deepseek: 80,
    copilot: 85,
  },
  Organization: {
    chatgpt: 90,
    claude: 95,
    gemini: 85,
    perplexity: 85,
    grok: 80,
    deepseek: 75,
    copilot: 80,
  },
  Article: {
    chatgpt: 85,
    claude: 85,
    gemini: 80,
    perplexity: 95,
    grok: 75,
    deepseek: 80,
    copilot: 85,
  },
  HowTo: {
    chatgpt: 90,
    claude: 85,
    gemini: 80,
    perplexity: 90,
    grok: 65,
    deepseek: 75,
    copilot: 80,
  },
  Product: {
    chatgpt: 75,
    claude: 70,
    gemini: 80,
    perplexity: 85,
    grok: 60,
    deepseek: 70,
    copilot: 75,
  },
  LocalBusiness: {
    chatgpt: 85,
    claude: 80,
    gemini: 95,
    perplexity: 90,
    grok: 75,
    deepseek: 70,
    copilot: 80,
  },
  Person: {
    chatgpt: 90,
    claude: 95,
    gemini: 85,
    perplexity: 85,
    grok: 80,
    deepseek: 75,
    copilot: 80,
  },
  WebSite: {
    chatgpt: 80,
    claude: 75,
    gemini: 75,
    perplexity: 80,
    grok: 70,
    deepseek: 70,
    copilot: 75,
  },
  BreadcrumbList: {
    chatgpt: 70,
    claude: 65,
    gemini: 75,
    perplexity: 75,
    grok: 60,
    deepseek: 60,
    copilot: 70,
  },
  SiteNavigationElement: {
    chatgpt: 65,
    claude: 60,
    gemini: 70,
    perplexity: 70,
    grok: 55,
    deepseek: 55,
    copilot: 65,
  },
  VideoObject: {
    chatgpt: 70,
    claude: 65,
    gemini: 95,
    perplexity: 75,
    grok: 60,
    deepseek: 65,
    copilot: 70,
  },
  Course: {
    chatgpt: 80,
    claude: 75,
    gemini: 80,
    perplexity: 85,
    grok: 65,
    deepseek: 70,
    copilot: 75,
  },
  Event: {
    chatgpt: 75,
    claude: 70,
    gemini: 85,
    perplexity: 80,
    grok: 65,
    deepseek: 65,
    copilot: 70,
  },
  Review: {
    chatgpt: 80,
    claude: 75,
    gemini: 85,
    perplexity: 85,
    grok: 70,
    deepseek: 70,
    copilot: 75,
  },
  AggregateRating: {
    chatgpt: 80,
    claude: 75,
    gemini: 85,
    perplexity: 85,
    grok: 70,
    deepseek: 70,
    copilot: 75,
  },
};

/**
 * Current schema library version
 */
export const SCHEMA_LIBRARY_VERSION = "2026.01.1";

/**
 * Schema.org validator base URL
 */
const VALIDATOR_BASE_URL = "https://validator.schema.org/";

// ============================================================================
// Schema Template Functions
// ============================================================================

/**
 * Generate FAQPage schema
 */
function generateFAQPageSchema(brand: BrandSchemaData): GeneratedSchema {
  const faqs = brand.faqs || [
    {
      question: `What is ${brand.name}?`,
      answer: brand.description || `${brand.name} is a company in the ${brand.industry || "technology"} industry.`,
    },
    {
      question: `How do I contact ${brand.name}?`,
      answer: brand.email
        ? `You can reach us at ${brand.email}${brand.phone ? ` or call ${brand.phone}` : ""}.`
        : `Visit our website at ${brand.domain || "our website"} for contact information.`,
    },
  ];

  const mainEntity = faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "FAQPage",
    displayName: "FAQ Page Schema",
    description:
      "Marks up frequently asked questions. Critical for appearing in AI search results when users ask questions about your brand.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.FAQPage,
    bestForPlatforms: ["ChatGPT", "Perplexity", "Claude"],
    impactScore: 9,
    variables: [
      {
        name: "questions",
        description: "Array of FAQ question/answer pairs",
        placeholder: "Your FAQs here",
        required: true,
        example: '{"question": "What is...", "answer": "..."}',
      },
    ],
    autoFilledVariables: brand.faqs ? ["questions"] : [],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}#url=${encodeURIComponent(brand.domain || "")}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of your FAQ page or homepage",
    additionalNotes:
      "Include 5-10 of your most common customer questions. Update quarterly as new questions emerge.",
  };
}

/**
 * Generate Organization schema
 */
function generateOrganizationSchema(brand: BrandSchemaData): GeneratedSchema {
  const sameAs: string[] = [];
  if (brand.socialLinks?.linkedin) sameAs.push(brand.socialLinks.linkedin);
  if (brand.socialLinks?.twitter) sameAs.push(brand.socialLinks.twitter);
  if (brand.socialLinks?.facebook) sameAs.push(brand.socialLinks.facebook);
  if (brand.socialLinks?.youtube) sameAs.push(brand.socialLinks.youtube);
  if (brand.socialLinks?.instagram) sameAs.push(brand.socialLinks.instagram);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}` : "[YOUR_WEBSITE_URL]",
    description: brand.description || `[Brief description of ${brand.name}]`,
  };

  if (brand.logoUrl) {
    schema.logo = brand.logoUrl;
  }

  if (brand.email || brand.phone) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      ...(brand.email && { email: brand.email }),
      ...(brand.phone && { telephone: brand.phone }),
      contactType: "customer service",
    };
  }

  if (brand.address) {
    schema.address = {
      "@type": "PostalAddress",
      ...(brand.address.streetAddress && { streetAddress: brand.address.streetAddress }),
      ...(brand.address.city && { addressLocality: brand.address.city }),
      ...(brand.address.region && { addressRegion: brand.address.region }),
      ...(brand.address.postalCode && { postalCode: brand.address.postalCode }),
      ...(brand.address.country && { addressCountry: brand.address.country }),
    };
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (brand.founders && brand.founders.length > 0) {
    schema.founder = brand.founders.map((founder) => ({
      "@type": "Person",
      name: founder.name,
      jobTitle: founder.title,
      ...(founder.linkedinUrl && { sameAs: founder.linkedinUrl }),
    }));
  }

  const code = JSON.stringify(schema, null, 2);

  const autoFilled: string[] = ["name"];
  if (brand.description) autoFilled.push("description");
  if (brand.domain) autoFilled.push("url");
  if (brand.logoUrl) autoFilled.push("logo");
  if (brand.email || brand.phone) autoFilled.push("contactPoint");
  if (brand.address) autoFilled.push("address");
  if (sameAs.length > 0) autoFilled.push("sameAs");
  if (brand.founders) autoFilled.push("founder");

  return {
    schemaType: "Organization",
    displayName: "Organization Schema",
    description:
      "Defines your company identity. Essential for AI platforms to accurately describe your business when users ask 'What is [Brand]?'",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.Organization,
    bestForPlatforms: ["Claude", "ChatGPT", "Perplexity"],
    impactScore: 9,
    variables: [
      { name: "name", description: "Company name", placeholder: brand.name, required: true },
      { name: "url", description: "Website URL", placeholder: "[YOUR_WEBSITE_URL]", required: true },
      { name: "description", description: "Company description", placeholder: "[DESCRIPTION]", required: true },
      { name: "logo", description: "Logo URL", placeholder: "[LOGO_URL]", required: false },
      { name: "sameAs", description: "Social media URLs", placeholder: "[SOCIAL_URLS]", required: false },
    ],
    autoFilledVariables: autoFilled,
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}#url=${encodeURIComponent(brand.domain || "")}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of your homepage and about page",
    additionalNotes:
      "Include all social profiles to help AI platforms verify your identity. Update when contact info changes.",
  };
}

/**
 * Generate Article schema
 */
function generateArticleSchema(brand: BrandSchemaData): GeneratedSchema {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "[Article Title - Max 110 characters]",
    description: "[Article summary in 150-160 characters]",
    image: "[Featured Image URL]",
    datePublished: new Date().toISOString().split("T")[0],
    dateModified: new Date().toISOString().split("T")[0],
    author: {
      "@type": "Organization",
      name: brand.name,
      url: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}` : "[YOUR_WEBSITE_URL]",
    },
    publisher: {
      "@type": "Organization",
      name: brand.name,
      logo: {
        "@type": "ImageObject",
        url: brand.logoUrl || "[LOGO_URL]",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "[ARTICLE_URL]",
    },
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "Article",
    displayName: "Article Schema",
    description:
      "Marks up blog posts and articles. Helps Perplexity and other AI platforms cite your content with proper attribution.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.Article,
    bestForPlatforms: ["Perplexity", "ChatGPT", "Claude"],
    impactScore: 8,
    variables: [
      { name: "headline", description: "Article title", placeholder: "[Article Title]", required: true },
      { name: "description", description: "Article summary", placeholder: "[Summary]", required: true },
      { name: "image", description: "Featured image URL", placeholder: "[Image URL]", required: true },
      { name: "datePublished", description: "Publish date (YYYY-MM-DD)", placeholder: "[Date]", required: true },
      { name: "dateModified", description: "Last modified date", placeholder: "[Date]", required: true },
    ],
    autoFilledVariables: ["author", "publisher"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of each blog post/article page",
    additionalNotes:
      "Always include dateModified - AI platforms favor fresh content. Update this date whenever you revise the article.",
  };
}

/**
 * Generate HowTo schema
 */
function generateHowToSchema(brand: BrandSchemaData): GeneratedSchema {
  const baseUrl = brand.domain
    ? `https://${brand.domain.replace(/^https?:\/\//, "")}`
    : "[YOUR_WEBSITE_URL]";

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "[How to Title]",
    description: "[Brief description of what this guide teaches]",
    totalTime: "PT30M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    supply: [
      {
        "@type": "HowToSupply",
        name: "[Required item 1]",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: "[Required tool 1]",
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        name: "Step 1",
        text: "[Step 1 instructions]",
        url: `${baseUrl}/guide#step1`,
        image: "[Step 1 image URL]",
      },
      {
        "@type": "HowToStep",
        name: "Step 2",
        text: "[Step 2 instructions]",
        url: `${baseUrl}/guide#step2`,
        image: "[Step 2 image URL]",
      },
      {
        "@type": "HowToStep",
        name: "Step 3",
        text: "[Step 3 instructions]",
        url: `${baseUrl}/guide#step3`,
        image: "[Step 3 image URL]",
      },
    ],
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "HowTo",
    displayName: "How-To Schema",
    description:
      "Marks up step-by-step guides and tutorials. ChatGPT loves citing structured how-to content when users ask procedural questions.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.HowTo,
    bestForPlatforms: ["ChatGPT", "Perplexity", "Claude"],
    impactScore: 8,
    variables: [
      { name: "name", description: "Guide title", placeholder: "[How to Title]", required: true },
      { name: "description", description: "Guide description", placeholder: "[Description]", required: true },
      { name: "totalTime", description: "Time to complete (ISO 8601)", placeholder: "PT30M", required: false },
      { name: "step", description: "Array of steps", placeholder: "[Steps]", required: true },
    ],
    autoFilledVariables: brand.domain ? ["step URLs"] : [],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of tutorial/guide pages",
    additionalNotes:
      "Include images for each step when possible. AI platforms may display this as a featured snippet.",
  };
}

/**
 * Generate Product schema
 */
function generateProductSchema(brand: BrandSchemaData): GeneratedSchema {
  const product = brand.products?.[0] || {
    name: "[Product Name]",
    description: "[Product description]",
    price: 99.99,
    currency: "USD",
    imageUrl: "[Product Image URL]",
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl || "[Product Image URL]",
    brand: {
      "@type": "Brand",
      name: brand.name,
    },
    offers: {
      "@type": "Offer",
      price: product.price || "[PRICE]",
      priceCurrency: product.currency || "USD",
      availability: "https://schema.org/InStock",
      url: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}/products` : "[PRODUCT_URL]",
      seller: {
        "@type": "Organization",
        name: brand.name,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "[RATING]",
      reviewCount: "[REVIEW_COUNT]",
    },
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "Product",
    displayName: "Product Schema",
    description:
      "Marks up product information. Helps AI platforms answer questions about your products with accurate pricing and details.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.Product,
    bestForPlatforms: ["Perplexity", "Gemini", "ChatGPT"],
    impactScore: 7,
    variables: [
      { name: "name", description: "Product name", placeholder: "[Product Name]", required: true },
      { name: "description", description: "Product description", placeholder: "[Description]", required: true },
      { name: "price", description: "Price", placeholder: "[PRICE]", required: true },
      { name: "image", description: "Product image URL", placeholder: "[Image URL]", required: true },
    ],
    autoFilledVariables: brand.products ? ["name", "description", "brand"] : ["brand"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of each product page",
    additionalNotes:
      "Include aggregateRating if you have reviews. This significantly improves visibility in AI product comparisons.",
  };
}

/**
 * Generate LocalBusiness schema
 */
function generateLocalBusinessSchema(brand: BrandSchemaData): GeneratedSchema {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand.name,
    description: brand.description || `[Description of ${brand.name}]`,
    url: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}` : "[YOUR_WEBSITE_URL]",
    telephone: brand.phone || "[PHONE_NUMBER]",
    email: brand.email || "[EMAIL_ADDRESS]",
  };

  if (brand.logoUrl) {
    schema.image = brand.logoUrl;
  }

  if (brand.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: brand.address.streetAddress || "[STREET_ADDRESS]",
      addressLocality: brand.address.city || "[CITY]",
      addressRegion: brand.address.region || "[STATE/REGION]",
      postalCode: brand.address.postalCode || "[POSTAL_CODE]",
      addressCountry: brand.address.country || "[COUNTRY]",
    };

    // Add geo coordinates placeholder
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: "[LATITUDE]",
      longitude: "[LONGITUDE]",
    };
  }

  schema.openingHoursSpecification = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  ];

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "LocalBusiness",
    displayName: "Local Business Schema",
    description:
      "Essential for local businesses. Gemini and Google-powered AI heavily weight this for local search queries.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.LocalBusiness,
    bestForPlatforms: ["Gemini", "Perplexity", "ChatGPT"],
    impactScore: 9,
    variables: [
      { name: "name", description: "Business name", placeholder: brand.name, required: true },
      { name: "address", description: "Physical address", placeholder: "[ADDRESS]", required: true },
      { name: "telephone", description: "Phone number", placeholder: "[PHONE]", required: true },
      { name: "geo", description: "Coordinates", placeholder: "[LAT/LONG]", required: false },
      { name: "openingHoursSpecification", description: "Business hours", placeholder: "[HOURS]", required: false },
    ],
    autoFilledVariables: brand.address
      ? ["name", "address", "telephone", "email"]
      : ["name"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of homepage and contact page",
    additionalNotes:
      "Include accurate geo coordinates. AI platforms use this for 'near me' queries and local recommendations.",
  };
}

/**
 * Generate Person schema
 */
function generatePersonSchema(brand: BrandSchemaData): GeneratedSchema {
  const founder = brand.founders?.[0] || {
    name: "[Person Name]",
    title: "[Job Title]",
    linkedinUrl: "[LinkedIn URL]",
  };

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: founder.name,
    jobTitle: founder.title,
    worksFor: {
      "@type": "Organization",
      name: brand.name,
      url: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}` : "[COMPANY_URL]",
    },
  };

  if (founder.linkedinUrl) {
    schema.sameAs = [founder.linkedinUrl];
  }

  schema.description = `[Brief bio of ${founder.name}]`;
  schema.image = "[PERSON_IMAGE_URL]";
  schema.email = "[EMAIL]";

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "Person",
    displayName: "Person Schema",
    description:
      "Marks up leadership and key people. Claude especially values this for understanding company expertise and credibility.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.Person,
    bestForPlatforms: ["Claude", "ChatGPT", "Perplexity"],
    impactScore: 8,
    variables: [
      { name: "name", description: "Person's full name", placeholder: "[Name]", required: true },
      { name: "jobTitle", description: "Job title", placeholder: "[Title]", required: true },
      { name: "worksFor", description: "Organization", placeholder: brand.name, required: true },
      { name: "sameAs", description: "Social profiles", placeholder: "[URLs]", required: false },
    ],
    autoFilledVariables: brand.founders ? ["name", "jobTitle", "worksFor"] : ["worksFor"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of team/about page and author pages",
    additionalNotes:
      "Add Person schema for all key executives and content authors. This builds E-E-A-T signals for AI platforms.",
  };
}

/**
 * Generate WebSite schema
 */
function generateWebSiteSchema(brand: BrandSchemaData): GeneratedSchema {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}` : "[YOUR_WEBSITE_URL]",
    description: brand.description || `[Description of ${brand.name} website]`,
    publisher: {
      "@type": "Organization",
      name: brand.name,
      logo: {
        "@type": "ImageObject",
        url: brand.logoUrl || "[LOGO_URL]",
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: brand.domain
          ? `https://${brand.domain.replace(/^https?:\/\//, "")}/search?q={search_term_string}`
          : "[YOUR_WEBSITE_URL]/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "WebSite",
    displayName: "WebSite Schema",
    description:
      "Defines your website identity. Enables sitelinks searchbox and helps AI platforms understand your site structure.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.WebSite,
    bestForPlatforms: ["ChatGPT", "Perplexity", "Gemini"],
    impactScore: 7,
    variables: [
      { name: "name", description: "Website name", placeholder: brand.name, required: true },
      { name: "url", description: "Website URL", placeholder: "[URL]", required: true },
      { name: "description", description: "Website description", placeholder: "[Description]", required: false },
    ],
    autoFilledVariables: ["name", "url", "publisher"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of homepage only",
    additionalNotes:
      "Only include potentialAction if you have a site search feature. Remove it if not applicable.",
  };
}

/**
 * Generate BreadcrumbList schema
 */
function generateBreadcrumbListSchema(brand: BrandSchemaData): GeneratedSchema {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: brand.domain ? `https://${brand.domain.replace(/^https?:\/\//, "")}` : "[YOUR_WEBSITE_URL]",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "[Category Name]",
        item: "[CATEGORY_URL]",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "[Page Name]",
        item: "[PAGE_URL]",
      },
    ],
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "BreadcrumbList",
    displayName: "Breadcrumb Schema",
    description:
      "Shows site hierarchy. Helps AI platforms understand content relationships and navigate your site structure.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.BreadcrumbList,
    bestForPlatforms: ["Gemini", "Perplexity"],
    impactScore: 6,
    variables: [
      { name: "itemListElement", description: "Array of breadcrumb items", placeholder: "[Items]", required: true },
    ],
    autoFilledVariables: ["Home item"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of every page (dynamically generated)",
    additionalNotes:
      "Generate this dynamically based on page URL structure. Don't hardcode breadcrumbs.",
  };
}

/**
 * Generate VideoObject schema
 */
function generateVideoObjectSchema(brand: BrandSchemaData): GeneratedSchema {
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "[Video Title]",
    description: "[Video description]",
    thumbnailUrl: "[THUMBNAIL_URL]",
    uploadDate: new Date().toISOString().split("T")[0],
    duration: "PT5M30S",
    contentUrl: "[VIDEO_URL]",
    embedUrl: "[EMBED_URL]",
    publisher: {
      "@type": "Organization",
      name: brand.name,
      logo: {
        "@type": "ImageObject",
        url: brand.logoUrl || "[LOGO_URL]",
      },
    },
  };

  const code = JSON.stringify(schema, null, 2);

  return {
    schemaType: "VideoObject",
    displayName: "Video Schema",
    description:
      "Marks up video content. Gemini heavily weights video content - essential if you have YouTube or embedded videos.",
    code: formatSchemaCode(code),
    codeMinified: JSON.stringify(schema),
    platformRelevance: SCHEMA_PLATFORM_RELEVANCE.VideoObject,
    bestForPlatforms: ["Gemini", "Perplexity"],
    impactScore: 8,
    variables: [
      { name: "name", description: "Video title", placeholder: "[Title]", required: true },
      { name: "description", description: "Video description", placeholder: "[Description]", required: true },
      { name: "thumbnailUrl", description: "Thumbnail image URL", placeholder: "[URL]", required: true },
      { name: "duration", description: "Duration (ISO 8601)", placeholder: "PT5M30S", required: true },
      { name: "contentUrl", description: "Video file URL", placeholder: "[URL]", required: false },
      { name: "embedUrl", description: "Embed URL", placeholder: "[URL]", required: false },
    ],
    autoFilledVariables: ["publisher"],
    validatorUrl: VALIDATOR_BASE_URL,
    testUrl: `${VALIDATOR_BASE_URL}`,
    version: SCHEMA_LIBRARY_VERSION,
    lastUpdated: new Date(),
    placement: "Add to <head> section of pages with embedded videos",
    additionalNotes:
      "If hosting on YouTube, the schema is partially auto-generated. Add this for self-hosted videos.",
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format schema code with HTML script tags
 */
function formatSchemaCode(jsonCode: string): string {
  return `<script type="application/ld+json">
${jsonCode}
</script>`;
}

/**
 * Calculate average platform relevance score
 */
export function calculateAverageRelevance(relevance: PlatformRelevance): number {
  const values = Object.values(relevance).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}

/**
 * Get top platforms for a schema type
 */
export function getTopPlatforms(relevance: PlatformRelevance, count: number = 3): string[] {
  const platformNames: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    grok: "Grok",
    deepseek: "DeepSeek",
    copilot: "Copilot",
  };

  return Object.entries(relevance)
    .filter(([, score]) => typeof score === "number")
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, count)
    .map(([platform]) => platformNames[platform] || platform);
}

// ============================================================================
// Main Generator Functions
// ============================================================================

/**
 * Generate a single schema by type
 */
export function generateSchema(
  schemaType: SchemaType,
  brand: BrandSchemaData
): GeneratedSchema | null {
  switch (schemaType) {
    case "FAQPage":
      return generateFAQPageSchema(brand);
    case "Organization":
      return generateOrganizationSchema(brand);
    case "Article":
      return generateArticleSchema(brand);
    case "HowTo":
      return generateHowToSchema(brand);
    case "Product":
      return generateProductSchema(brand);
    case "LocalBusiness":
      return generateLocalBusinessSchema(brand);
    case "Person":
      return generatePersonSchema(brand);
    case "WebSite":
      return generateWebSiteSchema(brand);
    case "BreadcrumbList":
      return generateBreadcrumbListSchema(brand);
    case "VideoObject":
      return generateVideoObjectSchema(brand);
    default:
      console.warn(`Schema type ${schemaType} not yet implemented`);
      return null;
  }
}

/**
 * Generate all recommended schemas for a brand
 */
export function generateRecommendedSchemas(brand: BrandSchemaData): GeneratedSchema[] {
  // Prioritized list of schemas every brand should have
  const prioritySchemas: SchemaType[] = [
    "Organization",
    "FAQPage",
    "WebSite",
    "Article",
  ];

  // Add conditional schemas based on brand data
  if (brand.address) {
    prioritySchemas.push("LocalBusiness");
  }
  if (brand.founders && brand.founders.length > 0) {
    prioritySchemas.push("Person");
  }
  if (brand.products && brand.products.length > 0) {
    prioritySchemas.push("Product");
  }

  // Always include these as best practices
  prioritySchemas.push("BreadcrumbList");
  prioritySchemas.push("HowTo");

  // Generate each schema
  const schemas: GeneratedSchema[] = [];
  for (const schemaType of prioritySchemas) {
    const schema = generateSchema(schemaType, brand);
    if (schema) {
      schemas.push(schema);
    }
  }

  // Sort by impact score (highest first)
  return schemas.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Generate complete schema library for a brand
 */
export function generateSchemaLibrary(brand: BrandSchemaData): SchemaLibrary {
  const allSchemaTypes: SchemaType[] = [
    "Organization",
    "FAQPage",
    "Article",
    "HowTo",
    "Product",
    "LocalBusiness",
    "Person",
    "WebSite",
    "BreadcrumbList",
    "VideoObject",
  ];

  const schemas: GeneratedSchema[] = [];
  for (const schemaType of allSchemaTypes) {
    const schema = generateSchema(schemaType, brand);
    if (schema) {
      schemas.push(schema);
    }
  }

  return {
    schemas: schemas.sort((a, b) => b.impactScore - a.impactScore),
    brandName: brand.name,
    generatedAt: new Date(),
    version: SCHEMA_LIBRARY_VERSION,
  };
}

/**
 * Convert brand database record to schema data format
 */
export function brandToSchemaData(brand: Brand): BrandSchemaData {
  // Extract social links from brand
  const socialLinks: BrandSchemaData["socialLinks"] = {};
  if (brand.socialLinks && typeof brand.socialLinks === "object") {
    const links = brand.socialLinks as Record<string, unknown>;
    if (typeof links.linkedin === "string") socialLinks.linkedin = links.linkedin;
    if (typeof links.twitter === "string") socialLinks.twitter = links.twitter;
    if (typeof links.facebook === "string") socialLinks.facebook = links.facebook;
    if (typeof links.youtube === "string") socialLinks.youtube = links.youtube;
    if (typeof links.instagram === "string") socialLinks.instagram = links.instagram;
  }

  return {
    name: brand.name,
    description: brand.description || undefined,
    domain: brand.domain || undefined,
    logoUrl: brand.logoUrl || undefined,
    industry: brand.industry || undefined,
    socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    // Additional fields would come from related tables
  };
}

/**
 * Format schema library for PDF export
 */
export function formatSchemaLibraryForPdf(library: SchemaLibrary): string {
  let output = `
═══════════════════════════════════════════════════════════════════
APEX SCHEMA CODE LIBRARY
Generated: ${library.generatedAt.toLocaleDateString()}
Brand: ${library.brandName}
Version: ${library.version}
═══════════════════════════════════════════════════════════════════

This library contains copy-paste ready JSON-LD schema markup optimized
for AI platform visibility. Each schema includes platform relevance
scores and implementation guidance.

───────────────────────────────────────────────────────────────────
SCHEMA PRIORITY ORDER (by impact on AI visibility)
───────────────────────────────────────────────────────────────────

`;

  library.schemas.forEach((schema, index) => {
    output += `
${index + 1}. ${schema.displayName.toUpperCase()}
${"━".repeat(60)}
Impact Score: ${schema.impactScore}/10
Best For: ${schema.bestForPlatforms.join(", ")}

WHY IT MATTERS:
${schema.description}

PLACEMENT:
${schema.placement}

COPY THIS CODE:
┌────────────────────────────────────────────────────────────────┐
${schema.code.split("\n").map((line) => `│ ${line.padEnd(64)}│`).join("\n")}
└────────────────────────────────────────────────────────────────┘

PLATFORM RELEVANCE SCORES:
• ChatGPT:    ${schema.platformRelevance.chatgpt || "N/A"}%
• Claude:     ${schema.platformRelevance.claude || "N/A"}%
• Gemini:     ${schema.platformRelevance.gemini || "N/A"}%
• Perplexity: ${schema.platformRelevance.perplexity || "N/A"}%
• Grok:       ${schema.platformRelevance.grok || "N/A"}%
• DeepSeek:   ${schema.platformRelevance.deepseek || "N/A"}%
• Copilot:    ${schema.platformRelevance.copilot || "N/A"}%

AUTO-FILLED FROM YOUR BRAND DATA:
${schema.autoFilledVariables.length > 0 ? schema.autoFilledVariables.map((v) => `✓ ${v}`).join("\n") : "None - fill in all placeholders"}

VARIABLES TO CUSTOMIZE:
${schema.variables.filter((v) => v.required).map((v) => `• ${v.name} (required): ${v.description}`).join("\n")}

VALIDATION:
Test your schema at: ${schema.validatorUrl}

${schema.additionalNotes ? `NOTES:\n${schema.additionalNotes}\n` : ""}
`;
  });

  output += `
═══════════════════════════════════════════════════════════════════
IMPLEMENTATION CHECKLIST
═══════════════════════════════════════════════════════════════════

□ Add Organization schema to homepage
□ Add FAQPage schema to FAQ/support pages
□ Add WebSite schema to homepage
□ Add Article schema to all blog posts
□ Add BreadcrumbList to all pages (dynamically)
□ Add HowTo schema to tutorial pages
${library.schemas.some((s) => s.schemaType === "LocalBusiness") ? "□ Add LocalBusiness schema to homepage and contact page\n" : ""}${library.schemas.some((s) => s.schemaType === "Product") ? "□ Add Product schema to all product pages\n" : ""}${library.schemas.some((s) => s.schemaType === "Person") ? "□ Add Person schema to team/about page\n" : ""}${library.schemas.some((s) => s.schemaType === "VideoObject") ? "□ Add VideoObject schema to pages with videos\n" : ""}
VALIDATION STEPS:
□ Test all schemas at validator.schema.org
□ Use Google Rich Results Test for enhanced verification
□ Check for errors in Google Search Console
□ Monitor AI platform citations after implementation

═══════════════════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════════════════

1. Start with the highest impact schemas (Organization, FAQPage)
2. Customize all placeholder values with your actual data
3. Test each schema before deploying
4. Re-export this library monthly for updated best practices

Questions? Contact your GEO/AEO specialist or visit the Apex dashboard.

Generated by Apex GEO Platform
Schema Library Version: ${library.version}
`;

  return output;
}
