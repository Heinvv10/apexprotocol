/**
 * CRM Pipeline API Route
 * Wraps Mautic API for sales pipeline and opportunity management
 * GET /api/crm/pipeline - Get pipeline data by stage
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/clerk";

/**
 * Mautic API Client for Pipeline/Opportunities
 */
class MauticPipelineClient {
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
   * Fetch all contacts and companies to build pipeline view
   * Note: Mautic doesn't have native "deals" - we infer from lead scoring and stages
   */
  async getPipelineData(): Promise<any> {
    try {
      const token = await this.authenticate();

      // Fetch contacts (leads)
      const contactsResponse = await fetch(`${this.baseUrl}/api/contacts?limit=500`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!contactsResponse.ok) {
        throw new Error(`Failed to fetch contacts: ${contactsResponse.statusText}`);
      }

      const contactsData = await contactsResponse.json();
      const contacts = contactsData.contacts ? Object.values(contactsData.contacts) : [];

      // Build pipeline stages from lead scores and status
      return this.buildPipelineStages(contacts);
    } catch (error) {
      console.error("[Mautic] Error fetching pipeline data:", error);
      // Return empty pipeline on error
      return {
        stages: [],
        totalValue: 0,
        totalDeals: 0,
      };
    }
  }

  /**
   * Build pipeline stages from contacts
   */
  private buildPipelineStages(contacts: any[]): any {
    const stages = [
      { name: "New", id: "new", deals: [], value: 0, color: "#6B7280" },
      { name: "Qualified", id: "qualified", deals: [], value: 0, color: "#3B82F6" },
      { name: "Proposal", id: "proposal", deals: [], value: 0, color: "#8B5CF6" },
      { name: "Negotiation", id: "negotiation", deals: [], value: 0, color: "#F59E0B" },
      { name: "Won", id: "won", deals: [], value: 0, color: "#22C55E" },
      { name: "Lost", id: "lost", deals: [], value: 0, color: "#EF4444" },
    ];

    let totalValue = 0;
    let totalDeals = 0;

    // Categorize contacts into stages based on score and activity
    contacts.forEach((contact: any) => {
      const deal = this.contactToDeal(contact);
      const stage = this.determineStage(contact);

      const stageObj = stages.find(s => s.id === stage);
      if (stageObj) {
        stageObj.deals.push(deal);
        stageObj.value += deal.value;

        if (stage !== "lost") {
          totalValue += deal.value;
          totalDeals++;
        }
      }
    });

    return {
      stages: stages.map(stage => ({
        name: stage.name,
        id: stage.id,
        count: stage.deals.length,
        value: stage.value,
        deals: stage.deals.slice(0, 10), // Limit to 10 deals per stage for performance
        color: stage.color,
      })),
      totalValue,
      totalDeals,
    };
  }

  /**
   * Convert contact to deal format
   */
  private contactToDeal(contact: any): any {
    const value = this.estimateDealValue(contact);
    const probability = this.calculateProbability(contact);

    return {
      id: contact.id?.toString() || "",
      title: `Deal with ${contact.fields?.core?.firstname?.value || ""} ${contact.fields?.core?.lastname?.value || ""}`.trim(),
      company: contact.fields?.core?.company?.value || "Unknown Company",
      value: value,
      probability: probability,
      expectedClose: this.estimateCloseDate(contact),
      contact: {
        name: `${contact.fields?.core?.firstname?.value || ""} ${contact.fields?.core?.lastname?.value || ""}`.trim(),
        email: contact.fields?.core?.email?.value || "",
        phone: contact.fields?.core?.phone?.value || "",
      },
      assignedTo: contact.owner?.firstName
        ? `${contact.owner.firstName} ${contact.owner.lastName}`
        : undefined,
      lastActivity: contact.lastActive || new Date().toISOString(),
      createdAt: contact.dateAdded || new Date().toISOString(),
    };
  }

  /**
   * Determine pipeline stage from contact data
   */
  private determineStage(contact: any): string {
    const points = contact.points || 0;
    const daysOld = this.getDaysOld(contact.dateAdded || new Date().toISOString());
    const hasActivity = contact.lastActive && this.getDaysOld(contact.lastActive) < 30;

    // Check for explicit stage markers (custom fields)
    const stage = contact.fields?.core?.stage?.value;
    if (stage) {
      return stage.toLowerCase();
    }

    // Infer stage from scoring and activity
    if (points < 30) return "new";
    if (points >= 30 && points < 60) return "qualified";
    if (points >= 60 && points < 80) return "proposal";
    if (points >= 80) {
      // High score but no recent activity = lost
      if (!hasActivity && daysOld > 60) return "lost";
      // High score with activity = negotiation or won
      return hasActivity ? "negotiation" : "proposal";
    }

    // Default to new
    return "new";
  }

  /**
   * Estimate deal value from contact data
   */
  private estimateDealValue(contact: any): number {
    // Check for explicit value field
    const explicitValue = contact.fields?.core?.dealvalue?.value;
    if (explicitValue) return Number(explicitValue);

    // Estimate from company size and industry
    const company = contact.fields?.core?.company?.value || "";
    const industry = contact.fields?.core?.companyindustry?.value || "";
    const points = contact.points || 0;

    let baseValue = 5000; // Default deal value

    // Adjust based on industry
    if (industry.toLowerCase().includes("enterprise") || industry.toLowerCase().includes("finance")) {
      baseValue = 50000;
    } else if (industry.toLowerCase().includes("tech") || industry.toLowerCase().includes("saas")) {
      baseValue = 25000;
    } else if (industry.toLowerCase().includes("retail") || industry.toLowerCase().includes("ecommerce")) {
      baseValue = 15000;
    }

    // Adjust based on lead score
    const scoreMultiplier = Math.min(points / 50, 2); // Max 2x multiplier
    return Math.round(baseValue * scoreMultiplier);
  }

  /**
   * Calculate win probability from contact data
   */
  private calculateProbability(contact: any): number {
    const points = contact.points || 0;
    const hasOwner = !!contact.owner;
    const hasActivity = contact.lastActive && this.getDaysOld(contact.lastActive) < 14;

    let probability = Math.min(points, 70); // Base from score (max 70%)

    if (hasOwner) probability += 10;
    if (hasActivity) probability += 10;

    return Math.min(probability, 95); // Cap at 95%
  }

  /**
   * Estimate close date
   */
  private estimateCloseDate(contact: any): string {
    const now = new Date();
    const daysToAdd = 30; // Default 30 days
    const closeDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return closeDate.toISOString();
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
}

/**
 * GET /api/crm/pipeline
 * Fetch sales pipeline data
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new MauticPipelineClient();
    const pipelineData = await client.getPipelineData();

    return NextResponse.json({
      data: pipelineData,
      meta: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[CRM Pipeline API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pipeline data",
        data: {
          stages: [],
          totalValue: 0,
          totalDeals: 0,
        },
        meta: {
          success: false,
        }
      },
      { status: 500 }
    );
  }
}
