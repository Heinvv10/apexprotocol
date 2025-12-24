/**
 * Competitor Tracking API
 * GET /api/competitors - List all tracked competitors for a brand
 * POST /api/competitors - Create a new competitor tracking entry
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, competitorSnapshots } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  getTrackedCompetitors,
  getLatestCompetitorSnapshot,
  createCompetitorSnapshot,
  type CompetitorSnapshot,
} from "@/lib/db/queries/competitor-queries";

// Response types
export interface CompetitorListResponse {
  success: boolean;
  competitors: Array<{
    competitorName: string;
    competitorDomain: string;
    latestSnapshot?: CompetitorSnapshot | null;
  }>;
  total: number;
}

export interface CompetitorCreateRequest {
  brandId: string;
  competitorName: string;
  competitorDomain: string;
  snapshotDate: string;
  geoScore?: number;
  aiMentionCount?: number;
  avgMentionPosition?: number;
  sentimentScore?: number;
}

export interface CompetitorCreateResponse {
  success: boolean;
  competitor: CompetitorSnapshot;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * GET /api/competitors
 * List all tracked competitors for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" } as ErrorResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" } as ErrorResponse,
        { status: 404 }
      );
    }

    // Get all tracked competitors for this brand
    const trackedCompetitors = await getTrackedCompetitors(brandId);

    // Fetch latest snapshots for each competitor
    const competitorsWithSnapshots = await Promise.all(
      trackedCompetitors.map(async (competitor) => {
        const latestSnapshot = await getLatestCompetitorSnapshot(
          brandId,
          competitor.competitorDomain
        );

        return {
          competitorName: competitor.competitorName,
          competitorDomain: competitor.competitorDomain,
          latestSnapshot,
        };
      })
    );

    const response: CompetitorListResponse = {
      success: true,
      competitors: competitorsWithSnapshots,
      total: competitorsWithSnapshots.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch competitors",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitors
 * Create a new competitor tracking entry
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" } as ErrorResponse,
        { status: 401 }
      );
    }

    const body = (await request.json()) as CompetitorCreateRequest;

    // Validate required fields
    if (!body.brandId || !body.competitorName || !body.competitorDomain) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "brandId, competitorName, and competitorDomain are required",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, body.brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" } as ErrorResponse,
        { status: 404 }
      );
    }

    // Check if we've reached the 10-competitor limit
    const existingCompetitors = await getTrackedCompetitors(body.brandId);

    // Check if this competitor already exists
    const competitorExists = existingCompetitors.some(
      (c) => c.competitorDomain === body.competitorDomain
    );

    if (!competitorExists && existingCompetitors.length >= 10) {
      return NextResponse.json(
        {
          error: "Competitor limit reached",
          details: "Maximum 10 competitors per brand allowed",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Create the competitor snapshot
    const snapshot = await createCompetitorSnapshot({
      brandId: body.brandId,
      competitorName: body.competitorName,
      competitorDomain: body.competitorDomain,
      snapshotDate: body.snapshotDate || new Date().toISOString().split("T")[0],
      geoScore: body.geoScore ?? null,
      aiMentionCount: body.aiMentionCount ?? null,
      avgMentionPosition: body.avgMentionPosition ?? null,
      sentimentScore: body.sentimentScore ?? null,
    });

    const response: CompetitorCreateResponse = {
      success: true,
      competitor: snapshot,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create competitor",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
