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
