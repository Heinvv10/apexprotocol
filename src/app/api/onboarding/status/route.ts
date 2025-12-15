import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { initializeOnboardingStatus } from "@/lib/onboarding/initialize";

/**
 * GET /api/onboarding/status
 * Get onboarding status for current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fallback to demo org if no Clerk organization
    const effectiveOrgId = orgId || "demo-org-id";

    // Get organization - try by clerkOrgId first, then by id
    let org = orgId ? await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, orgId),
    }) : null;
    
    // Fallback to demo-org-id for development
    if (!org) {
      org = await db.query.organizations.findFirst({
        where: eq(organizations.id, "demo-org-id"),
      });
    }

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Initialize onboarding status based on existing data
    await initializeOnboardingStatus(org.id);
    
    // Re-fetch to get updated status
    const updatedOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, org.id),
    });
    
    // Return onboarding status (or defaults if null)
    const onboardingStatus = updatedOrg?.onboardingStatus || {
      brandAdded: false,
      monitoringConfigured: false,
      auditRun: false,
      recommendationsReviewed: false,
      completedAt: null,
      dismissedAt: null,
    };

    return NextResponse.json({ 
      status: onboardingStatus,
      organizationId: org.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching onboarding status:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding/status
 * Update onboarding status for current user's organization
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fallback to demo org if no Clerk organization
    const effectiveOrgId = orgId || "demo-org-id";

    const body = await request.json();
    const { 
      brandAdded, 
      monitoringConfigured, 
      auditRun, 
      recommendationsReviewed,
      dismissedAt,
    } = body;

    // Get current organization - try by clerkOrgId first, then by id
    let org = orgId ? await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, orgId),
    }) : null;
    
    // Fallback to demo-org-id for development
    if (!org) {
      org = await db.query.organizations.findFirst({
        where: eq(organizations.id, "demo-org-id"),
      });
    }

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Merge with existing status
    const currentStatus = org.onboardingStatus || {
      brandAdded: false,
      monitoringConfigured: false,
      auditRun: false,
      recommendationsReviewed: false,
      completedAt: null,
      dismissedAt: null,
    };

    const updatedStatus = {
      brandAdded: brandAdded !== undefined ? brandAdded : currentStatus.brandAdded,
      monitoringConfigured: monitoringConfigured !== undefined ? monitoringConfigured : currentStatus.monitoringConfigured,
      auditRun: auditRun !== undefined ? auditRun : currentStatus.auditRun,
      recommendationsReviewed: recommendationsReviewed !== undefined ? recommendationsReviewed : currentStatus.recommendationsReviewed,
      dismissedAt: dismissedAt !== undefined ? dismissedAt : currentStatus.dismissedAt,
      completedAt: currentStatus.completedAt,
    };

    // Check if all steps are complete
    const allComplete = 
      updatedStatus.brandAdded &&
      updatedStatus.monitoringConfigured &&
      updatedStatus.auditRun &&
      updatedStatus.recommendationsReviewed;

    // Set completedAt timestamp if all complete and not already set
    if (allComplete && !updatedStatus.completedAt) {
      updatedStatus.completedAt = new Date().toISOString();
    }

    // Update organization
    await db
      .update(organizations)
      .set({
        onboardingStatus: updatedStatus,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));

    return NextResponse.json({ 
      status: updatedStatus,
      organizationId: org.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating onboarding status:", errorMessage);
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
