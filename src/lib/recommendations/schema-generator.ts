/**
 * Schema Code Snippet Generator (F109)
 * Auto-generate schema.org JSON-LD code snippets
 */

import { SchemaType, SchemaSnippet } from "./types";

// Schema templates
interface OrganizationData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    type: string;
    telephone?: string;
    email?: string;
  };
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
}

interface LocalBusinessData extends OrganizationData {
  priceRange?: string;
  openingHours?: string[];
  geo?: {
    latitude: number;
    longitude: number;
  };
}

interface FAQData {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

interface HowToData {
  name: string;
  description: string;
  totalTime?: string;
  estimatedCost?: {
    value: number;
    currency: string;
  };
  steps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
  tools?: string[];
  supplies?: string[];
}

interface ProductData {
  name: string;
  description: string;
  image?: string;
  brand?: string;
  sku?: string;
  offers?: {
    price: number;
    priceCurrency: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    url?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface ArticleData {
  headline: string;
  description: string;
  author: string | { name: string; url?: string };
  datePublished: string;
  dateModified?: string;
  image?: string;
  publisher?: {
    name: string;
    logo?: string;
  };
}

interface WebPageData {
  name: string;
  description: string;
  url: string;
  isPartOf?: {
    name: string;
    url: string;
  };
}

interface BreadcrumbData {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(data: OrganizationData): SchemaSnippet {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: data.url,
  };

  if (data.logo) schema.logo = data.logo;
  if (data.description) schema.description = data.description;
  if (data.sameAs && data.sameAs.length > 0) schema.sameAs = data.sameAs;

  if (data.contactPoint) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: data.contactPoint.type,
      ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
      ...(data.contactPoint.email && { email: data.contactPoint.email }),
    };
  }

  if (data.address) {
    schema.address = {
      "@type": "PostalAddress",
      ...(data.address.street && { streetAddress: data.address.street }),
      ...(data.address.city && { addressLocality: data.address.city }),
      ...(data.address.region && { addressRegion: data.address.region }),
      ...(data.address.postalCode && { postalCode: data.address.postalCode }),
      ...(data.address.country && { addressCountry: data.address.country }),
    };
  }

  return validateAndFormat("Organization", schema);
}

/**
 * Generate LocalBusiness schema
 */
export function generateLocalBusinessSchema(data: LocalBusinessData): SchemaSnippet {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    url: data.url,
  };

  if (data.logo) schema.logo = data.logo;
  if (data.description) schema.description = data.description;
  if (data.priceRange) schema.priceRange = data.priceRange;
  if (data.sameAs && data.sameAs.length > 0) schema.sameAs = data.sameAs;
  if (data.openingHours && data.openingHours.length > 0) {
    schema.openingHoursSpecification = data.openingHours;
  }

  if (data.address) {
    schema.address = {
      "@type": "PostalAddress",
      ...(data.address.street && { streetAddress: data.address.street }),
      ...(data.address.city && { addressLocality: data.address.city }),
      ...(data.address.region && { addressRegion: data.address.region }),
      ...(data.address.postalCode && { postalCode: data.address.postalCode }),
      ...(data.address.country && { addressCountry: data.address.country }),
    };
  }

  if (data.geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    };
  }

  if (data.contactPoint) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: data.contactPoint.type,
      ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
      ...(data.contactPoint.email && { email: data.contactPoint.email }),
    };
  }

  return validateAndFormat("LocalBusiness", schema);
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(data: FAQData): SchemaSnippet {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return validateAndFormat("FAQPage", schema);
}

/**
 * Generate HowTo schema
 */
export function generateHowToSchema(data: HowToData): SchemaSnippet {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    step: data.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  if (data.totalTime) schema.totalTime = data.totalTime;
  if (data.estimatedCost) {
    schema.estimatedCost = {
      "@type": "MonetaryAmount",
      value: data.estimatedCost.value,
      currency: data.estimatedCost.currency,
    };
  }
  if (data.tools && data.tools.length > 0) {
    schema.tool = data.tools.map((tool) => ({
      "@type": "HowToTool",
      name: tool,
    }));
  }
  if (data.supplies && data.supplies.length > 0) {
    schema.supply = data.supplies.map((supply) => ({
      "@type": "HowToSupply",
      name: supply,
    }));
  }

  return validateAndFormat("HowTo", schema);
}

