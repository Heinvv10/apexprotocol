/**
 * Marketing Campaign Detail API Route
 * GET  /api/marketing/campaigns/[id] - Get single campaign details
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

// Mock campaigns data
const mockCampaigns = [
  {
    id: "camp_001",
    name: "Spring Product Launch",
    description: "Q1 product launch campaign targeting enterprise customers",
    type: "email",
    status: "active",
    budget: 15000,
    spent: 12500,
    revenue: 45000,
    roi: 260,
    leads: 320,
    clicks: 2400,
    impressions: 85000,
    conversions: 86,
    conversionRate: 3.58,
    openRate: 32.5,
    clickRate: 8.2,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["product-launch", "enterprise", "q1"],
    targetAudience: "Enterprise decision makers in tech industry",
    channels: ["email", "linkedin", "retargeting"],
    emails: [
      { id: "e1", name: "Launch Announcement", sent: 12000, opened: 3900, clicked: 984 },
      { id: "e2", name: "Feature Highlight", sent: 11500, opened: 3680, clicked: 920 },
      { id: "e3", name: "Case Study", sent: 11000, opened: 3520, clicked: 880 },
    ],
    performance: [
      { date: "Week 1", leads: 45, conversions: 12, revenue: 8000 },
      { date: "Week 2", leads: 68, conversions: 18, revenue: 10500 },
      { date: "Week 3", leads: 92, conversions: 25, revenue: 12000 },
      { date: "Week 4", leads: 115, conversions: 31, revenue: 14500 },
    ],
  },
  {
    id: "camp_002",
    name: "Webinar Series - AI Insights",
    description: "Educational webinar series on AI implementation",
    type: "webinar",
    status: "active",
    budget: 8000,
    spent: 5200,
    revenue: 28000,
    roi: 438,
    leads: 180,
    clicks: 1200,
    impressions: 42000,
    conversions: 45,
    conversionRate: 3.75,
    openRate: 45.2,
    clickRate: 12.8,
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["webinar", "education", "ai"],
    targetAudience: "Marketing professionals interested in AI",
    channels: ["email", "social", "paid-search"],
    emails: [
      { id: "e4", name: "Webinar Invitation", sent: 8000, opened: 3600, clicked: 1024 },
      { id: "e5", name: "Reminder", sent: 7500, opened: 3375, clicked: 960 },
    ],
    performance: [
      { date: "Week 1", leads: 85, conversions: 22, revenue: 14000 },
      { date: "Week 2", leads: 95, conversions: 23, revenue: 14000 },
    ],
  },
  {
    id: "camp_003",
    name: "Social Media Awareness",
    description: "Brand awareness campaign across social platforms",
    type: "social",
    status: "active",
    budget: 12000,
    spent: 9800,
    revenue: 22000,
    roi: 124,
    leads: 450,
    clicks: 8500,
    impressions: 320000,
    conversions: 120,
    conversionRate: 1.41,
    openRate: 0,
    clickRate: 2.66,
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Emily Chen",
    tags: ["social", "awareness", "brand"],
    targetAudience: "Small business owners and entrepreneurs",
    channels: ["linkedin", "twitter", "facebook", "instagram"],
    emails: [],
    performance: [
      { date: "Week 1", leads: 52, conversions: 14, revenue: 2500 },
      { date: "Week 2", leads: 68, conversions: 18, revenue: 3200 },
      { date: "Week 3", leads: 85, conversions: 22, revenue: 4000 },
      { date: "Week 4", leads: 95, conversions: 25, revenue: 4500 },
      { date: "Week 5", leads: 78, conversions: 21, revenue: 3800 },
      { date: "Week 6", leads: 72, conversions: 20, revenue: 4000 },
    ],
  },
  {
    id: "camp_004",
    name: "Landing Page - Free Trial",
    description: "Free trial signup landing page campaign",
    type: "landing_page",
    status: "active",
    budget: 5000,
    spent: 4200,
    revenue: 18000,
    roi: 329,
    leads: 280,
    clicks: 3200,
    impressions: 45000,
    conversions: 95,
    conversionRate: 2.97,
    openRate: 0,
    clickRate: 7.11,
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: null,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["landing-page", "trial", "conversion"],
    targetAudience: "Prospects ready to try the product",
    channels: ["paid-search", "retargeting"],
    emails: [],
    performance: [
      { date: "Month 1", leads: 85, conversions: 28, revenue: 5400 },
      { date: "Month 2", leads: 95, conversions: 32, revenue: 6200 },
      { date: "Month 3", leads: 100, conversions: 35, revenue: 6400 },
    ],
  },
  {
    id: "camp_005",
    name: "Retargeting - Cart Abandonment",
    description: "Retarget users who abandoned their shopping carts",
    type: "retargeting",
    status: "paused",
    budget: 6000,
    spent: 6000,
    revenue: 15000,
    roi: 150,
    leads: 95,
    clicks: 1800,
    impressions: 28000,
    conversions: 42,
    conversionRate: 2.33,
    openRate: 38.5,
    clickRate: 6.43,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["retargeting", "cart-abandonment", "recovery"],
    targetAudience: "Users who abandoned checkout",
    channels: ["email", "display", "social-retargeting"],
    emails: [
      { id: "e6", name: "Cart Reminder", sent: 2500, opened: 962, clicked: 245 },
      { id: "e7", name: "Discount Offer", sent: 2200, opened: 880, clicked: 220 },
    ],
    performance: [
      { date: "Week 1", leads: 25, conversions: 11, revenue: 4000 },
      { date: "Week 2", leads: 28, conversions: 12, revenue: 4200 },
      { date: "Week 3", leads: 22, conversions: 10, revenue: 3500 },
      { date: "Week 4", leads: 20, conversions: 9, revenue: 3300 },
    ],
  },
  {
    id: "camp_006",
    name: "Holiday Sale Promotion",
    description: "Annual holiday sale email blast",
    type: "email",
    status: "completed",
    budget: 10000,
    spent: 10000,
    revenue: 52000,
    roi: 420,
    leads: 520,
    clicks: 4200,
    impressions: 125000,
    conversions: 180,
    conversionRate: 3.36,
    openRate: 42.8,
    clickRate: 11.2,
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Emily Chen",
    tags: ["holiday", "sale", "promotion"],
    targetAudience: "All active subscribers",
    channels: ["email", "social", "display"],
    emails: [
      { id: "e8", name: "Sale Announcement", sent: 25000, opened: 10750, clicked: 2800 },
      { id: "e9", name: "Last Chance", sent: 24000, opened: 10320, clicked: 2688 },
    ],
    performance: [
      { date: "Week 1", leads: 180, conversions: 62, revenue: 18000 },
      { date: "Week 2", leads: 200, conversions: 70, revenue: 20000 },
      { date: "Week 3", leads: 140, conversions: 48, revenue: 14000 },
    ],
  },
];

/**
 * GET /api/marketing/campaigns/[id]
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
    const campaign = mockCampaigns.find((c) => c.id === id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: campaign,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

/**
 * PUT /api/marketing/campaigns/[id]
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
    const campaign = mockCampaigns.find((c) => c.id === id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const updatedCampaign = { ...campaign, ...body, updatedAt: new Date().toISOString() };

    return NextResponse.json({
      data: updatedCampaign,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

/**
 * DELETE /api/marketing/campaigns/[id]
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
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
