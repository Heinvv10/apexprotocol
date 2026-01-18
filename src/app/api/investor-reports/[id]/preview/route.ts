import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { executiveReports, portfolios } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/investor-reports/[id]/preview - Preview investor report data
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

    // Return report data as JSON for preview
    return NextResponse.json({
      report: {
        id: report.id,
        title: report.title,
        portfolioName: report.portfolioName,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        status: report.status,
        content: report.content,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching investor report preview:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch report preview",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
