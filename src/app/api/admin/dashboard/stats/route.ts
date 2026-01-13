import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Dashboard Statistics API
 *
 * GET /api/admin/dashboard/stats
 * Returns aggregated statistics for the admin dashboard
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations, users, systemAuditLogs } from "@/lib/db/schema";
import { sql, gte, and } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(_request: NextRequest) {
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

    // Get current date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Parallel queries for performance
    const [
      totalOrgsResult,
      orgsThisMonthResult,
      totalUsersResult,
      usersThisWeekResult,
      activeSessionsResult,
      apiRequests24hResult,
    ] = await Promise.all([
      // Total organizations
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizations),

      // Organizations created this month
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizations)
        .where(gte(organizations.createdAt, startOfMonth)),

      // Total users
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users),

      // Users created this week
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.createdAt, startOfWeek)),

      // Active sessions (unique actors in audit logs in last 15 minutes)
      db
        .select({ count: sql<number>`count(distinct actor_id)::int` })
        .from(systemAuditLogs)
        .where(
          and(
            gte(systemAuditLogs.timestamp, fifteenMinutesAgo),
            sql`actor_id IS NOT NULL`
          )
        ),

      // API requests in last 24 hours (from audit logs)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(systemAuditLogs)
        .where(gte(systemAuditLogs.timestamp, twentyFourHoursAgo)),
    ]);

    const stats = {
      totalOrganizations: totalOrgsResult[0]?.count ?? 0,
      organizationsThisMonth: orgsThisMonthResult[0]?.count ?? 0,
      totalUsers: totalUsersResult[0]?.count ?? 0,
      usersThisWeek: usersThisWeekResult[0]?.count ?? 0,
      activeSessions: activeSessionsResult[0]?.count ?? 0,
      apiRequests24h: apiRequests24hResult[0]?.count ?? 0,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
