/**
 * Content API Route
 * GET /api/content - List content
 * POST /api/content - Create content
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, and, desc, asc, like, sql, count } from "drizzle-orm";
import { z } from "zod";

// Content type and status enums (must match database schema)
const contentTypes = ["blog_post", "social_post", "product_description", "faq", "landing_page", "email", "ad_copy", "press_release"] as const;
const contentStatuses = ["draft", "review", "approved", "published", "archived"] as const;

// Query params schema
const querySchema = z.object({
  brandId: z.string().optional(),
  type: z.enum(contentTypes).optional(),
  status: z.enum(contentStatuses).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Create content schema
const createSchema = z.object({
  brandId: z.string(),
  title: z.string().min(1),
  type: z.enum(contentTypes),
  content: z.string().optional().default(""),
  status: z.enum(contentStatuses).default("draft"),
  excerpt: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  targetPlatform: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.string().optional(),
  aiGenerated: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = querySchema.parse(params);
    const { brandId, type, status, search, page, limit, sort, order } = query;

    // Build where conditions
    const conditions = [];
    if (brandId) {
      conditions.push(eq(content.brandId, brandId));
    }
    if (type) {
      conditions.push(eq(content.type, type));
    }
    if (status) {
      conditions.push(eq(content.status, status));
    }
    if (search) {
      conditions.push(like(content.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(content)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    // Get content with pagination
    const offset = (page - 1) * limit;
    const orderDir = order === "asc" ? asc : desc;

    const contentList = await db
      .select()
      .from(content)
      .where(whereClause)
      .orderBy(orderDir(content.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      content: contentList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Content API] GET Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const newContent = await db
      .insert(content)
      .values({
        brandId: data.brandId,
        title: data.title,
        type: data.type,
        content: data.content,
        status: data.status,
        excerpt: data.excerpt,
        keywords: data.keywords,
        targetPlatform: data.targetPlatform,
        aiMetadata: data.metadata || {},
      })
      .returning();

    return NextResponse.json(newContent[0], { status: 201 });
  } catch (error) {
    console.error("[Content API] POST Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
