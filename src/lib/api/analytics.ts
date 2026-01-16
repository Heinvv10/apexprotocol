/**
 * Analytics API Client
 * Centralized functions for calling Analytics-related backend APIs
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

// Analytics Types
export interface AnalyticsDashboard {
  geoScore: number;
  geoTrend: "up" | "down" | "stable";
  smoScore: number;
  smoTrend: "up" | "down" | "stable";
  totalMentions: number;
  mentionsTrend: number;
  avgSentiment: number;
  sentimentTrend: number;
  platformBreakdown: Array<{
    platform: string;
    mentions: number;
    sentiment: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    geoScore: number;
    smoScore: number;
    mentions: number;
  }>;
}

export interface UnifiedScore {
  overallScore: number;
  geoScore: number;
  smoScore: number;
  breakdown: {
    visibility: number;
    engagement: number;
    sentiment: number;
    authority: number;
  };
  lastUpdated: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalLeads: number;
  leadsGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  avgDealSize: number;
  dealSizeGrowth: number;
  topChannels: Array<{
    channel: string;
    revenue: number;
    leads: number;
    conversions: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "lead" | "deal" | "campaign";
    title: string;
    value: number;
    timestamp: string;
  }>;
}

export interface SalesMetrics {
  pipeline: {
    totalValue: number;
    totalChange: number;
    dealCount: number;
    avgDealSize: number;
    avgDealSizeChange: number;
    byStage: Array<{
      stage: string;
      count: number;
      value: number;
      avgAge: number;
    }>;
  };
  conversions: {
    prospectToQualification: number;
    qualificationToProposal: number;
    proposalToNegotiation: number;
    negotiationToClosing: number;
    closingToWon: number;
    overallWinRate: number;
  };
  performance: {
    dealsWon: number;
    dealsLost: number;
    avgSalesCycle: number;
    avgSalesCycleChange: number;
    revenue: number;
    revenueChange: number;
  };
  dealSizeDistribution: Array<{
    range: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  topPerformers: Array<{
    name: string;
    dealsWon: number;
    revenue: number;
    avgDealSize: number;
    winRate: number;
    salesCycle: number;
  }>;
  lossReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  forecast: {
    thisMonth: {
      expected: number;
      committed: number;
      bestCase: number;
      worstCase: number;
    };
    nextMonth: {
      expected: number;
      committed: number;
      bestCase: number;
      worstCase: number;
    };
    nextQuarter: {
      expected: number;
      committed: number;
      bestCase: number;
      worstCase: number;
    };
  };
  sourcePerformance: Array<{
    source: string;
    leads: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgDealSize: number;
  }>;
}

export interface MarketingMetrics {
  overview: {
    totalSpend: number;
    totalSpendChange: number;
    leadsGenerated: number;
    leadsGeneratedChange: number;
    costPerLead: number;
    costPerLeadChange: number;
    roi: number;
    roiChange: number;
  };
  emailPerformance: {
    totalSent: number;
    openRate: number;
    openRateChange: number;
    clickRate: number;
    clickRateChange: number;
    unsubscribeRate: number;
    unsubscribeRateChange: number;
    bounceRate: number;
    bounceRateChange: number;
  };
  campaignPerformance: Array<{
    id: string;
    name: string;
    type: string;
    status: "active" | "completed" | "paused";
    spend: number;
    leads: number;
    conversions: number;
    revenue: number;
    roi: number;
    startDate: string;
    endDate: string;
  }>;
  channelPerformance: Array<{
    channel: string;
    spend: number;
    leads: number;
    conversions: number;
    revenue: number;
    roi: number;
    costPerLead: number;
  }>;
  contentPerformance: Array<{
    title: string;
    type: string;
    views: number;
    leads: number;
    conversions: number;
    conversionRate: number;
    publishedDays: number;
  }>;
  audienceGrowth: {
    totalContacts: number;
    newThisMonth: number;
    activeSubscribers: number;
    unsubscribedThisMonth: number;
    growthRate: number;
  };
  funnelMetrics: {
    visitors: number;
    leads: number;
    mql: number;
    sql: number;
    customers: number;
    visitorToLeadRate: number;
    leadToMqlRate: number;
    mqlToSqlRate: number;
    sqlToCustomerRate: number;
  };
}

export interface Report {
  id: string;
  name: string;
  type: "sales" | "marketing" | "analytics" | "custom";
  category: string;
  description: string;
  schedule: "daily" | "weekly" | "monthly" | "on-demand";
  format: "pdf" | "csv" | "xlsx" | "json";
  lastRun: string;
  nextRun: string;
  status: "active" | "paused" | "draft";
  recipients: string[];
  metrics: string[];
  createdBy: string;
  createdAt: string;
}

export interface ReportsList {
  reports: Report[];
  totalReports: number;
}

/**
 * Analytics API Functions
 */

