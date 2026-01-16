/**
 * Platform Monitoring - Competitor Visibility API Route
 * Tracks competitor mentions across AI platforms
 * GET /api/platform-monitoring/competitor-visibility - Get competitor platform mentions
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformMentions, competitors } from "@/lib/db/schema";
import { eq, and, desc, count, avg, sql, notInArray } from "drizzle-orm";

/**
 * GET /api/platform-monitoring/competitor-visibility
 * Returns competitor mentions across AI platforms
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

    // Fetch competitor list
    const competitorList = await db
      .select()
      .from(competitors)
      .where(
        and(
          eq(competitors.organizationId, organizationId),
          eq(competitors.brandId, brandId)
        )
      );

    // Fetch competitor mentions
    const competitorMentions = await db
      .select()
      .from(platformMentions)
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, false)
        )
      )
      .orderBy(desc(platformMentions.timestamp))
      .limit(100);

    // Calculate competitor-specific stats
    const competitorStatsData = await db
      .select({
        competitorName: platformMentions.competitorName,
        mentions: count(),
        avgPosition: avg(platformMentions.position),
        avgVisibility: avg(platformMentions.visibilityScore),
      })
      .from(platformMentions)
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, false)
        )
      )
      .groupBy(platformMentions.competitorName)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get our total mentions for share of voice calculation
    const ourMentionsCount = await db
      .select({ count: count() })
      .from(platformMentions)
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true)
        )
      );

    const ourMentions = ourMentionsCount[0]?.count || 0;
    const totalCompetitorMentions = competitorStatsData.reduce(
      (sum, c) => sum + c.mentions,
      0
    );
    const totalMentions = ourMentions + totalCompetitorMentions;

    const shareOfVoice =
      totalMentions > 0 ? (ourMentions / totalMentions) * 100 : 0;

    // Format competitor stats
    const competitorStats = await Promise.all(
      competitorStatsData.map(async (comp) => {
        // Get top platforms for this competitor
        const topPlatforms = await db
          .select({
            platform: platformMentions.platform,
            count: count(),
          })
          .from(platformMentions)
          .where(
            and(
              eq(platformMentions.organizationId, organizationId),
              eq(platformMentions.brandId, brandId),
              eq(platformMentions.competitorName, comp.competitorName)
            )
          )
          .groupBy(platformMentions.platform)
          .orderBy(sql`count(*) DESC`)
          .limit(3);

        // Get top queries for this competitor
        const topQueries = await db
          .select({
            query: platformMentions.query,
            count: count(),
          })
          .from(platformMentions)
          .where(
            and(
              eq(platformMentions.organizationId, organizationId),
              eq(platformMentions.brandId, brandId),
              eq(platformMentions.competitorName, comp.competitorName)
            )
          )
          .groupBy(platformMentions.query)
          .orderBy(sql`count(*) DESC`)
          .limit(5);

        const compShareOfVoice =
          totalMentions > 0 ? (comp.mentions / totalMentions) * 100 : 0;

        return {
          name: comp.competitorName,
          mentions: comp.mentions,
          avgPosition: Math.round(Number(comp.avgPosition || 0) * 10) / 10,
          avgVisibility: Math.round(Number(comp.avgVisibility || 0) * 10) / 10,
          shareOfVoice: Math.round(compShareOfVoice * 10) / 10,
          trend: 0, // Would need historical data
          topPlatforms: topPlatforms.map((p) => p.platform),
          topQueries: topQueries.map((q) => q.query),
        };
      })
    );

    // Format competitor mentions
    const formattedMentions = competitorMentions.map((m) => ({
      id: m.id,
      platform: m.platform,
      timestamp: m.timestamp,
      query: m.query,
      competitor: m.competitorName || "Unknown",
      competitorPage: m.citedUrl,
      context: m.context || "",
      position: m.position,
      visibility: m.visibilityScore,
    }));

    return NextResponse.json({
      mentions: formattedMentions,
      competitors: competitorStats,
      shareOfVoice: Math.round(shareOfVoice * 10) / 10,
    });
  } catch (error) {
    console.error(
      "[Platform Monitoring - Competitor Visibility API] Error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch competitor mentions" },
      { status: 500 }
    );
  }
}
