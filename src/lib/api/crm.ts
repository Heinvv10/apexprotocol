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
  company: string;
  phone: string;
  status: "new" | "mql" | "sql" | "proposal" | "closed-won" | "closed-lost";
  source: string;
  leadScore: number;
  mqlScore: number;
  sqlScore: number;
  emailOpens: number;
  lastActivity: string;
  assignedTo?: string;
  tags?: string[];
  lastContactDate?: string;
  createdAt?: string;
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
  industry: string;
  size: string;
  location: string;
  website: string;
  healthScore: number;
  totalContacts: number;
  activeDeals: number;
  totalRevenue: number;
  lastActivity: string;
  createdAt: string;
  status?: "active" | "inactive" | "at_risk";
  primaryContact?: string;
  employees?: number;
  revenue?: number;
  dealValue?: number;
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
  accountId: string;
  accountName: string;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string;
  owner: string;
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
  const response = await fetch(`${API_BASE_URL}/api/crm/leads`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
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
  const response = await fetch(`${API_BASE_URL}/api/crm/accounts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
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
  const response = await fetch(`${API_BASE_URL}/api/crm/pipeline`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse(response);
}
