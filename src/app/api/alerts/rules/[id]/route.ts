/**
 * Individual Alert Rule API
 * 
 * Update, delete, toggle alert rules
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { alertRules } from "@/lib/db/schema/alert-rules";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Update schema
const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  trigger: z.enum([
    "new_mention",
    "sentiment_negative",
    "sentiment_change",
    "visibility_drop",
    "visibility_spike",
    "competitor_mention",
    "competitor_beats",
    "position_change",
    "new_citation",
    "platform_new",
  ]).optional(),
  brandId: z.string().nullable().optional(),
  conditions: z.object({
    threshold: z.number().optional(),
    comparisonOperator: z.enum(["gt", "lt", "gte", "lte", "eq"]).optional(),
    platforms: z.array(z.string()).optional(),
    sentiments: z.array(z.string()).optional(),
    competitors: z.array(z.string()).optional(),
    minPosition: z.number().optional(),
    maxPosition: z.number().optional(),
    timeWindowMinutes: z.number().optional(),
    cooldownMinutes: z.number().optional(),
  }).optional(),
  channels: z.array(z.string()).optional(),
  frequency: z.enum(["instant", "hourly", "daily", "weekly"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  enabled: z.boolean().optional(),
});

// GET - Get single rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const __session = await getSession();
  const { orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";

    const [rule] = await db
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.id, id)
        )
      );

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error fetching alert rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert rule" },
      { status: 500 }
    );
  }
}

// PUT - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const __session = await getSession();
  const { orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";
    const body = await request.json();

    // Validate input
    const parsed = updateRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Update rule
    const [rule] = await db
      .update(alertRules)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.id, id)
        )
      )
      .returning();

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error updating alert rule:", error);
    return NextResponse.json(
      { error: "Failed to update alert rule" },
      { status: 500 }
    );
  }
}

// DELETE - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const __session = await getSession();
  const { orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";

    const [deleted] = await db
      .delete(alertRules)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.id, id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Alert rule deleted",
    });
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    return NextResponse.json(
      { error: "Failed to delete alert rule" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle rule enabled/disabled
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const __session = await getSession();
  const { orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";
    const body = await request.json();

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled field must be a boolean" },
        { status: 400 }
      );
    }

    const [rule] = await db
      .update(alertRules)
      .set({
        enabled: body.enabled,
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.id, id)
        )
      )
      .returning();

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error toggling alert rule:", error);
    return NextResponse.json(
      { error: "Failed to toggle alert rule" },
      { status: 500 }
    );
  }
}
