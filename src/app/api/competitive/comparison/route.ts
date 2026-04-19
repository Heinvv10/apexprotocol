import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Competitor Comparison API
 * GET /api/competitive/comparison - Get competitor comparison data
 *
 * Returns data formatted for the CompetitorComparison component
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import {
  brands,
  brandMentions,
  competitorSnapshots,
  discoveredCompetitors,
  shareOfVoice,
} from "@/lib/db/schema";
import { eq, and, desc, gte, sql, count } from "drizzle-orm";

// Response type matching CompetitorData interface
export interface CompetitorComparisonData {
  id: string;
  name: string;
  logo?: string;
  domain: string;
  geoScore: number;
  geoScoreChange: number;
  mentions: number;
  mentionsChange: number;
  visibility: number;
  visibilityChange: number;
  platforms: {
    chatgpt: number;
    claude: number;
    gemini: number;
    perplexity: number;
  };
  isYou?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Get the brand
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // Get brand's own metrics
    const [brandMetrics, brandMentionsData, brandPreviousMentions] =
      await Promise.all([
        // Current period mentions count and platform breakdown
        db
          .select({
            platform: brandMentions.platform,
            count: count(),
          })
          .from(brandMentions)
          .where(
            and(
              eq(brandMentions.brandId, brandId),
              gte(brandMentions.timestamp, startDate)
            )
          )
          .groupBy(brandMentions.platform),

        // Total mentions current period
        db
          .select({ count: count() })
          .from(brandMentions)
          .where(
            and(
              eq(brandMentions.brandId, brandId),
              gte(brandMentions.timestamp, startDate)
            )
          ),

        // Total mentions previous period
        db
          .select({ count: count() })
          .from(brandMentions)
          .where(
            and(
              eq(brandMentions.brandId, brandId),
              gte(brandMentions.timestamp, previousPeriodStart),
              sql`${brandMentions.timestamp} < ${startDate}`
            )
          ),
      ]);

    // Calculate platform scores (normalize to 0-100)
    const platformMap: Record<string, number> = {};
    const totalMentions = brandMetrics.reduce((sum, m) => sum + m.count, 0);
    for (const m of brandMetrics) {
      const platform = m.platform?.toLowerCase() || "other";
      platformMap[platform] = Math.min(
        100,
        Math.round((m.count / Math.max(totalMentions, 1)) * 100)
      );
    }

    const currentMentions = brandMentionsData[0]?.count || 0;
    const previousMentions = brandPreviousMentions[0]?.count || 0;
    const mentionsChange =
      previousMentions > 0
        ? Math.round(
            ((currentMentions - previousMentions) / previousMentions) * 100
          )
        : 0;

    // Get latest SOV for visibility
    const latestSOV = await db.query.shareOfVoice.findFirst({
      where: eq(shareOfVoice.brandId, brandId),
      orderBy: desc(shareOfVoice.date),
    });

    const visibility = latestSOV
      ? Math.round(Number(latestSOV.sovPercentage) || 0)
      : Math.min(100, Math.round((currentMentions / 100) * 100));

    // Calculate a GEO score (weighted combination of metrics)
    const geoScore = calculateGeoScore(
      currentMentions,
      visibility,
      platformMap
    );

    // Build brand's own entry
    const brandEntry: CompetitorComparisonData = {
      id: brand.id,
      name: brand.name,
      logo: brand.logoUrl || undefined,
      domain: brand.domain || "",
      geoScore,
      geoScoreChange: mentionsChange > 0 ? Math.min(10, mentionsChange) : mentionsChange,
      mentions: currentMentions,
      mentionsChange,
      visibility,
      visibilityChange: 0, // Would need historical SOV data
      platforms: {
        chatgpt: platformMap["chatgpt"] || 0,
        claude: platformMap["claude"] || 0,
        gemini: platformMap["gemini"] || 0,
        perplexity: platformMap["perplexity"] || 0,
      },
      isYou: true,
    };

    // Get competitors from brand's competitor list
    const competitors: CompetitorComparisonData[] = [];
    const brandCompetitors = brand.competitors || [];

