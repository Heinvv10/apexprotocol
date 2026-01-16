/**
 * SEO Platform Monitoring API Route
 * Provides search platform performance data (Google, Bing, etc.)
 * GET /api/seo/platforms - Get platform-specific SEO metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchPlatformMetrics } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * GET /api/seo/platforms
 * Returns SEO performance data by platform (Google, Bing, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest metrics for each platform
    const platforms = ["google", "bing", "duckduckgo", "yandex"];

    const platformData = await Promise.all(
      platforms.map(async (platform) => {
        // Get latest metric for this platform
        const latestMetric = await db
          .select()
          .from(searchPlatformMetrics)
          .where(
            sql`${searchPlatformMetrics.organizationId} = ${organizationId}
                AND ${searchPlatformMetrics.platform} = ${platform}`
          )
          .orderBy(desc(searchPlatformMetrics.date))
          .limit(2); // Get latest 2 to calculate trend

        if (latestMetric.length === 0) {
          return {
            platform: platform,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            avgPosition: 0,
            indexedPages: 0,
            trend: 0,
          };
        }

        const current = latestMetric[0];
        const previous = latestMetric[1];

        // Calculate CTR
        const ctr = current.impressions > 0
          ? (current.clicks / current.impressions) * 100
          : 0;

        // Calculate trend (% change in clicks)
        let trend = 0;
        if (previous && previous.clicks > 0) {
          trend = ((current.clicks - previous.clicks) / previous.clicks) * 100;
        }

        return {
          platform: platform,
          impressions: current.impressions,
          clicks: current.clicks,
          ctr: Math.round(ctr * 100) / 100, // 2 decimal places
          avgPosition: Math.round(current.avgPosition * 10) / 10, // 1 decimal place
          indexedPages: current.indexedPages || 0,
          trend: Math.round(trend),
        };
      })
    );

    return NextResponse.json(platformData);
  } catch (error) {
    console.error("[SEO Platforms API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO platforms" },
      { status: 500 }
    );
  }
}
