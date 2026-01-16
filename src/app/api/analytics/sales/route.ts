/**
 * Sales Analytics API Route
 * Provides sales performance metrics and pipeline analytics
 * GET /api/analytics/sales - Get comprehensive sales analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, campaigns, emailEvents } from "@/lib/db/schema/marketing";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";

/**
 * GET /api/analytics/sales
 * Returns comprehensive sales analytics including:
 * - Pipeline metrics (value by stage, conversion rates)
 * - Revenue metrics (MRR, ARR, forecast)
 * - Performance metrics (win rate, average deal size, sales cycle)
 * - Team metrics (performance by rep)
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date range from query params (default: last 90 days)
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "90d";

    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 90);
    }

    // Fetch all leads for analysis
    const allLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.organizationId, organizationId),
          gte(leads.createdAt, startDate)
        )
      );

    // Calculate pipeline metrics
    const pipelineMetrics = calculatePipelineMetrics(allLeads);

    // Calculate revenue metrics
    const revenueMetrics = calculateRevenueMetrics(allLeads);

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(allLeads);

    // Calculate conversion funnel
    const conversionFunnel = calculateConversionFunnel(allLeads);

    // Calculate trends (weekly data for charts)
    const trends = await calculateTrends(organizationId, startDate, now);

    // Calculate top performers (mock for now - would need rep assignment data)
    const topPerformers = calculateTopPerformers(allLeads);

    return NextResponse.json({
      data: {
        pipeline: pipelineMetrics,
        revenue: revenueMetrics,
        performance: performanceMetrics,
        conversionFunnel: conversionFunnel,
        trends: trends,
        topPerformers: topPerformers,
      },
      meta: {
        range: range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        success: true,
      },
    });
  } catch (error) {
    console.error("[Sales Analytics API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales analytics" },
      { status: 500 }
    );
  }
}

/**
 * Calculate pipeline metrics by stage
 */
function calculatePipelineMetrics(allLeads: any[]) {
  const stages = {
    new: { count: 0, value: 0 },
    mql: { count: 0, value: 0 },
    sql: { count: 0, value: 0 },
    proposal: { count: 0, value: 0 },
    "closed-won": { count: 0, value: 0 },
    "closed-lost": { count: 0, value: 0 },
  };

  allLeads.forEach((lead) => {
    const status = lead.status || "new";
    if (stages[status as keyof typeof stages]) {
      stages[status as keyof typeof stages].count++;
      // Estimate deal value from lead score
      const estimatedValue = estimateDealValue(lead);
      stages[status as keyof typeof stages].value += estimatedValue;
    }
  });

  return {
    stages: Object.entries(stages).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
    })),
    totalValue: stages.new.value + stages.mql.value + stages.sql.value + stages.proposal.value,
    wonValue: stages["closed-won"].value,
    lostValue: stages["closed-lost"].value,
  };
}

/**
 * Calculate revenue metrics
 */
