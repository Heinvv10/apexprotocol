/**
 * Resource Usage API
 *
 * GET /api/admin/dashboard/resources
 * Returns resource utilization metrics
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { formatBytes } from "@/lib/utils";

// ðŸŸ¢ WORKING: Migrated to use centralized formatBytes from @/lib/utils

/**
 * Get database size
 */
async function getDatabaseSize(): Promise<{
  sizeBytes: number;
  sizeFormatted: string;
  maxSizeBytes: number;
  maxSizeFormatted: string;
  usagePercent: number;
}> {
  try {
    // Query PostgreSQL database size
    const result = await db.execute(
      sql`SELECT pg_database_size(current_database()) as size_bytes`
    );

    const sizeBytes = Number(result.rows[0]?.size_bytes) || 0;
    const maxSizeBytes = 10 * 1024 * 1024 * 1024; // 10 GB default limit (Neon free tier)
    const usagePercent = Math.round((sizeBytes / maxSizeBytes) * 100);

    return {
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      maxSizeBytes,
      maxSizeFormatted: formatBytes(maxSizeBytes),
      usagePercent,
    };
  } catch {
    return {
      sizeBytes: 0,
      sizeFormatted: "Unknown",
      maxSizeBytes: 10 * 1024 * 1024 * 1024,
      maxSizeFormatted: "10 GB",
      usagePercent: 0,
    };
  }
}

/**
 * Get API usage statistics
 */
async function getAPIUsage(): Promise<{
  requestsToday: number;
  requestsLimit: number;
  usagePercent: number;
}> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(systemAuditLogs)
      .where(gte(systemAuditLogs.timestamp, startOfDay));

    const requestsToday = result[0]?.count ?? 0;
    const requestsLimit = 100000; // Daily limit
    const usagePercent = Math.round((requestsToday / requestsLimit) * 100);

    return {
      requestsToday,
      requestsLimit,
      usagePercent,
    };
  } catch {
    return {
      requestsToday: 0,
      requestsLimit: 100000,
      usagePercent: 0,
    };
  }
}

/**
 * Get table row counts for storage estimation
 */
async function getTableStats(): Promise<{
  auditLogsCount: number;
  estimatedStorageBytes: number;
}> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(systemAuditLogs);

    const auditLogsCount = result[0]?.count ?? 0;
    // Estimate ~1KB per audit log entry
    const estimatedStorageBytes = auditLogsCount * 1024;

    return {
      auditLogsCount,
      estimatedStorageBytes,
    };
  } catch {
    return {
      auditLogsCount: 0,
      estimatedStorageBytes: 0,
    };
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

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

    // Get all resource metrics in parallel
    const [databaseSize, apiUsage, tableStats] = await Promise.all([
      getDatabaseSize(),
      getAPIUsage(),
      getTableStats(),
    ]);

    // Storage metrics (file uploads would be tracked separately)
    const maxStorageBytes = 50 * 1024 * 1024 * 1024; // 50 GB
    const storageUsedBytes = tableStats.estimatedStorageBytes;
    const storageUsagePercent = Math.round((storageUsedBytes / maxStorageBytes) * 100);

    const resources = {
      database: {
        sizeBytes: databaseSize.sizeBytes,
        sizeFormatted: databaseSize.sizeFormatted,
        maxSizeBytes: databaseSize.maxSizeBytes,
        maxSizeFormatted: databaseSize.maxSizeFormatted,
        usagePercent: databaseSize.usagePercent,
      },
      storage: {
        usedBytes: storageUsedBytes,
        usedFormatted: formatBytes(storageUsedBytes),
        maxBytes: maxStorageBytes,
        maxFormatted: formatBytes(maxStorageBytes),
        usagePercent: storageUsagePercent,
      },
      apiUsage: {
        requestsToday: apiUsage.requestsToday,
        requestsLimit: apiUsage.requestsLimit,
        usagePercent: apiUsage.usagePercent,
      },
      tableStats: {
        auditLogsCount: tableStats.auditLogsCount,
      },
    };

    return NextResponse.json({
      success: true,
      resources,
    });
  } catch (error) {
    // ðŸŸ¢ WORKING: Proper error handling without console.error
    return NextResponse.json(
      {
        error: "Failed to check resource usage",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
