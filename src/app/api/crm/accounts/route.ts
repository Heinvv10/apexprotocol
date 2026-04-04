/**
 * CRM Accounts API Route
 * Wraps Mautic API for company/account management
 * GET  /api/crm/accounts - Get all accounts
 * POST /api/crm/accounts - Create new account
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/clerk";

/**
 * Mautic API Client for Accounts/Companies
 */
class MauticAccountsClient {
  private baseUrl: string;
  private credentials: {
    username: string;
    password: string;
  };
  private accessToken?: string;

  constructor() {
    this.baseUrl = process.env.MAUTIC_URL || "http://localhost:8000";
    this.credentials = {
      username: process.env.MAUTIC_USERNAME || "admin",
      password: process.env.MAUTIC_PASSWORD || "password",
    };
  }

  /**
   * Authenticate with Mautic using password grant
   */
  async authenticate(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "password",
          client_id: process.env.MAUTIC_CLIENT_ID || "",
          client_secret: process.env.MAUTIC_CLIENT_SECRET || "",
          username: this.credentials.username,
          password: this.credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mautic authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token as string;
      return this.accessToken;
    } catch (error) {
      console.error("[Mautic] Authentication error:", error);
      throw error;
    }
  }

  /**
   * Fetch all companies from Mautic
   */
  async getAccounts(): Promise<any[]> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/api/companies?limit=100`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.companies ? Object.values(data.companies) : [];
    } catch (error) {
      console.error("[Mautic] Error fetching accounts:", error);
      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  /**
   * Transform Mautic company to Account format
   */
  transformAccount(company: any): any {
    // Calculate health score based on activity and engagement
    const healthScore = this.calculateHealthScore(company);

    // Determine status based on health score and activity
    let status: "active" | "inactive" | "at_risk" = "active";
    if (healthScore < 40) status = "at_risk";
    if (!company.lastActive || this.isDaysOld(company.lastActive, 90)) status = "inactive";

    return {
      id: company.id?.toString() || "",
      name: company.fields?.core?.companyname?.value || company.name || "Unknown Company",
      industry: company.fields?.core?.companyindustry?.value || "Unknown",
      size: company.fields?.core?.companysize?.value || this.inferSize(company),
      location: this.buildLocation(company),
      website: company.fields?.core?.companywebsite?.value || "",
      healthScore: healthScore,
      totalContacts: company.fields?.core?.companycontacts?.value || 0,
      activeDeals: this.countActiveDeals(company),
      totalRevenue: company.fields?.core?.companyrevenue?.value || 0,
      lastActivity: company.lastActive || new Date().toISOString(),
      createdAt: company.dateAdded || new Date().toISOString(),
      status: status,
      owner: company.owner?.firstName
        ? `${company.owner.firstName} ${company.owner.lastName}`
        : undefined,
      tags: company.tags?.map((tag: any) => tag.tag) || [],
    };
  }

  /**
   * Build location string from company fields
   */
  private buildLocation(company: any): string {
    const city = company.fields?.core?.companycity?.value || "";
    const state = company.fields?.core?.companystate?.value || "";
    const country = company.fields?.core?.companycountry?.value || "";

    const parts = [city, state, country].filter(Boolean);
    return parts.join(", ") || "Unknown";
  }

  /**
   * Calculate account health score
   */
  private calculateHealthScore(company: any): number {
    let score = 50; // Base score

    // Recent activity boost
    if (company.lastActive) {
      const daysOld = this.getDaysOld(company.lastActive);
      if (daysOld < 7) score += 30;
      else if (daysOld < 30) score += 20;
      else if (daysOld < 90) score += 10;
      else score -= 20;
    }

    // Contact engagement boost
    const contacts = company.fields?.core?.companycontacts?.value || 0;
    if (contacts > 10) score += 15;
    else if (contacts > 5) score += 10;
    else if (contacts > 0) score += 5;

    // Revenue boost
    const revenue = company.fields?.core?.companyrevenue?.value || 0;
    if (revenue > 100000) score += 20;
    else if (revenue > 50000) score += 15;
    else if (revenue > 10000) score += 10;

    // Owner assignment boost
    if (company.owner) score += 10;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Infer company size from revenue or contacts
   */
  private inferSize(company: any): string {
    const revenue = company.fields?.core?.companyrevenue?.value || 0;
    const contacts = company.fields?.core?.companycontacts?.value || 0;

    if (revenue > 1000000 || contacts > 50) return "Enterprise";
    if (revenue > 100000 || contacts > 20) return "Mid-Market";
    if (revenue > 10000 || contacts > 5) return "Small Business";
    return "Startup";
  }

  /**
   * Count active deals (placeholder - would need deal API integration)
   */
  private countActiveDeals(company: any): number {
    // In real implementation, would query Mautic deals API
    // For now, return 0 or infer from company data
    return 0;
  }

  /**
   * Get days since a date
   */
  private getDaysOld(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if date is older than X days
   */
  private isDaysOld(dateString: string, days: number): boolean {
    return this.getDaysOld(dateString) > days;
  }
}

/**
 * GET /api/crm/accounts
 * Fetch all accounts from Mautic CRM
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new MauticAccountsClient();
    const mauticCompanies = await client.getAccounts();

    // Transform Mautic companies to Account format
    const accounts = mauticCompanies.map((company) => client.transformAccount(company));

    return NextResponse.json({
      data: accounts,
      meta: {
        total: accounts.length,
        success: true,
      },
    });
  } catch (error) {
    console.error("[CRM Accounts API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch accounts",
        data: [],
        meta: {
          total: 0,
          success: false,
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/accounts
 * Create a new account in Mautic CRM
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, industry, size, location, website } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const client = new MauticAccountsClient();
    const token = await client.authenticate();

    // Create company in Mautic
    const response = await fetch(`${client["baseUrl"]}/api/companies/new`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyname: name,
        companyindustry: industry,
        companysize: size,
        companycity: location,
        companywebsite: website,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create account: ${response.statusText}`);
    }

    const data = await response.json();
    const account = client.transformAccount(data.company);

    return NextResponse.json({
      data: account,
      meta: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[CRM Accounts API] Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
