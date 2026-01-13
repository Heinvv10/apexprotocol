/**
 * Social Scan Results API Route
 *
 * Retrieves cached scan results from the database.
 *
 * GET /api/social/scan/results?brandId=xxx - Get cached results for a brand
 * GET /api/social/scan/results?brandId=xxx&platform=twitter - Get results for specific platform
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceScanResults, brands } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================================================
// GET - Retrieve Cached Scan Results
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const platform = searchParams.get("platform");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build query conditions
    const conditions = [eq(serviceScanResults.brandId, brandId)];

    if (platform) {
      // Type assertion for platform enum
      const validPlatforms = ["twitter", "youtube", "facebook", "linkedin", "instagram", "tiktok", "github", "pinterest", "medium", "reddit", "discord", "threads", "mastodon", "bluesky"];
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
          { error: "Invalid platform" },
          { status: 400 }
        );
      }
      conditions.push(eq(serviceScanResults.platform, platform as typeof serviceScanResults.platform.enumValues[number]));
    }

    // Fetch results
    const results = await db
      .select()
      .from(serviceScanResults)
      .where(and(...conditions))
      .orderBy(desc(serviceScanResults.scannedAt));

    // Calculate summary metrics
    const summary = {
      totalPlatforms: results.length,
      totalFollowers: results.reduce((sum, r) => sum + (r.followerCount || 0), 0),
      avgEngagementRate:
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.engagementRate || 0), 0) / results.length
          : 0,
      lastScanAt: results[0]?.scannedAt || null,
      platforms: results.map((r) => ({
        platform: r.platform,
        handle: r.targetHandle,
        followerCount: r.followerCount,
        engagementRate: r.engagementRate,
        scanStatus: r.scanStatus,
        scannedAt: r.scannedAt,
        hasProfile: !!r.profileData,
        hasPosts: Array.isArray(r.postsData) && r.postsData.length > 0,
        hasMentions: Array.isArray(r.mentionsData) && r.mentionsData.length > 0,
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        brandId,
        summary,
        results: results.map((r) => ({
          id: r.id,
          platform: r.platform,
          handle: r.targetHandle,
          platformAccountId: r.platformAccountId,
          // Aggregated metrics
          metrics: {
            followerCount: r.followerCount,
            followingCount: r.followingCount,
            postCount: r.postCount,
            engagementRate: r.engagementRate,
            avgLikes: r.avgLikes,
            avgComments: r.avgComments,
            avgShares: r.avgShares,
            avgViews: r.avgViews,
            postFrequency: r.postFrequency,
            mentionsCount: r.mentionsCount,
          },
          // Sentiment breakdown
          sentiment: {
            positive: r.sentimentPositive,
            neutral: r.sentimentNeutral,
            negative: r.sentimentNegative,
          },
          // Full data (optional - can be large)
          profileData: r.profileData,
          recentPosts: r.postsData?.slice(0, 5) || [], // Return only first 5 posts
          recentMentions: r.mentionsData?.slice(0, 5) || [], // Return only first 5 mentions
          // Status
          scanStatus: r.scanStatus,
          error: r.errorMessage,
          scannedAt: r.scannedAt,
          nextScanAt: r.nextScanAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching scan results:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan results" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Clear cached results for a brand/platform
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const platform = searchParams.get("platform");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build delete conditions
    const conditions = [eq(serviceScanResults.brandId, brandId)];

    if (platform) {
      const validPlatforms = ["twitter", "youtube", "facebook", "linkedin", "instagram", "tiktok", "github", "pinterest", "medium", "reddit", "discord", "threads", "mastodon", "bluesky"];
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
          { error: "Invalid platform" },
          { status: 400 }
        );
      }
      conditions.push(eq(serviceScanResults.platform, platform as typeof serviceScanResults.platform.enumValues[number]));
    }

    // Delete results
    const deleted = await db
      .delete(serviceScanResults)
      .where(and(...conditions))
      .returning({ id: serviceScanResults.id });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleted.length,
        message: platform
          ? `Cleared ${platform} scan results for brand`
          : "Cleared all scan results for brand",
      },
    });
  } catch (error) {
    console.error("Error deleting scan results:", error);
    return NextResponse.json(
      { error: "Failed to delete scan results" },
      { status: 500 }
    );
  }
}
