/**
 * Marketing Sequence Detail API Route
 * GET  /api/marketing/sequences/[id] - Get single sequence details
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

// Mock sequences data
const mockSequences = [
  {
    id: "seq_001",
    name: "Welcome Series",
    description: "Onboarding sequence for new subscribers",
    status: "active",
    type: "onboarding",
    trigger: "subscription",
    steps: 5,
    totalSubscribers: 3240,
    activeSubscribers: 1850,
    completedSubscribers: 1120,
    exitedSubscribers: 270,
    conversionRate: 34.6,
    avgOpenRate: 48.5,
    avgClickRate: 12.8,
    revenue: 28500,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["onboarding", "welcome", "automated"],
    emails: [
      { id: "s1e1", name: "Welcome Email", delay: "0 days", sent: 3240, opened: 1782, clicked: 518, status: "active" },
      { id: "s1e2", name: "Getting Started Guide", delay: "1 day", sent: 2980, opened: 1490, clicked: 417, status: "active" },
      { id: "s1e3", name: "Feature Spotlight", delay: "3 days", sent: 2650, opened: 1272, clicked: 345, status: "active" },
      { id: "s1e4", name: "Success Stories", delay: "5 days", sent: 2320, opened: 1044, clicked: 278, status: "active" },
      { id: "s1e5", name: "Special Offer", delay: "7 days", sent: 2100, opened: 1008, clicked: 294, status: "active" },
    ],
    performance: [
      { date: "Week 1", subscribers: 420, completed: 145, converted: 52 },
      { date: "Week 2", subscribers: 385, completed: 132, converted: 48 },
      { date: "Week 3", subscribers: 410, completed: 140, converted: 51 },
      { date: "Week 4", subscribers: 395, completed: 138, converted: 47 },
    ],
  },
  {
    id: "seq_002",
    name: "Lead Nurture - Enterprise",
    description: "Nurture sequence for enterprise leads",
    status: "active",
    type: "nurture",
    trigger: "lead_score",
    steps: 8,
    totalSubscribers: 1250,
    activeSubscribers: 680,
    completedSubscribers: 420,
    exitedSubscribers: 150,
    conversionRate: 28.4,
    avgOpenRate: 52.3,
    avgClickRate: 15.6,
    revenue: 145000,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["enterprise", "nurture", "high-value"],
    emails: [
      { id: "s2e1", name: "Introduction", delay: "0 days", sent: 1250, opened: 687, clicked: 212, status: "active" },
      { id: "s2e2", name: "Industry Insights", delay: "3 days", sent: 1180, opened: 637, clicked: 195, status: "active" },
      { id: "s2e3", name: "Case Study", delay: "7 days", sent: 1050, opened: 546, clicked: 168, status: "active" },
      { id: "s2e4", name: "ROI Calculator", delay: "10 days", sent: 920, opened: 478, clicked: 156, status: "active" },
      { id: "s2e5", name: "Product Demo Invite", delay: "14 days", sent: 820, opened: 434, clicked: 147, status: "active" },
      { id: "s2e6", name: "Customer Success Story", delay: "17 days", sent: 720, opened: 374, clicked: 119, status: "active" },
      { id: "s2e7", name: "Enterprise Benefits", delay: "21 days", sent: 650, opened: 338, clicked: 104, status: "active" },
      { id: "s2e8", name: "Consultation Offer", delay: "28 days", sent: 580, opened: 313, clicked: 99, status: "active" },
    ],
    performance: [
      { date: "Month 1", subscribers: 320, completed: 108, converted: 32 },
      { date: "Month 2", subscribers: 345, completed: 118, converted: 35 },
      { date: "Month 3", subscribers: 310, completed: 102, converted: 28 },
      { date: "Month 4", subscribers: 275, completed: 92, converted: 26 },
    ],
  },
  {
    id: "seq_003",
    name: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    status: "active",
    type: "reengagement",
    trigger: "inactivity",
    steps: 4,
    totalSubscribers: 2100,
    activeSubscribers: 890,
    completedSubscribers: 980,
    exitedSubscribers: 230,
    conversionRate: 18.2,
    avgOpenRate: 28.4,
    avgClickRate: 6.8,
    revenue: 12500,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Emily Chen",
    tags: ["reengagement", "winback", "inactive"],
    emails: [
      { id: "s3e1", name: "We Miss You", delay: "0 days", sent: 2100, opened: 630, clicked: 168, status: "active" },
      { id: "s3e2", name: "What's New", delay: "5 days", sent: 1680, opened: 470, clicked: 118, status: "active" },
      { id: "s3e3", name: "Special Comeback Offer", delay: "10 days", sent: 1350, opened: 378, clicked: 95, status: "active" },
      { id: "s3e4", name: "Last Chance", delay: "15 days", sent: 1100, opened: 286, clicked: 66, status: "active" },
    ],
    performance: [
      { date: "Week 1", subscribers: 520, completed: 245, converted: 48 },
      { date: "Week 2", subscribers: 485, completed: 228, converted: 42 },
      { date: "Week 3", subscribers: 545, completed: 258, converted: 51 },
      { date: "Week 4", subscribers: 550, completed: 249, converted: 47 },
    ],
  },
  {
    id: "seq_004",
    name: "Trial Conversion",
    description: "Convert free trial users to paid",
    status: "active",
    type: "conversion",
    trigger: "trial_start",
    steps: 6,
    totalSubscribers: 1680,
    activeSubscribers: 520,
    completedSubscribers: 980,
    exitedSubscribers: 180,
    conversionRate: 42.5,
    avgOpenRate: 55.2,
    avgClickRate: 18.4,
    revenue: 98500,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["trial", "conversion", "revenue"],
    emails: [
      { id: "s4e1", name: "Trial Started", delay: "0 days", sent: 1680, opened: 974, clicked: 352, status: "active" },
      { id: "s4e2", name: "Quick Start Tips", delay: "2 days", sent: 1580, opened: 885, clicked: 301, status: "active" },
      { id: "s4e3", name: "Key Features", delay: "5 days", sent: 1450, opened: 783, clicked: 261, status: "active" },
      { id: "s4e4", name: "Success Stories", delay: "8 days", sent: 1320, opened: 699, clicked: 224, status: "active" },
      { id: "s4e5", name: "Trial Ending Soon", delay: "11 days", sent: 1180, opened: 660, clicked: 224, status: "active" },
      { id: "s4e6", name: "Special Upgrade Offer", delay: "13 days", sent: 1050, opened: 609, clicked: 220, status: "active" },
    ],
    performance: [
      { date: "Week 1", subscribers: 210, completed: 122, converted: 52 },
      { date: "Week 2", subscribers: 195, completed: 115, converted: 48 },
      { date: "Week 3", subscribers: 225, completed: 128, converted: 55 },
      { date: "Week 4", subscribers: 205, completed: 118, converted: 51 },
    ],
  },
  {
    id: "seq_005",
    name: "Post-Purchase Upsell",
    description: "Upsell sequence for recent purchasers",
    status: "paused",
    type: "upsell",
    trigger: "purchase",
    steps: 4,
    totalSubscribers: 850,
    activeSubscribers: 0,
    completedSubscribers: 720,
    exitedSubscribers: 130,
    conversionRate: 22.8,
    avgOpenRate: 42.5,
    avgClickRate: 11.2,
    revenue: 45000,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["upsell", "post-purchase", "revenue"],
    emails: [
      { id: "s5e1", name: "Thank You + Tips", delay: "1 day", sent: 850, opened: 382, clicked: 106, status: "paused" },
      { id: "s5e2", name: "Advanced Features", delay: "7 days", sent: 780, opened: 335, clicked: 89, status: "paused" },
      { id: "s5e3", name: "Upgrade Benefits", delay: "14 days", sent: 720, opened: 295, clicked: 77, status: "paused" },
      { id: "s5e4", name: "Limited Time Offer", delay: "21 days", sent: 680, opened: 272, clicked: 71, status: "paused" },
    ],
    performance: [
      { date: "Month 1", subscribers: 280, completed: 238, converted: 58 },
      { date: "Month 2", subscribers: 295, completed: 251, converted: 62 },
      { date: "Month 3", subscribers: 275, completed: 231, converted: 54 },
    ],
  },
  {
    id: "seq_006",
    name: "Referral Program",
    description: "Encourage customers to refer friends",
    status: "draft",
    type: "referral",
    trigger: "manual",
    steps: 3,
    totalSubscribers: 0,
    activeSubscribers: 0,
    completedSubscribers: 0,
    exitedSubscribers: 0,
    conversionRate: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    revenue: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Emily Chen",
    tags: ["referral", "growth", "new"],
    emails: [
      { id: "s6e1", name: "Referral Program Intro", delay: "0 days", sent: 0, opened: 0, clicked: 0, status: "draft" },
      { id: "s6e2", name: "Referral Reminder", delay: "7 days", sent: 0, opened: 0, clicked: 0, status: "draft" },
      { id: "s6e3", name: "Bonus Incentive", delay: "14 days", sent: 0, opened: 0, clicked: 0, status: "draft" },
    ],
    performance: [],
  },
];

/**
 * GET /api/marketing/sequences/[id]
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
    const sequence = mockSequences.find((s) => s.id === id);

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: sequence,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error fetching sequence:", error);
    return NextResponse.json({ error: "Failed to fetch sequence" }, { status: 500 });
  }
}

/**
 * PUT /api/marketing/sequences/[id]
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
    const sequence = mockSequences.find((s) => s.id === id);

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    const updatedSequence = { ...sequence, ...body, updatedAt: new Date().toISOString() };

    return NextResponse.json({
      data: updatedSequence,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error updating sequence:", error);
    return NextResponse.json({ error: "Failed to update sequence" }, { status: 500 });
  }
}

/**
 * DELETE /api/marketing/sequences/[id]
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
    console.error("Error deleting sequence:", error);
    return NextResponse.json({ error: "Failed to delete sequence" }, { status: 500 });
  }
}
