import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

const onboardingSchema = z.object({
  brandName: z.string().min(1),
  brandUrl: z.string().optional(),
  industry: z.string().optional(),
  selectedPlatforms: z.array(z.string()),
  competitors: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = onboardingSchema.parse(body);

    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Mock mode when database is not configured
    if (!isDatabaseConfigured()) {
      const mockBrand = {
        id: `mock-brand-${Date.now()}`,
        organizationId: orgId,
        name: data.brandName,
        domain: data.brandUrl || null,
        industry: data.industry || null,
        monitoringEnabled: true,
        monitoringPlatforms: data.selectedPlatforms,
        competitors: data.competitors?.filter(c => c.trim().length > 0) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedStatus = {
        brandAdded: true,
        monitoringConfigured: true,
        auditRun: false,
        recommendationsReviewed: false,
        completedAt: null,
        dismissedAt: null,
      };

      return NextResponse.json({
        success: true,
        brand: mockBrand,
        onboardingStatus: updatedStatus,
      });
    }

    // Real database mode
    const { db } = await import("@/lib/db");
    const { brands, organizations } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      // Create organization with starter plan defaults (1 brand, 3 users)
      await db.insert(organizations).values({
        id: orgId,
        name: "My Organization",
        slug: "my-organization",
        plan: "starter",
        brandLimit: 1,  // Starter plan: 1 brand
        userLimit: 3,   // Starter plan: 3 users
      });
    }

    // Convert string competitors to BrandCompetitor objects
    const competitorObjects = (data.competitors || [])
      .filter(c => c.trim().length > 0)
      .map(name => ({ name, url: "", reason: "" }));

    const newBrand = await db
      .insert(brands)
      .values({
        organizationId: orgId,
        name: data.brandName,
        domain: data.brandUrl || null,
        industry: data.industry || null,
        monitoringEnabled: true,
        monitoringPlatforms: data.selectedPlatforms,
        competitors: competitorObjects as typeof brands.$inferInsert["competitors"],
      })
      .returning();

    const updatedStatus = {
      brandAdded: true,
      monitoringConfigured: true,
      auditRun: false,
      recommendationsReviewed: false,
      completedAt: null,
      dismissedAt: null,
    };

    await db
      .update(organizations)
      .set({
        onboardingStatus: updatedStatus,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    return NextResponse.json({
      success: true,
      brand: newBrand[0],
      onboardingStatus: updatedStatus,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[onboarding/complete] Error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
