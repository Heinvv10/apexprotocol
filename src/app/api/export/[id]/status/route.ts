/**
 * Export Status API Route (F177)
 * Get status of an export job
 */

import { NextRequest, NextResponse } from "next/server";
import { exportJobs } from "../../route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/export/[id]/status
 * Get the status of an export job
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const job = exportJobs.get(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Export job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id: job.id,
      status: job.status,
      format: job.format,
      dataType: job.dataType,
      filename: job.filename,
      fileSize: job.fileSize,
      progress: job.status === "completed" ? 100 : job.status === "processing" ? 50 : 0,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to get export status" },
      { status: 500 }
    );
  }
}
