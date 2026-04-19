import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executiveReports, portfolios } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Validation schema for updates
const updateReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  recipients: z.array(z.string().email()).optional(),
  status: z.enum(["scheduled", "generating", "completed", "failed"]).optional(),
});

// GET /api/reports/[id] - Get single report with full content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get report with portfolio info
    const [report] = await db
      .select({
        id: executiveReports.id,
        organizationId: executiveReports.organizationId,
        portfolioId: executiveReports.portfolioId,
        title: executiveReports.title,
        periodStart: executiveReports.periodStart,
        periodEnd: executiveReports.periodEnd,
        content: executiveReports.content,
        status: executiveReports.status,
        pdfUrl: executiveReports.pdfUrl,
        pdfGeneratedAt: executiveReports.pdfGeneratedAt,
        recipients: executiveReports.recipients,
        sentAt: executiveReports.sentAt,
        createdAt: executiveReports.createdAt,
        updatedAt: executiveReports.updatedAt,
        portfolioName: portfolios.name,
      })
      .from(executiveReports)
      .leftJoin(portfolios, eq(executiveReports.portfolioId, portfolios.id))
      .where(
        and(
          eq(executiveReports.id, id),
          eq(executiveReports.organizationId, orgId)
        )
      );

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateReportSchema.parse(body);

    // Verify report exists and belongs to organization
    const [existing] = await db
      .select({ id: executiveReports.id })
      .from(executiveReports)
      .where(
        and(
          eq(executiveReports.id, id),
          eq(executiveReports.organizationId, orgId)
        )
      );

    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Update report
    const [updatedReport] = await db
      .update(executiveReports)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.recipients && { recipients: data.recipients }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(executiveReports.id, id))
      .returning();

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error("Error updating report:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify report exists and belongs to organization
    const [existing] = await db
      .select({ id: executiveReports.id })
      .from(executiveReports)
      .where(
        and(
          eq(executiveReports.id, id),
          eq(executiveReports.organizationId, orgId)
        )
      );

    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Delete report
    await db.delete(executiveReports).where(eq(executiveReports.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
