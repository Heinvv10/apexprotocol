/**
 * Monitor - Mentions Analytics API
 * Aggregates mention data for analytics visualization
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, and, gte, inArray, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Validation schema for query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  range: z.enum(["7d", "14d", "30d", "90d"]).optional().default("30d"),
});

/**
 * GET /api/monitor/mentions/analytics
 * Returns aggregated mention analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // Calculate date range
    const days = parseInt(params.range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(and(eq(brands.organizationId, orgId), eq(brands.isActive, true)));

    const brandIds = orgBrands.map((b) => b.id);

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        sentiment: { total: 0, positive: 0, neutral: 0, negative: 0, unrecognized: 0 },
        platforms: {},
      });
    }

    // Build query conditions
    const conditions = [
      inArray(brandMentions.brandId, brandIds),
      gte(brandMentions.timestamp, startDate),
    ];

    if (params.brandId) {
      conditions.push(eq(brandMentions.brandId, params.brandId));
    }

    // Fetch all mentions in the date range
    const mentions = await db
      .select({
        id: brandMentions.id,
        platform: brandMentions.platform,
        sentiment: brandMentions.sentiment,
        timestamp: brandMentions.timestamp,
      })
      .from(brandMentions)
      .where(and(...conditions))
      .orderBy(desc(brandMentions.timestamp));

    // Aggregate by date and platform
    const dateMap = new Map<string, {
      chatgpt: number;
      claude: number;
      perplexity: number;
      gemini: number;
      grok: number;
      deepseek: number;
      copilot: number;
      total: number;
    }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dateMap.set(dateKey, {
        chatgpt: 0,
        claude: 0,
        perplexity: 0,
        gemini: 0,
        grok: 0,
        deepseek: 0,
        copilot: 0,
        total: 0,
      });
    }

    // Aggregate sentiment stats
    const sentimentStats = {
      total: mentions.length,
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    // Aggregate platform stats
    const platformStats: Record<string, number> = {
      chatgpt: 0,
      claude: 0,
      perplexity: 0,
      gemini: 0,
      grok: 0,
      deepseek: 0,
      copilot: 0,
    };

    // Process mentions
    for (const mention of mentions) {
      // Date aggregation
      const dateKey = mention.timestamp.toISOString().split("T")[0];
      const dateData = dateMap.get(dateKey);
      if (dateData) {
        const platform = mention.platform as keyof typeof dateData;
        if (platform in dateData && platform !== "total") {
          dateData[platform]++;
        }
        dateData.total++;
      }

      // Sentiment aggregation
      if (mention.sentiment === "positive") sentimentStats.positive++;
      else if (mention.sentiment === "negative") sentimentStats.negative++;
      else sentimentStats.neutral++;

      // Platform aggregation
      if (mention.platform in platformStats) {
        platformStats[mention.platform]++;
      }
    }

    // Convert to array format sorted by date
    const analyticsData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        displayDate: formatDisplayDate(date),
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: analyticsData,
      sentiment: sentimentStats,
      platforms: platformStats,
      meta: {
        range: params.range,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        totalMentions: mentions.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Analytics error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Helper to format date for display
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
