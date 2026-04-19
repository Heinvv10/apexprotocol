import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Google Search Console Integration API (F123)
 * GET /api/integrations/google-search-console - Get connection status, search data
 * POST /api/integrations/google-search-console - OAuth flow, select site
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  gscManager,
  formatGSCConnectionResponse,
} from "@/lib/integrations/google-search-console";

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

      case "topQueries":
        return handleGetTopQueries(brandId, searchParams);

      case "topPages":
        return handleGetTopPages(brandId, searchParams);

      case "countryPerformance":
        return handleGetCountryPerformance(brandId, searchParams);

      case "devicePerformance":
        return handleGetDevicePerformance(brandId, searchParams);

      case "brandQueries":
        return handleGetBrandQueries(brandId, searchParams);

      case "aiQueries":
        return handleGetAIQueries(brandId, searchParams);

      case "dailyTrend":
        return handleGetDailyTrend(brandId, searchParams);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, topQueries, topPages, countryPerformance, devicePerformance, brandQueries, aiQueries, dailyTrend, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process GSC request",
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

      case "getSites":
        return handleGetSites(body);

      case "selectSite":
        return handleSelectSite(body);

      case "searchAnalytics":
        return handleSearchAnalytics(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, getSites, selectSite, searchAnalytics, disconnect" },
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
        error: "GSC operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = gscManager.getConnection(brandId);

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
    connection: formatGSCConnectionResponse(connection),
  });
}

async function handleGetTopQueries(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const limit = parseInt(searchParams.get("limit") || "20");

  const queries = await gscManager.getTopQueries(brandId, startDate, endDate, limit);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    queries,
  });
}

async function handleGetTopPages(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const limit = parseInt(searchParams.get("limit") || "20");

  const pages = await gscManager.getTopPages(brandId, startDate, endDate, limit);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    pages,
  });
}

async function handleGetCountryPerformance(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const limit = parseInt(searchParams.get("limit") || "10");

  const countries = await gscManager.getCountryPerformance(brandId, startDate, endDate, limit);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    countries,
  });
}

async function handleGetDevicePerformance(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  const devices = await gscManager.getDevicePerformance(brandId, startDate, endDate);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    devices,
  });
}

async function handleGetBrandQueries(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const brandName = searchParams.get("brandName");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!brandName) {
    return NextResponse.json(
      { error: "brandName is required for brand queries" },
      { status: 400 }
    );
  }

  const queries = await gscManager.getBrandQueries(brandId, brandName, startDate, endDate, limit);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    brandName,
    queries,
  });
}

async function handleGetAIQueries(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";
  const limit = parseInt(searchParams.get("limit") || "50");

  const queries = await gscManager.getAIRelatedQueries(brandId, startDate, endDate, limit);

  const totalClicks = queries.reduce((sum, q) => sum + q.clicks, 0);
  const totalImpressions = queries.reduce((sum, q) => sum + q.impressions, 0);

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    summary: {
      totalQueries: queries.length,
      totalClicks,
      totalImpressions,
      avgPosition: queries.length > 0
        ? queries.reduce((sum, q) => sum + q.position, 0) / queries.length
        : 0,
    },
    queries,
  });
}

async function handleGetDailyTrend(brandId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  const trend = await gscManager.getDailyTrend(brandId, startDate, endDate);

  // Calculate summary stats
  const totalClicks = trend.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = trend.reduce((sum, d) => sum + d.impressions, 0);
  const avgPosition = trend.length > 0
    ? trend.reduce((sum, d) => sum + d.position, 0) / trend.length
    : 0;

  return NextResponse.json({
    success: true,
    dateRange: { startDate, endDate },
    summary: {
      totalClicks,
      totalImpressions,
      avgPosition,
      avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    },
    trend,
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = gscManager.getAuthorizationUrl(brandId, state);

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
  const tokens = await gscManager.exchangeCodeForTokens(code);

  // Get sites to let user select
  const sites = await gscManager.getSites(tokens.accessToken);

  return NextResponse.json({
    success: true,
    message: "Authorization successful. Select a site.",
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
    sites,
  });
}

async function handleGetSites(body: unknown) {
  const schema = z.object({
    accessToken: z.string().min(1),
  });

  const { accessToken } = schema.parse(body);

  const sites = await gscManager.getSites(accessToken);

  return NextResponse.json({
    success: true,
    sites,
  });
}

async function handleSelectSite(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number(),
    siteUrl: z.string().min(1),
    permissionLevel: z.enum(["siteOwner", "siteFullUser", "siteRestrictedUser", "siteUnverifiedUser"]),
  });

  const data = schema.parse(body);

  const connection = gscManager.createConnection(
    data.brandId,
    data.accessToken,
    data.refreshToken,
    data.expiresIn,
    data.siteUrl,
    data.permissionLevel
  );

  return NextResponse.json({
    success: true,
    message: "GSC connected successfully",
    connection: formatGSCConnectionResponse(connection),
  });
}

async function handleSearchAnalytics(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    dimensions: z.array(z.enum(["query", "page", "country", "device", "date"])).optional(),
    rowLimit: z.number().optional(),
    startRow: z.number().optional(),
    aggregationType: z.enum(["auto", "byPage", "byProperty"]).optional(),
  });

  const { brandId, ...queryOptions } = schema.parse(body);

  const data = await gscManager.searchAnalytics(brandId, queryOptions);

  return NextResponse.json({
    success: true,
    data,
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = gscManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No GSC connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "GSC disconnected",
  });
}
