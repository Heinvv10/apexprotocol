/**
 * Auto-detection utilities for onboarding progress
 * Automatically marks onboarding steps as complete when users perform actions
 */

import { db } from "@/lib/db";
import { organizations, brands } from "@/lib/db/schema";
import { eq, or, count } from "drizzle-orm";

/**
 * Mark a specific onboarding step as complete.
 *
 * Callers pass the *internal* org id (`organizations.id`) from
 * `getOrganizationId()`. The parameter name `clerkOrgId` is a legacy artifact
 * from the Clerk era — we now match on `id` first and fall back to
 * `clerkOrgId` so historical rows carrying a Clerk org id still resolve.
 */
export async function markOnboardingStepComplete(
  clerkOrgId: string,
  step: "brandAdded" | "monitoringConfigured" | "auditRun" | "recommendationsReviewed"
): Promise<void> {
  try {
    const org = await db.query.organizations.findFirst({
      where: or(
        eq(organizations.id, clerkOrgId),
        eq(organizations.clerkOrgId, clerkOrgId),
      ),
    });

    if (!org) {
      console.warn(`Organization not found for id/clerkOrgId: ${clerkOrgId}`);
      return;
    }

    // Get current onboarding status
    const currentStatus = org.onboardingStatus || {
      brandAdded: false,
      monitoringConfigured: false,
      auditRun: false,
      recommendationsReviewed: false,
      completedAt: null,
      dismissedAt: null,
    };

    // If already marked as complete, skip
    if (currentStatus[step]) {
      return;
    }

    // Mark step as complete
    const updatedStatus = {
      ...currentStatus,
      [step]: true,
    };

    // Check if all steps are now complete
    const allComplete =
      updatedStatus.brandAdded &&
      updatedStatus.monitoringConfigured &&
      updatedStatus.auditRun &&
      updatedStatus.recommendationsReviewed;

    // Set completedAt timestamp if all complete
    if (allComplete && !updatedStatus.completedAt) {
      updatedStatus.completedAt = new Date().toISOString();
    }

    // Update database
    await db
      .update(organizations)
      .set({
        onboardingStatus: updatedStatus,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to mark onboarding step complete: ${errorMessage}`);
    // Don't throw - this is a background operation that shouldn't break the main flow
  }
}

/**
 * Check if user has any brands (for brandAdded detection)
 */
export async function detectBrandAdded(clerkOrgId: string): Promise<void> {
  try {
    // Same id/clerkOrgId fallback as markOnboardingStepComplete — the
    // parameter carries the internal org id for Supabase-era callers.
    const org = await db.query.organizations.findFirst({
      where: or(
        eq(organizations.id, clerkOrgId),
        eq(organizations.clerkOrgId, clerkOrgId),
      ),
    });

    if (!org) {
      return;
    }

    // Count brands separately (per organizations.ts recommendation)
    const brandCount = await db
      .select({ count: count() })
      .from(brands)
      .where(eq(brands.organizationId, org.id));

    if (brandCount[0]?.count && brandCount[0].count > 0) {
      await markOnboardingStepComplete(clerkOrgId, "brandAdded");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to detect brand added: ${errorMessage}`);
  }
}

/**
 * Detect monitoring configuration
 * (Called when monitoring job is created or settings are saved)
 */
export async function detectMonitoringConfigured(clerkOrgId: string): Promise<void> {
  await markOnboardingStepComplete(clerkOrgId, "monitoringConfigured");
}

/**
 * Detect audit run
 * (Called when audit is completed)
 */
export async function detectAuditRun(clerkOrgId: string): Promise<void> {
  await markOnboardingStepComplete(clerkOrgId, "auditRun");
}

/**
 * Detect recommendations reviewed
 * (Called when recommendations page is visited)
 */
export async function detectRecommendationsReviewed(clerkOrgId: string): Promise<void> {
  await markOnboardingStepComplete(clerkOrgId, "recommendationsReviewed");
}
