/**
 * Competitive Intelligence API
 * Phase 5: Comprehensive competitive analysis endpoints
 *
 * GET /api/competitive - Get competitive intelligence summary
 * GET /api/competitive?type=sov - Get share of voice data
 * GET /api/competitive?type=gaps - Get competitive gaps
 * GET /api/competitive?type=alerts - Get competitive alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands, brandMentions, competitiveAlerts, competitiveGaps, discoveredCompetitors } from "@/lib/db/schema";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";
import {
  createCompetitiveTracker,
  calculateSOV,
  getSOVTrend,
  analyzeGaps,
  getExistingGaps,
  compareWithCompetitor,
  type CompetitiveIntelligence,
  type SOVSnapshot,
  type GapAnalysisReport,
} from "@/lib/competitive";

// Response types
export interface CompetitiveResponse {
  brandId: string;
  brandName: string;
  summary: {
    shareOfVoice: number;
    sovTrend: "up" | "down" | "stable";
    competitorCount: number;
    alertCount: number;
    gapCount: number;
  };
  lastUpdated: string;
}

export interface SOVResponse {
  brandId: string;
  current: SOVSnapshot;
  trend: {
    snapshots: Array<{ date: Date; sov: number }>;
    average: number;
    peak: number;
    low: number;
  };
  competitors: Array<{
    name: string;
    sov: number;
    trend: "up" | "down" | "stable";
    gap: number;
  }>;
}

export interface GapsResponse {
  brandId: string;
  summary: {
    totalGaps: number;
    highPriority: number;
    byType: Record<string, number>;
  };
  gaps: Array<{
    id?: string;
    type: string;
    keyword?: string;
    topic?: string;
    description: string;
    competitor: string;
    opportunity: number;
    isResolved: boolean;
  }>;
  recommendations: string[];
}

export interface AlertsResponse {
  brandId: string;
  unreadCount: number;
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    competitor?: string;
    platform?: string;
    triggeredAt: string;
    isRead: boolean;
  }>;
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
    const type = searchParams.get("type") || "summary";
    const days = parseInt(searchParams.get("days") || "30");
    const competitor = searchParams.get("competitor");

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

    // Handle different response types
    switch (type) {
      case "sov":
        return handleSOVRequest(brandId, brand.name, days, competitor);

      case "gaps":
        return handleGapsRequest(brandId);

      case "alerts":
        return handleAlertsRequest(brandId);

      case "full":
        return handleFullIntelligenceRequest(brandId, orgId || "", days);

      case "summary":
      default:
        return handleSummaryRequest(brandId, brand.name, days);
    }
  } catch (error) {
    console.error("Error in competitive API:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitive intelligence" },
      { status: 500 }
    );
  }
}

/**
 * Handle summary request (default)
 */
async function handleSummaryRequest(
  brandId: string,
  brandName: string,
  days: number
): Promise<NextResponse> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get mentions for SOV calculation
  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, startDate)
    ),
  });

  // Calculate basic SOV
  let totalMentions = mentions.length;
  const competitorSet = new Set<string>();

  for (const mention of mentions) {
    const competitors = mention.competitors || [];
    for (const comp of competitors) {
      competitorSet.add(comp.name);
      totalMentions++;
    }
  }

  const brandCount = mentions.length;
  const sov = totalMentions > 0 ? (brandCount / totalMentions) * 100 : 0;

  // Get competitor count from discovered_competitors table (confirmed competitors)
  const competitorCount = await db
    .select({ count: count() })
    .from(discoveredCompetitors)
    .where(
      and(
        eq(discoveredCompetitors.brandId, brandId),
        eq(discoveredCompetitors.status, "confirmed")
      )
    );

  // Get alert count
  const alertCount = await db
    .select({ count: count() })
    .from(competitiveAlerts)
    .where(
      and(
        eq(competitiveAlerts.brandId, brandId),
        eq(competitiveAlerts.isDismissed, false),
        eq(competitiveAlerts.isRead, false)
      )
    );

  // Get gap count
  const gapCount = await db
    .select({ count: count() })
    .from(competitiveGaps)
    .where(
      and(
        eq(competitiveGaps.brandId, brandId),
        eq(competitiveGaps.isResolved, false)
      )
    );

  // Calculate trend (compare to previous period)
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - days);

  const previousMentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, previousStart),
      gte(brandMentions.timestamp, startDate)
    ),
  });

  const previousCount = previousMentions.length;
  const trend: "up" | "down" | "stable" =
    brandCount > previousCount * 1.1
      ? "up"
      : brandCount < previousCount * 0.9
      ? "down"
      : "stable";

  const response: CompetitiveResponse = {
    brandId,
    brandName,
    summary: {
      shareOfVoice: Math.round(sov * 100) / 100,
      sovTrend: trend,
      competitorCount: competitorCount[0]?.count || 0,
      alertCount: alertCount[0]?.count || 0,
      gapCount: gapCount[0]?.count || 0,
    },
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

/**
 * Handle SOV request
 */
async function handleSOVRequest(
  brandId: string,
  brandName: string,
  days: number,
  competitor?: string | null
): Promise<NextResponse> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Calculate current SOV
  const currentSOV = await calculateSOV(brandId, {
    start: startDate,
    end: new Date(),
  });

  // Get trend data
  const trend = await getSOVTrend(brandId, days);

  // If specific competitor requested, get comparison
  let competitorComparison;
  if (competitor) {
    competitorComparison = await compareWithCompetitor(brandId, competitor, days);
  }

  // Build competitor list with SOV
  const competitors = currentSOV.competitors.map((comp) => ({
    name: comp.name,
    sov: comp.sovPercentage,
    trend: "stable" as const, // Would need historical data for trend
    gap: currentSOV.overall - comp.sovPercentage,
  }));

  const response: SOVResponse = {
    brandId,
    current: currentSOV,
    trend: {
      snapshots: trend.snapshots,
      average: trend.average,
      peak: trend.peak,
      low: trend.low,
    },
    competitors,
  };

  return NextResponse.json(response);
}

