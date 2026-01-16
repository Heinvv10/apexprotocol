/**
 * Marketing API Client
 * Centralized functions for calling marketing-related backend APIs
 */

import { getOrganizationId } from "@/lib/auth";

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

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: "active" | "draft" | "completed" | "paused";
  type?: "email" | "social" | "webinar" | "landing_page" | "content" | "retargeting";
  emails?: number;
  leads?: number;
  budget?: number;
  spend?: number;
  revenue?: number;
  roi?: number;
  opens?: number;
  clicks?: number;
  conversions?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: {
    subjects?: string[];
    abTest?: boolean;
    winner?: "A" | "B";
    [key: string]: unknown;
  };
}

export interface CampaignListResponse {
  data: Campaign[];
  meta: {
    total: number;
    success: boolean;
  };
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  listId?: string;
  type?: Campaign["type"];
  budget?: number;
  startDate?: string;
  endDate?: string;
}

// Email List Types
export interface EmailList {
  id: string;
  name: string;
  description?: string;
  subscribers: number;
  subscriberCount?: number;
  activeSubscribers?: number;
  unsubscribeCount?: number;
  bounceCount?: number;
  openRate?: number;
  clickRate?: number;
  growthRate?: number;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: {
    tags?: string[];
    automation?: boolean;
    listmonkId?: string;
    [key: string]: unknown;
  };
}

export interface EmailListResponse {
  data: EmailList[];
  meta: {
    total: number;
    success: boolean;
  };
}

// Analytics Types
export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  conversions: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  roi: number;
}

export interface MarketingAnalyticsResponse {
  data: {
    campaigns: CampaignMetrics[];
    totals: {
      totalSent: number;
      totalOpened: number;
      totalClicked: number;
      totalConversions: number;
      totalRevenue: number;
      totalSpend: number;
      avgOpenRate: number;
      avgClickRate: number;
      avgConversionRate: number;
      overallROI: number;
    };
  };
  meta: {
    success: boolean;
  };
}

// Social Media Types
export interface SocialPost {
  id: string;
  platform: "linkedin" | "twitter" | "instagram" | "youtube" | "tiktok";
  content: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  engagement?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  createdAt: string;
}

export interface SocialMediaResponse {
  data: SocialPost[];
  meta: {
    total: number;
    success: boolean;
  };
}

/**
 * Campaign API Functions
 */

export async function getCampaigns(): Promise<CampaignListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/campaigns`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<CampaignListResponse>(response);
}

export async function getCampaign(id: string): Promise<{ data: Campaign; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/campaigns/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

export async function createCampaign(data: CreateCampaignRequest): Promise<{ data: Campaign; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function updateCampaign(id: string, data: Partial<CreateCampaignRequest>): Promise<{ data: Campaign; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/campaigns/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function deleteCampaign(id: string): Promise<{ meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/campaigns/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

/**
 * Email List API Functions
 */

export async function getEmailLists(): Promise<EmailListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/emails`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<EmailListResponse>(response);
}

export async function getEmailList(id: string): Promise<{ data: EmailList; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/emails/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

/**
 * Marketing Analytics API Functions
 */

export async function getMarketingAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  campaignIds?: string[];
}): Promise<MarketingAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.campaignIds) queryParams.append("campaignIds", params.campaignIds.join(","));

  const response = await fetch(`${API_BASE_URL}/api/marketing/analytics?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<MarketingAnalyticsResponse>(response);
}

/**
 * Social Media API Functions
 */

export async function getSocialPosts(params?: {
  platform?: string;
  status?: string;
}): Promise<SocialMediaResponse> {
  const queryParams = new URLSearchParams();
  if (params?.platform) queryParams.append("platform", params.platform);
  if (params?.status) queryParams.append("status", params.status);

  const response = await fetch(`${API_BASE_URL}/api/marketing/social?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<SocialMediaResponse>(response);
}

export async function createSocialPost(data: {
  platform: SocialPost["platform"];
  content: string;
  scheduledAt?: string;
}): Promise<{ data: SocialPost; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/social`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

/**
 * Email Sequence Types
 */

export interface SequenceEmail {
  id: string;
  subject: string;
  delay: number; // hours
  template?: string;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  status?: "active" | "draft" | "paused";
  trigger?: "immediate" | "delayed" | "event" | "behavior";
  triggerType?: string;
  triggerDelay?: number;
  emails?: SequenceEmail[];
  emailIds?: string[];
  isTemplate?: boolean;
  isActive?: boolean;
  enrollmentCount?: number;
  conversionCount?: number;
  conversionRate?: number;
  stats?: {
    subscribers: number;
    sent: number;
    opened: number;
    clicked: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface SequenceListResponse {
  data: Sequence[];
  meta: {
    total: number;
    success: boolean;
  };
}

/**
 * Email Template Types
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content?: string;
  description?: string;
  category: "welcome" | "promotional" | "transactional" | "newsletter" | "custom";
  status?: string;
  useCount?: number;
  openRate?: number;
  clickRate?: number;
  lastUsed?: string;
  tags?: string[];
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface EmailTemplateListResponse {
  data: EmailTemplate[];
  meta: {
    total: number;
    success: boolean;
  };
}

/**
 * Content Calendar Types
 */

export interface CalendarEvent {
  id: string;
  title: string;
  type: "email" | "social" | "blog" | "webinar" | "event";
  status: "draft" | "scheduled" | "published" | "cancelled" | "in_review" | "in_progress";
  scheduledDate?: string;
  publishDate?: string;
  campaignId?: string;
  assignee?: string;
  description?: string;
  channel?: string;
  author?: string;
  tags?: string[];
  wordCount?: number;
  approver?: string | null;
  approvedAt?: string | null;
}

export interface ContentCalendarResponse {
  data: CalendarEvent[];
  meta: {
    total: number;
    success: boolean;
  };
}

/**
 * Marketing Overview Types
 */

export interface MarketingOverviewResponse {
  data: {
    campaigns: {
      total: number;
      active: number;
      avgROI: number;
    };
    emailLists: {
      total: number;
      totalSubscribers: number;
      avgOpenRate: number;
      avgClickRate: number;
    };
    sequences: {
      total: number;
      active: number;
      avgConversionRate: number;
    };
    contentCalendar: {
      scheduled: number;
      published: number;
      draft: number;
    };
  };
  meta: {
    success: boolean;
  };
}

/**
 * Email Sequence API Functions
 */

export async function getSequences(): Promise<SequenceListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/sequences`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<SequenceListResponse>(response);
}

export async function getSequence(id: string): Promise<{ data: Sequence; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/sequences/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

/**
 * Email Template API Functions
 */

export async function getEmailTemplates(): Promise<EmailTemplateListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/templates`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<EmailTemplateListResponse>(response);
}

export async function getEmailTemplate(id: string): Promise<{ data: EmailTemplate; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/templates/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

/**
 * Content Calendar API Functions
 */

export async function getContentCalendar(params?: {
  startDate?: string;
  endDate?: string;
  type?: string;
}): Promise<ContentCalendarResponse> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.type) queryParams.append("type", params.type);

  const response = await fetch(`${API_BASE_URL}/api/marketing/calendar?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<ContentCalendarResponse>(response);
}

/**
 * Marketing Overview API Functions
 */

export async function getMarketingOverview(): Promise<MarketingOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/marketing/overview`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<MarketingOverviewResponse>(response);
}
