/**
 * CRM Account Detail API Route
 * GET  /api/crm/accounts/[id] - Get single account details
 * PUT  /api/crm/accounts/[id] - Update account
 * DELETE /api/crm/accounts/[id] - Delete account
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

// Mock accounts data for development/fallback
const mockAccounts = [
  {
    id: "acc_001",
    name: "TechCorp Industries",
    industry: "Technology",
    size: "Enterprise",
    location: "San Francisco, CA, USA",
    website: "https://techcorp.com",
    healthScore: 92,
    totalContacts: 45,
    activeDeals: 3,
    totalRevenue: 450000,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    owner: "Sarah Johnson",
    tags: ["enterprise", "high-value", "strategic"],
    phone: "+1 (555) 123-4567",
    email: "contact@techcorp.com",
    description: "Leading technology solutions provider specializing in enterprise software.",
    address: {
      street: "123 Tech Lane",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "USA",
    },
    contacts: [
      { id: "c1", name: "John Smith", title: "VP Engineering", email: "john@techcorp.com" },
      { id: "c2", name: "Jane Doe", title: "CTO", email: "jane@techcorp.com" },
    ],
    deals: [
      { id: "d1", name: "Enterprise License", value: 150000, stage: "negotiation" },
      { id: "d2", name: "Support Contract", value: 50000, stage: "proposal" },
    ],
    activities: [
      { type: "meeting", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), details: "Quarterly business review" },
      { type: "email", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), details: "Sent renewal proposal" },
    ],
  },
  {
    id: "acc_002",
    name: "Growth Startup Inc",
    industry: "SaaS",
    size: "Mid-Market",
    location: "Austin, TX, USA",
    website: "https://growthstartup.io",
    healthScore: 78,
    totalContacts: 12,
    activeDeals: 1,
    totalRevenue: 85000,
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    owner: "Mike Wilson",
    tags: ["startup", "high-growth", "series-b"],
    phone: "+1 (555) 234-5678",
    email: "hello@growthstartup.io",
    description: "Fast-growing B2B SaaS company focused on marketing automation.",
    address: {
      street: "456 Innovation Ave",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "USA",
    },
    contacts: [
      { id: "c3", name: "Emily Chen", title: "Head of Marketing", email: "emily@growthstartup.io" },
    ],
    deals: [
      { id: "d3", name: "Annual Subscription", value: 35000, stage: "closed-won" },
    ],
    activities: [
      { type: "call", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), details: "Follow-up call on expansion" },
    ],
  },
  {
    id: "acc_003",
    name: "Enterprise Solutions Ltd",
    industry: "Finance",
    size: "Enterprise",
    location: "New York, NY, USA",
    website: "https://enterprise-solutions.com",
    healthScore: 45,
    totalContacts: 8,
    activeDeals: 0,
    totalRevenue: 120000,
    lastActivity: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    status: "at_risk",
    owner: "Sarah Johnson",
    tags: ["enterprise", "finance", "at-risk"],
    phone: "+1 (555) 345-6789",
    email: "info@enterprise-solutions.com",
    description: "Financial services firm providing enterprise-grade solutions.",
    address: {
      street: "789 Wall Street",
      city: "New York",
      state: "NY",
      zip: "10005",
      country: "USA",
    },
    contacts: [
      { id: "c4", name: "Michael Brown", title: "Director of Operations", email: "m.brown@enterprise-solutions.com" },
    ],
    deals: [],
    activities: [
      { type: "email", date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), details: "Re-engagement email sent" },
    ],
  },
];

/**
 * GET /api/crm/accounts/[id]
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
    const account = mockAccounts.find((a) => a.id === id);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: account,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

/**
 * PUT /api/crm/accounts/[id]
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
    const account = mockAccounts.find((a) => a.id === id);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const updatedAccount = { ...account, ...body, updatedAt: new Date().toISOString() };

    return NextResponse.json({
      data: updatedAccount,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

/**
 * DELETE /api/crm/accounts/[id]
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

    return NextResponse.json({
      data: { id, deleted: true },
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
