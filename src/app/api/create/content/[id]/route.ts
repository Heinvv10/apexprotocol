import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for content update
const updateContentSchema = z.object({
  title: z.string().min(1).optional(),
  type: z
    .enum([
      "blog_post",
      "social_post",
      "product_description",
      "faq",
      "landing_page",
      "email",
      "ad_copy",
      "press_release",
    ])
    .optional(),
  status: z
    .enum(["draft", "review", "approved", "published", "archived"])
    .optional(),
  content: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  aiScore: z.number().min(0).max(100).optional().nullable(),
  readabilityScore: z.number().min(0).max(100).optional().nullable(),
  seoScore: z.number().min(0).max(100).optional().nullable(),
  targetPlatform: z.string().optional().nullable(),
  aiMetadata: z
    .object({
      model: z.string().optional(),
      prompt: z.string().optional(),
      temperature: z.number().optional(),
      tokensUsed: z.number().optional(),
      generationTime: z.number().optional(),
    })
    .optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/create/content/[id]
 * Returns a specific content item by ID
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

    // Get content with brand check
    const contentItem = await db
      .select()
      .from(content)
      .where(eq(content.id, id))
      .limit(1);

    if (contentItem.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Verify brand belongs to organization
    const brand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, contentItem[0].brandId),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contentItem[0],
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
 * PUT /api/create/content/[id]
 * Updates a specific content item
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

    // Get existing content
    const existingContent = await db
      .select()
      .from(content)
      .where(eq(content.id, id))
      .limit(1);

    if (existingContent.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Verify brand belongs to organization
    const brand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, existingContent[0].brandId),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateContentSchema.parse(body);

    // Check if status is changing to published
    const publishedAt =
      validatedData.status === "published" &&
      existingContent[0].status !== "published"
        ? new Date()
        : existingContent[0].publishedAt;

    // Increment version if content body is changing
    const version =
      validatedData.content &&
      validatedData.content !== existingContent[0].content
        ? existingContent[0].version + 1
        : existingContent[0].version;

    const updatedContent = await db
      .update(content)
      .set({
        ...validatedData,
        version,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(content.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedContent[0],
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
 * DELETE /api/create/content/[id]
 * Deletes a content item (or archives it)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Get existing content
    const existingContent = await db
      .select()
      .from(content)
      .where(eq(content.id, id))
      .limit(1);

    if (existingContent.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Verify brand belongs to organization
    const brand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, existingContent[0].brandId),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Check query param for hard delete vs archive
    const hardDelete = request.nextUrl.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Hard delete
      await db.delete(content).where(eq(content.id, id));
    } else {
      // Soft delete (archive)
      await db
        .update(content)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(content.id, id));
    }

    return NextResponse.json({
      success: true,
      message: hardDelete
        ? "Content deleted permanently"
        : "Content archived successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
