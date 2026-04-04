import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, brands } from "@/lib/db/schema";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Validation schema for content query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
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
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * GET /api/create/content
 * Returns content with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(and(eq(brands.organizationId, orgId), eq(brands.isActive, true)));

    const brandIds = orgBrands.map((b) => b.id);

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          limit: params.limit,
          offset: params.offset,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Build query conditions
    const conditions = [inArray(content.brandId, brandIds)];

    if (params.brandId) {
      conditions.push(eq(content.brandId, params.brandId));
    }

    if (params.type) {
      conditions.push(eq(content.type, params.type));
    }

    if (params.status) {
      conditions.push(eq(content.status, params.status));
    }

    if (params.startDate) {
      conditions.push(gte(content.createdAt, new Date(params.startDate)));
    }

    if (params.endDate) {
      conditions.push(lte(content.createdAt, new Date(params.endDate)));
    }

    // Execute query
    const contentList = await db
      .select()
      .from(content)
      .where(and(...conditions))
      .orderBy(desc(content.updatedAt))
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: content.id })
      .from(content)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: contentList,
      meta: {
        total: totalResult.length,
        limit: params.limit,
        offset: params.offset,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
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

// Validation schema for creating content
const createContentSchema = z.object({
  brandId: z.string(),
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    "blog_post",
    "social_post",
    "product_description",
    "faq",
    "landing_page",
    "email",
    "ad_copy",
    "press_release",
  ]),
  status: z
    .enum(["draft", "review", "approved", "published", "archived"])
    .optional()
    .default("draft"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
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

/**
 * POST /api/create/content
 * Creates new content
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
    const validatedData = createContentSchema.parse(body);

    // Verify brand belongs to organization
    const brand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, validatedData.brandId),
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

    const newContent = await db
      .insert(content)
      .values({
        organizationId: orgId,
        brandId: validatedData.brandId,
        title: validatedData.title,
        type: validatedData.type,
        status: validatedData.status,
        content: validatedData.content,
        excerpt: validatedData.excerpt ?? null,
        keywords: validatedData.keywords,
        targetPlatform: validatedData.targetPlatform ?? null,
        aiMetadata: validatedData.aiMetadata ?? {},
        publishedAt:
          validatedData.status === "published" ? new Date() : null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newContent[0],
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
