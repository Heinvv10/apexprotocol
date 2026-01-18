import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Default onboarding status for dev mode without database
const DEFAULT_ONBOARDING_STATUS = {
  brandAdded: false,
  monitoringConfigured: false,
  auditRun: false,
  recommendationsReviewed: false,
  completedAt: null,
  dismissedAt: null,
};

/**
 * GET /api/onboarding/status
 * Get onboarding status for current user's organization
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In development without database, return default status
    if (!isDatabaseConfigured() && process.env.NODE_ENV === "development") {
      return NextResponse.json({
        status: DEFAULT_ONBOARDING_STATUS,
        organizationId: orgId || "demo-org-id",
      });
    }

    // Dynamic imports for database operations (only when db is configured)
    const { db } = await import("@/lib/db");
    const { organizations } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { initializeOnboardingStatus } = await import("@/lib/onboarding/initialize");

    // Fallback to demo org if no organization
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
    const onboardingStatus = updatedOrg?.onboardingStatus || DEFAULT_ONBOARDING_STATUS;

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
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      brandAdded,
      monitoringConfigured,
      auditRun,
      recommendationsReviewed,
      dismissedAt,
    } = body;

    // In development without database, return mock updated status
    if (!isDatabaseConfigured() && process.env.NODE_ENV === "development") {
      const updatedStatus = {
        brandAdded: brandAdded ?? DEFAULT_ONBOARDING_STATUS.brandAdded,
        monitoringConfigured: monitoringConfigured ?? DEFAULT_ONBOARDING_STATUS.monitoringConfigured,
        auditRun: auditRun ?? DEFAULT_ONBOARDING_STATUS.auditRun,
        recommendationsReviewed: recommendationsReviewed ?? DEFAULT_ONBOARDING_STATUS.recommendationsReviewed,
        dismissedAt: dismissedAt ?? DEFAULT_ONBOARDING_STATUS.dismissedAt,
        completedAt: DEFAULT_ONBOARDING_STATUS.completedAt,
      };
      return NextResponse.json({
        status: updatedStatus,
        organizationId: orgId || "demo-org-id",
      });
    }

    // Dynamic imports for database operations (only when db is configured)
    const { db } = await import("@/lib/db");
    const { organizations } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

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
    const currentStatus = org.onboardingStatus || DEFAULT_ONBOARDING_STATUS;

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
