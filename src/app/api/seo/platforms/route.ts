/**
 * SEO Platform Monitoring API Route
 * Provides search platform performance data (Google, Bing, etc.)
 * GET /api/seo/platforms - Get platform-specific SEO metrics
 *
 * NOTE: Currently returns placeholder data until searchPlatformMetrics table is created
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/clerk";

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

    // TODO: Implement database queries when searchPlatformMetrics table is created
    // For now, return placeholder data structure
    const platforms = ["google", "bing", "duckduckgo", "yandex"];

    const platformData = platforms.map((platform) => {
      // Return placeholder data
      const baseData = {
        google: { impressions: 125000, clicks: 8750, avgPosition: 12.3, indexedPages: 1247 },
        bing: { impressions: 32000, clicks: 1920, avgPosition: 8.7, indexedPages: 982 },
        duckduckgo: { impressions: 8500, clicks: 680, avgPosition: 15.2, indexedPages: 756 },
        yandex: { impressions: 4200, clicks: 294, avgPosition: 18.4, indexedPages: 521 },
      };

      const data = baseData[platform as keyof typeof baseData] || {
        impressions: 0,
        clicks: 0,
        avgPosition: 0,
        indexedPages: 0,
      };

      const ctr = data.impressions > 0
        ? (data.clicks / data.impressions) * 100
        : 0;

      return {
        platform: platform,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: Math.round(ctr * 100) / 100,
        avgPosition: data.avgPosition,
        indexedPages: data.indexedPages,
        trend: Math.floor(Math.random() * 20) - 5, // Placeholder trend
      };
    });

    return NextResponse.json(platformData);
  } catch (error) {
    console.error("[SEO Platforms API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO platforms" },
      { status: 500 }
    );
  }
}
