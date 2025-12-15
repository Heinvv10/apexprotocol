/**
 * Public API v1 Route (F139)
 * External REST API with API key authentication
 *
 * Endpoints:
 * GET /api/v1?resource=brands - List brands
 * GET /api/v1?resource=mentions - List mentions
 * GET /api/v1?resource=recommendations - List recommendations
 * GET /api/v1?resource=analytics - Get analytics data
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  publicApiManager,
  createSuccessResponse,
  createErrorResponse,
  createPaginationMeta,
  formatApiKeyResponse,
  API_ERROR_CODES,
  type ApiKey,
  type ApiPermission,
} from "@/lib/api/public-api";

// Extract API key from request
function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get("X-API-Key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (not recommended for production)
  const apiKeyParam = new URL(request.url).searchParams.get("api_key");
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
}

// Authenticate request
function authenticateRequest(request: NextRequest): {
  authenticated: boolean;
  apiKey?: ApiKey;
  error?: { code: string; message: string; status: number };
} {
  const key = extractApiKey(request);

  if (!key) {
    return {
      authenticated: false,
      error: {
        code: API_ERROR_CODES.INVALID_API_KEY,
        message: "API key is required. Provide via Authorization header (Bearer token) or X-API-Key header.",
        status: 401,
      },
    };
  }

  const validation = publicApiManager.validateApiKey(key);

  if (!validation.valid) {
    return {
      authenticated: false,
      error: {
        code: validation.error?.code || API_ERROR_CODES.INVALID_API_KEY,
        message: validation.error?.message || "Invalid API key",
        status: 401,
      },
    };
  }

  return { authenticated: true, apiKey: validation.apiKey };
}

// Check rate limit
function checkRateLimit(keyId: string): {
  allowed: boolean;
  headers: Record<string, string>;
  error?: { code: string; message: string; retryAfter: number };
} {
  const result = publicApiManager.checkRateLimit(keyId);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit-Minute": String(publicApiManager.getApiKey(keyId)?.rateLimit.requestsPerMinute || 0),
    "X-RateLimit-Remaining-Minute": String(result.remaining.minute),
    "X-RateLimit-Reset-Minute": result.resetAt.minute.toISOString(),
    "X-RateLimit-Limit-Hour": String(publicApiManager.getApiKey(keyId)?.rateLimit.requestsPerHour || 0),
    "X-RateLimit-Remaining-Hour": String(result.remaining.hour),
    "X-RateLimit-Limit-Day": String(publicApiManager.getApiKey(keyId)?.rateLimit.requestsPerDay || 0),
    "X-RateLimit-Remaining-Day": String(result.remaining.day),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.error?.retryAfter || 60);
  }

  return {
    allowed: result.allowed,
    headers,
    error: result.error,
  };
}

// Check permission
function checkPermission(
  apiKey: ApiKey,
  permission: ApiPermission
): { allowed: boolean; error?: { code: string; message: string } } {
  if (!publicApiManager.hasPermission(apiKey, permission)) {
    return {
      allowed: false,
      error: {
        code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        message: `Missing required permission: ${permission}`,
      },
    };
  }
  return { allowed: true };
}

// Database query functions - TODO: Implement with Drizzle ORM
// These return empty results until database is connected

async function getBrands(_page: number, _pageSize: number) {
  // TODO: Implement database query
  // SELECT * FROM brands WHERE organization_id = $orgId LIMIT $pageSize OFFSET $offset
  return {
    items: [],
    total: 0,
  };
}

async function getMentions(_brandId: string | null, _page: number, _pageSize: number) {
  // TODO: Implement database query
  // SELECT * FROM mentions WHERE brand_id = $brandId LIMIT $pageSize OFFSET $offset
  return {
    items: [],
    total: 0,
  };
}

async function getRecommendations(_brandId: string | null, _page: number, _pageSize: number) {
  // TODO: Implement database query
  // SELECT * FROM recommendations WHERE brand_id = $brandId LIMIT $pageSize OFFSET $offset
  return {
    items: [],
    total: 0,
  };
}

async function getAnalytics(_brandId: string) {
  // TODO: Implement database query
  // Aggregate analytics data from mentions, recommendations, geo_scores tables
  return null;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Authenticate
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        createErrorResponse(
          auth.error!.code,
          auth.error!.message,
          undefined,
          requestId
        ),
        { status: auth.error!.status }
      );
    }

    const apiKey = auth.apiKey!;

    // Check rate limit
    const rateLimit = checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(
          rateLimit.error!.code,
          rateLimit.error!.message,
          { retryAfter: rateLimit.error!.retryAfter },
          requestId
        ),
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const brandId = searchParams.get("brandId");

    // Route to handler based on resource
    switch (resource) {
      case "brands": {
        const permCheck = checkPermission(apiKey, "brands:read");
        if (!permCheck.allowed) {
          return NextResponse.json(
            createErrorResponse(permCheck.error!.code, permCheck.error!.message, undefined, requestId),
            { status: 403, headers: rateLimit.headers }
          );
        }

        const data = await getBrands(page, pageSize);
        return NextResponse.json(
          createSuccessResponse(data.items, {
            requestId,
            pagination: createPaginationMeta(page, pageSize, data.total),
          }),
          { headers: rateLimit.headers }
        );
      }

      case "mentions": {
        const permCheck = checkPermission(apiKey, "mentions:read");
        if (!permCheck.allowed) {
          return NextResponse.json(
            createErrorResponse(permCheck.error!.code, permCheck.error!.message, undefined, requestId),
            { status: 403, headers: rateLimit.headers }
          );
        }

        const data = await getMentions(brandId, page, pageSize);
        return NextResponse.json(
          createSuccessResponse(data.items, {
            requestId,
            pagination: createPaginationMeta(page, pageSize, data.total),
          }),
          { headers: rateLimit.headers }
        );
      }

      case "recommendations": {
        const permCheck = checkPermission(apiKey, "recommendations:read");
        if (!permCheck.allowed) {
          return NextResponse.json(
            createErrorResponse(permCheck.error!.code, permCheck.error!.message, undefined, requestId),
            { status: 403, headers: rateLimit.headers }
          );
        }

        const data = await getRecommendations(brandId, page, pageSize);
        return NextResponse.json(
          createSuccessResponse(data.items, {
            requestId,
            pagination: createPaginationMeta(page, pageSize, data.total),
          }),
          { headers: rateLimit.headers }
        );
      }

      case "analytics": {
        const permCheck = checkPermission(apiKey, "analytics:read");
        if (!permCheck.allowed) {
          return NextResponse.json(
            createErrorResponse(permCheck.error!.code, permCheck.error!.message, undefined, requestId),
            { status: 403, headers: rateLimit.headers }
          );
        }

        if (!brandId) {
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.BAD_REQUEST,
              "brandId is required for analytics",
              undefined,
              requestId
            ),
            { status: 400, headers: rateLimit.headers }
          );
        }

        const data = await getAnalytics(brandId);
        if (!data) {
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.RESOURCE_NOT_FOUND,
              "No analytics data available. Database connection required.",
              undefined,
              requestId
            ),
            { status: 404, headers: rateLimit.headers }
          );
        }
        return NextResponse.json(
          createSuccessResponse(data, { requestId }),
          { headers: rateLimit.headers }
        );
      }

      case "keys": {
        // List API keys (self)
        const keys = publicApiManager.listApiKeys(apiKey.organizationId);
        return NextResponse.json(
          createSuccessResponse(keys.map(k => formatApiKeyResponse(k as ApiKey, false)), { requestId }),
          { headers: rateLimit.headers }
        );
      }

      default:
        return NextResponse.json(
          createErrorResponse(
            API_ERROR_CODES.BAD_REQUEST,
            "Invalid resource. Valid resources: brands, mentions, recommendations, analytics, keys",
            undefined,
            requestId
          ),
          { status: 400, headers: rateLimit.headers }
        );
    }
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        "An internal error occurred",
        error instanceof Error ? error.message : undefined,
        requestId
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Authenticate
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        createErrorResponse(
          auth.error!.code,
          auth.error!.message,
          undefined,
          requestId
        ),
        { status: auth.error!.status }
      );
    }

    const apiKey = auth.apiKey!;

    // Check rate limit
    const rateLimit = checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createErrorResponse(
          rateLimit.error!.code,
          rateLimit.error!.message,
          { retryAfter: rateLimit.error!.retryAfter },
          requestId
        ),
        { status: 429, headers: rateLimit.headers }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "createApiKey": {
        // Only enterprise tier can create new API keys
        if (apiKey.tier !== "enterprise") {
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
              "Only enterprise tier can create API keys",
              undefined,
              requestId
            ),
            { status: 403, headers: rateLimit.headers }
          );
        }

        const schema = z.object({
          name: z.string().min(1).max(100),
          tier: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
          expiresInDays: z.number().positive().optional(),
        });

        const data = schema.parse(body);
        const expiresAt = data.expiresInDays
          ? new Date(Date.now() + data.expiresInDays * 86400000)
          : undefined;

        const newKey = publicApiManager.generateApiKey(
          apiKey.organizationId,
          data.name,
          data.tier || "starter",
          { expiresAt }
        );

        return NextResponse.json(
          createSuccessResponse(formatApiKeyResponse(newKey, true), { requestId }),
          { status: 201, headers: rateLimit.headers }
        );
      }

      case "revokeApiKey": {
        const schema = z.object({
          keyId: z.string().min(1),
        });

        const data = schema.parse(body);
        const keyToRevoke = publicApiManager.getApiKey(data.keyId);

        if (!keyToRevoke || keyToRevoke.organizationId !== apiKey.organizationId) {
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.RESOURCE_NOT_FOUND,
              "API key not found",
              undefined,
              requestId
            ),
            { status: 404, headers: rateLimit.headers }
          );
        }

        publicApiManager.revokeApiKey(data.keyId);

        return NextResponse.json(
          createSuccessResponse({ revoked: true, keyId: data.keyId }, { requestId }),
          { headers: rateLimit.headers }
        );
      }

      case "rotateApiKey": {
        const schema = z.object({
          keyId: z.string().min(1),
        });

        const data = schema.parse(body);
        const keyToRotate = publicApiManager.getApiKey(data.keyId);

        if (!keyToRotate || keyToRotate.organizationId !== apiKey.organizationId) {
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.RESOURCE_NOT_FOUND,
              "API key not found",
              undefined,
              requestId
            ),
            { status: 404, headers: rateLimit.headers }
          );
        }

        const rotated = publicApiManager.rotateApiKey(data.keyId);
        if (!rotated) {
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.INTERNAL_ERROR,
              "Failed to rotate API key",
              undefined,
              requestId
            ),
            { status: 500, headers: rateLimit.headers }
          );
        }

        return NextResponse.json(
          createSuccessResponse(formatApiKeyResponse(rotated, true), { requestId }),
          { headers: rateLimit.headers }
        );
      }

      default:
        return NextResponse.json(
          createErrorResponse(
            API_ERROR_CODES.BAD_REQUEST,
            "Invalid action. Valid actions: createApiKey, revokeApiKey, rotateApiKey",
            undefined,
            requestId
          ),
          { status: 400, headers: rateLimit.headers }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.VALIDATION_ERROR,
          "Validation error",
          error.issues,
          requestId
        ),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        "An internal error occurred",
        error instanceof Error ? error.message : undefined,
        requestId
      ),
      { status: 500 }
    );
  }
}
