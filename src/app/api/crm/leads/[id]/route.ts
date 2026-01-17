/**
 * CRM Lead Detail API Route
 * GET  /api/crm/leads/[id] - Get single lead details
 * PUT  /api/crm/leads/[id] - Update lead
 * DELETE /api/crm/leads/[id] - Delete lead
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

// Mock leads data for development/fallback
const mockLeads = [
  {
    id: "lead_001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@techcorp.com",
    company: "TechCorp Industries",
    phone: "+1 (555) 123-4567",
    status: "sql",
    source: "website",
    leadScore: 85,
    mqlScore: 78,
    sqlScore: 85,
    emailOpens: 12,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "Sarah Johnson",
    tags: ["enterprise", "high-value", "demo-requested"],
    lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Very interested in enterprise plan. Requested demo for next week.",
    title: "VP of Engineering",
    industry: "Technology",
    website: "https://techcorp.com",
    linkedIn: "https://linkedin.com/in/johnsmith",
    address: {
      street: "123 Tech Lane",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "USA",
    },
    activities: [
      { type: "email_open", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), details: "Opened: Product Demo Invitation" },
      { type: "page_view", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), details: "Viewed: Pricing Page" },
      { type: "form_submit", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), details: "Submitted: Contact Form" },
    ],
  },
  {
    id: "lead_002",
    firstName: "Emily",
    lastName: "Chen",
    email: "emily.chen@growthstartup.io",
    company: "Growth Startup",
    phone: "+1 (555) 234-5678",
    status: "mql",
    source: "referral",
    leadScore: 62,
    mqlScore: 62,
    sqlScore: 45,
    emailOpens: 8,
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "Mike Wilson",
    tags: ["startup", "referral", "series-b"],
    lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Referred by existing customer. Exploring options for scaling.",
    title: "Head of Marketing",
    industry: "SaaS",
    website: "https://growthstartup.io",
    linkedIn: "https://linkedin.com/in/emilychen",
    address: {
      street: "456 Innovation Ave",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "USA",
    },
    activities: [
      { type: "email_open", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), details: "Opened: Case Study Email" },
      { type: "page_view", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), details: "Viewed: Features Page" },
    ],
  },
  {
    id: "lead_003",
    firstName: "Michael",
    lastName: "Brown",
    email: "m.brown@enterprise.com",
    company: "Enterprise Solutions Inc",
    phone: "+1 (555) 345-6789",
    status: "new",
    source: "linkedin",
    leadScore: 35,
    mqlScore: 35,
    sqlScore: 20,
    emailOpens: 3,
    lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: null,
    tags: ["enterprise", "linkedin-campaign"],
    lastContactDate: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Captured from LinkedIn ad campaign.",
    title: "Director of Operations",
    industry: "Finance",
    website: "https://enterprise.com",
    linkedIn: "https://linkedin.com/in/michaelbrown",
    address: {
      street: "789 Corporate Blvd",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
    },
    activities: [
      { type: "form_submit", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), details: "LinkedIn Lead Gen Form" },
    ],
  },
];

/**
 * Mautic API Client for Lead Details
 */
class MauticLeadClient {
  private baseUrl: string;
  private credentials: { username: string; password: string };
  private accessToken?: string;

  constructor() {
    this.baseUrl = process.env.MAUTIC_URL || "http://localhost:8000";
    this.credentials = {
      username: process.env.MAUTIC_USERNAME || "admin",
      password: process.env.MAUTIC_PASSWORD || "password",
    };
  }

  async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

  async getLead(id: string): Promise<any> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/contacts/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lead: ${response.statusText}`);
    }

    const data = await response.json();
    return data.contact;
  }

  async updateLead(id: string, updates: any): Promise<any> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/contacts/${id}/edit`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update lead: ${response.statusText}`);
    }

    const data = await response.json();
    return data.contact;
  }

  async deleteLead(id: string): Promise<void> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api/contacts/${id}/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete lead: ${response.statusText}`);
    }
  }

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
        : null,
      tags: contact.tags?.map((tag: any) => tag.tag) || [],
      lastContactDate: contact.lastActive || null,
      createdAt: contact.dateAdded || null,
      updatedAt: contact.dateModified || null,
      title: contact.fields?.core?.title?.value || "",
      website: contact.fields?.core?.website?.value || "",
      linkedIn: contact.fields?.social?.linkedin?.value || "",
      notes: contact.fields?.core?.notes?.value || "",
      address: {
        street: contact.fields?.core?.address1?.value || "",
        city: contact.fields?.core?.city?.value || "",
        state: contact.fields?.core?.state?.value || "",
        zip: contact.fields?.core?.zipcode?.value || "",
        country: contact.fields?.core?.country?.value || "",
      },
      activities: [],
    };
  }

  private mapStatus(points: number): string {
    if (points >= 100) return "sql";
    if (points >= 50) return "mql";
    return "new";
  }

  private calculateMQLScore(contact: any): number {
    let score = contact.points || 0;
    if (contact.stats?.emailOpens > 5) score += 10;
    if (contact.stats?.emailClicks > 3) score += 15;
    if (contact.stats?.pageViews > 10) score += 20;
    return Math.min(score, 100);
  }

  private calculateSQLScore(contact: any): number {
    let score = this.calculateMQLScore(contact);
    if (contact.fields?.core?.company?.value) score += 10;
    if (contact.fields?.core?.phone?.value) score += 10;
    if (contact.owner) score += 15;
    return Math.min(score, 100);
  }
}

/**
 * GET /api/crm/leads/[id]
 * Get a single lead by ID (with mock data fallback)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Try Mautic first, fallback to mock data
    try {
      const client = new MauticLeadClient();
      const contact = await client.getLead(id);
      const lead = client.transformLead(contact);

      return NextResponse.json({
        data: lead,
        meta: {
          success: true,
          source: "mautic",
        },
      });
    } catch (mauticError) {
      // Mautic not available, return mock data
      console.log("Mautic unavailable, using mock data:", mauticError);

      const lead = mockLeads.find((l) => l.id === id);

      if (!lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: lead,
        meta: {
          success: true,
          source: "mock",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/leads/[id]
 * Update a lead by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    try {
      const client = new MauticLeadClient();
      const contact = await client.updateLead(id, {
        firstname: body.firstName,
        lastname: body.lastName,
        email: body.email,
        company: body.company,
        phone: body.phone,
        title: body.title,
        website: body.website,
      });
      const lead = client.transformLead(contact);

      return NextResponse.json({
        data: lead,
        meta: { success: true, source: "mautic" },
      });
    } catch (mauticError) {
      // Mautic not available, return mock update
      console.log("Mautic unavailable, simulating update:", mauticError);

      const lead = mockLeads.find((l) => l.id === id);
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const updatedLead = { ...lead, ...body, updatedAt: new Date().toISOString() };

      return NextResponse.json({
        data: updatedLead,
        meta: { success: true, source: "mock" },
      });
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

/**
 * DELETE /api/crm/leads/[id]
 * Delete a lead by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
      const client = new MauticLeadClient();
      await client.deleteLead(id);

      return NextResponse.json({
        data: { id, deleted: true },
        meta: { success: true, source: "mautic" },
      });
    } catch (mauticError) {
      // Mautic not available, simulate delete
      console.log("Mautic unavailable, simulating delete:", mauticError);

      return NextResponse.json({
        data: { id, deleted: true },
        meta: { success: true, source: "mock" },
      });
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
