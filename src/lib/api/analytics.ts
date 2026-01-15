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
  totalDeals: number;
  dealsWon: number;
  dealsLost: number;
  dealsInProgress: number;
  totalRevenue: number;
  avgDealSize: number;
  avgSalesCycle: number;
  winRate: number;
  pipelineByStage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    deals: number;
  }>;
  topSalesReps: Array<{
    id: string;
    name: string;
    deals: number;
    revenue: number;
  }>;
}

export interface MarketingMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  leadsThisMonth: number;
  costPerLead: number;
  campaignROI: number;
  emailOpenRate: number;
  emailClickRate: number;
  leadsBySource: Array<{
    source: string;
    leads: number;
    cost: number;
    roi: number;
  }>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    type: string;
    leads: number;
    conversions: number;
    spend: number;
    roi: number;
  }>;
}

export interface Report {
  id: string;
  name: string;
  type: "sales" | "marketing" | "analytics" | "custom";
  description: string;
  schedule: "daily" | "weekly" | "monthly" | "on-demand";
  lastRun: string;
  nextRun: string;
  status: "active" | "paused" | "draft";
  recipients: string[];
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
    totalDeals: 0,
    dealsWon: 0,
    dealsLost: 0,
    dealsInProgress: 0,
    totalRevenue: 0,
    avgDealSize: 0,
    avgSalesCycle: 0,
    winRate: 0,
    pipelineByStage: [],
    revenueByMonth: [],
    topSalesReps: [],
  };
}

export async function getMarketingMetrics(): Promise<MarketingMetrics> {
  // For now, return mock data since Analytics API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    leadsThisMonth: 0,
    costPerLead: 0,
    campaignROI: 0,
    emailOpenRate: 0,
    emailClickRate: 0,
    leadsBySource: [],
    campaignPerformance: [],
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
