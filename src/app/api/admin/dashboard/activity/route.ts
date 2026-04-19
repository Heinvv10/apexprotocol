import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Dashboard Activity API
 *
 * GET /api/admin/dashboard/activity
 * Returns recent admin activity from audit logs
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

/**
 * Calculate relative time string (e.g., "5 minutes ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format action for display
 */
function formatAction(action: string, _actionType: string): string {
  const actionMap: Record<string, string> = {
    create_user: "created user",
    update_user: "updated user",
    delete_user: "deleted user",
    create_organization: "created organization",
    update_organization: "updated organization",
    delete_organization: "deleted organization",
    create_api_integration: "created API integration",
    update_api_integration: "updated API integration",
    delete_api_integration: "deleted API integration",
    list_users: "viewed users",
    list_organizations: "viewed organizations",
    list_api_integrations: "viewed API integrations",
  };

  return actionMap[action] || action.replace(/_/g, " ");
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check super-admin status
    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    // Parse limit parameter (default 10, max 50)
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get("limit") || "10", 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    // Fetch recent audit logs
    const logs = await db
      .select({
        id: systemAuditLogs.id,
        action: systemAuditLogs.action,
        actionType: systemAuditLogs.actionType,
        actorName: systemAuditLogs.actorName,
        actorEmail: systemAuditLogs.actorEmail,
        targetType: systemAuditLogs.targetType,
        targetName: systemAuditLogs.targetName,
        description: systemAuditLogs.description,
        timestamp: systemAuditLogs.timestamp,
        status: systemAuditLogs.status,
      })
      .from(systemAuditLogs)
      .orderBy(desc(systemAuditLogs.timestamp))
      .limit(limit);

    // Transform logs for display
    const activities = logs.map((log) => ({
      id: log.id,
      action: log.action,
      actionType: log.actionType,
      actionFormatted: formatAction(log.action, log.actionType),
      actorName: log.actorName || "System",
      actorEmail: log.actorEmail || "system@apex.io",
      targetType: log.targetType || "system",
      targetName: log.targetName || "",
      description: log.description,
      timestamp: log.timestamp.toISOString(),
      relativeTime: getRelativeTime(log.timestamp),
      status: log.status,
    }));

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Dashboard activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
