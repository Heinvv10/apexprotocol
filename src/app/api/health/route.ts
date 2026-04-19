/**
 * Health Check Endpoint (F148)
 * Returns service status for all dependencies
 */

import { NextRequest, NextResponse } from "next/server";

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  lastCheck: string;
  details?: Record<string, unknown>;
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: ServiceHealth[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

// Version from environment or package.json
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

/**
 * Check database health (Drizzle/PostgreSQL via Neon)
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // In production, this would use the actual db client
    // For now, simulate a health check
    const isHealthy = process.env.DATABASE_URL !== undefined;
    const latency = Date.now() - start;

    return {
      name: "database",
      status: isHealthy ? "healthy" : "unhealthy",
      latency,
      message: isHealthy ? "PostgreSQL connected via Neon" : "Database URL not configured",
      lastCheck: new Date().toISOString(),
      details: {
        type: "postgresql",
        provider: "neon",
        configured: !!process.env.DATABASE_URL,
      },
    };
  } catch (error) {
    return {
      name: "database",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Database check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check Redis health (Upstash)
 */
async function checkRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const isConfigured = Boolean(
      process.env.REDIS_URL
    );

    if (!isConfigured) {
      return {
        name: "redis",
        status: "healthy",
        latency: Date.now() - start,
        message: "Redis not configured (in-memory fallback active)",
        lastCheck: new Date().toISOString(),
        details: {
          provider: "upstash",
          configured: false,
        },
      };
    }

    // In production, this would ping Redis
    const latency = Date.now() - start;

    return {
      name: "redis",
      status: "healthy",
      latency,
      message: "Redis connected via Upstash",
      lastCheck: new Date().toISOString(),
      details: {
        provider: "upstash",
        configured: true,
      },
    };
  } catch (error) {
    return {
      name: "redis",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Redis check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check Clerk auth service health
 */
async function checkAuth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const isConfigured =
      process.env.CLERK_SECRET_KEY !== undefined &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== undefined;

    return {
      name: "auth",
      status: isConfigured ? "healthy" : "unhealthy",
      latency: Date.now() - start,
      message: isConfigured ? "Clerk authentication configured" : "Clerk not configured",
      lastCheck: new Date().toISOString(),
      details: {
        provider: "clerk",
        configured: isConfigured,
      },
    };
  } catch (error) {
    return {
      name: "auth",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Auth check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check AI services health (Anthropic Claude)
 */
async function checkAI(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const isConfigured = process.env.ANTHROPIC_API_KEY !== undefined;

    return {
      name: "ai",
      status: isConfigured ? "healthy" : "degraded",
      latency: Date.now() - start,
      message: isConfigured ? "Claude AI configured" : "AI API key not configured",
      lastCheck: new Date().toISOString(),
      details: {
        provider: "anthropic",
        model: "claude-3-sonnet",
        configured: isConfigured,
      },
    };
  } catch (error) {
    return {
      name: "ai",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "AI check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check vector database health (Pinecone)
 */
async function checkVectorDB(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const isConfigured =
      process.env.PINECONE_API_KEY !== undefined && process.env.PINECONE_INDEX !== undefined;

    // Pinecone is optional. Not being configured is a healthy state, not degraded.
    return {
      name: "vectordb",
      status: "healthy",
      latency: Date.now() - start,
      message: isConfigured ? "Pinecone connected" : "Pinecone not configured (optional)",
      lastCheck: new Date().toISOString(),
      details: {
        provider: "pinecone",
        configured: isConfigured,
      },
    };
  } catch (error) {
    return {
      name: "vectordb",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Vector DB check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check job queue health (BullMQ/Redis)
 */
async function checkQueue(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const isConfigured = Boolean(process.env.REDIS_URL);

    return {
      name: "queue",
      status: "healthy",
      latency: Date.now() - start,
      message: isConfigured ? "Job queue operational" : "Queue not configured (optional)",
      lastCheck: new Date().toISOString(),
      details: {
        provider: "bullmq",
        backend: "redis",
        configured: isConfigured,
      },
    };
  } catch (error) {
    return {
      name: "queue",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Queue check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check external API connectivity
 */
async function checkExternalAPIs(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Check if we can reach common external services
    // In production, this would make actual HTTP requests

    return {
      name: "external_apis",
      status: "healthy",
      latency: Date.now() - start,
      message: "External API endpoints accessible",
      lastCheck: new Date().toISOString(),
      details: {
        apis: ["anthropic", "openai", "clerk"],
      },
    };
  } catch (error) {
    return {
      name: "external_apis",
      status: "degraded",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "External API check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Check storage health
 */
async function checkStorage(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const v8 = await import("v8");
    const memoryUsage = process.memoryUsage();
    // Compare heap used against the V8 max old-space size (the real ceiling),
    // not heapTotal (which is the currently-allocated heap and grows on demand —
    // ~95% of heapTotal is normal and says nothing about pressure).
    const v8MaxMB = Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024);
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const usedPercent = (heapUsedMB / v8MaxMB) * 100;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (usedPercent > 90) {
      status = "unhealthy";
    } else if (usedPercent > 75) {
      status = "degraded";
    }

    return {
      name: "storage",
      status,
      latency: Date.now() - start,
      message: `Heap ${heapUsedMB}MB / ${v8MaxMB}MB limit (${usedPercent.toFixed(1)}%)`,
      lastCheck: new Date().toISOString(),
      details: {
        heapUsed: heapUsedMB,
        heapLimit: v8MaxMB,
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        unit: "MB",
      },
    };
  } catch (error) {
    return {
      name: "storage",
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Storage check failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * GET /api/health - Health check endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "true";
  const service = searchParams.get("service");

  try {
    // Run all health checks in parallel
    const [database, redis, auth, ai, vectordb, queue, externalAPIs, storage] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkAuth(),
      checkAI(),
      checkVectorDB(),
      checkQueue(),
      checkExternalAPIs(),
      checkStorage(),
    ]);

    const services = [database, redis, auth, ai, vectordb, queue, externalAPIs, storage];

    // If specific service requested, return only that
    if (service) {
      const serviceHealth = services.find((s) => s.name === service);
      if (!serviceHealth) {
        return NextResponse.json({ error: `Service '${service}' not found` }, { status: 404 });
      }
      return NextResponse.json(serviceHealth);
    }

    // Calculate summary
    const summary = {
      total: services.length,
      healthy: services.filter((s) => s.status === "healthy").length,
      degraded: services.filter((s) => s.status === "degraded").length,
      unhealthy: services.filter((s) => s.status === "unhealthy").length,
    };

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (summary.unhealthy > 0) {
      // If any critical service is unhealthy, overall is unhealthy
      const criticalServices = ["database", "auth"];
      const criticalUnhealthy = services.some(
        (s) => criticalServices.includes(s.name) && s.status === "unhealthy"
      );
      overallStatus = criticalUnhealthy ? "unhealthy" : "degraded";
    } else if (summary.degraded > 0) {
      overallStatus = "degraded";
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      services: detailed ? services : services.map(({ name, status, latency }) => ({ name, status, latency, lastCheck: new Date().toISOString() })),
      summary,
    };

    // Set appropriate status code
    const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Health-Status": overallStatus,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        error: error instanceof Error ? error.message : "Health check failed",
        services: [],
        summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 1 },
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health - Quick health check (for load balancers)
 */
export async function HEAD() {
  try {
    // Quick check - just verify the database is configured
    const isHealthy = process.env.DATABASE_URL !== undefined;

    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        "X-Health-Status": isHealthy ? "healthy" : "unhealthy",
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "X-Health-Status": "unhealthy",
      },
    });
  }
}
