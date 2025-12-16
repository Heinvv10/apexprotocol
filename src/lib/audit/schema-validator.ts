/**
 * Schema Markup Validator (Phase 3)
 * Validates JSON-LD schema markup against Google's requirements
 * Detects: Organization, FAQ, HowTo, Product, Article, LocalBusiness, Event, Recipe
 */

import type { SchemaMarkup } from "./types";

// =============================================================================
// Types
// =============================================================================

export interface SchemaValidationResult {
  type: string;
  isValid: boolean;
  score: number; // 0-100
  requiredFields: FieldValidation[];
  recommendedFields: FieldValidation[];
  warnings: string[];
  errors: string[];
  googleRichResultsEligible: boolean;
  aiRelevance: "critical" | "high" | "medium" | "low";
}

export interface FieldValidation {
  field: string;
  present: boolean;
  valid: boolean;
  value?: unknown;
  message?: string;
}

export interface SchemaAnalysisReport {
  totalSchemas: number;
  validSchemas: number;
  invalidSchemas: number;
  overallScore: number;
  schemaTypes: string[];
  results: SchemaValidationResult[];
  missingRecommendedSchemas: string[];
  recommendations: string[];
}

// =============================================================================
// Schema Type Definitions
// =============================================================================

interface SchemaDefinition {
  requiredFields: string[];
  recommendedFields: string[];
  googleDocsUrl: string;
  aiRelevance: "critical" | "high" | "medium" | "low";
  description: string;
}

