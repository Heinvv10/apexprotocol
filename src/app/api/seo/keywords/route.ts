/**
 * SEO Keywords API Route
 * Provides keyword tracking and ranking data
 * GET /api/seo/keywords - Get all tracked keywords with rankings
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { keywords as keywordsTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/seo/keywords
 * Returns list of tracked keywords with ranking data
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all keywords
    const keywords = await db
      .select()
      .from(keywordsTable)
      .where(eq(keywordsTable.organizationId, organizationId))
      .orderBy(desc(keywordsTable.traffic))
      .limit(100);

    // Transform to Keyword format
    const keywordData = keywords.map((kw) => {
      // Calculate trend
      let trend: "up" | "down" | "stable" = "stable";
      const positionChange = kw.previousPosition - kw.currentPosition;

      if (positionChange > 0) trend = "up"; // Lower position number = better
      else if (positionChange < 0) trend = "down";

      return {
        id: kw.id,
        keyword: kw.keyword,
        position: kw.currentPosition,
        previousPosition: kw.previousPosition,
        searchVolume: kw.searchVolume || 0,
        difficulty: kw.difficulty || 0,
        url: kw.url,
        traffic: kw.traffic || 0,
        trend: trend,
      };
    });

    return NextResponse.json(keywordData);
  } catch (error) {
    console.error("[SEO Keywords API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}
