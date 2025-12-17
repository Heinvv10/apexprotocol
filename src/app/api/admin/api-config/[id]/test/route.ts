/**
 * Admin API Configuration Management - Test Connection Endpoint
 * POST /api/admin/api-config/:id/test - Test API connection
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { config } = body;

    // Validation
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

    // Get integration details
    const [integration] = await db
      .select()
      .from(apiIntegrations)
      .where(eq(apiIntegrations.id, params.id))
      .limit(1);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // FR-3: Test API connection
    // AC-3.1: Make actual API call to validate credentials
    const startTime = Date.now();
    let testResult;

    try {
      // Determine which API to test based on provider/category
      if (integration.provider === "Anthropic" || config.endpoint?.includes("anthropic")) {
        // Test Anthropic Claude API
        testResult = await testAnthropicConnection(config);
      } else if (integration.provider === "OpenAI" || config.endpoint?.includes("openai")) {
        // Test OpenAI API
        testResult = await testOpenAIConnection(config);
      } else if (integration.provider === "Google" || config.endpoint?.includes("generativelanguage")) {
        // Test Google Gemini API
        testResult = await testGoogleConnection(config);
      } else {
        // Generic test - just check if endpoint is reachable
        testResult = await testGenericConnection(config);
      }

      const responseTime = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

      // AC-3.3: Return success with connection details
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        details: {
          responseTime,
          ...testResult,
        },
      });
    } catch (error: any) {
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

      // AC-3.4: Return error when connection fails
      return NextResponse.json({
        success: false,
        error: error.message || "Connection test failed",
        details: {
          statusCode: error.statusCode || 500,
          responseTime,
        },
      });
    }
  } catch (error) {
    console.error("Admin api-config test connection error:", error);
    return NextResponse.json(
      {
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Test Anthropic Claude API connection
async function testAnthropicConnection(config: any) {
  const response = await fetch(
    config.endpoint || "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-3-5-sonnet-20241022",
        max_tokens: 10,
        messages: [{ role: "user", content: "Test connection" }],
      }),
      signal: AbortSignal.timeout(30000), // EC-2: 30 second timeout
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.error?.message || "Authentication failed: Invalid API key",
      statusCode: response.status,
    };
  }

  return {
    apiVersion: response.headers.get("anthropic-version") || "2023-06-01",
  };
}

// Test OpenAI API connection
async function testOpenAIConnection(config: any) {
  const response = await fetch(
    config.endpoint || "https://api.openai.com/v1/models",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
      },
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.error?.message || "Authentication failed: Invalid API key",
      statusCode: response.status,
    };
  }

  return {
    apiVersion: "v1",
  };
}

// Test Google Gemini API connection
async function testGoogleConnection(config: any) {
  const endpoint = config.endpoint || `https://generativelanguage.googleapis.com/v1/models?key=${config.apiKey}`;

  const response = await fetch(endpoint, {
    method: "GET",
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.error?.message || "Authentication failed: Invalid API key",
      statusCode: response.status,
    };
  }

  return {
    apiVersion: "v1",
  };
}

// Generic connection test (just check if endpoint is reachable)
async function testGenericConnection(config: any) {
  if (!config.endpoint) {
    throw {
      message: "No endpoint specified for testing",
      statusCode: 400,
    };
  }

  const response = await fetch(config.endpoint, {
    method: "GET",
    headers: config.apiKey ? {
      "Authorization": `Bearer ${config.apiKey}`,
    } : {},
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw {
      message: `Service returned ${response.status}: ${response.statusText}`,
      statusCode: response.status,
    };
  }

  return {
    status: "reachable",
  };
}
