/**
 * SEO Summary API Route
 * Provides overview of SEO health and performance
 * GET /api/seo/summary - Get SEO summary metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { content, audits, keywords as keywordsTable } from "@/lib/db/schema";
import { eq, and, count, avg, sql } from "drizzle-orm";

/**
 * GET /api/seo/summary
 * Returns SEO overview summary including:
 * - Overall SEO score
 * - Technical health score
 * - Content quality score
 * - Page statistics (total, indexed)
 * - Keyword statistics (tracked, avg position)
 * - Traffic metrics
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest audit for overall scores
    const latestAudit = await db
      .select()
      .from(audits)
      .where(
        and(
          eq(audits.organizationId, organizationId),
          eq(audits.status, "completed")
        )
      )
      .orderBy(sql`${audits.completedAt} DESC`)
      .limit(1);

    const audit = latestAudit[0];

    // Get page statistics
    const totalPages = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.organizationId, organizationId));

    const indexedPages = await db
      .select({ count: count() })
      .from(content)
      .where(
        and(
          eq(content.organizationId, organizationId),
          eq(content.indexed, true)
        )
      );

    // Get keyword statistics
    const keywordStats = await db
      .select({
        total: count(),
        avgPosition: avg(keywordsTable.currentPosition),
      })
      .from(keywordsTable)
      .where(eq(keywordsTable.organizationId, organizationId));

    // Calculate organic traffic from content
    const trafficData = await db
      .select({
        total: sql<number>`SUM(${content.visits})`,
      })
      .from(content)
      .where(eq(content.organizationId, organizationId));

    // Count recent issues from latest audit
    const recentIssues = audit?.results?.issues
      ? audit.results.issues.filter(
          (issue: any) => issue.severity === "critical" || issue.severity === "high"
        ).length
      : 0;

    return NextResponse.json({
      overallScore: audit?.results?.overallScore || 0,
      technicalHealth: audit?.results?.technicalScore || 0,
      contentQuality: audit?.results?.contentScore || 0,
      totalPages: totalPages[0]?.count || 0,
      indexedPages: indexedPages[0]?.count || 0,
      trackedKeywords: keywordStats[0]?.total || 0,
      avgPosition: Math.round(Number(keywordStats[0]?.avgPosition || 0)),
      organicTraffic: Number(trafficData[0]?.total || 0),
      recentIssues: recentIssues,
    });
  } catch (error) {
    console.error("[SEO Summary API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO summary" },
      { status: 500 }
    );
  }
}
