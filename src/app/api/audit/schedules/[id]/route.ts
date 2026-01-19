import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scheduledJobs, audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface UpdateScheduleRequest {
  name?: string;
  enabled?: boolean;
  type?: "daily" | "weekly" | "monthly" | "once";
  jobType?: string;
  config?: Record<string, unknown>;
}

/**
 * GET /api/audit/schedules/[id]
 * Fetch a single schedule
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schedule = await db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.id, id))
      .limit(1);

    if (schedule.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const s = schedule[0];
    return NextResponse.json({
      schedule: {
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
      },
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/audit/schedules/[id]
 * Update a schedule
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as UpdateScheduleRequest;

    // Verify schedule exists
    const existing = await db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Prepare update
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.config !== undefined) updates.config = body.config;
    if (body.type !== undefined) {
      updates.scheduleType = body.type;

      // Recalculate next run if type changed
      function calculateNextRun(): Date {
        const now = new Date();
        const next = new Date(now);

        switch (body.type) {
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
          default:
            break;
        }

        return next;
      }

      updates.nextRunAt = calculateNextRun();
    }
    if (body.jobType !== undefined) updates.jobType = body.jobType;

    // Update in database
    await db
      .update(scheduledJobs)
      .set(updates)
      .where(eq(scheduledJobs.id, id));

    const updated = await db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.id, id))
      .limit(1);

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Failed to update schedule" },
        { status: 500 }
      );
    }

    const s = updated[0];
    return NextResponse.json({
      schedule: {
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
      },
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/audit/schedules/[id]
 * Delete a schedule
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await db.delete(scheduledJobs).where(eq(scheduledJobs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
