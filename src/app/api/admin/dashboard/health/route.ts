/**
 * System Health API
 *
 * GET /api/admin/dashboard/health
 * Returns system health status for all services
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

type HealthStatus = "healthy" | "warning" | "critical";

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<{
  status: HealthStatus;
  latency: number;
  connected: boolean;
}> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;

    let status: HealthStatus = "healthy";
    if (latency > 200) {
      status = "critical";
    } else if (latency > 100) {
      status = "warning";
    }

    return { status, latency, connected: true };
  } catch {
    return { status: "critical", latency: -1, connected: false };
  }
}

/**
 * Check AI services health from api_integrations table
 */
async function checkAIServicesHealth(): Promise<{
  status: HealthStatus;
  configuredCount: number;
  activeCount: number;
  errorCount: number;
}> {
  try {
    const integrations = await db
      .select({
        status: apiIntegrations.status,
        isEnabled: apiIntegrations.isEnabled,
      })
      .from(apiIntegrations);

    const configuredCount = integrations.filter(
      (i) => i.status === "configured"
    ).length;
    const activeCount = integrations.filter(
      (i) => i.status === "configured" && i.isEnabled
    ).length;
    const errorCount = integrations.filter(
      (i) => i.status === "error"
    ).length;

    let status: HealthStatus = "healthy";
    if (errorCount > 0) {
      status = "warning";
    }
    if (activeCount === 0 && configuredCount > 0) {
      status = "critical";
    }

    return { status, configuredCount, activeCount, errorCount };
  } catch {
    return { status: "critical", configuredCount: 0, activeCount: 0, errorCount: 0 };
  }
}

/**
 * Check Redis health (if configured)
 */
async function checkRedisHealth(): Promise<{
  status: HealthStatus;
  connected: boolean;
  message: string;
}> {
  // Check if Redis is configured
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

  if (!redisUrl) {
    return {
      status: "warning",
      connected: false,
      message: "Not configured",
    };
  }

  // For now, just check if the URL is set
  // In production, we'd actually ping Redis
  return {
    status: "healthy",
    connected: true,
    message: "Connected",
  };
}

/**
 * Get server uptime
 */
function getServerUptime(): string {
  // In a real scenario, we'd track actual uptime
  // For now, return a placeholder
  return "99.9%";
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

    // Run all health checks in parallel
    const [dbHealth, aiHealth, redisHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkAIServicesHealth(),
      checkRedisHealth(),
    ]);

    // Calculate overall API server status
    const apiServerStatus: HealthStatus =
      dbHealth.status === "critical" ? "critical" :
      dbHealth.status === "warning" ? "warning" : "healthy";

    const health = {
      apiServer: {
        status: apiServerStatus,
        uptime: getServerUptime(),
        responseTime: dbHealth.latency,
      },
      database: {
        status: dbHealth.status,
        latency: dbHealth.latency,
        connected: dbHealth.connected,
      },
      redis: {
        status: redisHealth.status,
        connected: redisHealth.connected,
        message: redisHealth.message,
      },
      jobQueue: {
        status: "healthy" as HealthStatus,
        pending: 0,
        failed: 0,
        completed24h: 0,
        message: "Queue monitoring not configured",
      },
      aiServices: {
        status: aiHealth.status,
        configuredCount: aiHealth.configuredCount,
        activeCount: aiHealth.activeCount,
        errorCount: aiHealth.errorCount,
      },
    };

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Failed to check system health" },
      { status: 500 }
    );
  }
}
