import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * People Detail API Routes (Phase 7.2)
 *
 * GET /api/people/[id] - Get a specific person
 * PATCH /api/people/[id] - Update a person
 * DELETE /api/people/[id] - Delete a person
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brandPeople, brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

const updatePersonSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional().nullable(),
  roleCategory: z.enum([
    "c_suite", "founder", "board", "key_employee", "ambassador", "advisor", "investor"
  ]).optional().nullable(),
  department: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  shortBio: z.string().optional().nullable(),
  photoUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  twitterUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  personalWebsite: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  socialProfiles: z.record(z.string(), z.unknown()).optional(),
  linkedinFollowers: z.number().optional().nullable(),
  twitterFollowers: z.number().optional().nullable(),
  totalSocialFollowers: z.number().optional().nullable(),
  thoughtLeadershipActivities: z.array(z.any()).optional(),
  thoughtLeadershipScore: z.number().optional(),
  aiMentionCount: z.number().optional(),
  aiVisibilityScore: z.number().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

// ============================================================================
// GET /api/people/[id]
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get person with brand
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify authorization
    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return person without nested brand
    const { brand: _brand, ...personData } = person;
    return NextResponse.json({ data: personData });
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { error: "Failed to fetch person" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/people/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = updatePersonSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get existing person to verify authorization
    const existingPerson = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!existingPerson) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (orgId && existingPerson.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Clean up empty strings to nulls
    const data = validation.data;
    const cleanData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === "") {
        cleanData[key] = null;
      } else if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    // Always update the timestamp
    cleanData.updatedAt = new Date();

    // Update person
    const [updatedPerson] = await db
      .update(brandPeople)
      .set(cleanData)
      .where(eq(brandPeople.id, id))
      .returning();

    return NextResponse.json({ data: updatedPerson });
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { error: "Failed to update person" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/people/[id]
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing person to verify authorization
    const existingPerson = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!existingPerson) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (orgId && existingPerson.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete person (cascade will handle related records)
    await db.delete(brandPeople).where(eq(brandPeople.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { error: "Failed to delete person" },
      { status: 500 }
    );
  }
}
