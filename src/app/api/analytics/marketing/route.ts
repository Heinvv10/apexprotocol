/**
 * Marketing Analytics API Route
 * Provides marketing performance metrics and campaign analytics
 * GET /api/analytics/marketing - Get comprehensive marketing analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { campaigns, leads, emailEvents, emailLists, metrics } from "@/lib/db/schema/marketing";
import { eq, and, gte, lte, sql, desc, count, sum, avg } from "drizzle-orm";

/**
 * GET /api/analytics/marketing
 * Returns comprehensive marketing analytics including:
 * - Campaign performance (ROI, conversions, engagement)
 * - Channel performance (email, social, content)
 * - Lead generation metrics (by source, by campaign)
 * - Email metrics (open rate, click rate, engagement)
 * - Content performance (top performing content)
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date range from query params (default: last 30 days)
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

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
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch campaign performance
    const campaignPerformance = await getCampaignPerformance(organizationId, startDate, now);

    // Fetch email performance
    const emailPerformance = await getEmailPerformance(organizationId, startDate, now);

    // Fetch lead generation metrics
    const leadGeneration = await getLeadGeneration(organizationId, startDate, now);

    // Fetch channel performance
    const channelPerformance = await getChannelPerformance(organizationId, startDate, now);

    // Calculate marketing funnel
    const marketingFunnel = await getMarketingFunnel(organizationId, startDate, now);

    // Calculate trends
    const trends = await getMarketingTrends(organizationId, startDate, now);

    return NextResponse.json({
      data: {
        campaigns: campaignPerformance,
        email: emailPerformance,
        leadGeneration: leadGeneration,
        channels: channelPerformance,
        funnel: marketingFunnel,
        trends: trends,
      },
      meta: {
        range: range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        success: true,
      },
    });
  } catch (error) {
    console.error("[Marketing Analytics API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing analytics" },
      { status: 500 }
    );
  }
}

/**
 * Get campaign performance metrics
 */
async function getCampaignPerformance(organizationId: string, startDate: Date, endDate: Date) {
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.organizationId, organizationId),
        gte(campaigns.createdAt, startDate)
      )
    )
    .orderBy(desc(campaigns.createdAt));

  // Calculate aggregate metrics
  let totalSpend = 0;
  let totalRevenue = 0;
  let totalConversions = 0;

  const campaignMetrics = await Promise.all(
    allCampaigns.map(async (campaign) => {
      // Fetch metrics for this campaign
      const campaignMetrics = await db
        .select()
        .from(metrics)
        .where(eq(metrics.campaignId, campaign.id))
        .limit(1);

      const metric = campaignMetrics[0];

      const spent = campaign.budget || 0;
      const revenue = metric?.revenue || 0;
      const conversions = metric?.conversions || 0;
      const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

      totalSpend += spent;
      totalRevenue += revenue;
      totalConversions += conversions;

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        spent: spent,
        revenue: revenue,
        conversions: conversions,
        roi: Math.round(roi),
        impressions: metric?.impressions || 0,
        clicks: metric?.clicks || 0,
        opens: metric?.opens || 0,
      };
    })
  );

  const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  return {
    campaigns: campaignMetrics,
    totals: {
      campaigns: allCampaigns.length,
      spent: totalSpend,
      revenue: totalRevenue,
      conversions: totalConversions,
      roi: Math.round(totalROI),
    },
  };
}

/**
 * Get email performance metrics
 */
async function getEmailPerformance(organizationId: string, startDate: Date, endDate: Date) {
  // Get all email events in date range
  const allEvents = await db
    .select({
      eventType: emailEvents.eventType,
      count: count(),
    })
    .from(emailEvents)
    .where(
      and(
        eq(emailEvents.organizationId, organizationId),
        gte(emailEvents.timestamp, startDate)
      )
    )
    .groupBy(emailEvents.eventType);

  const eventMap: Record<string, number> = {};
  allEvents.forEach((event) => {
    eventMap[event.eventType] = event.count;
  });

  const sent = eventMap.sent || 0;
  const delivered = eventMap.delivered || 0;
  const opened = eventMap.opened || 0;
  const clicked = eventMap.clicked || 0;
  const bounced = eventMap.bounced || 0;
  const unsubscribed = eventMap.unsubscribed || 0;

  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
  const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
  const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

  // Get list growth
  const totalLists = await db
    .select({ count: count() })
    .from(emailLists)
    .where(eq(emailLists.organizationId, organizationId));

  const totalSubscribers = await db
    .select({ total: sum(emailLists.subscriberCount) })
    .from(emailLists)
    .where(eq(emailLists.organizationId, organizationId));

  return {
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    unsubscribed,
    deliveryRate: Math.round(deliveryRate),
    openRate: Math.round(openRate),
    clickRate: Math.round(clickRate),
    bounceRate: Math.round(bounceRate),
    unsubscribeRate: Math.round(unsubscribeRate * 10) / 10, // One decimal
    totalLists: totalLists[0]?.count || 0,
    totalSubscribers: Number(totalSubscribers[0]?.total || 0),
  };
}

/**
 * Get lead generation metrics
 */
