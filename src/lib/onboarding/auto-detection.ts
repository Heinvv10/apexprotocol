/**
 * Auto-detection utilities for onboarding progress
 * Automatically marks onboarding steps as complete when users perform actions
 */

import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Mark a specific onboarding step as complete
 */
export async function markOnboardingStepComplete(
  clerkOrgId: string,
  step: "brandAdded" | "monitoringConfigured" | "auditRun" | "recommendationsReviewed"
): Promise<void> {
  try {
    // Get current organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, clerkOrgId),
    });

    if (!org) {
      console.warn(`Organization not found for clerkOrgId: ${clerkOrgId}`);
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
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, clerkOrgId),
      with: {
        brands: true,
      },
    });

    if (org && org.brands && org.brands.length > 0) {
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
