/**
 * Citation ROI Report API
 * GET /api/citation-roi/report - Generate comprehensive ROI report
 * POST /api/citation-roi/report - Save a report snapshot
 *
 * Phase 15: AI Citation ROI Calculator
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import {
  citationConversions,
  citationTrackingLinks,
  citationRoiReports,
  brands,
  brandMentions,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, count, sum, avg } from "drizzle-orm";
import { z } from "zod";

// Validation schema for saving a report
const saveReportSchema = z.object({
  brandId: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  investmentAmount: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const investmentAmount = parseFloat(searchParams.get("investment") || "0");

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

    // Default to last 30 days if no dates provided
    const periodEnd = endDate ? new Date(endDate) : new Date();
    const periodStart = startDate
      ? new Date(startDate)
      : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get conversion stats
    const conversionStats = await db
      .select({
        totalConversions: count(),
        totalRevenue: sum(citationConversions.conversionValue),
        avgConfidence: avg(citationConversions.attributionConfidence),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart),
          lte(citationConversions.convertedAt, periodEnd)
        )
      );

    const totalConversions = conversionStats[0]?.totalConversions || 0;
    const totalRevenue = parseFloat(conversionStats[0]?.totalRevenue || "0");
    const avgConfidence = parseFloat(conversionStats[0]?.avgConfidence || "0.5");

    // Get citation count
    const citationStats = await db
      .select({ count: count() })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, brandId),
          gte(brandMentions.createdAt, periodStart),
          lte(brandMentions.createdAt, periodEnd),
          sql`${brandMentions.citationUrl} IS NOT NULL`
        )
      );

    const totalCitations = citationStats[0]?.count || 0;

    // Get tracking link stats
    const linkStats = await db
      .select({
        totalClicks: sum(citationTrackingLinks.clicks),
        totalLinkConversions: sum(citationTrackingLinks.conversions),
      })
      .from(citationTrackingLinks)
      .where(eq(citationTrackingLinks.brandId, brandId));

    const estimatedTraffic = parseInt(linkStats[0]?.totalClicks || "0");

    // Platform breakdown
    const platformBreakdown = await db
      .select({
        platform: citationConversions.sourcePlatform,
        conversions: count(),
        revenue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart),
          lte(citationConversions.convertedAt, periodEnd)
        )
      )
      .groupBy(citationConversions.sourcePlatform);

    // Citation count by platform for conversion rate
    const citationsByPlatform = await db
      .select({
        platform: brandMentions.platform,
        count: count(),
      })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, brandId),
          gte(brandMentions.createdAt, periodStart),
          lte(brandMentions.createdAt, periodEnd),
          sql`${brandMentions.citationUrl} IS NOT NULL`
        )
      )
      .groupBy(brandMentions.platform);

    const citationMap = new Map<string, number>(
      citationsByPlatform.map((c) => [c.platform, c.count])
    );

    const platformROI = platformBreakdown.map((p) => {
      const platformCitations = citationMap.get(p.platform) || 0;
      const platformRevenue = parseFloat(p.revenue || "0");
      return {
        platform: p.platform,
        conversions: p.conversions,
        revenue: platformRevenue,
        citations: platformCitations,
        conversionRate:
          platformCitations > 0
            ? (p.conversions / platformCitations) * 100
            : 0,
      };
    });

    // Conversion type breakdown
    const conversionTypeBreakdown = await db
      .select({
        type: citationConversions.conversionType,
        count: count(),
        totalValue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart),
          lte(citationConversions.convertedAt, periodEnd)
        )
      )
      .groupBy(citationConversions.conversionType);

    const conversionTypes = conversionTypeBreakdown.map((c) => {
      const value = parseFloat(c.totalValue || "0");
      return {
        type: c.type,
        count: c.count,
        totalValue: value,
        averageValue: c.count > 0 ? value / c.count : 0,
        percentage:
          totalConversions > 0 ? (c.count / totalConversions) * 100 : 0,
      };
    });

    // Daily conversion trends
    const dailyTrends = await db
      .select({
        date: sql<string>`DATE(${citationConversions.convertedAt})::text`,
        conversions: count(),
        revenue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart),
          lte(citationConversions.convertedAt, periodEnd)
        )
      )
      .groupBy(sql`DATE(${citationConversions.convertedAt})`)
      .orderBy(sql`DATE(${citationConversions.convertedAt})`);

    const conversionsOverTime = dailyTrends.map((d) => ({
      date: d.date,
      value: d.conversions,
    }));

    const revenueOverTime = dailyTrends.map((d) => ({
      date: d.date,
      value: parseFloat(d.revenue || "0"),
    }));

    // Top performing citations
    const topCitations = await db
      .select({
        mentionId: citationConversions.mentionId,
        platform: citationConversions.sourcePlatform,
        conversions: count(),
        revenue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart),
          lte(citationConversions.convertedAt, periodEnd),
          sql`${citationConversions.mentionId} IS NOT NULL`
        )
      )
      .groupBy(
        citationConversions.mentionId,
        citationConversions.sourcePlatform
      )
      .orderBy(desc(count()))
      .limit(10);

    // Calculate ROI metrics
    const netProfit = totalRevenue - investmentAmount;
    const roiPercentage =
      investmentAmount > 0 ? (netProfit / investmentAmount) * 100 : null;
    const costPerConversion =
      totalConversions > 0 ? investmentAmount / totalConversions : null;
    const revenuePerCitation =
      totalCitations > 0 ? totalRevenue / totalCitations : 0;
    const conversionRate =
      totalCitations > 0 ? (totalConversions / totalCitations) * 100 : 0;

    // Generate recommendations based on data
    const recommendations: string[] = [];

    if (totalCitations === 0) {
      recommendations.push(
        "No AI citations detected yet. Consider optimizing your content for AI platforms."
      );
    } else if (conversionRate < 1) {
      recommendations.push(
        "Conversion rate is low. Consider improving landing pages for AI-referred traffic."
      );
    }

    if (platformROI.length > 0) {
      const topPlatform = platformROI.sort(
        (a, b) => b.conversions - a.conversions
      )[0];
      recommendations.push(
        `${topPlatform.platform} is your top performing platform. Focus content optimization efforts there.`
      );
    }

    if (avgConfidence < 0.5) {
      recommendations.push(
        "Attribution confidence is low. Consider implementing more robust tracking."
      );
    }

    const report = {
      brandId,
      brandName: brand.name,
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      summary: {
        totalConversions,
        totalRevenue,
        totalCitations,
        estimatedTraffic,
        investmentAmount,
        netProfit,
        roiPercentage,
        costPerConversion,
        revenuePerCitation,
        conversionRate,
        averageAttributionConfidence: avgConfidence,
      },
      platformBreakdown: platformROI,
      conversionBreakdown: conversionTypes,
      trends: {
        conversionsOverTime,
        revenueOverTime,
      },
      topPerformingCitations: topCitations.map((c) => ({
        mentionId: c.mentionId,
        platform: c.platform,
        conversions: c.conversions,
        revenue: parseFloat(c.revenue || "0"),
      })),
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("[Citation ROI Report GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
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
    const validation = saveReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

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

    // Get summary stats
    const stats = await db
      .select({
        totalConversions: count(),
        totalRevenue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, data.brandId),
          gte(citationConversions.convertedAt, periodStart),
          lte(citationConversions.convertedAt, periodEnd)
        )
      );

    const citationStats = await db
      .select({ count: count() })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, data.brandId),
          gte(brandMentions.createdAt, periodStart),
          lte(brandMentions.createdAt, periodEnd),
          sql`${brandMentions.citationUrl} IS NOT NULL`
        )
      );

    const totalConversions = stats[0]?.totalConversions || 0;
    const totalRevenue = parseFloat(stats[0]?.totalRevenue || "0");
    const totalCitations = citationStats[0]?.count || 0;

    // Calculate ROI
    const investmentAmount = data.investmentAmount || 0;
    const netProfit = totalRevenue - investmentAmount;
    const roiPercentage =
      investmentAmount > 0 ? ((netProfit / investmentAmount) * 100).toFixed(2) : null;
    const costPerConversion =
      totalConversions > 0
        ? (investmentAmount / totalConversions).toFixed(2)
        : null;
    const revenuePerCitation =
      totalCitations > 0 ? (totalRevenue / totalCitations).toFixed(2) : null;

    // Save report snapshot
    const [report] = await db
      .insert(citationRoiReports)
      .values({
        brandId: data.brandId,
        periodStart,
        periodEnd,
        totalConversions,
        totalRevenue: totalRevenue.toString(),
        totalCitations,
        roiPercentage,
        costPerConversion,
        revenuePerCitation,
        reportData: {
          summary: {
            totalInvestment: investmentAmount,
            totalReturn: totalRevenue,
            netProfit,
          },
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        totalRevenue: parseFloat(report.totalRevenue || "0"),
        roiPercentage: report.roiPercentage
          ? parseFloat(report.roiPercentage)
          : null,
        costPerConversion: report.costPerConversion
          ? parseFloat(report.costPerConversion)
          : null,
        revenuePerCitation: report.revenuePerCitation
          ? parseFloat(report.revenuePerCitation)
          : null,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        generatedAt: report.generatedAt.toISOString(),
        createdAt: report.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Citation ROI Report POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    );
  }
}
