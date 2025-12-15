/**
 * Auto-scheduling Recommendations API (F115)
 * POST /api/recommendations/schedule - Schedule recommendations
 * GET /api/recommendations/schedule - Get schedules
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  autoScheduler,
  formatScheduleResponse,
  type Recommendation,
  type PriorityLevel,
} from "@/lib/recommendations";

// Request schemas
const scheduleRecommendationsSchema = z.object({
  recommendations: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      impact: z.object({
        potential: z.number(),
        confidence: z.number(),
        timeframe: z.string(),
      }),
      effort: z.object({
        level: z.enum(["quick", "moderate", "substantial", "major"]),
        estimatedHours: z.number().optional(),
        requiresExpertise: z.boolean(),
      }),
      relatedRecommendations: z.array(z.string()).optional(),
    })
  ),
  brandId: z.string().min(1),
  startDate: z.string().datetime().optional(),
  assignees: z.array(z.string()).optional(),
  respectDependencies: z.boolean().default(true),
});

const updateStatusSchema = z.object({
  scheduleId: z.string().min(1),
  status: z.enum([
    "pending",
    "scheduled",
    "in_progress",
    "completed",
    "skipped",
    "blocked",
    "overdue",
  ]),
  actualDuration: z.number().optional(),
});

const rescheduleSchema = z.object({
  scheduleId: z.string().min(1),
  newDate: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";
    const brandId = searchParams.get("brandId");
    const date = searchParams.get("date");

    switch (action) {
      case "list":
        return handleListSchedules(brandId, date);

      case "upcoming":
        return handleGetUpcoming(searchParams);

      case "overdue":
        return handleGetOverdue();

      case "statistics":
        return handleGetStatistics();

      case "single":
        return handleGetSingle(searchParams.get("id"));

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: list, upcoming, overdue, statistics, or single" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get schedules",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action || "schedule";

    switch (action) {
      case "schedule":
        return handleScheduleRecommendations(body);

      case "updateStatus":
        return handleUpdateStatus(body);

      case "reschedule":
        return handleReschedule(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: schedule, updateStatus, or reschedule" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Scheduling operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function handleListSchedules(brandId: string | null, date: string | null) {
  let schedules;

  if (date) {
    schedules = autoScheduler.getDateSchedules(new Date(date));
  } else if (brandId) {
    schedules = autoScheduler.getBrandSchedules(brandId);
  } else {
    return NextResponse.json(
      { error: "Provide brandId or date" },
      { status: 400 }
    );
  }

  // Sort by scheduled time
  schedules.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  return NextResponse.json({
    success: true,
    count: schedules.length,
    schedules: schedules.map(formatScheduleResponse),
    groupedByStatus: groupByStatus(schedules),
  });
}

function handleGetUpcoming(searchParams: URLSearchParams) {
  const days = searchParams.get("days")
    ? parseInt(searchParams.get("days")!)
    : 7;

  const upcoming = autoScheduler.getUpcomingSchedules(days);

  // Group by day
  const byDay: Record<string, any[]> = {};
  for (const schedule of upcoming) {
    const dayKey = schedule.scheduledFor.toISOString().split("T")[0];
    if (!byDay[dayKey]) {
      byDay[dayKey] = [];
    }
    byDay[dayKey].push(formatScheduleResponse(schedule));
  }

  return NextResponse.json({
    success: true,
    days,
    count: upcoming.length,
    schedules: upcoming.map(formatScheduleResponse),
    byDay,
  });
}

function handleGetOverdue() {
  const overdue = autoScheduler.getOverdueSchedules();

  return NextResponse.json({
    success: true,
    count: overdue.length,
    schedules: overdue.map(formatScheduleResponse),
    urgency:
      overdue.length === 0
        ? "none"
        : overdue.length < 3
          ? "low"
          : overdue.length < 10
            ? "medium"
            : "high",
  });
}

function handleGetStatistics() {
  const stats = autoScheduler.getStatistics();

  return NextResponse.json({
    success: true,
    statistics: {
      total: stats.total,
      byStatus: stats.byStatus,
      completionRate: Math.round(stats.completionRate * 100),
      averageDuration: Math.round(stats.averageDuration),
      overdueCount: stats.overdueCount,
    },
    health: getScheduleHealth(stats),
  });
}

function handleGetSingle(id: string | null) {
  if (!id) {
    return NextResponse.json(
      { error: "Schedule ID required" },
      { status: 400 }
    );
  }

  const schedule = autoScheduler.getSchedule(id);

  if (!schedule) {
    return NextResponse.json(
      { error: "Schedule not found", id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    schedule: formatScheduleResponse(schedule),
  });
}

async function handleScheduleRecommendations(body: unknown) {
  const { recommendations, brandId, startDate, assignees, respectDependencies } =
    scheduleRecommendationsSchema.parse(body);

  // Convert to Recommendation type
  const recs: Recommendation[] = recommendations.map((r) => ({
    id: r.id,
    brandId,
    source: "audit" as const,
    category: (r.category as "schema" | "content" | "technical" | "seo" | "voice" | "entity" | "qa") || "technical",
    priority: r.priority as PriorityLevel,
    priorityScore: r.impact.potential,
    title: r.title,
    description: r.description,
    impact: {
      score: r.impact.potential,
      description: `Impact confidence: ${r.impact.confidence}%`,
      expectedOutcome: r.impact.timeframe,
      affectedMetrics: [],
    },
    effort: {
      score: r.effort.level === "quick" ? 20 : r.effort.level === "moderate" ? 40 : r.effort.level === "substantial" ? 60 : 80,
      description: r.effort.level,
      estimatedTime: r.effort.estimatedHours ? `${r.effort.estimatedHours} hours` : "TBD",
      requiredSkills: r.effort.requiresExpertise ? ["Technical expertise"] : [],
    },
    urgency: r.impact.potential,
    confidence: r.impact.confidence,
    actionItems: [],
    metadata: {
      generatedBy: "schedule-api",
      lastUpdated: new Date(),
      version: 1,
    },
    relatedIssues: r.relatedRecommendations,
    status: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const result = autoScheduler.scheduleRecommendations(recs, brandId, {
    startDate: startDate ? new Date(startDate) : undefined,
    assignees,
    respectDependencies,
  });

  return NextResponse.json({
    success: true,
    summary: {
      totalScheduled: result.scheduled.length,
      totalUnscheduled: result.unscheduled.length,
      conflictCount: result.conflicts.length,
    },
    metrics: {
      averageDelay: Math.round(result.metrics.averageDelay * 10) / 10,
      utilizationRate: Math.round(result.metrics.utilizationRate * 100),
      criticalPathLength: result.metrics.criticalPathLength,
    },
    scheduled: result.scheduled.map(formatScheduleResponse),
    unscheduled: result.unscheduled,
    conflicts: result.conflicts,
  });
}

async function handleUpdateStatus(body: unknown) {
  const { scheduleId, status, actualDuration } = updateStatusSchema.parse(body);

  const updated = autoScheduler.updateStatus(scheduleId, status, actualDuration);

  if (!updated) {
    return NextResponse.json(
      { error: "Schedule not found", scheduleId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Status updated to ${status}`,
    schedule: formatScheduleResponse(updated),
  });
}

async function handleReschedule(body: unknown) {
  const { scheduleId, newDate } = rescheduleSchema.parse(body);

  const rescheduled = autoScheduler.reschedule(scheduleId, new Date(newDate));

  if (!rescheduled) {
    return NextResponse.json(
      { error: "Schedule not found", scheduleId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Recommendation rescheduled",
    schedule: formatScheduleResponse(rescheduled),
  });
}

// Helper functions
function groupByStatus(
  schedules: ReturnType<typeof autoScheduler.getBrandSchedules>
): Record<string, number> {
  const grouped: Record<string, number> = {
    pending: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    skipped: 0,
    blocked: 0,
    overdue: 0,
  };

  for (const schedule of schedules) {
    grouped[schedule.status]++;
  }

  return grouped;
}

function getScheduleHealth(stats: ReturnType<typeof autoScheduler.getStatistics>): {
  status: string;
  recommendations: string[];
} {
  const recommendations: string[] = [];

  if (stats.overdueCount > 0) {
    recommendations.push(`${stats.overdueCount} overdue items need attention`);
  }

  if (stats.completionRate < 0.5 && stats.total > 10) {
    recommendations.push("Low completion rate - consider reviewing priorities");
  }

  if (stats.byStatus.blocked > stats.total * 0.2) {
    recommendations.push("High number of blocked items - resolve dependencies");
  }

  const status =
    stats.overdueCount === 0 && stats.completionRate >= 0.7
      ? "healthy"
      : stats.overdueCount > 5 || stats.completionRate < 0.3
        ? "critical"
        : "needs_attention";

  return { status, recommendations };
}
