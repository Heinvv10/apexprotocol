/**
 * Platform Monitoring - Content Performance API Route
 * Analyzes which content types perform best across AI platforms
 * GET /api/platform-monitoring/content-performance - Get content performance analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformMentions, content } from "@/lib/db/schema";
import { eq, and, count, avg, sql, gte, lte } from "drizzle-orm";

/**
 * GET /api/platform-monitoring/content-performance
 * Returns analysis of content performance across AI platforms
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

    // Get content performance by type
    const contentPerformance = await db
      .select({
        contentType: content.type,
        citations: count(),
        avgPosition: avg(platformMentions.position),
        avgVisibility: avg(platformMentions.visibilityScore),
      })
      .from(platformMentions)
      .innerJoin(content, eq(platformMentions.citedUrl, content.url))
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true)
        )
      )
      .groupBy(content.type)
      .orderBy(sql`count(*) DESC`);

    // Get top platforms for each content type
    const performanceByType = await Promise.all(
      contentPerformance.map(async (perf) => {
        const topPlatforms = await db
          .select({
            platform: platformMentions.platform,
            count: count(),
          })
          .from(platformMentions)
          .innerJoin(content, eq(platformMentions.citedUrl, content.url))
          .where(
            and(
              eq(platformMentions.organizationId, organizationId),
              eq(platformMentions.brandId, brandId),
              eq(content.type, perf.contentType),
              eq(platformMentions.isOurBrand, true)
            )
          )
          .groupBy(platformMentions.platform)
          .orderBy(sql`count(*) DESC`)
          .limit(3);

        return {
          contentType: perf.contentType,
          citations: perf.citations,
          avgPosition: Math.round(Number(perf.avgPosition || 0) * 10) / 10,
          avgVisibility: Math.round(Number(perf.avgVisibility || 0) * 10) / 10,
          topPlatforms: topPlatforms.map((p) => p.platform),
          trend: 0, // Would need historical data
        };
      })
    );

    // Analyze schema impact (content with vs without schema markup)
    const contentWithSchema = await db
      .select({ count: count() })
      .from(platformMentions)
      .innerJoin(content, eq(platformMentions.citedUrl, content.url))
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true),
          sql`${content.schemaMarkup} IS NOT NULL`
        )
      );

    const contentWithoutSchema = await db
      .select({ count: count() })
      .from(platformMentions)
      .innerJoin(content, eq(platformMentions.citedUrl, content.url))
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true),
          sql`${content.schemaMarkup} IS NULL`
        )
      );

    const withSchemaCount = contentWithSchema[0]?.count || 0;
    const withoutSchemaCount = contentWithoutSchema[0]?.count || 0;
    const totalSchemaContent = withSchemaCount + withoutSchemaCount;

    const schemaImpact = {
      withSchema: withSchemaCount,
      withoutSchema: withoutSchemaCount,
      improvement:
        totalSchemaContent > 0
          ? Math.round(
              ((withSchemaCount - withoutSchemaCount) / totalSchemaContent) *
                100
            )
          : 0,
    };

    // Analyze freshness impact (content age)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const under30Days = await db
      .select({ count: count() })
      .from(platformMentions)
      .innerJoin(content, eq(platformMentions.citedUrl, content.url))
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true),
          gte(content.publishedAt, thirtyDaysAgo)
        )
      );

    const under90Days = await db
      .select({ count: count() })
      .from(platformMentions)
      .innerJoin(content, eq(platformMentions.citedUrl, content.url))
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true),
          gte(content.publishedAt, ninetyDaysAgo),
          sql`${content.publishedAt} < ${thirtyDaysAgo}`
        )
      );

    const over90Days = await db
      .select({ count: count() })
      .from(platformMentions)
      .innerJoin(content, eq(platformMentions.citedUrl, content.url))
      .where(
        and(
          eq(platformMentions.organizationId, organizationId),
          eq(platformMentions.brandId, brandId),
          eq(platformMentions.isOurBrand, true),
          sql`${content.publishedAt} < ${ninetyDaysAgo}`
        )
      );

    const freshnessImpact = {
      under30Days: under30Days[0]?.count || 0,
      under90Days: under90Days[0]?.count || 0,
      over90Days: over90Days[0]?.count || 0,
    };

    return NextResponse.json({
      performanceByType: performanceByType,
      schemaImpact: schemaImpact,
      freshnessImpact: freshnessImpact,
    });
  } catch (error) {
    console.error(
      "[Platform Monitoring - Content Performance API] Error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch content performance" },
      { status: 500 }
    );
  }
}
