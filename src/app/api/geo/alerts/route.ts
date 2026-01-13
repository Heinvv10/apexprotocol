/**
 * GEO Alerts API Route
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Endpoints:
 * - GET: Retrieve alerts for organization/brand
 * - POST: Create new alert (internal use)
 * - PATCH: Mark alert as read/dismissed
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { geoAlerts } from "@/lib/db/schema/geo-knowledge-base";
import { eq, and, isNull, desc, or, sql } from "drizzle-orm";
import {
  sortAlerts,
  filterExpiredAlerts,
  filterUnreadAlerts,
  getAlertCounts,
  type GeoAlertType,
  type AlertSeverity,
} from "@/lib/geo/alert-generator";
import { z } from "zod";

// Request schema for creating alerts
const createAlertSchema = z.object({
  brandId: z.string().optional(),
  alertType: z.enum([
    "algorithm_change",
    "recommendation_updated",
    "strategy_deprecated",
    "new_opportunity",
    "competitor_move",
    "score_impact",
  ]),
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  affectedPlatforms: z.array(z.string()),
  actionRequired: z.boolean().default(false),
  suggestedActions: z.array(z.string()).optional(),
  platformChangeId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Request schema for updating alerts
const updateAlertSchema = z.object({
  alertId: z.string(),
  action: z.enum(["read", "dismiss"]),
});

// Query params schema
const querySchema = z.object({
  brandId: z.string().optional(),
  type: z
    .enum([
      "algorithm_change",
      "recommendation_updated",
      "strategy_deprecated",
      "new_opportunity",
      "competitor_move",
      "score_impact",
      "all",
    ])
    .optional(),
  severity: z.enum(["info", "warning", "critical", "all"]).optional(),
  unreadOnly: z.coerce.boolean().optional(),
  includeExpired: z.coerce.boolean().optional(),
  includeDismissed: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/geo/alerts
 *
 * Retrieve alerts for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const devMode = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    let userId: string | null = null;
    let orgId: string | null = null;

    if (devMode) {
      userId = "dev-user";
      orgId = "dev-org";
    } else {
      const authResult = await auth();
      userId = authResult.userId;
      orgId = authResult.orgId;
    }

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      brandId: searchParams.get("brandId") || undefined,
      type: searchParams.get("type") || "all",
      severity: searchParams.get("severity") || "all",
      unreadOnly: searchParams.get("unreadOnly") || undefined,
      includeExpired: searchParams.get("includeExpired") || undefined,
      includeDismissed: searchParams.get("includeDismissed") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    // Build query conditions
    const conditions = [eq(geoAlerts.organizationId, orgId)];

    // Filter by brand if specified
    if (query.brandId) {
      conditions.push(eq(geoAlerts.brandId, query.brandId));
    }

    // Filter by type if not "all"
    if (query.type && query.type !== "all") {
      conditions.push(eq(geoAlerts.alertType, query.type));
    }

    // Filter by severity if not "all"
    if (query.severity && query.severity !== "all") {
      conditions.push(eq(geoAlerts.severity, query.severity));
    }

    // Filter out dismissed unless requested
    if (!query.includeDismissed) {
      conditions.push(isNull(geoAlerts.dismissedAt));
    }

    // Filter out expired unless requested
    if (!query.includeExpired) {
      conditions.push(
        or(
          isNull(geoAlerts.expiresAt),
          sql`${geoAlerts.expiresAt} > NOW()`
        )!
      );
    }

    // Filter unread only
    if (query.unreadOnly) {
      conditions.push(isNull(geoAlerts.readAt));
    }

    // Execute query
    const alerts = await db
      .select()
      .from(geoAlerts)
      .where(and(...conditions))
      .orderBy(desc(geoAlerts.createdAt))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(geoAlerts)
      .where(and(...conditions));

    const totalCount = countResult[0]?.count || 0;

    // Get summary statistics
    const allAlerts = await db
      .select()
      .from(geoAlerts)
      .where(
        and(
          eq(geoAlerts.organizationId, orgId),
          isNull(geoAlerts.dismissedAt),
          or(isNull(geoAlerts.expiresAt), sql`${geoAlerts.expiresAt} > NOW()`)!
        )
      );

    const unreadCount = allAlerts.filter((a) => !a.readAt).length;
    const criticalCount = allAlerts.filter(
      (a) => a.severity === "critical" && a.actionRequired && !a.readAt
    ).length;
    const alertCounts = getAlertCounts(allAlerts);

    return NextResponse.json({
      alerts: sortAlerts(alerts),
      pagination: {
        total: totalCount,
        limit: query.limit || 50,
        offset: query.offset || 0,
        hasMore: (query.offset || 0) + alerts.length < totalCount,
      },
      summary: {
        unreadCount,
        criticalCount,
        byType: alertCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo/alerts
 *
 * Create a new alert (typically called by internal systems)
 */
export async function POST(request: NextRequest) {
  try {
    const devMode = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    let userId: string | null = null;
    let orgId: string | null = null;

    if (devMode) {
      userId = "dev-user";
      orgId = "dev-org";
    } else {
      const authResult = await auth();
      userId = authResult.userId;
      orgId = authResult.orgId;
    }

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createAlertSchema.parse(body);

    const [alert] = await db
      .insert(geoAlerts)
      .values({
        organizationId: orgId,
        brandId: data.brandId,
        alertType: data.alertType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        affectedPlatforms: data.affectedPlatforms,
        actionRequired: data.actionRequired,
        suggestedActions: data.suggestedActions,
        platformChangeId: data.platformChangeId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      })
      .returning();

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/geo/alerts
 *
 * Update an alert (mark as read or dismissed)
 */
export async function PATCH(request: NextRequest) {
  try {
    const devMode = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    let userId: string | null = null;
    let orgId: string | null = null;

    if (devMode) {
      userId = "dev-user";
      orgId = "dev-org";
    } else {
      const authResult = await auth();
      userId = authResult.userId;
      orgId = authResult.orgId;
    }

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, action } = updateAlertSchema.parse(body);

    // Verify the alert belongs to the user's organization
    const existingAlert = await db
      .select()
      .from(geoAlerts)
      .where(
        and(eq(geoAlerts.id, alertId), eq(geoAlerts.organizationId, orgId))
      )
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Update based on action
    const updateData =
      action === "read"
        ? { readAt: new Date() }
        : { dismissedAt: new Date() };

    const [updatedAlert] = await db
      .update(geoAlerts)
      .set(updateData)
      .where(eq(geoAlerts.id, alertId))
      .returning();

    return NextResponse.json({ alert: updatedAlert });
  } catch (error) {
    console.error("Error updating alert:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
