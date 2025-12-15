/**
 * Jobs API Endpoint (F180)
 * Connect job dashboard to BullMQ status API
 * Provides job queue status, job listing, and job management
 */

import { NextRequest, NextResponse } from "next/server";
import {
  monitorQueue,
  auditQueue,
  contentQueue,
  reportQueue,
  type Job,
  type JobStatus,
} from "@/lib/queue";

// All queues for aggregation
const queues = {
  monitor: monitorQueue,
  audit: auditQueue,
  content: contentQueue,
  report: reportQueue,
};

type QueueName = keyof typeof queues;

// Map internal status to dashboard status
function mapStatus(status: JobStatus): "queued" | "running" | "completed" | "failed" | "paused" {
  switch (status) {
    case "pending":
      return "queued";
    case "active":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "delayed":
      return "paused";
    default:
      return "queued";
  }
}

// Map job type to dashboard type
function mapJobType(type: string): "scan" | "audit" | "content" | "export" | "sync" {
  if (type.startsWith("monitor:")) return "scan";
  if (type.startsWith("audit:")) return "audit";
  if (type.startsWith("content:")) return "content";
  if (type.startsWith("report:")) return "export";
  return "sync";
}

// Map priority number to label
function mapPriority(priority: number): "low" | "normal" | "high" | "critical" {
  switch (priority) {
    case 1:
      return "critical";
    case 2:
      return "high";
    case 3:
      return "normal";
    case 4:
    case 5:
      return "low";
    default:
      return "normal";
  }
}

// Transform internal job to dashboard format
function transformJob(job: Job, queueName: string) {
  const startedAt = job.startedAt ? new Date(job.startedAt) : null;
  const completedAt = job.completedAt ? new Date(job.completedAt) : null;

  let duration: string | undefined;
  if (startedAt && completedAt) {
    const ms = completedAt.getTime() - startedAt.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    duration = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  }

  // Calculate progress for active jobs (based on attempts and timeout)
  let progress: number | undefined;
  if (job.status === "active") {
    // Estimate progress based on elapsed time vs timeout
    if (startedAt && job.timeout) {
      const elapsed = Date.now() - startedAt.getTime();
      progress = Math.min(95, Math.round((elapsed / job.timeout) * 100));
    } else {
      progress = 50; // Default progress for running jobs
    }
  }

  return {
    id: job.id,
    name: generateJobName(job),
    type: mapJobType(job.type),
    status: mapStatus(job.status),
    progress,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    duration,
    errorMessage: job.error,
    retryCount: job.attempts ?? 0,
    maxRetries: job.maxAttempts ?? 3,
    priority: mapPriority(job.priority ?? 3),
    createdBy: job.metadata?.userId || "system",
    queueName,
    metadata: {
      ...job.metadata,
      jobType: job.type,
      payload: JSON.stringify(job.payload).slice(0, 100),
    },
  };
}

// Generate human-readable job name
function generateJobName(job: Job): string {
  const payload = job.payload as Record<string, unknown>;

  switch (job.type) {
    case "monitor:scan":
      return `Brand Scan - ${payload.brandId || "Unknown"}`;
    case "monitor:platform":
      return `Platform Scan - ${job.metadata?.platform || "All"}`;
    case "audit:crawl":
      return `Site Audit - ${payload.url || "Unknown URL"}`;
    case "audit:analyze":
      return `Audit Analysis - ${payload.brandId || "Unknown"}`;
    case "content:generate":
      return `Content Generation - ${payload.contentType || "General"}`;
    case "recommendations:generate":
      return `Generate Recommendations - ${payload.brandId || "Unknown"}`;
    case "report:weekly":
      return `Weekly Report - ${payload.brandId || "All Brands"}`;
    case "report:monthly":
      return `Monthly Report - ${payload.brandId || "All Brands"}`;
    default:
      return `Job ${job.id}`;
  }
}

