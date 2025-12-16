/**
 * People API Routes (Phase 7.2)
 *
 * GET /api/people - List people for a brand
 * POST /api/people - Add a new person
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brandPeople, brands } from "@/lib/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

const querySchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  roleCategory: z.enum([
    "c_suite", "founder", "board", "key_employee", "ambassador", "advisor", "investor"
  ]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["name", "title", "displayOrder", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const createPersonSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  name: z.string().min(1, "name is required"),
  title: z.string().optional(),
  roleCategory: z.enum([
    "c_suite", "founder", "board", "key_employee", "ambassador", "advisor", "investor"
  ]).optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  shortBio: z.string().optional(),
  photoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().optional(),
  linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
  twitterUrl: z.union([z.string().url(), z.literal("")]).optional(),
  personalWebsite: z.union([z.string().url(), z.literal("")]).optional(),
  socialProfiles: z.record(z.string(), z.unknown()).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

// ============================================================================
// GET /api/people
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = querySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      brandId,
      roleCategory,
      isActive,
      sortBy = "displayOrder",
      sortOrder = "asc",
      limit = 50,
      offset = 0,
    } = validation.data;

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build conditions
    const conditions = [eq(brandPeople.brandId, brandId)];

    if (roleCategory) {
      conditions.push(eq(brandPeople.roleCategory, roleCategory));
    }

    if (isActive !== undefined) {
      conditions.push(eq(brandPeople.isActive, isActive === "true"));
    }

    // Get sort column
    const sortColumn = {
      name: brandPeople.name,
      title: brandPeople.title,
      displayOrder: brandPeople.displayOrder,
      createdAt: brandPeople.createdAt,
    }[sortBy];

    // Query people
    const people = await db
      .select()
      .from(brandPeople)
      .where(and(...conditions))
      .orderBy(sortOrder === "asc" ? asc(sortColumn!) : desc(sortColumn!))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(brandPeople)
      .where(and(...conditions));

    return NextResponse.json({
      data: people,
      meta: {
        total: Number(countResult?.count || 0),
        limit,
        offset,
        hasMore: offset + people.length < Number(countResult?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/people
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPersonSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, data.brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get next display order if not specified
    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const [maxOrder] = await db
        .select({ max: sql<number>`COALESCE(MAX(display_order), -1)` })
        .from(brandPeople)
        .where(eq(brandPeople.brandId, data.brandId));
      displayOrder = (maxOrder?.max || 0) + 1;
    }

    // Create person
    const [person] = await db
      .insert(brandPeople)
      .values({
        brandId: data.brandId,
        name: data.name,
        title: data.title || null,
        roleCategory: data.roleCategory || null,
        department: data.department || null,
        bio: data.bio || null,
        shortBio: data.shortBio || null,
        photoUrl: data.photoUrl || null,
        email: data.email || null,
        phone: data.phone || null,
        linkedinUrl: data.linkedinUrl || null,
        twitterUrl: data.twitterUrl || null,
        personalWebsite: data.personalWebsite || null,
        socialProfiles: data.socialProfiles || {},
        isVerified: data.isVerified ?? false,
        isActive: data.isActive ?? true,
        isPrimary: data.isPrimary ?? false,
        displayOrder,
        discoveredFrom: "manual",
      })
      .returning();

    return NextResponse.json({ data: person }, { status: 201 });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}
