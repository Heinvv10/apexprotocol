/**
 * Export History API Route (F177)
 * List export history
 */

import { NextRequest, NextResponse } from "next/server";
import { exportJobs } from "../route";

/**
 * GET /api/export/history
 * Get export history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Get recent completed exports from memory
    const exports = Array.from(exportJobs.values())
      .filter((job) => job.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((job) => ({
        id: job.id,
        filename: job.filename,
        format: job.format,
        dataType: job.dataType,
        fileSize: job.fileSize || 0,
        downloadCount: 1, // In-memory, we don't track downloads
        createdAt: job.createdAt,
        expiresAt: new Date(
          new Date(job.createdAt).getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // 24 hours
      }));

    return NextResponse.json({
      success: true,
      exports,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch export history" },
      { status: 500 }
    );
  }
}