/**
 * GET /api/jobs - Get all jobs with stats
 * Query params:
 *   - status: filter by status (queued|running|completed|failed|paused|all)
 *   - queue: filter by queue (monitor|audit|content|report|all)
 *   - limit: max jobs to return (default 50)
 *   - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const queueFilter = searchParams.get("queue") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get stats from all queues
    const statsPromises = Object.entries(queues).map(async ([name, queue]) => {
      const stats = await queue.getStats();
      return { name, stats };
    });
    const allStats = await Promise.all(statsPromises);

    // Aggregate stats
    const aggregatedStats = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      paused: 0,
    };

    for (const { stats } of allStats) {
      aggregatedStats.queued += stats.pending;
      aggregatedStats.running += stats.active;
      aggregatedStats.completed += stats.completed;
      aggregatedStats.failed += stats.failed;
      aggregatedStats.paused += stats.delayed;
    }

    // Get jobs from queues
    const queuesToQuery = queueFilter === "all"
      ? Object.entries(queues)
      : [[queueFilter, queues[queueFilter as QueueName]]].filter(([, q]) => q);

    const allJobs: ReturnType<typeof transformJob>[] = [];

    for (const [queueName, queue] of queuesToQuery) {
      // Get jobs based on status filter
      const statusesToQuery: JobStatus[] = statusFilter === "all"
        ? ["pending", "active", "completed", "failed", "delayed"]
        : statusFilter === "queued"
        ? ["pending"]
        : statusFilter === "running"
        ? ["active"]
        : statusFilter === "paused"
        ? ["delayed"]
        : [statusFilter as JobStatus];

      for (const status of statusesToQuery) {
        const jobs = await (queue as typeof monitorQueue).getJobs(status, limit, 0);
        allJobs.push(...jobs.map((job) => transformJob(job, queueName as string)));
      }
    }

    // Sort by priority (critical first) and then by creation date
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    allJobs.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Sort by startedAt or by id (which contains timestamp)
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : parseInt(a.id.split("_")[1] || "0");
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : parseInt(b.id.split("_")[1] || "0");
      return bTime - aTime; // Newest first
    });

    // Apply pagination
    const paginatedJobs = allJobs.slice(offset, offset + limit);

    return NextResponse.json({
      jobs: paginatedJobs,
      stats: aggregatedStats,
      pagination: {
        total: allJobs.length,
        limit,
        offset,
        hasMore: offset + limit < allJobs.length,
      },
      queues: allStats.map(({ name, stats }) => ({
        name,
        pending: stats.pending,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed,
        delayed: stats.delayed,
      })),
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs - Job actions (retry, pause, resume, cancel)
 * Body: { action: "retry" | "pause" | "resume" | "cancel", jobId: string, queue?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, queue: queueName } = body;

    if (!action || !jobId) {
      return NextResponse.json(
        { error: "Missing action or jobId" },
        { status: 400 }
      );
    }

    // Find the job in queues
    let targetQueue: typeof monitorQueue | null = null;
    let job: Job | null = null;

    if (queueName && queues[queueName as QueueName]) {
      targetQueue = queues[queueName as QueueName];
      job = await targetQueue.getJob(jobId);
    } else {
      // Search all queues
      for (const [, queue] of Object.entries(queues)) {
        job = await queue.getJob(jobId);
        if (job) {
          targetQueue = queue;
          break;
        }
      }
    }

    if (!job || !targetQueue) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "retry":
        // Reset job for retry
        job.status = "pending";
        job.error = undefined;
        job.attempts = 0;
        await targetQueue.updateJob(job);
        return NextResponse.json({ success: true, message: "Job queued for retry" });

      case "pause":
        // Move to delayed status
        job.status = "delayed";
        job.scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // Far future
        await targetQueue.updateJob(job);
        return NextResponse.json({ success: true, message: "Job paused" });

      case "resume":
        // Resume paused job
        job.status = "pending";
        job.scheduledAt = new Date().toISOString();
        await targetQueue.updateJob(job);
        return NextResponse.json({ success: true, message: "Job resumed" });

      case "cancel":
        // Mark as failed with cancel message
        await targetQueue.failJob(jobId, "Cancelled by user");
        return NextResponse.json({ success: true, message: "Job cancelled" });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Jobs action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}
