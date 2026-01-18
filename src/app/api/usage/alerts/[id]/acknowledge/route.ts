import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Acknowledge Alert API (F176)
 * POST /api/usage/alerts/[id]/acknowledge - Acknowledge an alert
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// In-memory acknowledged alerts (would be database in production)
const acknowledgedAlerts = new Map<string, Set<string>>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: alertId } = await params;
    const organizationId = orgId || userId;

    // Get or create acknowledged set for org
    let acknowledged = acknowledgedAlerts.get(organizationId);
    if (!acknowledged) {
      acknowledged = new Set();
      acknowledgedAlerts.set(organizationId, acknowledged);
    }

    // Mark alert as acknowledged
    acknowledged.add(alertId);

    return NextResponse.json({
      success: true,
      alertId,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to acknowledge alert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
