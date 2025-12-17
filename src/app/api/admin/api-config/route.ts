/**
 * Admin API Configuration Management API
 * GET /api/admin/api-config - List all API integrations with filters
 * POST /api/admin/api-config - Create new API integration
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(request: NextRequest) {
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    // Build where conditions
    const conditions = [];

    // FR-7: Search by service name or provider
    if (search) {
      conditions.push(
        or(
          ilike(apiIntegrations.serviceName, `%${search}%`),
          ilike(apiIntegrations.provider, `%${search}%`)
        )
      );
    }

    // FR-7: Filter by status
    if (status && status !== "all") {
      conditions.push(eq(apiIntegrations.status, status as any));
    }

    // FR-7: Filter by category
    if (category && category !== "all") {
      conditions.push(eq(apiIntegrations.category, category as any));
    }

    // FR-1: Get all integrations
    const integrationsQuery = db
      .select()
      .from(apiIntegrations)
      .orderBy(desc(apiIntegrations.createdAt));

    // Apply conditions if any
    if (conditions.length > 0) {
      integrationsQuery.where(
        conditions.length === 1
          ? conditions[0]
          : and(...conditions)
      );
    }

    const integrationsList = await integrationsQuery;

    // AC-1.4: Return categories list
    const categories = ["ai_models", "search_apis", "analytics"];

    return NextResponse.json({
      success: true,
      integrations: integrationsList,
      categories,
    });
  } catch (error) {
    console.error("Admin api-config API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch integrations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    let currentUserId = "dev-super-admin";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      currentUserId = userId;

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { serviceName, provider, category, description, config } = body;

    // Validation
    if (!serviceName) {
      return NextResponse.json(
        { error: "serviceName is required" },
        { status: 400 }
      );
    }

    if (!provider) {
      return NextResponse.json(
        { error: "provider is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: "config is required" },
        { status: 400 }
      );
    }

    if (!config.apiKey) {
      return NextResponse.json(
        { error: "apiKey is required in config" },
        { status: 400 }
      );
    }

    // FR-2: Create new integration
    // AC-2.7: API keys should be encrypted (TODO: implement encryption in production)
    const [newIntegration] = await db
      .insert(apiIntegrations)
      .values({
        serviceName,
        provider,
        category,
        description: description || null,
        status: "configured", // Set status to configured when API key is provided
        isEnabled: true,
        config,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      integration: newIntegration,
    });
  } catch (error) {
    console.error("Admin api-config POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to create integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
