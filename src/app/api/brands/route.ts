import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands, organizations } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { detectBrandAdded, detectMonitoringConfigured } from "@/lib/onboarding/auto-detection";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for creating a brand
const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  domain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  competitors: z.array(z.string()).optional().default([]),
  voice: z
    .object({
      tone: z.enum(["professional", "friendly", "authoritative", "casual", "formal"]).optional(),
      personality: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      keyMessages: z.array(z.string()).optional(),
      avoidTopics: z.array(z.string()).optional(),
    })
    .optional(),
  visual: z
    .object({
      primaryColor: z.string().optional().nullable(),
      secondaryColor: z.string().optional().nullable(),
      fontFamily: z.string().optional().nullable(),
    })
    .optional(),
  monitoringEnabled: z.boolean().optional().default(true),
  monitoringPlatforms: z
    .array(z.string())
    .optional()
    .default(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"]),
});

/**
 * GET /api/brands
 * Returns all brands for the current organization
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

    // Get all brands for this organization
    const brandList = await db
      .select()
      .from(brands)
      .where(eq(brands.organizationId, orgId))
      .orderBy(brands.createdAt);

    // Get organization to include brand limit info
    const org = await db
      .select({
        plan: organizations.plan,
        brandLimit: organizations.brandLimit,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const brandLimit = org[0]?.brandLimit ?? 1;
    const plan = org[0]?.plan ?? "starter";

    return NextResponse.json({
      success: true,
      data: {
        brands: brandList,
        meta: {
          total: brandList.length,
          limit: brandLimit,
          plan,
          canAddMore: brandList.length < brandLimit,
        },
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
 * POST /api/brands
 * Creates a new brand for the current organization
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Check organization exists and get brand limit
    const org = await db
      .select({
        id: organizations.id,
        brandLimit: organizations.brandLimit,
        plan: organizations.plan,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      // Create default organization if it doesn't exist
      await db.insert(organizations).values({
        id: orgId,
        name: "My Organization",
        slug: "my-organization",
        plan: "starter",
        brandLimit: 1,
      });
    }

    // Count existing brands
    const existingBrandsCount = await db
      .select({ count: count() })
      .from(brands)
      .where(eq(brands.organizationId, orgId));

    const currentCount = existingBrandsCount[0]?.count ?? 0;
    const brandLimit = org[0]?.brandLimit ?? 1;

    // Check brand limit
    if (currentCount >= brandLimit) {
      const plan = org[0]?.plan ?? "starter";
      return NextResponse.json(
        {
          success: false,
          error: `Brand limit reached. Your ${plan} plan allows ${brandLimit} brand(s). Upgrade to add more brands.`,
          code: "BRAND_LIMIT_REACHED",
          meta: {
            currentCount,
            limit: brandLimit,
            plan,
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBrandSchema.parse(body);

    // Create the brand
    const newBrand = await db
      .insert(brands)
      .values({
        organizationId: orgId,
        name: validatedData.name,
        domain: validatedData.domain || null,
        description: validatedData.description || null,
        industry: validatedData.industry || null,
        logoUrl: validatedData.logoUrl || null,
        keywords: validatedData.keywords,
        competitors: validatedData.competitors,
        voice: {
          tone: validatedData.voice?.tone || "professional",
          personality: validatedData.voice?.personality || [],
          targetAudience: validatedData.voice?.targetAudience || "",
          keyMessages: validatedData.voice?.keyMessages || [],
          avoidTopics: validatedData.voice?.avoidTopics || [],
        },
        visual: {
          primaryColor: validatedData.visual?.primaryColor || null,
          secondaryColor: validatedData.visual?.secondaryColor || null,
          fontFamily: validatedData.visual?.fontFamily || null,
        },
        monitoringEnabled: validatedData.monitoringEnabled,
        monitoringPlatforms: validatedData.monitoringPlatforms,
      })
      .returning();

    // Auto-detect: Mark "Add Brand" step as complete
    if (newBrand[0]) {
      // Get clerkOrgId from organization
      const orgData = await db
        .select({ clerkOrgId: organizations.clerkOrgId })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      
      if (orgData[0]?.clerkOrgId) {
        const clerkOrgId = orgData[0].clerkOrgId;
        // Run detections in background (don't await to avoid blocking response)
        detectBrandAdded(clerkOrgId).catch((err: Error) => {
          console.error("Failed to auto-detect brand added:", err.message);
        });
        
        // If monitoring is enabled, mark monitoring as configured
        if (newBrand[0].monitoringEnabled) {
          detectMonitoringConfigured(clerkOrgId).catch((err: Error) => {
            console.error("Failed to auto-detect monitoring configured:", err.message);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: newBrand[0],
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
