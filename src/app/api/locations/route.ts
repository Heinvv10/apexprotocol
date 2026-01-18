import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Locations API Routes (Phase 9.2)
 *
 * GET /api/locations - List locations for a brand
 * GET /api/locations?type=summary - Get locations summary with scores
 * GET /api/locations?type=reviews - Get recent reviews
 * POST /api/locations - Add a new location manually
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
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

// ============================================================================
// Validation Schemas
// ============================================================================

const querySchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  type: z.enum(["summary", "list", "reviews"]).optional(),
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
  isActive: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const createLocationSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  name: z.string().min(1, "name is required"),
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
});

// ============================================================================
// GET /api/locations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
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
      type,
      locationType,
      isActive,
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

    // Handle different query types
    if (type === "summary") {
      return await getLocationsSummary(brandId);
    }

    if (type === "reviews") {
      return await getRecentReviews(brandId, limit);
    }

    // Default: return paginated list of locations
    const conditions = [eq(brandLocations.brandId, brandId)];

    if (locationType) {
      conditions.push(eq(brandLocations.locationType, locationType));
    }

    if (isActive !== undefined) {
      conditions.push(eq(brandLocations.isActive, isActive === "true"));
    }

    const locations = await db
      .select()
      .from(brandLocations)
      .where(and(...conditions))
      .orderBy(desc(brandLocations.isPrimary), desc(brandLocations.rating))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(brandLocations)
      .where(and(...conditions));

    return NextResponse.json({
      data: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        postalCode: loc.postalCode,
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationType: loc.locationType,
        isPrimary: loc.isPrimary,
        phone: loc.phone,
        website: loc.website,
        email: loc.email,
        rating: loc.rating,
        reviewCount: loc.reviewCount,
        categories: loc.categories,
        priceLevel: loc.priceLevel,
        isVerified: loc.isVerified,
        isActive: loc.isActive,
        placeId: loc.placeId,
        lastSyncedAt: loc.lastSyncedAt?.toISOString(),
        createdAt: loc.createdAt.toISOString(),
      })),
      meta: {
        total: Number(countResult?.count || 0),
        limit,
        offset,
        hasMore: offset + locations.length < Number(countResult?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Summary Handler
// ============================================================================

async function getLocationsSummary(brandId: string) {
  // Get all locations for the brand
  const locations = await db
    .select()
    .from(brandLocations)
    .where(
      and(eq(brandLocations.brandId, brandId), eq(brandLocations.isActive, true))
    );

  // Get latest scores
  const scores = await db
    .select()
    .from(locationScores)
    .where(eq(locationScores.brandId, brandId))
    .orderBy(desc(locationScores.calculatedAt))
    .limit(locations.length);

  // Calculate aggregates
  const totalLocations = locations.length;
  const totalReviews = locations.reduce(
    (sum, l) => sum + (l.reviewCount || 0),
    0
  );
  const avgRating =
    totalLocations > 0
      ? locations.reduce((sum, l) => sum + (l.rating || 0), 0) / totalLocations
      : 0;

  const verifiedCount = locations.filter((l) => l.isVerified).length;
  const googleSyncedCount = locations.filter((l) => l.placeId).length;

  // Type breakdown
  const typeBreakdown = locations.reduce(
    (acc, l) => {
      const type = l.locationType || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Review sentiment from scores
  let positiveReviews = 0;
  let neutralReviews = 0;
  let negativeReviews = 0;

  for (const score of scores) {
    positiveReviews += score.positiveReviews || 0;
    neutralReviews += score.neutralReviews || 0;
    negativeReviews += score.negativeReviews || 0;
  }

  // Calculate overall location score
  const overallScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, s) => sum + (s.overallScore || 0), 0) /
            scores.length
        )
      : 0;

  return NextResponse.json({
    brandId,
    summary: {
      totalLocations,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      verifiedCount,
      googleSyncedCount,
      overallScore,
    },
    typeBreakdown,
    sentimentBreakdown: {
      positive: positiveReviews,
      neutral: neutralReviews,
      negative: negativeReviews,
    },
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      rating: loc.rating,
      reviewCount: loc.reviewCount,
      locationType: loc.locationType,
      isPrimary: loc.isPrimary,
      isVerified: loc.isVerified,
      placeId: loc.placeId,
    })),
    lastUpdated: new Date().toISOString(),
  });
}

// ============================================================================
// Reviews Handler
// ============================================================================

async function getRecentReviews(brandId: string, limit: number) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const reviews = await db
    .select({
      review: brandReviews,
      location: brandLocations,
    })
    .from(brandReviews)
    .leftJoin(brandLocations, eq(brandReviews.locationId, brandLocations.id))
    .where(eq(brandReviews.brandId, brandId))
    .orderBy(desc(brandReviews.publishedAt))
    .limit(limit);

  // Calculate sentiment stats
  const sentimentStats = {
    positive: reviews.filter((r) => r.review.sentiment === "positive").length,
    neutral: reviews.filter((r) => r.review.sentiment === "neutral").length,
    negative: reviews.filter((r) => r.review.sentiment === "negative").length,
  };

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.review.id,
      locationId: r.review.locationId,
      locationName: r.location?.name || "Unknown",
      authorName: r.review.authorName,
      authorPhotoUrl: r.review.authorPhotoUrl,
      rating: r.review.rating,
      text: r.review.text,
      sentiment: r.review.sentiment,
      sentimentScore: r.review.sentimentScore,
      keywords: r.review.keywords,
      source: r.review.source,
      publishedAt: r.review.publishedAt?.toISOString(),
      ownerResponse: r.review.ownerResponse,
      ownerRespondedAt: r.review.ownerRespondedAt?.toISOString(),
    })),
    sentimentStats,
    total: reviews.length,
  });
}

// ============================================================================
// POST /api/locations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createLocationSchema.safeParse(body);

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

    // Create location
    const [location] = await db
      .insert(brandLocations)
      .values({
        id: createId(),
        brandId: data.brandId,
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        locationType: data.locationType || "headquarters",
        isPrimary: data.isPrimary ?? false,
        phone: data.phone || null,
        website: data.website || null,
        email: data.email || null,
        isVerified: false,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ data: location }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
