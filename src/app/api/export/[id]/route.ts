/**
 * Export Job API Route (F177)
 * Get and delete specific export jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { exportJobs } from "../route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/export/[id]
 * Get details of a specific export job
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
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to get export" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/export/[id]
 * Delete an export job
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!exportJobs.has(id)) {
      return NextResponse.json(
        { success: false, error: "Export job not found" },
        { status: 404 }
      );
    }

    exportJobs.delete(id);

    return NextResponse.json({
      success: true,
      message: "Export deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete export" },
      { status: 500 }
    );
  }
}
