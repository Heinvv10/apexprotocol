import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { executiveReports, portfolios } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateInvestorReportPDF } from "@/lib/reports/investor-report";

// GET /api/investor-reports/[id]/pdf - Download PDF for investor report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reportId = id;

    // Fetch report with portfolio info
    const [report] = await db
      .select({
        id: executiveReports.id,
        organizationId: executiveReports.organizationId,
        portfolioId: executiveReports.portfolioId,
        portfolioName: portfolios.name,
        title: executiveReports.title,
        reportType: executiveReports.reportType,
        periodStart: executiveReports.periodStart,
        periodEnd: executiveReports.periodEnd,
        status: executiveReports.status,
        content: executiveReports.content,
        createdAt: executiveReports.createdAt,
      })
      .from(executiveReports)
      .leftJoin(portfolios, eq(executiveReports.portfolioId, portfolios.id))
      .where(
        and(
          eq(executiveReports.id, reportId),
          eq(executiveReports.organizationId, orgId),
          eq(executiveReports.reportType, "investor")
        )
      )
      .limit(1);

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (report.status !== "completed") {
      return NextResponse.json(
        { error: `Report is ${report.status}. PDF only available for completed reports.` },
        { status: 400 }
      );
    }

    // Note: Chart generation is skipped for server-side rendering
    // Charts require client-side rendering with recharts-to-png
    // Future enhancement: Implement server-side chart generation
    const content = report.content as any;

    // Generate PDF buffer
    const pdfBuffer = await generateInvestorReportPDF({
      title: report.title || `Investor Intelligence Report - ${report.portfolioName}`,
      portfolioName: report.portfolioName || "Unknown Portfolio",
      periodStart: report.periodStart || new Date(),
      periodEnd: report.periodEnd || new Date(),
      content: content,
      organizationName: orgId,
      geoTrendsChartImage: undefined, // Chart generation pending server-side implementation
    });

    // Return PDF as download
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Investor_Report_${report.portfolioName?.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating investor report PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
