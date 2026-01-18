import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Google Analytics Integration API (F122)
 * GET /api/integrations/google-analytics - Get connection status, metrics
 * POST /api/integrations/google-analytics - OAuth flow, select property
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  gaManager,
  formatGAConnectionResponse,
} from "@/lib/integrations/google-analytics";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const action = searchParams.get("action") || "status";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "status":
        return handleGetStatus(brandId);

      case "overview":
        return handleGetOverview(brandId, searchParams);

      case "trafficSources":
        return handleGetTrafficSources(brandId, searchParams);

      case "pagePerformance":
        return handleGetPagePerformance(brandId, searchParams);

      case "aiTraffic":
        return handleGetAITraffic(brandId, searchParams);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, overview, trafficSources, pagePerformance, aiTraffic, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process GA request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "callback":
        return handleOAuthCallback(body);

      case "getAccounts":
        return handleGetAccounts(body);

      case "getProperties":
        return handleGetProperties(body);

      case "selectProperty":
        return handleSelectProperty(body);

      case "runReport":
        return handleRunReport(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, getAccounts, getProperties, selectProperty, runReport, disconnect" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "GA operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = gaManager.getConnection(brandId);

  if (!connection) {
    return NextResponse.json({
      success: true,
      connected: false,
      connection: null,
    });
  }

  return NextResponse.json({
    success: true,
    connected: true,
    connection: formatGAConnectionResponse(connection),
  });
}

async function handleGetOverview(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  const metrics = await gaManager.getOverviewMetrics(brandId, startDate, endDate);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    metrics,
  });
}

async function handleGetTrafficSources(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const limit = parseInt(searchParams.get("limit") || "10");

  const sources = await gaManager.getTrafficSources(brandId, startDate, endDate, limit);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    sources,
  });
}

async function handleGetPagePerformance(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const limit = parseInt(searchParams.get("limit") || "20");

  const pages = await gaManager.getPagePerformance(brandId, startDate, endDate, limit);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    pages,
  });
}

async function handleGetAITraffic(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  const aiSources = await gaManager.getAIReferralTraffic(brandId, startDate, endDate);

  const totalSessions = aiSources.reduce((sum, s) => sum + s.sessions, 0);
  const totalUsers = aiSources.reduce((sum, s) => sum + s.users, 0);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    summary: {
      totalSessions,
      totalUsers,
      sourceCount: aiSources.length,
    },
    sources: aiSources,
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = gaManager.getAuthorizationUrl(brandId, state);

  return NextResponse.json({
    success: true,
    authUrl,
    state,
  });
}

// POST handlers
async function handleOAuthCallback(body: unknown) {
  const schema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
  });

  const { code, state } = schema.parse(body);
  const [brandId] = state.split(":");

  if (!brandId) {
    return NextResponse.json(
      { error: "Invalid state parameter" },
      { status: 400 }
    );
  }

  // Exchange code for tokens
  const tokens = await gaManager.exchangeCodeForTokens(code);

  // Get accounts to let user select
  const accounts = await gaManager.getAccounts(tokens.accessToken);

  return NextResponse.json({
    success: true,
    message: "Authorization successful. Select an account and property.",
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
    accounts,
  });
}

async function handleGetAccounts(body: unknown) {
  const schema = z.object({
    accessToken: z.string().min(1),
  });

  const { accessToken } = schema.parse(body);

  const accounts = await gaManager.getAccounts(accessToken);

  return NextResponse.json({
    success: true,
    accounts,
  });
}

async function handleGetProperties(body: unknown) {
  const schema = z.object({
    accessToken: z.string().min(1),
    accountId: z.string().min(1),
  });

  const { accessToken, accountId } = schema.parse(body);

  const properties = await gaManager.getProperties(accessToken, accountId);

  return NextResponse.json({
    success: true,
    properties,
  });
}

async function handleSelectProperty(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number(),
    accountId: z.string().min(1),
    accountName: z.string().min(1),
    propertyId: z.string().min(1),
    propertyName: z.string().min(1),
  });

  const data = schema.parse(body);

  const connection = await gaManager.createConnection(
    data.brandId,
    data.accessToken,
    data.refreshToken,
    data.expiresIn,
    data.accountId,
    data.accountName,
    data.propertyId,
    data.propertyName
  );

  return NextResponse.json({
    success: true,
    message: "GA connected successfully",
    connection: formatGAConnectionResponse(connection),
  });
}

async function handleRunReport(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    startDate: z.string().default("30daysAgo"),
    endDate: z.string().default("today"),
    dimensions: z.array(z.string()).optional(),
    metrics: z.array(z.string()).min(1),
    limit: z.number().optional(),
  });

  const { brandId, ...reportOptions } = schema.parse(body);

  const report = await gaManager.runReport(brandId, reportOptions);

  return NextResponse.json({
    success: true,
    report,
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = gaManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No GA connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "GA disconnected",
  });
}
