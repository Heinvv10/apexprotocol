import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Competitor Snapshots API
 * Phase 9.1: Time-series data endpoint for competitor metrics
 *
 * GET /api/competitive/snapshots - Get historical competitor snapshot data
 * Query params:
 * - brandId (required): Brand ID to get snapshots for
 * - competitorName (optional): Filter by specific competitor
 * - days (optional): Number of days to look back (default: 30)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, competitorSnapshots } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import {
  getCompetitorHistory,
  getLatestSnapshots,
} from "@/lib/competitive";

// Response types
export interface SnapshotResponse {
  brandId: string;
  competitorName?: string;
  timeRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  snapshots: Array<{
    date: string;
    competitorName: string;
    competitorDomain: string;
    geoScore: number;
    aiMentionCount: number;
    sentimentScore: number;
    socialFollowers: number;
    contentPageCount: number;
  }>;
  summary: {
    totalSnapshots: number;
    competitorsTracked: number;
    avgGeoScore: number;
    avgMentionCount: number;
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
    const competitorName = searchParams.get("competitorName");
    const days = parseInt(searchParams.get("days") || "30");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // If specific competitor requested
    if (competitorName) {
      return handleCompetitorSnapshots(brandId, competitorName, days);
    }

    // Otherwise, get all competitors
    return handleAllCompetitorsSnapshots(brandId, days);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch competitor snapshots" },
      { status: 500 }
    );
  }
}

/**
 * Handle snapshots for a specific competitor
 */
async function handleCompetitorSnapshots(
  brandId: string,
  competitorName: string,
  days: number
): Promise<NextResponse> {
  // Get historical data for this competitor
  const history = await getCompetitorHistory(brandId, competitorName, days);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  // Calculate summary statistics
  let totalGeoScore = 0;
  let totalMentions = 0;

  const snapshots = history.map((snapshot) => {
    totalGeoScore += snapshot.geoScore || 0;
    totalMentions += snapshot.aiMentionCount || 0;

    return {
      date: snapshot.date,
      competitorName,
      competitorDomain: "",
      geoScore: snapshot.geoScore || 0,
      aiMentionCount: snapshot.aiMentionCount || 0,
      sentimentScore: snapshot.sentimentScore || 0,
      socialFollowers: snapshot.socialFollowers || 0,
      contentPageCount: snapshot.contentPageCount || 0,
    };
  });

  const response: SnapshotResponse = {
    brandId,
    competitorName,
    timeRange: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      days,
    },
    snapshots,
    summary: {
      totalSnapshots: snapshots.length,
      competitorsTracked: 1,
      avgGeoScore: snapshots.length > 0 ? totalGeoScore / snapshots.length : 0,
      avgMentionCount: snapshots.length > 0 ? totalMentions / snapshots.length : 0,
    },
  };

  return NextResponse.json(response);
}

/**
 * Handle snapshots for all competitors
 */
async function handleAllCompetitorsSnapshots(
  brandId: string,
  days: number
): Promise<NextResponse> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDate = new Date();

  // Get all snapshots for this brand within the time range
  const snapshots = await db.query.competitorSnapshots.findMany({
    where: and(
      eq(competitorSnapshots.brandId, brandId),
      gte(competitorSnapshots.snapshotDate, startDateStr)
    ),
    orderBy: desc(competitorSnapshots.snapshotDate),
  });

  // Calculate summary statistics
  const competitorSet = new Set<string>();
  let totalGeoScore = 0;
  let totalMentions = 0;

  const formattedSnapshots = snapshots.map((snapshot) => {
    competitorSet.add(snapshot.competitorName);
    totalGeoScore += snapshot.geoScore || 0;
    totalMentions += snapshot.aiMentionCount || 0;

    return {
      date: snapshot.snapshotDate,
      competitorName: snapshot.competitorName,
      competitorDomain: snapshot.competitorDomain,
      geoScore: snapshot.geoScore || 0,
      aiMentionCount: snapshot.aiMentionCount || 0,
      sentimentScore: snapshot.sentimentScore || 0,
      socialFollowers: snapshot.socialFollowers || 0,
      contentPageCount: snapshot.contentPageCount || 0,
    };
  });

  const response: SnapshotResponse = {
    brandId,
    timeRange: {
      startDate: startDateStr,
      endDate: endDate.toISOString().split("T")[0],
      days,
    },
    snapshots: formattedSnapshots,
    summary: {
      totalSnapshots: snapshots.length,
      competitorsTracked: competitorSet.size,
      avgGeoScore: snapshots.length > 0 ? Math.round(totalGeoScore / snapshots.length) : 0,
      avgMentionCount: snapshots.length > 0 ? Math.round(totalMentions / snapshots.length) : 0,
    },
  };

  return NextResponse.json(response);
}