/**
 * Generate Product schema
 */
export function generateProductSchema(data: ProductData): SchemaSnippet {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: data.description,
  };

  if (data.image) schema.image = data.image;
  if (data.sku) schema.sku = data.sku;
  if (data.brand) {
    schema.brand = {
      "@type": "Brand",
      name: data.brand,
    };
  }

  if (data.offers) {
    schema.offers = {
      "@type": "Offer",
      price: data.offers.price,
      priceCurrency: data.offers.priceCurrency,
      ...(data.offers.availability && {
        availability: `https://schema.org/${data.offers.availability}`,
      }),
      ...(data.offers.url && { url: data.offers.url }),
    };
  }

  if (data.aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: data.aggregateRating.ratingValue,
      reviewCount: data.aggregateRating.reviewCount,
    };
  }

  return validateAndFormat("Product", schema);
}

/**
 * Generate Article schema
 */
export function generateArticleSchema(data: ArticleData): SchemaSnippet {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    datePublished: data.datePublished,
    author:
      typeof data.author === "string"
        ? { "@type": "Person", name: data.author }
        : { "@type": "Person", name: data.author.name, url: data.author.url },
  };

  if (data.dateModified) schema.dateModified = data.dateModified;
  if (data.image) schema.image = data.image;

  if (data.publisher) {
    schema.publisher = {
      "@type": "Organization",
      name: data.publisher.name,
      ...(data.publisher.logo && {
        logo: {
          "@type": "ImageObject",
          url: data.publisher.logo,
        },
      }),
    };
  }

  return validateAndFormat("Article", schema);
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(data: WebPageData): SchemaSnippet {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.name,
    description: data.description,
    url: data.url,
  };

  if (data.isPartOf) {
    schema.isPartOf = {
      "@type": "WebSite",
      name: data.isPartOf.name,
      url: data.isPartOf.url,
    };
  }

  return validateAndFormat("WebPage", schema);
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(data: BreadcrumbData): SchemaSnippet {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: data.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return validateAndFormat("BreadcrumbList", schema);
}

/**
 * Generate schema based on type
 */
export function generateSchema(
  type: SchemaType,
  data: unknown
): SchemaSnippet {
  switch (type) {
    case "Organization":
      return generateOrganizationSchema(data as OrganizationData);
    case "LocalBusiness":
      return generateLocalBusinessSchema(data as LocalBusinessData);
    case "FAQPage":
      return generateFAQSchema(data as FAQData);
    case "HowTo":
      return generateHowToSchema(data as HowToData);
    case "Product":
      return generateProductSchema(data as ProductData);
    case "Article":
      return generateArticleSchema(data as ArticleData);
    case "WebPage":
      return generateWebPageSchema(data as WebPageData);
    case "BreadcrumbList":
      return generateBreadcrumbSchema(data as BreadcrumbData);
    default:
      return {
        type: type,
        jsonLd: "",
        isValid: false,
        warnings: [`Unknown schema type: ${type}`],
      };
  }
}

/**
 * Auto-detect and suggest schema types based on content
 */
export function suggestSchemaTypes(content: {
  hasQuestions?: boolean;
  hasSteps?: boolean;
  hasProducts?: boolean;
  isArticle?: boolean;
  isBusinessPage?: boolean;
  hasBreadcrumbs?: boolean;
  pageType?: string;
}): SchemaType[] {
  const suggestions: SchemaType[] = [];

  // Always suggest Organization for business sites
  suggestions.push("Organization");

  if (content.hasQuestions) {
    suggestions.push("FAQPage");
  }

  if (content.hasSteps) {
    suggestions.push("HowTo");
  }

  if (content.hasProducts) {
    suggestions.push("Product");
  }

  if (content.isArticle) {
    suggestions.push("Article");
  }

  if (content.isBusinessPage) {
    suggestions.push("LocalBusiness");
  }

  if (content.hasBreadcrumbs) {
    suggestions.push("BreadcrumbList");
  }

  // Always suggest WebPage
  if (!suggestions.includes("WebPage")) {
    suggestions.push("WebPage");
  }

  return suggestions;
}

