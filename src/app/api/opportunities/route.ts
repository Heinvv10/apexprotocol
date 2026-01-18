import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Speaking Opportunities API Routes (Phase 9.3)
 *
 * GET /api/opportunities - List speaking opportunities
 * POST /api/opportunities - Create a new opportunity
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { speakingOpportunities, opportunityMatches, brandPeople } from "@/lib/db/schema";
import { eq, and, gte, lte, like, desc, asc, or, isNull, sql } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

const opportunityCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  organizer: z.string().optional().nullable(),
  organizerUrl: z.string().url().optional().nullable(),
  eventType: z.enum([
    "conference",
    "webinar",
    "podcast",
    "panel",
    "workshop",
    "meetup",
    "summit",
  ]),
  eventDate: z.string().datetime().optional().nullable(),
  eventEndDate: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
  isVirtual: z.boolean().optional(),
  venue: z.string().optional().nullable(),
  cfpUrl: z.string().url().optional().nullable(),
  cfpDeadline: z.string().datetime().optional().nullable(),
  applicationUrl: z.string().url().optional().nullable(),
  topics: z.array(z.string()).optional(),
  targetAudience: z.string().optional().nullable(),
  expectedAudienceSize: z.number().optional().nullable(),
  isPaid: z.boolean().optional(),
  compensationDetails: z.string().optional().nullable(),
  coversTravelExpenses: z.boolean().optional(),
  requirements: z.string().optional().nullable(),
  speakerBenefits: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional().nullable(),
  sourceType: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const listQuerySchema = z.object({
  eventType: z.enum([
    "conference",
    "webinar",
    "podcast",
    "panel",
    "workshop",
    "meetup",
    "summit",
  ]).optional(),
  isVirtual: z.enum(["true", "false"]).optional(),
  isPaid: z.enum(["true", "false"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
  topic: z.string().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  cfpOpen: z.enum(["true", "false"]).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  sortBy: z.enum(["eventDate", "cfpDeadline", "createdAt", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ============================================================================
// GET /api/opportunities
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const validation = listQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      eventType,
      isVirtual,
      isPaid,
      isActive,
      isFeatured,
      topic,
      search,
      fromDate,
      toDate,
      cfpOpen,
      limit = "50",
      offset = "0",
      sortBy = "eventDate",
      sortOrder = "asc",
    } = validation.data;

    // Build conditions
    const conditions = [];

    if (eventType) {
      conditions.push(eq(speakingOpportunities.eventType, eventType));
    }

    if (isVirtual !== undefined) {
      conditions.push(eq(speakingOpportunities.isVirtual, isVirtual === "true"));
    }

    if (isPaid !== undefined) {
      conditions.push(eq(speakingOpportunities.isPaid, isPaid === "true"));
    }

    if (isActive !== undefined) {
      conditions.push(eq(speakingOpportunities.isActive, isActive === "true"));
    } else {
      // Default to active only
      conditions.push(eq(speakingOpportunities.isActive, true));
    }

    if (isFeatured !== undefined) {
      conditions.push(eq(speakingOpportunities.isFeatured, isFeatured === "true"));
    }

    if (fromDate) {
      conditions.push(gte(speakingOpportunities.eventDate, new Date(fromDate)));
    }

    if (toDate) {
      conditions.push(lte(speakingOpportunities.eventDate, new Date(toDate)));
    }

    if (cfpOpen === "true") {
      // CFP deadline is in the future or not set
      conditions.push(
        or(
          gte(speakingOpportunities.cfpDeadline, new Date()),
          isNull(speakingOpportunities.cfpDeadline)
        )
      );
    }

    if (search) {
      conditions.push(
        or(
          like(speakingOpportunities.name, `%${search}%`),
          like(speakingOpportunities.description, `%${search}%`),
          like(speakingOpportunities.organizer, `%${search}%`)
        )
      );
    }

    // Build sort order
    const sortColumn = {
      eventDate: speakingOpportunities.eventDate,
      cfpDeadline: speakingOpportunities.cfpDeadline,
      createdAt: speakingOpportunities.createdAt,
      name: speakingOpportunities.name,
    }[sortBy];

    const orderFn = sortOrder === "desc" ? desc : asc;

    // Execute query
    const opportunities = await db
      .select()
      .from(speakingOpportunities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortColumn))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Filter by topic if provided (JSONB array contains)
    let filteredOpportunities = opportunities;
    if (topic) {
      filteredOpportunities = opportunities.filter((opp) =>
        opp.topics?.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(speakingOpportunities)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      data: filteredOpportunities,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + filteredOpportunities.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/opportunities
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = opportunityCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create opportunity
    const [opportunity] = await db
      .insert(speakingOpportunities)
      .values({
        name: data.name,
        description: data.description || null,
        organizer: data.organizer || null,
        organizerUrl: data.organizerUrl || null,
        eventType: data.eventType,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : null,
        location: data.location || null,
        isVirtual: data.isVirtual || false,
        venue: data.venue || null,
        cfpUrl: data.cfpUrl || null,
        cfpDeadline: data.cfpDeadline ? new Date(data.cfpDeadline) : null,
        applicationUrl: data.applicationUrl || null,
        topics: data.topics || [],
        targetAudience: data.targetAudience || null,
        expectedAudienceSize: data.expectedAudienceSize || null,
        isPaid: data.isPaid || false,
        compensationDetails: data.compensationDetails || null,
        coversTravelExpenses: data.coversTravelExpenses || false,
        requirements: data.requirements || null,
        speakerBenefits: data.speakerBenefits || [],
        sourceUrl: data.sourceUrl || null,
        sourceType: data.sourceType || null,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured || false,
      })
      .returning();

    return NextResponse.json({ data: opportunity }, { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
