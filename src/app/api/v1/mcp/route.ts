/**
 * Public MCP (Model Context Protocol) server endpoint.
 *
 * Requirement: FR-API-010 (🏆 category-leading).
 *
 * Users drop this URL + their Apex API key into their Claude Desktop,
 * ChatGPT Deep Research, or any MCP-aware client. They can then ask their
 * own LLM "what's my GEO score?" or "generate a brief for this prompt" and
 * the LLM queries us directly via the tools defined here.
 *
 * Protocol: MCP over HTTP with JSON-RPC 2.0 transport. Minimal implementation
 * — `initialize`, `tools/list`, `tools/call` — which is the complete set the
 * ChatGPT + Claude Desktop + Cursor clients actually use today.
 *
 * Auth: standard Apex API key via Authorization: Bearer header, validated
 * by our existing middleware. The middleware sets x-apex-* headers we
 * read through requireV1Auth.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  audits,
  recommendations,
  brandMentions,
} from "@/lib/db/schema";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { findPromptGaps } from "@/lib/ai/prompt-gap-analyzer";
import { logger } from "@/lib/logger";

const MCP_PROTOCOL_VERSION = "2025-06-18";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOLS: ToolDescriptor[] = [
  {
    name: "list_brands",
    description:
      "List the authenticated tenant's brands. Returns id, name, domain, industry for each.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Optional substring to filter by name or domain.",
        },
      },
    },
  },
  {
    name: "get_brand_score",
    description:
      "Get the most recent audit score for a brand, including per-factor breakdown.",
    inputSchema: {
      type: "object",
      required: ["brand_id"],
      properties: {
        brand_id: { type: "string", description: "Brand id from list_brands." },
      },
    },
  },
  {
    name: "get_recommendations",
    description:
      "List open recommendations for a brand, newest first. Filters by status.",
    inputSchema: {
      type: "object",
      required: ["brand_id"],
      properties: {
        brand_id: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "dismissed"],
        },
        limit: { type: "number", default: 20 },
      },
    },
  },
  {
    name: "get_prompt_gaps",
    description:
      "Identify prompts where the brand is under-cited — the MONITOR→CREATE starting point.",
    inputSchema: {
      type: "object",
      required: ["brand_id"],
      properties: {
        brand_id: { type: "string" },
        threshold: { type: "number", default: 0.2 },
        lookback_days: { type: "number", default: 30 },
        limit: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "get_recent_mentions",
    description:
      "Fetch the most recent brand mentions across tracked AI platforms.",
    inputSchema: {
      type: "object",
      required: ["brand_id"],
      properties: {
        brand_id: { type: "string" },
        limit: { type: "number", default: 20 },
        platform: { type: "string" },
      },
    },
  },
];

function rpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}

function rpcResult(
  id: JsonRpcRequest["id"],
  result: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

/**
 * Dispatch tool calls. Every handler must be tenant-scoped via the auth
 * context — no cross-tenant leaks.
 */
