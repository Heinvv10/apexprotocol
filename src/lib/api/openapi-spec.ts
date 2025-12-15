/**
 * OpenAPI Specification (F141)
 * API documentation for the Apex Public API
 */

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Apex GEO/AEO API",
    description: `
# Apex GEO/AEO Platform API

The Apex API provides programmatic access to brand monitoring, GEO scores, recommendations, and analytics data.

## Authentication

All API requests require authentication using an API key. You can include your API key in one of two ways:

1. **Authorization Header** (Recommended):
   \`\`\`
   Authorization: Bearer apex_starter_xxxxx
   \`\`\`

2. **X-API-Key Header**:
   \`\`\`
   X-API-Key: apex_starter_xxxxx
   \`\`\`

## Rate Limiting

Rate limits vary by API key tier:

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Free | 10 | 100 | 500 |
| Starter | 60 | 1,000 | 10,000 |
| Professional | 300 | 5,000 | 50,000 |
| Enterprise | 1,000 | 20,000 | 200,000 |

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit-Minute\`: Your per-minute limit
- \`X-RateLimit-Remaining-Minute\`: Remaining requests this minute
- \`X-RateLimit-Reset-Minute\`: When the limit resets (ISO 8601)

## Pagination

List endpoints support pagination via query parameters:
- \`page\`: Page number (default: 1)
- \`pageSize\`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
\`\`\`json
{
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 156,
      "totalPages": 8,
      "hasMore": true
    }
  }
}
\`\`\`

## Errors

All errors follow a consistent format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
\`\`\`
    `.trim(),
    version: "1.0.0",
    contact: {
      name: "Apex API Support",
      email: "api@apex.dev",
      url: "https://apex.dev/docs",
    },
    license: {
      name: "Proprietary",
      url: "https://apex.dev/terms",
    },
  },
  servers: [
    {
      url: "https://api.apex.dev",
      description: "Production",
    },
    {
      url: "https://staging-api.apex.dev",
      description: "Staging",
    },
    {
      url: "http://localhost:3000",
      description: "Development",
    },
  ],
  tags: [
    {
      name: "Brands",
      description: "Brand management endpoints",
    },
    {
      name: "Mentions",
      description: "AI platform mention tracking",
    },
    {
      name: "Recommendations",
      description: "Smart recommendations engine",
    },
    {
      name: "Analytics",
      description: "Analytics and reporting",
    },
    {
      name: "API Keys",
      description: "API key management",
    },
  ],
  paths: {
    "/api/v1": {
      get: {
        tags: ["Brands", "Mentions", "Recommendations", "Analytics"],
        summary: "Query resources",
        description: "Retrieve data from the API by specifying a resource type",
        operationId: "queryResources",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: "resource",
            in: "query",
            required: true,
            description: "The type of resource to query",
            schema: {
              type: "string",
              enum: ["brands", "mentions", "recommendations", "analytics", "keys"],
            },
          },
          {
            name: "brandId",
            in: "query",
            description: "Filter by brand ID (required for analytics)",
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            schema: { type: "integer", default: 1, minimum: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            description: "Items per page",
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
                examples: {
                  brands: {
                    summary: "List brands",
                    value: {
                      success: true,
                      data: [
                        {
                          id: "brand_1",
                          name: "Acme Corp",
                          domain: "acme.com",
                          geoScore: 72,
                          platforms: ["chatgpt", "claude", "gemini"],
                        },
                      ],
                      meta: {
                        requestId: "req_abc123",
                        timestamp: "2024-01-15T10:30:00Z",
                        pagination: {
                          page: 1,
                          pageSize: 20,
                          totalItems: 3,
                          totalPages: 1,
                          hasMore: false,
                        },
                      },
                    },
                  },
                  mentions: {
                    summary: "List mentions",
                    value: {
                      success: true,
                      data: [
                        {
                          id: "mention_1",
                          brandId: "brand_1",
                          platform: "chatgpt",
                          query: "Best project management tools",
                          sentiment: "positive",
                          sentimentScore: 0.85,
                          createdAt: "2024-01-15T10:30:00Z",
                        },
                      ],
                      meta: {
                        requestId: "req_def456",
                        timestamp: "2024-01-15T10:30:00Z",
                        pagination: {
                          page: 1,
                          pageSize: 20,
                          totalItems: 156,
                          totalPages: 8,
                          hasMore: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden - insufficient permissions",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
            headers: {
              "Retry-After": {
                description: "Seconds until rate limit resets",
                schema: { type: "integer" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["API Keys"],
        summary: "Manage API keys",
        description: "Create, revoke, or rotate API keys",
        operationId: "manageApiKeys",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CreateApiKeyRequest" },
                  { $ref: "#/components/schemas/RevokeApiKeyRequest" },
                  { $ref: "#/components/schemas/RotateApiKeyRequest" },
                ],
              },
              examples: {
                createApiKey: {
                  summary: "Create API key",
                  value: {
                    action: "createApiKey",
                    name: "Production Key",
                    tier: "professional",
                    expiresInDays: 365,
                  },
                },
                revokeApiKey: {
                  summary: "Revoke API key",
                  value: {
                    action: "revokeApiKey",
                    keyId: "key_abc123",
                  },
                },
                rotateApiKey: {
                  summary: "Rotate API key",
                  value: {
                    action: "rotateApiKey",
                    keyId: "key_abc123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyResponse" },
              },
            },
          },
          "201": {
            description: "API key created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyResponse" },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "API key as Bearer token",
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key in header",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        required: ["success"],
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string" },
              timestamp: { type: "string", format: "date-time" },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", enum: [false] },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          totalItems: { type: "integer" },
          totalPages: { type: "integer" },
          hasMore: { type: "boolean" },
        },
      },
      Brand: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          domain: { type: "string" },
          geoScore: { type: "number" },
          platforms: { type: "array", items: { type: "string" } },
        },
      },
      Mention: {
        type: "object",
        properties: {
          id: { type: "string" },
          brandId: { type: "string" },
          platform: {
            type: "string",
            enum: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek"],
          },
          query: { type: "string" },
          response: { type: "string" },
          sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
          sentimentScore: { type: "number", minimum: 0, maximum: 1 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Recommendation: {
        type: "object",
        properties: {
          id: { type: "string" },
          brandId: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          status: { type: "string", enum: ["pending", "in_progress", "completed", "dismissed"] },
          impact: { type: "integer", minimum: 1, maximum: 10 },
          effort: { type: "integer", minimum: 1, maximum: 10 },
        },
      },
      Analytics: {
        type: "object",
        properties: {
          brandId: { type: "string" },
          period: { type: "string" },
          geoScore: {
            type: "object",
            properties: {
              current: { type: "number" },
              previous: { type: "number" },
              change: { type: "number" },
              trend: { type: "string", enum: ["up", "down", "stable"] },
            },
          },
          mentions: {
            type: "object",
            properties: {
              total: { type: "integer" },
              positive: { type: "integer" },
              neutral: { type: "integer" },
              negative: { type: "integer" },
              byPlatform: { type: "object" },
            },
          },
          recommendations: {
            type: "object",
            properties: {
              total: { type: "integer" },
              completed: { type: "integer" },
              inProgress: { type: "integer" },
              pending: { type: "integer" },
            },
          },
        },
      },
      ApiKey: {
        type: "object",
        properties: {
          id: { type: "string" },
          keyPrefix: { type: "string" },
          name: { type: "string" },
          tier: { type: "string", enum: ["free", "starter", "professional", "enterprise"] },
          permissions: { type: "array", items: { type: "string" } },
          rateLimit: {
            type: "object",
            properties: {
              requestsPerMinute: { type: "integer" },
              requestsPerHour: { type: "integer" },
              requestsPerDay: { type: "integer" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      CreateApiKeyRequest: {
        type: "object",
        required: ["action", "name"],
        properties: {
          action: { type: "string", enum: ["createApiKey"] },
          name: { type: "string", minLength: 1, maxLength: 100 },
          tier: { type: "string", enum: ["free", "starter", "professional", "enterprise"] },
          expiresInDays: { type: "integer", minimum: 1 },
        },
      },
      RevokeApiKeyRequest: {
        type: "object",
        required: ["action", "keyId"],
        properties: {
          action: { type: "string", enum: ["revokeApiKey"] },
          keyId: { type: "string" },
        },
      },
      RotateApiKeyRequest: {
        type: "object",
        required: ["action", "keyId"],
        properties: {
          action: { type: "string", enum: ["rotateApiKey"] },
          keyId: { type: "string" },
        },
      },
      ApiKeyResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            allOf: [
              { $ref: "#/components/schemas/ApiKey" },
              {
                type: "object",
                properties: {
                  key: {
                    type: "string",
                    description: "Full API key (only shown on creation/rotation)",
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
};

// Generate YAML version (for export)
export function generateOpenApiYaml(): string {
  // Simple YAML conversion - in production, use a proper YAML library
  return JSON.stringify(openApiSpec, null, 2)
    .replace(/"([^"]+)":/g, "$1:")
    .replace(/: "([^"]+)"/g, ": '$1'");
}

// Export spec as JSON string
export function getOpenApiJson(): string {
  return JSON.stringify(openApiSpec, null, 2);
}
