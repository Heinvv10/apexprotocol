import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Schema Code Snippet Generator API (F109)
 * POST /api/recommendations/schema - Generate schema.org JSON-LD snippets
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  generateSchema,
  generatePageSchemas,
  suggestSchemaTypes,
  combineSchemas,
  generateScriptTag,
  type SchemaType,
} from "@/lib/recommendations";

// Request schemas
const generateSchemaRequestSchema = z.object({
  type: z.enum([
    "Organization",
    "LocalBusiness",
    "FAQPage",
    "HowTo",
    "Product",
    "Article",
    "WebPage",
    "BreadcrumbList",
  ]),
  data: z.record(z.string(), z.unknown()),
});

const generatePageSchemasRequestSchema = z.object({
  organization: z.object({
    name: z.string(),
    url: z.string(),
    logo: z.string().optional(),
    description: z.string().optional(),
    sameAs: z.array(z.string()).optional(),
    contactPoint: z.object({
      type: z.string(),
      telephone: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),
  article: z.object({
    headline: z.string(),
    description: z.string(),
    author: z.union([
      z.string(),
      z.object({ name: z.string(), url: z.string().optional() }),
    ]),
    datePublished: z.string(),
    dateModified: z.string().optional(),
    image: z.string().optional(),
    publisher: z.object({
      name: z.string(),
      logo: z.string().optional(),
    }).optional(),
  }).optional(),
  faq: z.object({
    questions: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })),
  }).optional(),
  breadcrumbs: z.object({
    items: z.array(z.object({
      name: z.string(),
      url: z.string(),
    })),
  }).optional(),
  products: z.array(z.object({
    name: z.string(),
    description: z.string(),
    image: z.string().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    offers: z.object({
      price: z.number(),
      priceCurrency: z.string(),
      availability: z.enum(["InStock", "OutOfStock", "PreOrder"]).optional(),
      url: z.string().optional(),
    }).optional(),
    aggregateRating: z.object({
      ratingValue: z.number(),
      reviewCount: z.number(),
    }).optional(),
  })).optional(),
});

const suggestSchemaRequestSchema = z.object({
  hasQuestions: z.boolean().optional(),
  hasSteps: z.boolean().optional(),
  hasProducts: z.boolean().optional(),
  isArticle: z.boolean().optional(),
  isBusinessPage: z.boolean().optional(),
  hasBreadcrumbs: z.boolean().optional(),
  pageType: z.string().optional(),
});

/**
 * POST /api/recommendations/schema - Generate schema
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if it's a single schema generation or page schemas
    if (body.type && body.data) {
      // Single schema generation
      const { type, data } = generateSchemaRequestSchema.parse(body);
      const schema = generateSchema(type as SchemaType, data);

      return NextResponse.json({
        success: true,
        schema: {
          type: schema.type,
          jsonLd: schema.jsonLd,
          isValid: schema.isValid,
          warnings: schema.warnings,
          scriptTag: generateScriptTag(schema),
        },
      });
    } else if (body.suggest) {
      // Schema suggestion
      const contentInfo = suggestSchemaRequestSchema.parse(body.suggest);
      const suggestions = suggestSchemaTypes(contentInfo);

      return NextResponse.json({
        success: true,
        suggestedSchemas: suggestions,
        recommendation: suggestions.length > 0 ? suggestions[0] : null,
      });
    } else {
      // Page schemas generation
      const pageData = generatePageSchemasRequestSchema.parse(body);
      const schemas = generatePageSchemas(pageData);

      // Combine all schemas into a graph
      const combined = combineSchemas(schemas);

      return NextResponse.json({
        success: true,
        schemas: schemas.map((s) => ({
          type: s.type,
          jsonLd: s.jsonLd,
          isValid: s.isValid,
          warnings: s.warnings,
          scriptTag: generateScriptTag(s),
        })),
        combined: {
          jsonLd: combined.jsonLd,
          isValid: combined.isValid,
          warnings: combined.warnings,
          scriptTag: generateScriptTag(combined),
        },
        summary: {
          total: schemas.length,
          valid: schemas.filter((s) => s.isValid).length,
          invalid: schemas.filter((s) => !s.isValid).length,
          types: schemas.map((s) => s.type),
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Schema generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
