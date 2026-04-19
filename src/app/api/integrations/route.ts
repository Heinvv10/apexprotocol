/**
 * Integrations List API
 * GET /api/integrations - Get all available integrations and their connection status
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { slackManager } from "@/lib/integrations/slack";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: "notifications" | "analytics" | "crm" | "productivity";
  configurable: boolean;
  requiresBrand?: boolean;
}

// Define available integrations
const AVAILABLE_INTEGRATIONS: Omit<IntegrationStatus, "connected">[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications and alerts to Slack channels",
    icon: "S",
    category: "notifications",
    configurable: true,
    requiresBrand: true,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track website analytics and visitor behavior",
    icon: "GA",
    category: "analytics",
    configurable: true,
    requiresBrand: true,
  },
  {
    id: "google-search-console",
    name: "Google Search Console",
    description: "Monitor search performance and indexing",
    icon: "GS",
    category: "analytics",
    configurable: true,
    requiresBrand: true,
  },
  {
    id: "linear",
    name: "Linear",
    description: "Create and sync tasks with Linear",
    icon: "L",
    category: "productivity",
    configurable: true,
    requiresBrand: false,
  },
  {
    id: "jira",
    name: "Jira",
    description: "Create and sync tasks with Jira",
    icon: "J",
    category: "productivity",
    configurable: true,
    requiresBrand: false,
  },
  {
    id: "asana",
    name: "Asana",
    description: "Create and sync tasks with Asana",
    icon: "A",
    category: "productivity",
    configurable: true,
    requiresBrand: false,
  },
  {
    id: "trello",
    name: "Trello",
    description: "Create and sync cards with Trello",
    icon: "T",
    category: "productivity",
    configurable: true,
    requiresBrand: false,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync data with HubSpot CRM",
    icon: "H",
    category: "crm",
    configurable: false,
    requiresBrand: false,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows with Zapier",
    icon: "Z",
    category: "productivity",
    configurable: false,
    requiresBrand: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const organizationId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const category = searchParams.get("category");

    // Get all brands for the organization to check per-brand integrations
    let userBrands: { id: string }[] = [];
    if (organizationId) {
      userBrands = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.organizationId, organizationId));
    }

    // Build integration statuses
    const integrations: IntegrationStatus[] = AVAILABLE_INTEGRATIONS.map((integration) => {
      let connected = false;

      // Check connection status based on integration type
      if (integration.id === "slack" && brandId) {
        // Check Slack connection for specific brand
        const connection = slackManager.getConnection(brandId);
        connected = !!connection;
      } else if (integration.id === "slack" && userBrands.length > 0) {
        // Check if any brand has Slack connected
        connected = userBrands.some((brand) => {
          const connection = slackManager.getConnection(brand.id);
          return !!connection;
        });
      }

      // For other integrations, we'd check their respective managers
      // For now, these remain false (not connected) until configured

      return {
        ...integration,
        connected,
      };
    });

    // Filter by category if specified
    const filteredIntegrations = category
      ? integrations.filter((i) => i.category === category)
      : integrations;

    return NextResponse.json({
      success: true,
      data: {
        integrations: filteredIntegrations,
        summary: {
          total: filteredIntegrations.length,
          connected: filteredIntegrations.filter((i) => i.connected).length,
          available: filteredIntegrations.filter((i) => !i.connected).length,
        },
        categories: [
          { id: "notifications", name: "Notifications", count: integrations.filter((i) => i.category === "notifications").length },
          { id: "analytics", name: "Analytics", count: integrations.filter((i) => i.category === "analytics").length },
          { id: "crm", name: "CRM", count: integrations.filter((i) => i.category === "crm").length },
          { id: "productivity", name: "Productivity", count: integrations.filter((i) => i.category === "productivity").length },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to fetch integrations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch integrations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