async function getLeadGeneration(organizationId: string, startDate: Date, endDate: Date) {
  // Get all leads by source
  const leadsBySource = await db
    .select({
      source: leads.source,
      count: count(),
      avgScore: avg(leads.leadScore),
    })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate)
      )
    )
    .groupBy(leads.source);

  // Calculate cost per lead (from campaigns)
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.organizationId, organizationId),
        gte(campaigns.createdAt, startDate)
      )
    );

  const totalSpend = allCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalLeads = leadsBySource.reduce((sum, s) => sum + s.count, 0);
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

  // Get MQL/SQL counts
  const qualifiedLeads = await db
    .select({
      status: leads.status,
      count: count(),
    })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate)
      )
    )
    .groupBy(leads.status);

  const statusMap: Record<string, number> = {};
  qualifiedLeads.forEach((item) => {
    statusMap[item.status] = item.count;
  });

  const mqlCount = statusMap.mql || 0;
  const sqlCount = statusMap.sql || 0;

  return {
    totalLeads,
    costPerLead: Math.round(costPerLead),
    mqlCount,
    sqlCount,
    mqlRate: totalLeads > 0 ? Math.round((mqlCount / totalLeads) * 100) : 0,
    sqlRate: totalLeads > 0 ? Math.round((sqlCount / totalLeads) * 100) : 0,
    bySource: leadsBySource.map((item) => ({
      source: item.source,
      count: item.count,
      avgScore: Math.round(Number(item.avgScore || 0)),
    })),
  };
}

/**
 * Get channel performance
 */
async function getChannelPerformance(organizationId: string, startDate: Date, endDate: Date) {
  const campaignsByType = await db
    .select({
      type: campaigns.type,
      count: count(),
      totalBudget: sum(campaigns.budget),
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.organizationId, organizationId),
        gte(campaigns.createdAt, startDate)
      )
    )
    .groupBy(campaigns.type);

  // Get leads by campaign type (approximate via source)
  const leadsBySource = await db
    .select({
      source: leads.source,
      count: count(),
    })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate)
      )
    )
    .groupBy(leads.source);

  // Map channels
  const channels = [
    { name: "Email", type: "email", campaigns: 0, budget: 0, leads: 0 },
    { name: "Social Media", type: "social", campaigns: 0, budget: 0, leads: 0 },
    { name: "Content", type: "content", campaigns: 0, budget: 0, leads: 0 },
    { name: "Webinar", type: "webinar", campaigns: 0, budget: 0, leads: 0 },
    { name: "Landing Page", type: "landing_page", campaigns: 0, budget: 0, leads: 0 },
  ];

  campaignsByType.forEach((item) => {
    const channel = channels.find((c) => c.type === item.type);
    if (channel) {
      channel.campaigns = item.count;
      channel.budget = Number(item.totalBudget || 0);
    }
  });

  // Map leads to channels (heuristic)
  leadsBySource.forEach((item) => {
    const source = item.source.toLowerCase();
    if (source.includes("email")) {
      channels[0].leads += item.count;
    } else if (source.includes("social") || source.includes("linkedin") || source.includes("twitter")) {
      channels[1].leads += item.count;
    } else if (source.includes("blog") || source.includes("content")) {
      channels[2].leads += item.count;
    } else if (source.includes("webinar")) {
      channels[3].leads += item.count;
    } else if (source.includes("landing")) {
      channels[4].leads += item.count;
    }
  });

  return channels.map((channel) => ({
    ...channel,
    costPerLead: channel.leads > 0 ? Math.round(channel.budget / channel.leads) : 0,
  }));
}

/**
 * Get marketing funnel
 */
async function getMarketingFunnel(organizationId: string, startDate: Date, endDate: Date) {
  const totalLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate)
      )
    );

  const mqlLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate),
        sql`${leads.status} IN ('mql', 'sql', 'proposal', 'closed-won')`
      )
    );

  const sqlLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate),
        sql`${leads.status} IN ('sql', 'proposal', 'closed-won')`
      )
    );

  const customers = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, startDate),
        eq(leads.status, "closed-won")
      )
    );

  const total = totalLeads[0]?.count || 0;

  return [
    { stage: "Total Leads", count: total, percentage: 100 },
    {
      stage: "MQL",
      count: mqlLeads[0]?.count || 0,
      percentage: total > 0 ? Math.round(((mqlLeads[0]?.count || 0) / total) * 100) : 0,
    },
    {
      stage: "SQL",
      count: sqlLeads[0]?.count || 0,
      percentage: total > 0 ? Math.round(((sqlLeads[0]?.count || 0) / total) * 100) : 0,
    },
    {
      stage: "Customer",
      count: customers[0]?.count || 0,
      percentage: total > 0 ? Math.round(((customers[0]?.count || 0) / total) * 100) : 0,
    },
  ];
}

/**
 * Get marketing trends over time
 */
async function getMarketingTrends(organizationId: string, startDate: Date, endDate: Date) {
  // Generate weekly buckets
  const weeks: any[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 7);

    weeks.push({
      week: weekStart.toISOString().split("T")[0],
      leads: 0,
      campaigns: 0,
      emailsSent: 0,
      spend: 0,
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Aggregate leads by week
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
      weeks[weekIndex].leads++;
    }
  });

  // Aggregate campaigns by week
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.organizationId, organizationId),
        gte(campaigns.createdAt, startDate)
      )
    );

  allCampaigns.forEach((campaign) => {
    const campaignDate = new Date(campaign.createdAt);
    const weekIndex = Math.floor(
      (campaignDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weekIndex >= 0 && weekIndex < weeks.length) {
      weeks[weekIndex].campaigns++;
      weeks[weekIndex].spend += campaign.budget || 0;
    }
  });

  return weeks;
}
