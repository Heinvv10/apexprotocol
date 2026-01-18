import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Individual Location API Route (Phase 9.2)
 *
 * GET /api/locations/[id] - Get location details with reviews
 * PUT /api/locations/[id] - Update location
 * DELETE /api/locations/[id] - Delete location
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  brandLocations,
  brandReviews,
  locationScores,
  brands,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Validation Schema
// ============================================================================

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationType: z
    .enum([
      "headquarters",
      "branch",
      "store",
      "office",
      "warehouse",
      "factory",
      "distribution_center",
    ])
    .optional(),
  isPrimary: z.boolean().optional(),
  phone: z.string().optional(),
  website: z.union([z.string().url(), z.literal("")]).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// GET /api/locations/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get location with brand info
    const location = await db.query.brandLocations.findFirst({
      where: eq(brandLocations.id, id),
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, location.brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get reviews for this location
    const reviews = await db
      .select()
      .from(brandReviews)
      .where(eq(brandReviews.locationId, id))
      .orderBy(desc(brandReviews.publishedAt))
      .limit(50);

    // Get latest score for this location
    const [latestScore] = await db
      .select()
      .from(locationScores)
      .where(eq(locationScores.locationId, id))
      .orderBy(desc(locationScores.calculatedAt))
      .limit(1);

    // Calculate review stats
    const reviewStats = {
      total: reviews.length,
      avgRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
      sentimentBreakdown: {
        positive: reviews.filter((r) => r.sentiment === "positive").length,
        neutral: reviews.filter((r) => r.sentiment === "neutral").length,
        negative: reviews.filter((r) => r.sentiment === "negative").length,
      },
    };

    return NextResponse.json({
      location: {
        id: location.id,
        brandId: location.brandId,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        postalCode: location.postalCode,
        latitude: location.latitude,
        longitude: location.longitude,
        locationType: location.locationType,
        isPrimary: location.isPrimary,
        phone: location.phone,
        website: location.website,
        email: location.email,
        rating: location.rating,
        reviewCount: location.reviewCount,
        categories: location.categories,
        openingHours: location.openingHours,
        photos: location.photos,
        priceLevel: location.priceLevel,
        isVerified: location.isVerified,
        isActive: location.isActive,
        placeId: location.placeId,
        metadata: location.metadata,
        lastSyncedAt: location.lastSyncedAt?.toISOString(),
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      },
      score: latestScore
        ? {
            overallScore: latestScore.overallScore,
            ratingScore: latestScore.ratingScore,
            reviewVolumeScore: latestScore.reviewVolumeScore,
            sentimentScore: latestScore.sentimentScore,
            responseScore: latestScore.responseScore,
            topPositiveKeywords: latestScore.topPositiveKeywords,
            topNegativeKeywords: latestScore.topNegativeKeywords,
            calculatedAt: latestScore.calculatedAt.toISOString(),
          }
        : null,
      reviews: reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        authorPhotoUrl: r.authorPhotoUrl,
        rating: r.rating,
        text: r.text,
        sentiment: r.sentiment,
        sentimentScore: r.sentimentScore,
        keywords: r.keywords,
        source: r.source,
        publishedAt: r.publishedAt?.toISOString(),
        ownerResponse: r.ownerResponse,
        ownerRespondedAt: r.ownerRespondedAt?.toISOString(),
      })),
      reviewStats,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/locations/[id]
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get location
    const location = await db.query.brandLocations.findFirst({
      where: eq(brandLocations.id, id),
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, location.brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateLocationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update location
    const [updated] = await db
      .update(brandLocations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(brandLocations.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/locations/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get location
    const location = await db.query.brandLocations.findFirst({
      where: eq(brandLocations.id, id),
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, location.brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete location (cascade will delete reviews and scores)
    await db.delete(brandLocations).where(eq(brandLocations.id, id));

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
