/**
 * Competitor Discovery API
 * Phase 9.1: Auto-discover competitors for a brand
 *
 * POST /api/competitive/discover - Trigger discovery for a brand
 * GET /api/competitive/discover - Get discovered competitors for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { brands, discoveredCompetitors } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  discoverCompetitors,
  storeDiscoveredCompetitors,
  runDiscoveryProcess,
  getDiscoveredCompetitors,
  type DiscoveryOptions,
} from "@/lib/competitive";

// Request/Response types
interface DiscoverRequest {
  brandId: string;
  options?: {
    minConfidenceScore?: number;
    maxResults?: number;
    lookbackDays?: number;
    storeResults?: boolean;
  };
}

interface DiscoveredCompetitorResponse {
  id: string;
  competitorName: string;
  competitorDomain: string | null;
  discoveryMethod: string;
  confidenceScore: number;
  keywordOverlap: number | null;
  aiCoOccurrence: number | null;
  industryMatch: boolean | null;
  sharedKeywords: string[];
  coOccurrenceQueries: string[];
  status: string;
  createdAt: string;
}

interface DiscoveryResponse {
  brandId: string;
  discovered: number;
  competitors: DiscoveredCompetitorResponse[];
  storedIds?: string[];
}

/**
 * GET /api/competitive/discover
 * Get discovered competitors for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const status = searchParams.get("status") as
      | "pending"
      | "confirmed"
      | "rejected"
      | null;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get discovered competitors
    const discoveries = await getDiscoveredCompetitors(
      brandId,
      status || undefined
    );

    const response: DiscoveryResponse = {
      brandId,
      discovered: discoveries.length,
      competitors: discoveries.map((d) => ({
        id: d.id,
        competitorName: d.competitorName,
        competitorDomain: d.competitorDomain,
        discoveryMethod: d.discoveryMethod,
        confidenceScore: d.confidenceScore,
        keywordOverlap: d.keywordOverlap,
        aiCoOccurrence: d.aiCoOccurrence,
        industryMatch: d.industryMatch,
        sharedKeywords: (d.sharedKeywords as string[]) || [],
        coOccurrenceQueries: (d.coOccurrenceQueries as string[]) || [],
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching discovered competitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovered competitors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitive/discover
 * Trigger competitor discovery for a brand
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DiscoverRequest = await request.json();
    const { brandId, options = {} } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Build discovery options
    const discoveryOptions: DiscoveryOptions = {
      minConfidenceScore: options.minConfidenceScore ?? 0.4,
      maxResults: options.maxResults ?? 20,
      lookbackDays: options.lookbackDays ?? 90,
    };

    // Run discovery
    const discoveries = await discoverCompetitors(brandId, discoveryOptions);

    let storedIds: string[] = [];

    // Store results if requested (default: true)
    if (options.storeResults !== false && discoveries.length > 0) {
      storedIds = await storeDiscoveredCompetitors(brandId, discoveries);
    }

    const response: DiscoveryResponse = {
      brandId,
      discovered: discoveries.length,
      competitors: discoveries.map((d, index) => ({
        id: storedIds[index] || "",
        competitorName: d.competitorName,
        competitorDomain: d.competitorDomain || null,
        discoveryMethod: d.discoveryMethod,
        confidenceScore: d.confidenceScore,
        keywordOverlap: d.signals.keywordOverlap,
        aiCoOccurrence: d.signals.aiCoOccurrence,
        industryMatch: d.signals.industryMatch,
        sharedKeywords: d.signals.sharedKeywords,
        coOccurrenceQueries: d.signals.coOccurrenceQueries,
        status: "pending",
        createdAt: new Date().toISOString(),
      })),
      storedIds,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error discovering competitors:", error);
    return NextResponse.json(
      { error: "Failed to discover competitors" },
      { status: 500 }
    );
  }
}
