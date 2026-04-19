import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Location Sync API Route (Phase 9.2)
 *
 * POST /api/locations/sync - Sync location from Google Places
 * POST /api/locations/sync?action=search - Search for business on Google Places
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands, brandLocations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  isGooglePlacesConfigured,
  searchBusiness,
  findBusinessForBrand,
  syncLocationFromPlaces,
} from "@/lib/osint/google-places";

// ============================================================================
// Validation Schemas
// ============================================================================

const searchSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  query: z.string().min(1, "query is required"),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  radius: z.number().min(1000).max(50000).optional(),
});

const syncSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  placeId: z.string().min(1, "placeId is required"),
  locationType: z
    .enum([
      "headquarters",
      "branch",
      "store",
      "office",
      "warehouse",
    ])
    .optional(),
  isPrimary: z.boolean().optional(),
});

const autoDiscoverSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
});

// ============================================================================
// POST /api/locations/sync
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const body = await request.json();

    // Handle search action
    if (action === "search") {
      return await handleSearch(body, orgId);
    }

    // Handle auto-discover action
    if (action === "discover") {
      return await handleAutoDiscover(body, orgId);
    }

    // Default: sync from Google Places
    return await handleSync(body, orgId);
  } catch (error) {
    console.error("Error in locations sync:", error);
    return NextResponse.json(
      { error: "Failed to process sync request" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Search Handler
// ============================================================================

async function handleSearch(body: unknown, orgId: string | null | undefined) {
  // Check if Google Places is configured
  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      {
        error: "Google Places API not configured",
        message: "Please add GOOGLE_PLACES_API_KEY to your environment variables",
        configured: false,
      },
      { status: 503 }
    );
  }

  const validation = searchSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { brandId, query, location, radius } = validation.data;

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

  // Search for businesses
  const results = await searchBusiness(query, { location, radius });

  return NextResponse.json({
    results: results.map((r) => ({
      placeId: r.placeId,
      name: r.name,
      address: r.formattedAddress,
      location: r.geometry,
      rating: r.rating,
      reviewCount: r.userRatingsTotal,
      types: r.types,
      status: r.businessStatus,
    })),
    total: results.length,
  });
}

// ============================================================================
// Auto-Discover Handler
// ============================================================================

async function handleAutoDiscover(body: unknown, orgId: string | null | undefined) {
  // Check if Google Places is configured
  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      {
        error: "Google Places API not configured",
        message: "Please add GOOGLE_PLACES_API_KEY to your environment variables",
        configured: false,
      },
      { status: 503 }
    );
  }

  const validation = autoDiscoverSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { brandId } = validation.data;

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

  // Try to find business by brand name and domain
  const result = await findBusinessForBrand(brand.name, brand.domain || undefined);

  if (!result) {
    return NextResponse.json({
      found: false,
      message: "No matching business found on Google Places",
      suggestion: "Try searching manually with the business name",
    });
  }

  return NextResponse.json({
    found: true,
    result: {
      placeId: result.placeId,
      name: result.name,
      address: result.formattedAddress,
      location: result.geometry,
      rating: result.rating,
      reviewCount: result.userRatingsTotal,
      types: result.types,
    },
    message: "Business found. Use the placeId to sync this location.",
  });
}

// ============================================================================
// Sync Handler
// ============================================================================

async function handleSync(body: unknown, orgId: string | null | undefined) {
  // Check if Google Places is configured
  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      {
        error: "Google Places API not configured",
        message: "Please add GOOGLE_PLACES_API_KEY to your environment variables",
        configured: false,
      },
      { status: 503 }
    );
  }

  const validation = syncSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { brandId, placeId, locationType, isPrimary } = validation.data;

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

  // Sync location from Google Places
  const result = await syncLocationFromPlaces(brandId, placeId, {
    locationType,
    isPrimary,
  });

  // Get the created/updated location
  const location = await db.query.brandLocations.findFirst({
    where: eq(brandLocations.id, result.locationId),
  });

  return NextResponse.json({
    success: true,
    locationId: result.locationId,
    reviewsAdded: result.reviewsAdded,
    updated: result.updated,
    location: location
      ? {
          id: location.id,
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          rating: location.rating,
          reviewCount: location.reviewCount,
          locationType: location.locationType,
          isPrimary: location.isPrimary,
          isVerified: location.isVerified,
          lastSyncedAt: location.lastSyncedAt?.toISOString(),
        }
      : null,
  });
}

// ============================================================================
// GET /api/locations/sync - Check configuration status
// ============================================================================

export async function GET() {
  const configured = isGooglePlacesConfigured();

  return NextResponse.json({
    googlePlaces: {
      configured,
      message: configured
        ? "Google Places API is configured and ready"
        : "Google Places API key not found. Add GOOGLE_PLACES_API_KEY to environment variables.",
    },
  });
}
