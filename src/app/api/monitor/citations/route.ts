/**
 * Monitor - Citations API
 * Aggregates citation data from brand mentions
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, and, gte, inArray, desc, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Validation schema for query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  range: z.enum(["7d", "14d", "30d", "90d"]).optional().default("30d"),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

interface CitationData {
  id: string;
  url: string;
  title: string;
  citations: number;
  lastCited: string;
  platforms: Record<string, number>;
  context: string;
}

interface CitationTrendPoint {
  date: string;
  citations: number;
}

/**
 * GET /api/monitor/citations
 * Returns aggregated citation data
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
        citations: [],
        trendData: [],
        total: 0,
      });
    }

    // Build base conditions
    const baseConditions = params.brandId
      ? [eq(brandMentions.brandId, params.brandId)]
      : [inArray(brandMentions.brandId, brandIds)];

    // Fetch mentions with citations
    const mentionsWithCitations = await db
      .select({
        id: brandMentions.id,
        citationUrl: brandMentions.citationUrl,
        platform: brandMentions.platform,
        response: brandMentions.response,
        timestamp: brandMentions.timestamp,
      })
      .from(brandMentions)
      .where(
        and(
          ...baseConditions,
          gte(brandMentions.timestamp, startDate),
          isNotNull(brandMentions.citationUrl)
        )
      )
      .orderBy(desc(brandMentions.timestamp));

    // Aggregate by citation URL
    const urlMap = new Map<
      string,
      {
        citations: number;
        platforms: Record<string, number>;
        lastCited: Date;
        context: string;
      }
    >();

    // Track daily citations for trend
    const dateMap = new Map<string, number>();

    for (const mention of mentionsWithCitations) {
      if (!mention.citationUrl) continue;

      const existing = urlMap.get(mention.citationUrl);

      if (existing) {
        existing.citations++;
        existing.platforms[mention.platform] =
          (existing.platforms[mention.platform] || 0) + 1;
        if (mention.timestamp > existing.lastCited) {
          existing.lastCited = mention.timestamp;
          // Update context with more recent snippet
          existing.context = extractContextSnippet(mention.response);
        }
      } else {
        urlMap.set(mention.citationUrl, {
          citations: 1,
          platforms: { [mention.platform]: 1 },
          lastCited: mention.timestamp,
          context: extractContextSnippet(mention.response),
        });
      }

      // Aggregate for trend data
      const dateKey = mention.timestamp.toISOString().split("T")[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    }

    // Convert to array format
    const citations: CitationData[] = Array.from(urlMap.entries())
      .map(([url, data], index) => ({
        id: `citation-${index + 1}`,
        url,
        title: extractTitleFromUrl(url),
        citations: data.citations,
        lastCited: formatLastCited(data.lastCited),
        platforms: data.platforms,
        context: data.context,
      }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, params.limit);

    // Generate trend data for the entire range
    const trendData: CitationTrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      trendData.push({
        date: formatTrendDate(date),
        citations: dateMap.get(dateKey) || 0,
      });
    }

    return NextResponse.json({
      success: true,
      citations,
      trendData,
      total: urlMap.size,
      meta: {
        range: params.range,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        totalCitations: mentionsWithCitations.length,
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
    console.error("Citations API error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Helper to extract context snippet from response
function extractContextSnippet(response: string): string {
  // Take first 200 characters as context
  const snippet = response.slice(0, 200).trim();
  return snippet.length < response.length ? `${snippet}...` : snippet;
}

// Helper to extract title from URL
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      // Use last path segment, clean it up
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart
        .replace(/[-_]/g, " ")
        .replace(/\.(html?|php|aspx?)$/i, "")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return urlObj.hostname;
  } catch {
    return url.slice(0, 50);
  }
}

// Helper to format last cited date
function formatLastCited(date: Date): string {
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

// Helper to format trend date
function formatTrendDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