/**
 * Generate multiple schemas for a page
 */
export function generatePageSchemas(
  pageData: {
    organization?: OrganizationData;
    article?: ArticleData;
    faq?: FAQData;
    breadcrumbs?: BreadcrumbData;
    products?: ProductData[];
  }
): SchemaSnippet[] {
  const schemas: SchemaSnippet[] = [];

  if (pageData.organization) {
    schemas.push(generateOrganizationSchema(pageData.organization));
  }

  if (pageData.article) {
    schemas.push(generateArticleSchema(pageData.article));
  }

  if (pageData.faq && pageData.faq.questions.length > 0) {
    schemas.push(generateFAQSchema(pageData.faq));
  }

  if (pageData.breadcrumbs && pageData.breadcrumbs.items.length > 0) {
    schemas.push(generateBreadcrumbSchema(pageData.breadcrumbs));
  }

  if (pageData.products) {
    for (const product of pageData.products) {
      schemas.push(generateProductSchema(product));
    }
  }

  return schemas;
}

/**
 * Generate HTML script tag with schema
 */
export function generateScriptTag(schema: SchemaSnippet): string {
  if (!schema.isValid) {
    return `<!-- Schema validation failed: ${schema.warnings.join(", ")} -->`;
  }

  return `<script type="application/ld+json">
${schema.jsonLd}
</script>`;
}

/**
 * Combine multiple schemas into a graph
 */
export function combineSchemas(schemas: SchemaSnippet[]): SchemaSnippet {
  const validSchemas = schemas.filter((s) => s.isValid);

  if (validSchemas.length === 0) {
    return {
      type: "Organization", // Default type
      jsonLd: "",
      isValid: false,
      warnings: ["No valid schemas to combine"],
    };
  }

  const parsedSchemas = validSchemas.map((s) => {
    try {
      return JSON.parse(s.jsonLd);
    } catch {
      return null;
    }
  }).filter(Boolean);

  const graph = {
    "@context": "https://schema.org",
    "@graph": parsedSchemas.map((s) => {
      const copy = { ...s };
      delete copy["@context"];
      return copy;
    }),
  };

  return {
    type: "Organization", // Primary type
    jsonLd: JSON.stringify(graph, null, 2),
    isValid: true,
    warnings: schemas.flatMap((s) => s.warnings),
  };
}

// Helper functions

function validateAndFormat(
  type: SchemaType,
  schema: Record<string, unknown>
): SchemaSnippet {
  const warnings: string[] = [];

  // Basic validation
  if (!schema["@context"]) {
    warnings.push("Missing @context property");
  }

  if (!schema["@type"]) {
    warnings.push("Missing @type property");
  }

  // Type-specific validation
  switch (type) {
    case "Organization":
      if (!schema.name) warnings.push("Organization: name is required");
      if (!schema.url) warnings.push("Organization: url is required");
      break;
    case "FAQPage":
      if (!schema.mainEntity || !Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
        warnings.push("FAQPage: at least one question is required");
      }
      break;
    case "Product":
      if (!schema.name) warnings.push("Product: name is required");
      break;
    case "Article":
      if (!schema.headline) warnings.push("Article: headline is required");
      if (!schema.author) warnings.push("Article: author is required");
      break;
    case "HowTo":
      if (!schema.name) warnings.push("HowTo: name is required");
      if (!schema.step || !Array.isArray(schema.step) || schema.step.length === 0) {
        warnings.push("HowTo: at least one step is required");
      }
      break;
  }

  const isValid = warnings.length === 0;

  return {
    type,
    jsonLd: JSON.stringify(schema, null, 2),
    isValid,
    warnings,
  };
}
