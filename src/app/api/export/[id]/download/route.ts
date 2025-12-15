/**
 * Export Download API Route (F177)
 * Download completed export file
 */

import { NextRequest, NextResponse } from "next/server";
import { exportJobs } from "../../route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/export/[id]/download
 * Download a completed export
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

    if (job.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Export not ready for download" },
        { status: 400 }
      );
    }

    if (!job.data) {
      return NextResponse.json(
        { success: false, error: "Export data not available" },
        { status: 404 }
      );
    }

    // Determine content type based on format
    const contentTypes: Record<string, string> = {
      csv: "text/csv; charset=utf-8",
      json: "application/json",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    };

    const contentType = contentTypes[job.format] || "application/octet-stream";

    // Create response with file data
    const encoder = new TextEncoder();
    const bytes = encoder.encode(job.data);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${job.filename}"`,
        "Content-Length": bytes.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to download export" },
      { status: 500 }
    );
  }
}
