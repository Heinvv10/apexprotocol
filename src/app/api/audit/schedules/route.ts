import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { scheduledJobs, audits } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest, NextResponse } from "next/server";

interface CreateScheduleRequest {
  name: string;
  type: "daily" | "weekly" | "monthly" | "once";
  jobType: "audit:scan" | "report:weekly" | "report:monthly";
  enabled: boolean;
  brandId: string;
  config?: Record<string, unknown>;
}

/**
 * GET /api/audit/schedules
 * Fetch all schedules for a brand
 */
export async function GET(req: NextRequest) {
  try {
    const __session = await getSession();
  const { userId, orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "Missing brandId parameter" },
        { status: 400 }
      );
    }

    // Fetch schedules for this brand
    const schedules = await db
      .select()
      .from(scheduledJobs)
      .where(
        and(
          eq(scheduledJobs.brandId, brandId),
          eq(scheduledJobs.orgId, orgId)
        )
      );

    return NextResponse.json({
      schedules: schedules.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.scheduleType,
        jobType: s.jobType,
        enabled: s.enabled,
        nextRun: s.nextRunAt?.toISOString(),
        lastRun: s.lastRunAt?.toISOString(),
        config: s.config,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/schedules
 * Create a new schedule
 */
export async function POST(req: NextRequest) {
  try {
    const __session = await getSession();
  const { userId, orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CreateScheduleRequest;
    const { name, type, jobType, enabled, brandId, config } = body;

    if (!name || !type || !jobType || !brandId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate next run time
    function calculateNextRun(): Date {
      const now = new Date();
      const next = new Date(now);

      switch (type) {
        case "daily":
          next.setDate(next.getDate() + 1);
          next.setHours(6, 0, 0, 0);
          break;
        case "weekly":
          const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
          next.setDate(next.getDate() + daysUntilMonday);
          next.setHours(6, 0, 0, 0);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + 1);
          next.setDate(1);
          next.setHours(6, 0, 0, 0);
          break;
        case "once":
        default:
          next.setHours(6, 0, 0, 0);
          break;
      }

      return next;
    }

    const id = createId();
    const now = new Date();
    const nextRun = calculateNextRun();

    // Create schedule in database
    await db.insert(scheduledJobs).values({
      id,
      name,
      scheduleType: type,
      jobType,
      brandId,
      orgId,
      enabled,
      config: config || {},
      nextRunAt: nextRun,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        schedule: {
          id,
          name,
          type,
          jobType,
          enabled,
          nextRun: nextRun.toISOString(),
          config,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
