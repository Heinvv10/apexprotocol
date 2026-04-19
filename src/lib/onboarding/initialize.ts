/**
 * Initialize onboarding status based on existing data
 * Runs on dashboard load to detect completed steps
 */

import { db } from "@/lib/db";
import { organizations, brands, audits, recommendations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function initializeOnboardingStatus(orgId: string): Promise<void> {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return;
    }

    // Query brands separately to avoid relations error
    const orgBrands = await db.query.brands.findMany({
      where: eq(brands.organizationId, orgId),
    });

    const currentStatus = org.onboardingStatus || {
      brandAdded: false,
      monitoringConfigured: false,
      auditRun: false,
      recommendationsReviewed: false,
      completedAt: null,
      dismissedAt: null,
    };

    let updated = false;
    const newStatus = { ...currentStatus };

    if (!newStatus.brandAdded && orgBrands.length > 0) {
      newStatus.brandAdded = true;
      updated = true;
    }

    if (!newStatus.monitoringConfigured && orgBrands.some(b => b.monitoringEnabled)) {
      newStatus.monitoringConfigured = true;
      updated = true;
    }

    // Only count audits/recommendations that belong to this org's brands.
    // The old queries were org-global (any completed audit in the entire DB
    // would flip auditRun=true for every org on first page-load).
    const brandIds = orgBrands.map((b) => b.id);

    if (!newStatus.auditRun && brandIds.length > 0) {
      const completedAudit = await db.query.audits.findFirst({
        where: and(
          eq(audits.status, "completed"),
          inArray(audits.brandId, brandIds),
        ),
      });
      if (completedAudit) {
        newStatus.auditRun = true;
        updated = true;
      }
    }

    if (!newStatus.recommendationsReviewed && brandIds.length > 0) {
      const rec = await db.query.recommendations.findFirst({
        where: inArray(recommendations.brandId, brandIds),
      });
      if (rec) {
        newStatus.recommendationsReviewed = true;
        updated = true;
      }
    }

    const allComplete = 
      newStatus.brandAdded &&
      newStatus.monitoringConfigured &&
      newStatus.auditRun &&
      newStatus.recommendationsReviewed;

    if (allComplete && !newStatus.completedAt) {
      newStatus.completedAt = new Date().toISOString();
      updated = true;
    }

    if (updated) {
      await db
        .update(organizations)
        .set({
          onboardingStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to initialize onboarding status:", errorMessage);
  }
}
