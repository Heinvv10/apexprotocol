import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Admin API Configuration Management API
 * GET /api/admin/api-config - List all API integrations with filters
 * POST /api/admin/api-config - Create new API integration
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";
import { encryptConfigApiKey, maskConfigApiKey } from "@/lib/security";

export async function GET(request: NextRequest) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      actorId = userId;

      // Get actor details from Clerk
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        actorName = user.fullName || user.firstName || null;
        actorEmail = user.emailAddresses[0]?.emailAddress || null;
      } catch (_error) {
        // Continue without actor details if Clerk fails
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    } else {
      // Dev mode actor details
      actorId = "dev-super-admin";
      actorName = "Dev Super Admin";
      actorEmail = "dev@localhost";
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
      conditions.push(eq(apiIntegrations.status, status as "configured" | "not_configured" | "disabled" | "error"));
    }

    // FR-7: Filter by category
    if (category && category !== "all") {
      conditions.push(eq(apiIntegrations.category, category as "ai_models" | "search_apis" | "analytics"));
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

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_api_integrations",
        actionType: "access",
        description: `Super-admin listed API integrations (${integrationsList.length} results)`,
        metadata: {
          filters: {
            search,
            status,
            category,
          },
        },
        status: "success",
      },
      request
    );

    // Mask API keys in integrations before returning
    const maskedIntegrations = integrationsList.map((integration) => ({
      ...integration,
      config: integration.config ? maskConfigApiKey(integration.config) : null,
    }));

    return NextResponse.json({
      success: true,
      integrations: maskedIntegrations,
      categories,
    });
  } catch (error) {
    console.error("Admin api-config API error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_api_integrations",
        actionType: "access",
        description: "Failed to list API integrations",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

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
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    let currentUserId = "dev-super-admin";

    if (!devSuperAdmin) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      currentUserId = userId;
      actorId = userId;

      // Get actor details from Clerk
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        actorName = user.fullName || user.firstName || null;
        actorEmail = user.emailAddresses[0]?.emailAddress || null;
      } catch (_error) {
        // Continue without actor details if Clerk fails
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    } else {
      // Dev mode actor details
      actorId = "dev-super-admin";
      actorName = "Dev Super Admin";
      actorEmail = "dev@localhost";
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
    // AC-2.7: API keys are encrypted before storage
    const encryptedConfig = encryptConfigApiKey(config);

    const [newIntegration] = await db
      .insert(apiIntegrations)
      .values({
        serviceName,
        provider,
        category,
        description: description || null,
        status: "configured", // Set status to configured when API key is provided
        isEnabled: true,
        config: encryptedConfig,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      })
      .returning();

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "create_api_integration",
        actionType: "create",
        description: `Super-admin created API integration for ${serviceName}`,
        targetType: "api_integration",
        targetId: newIntegration.id,
        targetName: serviceName,
        changes: {
          after: {
            serviceName: newIntegration.serviceName,
            provider: newIntegration.provider,
            category: newIntegration.category,
            status: newIntegration.status,
            isEnabled: newIntegration.isEnabled,
          },
        },
        status: "success",
      },
      request
    );

    // Return with masked API key
    return NextResponse.json({
      success: true,
      integration: {
        ...newIntegration,
        config: newIntegration.config ? maskConfigApiKey(newIntegration.config) : null,
      },
    });
  } catch (error) {
    console.error("Admin api-config POST error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "create_api_integration",
        actionType: "create",
        description: "Failed to create API integration",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to create integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
