import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId, getUserId } from "@/lib/auth";
import { onMentionCreated } from "@/lib/notifications/triggers";

// Validation schema for mention query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  platform: z
    .enum([
      "chatgpt",
      "claude",
      "gemini",
      "perplexity",
      "grok",
      "deepseek",
      "copilot",
    ])
    .optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * GET /api/monitor/mentions
 * Returns brand mentions with filtering and pagination
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
    const conditions = [inArray(brandMentions.brandId, brandIds)];

    if (params.brandId) {
      conditions.push(eq(brandMentions.brandId, params.brandId));
    }

    if (params.platform) {
      conditions.push(eq(brandMentions.platform, params.platform));
    }

    if (params.sentiment) {
      conditions.push(eq(brandMentions.sentiment, params.sentiment));
    }

    if (params.startDate) {
      conditions.push(gte(brandMentions.timestamp, new Date(params.startDate)));
    }

    if (params.endDate) {
      conditions.push(lte(brandMentions.timestamp, new Date(params.endDate)));
    }

    // Execute query
    const mentions = await db
      .select()
      .from(brandMentions)
      .where(and(...conditions))
      .orderBy(desc(brandMentions.timestamp))
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: brandMentions.id })
      .from(brandMentions)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: mentions,
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

// Validation schema for creating a mention
const createMentionSchema = z.object({
  brandId: z.string(),
  platform: z.enum([
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
    "grok",
    "deepseek",
    "copilot",
  ]),
  query: z.string(),
  response: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  position: z.number().optional().nullable(),
  citationUrl: z.string().url().optional().nullable(),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        position: z.number(),
        sentiment: z.enum(["positive", "neutral", "negative"]),
      })
    )
    .optional(),
  promptCategory: z.string().optional().nullable(),
  topics: z.array(z.string()).optional(),
  metadata: z
    .object({
      modelVersion: z.string().optional(),
      responseLength: z.number().optional(),
      confidenceScore: z.number().optional(),
      rawResponse: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/monitor/mentions
 * Creates a new mention record (typically from monitoring job)
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    const userId = await getUserId();

    if (!orgId || !userId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createMentionSchema.parse(body);

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

    const newMention = await db
      .insert(brandMentions)
      .values({
        brandId: validatedData.brandId,
        platform: validatedData.platform,
        query: validatedData.query,
        response: validatedData.response,
        sentiment: validatedData.sentiment ?? "neutral",
        position: validatedData.position ?? null,
        citationUrl: validatedData.citationUrl ?? null,
        competitors: validatedData.competitors ?? [],
        promptCategory: validatedData.promptCategory ?? null,
        topics: validatedData.topics ?? [],
        metadata: validatedData.metadata ?? {},
      })
      .returning();

    // Trigger notification for new mention
    try {
      await onMentionCreated({
        mention: newMention[0],
        userId,
        organizationId: orgId,
      });
    } catch (notificationError) {
      // Log error but don't fail the request
      console.error(
        "[MentionsAPI] Failed to create notification:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newMention[0],
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