function calculateRevenueMetrics(allLeads: any[]) {
  const wonLeads = allLeads.filter((l) => l.status === "closed-won");
  const totalRevenue = wonLeads.reduce((sum, lead) => sum + estimateDealValue(lead), 0);

  // Calculate monthly recurring revenue (assume 20% of deals are recurring)
  const mrr = totalRevenue * 0.2 / 12;
  const arr = mrr * 12;

  // Calculate forecast (pipeline value * average win rate)
  const pipelineLeads = allLeads.filter(
    (l) => !["closed-won", "closed-lost"].includes(l.status || "")
  );
  const pipelineValue = pipelineLeads.reduce((sum, lead) => sum + estimateDealValue(lead), 0);
  const winRate = wonLeads.length / Math.max(allLeads.length, 1);
  const forecast = pipelineValue * winRate;

  return {
    totalRevenue,
    mrr,
    arr,
    forecast,
    wonDeals: wonLeads.length,
    averageDealSize: wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0,
  };
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(allLeads: any[]) {
  const closedLeads = allLeads.filter((l) =>
    ["closed-won", "closed-lost"].includes(l.status || "")
  );
  const wonLeads = allLeads.filter((l) => l.status === "closed-won");

  const winRate = closedLeads.length > 0 ? wonLeads.length / closedLeads.length : 0;

  // Calculate average sales cycle (days from created to closed)
  let totalCycleDays = 0;
  let cycleCount = 0;

  closedLeads.forEach((lead) => {
    if (lead.createdAt && lead.updatedAt) {
      const created = new Date(lead.createdAt);
      const closed = new Date(lead.updatedAt);
      const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      totalCycleDays += days;
      cycleCount++;
    }
  });

  const avgSalesCycle = cycleCount > 0 ? totalCycleDays / cycleCount : 0;

  return {
    winRate: Math.round(winRate * 100),
    lossRate: Math.round((1 - winRate) * 100),
    avgSalesCycle: Math.round(avgSalesCycle),
    totalDeals: closedLeads.length,
    activeDeals: allLeads.length - closedLeads.length,
  };
}

/**
 * Calculate conversion funnel
 */
function calculateConversionFunnel(allLeads: any[]) {
  const funnel = [
    { stage: "Total Leads", count: allLeads.length, percentage: 100 },
    {
      stage: "MQL",
      count: allLeads.filter((l) => ["mql", "sql", "proposal", "closed-won"].includes(l.status || "")).length,
      percentage: 0,
    },
    {
      stage: "SQL",
      count: allLeads.filter((l) => ["sql", "proposal", "closed-won"].includes(l.status || "")).length,
      percentage: 0,
    },
    {
      stage: "Proposal",
      count: allLeads.filter((l) => ["proposal", "closed-won"].includes(l.status || "")).length,
      percentage: 0,
    },
    {
      stage: "Closed Won",
      count: allLeads.filter((l) => l.status === "closed-won").length,
      percentage: 0,
    },
  ];

  // Calculate percentages
  funnel.forEach((step, index) => {
    if (index > 0 && funnel[0].count > 0) {
      step.percentage = Math.round((step.count / funnel[0].count) * 100);
    }
  });

  return funnel;
}

/**
 * Calculate trends over time
 */
async function calculateTrends(organizationId: string, startDate: Date, endDate: Date) {
  // Generate weekly buckets
  const weeks: any[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 7);

    weeks.push({
      week: weekStart.toISOString().split("T")[0],
      newLeads: 0,
      wonDeals: 0,
      revenue: 0,
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Fetch leads and aggregate by week
  const allLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate)
      )
    );

  allLeads.forEach((lead) => {
    const leadDate = new Date(lead.createdAt);
    const weekIndex = Math.floor(
      (leadDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weekIndex >= 0 && weekIndex < weeks.length) {
      weeks[weekIndex].newLeads++;

      if (lead.status === "closed-won") {
        weeks[weekIndex].wonDeals++;
        weeks[weekIndex].revenue += estimateDealValue(lead);
      }
    }
  });

  return weeks;
}

/**
 * Calculate top performers
 */
function calculateTopPerformers(allLeads: any[]) {
  // Group by assignedTo (if available)
  const performerMap: Record<string, { name: string; deals: number; revenue: number }> = {};

  allLeads.forEach((lead) => {
    const assignedTo = lead.assignedTo || "Unassigned";

    if (!performerMap[assignedTo]) {
      performerMap[assignedTo] = {
        name: assignedTo,
        deals: 0,
        revenue: 0,
      };
    }

    if (lead.status === "closed-won") {
      performerMap[assignedTo].deals++;
      performerMap[assignedTo].revenue += estimateDealValue(lead);
    }
  });

  return Object.values(performerMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

/**
 * Estimate deal value from lead data
 */
function estimateDealValue(lead: any): number {
  // Use explicit value if available
  if (lead.dealValue) return lead.dealValue;

  // Estimate from lead score (higher score = higher value)
  const baseValue = 5000;
  const scoreMultiplier = Math.min((lead.leadScore || 0) / 50, 2);
  return Math.round(baseValue * scoreMultiplier);
}
