/**
 * Milestone Management API
 * PATCH /api/competitive/roadmap/[roadmapId]/milestone - Update milestone or action item status
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/clerk";
import {
  getRoadmapById,
  updateMilestoneStatus,
  updateActionItemStatus,
} from "@/lib/competitive";

interface Params {
  params: Promise<{
    roadmapId: string;
  }>;
}

/**
 * PATCH /api/competitive/roadmap/[roadmapId]/milestone
 * Update milestone status or action item completion
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roadmapId } = await params;
    const body = await request.json();
    const {
      milestoneId,
      action,
      actionItemId,
      isCompleted,
      actualScoreImpact,
    } = body;

    if (!milestoneId) {
      return NextResponse.json(
        { error: "milestoneId is required" },
        { status: 400 }
      );
    }

    // Verify roadmap exists
    const roadmap = await getRoadmapById(roadmapId);
    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    // Verify milestone belongs to this roadmap
    const milestone = roadmap.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found in this roadmap" },
        { status: 404 }
      );
    }

    switch (action) {
      case "start":
        await updateMilestoneStatus(milestoneId, "in_progress");
        return NextResponse.json({
          success: true,
          message: "Milestone started",
          status: "in_progress",
        });

      case "complete":
        await updateMilestoneStatus(milestoneId, "completed", actualScoreImpact);
        return NextResponse.json({
          success: true,
          message: "Milestone completed",
          status: "completed",
          actualScoreImpact,
        });

      case "skip":
        await updateMilestoneStatus(milestoneId, "skipped");
        return NextResponse.json({
          success: true,
          message: "Milestone skipped",
          status: "skipped",
        });

      case "reset":
        await updateMilestoneStatus(milestoneId, "pending");
        return NextResponse.json({
          success: true,
          message: "Milestone reset to pending",
          status: "pending",
        });

      case "updateActionItem":
        if (!actionItemId || typeof isCompleted !== "boolean") {
          return NextResponse.json(
            { error: "actionItemId and isCompleted are required for updateActionItem" },
            { status: 400 }
          );
        }
        await updateActionItemStatus(milestoneId, actionItemId, isCompleted);
        return NextResponse.json({
          success: true,
          message: `Action item ${isCompleted ? "completed" : "uncompleted"}`,
          actionItemId,
          isCompleted,
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'start', 'complete', 'skip', 'reset', or 'updateActionItem'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in milestone PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}