export async function getAnalyticsDashboard(brandId: string): Promise<AnalyticsDashboard> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    geoScore: 0,
    geoTrend: "stable",
    smoScore: 0,
    smoTrend: "stable",
    totalMentions: 0,
    mentionsTrend: 0,
    avgSentiment: 0,
    sentimentTrend: 0,
    platformBreakdown: [],
    timeSeriesData: [],
  };
}

export async function getUnifiedScore(brandId: string): Promise<UnifiedScore> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    overallScore: 0,
    geoScore: 0,
    smoScore: 0,
    breakdown: {
      visibility: 0,
      engagement: 0,
      sentiment: 0,
      authority: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalLeads: 0,
    leadsGrowth: 0,
    conversionRate: 0,
    conversionGrowth: 0,
    avgDealSize: 0,
    dealSizeGrowth: 0,
    topChannels: [],
    recentActivity: [],
  };
}

export async function getSalesMetrics(): Promise<SalesMetrics> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    pipeline: {
      totalValue: 0,
      totalChange: 0,
      dealCount: 0,
      avgDealSize: 0,
      avgDealSizeChange: 0,
      byStage: [],
    },
    conversions: {
      prospectToQualification: 0,
      qualificationToProposal: 0,
      proposalToNegotiation: 0,
      negotiationToClosing: 0,
      closingToWon: 0,
      overallWinRate: 0,
    },
    performance: {
      dealsWon: 0,
      dealsLost: 0,
      avgSalesCycle: 0,
      avgSalesCycleChange: 0,
      revenue: 0,
      revenueChange: 0,
    },
    dealSizeDistribution: [],
    topPerformers: [],
    lossReasons: [],
    forecast: {
      thisMonth: { expected: 0, committed: 0, bestCase: 0, worstCase: 0 },
      nextMonth: { expected: 0, committed: 0, bestCase: 0, worstCase: 0 },
      nextQuarter: { expected: 0, committed: 0, bestCase: 0, worstCase: 0 },
    },
    sourcePerformance: [],
  };
}

export async function getMarketingMetrics(): Promise<MarketingMetrics> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    overview: {
      totalSpend: 0,
      totalSpendChange: 0,
      leadsGenerated: 0,
      leadsGeneratedChange: 0,
      costPerLead: 0,
      costPerLeadChange: 0,
      roi: 0,
      roiChange: 0,
    },
    emailPerformance: {
      totalSent: 0,
      openRate: 0,
      openRateChange: 0,
      clickRate: 0,
      clickRateChange: 0,
      unsubscribeRate: 0,
      unsubscribeRateChange: 0,
      bounceRate: 0,
      bounceRateChange: 0,
    },
    campaignPerformance: [],
    channelPerformance: [],
    contentPerformance: [],
    audienceGrowth: {
      totalContacts: 0,
      newThisMonth: 0,
      activeSubscribers: 0,
      unsubscribedThisMonth: 0,
      growthRate: 0,
    },
    funnelMetrics: {
      visitors: 0,
      leads: 0,
      mql: 0,
      sql: 0,
      customers: 0,
      visitorToLeadRate: 0,
      leadToMqlRate: 0,
      mqlToSqlRate: 0,
      sqlToCustomerRate: 0,
    },
  };
}

export async function getReports(): Promise<ReportsList> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    reports: [],
    totalReports: 0,
  };
}
