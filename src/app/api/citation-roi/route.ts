/**
 * Citation ROI API - Main endpoint
 * GET /api/citation-roi - Get ROI summary for a brand
 *
 * Phase 15: AI Citation ROI Calculator
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import {
  citationConversions,
  citationTrackingLinks,
  brands,
  brandMentions,
  aiUsage,
} from "@/lib/db/schema";
import { eq, and, gte, sql, count, sum, desc } from "drizzle-orm";

interface ROISummary {
  totalConversions: number;
  totalRevenue: number;
  totalCitations: number;
  totalTrackingLinks: number;
  averageConversionValue: number;
  conversionRate: number;
  roiPercentage: number | null;
  platformBreakdown: {
    platform: string;
    conversions: number;
    revenue: number;
    percentage: number;
  }[];
  conversionTypeBreakdown: {
    type: string;
    count: number;
    value: number;
  }[];
  recentConversions: {
    id: string;
    platform: string;
    type: string;
    value: number;
    convertedAt: string;
  }[];
  period: {
    start: string;
    end: string;
  };
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
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, all

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

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    switch (period) {
      case "7d":
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        periodStart = new Date(0);
        break;
      default: // 30d
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total conversions and revenue
    const conversionsResult = await db
      .select({
        totalConversions: count(),
        totalRevenue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart)
        )
      );

    const totalConversions = conversionsResult[0]?.totalConversions || 0;
    const totalRevenue = parseFloat(conversionsResult[0]?.totalRevenue || "0");

    // Get total citations (mentions with citation URLs)
    const citationsResult = await db
      .select({ count: count() })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, brandId),
          gte(brandMentions.createdAt, periodStart),
          sql`${brandMentions.citationUrl} IS NOT NULL`
        )
      );

    const totalCitations = citationsResult[0]?.count || 0;

    // Get tracking links count
    const trackingLinksResult = await db
      .select({ count: count() })
      .from(citationTrackingLinks)
      .where(eq(citationTrackingLinks.brandId, brandId));

    const totalTrackingLinks = trackingLinksResult[0]?.count || 0;

    // Get platform breakdown
    const platformBreakdownResult = await db
      .select({
        platform: citationConversions.sourcePlatform,
        conversions: count(),
        revenue: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart)
        )
      )
      .groupBy(citationConversions.sourcePlatform);

    const platformBreakdown = platformBreakdownResult.map((p) => ({
      platform: p.platform,
      conversions: p.conversions,
      revenue: parseFloat(p.revenue || "0"),
      percentage:
        totalConversions > 0 ? (p.conversions / totalConversions) * 100 : 0,
    }));

    // Get conversion type breakdown
    const conversionTypeResult = await db
      .select({
        type: citationConversions.conversionType,
        count: count(),
        value: sum(citationConversions.conversionValue),
      })
      .from(citationConversions)
      .where(
        and(
          eq(citationConversions.brandId, brandId),
          gte(citationConversions.convertedAt, periodStart)
        )
      )
      .groupBy(citationConversions.conversionType);

    const conversionTypeBreakdown = conversionTypeResult.map((c) => ({
      type: c.type,
      count: c.count,
      value: parseFloat(c.value || "0"),
    }));

    // Get recent conversions
    const recentConversionsResult = await db
      .select({
        id: citationConversions.id,
        platform: citationConversions.sourcePlatform,
        type: citationConversions.conversionType,
        value: citationConversions.conversionValue,
        convertedAt: citationConversions.convertedAt,
      })
      .from(citationConversions)
      .where(eq(citationConversions.brandId, brandId))
      .orderBy(desc(citationConversions.convertedAt))
      .limit(10);

    const recentConversions = recentConversionsResult.map((c) => ({
      id: c.id,
      platform: c.platform,
      type: c.type,
      value: parseFloat(c.value || "0"),
      convertedAt: c.convertedAt.toISOString(),
    }));

    // Calculate metrics
    const averageConversionValue =
      totalConversions > 0 ? totalRevenue / totalConversions : 0;
    const conversionRate =
      totalCitations > 0 ? (totalConversions / totalCitations) * 100 : 0;

    // ROI calculation using AI usage costs as investment
    // Calculate total AI spending for this brand's organization in the period
    let roiPercentage: number | null = null;
    try {
      const aiCostsResult = await db
        .select({
          totalCost: sql<string>`COALESCE(SUM(CAST(${aiUsage.cost} AS DECIMAL)), 0)`,
        })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.organizationId, orgId || userId),
            gte(aiUsage.createdAt, periodStart)
          )
        );

      const totalInvestment = parseFloat(aiCostsResult[0]?.totalCost || "0");

      // Calculate ROI: ((Revenue - Investment) / Investment) * 100
      if (totalInvestment > 0) {
        const netProfit = totalRevenue - totalInvestment;
        roiPercentage = Math.round((netProfit / totalInvestment) * 100 * 10) / 10;
      } else if (totalRevenue > 0) {
        // If no investment recorded but revenue exists, ROI is infinite (represented as null or high value)
        roiPercentage = 999; // Cap at 999% to indicate extremely high ROI
      }
    } catch (err) {
      // If AI usage table doesn't exist or error, fallback to null
      console.warn("[Citation ROI] Could not calculate ROI from AI usage:", err);
    }

    const summary: ROISummary = {
      totalConversions,
      totalRevenue,
      totalCitations,
      totalTrackingLinks,
      averageConversionValue,
      conversionRate,
      roiPercentage,
      platformBreakdown,
      conversionTypeBreakdown,
      recentConversions,
      period: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("[Citation ROI API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch ROI summary" },
      { status: 500 }
    );
  }
}
