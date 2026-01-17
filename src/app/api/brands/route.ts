import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Competitor schema
const competitorSchema = z.object({
  name: z.string(),
  url: z.string(),
  reason: z.string(),
});

// Location schema
const locationSchema = z.object({
  type: z.enum(["headquarters", "office", "regional"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

// Personnel schema
const personnelSchema = z.object({
  name: z.string(),
  title: z.string(),
  linkedinUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  joinedDate: z.string().optional(),
});

// Validation schema for creating a brand
const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  domain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  // Keywords (expanded)
  keywords: z.array(z.string()).optional().default([]),
  seoKeywords: z.array(z.string()).optional().default([]),
  geoKeywords: z.array(z.string()).optional().default([]),
  // Competitors with full details
  competitors: z.array(competitorSchema).optional().default([]),
  // Business locations
  locations: z.array(locationSchema).optional().default([]),
  // Key personnel
  personnel: z.array(personnelSchema).optional().default([]),
  // Brand positioning
  valuePropositions: z.array(z.string()).optional().default([]),
  socialLinks: z.record(z.string(), z.string()).optional().default({}),
  // Voice settings
  voice: z
    .object({
      tone: z.enum(["professional", "friendly", "authoritative", "casual", "formal"]).optional(),
      personality: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      keyMessages: z.array(z.string()).optional(),
      avoidTopics: z.array(z.string()).optional(),
    })
    .optional(),
  // Visual settings (expanded)
  visual: z
    .object({
      primaryColor: z.string().optional().nullable(),
      secondaryColor: z.string().optional().nullable(),
      accentColor: z.string().optional().nullable(),
      colorPalette: z.array(z.string()).optional().default([]),
      fontFamily: z.string().optional().nullable(),
    })
    .optional(),
  // Confidence scores - use passthrough to accept any format from AI
  confidence: z
    .object({
      overall: z.number().optional().default(0),
      perField: z.record(z.string(), z.any()).optional().default({}),
    })
    .passthrough()
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

    // Database is required
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { brands, organizations } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

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

    const body = await request.json();

    // Log incoming data for debugging
    console.log("[BrandCreate] Incoming confidence:", JSON.stringify(body.confidence, null, 2));

    // Pre-process confidence perField to ensure numbers
    if (body.confidence?.perField) {
      const perField: Record<string, number> = {};
      for (const [key, value] of Object.entries(body.confidence.perField)) {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        perField[key] = isNaN(numValue) ? 0 : numValue;
      }
      body.confidence.perField = perField;
    }

    const validatedData = createBrandSchema.parse(body);

    // Database is required
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { brands, organizations } = await import("@/lib/db/schema");
    const { eq, count } = await import("drizzle-orm");
    const { detectBrandAdded, detectMonitoringConfigured } = await import("@/lib/onboarding/auto-detection");

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
      // Generate unique slug from orgId (remove special chars, add timestamp suffix)
      const baseSlug = orgId
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 40);
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      await db.insert(organizations).values({
        id: orgId,
        name: "My Organization",
        slug: uniqueSlug,
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

    // Create the brand
    const newBrand = await db
      .insert(brands)
      .values({
        organizationId: orgId,
        name: validatedData.name,
        domain: validatedData.domain || null,
        description: validatedData.description || null,
        tagline: validatedData.tagline || null,
        industry: validatedData.industry || null,
        logoUrl: validatedData.logoUrl || null,
        keywords: validatedData.keywords,
        seoKeywords: validatedData.seoKeywords,
        geoKeywords: validatedData.geoKeywords,
        competitors: validatedData.competitors,
        locations: validatedData.locations,
        personnel: validatedData.personnel,
        valuePropositions: validatedData.valuePropositions,
        socialLinks: validatedData.socialLinks as Record<string, string>,
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
          accentColor: validatedData.visual?.accentColor || null,
          colorPalette: validatedData.visual?.colorPalette || [],
          fontFamily: validatedData.visual?.fontFamily || null,
        },
        confidence: validatedData.confidence || { overall: 0, perField: {} },
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

      // 🚀 POST-CREATION BACKGROUND JOB: Populate related data tables
      // This runs asynchronously to populate:
      // - Social profiles from extracted links
      // - Competitors from extracted data
      // - Default portfolio
      // - GEO monitoring (future)
      const { populateBrandData } = await import("@/lib/services/brand-post-create");
      populateBrandData(newBrand[0].id).catch((err: Error) => {
        console.error("Failed to populate brand data:", err.message);
      });
    }

    return NextResponse.json({
      success: true,
      data: newBrand[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[BrandCreate] Validation error:", JSON.stringify(error.issues, null, 2));
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
