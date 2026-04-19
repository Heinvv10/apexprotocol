/**
 * GET /api/v1/openapi.json
 *
 * OpenAPI 3.1 spec for the Public REST API v1.
 *
 * This is hand-maintained for now. When the surface grows large enough,
 * migrate to auto-generation via zod-to-openapi or similar. The source-of-
 * truth for behaviour is the route handlers — this file describes them.
 */

import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Apex API",
    version: "1.0.0",
    description:
      "Public REST API for the Apex GEO/AEO platform. Read-only in v1.0 — write endpoints are coming in v1.1.",
    contact: {
      name: "Apex Support",
      email: "support@apex.dev",
      url: "https://apex.dev/support",
    },
    license: { name: "Commercial" },
  },
  servers: [
    { url: "https://api.apex.dev/api/v1", description: "Production" },
    { url: "https://staging.apex.dev/api/v1", description: "Staging" },
  ],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "apx_<random>",
        description:
          "Apex API key. Create keys in Dashboard → Settings → Developer. Format: `apx_<40 chars>`.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "docs_url"],
            properties: {
              code: {
                type: "string",
                enum: [
                  "invalid_request",
                  "unauthorized",
                  "forbidden",
                  "not_found",
                  "conflict",
                  "unprocessable",
                  "rate_limited",
                  "internal_error",
                  "not_implemented",
                ],
              },
              message: { type: "string" },
              docs_url: { type: "string", format: "uri" },
              details: { type: "object", additionalProperties: { type: "string" } },
              trace_id: { type: "string" },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        required: ["next_cursor", "has_more", "limit"],
        properties: {
          next_cursor: { type: "string", nullable: true },
          has_more: { type: "boolean" },
          limit: { type: "integer" },
        },
      },
      Brand: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          domain: { type: "string", nullable: true },
          industry: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          logo_url: { type: "string", nullable: true, format: "uri" },
          keywords: { type: "array", items: { type: "string" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Mention: {
        type: "object",
        properties: {
          id: { type: "string" },
          platform: {
            type: "string",
            enum: [
              "chatgpt",
              "claude",
              "gemini",
              "perplexity",
              "grok",
              "deepseek",
              "copilot",
            ],
          },
          query: { type: "string" },
          sentiment: {
            type: "string",
            enum: ["positive", "neutral", "negative", "unrecognized"],
          },
          position: { type: "integer", nullable: true },
          citation_url: { type: "string", nullable: true, format: "uri" },
          competitors: { type: "array", items: { type: "object" } },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      ScorePoint: {
        type: "object",
        properties: {
          audit_id: { type: "string" },
          overall_score: { type: "integer", minimum: 0, maximum: 100 },
          category_scores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                score: { type: "integer" },
                maxScore: { type: "integer" },
                issues: { type: "integer" },
              },
            },
          },
          issue_counts: {
            type: "object",
            properties: {
              total: { type: "integer" },
              critical: { type: "integer" },
              high: { type: "integer" },
              medium: { type: "integer" },
              low: { type: "integer" },
            },
          },
          timestamp: { type: "string", format: "date-time", nullable: true },
        },
      },
      Recommendation: {
        type: "object",
        properties: {
          id: { type: "string" },
          brand_id: { type: "string" },
          audit_id: { type: "string", nullable: true },
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "dismissed"],
          },
          effort: { type: "string", enum: ["quick_win", "moderate", "major"] },
          impact: { type: "string", enum: ["high", "medium", "low"] },
          impact_source: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Audit: {
        type: "object",
        properties: {
          id: { type: "string" },
          brand_id: { type: "string" },
          url: { type: "string", format: "uri" },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "failed"],
          },
          overall_score: { type: "integer", nullable: true },
          category_scores: { type: "array", items: { type: "object" } },
          issue_counts: { type: "object" },
          issues: { type: "array", items: { type: "object" } },
          platform_scores: { type: "array", items: { type: "object" } },
          error_message: { type: "string", nullable: true },
          started_at: { type: "string", nullable: true, format: "date-time" },
          completed_at: { type: "string", nullable: true, format: "date-time" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
    parameters: {
      Limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
      Cursor: {
        name: "cursor",
        in: "query",
        schema: { type: "string" },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid credentials.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      RateLimited: {
        description:
          "Rate limit exceeded. Retry-After header indicates seconds to wait.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      InvalidRequest: {
        description: "Malformed query parameter or body.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Liveness probe",
        security: [],
        responses: {
          "200": {
            description: "Service alive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["ok"] },
                    version: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/brands": {
      get: {
        summary: "List brands in your tenant",
        parameters: [
          { $ref: "#/components/parameters/Limit" },
          { $ref: "#/components/parameters/Cursor" },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Brand list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Brand" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/brands/{id}": {
      get: {
        summary: "Fetch a single brand",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Brand detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Brand" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/brands/{id}/scores": {
      get: {
        summary: "Time-series of audit scores for a brand",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 365, default: 30 } },
        ],
        responses: {
          "200": {
            description: "Score series (ascending by timestamp)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScorePoint" },
                    },
                    meta: { type: "object" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/brands/{id}/mentions": {
      get: {
        summary: "List brand mentions across AI platforms",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { $ref: "#/components/parameters/Limit" },
          { $ref: "#/components/parameters/Cursor" },
          { name: "platform", in: "query", schema: { type: "string" } },
          { name: "sentiment", in: "query", schema: { type: "string" } },
          { name: "since", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          "200": {
            description: "Mentions, cursor-paginated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Mention" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/InvalidRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/brands/{id}/recommendations": {
      get: {
        summary: "List recommendations for a brand",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { $ref: "#/components/parameters/Limit" },
          { $ref: "#/components/parameters/Cursor" },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Recommendations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Recommendation" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/InvalidRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/audits/{id}": {
      get: {
        summary: "Fetch a single audit result",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Audit detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Audit" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
