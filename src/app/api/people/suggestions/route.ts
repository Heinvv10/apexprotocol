/**
 * Team Member Suggestions API
 * Phase 5.1: LinkedIn integration for team member suggestions
 *
 * GET /api/people/suggestions - Get team member suggestions
 * GET /api/people/suggestions?type=completeness - Get team completeness report
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import {
  generateTeamSuggestions,
  analyzeTeamCompleteness,
} from "@/lib/people/suggestions";
import { z } from "zod";

// Query params schema
const querySchema = z.object({
  brandId: z.string().min(1, "Brand ID required"),
  type: z.enum(["suggestions", "completeness"]).optional().default("suggestions"),
  maxSuggestions: z.coerce.number().min(1).max(20).optional().default(10),
  includeMissingRoles: z.coerce.boolean().optional().default(true),
  includeIncompleteProfiles: z.coerce.boolean().optional().default(true),
  includeLinkedInCandidates: z.coerce.boolean().optional().default(true),
});

/**
 * GET /api/people/suggestions
 * Get team member suggestions or completeness report
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const url = new URL(request.url);
    const rawParams = {
      brandId: url.searchParams.get("brandId") || "",
      type: url.searchParams.get("type") || "suggestions",
      maxSuggestions: url.searchParams.get("maxSuggestions") || "10",
      includeMissingRoles: url.searchParams.get("includeMissingRoles") || "true",
      includeIncompleteProfiles: url.searchParams.get("includeIncompleteProfiles") || "true",
      includeLinkedInCandidates: url.searchParams.get("includeLinkedInCandidates") || "true",
    };

    const params = querySchema.parse(rawParams);

    // Return completeness report if requested
    if (params.type === "completeness") {
      const report = await analyzeTeamCompleteness(params.brandId);
      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    // Generate suggestions
    const suggestions = await generateTeamSuggestions(params.brandId, {
      maxSuggestions: params.maxSuggestions,
      includeMissingRoles: params.includeMissingRoles,
      includeIncompleteProfiles: params.includeIncompleteProfiles,
      includeLinkedInCandidates: params.includeLinkedInCandidates,
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Team suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate team suggestions" },
      { status: 500 }
    );
  }
}
