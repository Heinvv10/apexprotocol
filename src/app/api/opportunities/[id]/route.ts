import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Speaking Opportunity Detail API Routes (Phase 9.3)
 *
 * GET /api/opportunities/[id] - Get a specific opportunity
 * PATCH /api/opportunities/[id] - Update an opportunity
 * DELETE /api/opportunities/[id] - Delete an opportunity
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { speakingOpportunities, opportunityMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Validation Schema
// ============================================================================

const opportunityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
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
  ]).optional(),
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

// ============================================================================
// GET /api/opportunities/[id]
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get opportunity with matches
    const opportunity = await db.query.speakingOpportunities.findFirst({
      where: eq(speakingOpportunities.id, id),
      with: {
        matches: {
          with: {
            person: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: opportunity });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/opportunities/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = opportunityUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if opportunity exists
    const existing = await db.query.speakingOpportunities.findFirst({
      where: eq(speakingOpportunities.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const data = validation.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Handle date conversions
    if (data.eventDate !== undefined) {
      updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    }
    if (data.eventEndDate !== undefined) {
      updateData.eventEndDate = data.eventEndDate ? new Date(data.eventEndDate) : null;
    }
    if (data.cfpDeadline !== undefined) {
      updateData.cfpDeadline = data.cfpDeadline ? new Date(data.cfpDeadline) : null;
    }

    // Copy other fields
    const dateFields = ["eventDate", "eventEndDate", "cfpDeadline"];
    for (const [key, value] of Object.entries(data)) {
      if (!dateFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }

    // Update opportunity
    const [opportunity] = await db
      .update(speakingOpportunities)
      .set(updateData)
      .where(eq(speakingOpportunities.id, id))
      .returning();

    return NextResponse.json({ data: opportunity });
  } catch (error) {
    console.error("Error updating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/opportunities/[id]
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if opportunity exists
    const existing = await db.query.speakingOpportunities.findFirst({
      where: eq(speakingOpportunities.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Delete opportunity (cascade will handle matches)
    await db
      .delete(speakingOpportunities)
      .where(eq(speakingOpportunities.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