/**
 * Handle gaps request
 */
async function handleGapsRequest(brandId: string): Promise<NextResponse> {
  // Get existing gaps from database
  const existingGaps = await getExistingGaps(brandId, {
    resolved: false,
    limit: 50,
  });

  // If no gaps exist, run analysis
  let gaps = existingGaps;
  let analysis: GapAnalysisReport | null = null;

  if (existingGaps.length === 0) {
    analysis = await analyzeGaps(brandId);
    gaps = analysis.gaps;
  }

  // Count by type
  const byType: Record<string, number> = {
    keyword: 0,
    topic: 0,
    schema: 0,
    content: 0,
  };

  for (const gap of gaps) {
    byType[gap.type] = (byType[gap.type] || 0) + 1;
  }

  const response: GapsResponse = {
    brandId,
    summary: {
      totalGaps: gaps.length,
      highPriority: gaps.filter((g) => g.opportunity >= 70).length,
      byType,
    },
    gaps: gaps.map((g) => ({
      id: g.id,
      type: g.type,
      keyword: g.keyword,
      topic: g.topic,
      description: g.description,
      competitor: g.competitor,
      opportunity: g.opportunity,
      isResolved: g.isResolved,
    })),
    recommendations: analysis?.recommendations || [],
  };

  return NextResponse.json(response);
}

/**
 * Handle alerts request
 */
async function handleAlertsRequest(brandId: string): Promise<NextResponse> {
  const alerts = await db.query.competitiveAlerts.findMany({
    where: and(
      eq(competitiveAlerts.brandId, brandId),
      eq(competitiveAlerts.isDismissed, false)
    ),
    orderBy: desc(competitiveAlerts.triggeredAt),
    limit: 20,
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const response: AlertsResponse = {
    brandId,
    unreadCount,
    alerts: alerts.map((alert) => ({
      id: alert.id,
      type: alert.alertType,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      competitor: alert.competitorName || undefined,
      platform: alert.platform || undefined,
      triggeredAt: alert.triggeredAt.toISOString(),
      isRead: alert.isRead,
    })),
  };

  return NextResponse.json(response);
}

/**
 * Handle full intelligence request
 */
async function handleFullIntelligenceRequest(
  brandId: string,
  orgId: string,
  days: number
): Promise<NextResponse> {
  const tracker = createCompetitiveTracker(brandId, orgId);
  const intelligence = await tracker.getCompetitiveIntelligence(days);
  return NextResponse.json(intelligence);
}

/**
 * POST /api/competitive - Create alerts, mark alerts read, resolve gaps
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, brandId, alertId, gapId } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "markAlertRead":
        if (!alertId) {
          return NextResponse.json(
            { error: "alertId is required" },
            { status: 400 }
          );
        }
        await db
          .update(competitiveAlerts)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(competitiveAlerts.id, alertId),
              eq(competitiveAlerts.brandId, brandId)
            )
          );
        return NextResponse.json({ success: true });

      case "dismissAlert":
        if (!alertId) {
          return NextResponse.json(
            { error: "alertId is required" },
            { status: 400 }
          );
        }
        await db
          .update(competitiveAlerts)
          .set({ isDismissed: true })
          .where(
            and(
              eq(competitiveAlerts.id, alertId),
              eq(competitiveAlerts.brandId, brandId)
            )
          );
        return NextResponse.json({ success: true });

      case "resolveGap":
        if (!gapId) {
          return NextResponse.json(
            { error: "gapId is required" },
            { status: 400 }
          );
        }
        await db
          .update(competitiveGaps)
          .set({ isResolved: true, resolvedAt: new Date() })
          .where(
            and(
              eq(competitiveGaps.id, gapId),
              eq(competitiveGaps.brandId, brandId)
            )
          );
        return NextResponse.json({ success: true });

      case "analyze":
        const tracker = createCompetitiveTracker(brandId, orgId || "");
        const intelligence = await tracker.getCompetitiveIntelligence(30);
        return NextResponse.json(intelligence);

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in competitive POST:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
