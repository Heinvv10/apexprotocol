/**
 * Alert Rules API
 * 
 * CRUD operations for alert rules
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { alertRules } from "@/lib/db/schema/alert-rules";
import { eq, and, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

// Validation schema
const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
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
  ]),
  brandId: z.string().optional(),
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
  channels: z.array(z.string()).default(["in_app"]),
  frequency: z.enum(["instant", "hourly", "daily", "weekly"]).default("instant"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  enabled: z.boolean().default(true),
});

// GET - List alert rules
export async function GET(request: NextRequest) {
  try {
    const { orgId } = await auth();
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";

    const rules = await db
      .select()
      .from(alertRules)
      
      .orderBy(desc(alertRules.createdAt));

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error("Error fetching alert rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert rules" },
      { status: 500 }
    );
  }
}

// POST - Create new alert rule
export async function POST(request: NextRequest) {
  try {
    const { orgId, userId } = await auth();
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";
    const body = await request.json();

    // Validate input
    const parsed = createRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create rule
    const [rule] = await db
      .insert(alertRules)
      .values({
        id: createId(),
        brandId: data.brandId || null,
        name: data.name,
        description: data.description,
        type: data.trigger,
        conditions: data.conditions || {},
        channels: data.channels,
        frequency: data.frequency,
        priority: data.priority as "low" | "medium" | "high" | "critical" | undefined,
        enabled: data.enabled,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error creating alert rule:", error);
    return NextResponse.json(
      { error: "Failed to create alert rule" },
      { status: 500 }
    );
  }
}
