/**
 * Citation Tracking Links API
 * GET /api/citation-roi/tracking-links - List tracking links for a brand
 * POST /api/citation-roi/tracking-links - Create a new tracking link
 * DELETE /api/citation-roi/tracking-links - Delete a tracking link
 *
 * Phase 15: AI Citation ROI Calculator
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { citationTrackingLinks, brands } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

// Validation schema for creating a tracking link
const createTrackingLinkSchema = z.object({
  brandId: z.string().min(1),
  originalUrl: z.string().url(),
  campaignName: z.string().optional(),
  targetPlatform: z.string().optional(),
  utmParams: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_term: z.string().optional(),
      utm_content: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customParams: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

/**
 * Generate a short code for tracking links
 */
function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Build tracking URL with UTM parameters
 */
function buildTrackingUrl(
  originalUrl: string,
  utmParams: Record<string, string | undefined>,
  shortCode: string
): string {
  const url = new URL(originalUrl);

  // Add UTM parameters
  Object.entries(utmParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  // Add tracking identifier
  url.searchParams.set("apex_track", shortCode);

  return url.toString();
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to user's organization
    const [brand] = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, brandId),
          eq(brands.organizationId, orgId || userId)
        )
      )
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(citationTrackingLinks)
      .where(eq(citationTrackingLinks.brandId, brandId));

    const total = countResult[0]?.count || 0;

    // Get tracking links with pagination
    const offset = (page - 1) * limit;

    const links = await db
      .select()
      .from(citationTrackingLinks)
      .where(eq(citationTrackingLinks.brandId, brandId))
      .orderBy(desc(citationTrackingLinks.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: {
        links: links.map((link) => ({
          ...link,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
          expiresAt: link.expiresAt?.toISOString() || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[Tracking Links GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking links" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTrackingLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify brand belongs to user's organization
    const [brand] = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, data.brandId),
          eq(brands.organizationId, orgId || userId)
        )
      )
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Generate short code
    const shortCode = generateShortCode();

    // Build default UTM params if not provided
    const utmParams = data.utmParams || {
      utm_source: data.targetPlatform || "ai",
      utm_medium: "citation",
      utm_campaign: data.campaignName || "apex_tracking",
    };

    // Build tracking URL
    const trackingUrl = buildTrackingUrl(data.originalUrl, utmParams, shortCode);

    // Create tracking link
    const linkMetadata = data.metadata
      ? {
          description: data.metadata.description,
          tags: data.metadata.tags,
          customParams: data.metadata.customParams,
        }
      : {};

    const [link] = await db
      .insert(citationTrackingLinks)
      .values({
        brandId: data.brandId,
        originalUrl: data.originalUrl,
        trackingUrl,
        shortCode,
        utmParams,
        campaignName: data.campaignName || null,
        targetPlatform: data.targetPlatform || null,
        metadata: linkMetadata,
        clicks: 0,
        conversions: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...link,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
        expiresAt: link.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("[Tracking Links POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to create tracking link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("id");

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Get the link to verify ownership
    const [link] = await db
      .select()
      .from(citationTrackingLinks)
      .where(eq(citationTrackingLinks.id, linkId))
      .limit(1);

    if (!link) {
      return NextResponse.json(
        { error: "Tracking link not found" },
        { status: 404 }
      );
    }

    // Verify brand belongs to user's organization
    const [brand] = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, link.brandId),
          eq(brands.organizationId, orgId || userId)
        )
      )
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the link
    await db
      .delete(citationTrackingLinks)
      .where(eq(citationTrackingLinks.id, linkId));

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("[Tracking Links DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete tracking link" },
      { status: 500 }
    );
  }
}
