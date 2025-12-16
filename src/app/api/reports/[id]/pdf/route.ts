import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executiveReports, portfolios, organizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganizationId } from "@/lib/auth";
import { generateExecutiveReportPDF } from "@/lib/reports/pdf-generator";

// GET /api/reports/[id]/pdf - Generate and download PDF
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

    // Get report with portfolio and organization info
    const [report] = await db
      .select({
        id: executiveReports.id,
        title: executiveReports.title,
        periodStart: executiveReports.periodStart,
        periodEnd: executiveReports.periodEnd,
        content: executiveReports.content,
        portfolioId: executiveReports.portfolioId,
        portfolioName: portfolios.name,
        organizationName: organizations.name,
      })
      .from(executiveReports)
      .leftJoin(portfolios, eq(executiveReports.portfolioId, portfolios.id))
      .leftJoin(organizations, eq(executiveReports.organizationId, organizations.id))
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

    if (!report.content) {
      return NextResponse.json(
        { error: "Report content not available" },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateExecutiveReportPDF({
      title: report.title,
      portfolioName: report.portfolioName || undefined,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      content: report.content,
      organizationName: report.organizationName || "Your Organization",
    });

    // Update report with PDF generation timestamp
    await db
      .update(executiveReports)
      .set({
        pdfGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(executiveReports.id, id));

    // Create filename
    const filename = `${report.title.replace(/[^a-z0-9]/gi, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    // Return PDF as download
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/reports/[id]/pdf - Generate PDF and return URL (for async generation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get report
    const [report] = await db
      .select({
        id: executiveReports.id,
        title: executiveReports.title,
        periodStart: executiveReports.periodStart,
        periodEnd: executiveReports.periodEnd,
        content: executiveReports.content,
      })
      .from(executiveReports)
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

    // Update status to generating
    await db
      .update(executiveReports)
      .set({
        status: "generating",
        updatedAt: new Date(),
      })
      .where(eq(executiveReports.id, id));

    // In a production environment, this would:
    // 1. Queue a background job to generate the PDF
    // 2. Upload to S3/R2/Cloudinary
    // 3. Store the URL in pdfUrl field
    // 4. Update status to "completed"

    // For now, we'll generate inline and return the download URL
    const downloadUrl = `/api/reports/${id}/pdf`;

    // Update report
    await db
      .update(executiveReports)
      .set({
        pdfUrl: downloadUrl,
        pdfGeneratedAt: new Date(),
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(executiveReports.id, id));

    return NextResponse.json({
      success: true,
      pdfUrl: downloadUrl,
      message: "PDF generated successfully",
    });
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Update status to failed
    const { id } = await params;
    await db
      .update(executiveReports)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(executiveReports.id, id));

    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
