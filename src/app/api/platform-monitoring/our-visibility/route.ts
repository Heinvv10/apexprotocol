/**
 * Platform Monitoring - Our Visibility API Route
 * Tracks how our brand/content appears across AI platforms
 * GET /api/platform-monitoring/our-visibility - Get our platform mentions
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformMentions, brands } from "@/lib/db/schema";
import { eq, and, desc, count, avg, sql } from "drizzle-orm";

/**
 * GET /api/platform-monitoring/our-visibility
 * Returns our brand mentions across AI platforms
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get brandId from query params
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Fetch our platform mentions
    const mentions = await db
      .select()
      .from(platformMentions)
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true)
        )
      )
      .orderBy(desc(platformMentions.timestamp))
      .limit(100);

    // Calculate platform-specific stats
    const platformStats = await db
      .select({
        platform: platformMentions.platform,
        mentions: count(),
        avgPosition: avg(platformMentions.position),
        avgVisibility: avg(platformMentions.visibilityScore),
      })
      .from(platformMentions)
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true)
        )
      )
      .groupBy(platformMentions.platform);

    // Calculate top cited pages
    const topPages = await db
      .select({
        page: platformMentions.citedUrl,
        citations: count(),
        avgPosition: avg(platformMentions.position),
      })
      .from(platformMentions)
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true)
        )
      )
      .groupBy(platformMentions.citedUrl)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get platforms for each top page
    const topCitedPages = await Promise.all(
      topPages.map(async (page) => {
        const platforms = await db
          .select({ platform: platformMentions.platform })
          .from(platformMentions)
          .where(
            and(
              eq(platformMentions.organizationId, organizationId),
              eq(platformMentions.brandId, brandId),
              eq(platformMentions.citedUrl, page.page),
              eq(platformMentions.isOurBrand, true)
            )
          )
          .groupBy(platformMentions.platform);

        return {
          page: page.page,
          citations: page.citations,
          avgPosition: Math.round(Number(page.avgPosition || 0) * 10) / 10,
          platforms: platforms.map((p) => p.platform),
        };
      })
    );

    // Calculate totals
    const totalMentions = mentions.length;
    const avgVisibility =
      platformStats.reduce((sum, p) => sum + Number(p.avgVisibility || 0), 0) /
      (platformStats.length || 1);

    // Format mentions
    const formattedMentions = mentions.map((m) => ({
      id: m.id,
      platform: m.platform,
      timestamp: m.timestamp,
      query: m.query,
      ourPage: m.citedUrl,
      context: m.context || "",
      sentiment: m.sentiment || "neutral",
      position: m.position,
      visibility: m.visibilityScore,
    }));

    // Format platform stats
    const formattedPlatformStats = platformStats.map((p) => ({
      platform: p.platform,
      mentions: p.mentions,
      avgPosition: Math.round(Number(p.avgPosition || 0) * 10) / 10,
      avgVisibility: Math.round(Number(p.avgVisibility || 0) * 10) / 10,
      trend: 0, // Would need historical data to calculate trend
    }));

    return NextResponse.json({
      mentions: formattedMentions,
      platformStats: formattedPlatformStats,
      topCitedPages: topCitedPages,
      totalMentions: totalMentions,
      avgVisibility: Math.round(avgVisibility * 10) / 10,
    });
  } catch (error) {
    console.error("[Platform Monitoring - Our Visibility API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform mentions" },
      { status: 500 }
    );
  }
}