const SCHEMA_DEFINITIONS: Record<string, SchemaDefinition> = {
  Organization: {
    requiredFields: ["@type", "name"],
    recommendedFields: ["url", "logo", "description", "sameAs", "contactPoint", "address"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/organization",
    aiRelevance: "high",
    description: "Identifies your organization to AI systems",
  },
  LocalBusiness: {
    requiredFields: ["@type", "name", "address"],
    recommendedFields: ["url", "telephone", "openingHours", "geo", "priceRange", "image"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    aiRelevance: "high",
    description: "Essential for local AI search results",
  },
  FAQPage: {
    requiredFields: ["@type", "mainEntity"],
    recommendedFields: [],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
    aiRelevance: "critical",
    description: "Highly valuable for AI-generated answers",
  },
  Question: {
    requiredFields: ["@type", "name", "acceptedAnswer"],
    recommendedFields: [],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
    aiRelevance: "critical",
    description: "Individual Q&A for AI extraction",
  },
  HowTo: {
    requiredFields: ["@type", "name", "step"],
    recommendedFields: ["description", "image", "totalTime", "estimatedCost", "supply", "tool"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/how-to",
    aiRelevance: "critical",
    description: "Step-by-step instructions for AI assistants",
  },
  Article: {
    requiredFields: ["@type", "headline", "author", "datePublished"],
    recommendedFields: ["image", "dateModified", "publisher", "description", "mainEntityOfPage"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/article",
    aiRelevance: "high",
    description: "News and blog content for AI indexing",
  },
  NewsArticle: {
    requiredFields: ["@type", "headline", "author", "datePublished"],
    recommendedFields: ["image", "dateModified", "publisher", "description", "articleBody"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/article",
    aiRelevance: "high",
    description: "Breaking news for AI news aggregation",
  },
  Product: {
    requiredFields: ["@type", "name"],
    recommendedFields: ["image", "description", "brand", "offers", "review", "aggregateRating", "sku"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/product",
    aiRelevance: "high",
    description: "Product information for AI shopping assistants",
  },
  Review: {
    requiredFields: ["@type", "itemReviewed", "reviewRating", "author"],
    recommendedFields: ["reviewBody", "datePublished", "publisher"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet",
    aiRelevance: "medium",
    description: "Review data for AI recommendations",
  },
  Event: {
    requiredFields: ["@type", "name", "startDate", "location"],
    recommendedFields: ["endDate", "description", "image", "offers", "performer", "organizer"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/event",
    aiRelevance: "medium",
    description: "Event information for AI calendars",
  },
  Recipe: {
    requiredFields: ["@type", "name", "recipeIngredient", "recipeInstructions"],
    recommendedFields: ["image", "author", "prepTime", "cookTime", "totalTime", "recipeYield", "nutrition"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/recipe",
    aiRelevance: "high",
    description: "Recipe data for cooking AI assistants",
  },
  WebPage: {
    requiredFields: ["@type"],
    recommendedFields: ["name", "description", "url", "breadcrumb", "mainEntity"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/webpage",
    aiRelevance: "medium",
    description: "Basic page information for AI context",
  },
  WebSite: {
    requiredFields: ["@type", "name", "url"],
    recommendedFields: ["potentialAction", "description"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox",
    aiRelevance: "medium",
    description: "Site-level info for AI search integration",
  },
  BreadcrumbList: {
    requiredFields: ["@type", "itemListElement"],
    recommendedFields: [],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb",
    aiRelevance: "low",
    description: "Navigation context for AI understanding",
  },
  VideoObject: {
    requiredFields: ["@type", "name", "thumbnailUrl", "uploadDate"],
    recommendedFields: ["description", "duration", "contentUrl", "embedUrl", "interactionStatistic"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/video",
    aiRelevance: "medium",
    description: "Video metadata for AI video search",
  },
  SoftwareApplication: {
    requiredFields: ["@type", "name"],
    recommendedFields: ["applicationCategory", "operatingSystem", "offers", "aggregateRating", "screenshot"],
    googleDocsUrl: "https://developers.google.com/search/docs/appearance/structured-data/software-app",
    aiRelevance: "medium",
    description: "App info for AI app recommendations",
  },
};

// AI-critical schema types that should be prioritized
const AI_CRITICAL_SCHEMAS = ["FAQPage", "Question", "HowTo", "Article", "Product"];

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate a single schema against Google requirements
 */
export function validateSchema(schema: SchemaMarkup): SchemaValidationResult {
  const schemaType = normalizeSchemaType(schema.type);
  const definition = SCHEMA_DEFINITIONS[schemaType];

  if (!definition) {
    return {
      type: schemaType,
      isValid: false,
      score: 30, // Partial score for having schema
      requiredFields: [],
      recommendedFields: [],
      warnings: [`Unknown schema type: ${schemaType}`],
      errors: [],
      googleRichResultsEligible: false,
      aiRelevance: "low",
    };
  }

  const requiredFields = validateRequiredFields(schema.properties, definition.requiredFields);
  const recommendedFields = validateRecommendedFields(schema.properties, definition.recommendedFields);

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  const missingRequired = requiredFields.filter((f) => !f.present);
  if (missingRequired.length > 0) {
    errors.push(`Missing required fields: ${missingRequired.map((f) => f.field).join(", ")}`);
  }

  // Check invalid required fields
  const invalidRequired = requiredFields.filter((f) => f.present && !f.valid);
  if (invalidRequired.length > 0) {
    errors.push(`Invalid required fields: ${invalidRequired.map((f) => f.field).join(", ")}`);
  }

  // Check recommended fields
  const missingRecommended = recommendedFields.filter((f) => !f.present);
  if (missingRecommended.length > 0) {
    warnings.push(`Consider adding: ${missingRecommended.map((f) => f.field).join(", ")}`);
  }

  // Calculate score
  const requiredScore = requiredFields.length > 0
    ? (requiredFields.filter((f) => f.present && f.valid).length / requiredFields.length) * 60
    : 60;
  const recommendedScore = recommendedFields.length > 0
    ? (recommendedFields.filter((f) => f.present).length / recommendedFields.length) * 40
    : 40;
  const score = Math.round(requiredScore + recommendedScore);

  // Determine if eligible for rich results
  const isValid = missingRequired.length === 0 && invalidRequired.length === 0;
  const googleRichResultsEligible = isValid && score >= 60;

  return {
    type: schemaType,
    isValid,
    score,
    requiredFields,
    recommendedFields,
    warnings,
    errors,
    googleRichResultsEligible,
    aiRelevance: definition.aiRelevance,
  };
}

/**
 * Validate required fields
 */
function validateRequiredFields(
  properties: Record<string, unknown>,
  required: string[]
): FieldValidation[] {
  return required.map((field) => {
    const value = getNestedProperty(properties, field);
    const present = value !== undefined && value !== null && value !== "";
    const valid = present && isValidFieldValue(field, value);

    return {
      field,
      present,
      valid,
      value: present ? value : undefined,
      message: !present
        ? `Required field "${field}" is missing`
        : !valid
        ? `Field "${field}" has invalid value`
        : undefined,
    };
  });
}

/**
 * Validate recommended fields
 */
function validateRecommendedFields(
  properties: Record<string, unknown>,
  recommended: string[]
): FieldValidation[] {
  return recommended.map((field) => {
    const value = getNestedProperty(properties, field);
    const present = value !== undefined && value !== null && value !== "";

    return {
      field,
      present,
      valid: present,
      value: present ? value : undefined,
      message: !present ? `Recommended field "${field}" is missing` : undefined,
    };
  });
}

/**
 * Analyze all schemas on a page
 */
export function analyzeSchemas(schemas: SchemaMarkup[]): SchemaAnalysisReport {
  if (schemas.length === 0) {
    return {
      totalSchemas: 0,
      validSchemas: 0,
      invalidSchemas: 0,
      overallScore: 0,
      schemaTypes: [],
      results: [],
      missingRecommendedSchemas: AI_CRITICAL_SCHEMAS,
      recommendations: [
        "No schema markup detected. Add structured data to improve AI visibility.",
        "Start with Organization schema to establish brand identity.",
        "Add FAQPage schema for common questions - highly valuable for AI.",
        "Consider HowTo schema for instructional content.",
      ],
    };
  }

  const results = schemas.map(validateSchema);
  const validSchemas = results.filter((r) => r.isValid).length;
  const invalidSchemas = results.filter((r) => !r.isValid).length;
  const schemaTypes = results.map((r) => r.type);

  // Calculate overall score
  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );

  // Determine missing recommended schemas
  const presentTypes = new Set(schemaTypes.map((t) => t.toLowerCase()));
  const missingRecommendedSchemas = AI_CRITICAL_SCHEMAS.filter(
    (s) => !presentTypes.has(s.toLowerCase())
  );

  // Generate recommendations
  const recommendations = generateSchemaRecommendations(results, missingRecommendedSchemas);

  return {
    totalSchemas: schemas.length,
    validSchemas,
    invalidSchemas,
    overallScore,
    schemaTypes,
    results,
    missingRecommendedSchemas,
    recommendations,
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateSchemaRecommendations(
  results: SchemaValidationResult[],
  missing: string[]
): string[] {
  const recommendations: string[] = [];

  // Recommendations for invalid schemas
  const invalidSchemas = results.filter((r) => !r.isValid);
  invalidSchemas.forEach((schema) => {
    recommendations.push(
      `Fix ${schema.type} schema: ${schema.errors.join("; ")}`
    );
  });

  // Recommendations for missing AI-critical schemas
  if (missing.includes("FAQPage")) {
    recommendations.push(
      "Add FAQPage schema - AI assistants prioritize FAQ content for direct answers"
    );
  }
  if (missing.includes("HowTo")) {
    recommendations.push(
      "Add HowTo schema for instructional content - enables step-by-step AI responses"
    );
  }
  if (missing.includes("Article") && missing.includes("NewsArticle")) {
    recommendations.push(
      "Add Article schema for blog/news content - improves AI content indexing"
    );
  }
  if (missing.includes("Product")) {
    recommendations.push(
      "Add Product schema for product pages - enables AI shopping assistant visibility"
    );
  }

  // Recommendations for improving existing schemas
  results.forEach((schema) => {
    if (schema.isValid && schema.score < 80) {
      const missingRecommended = schema.recommendedFields.filter((f) => !f.present);
      if (missingRecommended.length > 0) {
        recommendations.push(
          `Enhance ${schema.type} by adding: ${missingRecommended.slice(0, 3).map((f) => f.field).join(", ")}`
        );
      }
    }
  });

  return recommendations.slice(0, 10); // Limit to top 10
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize schema type (handle variations)
 */
function normalizeSchemaType(type: string): string {
  // Remove schema.org prefix if present
  const normalized = type
    .replace("http://schema.org/", "")
    .replace("https://schema.org/", "");

  // Handle common variations
  const typeMap: Record<string, string> = {
    faq: "FAQPage",
    faqpage: "FAQPage",
    howto: "HowTo",
    "how-to": "HowTo",
    localbusiness: "LocalBusiness",
    "local-business": "LocalBusiness",
    newsarticle: "NewsArticle",
    webpage: "WebPage",
    website: "WebSite",
    breadcrumblist: "BreadcrumbList",
    videoobject: "VideoObject",
    softwareapplication: "SoftwareApplication",
  };

  return typeMap[normalized.toLowerCase()] || normalized;
}

/**
 * Get nested property from object
 */
function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Validate field value based on field type
 */
function isValidFieldValue(field: string, value: unknown): boolean {
  // Check for empty values
  if (value === null || value === undefined || value === "") return false;

  // Field-specific validation
  switch (field.toLowerCase()) {
    case "name":
    case "headline":
    case "description":
      return typeof value === "string" && value.length > 0;

    case "url":
    case "logo":
    case "image":
    case "thumbnailurl":
      if (typeof value === "string") {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }
      if (typeof value === "object" && value !== null) {
        const imgObj = value as Record<string, unknown>;
        return typeof imgObj.url === "string" || typeof imgObj["@id"] === "string";
      }
      return false;

    case "datepublished":
    case "datemodified":
    case "startdate":
    case "enddate":
    case "uploaddate":
      if (typeof value === "string") {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;

    case "author":
    case "publisher":
      if (typeof value === "string") return value.length > 0;
      if (typeof value === "object" && value !== null) {
        const author = value as Record<string, unknown>;
        return typeof author.name === "string" || typeof author["@type"] === "string";
      }
      return false;

    case "mainentity":
    case "step":
    case "itemlistelement":
    case "recipeingredient":
    case "recipeinstructions":
      return Array.isArray(value) ? value.length > 0 : value !== undefined;

    case "address":
    case "location":
      if (typeof value === "string") return value.length > 0;
      if (typeof value === "object" && value !== null) {
        return true; // Accept any object as address/location
      }
      return false;

    default:
      return value !== undefined && value !== null && value !== "";
  }
}

/**
 * Get schema definition for a type
 */
export function getSchemaDefinition(type: string): SchemaDefinition | undefined {
  const normalized = normalizeSchemaType(type);
  return SCHEMA_DEFINITIONS[normalized];
}

/**
 * Get all supported schema types
 */
export function getSupportedSchemaTypes(): string[] {
  return Object.keys(SCHEMA_DEFINITIONS);
}

/**
 * Check if a schema type is AI-critical
 */
export function isAICriticalSchema(type: string): boolean {
  const normalized = normalizeSchemaType(type);
  return AI_CRITICAL_SCHEMAS.includes(normalized);
}
