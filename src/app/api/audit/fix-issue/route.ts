import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface FixIssueRequest {
  auditId: string;
  issueId: string;
  actionType: "ai-generate" | "view-guide" | "custom";
}

interface FixIssueResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  context?: {
    issue: any;
    auditUrl: string;
    recommendation: string;
  };
}

/**
 * POST /api/audit/fix-issue
 *
 * Handle quick fix actions for audit issues.
 * Routes to appropriate handler based on action type:
 * - ai-generate: Prepare context for content creation tool
 * - view-guide: Return guide content
 * - custom: Custom fix logic
 */
export async function POST(req: NextRequest): Promise<NextResponse<FixIssueResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as FixIssueRequest;
    const { auditId, issueId, actionType } = body;

    if (!auditId || !issueId || !actionType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the audit
    const audit = await db
      .select()
      .from(audits)
      .where(eq(audits.id, auditId))
      .limit(1);

    if (audit.length === 0) {
      return NextResponse.json(
        { success: false, message: "Audit not found" },
        { status: 404 }
      );
    }

    const auditData = audit[0];

    // Find the specific issue
    const issues = auditData.issues as Array<any>;
    const issue = issues.find((i: any) => i.id === issueId);

    if (!issue) {
      return NextResponse.json(
        { success: false, message: "Issue not found in audit" },
        { status: 404 }
      );
    }

    // Handle different action types
    switch (actionType) {
      case "ai-generate":
        // Return context for content creation tool
        return NextResponse.json({
          success: true,
          message: "Issue context prepared for AI generation",
          redirectUrl: `/dashboard/create?context=${encodeURIComponent(
            JSON.stringify({
              issue,
              auditUrl: auditData.url,
              issueId,
              auditId,
              context: "audit-fix",
            })
          )}`,
          context: {
            issue,
            auditUrl: auditData.url,
            recommendation: issue.recommendation || "No recommendation available",
          },
        });

      case "view-guide":
        // Return guide content
        return NextResponse.json({
          success: true,
          message: "Fix guide retrieved",
          context: {
            issue,
            auditUrl: auditData.url,
            recommendation: issue.recommendation || "No recommendation available",
          },
        });

      case "custom":
        // Custom fix logic (placeholder for future enhancements)
        return NextResponse.json({
          success: true,
          message: "Custom fix initiated",
          context: {
            issue,
            auditUrl: auditData.url,
            recommendation: issue.recommendation || "No recommendation available",
          },
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing fix issue request:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
