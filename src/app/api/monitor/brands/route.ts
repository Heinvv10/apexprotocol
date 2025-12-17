import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for brand creation/update
// BrandCompetitor schema matching database type
const brandCompetitorSchema = z.object({
  name: z.string(),
  url: z.string(),
  reason: z.string(),
});

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  domain: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  competitors: z.array(brandCompetitorSchema).optional().default([]),
  voice: z
    .object({
      tone: z.enum([
        "professional",
        "friendly",
        "authoritative",
        "casual",
        "formal",
      ]),
      personality: z.array(z.string()),
      targetAudience: z.string(),
      keyMessages: z.array(z.string()),
      avoidTopics: z.array(z.string()),
    })
    .optional(),
  visual: z
    .object({
      primaryColor: z.string().nullable(),
      secondaryColor: z.string().nullable(),
      fontFamily: z.string().nullable(),
    })
    .optional(),
  monitoringEnabled: z.boolean().optional().default(true),
  monitoringPlatforms: z
    .array(z.string())
    .optional()
    .default([
      "chatgpt",
      "claude",
      "gemini",
      "perplexity",
      "grok",
      "deepseek",
      "copilot",
    ]),
});

/**
 * GET /api/monitor/brands
 * Returns all brands for the current organization
 */
export async function GET(_request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const orgBrands = await db
      .select()
      .from(brands)
      .where(and(eq(brands.organizationId, orgId), eq(brands.isActive, true)));

    return NextResponse.json({
      success: true,
      data: orgBrands,
      meta: {
        total: orgBrands.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitor/brands
 * Creates a new brand for the current organization
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = brandSchema.parse(body);

    const newBrand = await db
      .insert(brands)
      .values({
        organizationId: orgId,
        name: validatedData.name,
        domain: validatedData.domain ?? null,
        description: validatedData.description ?? null,
        industry: validatedData.industry ?? null,
        logoUrl: validatedData.logoUrl ?? null,
        keywords: validatedData.keywords,
        competitors: validatedData.competitors as typeof brands.$inferInsert["competitors"],
        voice: (validatedData.voice ?? {
          tone: "professional",
          personality: [],
          targetAudience: "",
          keyMessages: [],
          avoidTopics: [],
        }) as typeof brands.$inferInsert["voice"],
        visual: (validatedData.visual ?? {
          primaryColor: null,
          secondaryColor: null,
          fontFamily: null,
        }) as typeof brands.$inferInsert["visual"],
        monitoringEnabled: validatedData.monitoringEnabled,
        monitoringPlatforms: validatedData.monitoringPlatforms,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newBrand[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
