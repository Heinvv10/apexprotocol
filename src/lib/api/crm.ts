/**
 * CRM API Client
 * Centralized functions for calling CRM-related backend APIs
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

// Lead Types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
  source: string;
  leadScore: number;
  mqlScore?: number;
  sqlScore?: number;
  assignedTo?: string;
  tags?: string[];
  lastContactDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadListResponse {
  data: Lead[];
  meta: {
    total: number;
    success: boolean;
  };
}

// Account Types
export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  employees?: number;
  revenue?: number;
  healthScore: number;
  status: "active" | "inactive" | "at_risk";
  primaryContact?: string;
  dealValue?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AccountListResponse {
  data: Account[];
  meta: {
    total: number;
    success: boolean;
  };
}

// Deal/Pipeline Types
export interface Deal {
  id: string;
  name: string;
  accountId?: string;
  accountName?: string;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PipelineResponse {
  data: Deal[];
  meta: {
    total: number;
    totalValue: number;
    success: boolean;
  };
}

/**
 * Lead API Functions
 */

export async function getLeads(): Promise<LeadListResponse> {
  // For now, return mock data since CRM API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    data: [],
    meta: {
      total: 0,
      success: true,
    },
  };
}

export async function getLead(id: string): Promise<{ data: Lead; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/crm/leads/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

/**
 * Account API Functions
 */

export async function getAccounts(): Promise<AccountListResponse> {
  // For now, return mock data since CRM API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    data: [],
    meta: {
      total: 0,
      success: true,
    },
  };
}

export async function getAccount(id: string): Promise<{ data: Account; meta: { success: boolean } }> {
  const response = await fetch(`${API_BASE_URL}/api/crm/accounts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}

/**
 * Pipeline API Functions
 */

export async function getPipeline(): Promise<PipelineResponse> {
  // For now, return mock data since CRM API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    data: [],
    meta: {
      total: 0,
      totalValue: 0,
      success: true,
    },
  };
}
