/**
 * GEO Alerts API
 *
 * GET /api/geo/alerts - Get alerts for organization
 * GET /api/geo/alerts?summary=true - Get alert summary
 * PATCH /api/geo/alerts/:id - Mark alert as read/dismissed
 * POST /api/geo/alerts/mark-all-read - Mark all alerts as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import {
  getOrganizationAlerts,
  getAlertSummary,
  markAlertAsRead,
  markAllAlertsAsRead,
  dismissAlert,
  type AlertSeverity,
  type GeoAlertType,
} from "@/lib/geo/alert-generator";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const summary = searchParams.get("summary") === "true";
    const unreadOnly = searchParams.get("unread") === "true";
    const severity = searchParams.get("severity") as AlertSeverity | null;
    const type = searchParams.get("type") as GeoAlertType | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (summary) {
      const alertSummary = await getAlertSummary(organizationId);
      return NextResponse.json({
        success: true,
        data: alertSummary,
      });
    }

    const alerts = await getOrganizationAlerts(organizationId, {
      unreadOnly,
      severity: severity || undefined,
      type: type || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: alerts,
      metadata: {
        total: alerts.length,
        organizationId,
        filters: { unreadOnly, severity, type, limit },
      },
    });
  } catch (error) {
    console.error("GEO Alerts API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch alerts",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      );
    }

    let result;
    if (action === "dismiss") {
      result = await dismissAlert(alertId);
    } else {
      result = await markAlertAsRead(alertId);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GEO Alerts PATCH error:", error);
    return NextResponse.json(
      {
        error: "Failed to update alert",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "mark-all-read") {
      const count = await markAllAlertsAsRead(organizationId);
      return NextResponse.json({
        success: true,
        data: { markedAsRead: count },
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("GEO Alerts POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
