/**
 * CRM Leads API Route
 * Wraps Mautic API for lead management
 * GET  /api/crm/leads - Get all leads
 * POST /api/crm/leads - Create new lead
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

/**
 * Mautic API Client for Leads
 */
class MauticLeadsClient {
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
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error("[Mautic] Authentication error:", error);
      throw error;
    }
  }

  /**
   * Fetch all leads from Mautic
   */
  async getLeads(): Promise<any[]> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/api/contacts?limit=100`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }

      const data = await response.json();
      return data.contacts ? Object.values(data.contacts) : [];
    } catch (error) {
      console.error("[Mautic] Error fetching leads:", error);
      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  /**
   * Transform Mautic contact to Lead format
   */
  transformLead(contact: any): any {
    return {
      id: contact.id?.toString() || "",
      firstName: contact.fields?.core?.firstname?.value || "",
      lastName: contact.fields?.core?.lastname?.value || "",
      email: contact.fields?.core?.email?.value || "",
      company: contact.fields?.core?.company?.value || "",
      phone: contact.fields?.core?.phone?.value || "",
      status: this.mapStatus(contact.points || 0),
      source: contact.fields?.core?.source?.value || "unknown",
      leadScore: contact.points || 0,
      mqlScore: this.calculateMQLScore(contact),
      sqlScore: this.calculateSQLScore(contact),
      emailOpens: contact.stats?.emailOpens || 0,
      lastActivity: contact.lastActive || new Date().toISOString(),
      assignedTo: contact.owner?.firstName
        ? `${contact.owner.firstName} ${contact.owner.lastName}`
        : undefined,
      tags: contact.tags?.map((tag: any) => tag.tag) || [],
      lastContactDate: contact.lastActive || undefined,
      createdAt: contact.dateAdded || undefined,
      updatedAt: contact.dateModified || undefined,
    };
  }

  /**
   * Map lead score to status
   */
  private mapStatus(points: number): "new" | "mql" | "sql" | "proposal" | "closed-won" | "closed-lost" {
    if (points >= 100) return "sql";
    if (points >= 50) return "mql";
    return "new";
  }

  /**
   * Calculate MQL score (Marketing Qualified Lead)
   */
  private calculateMQLScore(contact: any): number {
    let score = contact.points || 0;

    // Boost score based on engagement
    if (contact.stats?.emailOpens > 5) score += 10;
    if (contact.stats?.emailClicks > 3) score += 15;
    if (contact.stats?.pageViews > 10) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Calculate SQL score (Sales Qualified Lead)
   */
  private calculateSQLScore(contact: any): number {
    let score = this.calculateMQLScore(contact);

    // Boost score based on sales readiness
    if (contact.fields?.core?.company?.value) score += 10;
    if (contact.fields?.core?.phone?.value) score += 10;
    if (contact.owner) score += 15; // Has assigned owner

    return Math.min(score, 100);
  }
}

/**
 * GET /api/crm/leads
 * Fetch all leads from Mautic CRM
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new MauticLeadsClient();
    const mauticContacts = await client.getLeads();

    // Transform Mautic contacts to Lead format
    const leads = mauticContacts.map((contact) => client.transformLead(contact));

    return NextResponse.json({
      data: leads,
      meta: {
        total: leads.length,
        success: true,
      },
    });
  } catch (error) {
    console.error("[CRM Leads API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leads",
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
 * POST /api/crm/leads
 * Create a new lead in Mautic CRM
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, company, phone, source } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const client = new MauticLeadsClient();
    const token = await client.authenticate();

    // Create contact in Mautic
    const response = await fetch(`${client["baseUrl"]}/api/contacts/new`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstname: firstName,
        lastname: lastName,
        email: email,
        company: company,
        phone: phone,
        source: source || "apex",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create lead: ${response.statusText}`);
    }

    const data = await response.json();
    const lead = client.transformLead(data.contact);

    return NextResponse.json({
      data: lead,
      meta: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[CRM Leads API] Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
