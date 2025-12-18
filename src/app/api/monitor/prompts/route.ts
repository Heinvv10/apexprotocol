/**
 * Monitor - Prompts/Queries API
 * Aggregates search prompts/queries from brand mentions
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, and, gte, inArray, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  range: z.enum(["7d", "14d", "30d", "90d"]).optional().default("30d"),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

interface SearchPromptResponse {
  id: string;
  promptText: string;
  platforms: string[];
  frequency: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
  sentiment: "positive" | "neutral" | "negative";
  lastSeen: string;
}

/**
 * GET /api/monitor/prompts
 * Returns aggregated search prompt data
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

    // Calculate date ranges
    const days = parseInt(params.range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Previous period for trend calculation
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(and(eq(brands.organizationId, orgId), eq(brands.isActive, true)));

    const brandIds = orgBrands.map((b) => b.id);

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        prompts: [],
        total: 0,
      });
    }

    // Build base conditions
    const baseConditions = params.brandId
      ? [eq(brandMentions.brandId, params.brandId)]
      : [inArray(brandMentions.brandId, brandIds)];

    // Current period mentions
    const currentMentions = await db
      .select({
        query: brandMentions.query,
        platform: brandMentions.platform,
        sentiment: brandMentions.sentiment,
        timestamp: brandMentions.timestamp,
      })
      .from(brandMentions)
      .where(and(...baseConditions, gte(brandMentions.timestamp, startDate)))
      .orderBy(desc(brandMentions.timestamp));

    // Previous period mentions (for trend calculation)
    const previousMentions = await db
      .select({
        query: brandMentions.query,
      })
      .from(brandMentions)
      .where(
        and(
          ...baseConditions,
          gte(brandMentions.timestamp, previousStartDate),
          sql`${brandMentions.timestamp} < ${startDate}`
        )
      );

    // Count previous period queries
    const previousQueryCounts = new Map<string, number>();
    for (const mention of previousMentions) {
      const count = previousQueryCounts.get(mention.query) || 0;
      previousQueryCounts.set(mention.query, count + 1);
    }

    // Aggregate current period by query
    const queryMap = new Map<
      string,
      {
        platforms: Set<string>;
        frequency: number;
        sentiments: { positive: number; neutral: number; negative: number };
        lastSeen: Date;
      }
    >();

    for (const mention of currentMentions) {
      const existing = queryMap.get(mention.query);

      if (existing) {
        existing.platforms.add(mention.platform);
        existing.frequency++;
        existing.sentiments[mention.sentiment]++;
        if (mention.timestamp > existing.lastSeen) {
          existing.lastSeen = mention.timestamp;
        }
      } else {
        queryMap.set(mention.query, {
          platforms: new Set([mention.platform]),
          frequency: 1,
          sentiments: {
            positive: mention.sentiment === "positive" ? 1 : 0,
            neutral: mention.sentiment === "neutral" ? 1 : 0,
            negative: mention.sentiment === "negative" ? 1 : 0,
          },
          lastSeen: mention.timestamp,
        });
      }
    }

    // Convert to array and calculate trends
    const prompts: SearchPromptResponse[] = Array.from(queryMap.entries())
      .map(([query, data], index) => {
        // Determine dominant sentiment
        const maxSentiment = Object.entries(data.sentiments).reduce(
          (max, [key, value]) => (value > max.value ? { key, value } : max),
          { key: "neutral", value: 0 }
        );

        // Calculate trend
        const previousCount = previousQueryCounts.get(query) || 0;
        let trend: "up" | "down" | "stable" = "stable";
        let trendValue = 0;

        if (previousCount > 0) {
          const change =
            ((data.frequency - previousCount) / previousCount) * 100;
          trendValue = Math.abs(Math.round(change));
          if (change > 10) trend = "up";
          else if (change < -10) trend = "down";
        } else if (data.frequency > 0) {
          trend = "up";
          trendValue = 100;
        }

        return {
          id: `prompt-${index + 1}`,
          promptText: query,
          platforms: Array.from(data.platforms),
          frequency: data.frequency,
          trend,
          trendValue,
          sentiment: maxSentiment.key as "positive" | "neutral" | "negative",
          lastSeen: formatLastSeen(data.lastSeen),
        };
      })
      // Sort by frequency descending
      .sort((a, b) => b.frequency - a.frequency)
      // Apply limit
      .slice(0, params.limit);

    return NextResponse.json({
      success: true,
      prompts,
      total: queryMap.size,
      meta: {
        range: params.range,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
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
    console.error("Prompts API error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Helper to format last seen date
function formatLastSeen(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