    // Also get discovered/confirmed competitors
    const confirmedCompetitors = await db.query.discoveredCompetitors.findMany({
      where: and(
        eq(discoveredCompetitors.brandId, brandId),
        eq(discoveredCompetitors.status, "confirmed")
      ),
    });

    // Combine competitor sources
    const allCompetitorNames = new Set<string>();
    for (const c of brandCompetitors) {
      allCompetitorNames.add(c.name);
    }
    for (const c of confirmedCompetitors) {
      allCompetitorNames.add(c.competitorName);
    }

    // Get latest snapshots for each competitor
    for (const competitorName of allCompetitorNames) {
      const snapshot = await db.query.competitorSnapshots.findFirst({
        where: and(
          eq(competitorSnapshots.brandId, brandId),
          eq(competitorSnapshots.competitorName, competitorName)
        ),
        orderBy: desc(competitorSnapshots.snapshotDate),
      });

      // Find domain from various sources
      const brandComp = brandCompetitors.find((c) => c.name === competitorName);
      const discoveredComp = confirmedCompetitors.find(
        (c) => c.competitorName === competitorName
      );
      const domain =
        brandComp?.url ||
        discoveredComp?.competitorDomain ||
        snapshot?.competitorDomain ||
        "";

      // Build platform breakdown from snapshot
      const platformBreakdown = snapshot?.platformBreakdown || [];
      const compPlatforms: Record<string, number> = {};
      for (const p of platformBreakdown) {
        compPlatforms[p.platform?.toLowerCase() || "other"] = Math.min(
          100,
          Math.round((p.mentions / Math.max(1, p.mentions)) * p.avgPosition)
        );
      }

      // Calculate competitor visibility from sentiment or estimate from mentions
      const compMentions = snapshot?.aiMentionCount || 0;
      const compVisibility = snapshot?.sentimentScore
        ? Math.round((Number(snapshot.sentimentScore) + 1) * 50)
        : Math.min(100, Math.round((compMentions / Math.max(1, currentMentions)) * visibility));

      // Calculate GEO score using same formula as brand for consistency
      const compGeoScore = snapshot?.geoScore || calculateGeoScore(
        compMentions,
        compVisibility,
        compPlatforms
      );

      competitors.push({
        id: snapshot?.id || `comp-${competitorName.toLowerCase().replace(/\s+/g, "-")}`,
        name: competitorName,
        domain: extractDomain(domain),
        geoScore: compGeoScore,
        geoScoreChange: 0, // Would need previous snapshot
        mentions: compMentions,
        mentionsChange: 0, // Would need historical competitor data
        visibility: compVisibility,
        visibilityChange: 0,
        platforms: {
          chatgpt: compPlatforms["chatgpt"] || 0,
          claude: compPlatforms["claude"] || 0,
          gemini: compPlatforms["gemini"] || 0,
          perplexity: compPlatforms["perplexity"] || 0,
        },
        isYou: false,
      });
    }

    // Return brand first, then competitors sorted by GEO score
    const result = [
      brandEntry,
      ...competitors.sort((a, b) => b.geoScore - a.geoScore),
    ];

    return NextResponse.json({
      success: true,
      data: result,
      brandId,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in competitor comparison API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch competitor comparison",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate a GEO score from various metrics
 */
function calculateGeoScore(
  mentions: number,
  visibility: number,
  platforms: Record<string, number>
): number {
  // Weight factors
  const mentionWeight = 0.3;
  const visibilityWeight = 0.3;
  const platformWeight = 0.4;

  // Normalize mentions (cap at 100)
  const mentionScore = Math.min(100, mentions);

  // Platform diversity score
  const platformValues = Object.values(platforms);
  const avgPlatform =
    platformValues.length > 0
      ? platformValues.reduce((a, b) => a + b, 0) / platformValues.length
      : 0;
  const platformScore = Math.min(100, avgPlatform * 1.5);

  return Math.round(
    mentionScore * mentionWeight +
      visibility * visibilityWeight +
      platformScore * platformWeight
  );
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  if (!url) return "";
  try {
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace("www.", "").split("/")[0];
  }
}
