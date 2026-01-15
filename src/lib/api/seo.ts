/**
 * SEO/Audit API Client
 * Centralized functions for calling SEO and Audit-related backend APIs
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

// Audit Types
export interface Audit {
  id: string;
  url: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  createdAt: string;
  completedAt?: string;
  results?: AuditResults;
}

export interface AuditResults {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  performanceScore: number;
  issues: AuditIssue[];
  recommendations: AuditRecommendation[];
}

export interface AuditIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  affectedPages?: string[];
}

export interface AuditRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
}

export interface AuditListResponse {
  data: Audit[];
  meta: {
    total: number;
    success: boolean;
  };
}

/**
 * SEO/Audit API Functions
 */

export async function getAudits(): Promise<AuditListResponse> {
  // For now, return mock data since Audit API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    data: [],
    meta: {
      total: 0,
      success: true,
    },
  };
}

export async function getAudit(id: string): Promise<{ data: Audit; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/audit/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

export async function createAudit(url: string): Promise<{ data: Audit; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/audit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ url }),
  });

  return handleResponse(response);
}
