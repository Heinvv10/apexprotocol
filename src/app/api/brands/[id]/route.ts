import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for updating a brand
const updateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  seoKeywords: z.array(z.string()).optional(),
  geoKeywords: z.array(z.string()).optional(),
  competitors: z.any().optional(),
  valuePropositions: z.array(z.string()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional().nullable(),
  voice: z
    .object({
      tone: z.enum(["professional", "friendly", "authoritative", "casual", "formal"]).optional(),
      personality: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      keyMessages: z.array(z.string()).optional(),
      avoidTopics: z.array(z.string()).optional(),
    })
    .optional(),
  visual: z
    .object({
      primaryColor: z.string().optional().nullable(),
      secondaryColor: z.string().optional().nullable(),
      accentColor: z.string().optional().nullable(),
      colorPalette: z.array(z.string()).optional(),
      fontFamily: z.string().optional().nullable(),
    })
    .optional(),
  confidence: z.any().optional().nullable(),
  monitoringEnabled: z.boolean().optional(),
  monitoringPlatforms: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/brands/[id]
 * Returns a single brand by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const brand = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.organizationId, orgId)))
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: brand[0],
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
 * PUT /api/brands/[id]
 * Updates a brand by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const orgId = await getOrganizationId();


    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Check brand exists and belongs to this organization
    const existingBrand = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.organizationId, orgId)))
      .limit(1);

    if (existingBrand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateBrandSchema.parse(body);

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.domain !== undefined) {
      updateData.domain = validatedData.domain;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.tagline !== undefined) {
      updateData.tagline = validatedData.tagline;
    }
    if (validatedData.industry !== undefined) {
      updateData.industry = validatedData.industry;
    }
    if (validatedData.logoUrl !== undefined) {
      updateData.logoUrl = validatedData.logoUrl;
    }
    if (validatedData.keywords !== undefined) {
      updateData.keywords = validatedData.keywords;
    }
    if (validatedData.seoKeywords !== undefined) {
      updateData.seoKeywords = validatedData.seoKeywords;
    }
    if (validatedData.geoKeywords !== undefined) {
      updateData.geoKeywords = validatedData.geoKeywords;
    }
    if (validatedData.competitors !== undefined) {
      updateData.competitors = validatedData.competitors;
    }
    if (validatedData.valuePropositions !== undefined) {
      updateData.valuePropositions = validatedData.valuePropositions;
    }
    if (validatedData.socialLinks !== undefined) {
      updateData.socialLinks = validatedData.socialLinks;
    }
    if (validatedData.voice !== undefined) {
      updateData.voice = {
        ...(existingBrand[0].voice || {
          tone: "professional",
          personality: [],
          targetAudience: "",
          keyMessages: [],
          avoidTopics: [],
        }),
        ...validatedData.voice,
      };
    }
    if (validatedData.visual !== undefined) {
      updateData.visual = {
        ...(existingBrand[0].visual || {
          primaryColor: null,
          secondaryColor: null,
          accentColor: null,
          colorPalette: [],
          fontFamily: null,
        }),
        ...validatedData.visual,
      };
    }
    if (validatedData.confidence !== undefined) {
      updateData.confidence = validatedData.confidence;
    }
    if (validatedData.monitoringEnabled !== undefined) {
      updateData.monitoringEnabled = validatedData.monitoringEnabled;
    }
    if (validatedData.monitoringPlatforms !== undefined) {
      updateData.monitoringPlatforms = validatedData.monitoringPlatforms;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }


    const updatedBrand = await db
      .update(brands)
      .set(updateData)
      .where(and(eq(brands.id, id), eq(brands.organizationId, orgId)))
      .returning();


    return NextResponse.json({
      success: true,
      data: updatedBrand[0],
    });
  } catch (error) {
    console.error("[PUT /api/brands/[id]] Error:", error);
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

/**
 * DELETE /api/brands/[id]
 * Deletes a brand by ID
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Check brand exists and belongs to this organization
    const existingBrand = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.organizationId, orgId)))
      .limit(1);

    if (existingBrand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    // Delete the brand
    await db
      .delete(brands)
      .where(and(eq(brands.id, id), eq(brands.organizationId, orgId)));

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
