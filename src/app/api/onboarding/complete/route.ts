import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

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

    let org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      await db.insert(organizations).values({
        id: orgId,
        name: "My Organization",
        slug: "my-organization",
        plan: "starter",
        brandLimit: 10,
      });
    }

    const newBrand = await db
      .insert(brands)
      .values({
        organizationId: orgId,
        name: data.brandName,
        domain: data.brandUrl || null,
        industry: data.industry || null,
        monitoringEnabled: true,
        monitoringPlatforms: data.selectedPlatforms,
        competitors: data.competitors?.filter(c => c.trim().length > 0) || [],
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
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
