import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// BrandCompetitor schema matching database type
const brandCompetitorSchema = z.object({
  name: z.string(),
  url: z.string(),
  reason: z.string(),
});

// Validation schema for brand update
const updateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  competitors: z.array(brandCompetitorSchema).optional(),
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
  monitoringEnabled: z.boolean().optional(),
  monitoringPlatforms: z.array(z.string()).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/monitor/brands/[id]
 * Returns a specific brand by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
      .where(
        and(
          eq(brands.id, id),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
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
 * PUT /api/monitor/brands/[id]
 * Updates a specific brand
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Verify brand exists and belongs to organization
    const existingBrand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, id),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (existingBrand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateBrandSchema.parse(body);

    const updatedBrand = await db
      .update(brands)
      .set({
        ...(validatedData as Partial<typeof brands.$inferInsert>),
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedBrand[0],
    });
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

/**
 * DELETE /api/monitor/brands/[id]
 * Soft deletes a brand (sets isActive to false)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Verify brand exists and belongs to organization
    const existingBrand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, id),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (existingBrand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(brands)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id));

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
