import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Brand Scrape Job Status API
 * GET - Poll job status and results
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import type { ScrapeJob } from "../route";

// Redis key for scrape jobs
const SCRAPE_JOB_KEY = (jobId: string) => `brand:scrape:${jobId}`;

/**
 * GET /api/brands/scrape/:jobId
 * Get the status and results of a scrape job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Authenticate user
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get job from Redis
    const redis = getRedisClient();
    const jobKey = SCRAPE_JOB_KEY(jobId);
    const data = await redis.get(jobKey);

    if (!data) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    const job: ScrapeJob =
      typeof data === "string" ? JSON.parse(data) : (data as ScrapeJob);

    // Verify the job belongs to this user
    if (job.userId !== userId) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    // Return job status and data
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        url: job.url,
        status: job.status,
        progress: job.progress,
        progressMessage: job.progressMessage,
        data: job.data,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error("[BrandScrape] Error getting job status:", error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brands/scrape/:jobId
 * Cancel/delete a scrape job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Authenticate user
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get job from Redis to verify ownership
    const redis = getRedisClient();
    const jobKey = SCRAPE_JOB_KEY(jobId);
    const data = await redis.get(jobKey);

    if (!data) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    const job: ScrapeJob =
      typeof data === "string" ? JSON.parse(data) : (data as ScrapeJob);

    // Verify the job belongs to this user
    if (job.userId !== userId) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    // Delete the job
    await redis.del(jobKey);

    return NextResponse.json({
      success: true,
      message: "Job deleted",
    });
  } catch (error) {
    console.error("[BrandScrape] Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