async function callTool(
  tool: string,
  args: Record<string, unknown>,
  ctx: { tenantId: string },
): Promise<unknown> {
  switch (tool) {
    case "list_brands": {
      const search = typeof args.search === "string" ? args.search : null;
      const rows = await db
        .select({
          id: brands.id,
          name: brands.name,
          domain: brands.domain,
          industry: brands.industry,
        })
        .from(brands)
        .where(eq(brands.organizationId, ctx.tenantId))
        .limit(100);
      const filtered = search
        ? rows.filter(
            (r) =>
              r.name.toLowerCase().includes(search.toLowerCase()) ||
              (r.domain?.toLowerCase().includes(search.toLowerCase()) ?? false),
          )
        : rows;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filtered, null, 2),
          },
        ],
      };
    }

    case "get_brand_score": {
      const brandId = String(args.brand_id ?? "");
      if (!brandId) throw new Error("brand_id required");

      const audit = await db
        .select({
          id: audits.id,
          overallScore: audits.overallScore,
          categoryScores: audits.categoryScores,
          issueCount: audits.issueCount,
          criticalCount: audits.criticalCount,
          completedAt: audits.completedAt,
        })
        .from(audits)
        .innerJoin(brands, eq(brands.id, audits.brandId))
        .where(
          and(
            eq(audits.brandId, brandId),
            eq(brands.organizationId, ctx.tenantId),
            eq(audits.status, "completed"),
          ),
        )
        .orderBy(desc(audits.completedAt))
        .limit(1);

      if (audit.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No completed audits for this brand yet.",
            },
          ],
        };
      }

      const a = audit[0];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                audit_id: a.id,
                overall_score: a.overallScore,
                category_scores: a.categoryScores,
                issues: {
                  total: a.issueCount,
                  critical: a.criticalCount,
                },
                completed_at: a.completedAt?.toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "get_recommendations": {
      const brandId = String(args.brand_id ?? "");
      const status =
        typeof args.status === "string" ? args.status : "pending";
      const limit = Math.min(Number(args.limit ?? 20), 100);
      if (!brandId) throw new Error("brand_id required");

      const rows = await db
        .select({
          id: recommendations.id,
          title: recommendations.title,
          description: recommendations.description,
          priority: recommendations.priority,
          status: recommendations.status,
          effort: recommendations.effort,
          impact: recommendations.impact,
          category: recommendations.category,
        })
        .from(recommendations)
        .innerJoin(brands, eq(brands.id, recommendations.brandId))
        .where(
          and(
            eq(recommendations.brandId, brandId),
            eq(brands.organizationId, ctx.tenantId),
            eq(
              recommendations.status,
              status as
                | "pending"
                | "in_progress"
                | "completed"
                | "dismissed",
            ),
          ),
        )
        .orderBy(desc(recommendations.createdAt))
        .limit(limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }

    case "get_prompt_gaps": {
      const brandId = String(args.brand_id ?? "");
      if (!brandId) throw new Error("brand_id required");

      // Verify tenant scope
      const brandRows = await db
        .select({ id: brands.id })
        .from(brands)
        .where(
          and(
            eq(brands.id, brandId),
            eq(brands.organizationId, ctx.tenantId),
          ),
        )
        .limit(1);
      if (brandRows.length === 0) throw new Error("brand not found");

      const gaps = await findPromptGaps({
        brandId,
        lookbackDays: Number(args.lookback_days ?? 30),
        mentionRateThreshold: Number(args.threshold ?? 0.2),
        limit: Math.min(Number(args.limit ?? 10), 50),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              gaps.map((g) => ({
                query: g.query,
                mentioned_rate: g.mentionedRate,
                mentioned_runs: g.mentionedRuns,
                total_runs: g.totalRuns,
                top_competitors: g.topCompetitors,
              })),
              null,
              2,
            ),
          },
        ],
      };
    }

    case "get_recent_mentions": {
      const brandId = String(args.brand_id ?? "");
      const limit = Math.min(Number(args.limit ?? 20), 100);
      const platform =
        typeof args.platform === "string" ? args.platform : null;
      if (!brandId) throw new Error("brand_id required");

      type MentionPlatform = typeof brandMentions.platform.enumValues[number];
      const filters = [eq(brandMentions.brandId, brandId)];
      if (platform) {
        filters.push(
          eq(brandMentions.platform, platform as MentionPlatform),
        );
      }

      // Tenant scope via brand join
      const rows = await db
        .select({
          id: brandMentions.id,
          platform: brandMentions.platform,
          query: brandMentions.query,
          sentiment: brandMentions.sentiment,
          position: brandMentions.position,
          citationUrl: brandMentions.citationUrl,
          timestamp: brandMentions.timestamp,
        })
        .from(brandMentions)
        .innerJoin(brands, eq(brands.id, brandMentions.brandId))
        .where(
          and(eq(brands.organizationId, ctx.tenantId), ...filters),
        )
        .orderBy(desc(brandMentions.timestamp))
        .limit(limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

async function handleRpc(
  req: JsonRpcRequest,
  ctx: { tenantId: string },
): Promise<JsonRpcResponse> {
  switch (req.method) {
    case "initialize":
      return rpcResult(req.id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: {
          name: "apex",
          version: "1.0.0",
          title: "Apex GEO/AEO",
        },
        capabilities: {
          tools: { listChanged: false },
          resources: {},
        },
      });

    case "notifications/initialized":
      // Notification — no response
      return rpcResult(req.id ?? null, null);

    case "tools/list":
      return rpcResult(req.id, { tools: TOOLS });

    case "tools/call": {
      const toolName = req.params?.name as string | undefined;
      const toolArgs =
        (req.params?.arguments as Record<string, unknown> | undefined) ?? {};
      if (!toolName) {
        return rpcError(req.id, -32602, "tool name required");
      }
      try {
        const result = await callTool(toolName, toolArgs, ctx);
        return rpcResult(req.id, result);
      } catch (err) {
        logger.warn("mcp.tool_error", {
          tool: toolName,
          err: (err as Error).message,
        });
        return rpcError(
          req.id,
          -32603,
          `Tool error: ${(err as Error).message}`,
        );
      }
    }

    case "ping":
      return rpcResult(req.id, {});

    default:
      return rpcError(req.id, -32601, `method not found: ${req.method}`);
  }
}

export async function POST(request: NextRequest) {
  // Auth: MCP clients send Authorization: Bearer apx_...
  // Middleware validates and sets x-apex-* headers.
  let ctx;
  try {
    const auth = await requireV1Auth();
    ctx = { tenantId: auth.tenantId };
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: "Unauthorized",
          data: (err as Error).message,
        },
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      rpcError(null, -32700, "Parse error — invalid JSON"),
      { status: 400 },
    );
  }

  // Support both single requests and batch arrays per JSON-RPC 2.0 spec
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      (body as JsonRpcRequest[]).map((r) => handleRpc(r, ctx)),
    );
    return NextResponse.json(responses);
  }

  const response = await handleRpc(body as JsonRpcRequest, ctx);
  return NextResponse.json(response);
}

// MCP spec allows GET for server-info advertisement.
export async function GET() {
  return NextResponse.json({
    name: "apex",
    version: "1.0.0",
    protocolVersion: MCP_PROTOCOL_VERSION,
    transport: "http-jsonrpc",
    endpoint: "/api/v1/mcp",
    auth: {
      type: "bearer",
      description:
        "Use your Apex API key from Dashboard → Settings → Developer. Format: `apx_...`",
    },
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    docs: "https://apex.dev/api/docs#mcp",
  });
}
