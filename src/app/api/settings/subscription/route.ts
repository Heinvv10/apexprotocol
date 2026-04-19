import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Plan definitions with their limits
const PLAN_LIMITS = {
  starter: {
    brandLimit: 1,
    userLimit: 3,
    features: ["basic_monitoring", "basic_audit"],
    price: 0,
    name: "Starter",
  },
  professional: {
    brandLimit: 5,
    userLimit: 10,
    features: ["basic_monitoring", "advanced_monitoring", "basic_audit", "advanced_audit", "content_creation"],
    price: 49,
    name: "Professional",
  },
  enterprise: {
    brandLimit: 999, // Effectively unlimited
    userLimit: 999,
    features: ["basic_monitoring", "advanced_monitoring", "basic_audit", "advanced_audit", "content_creation", "api_access", "white_label", "dedicated_support"],
    price: 199,
    name: "Enterprise",
  },
} as const;

// Validation schema for plan update
const updatePlanSchema = z.object({
  plan: z.enum(["starter", "professional", "enterprise"]),
});

/**
 * GET /api/settings/subscription
 * Returns the current subscription details
 */
export async function GET(_request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Get organization
    const org = await db
      .select({
        id: organizations.id,
        plan: organizations.plan,
        brandLimit: organizations.brandLimit,
        userLimit: organizations.userLimit,
        features: organizations.features,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      // Return default starter plan if org doesn't exist yet
      return NextResponse.json({
        success: true,
        data: {
          currentPlan: "starter",
          limits: PLAN_LIMITS.starter,
          allPlans: PLAN_LIMITS,
        },
      });
    }

    const currentPlan = org[0].plan as keyof typeof PLAN_LIMITS;

    return NextResponse.json({
      success: true,
      data: {
        currentPlan,
        limits: {
          ...PLAN_LIMITS[currentPlan],
          brandLimit: org[0].brandLimit,
          userLimit: org[0].userLimit,
          features: org[0].features,
        },
        allPlans: PLAN_LIMITS,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/subscription
 * Updates the subscription plan (demo - in real app would integrate with payment provider)
 */
export async function PUT(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePlanSchema.parse(body);
    const newPlan = validatedData.plan;
    const planLimits = PLAN_LIMITS[newPlan];

    // Check if organization exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (existingOrg.length === 0) {
      // Create organization with new plan
      const newOrg = await db
        .insert(organizations)
        .values({
          id: orgId,
          name: "My Organization",
          slug: "my-organization",
          plan: newPlan,
          brandLimit: planLimits.brandLimit,
          userLimit: planLimits.userLimit,
          features: [...planLimits.features],
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: {
          currentPlan: newPlan,
          limits: {
            ...planLimits,
            brandLimit: newOrg[0].brandLimit,
            userLimit: newOrg[0].userLimit,
            features: newOrg[0].features,
          },
          message: `Upgraded to ${planLimits.name} plan`,
        },
      });
    }

    // Update existing organization
    const updatedOrg = await db
      .update(organizations)
      .set({
        plan: newPlan,
        brandLimit: planLimits.brandLimit,
        userLimit: planLimits.userLimit,
        features: [...planLimits.features],
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        currentPlan: newPlan,
        limits: {
          ...planLimits,
          brandLimit: updatedOrg[0].brandLimit,
          userLimit: updatedOrg[0].userLimit,
          features: updatedOrg[0].features,
        },
        message: `${existingOrg[0].plan === newPlan ? "Plan unchanged" : `Upgraded to ${planLimits.name} plan`}`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
