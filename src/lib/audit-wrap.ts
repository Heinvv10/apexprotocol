/**
 * withAudit() — thin wrapper that couples a state-changing handler with
 * an automatic audit-log entry on success + failure.
 *
 * Requirement: NFR-SEC-009 (audit log of every state-change action,
 * 100% coverage of create/update/delete). Premium marker #5.
 *
 * Usage:
 *
 *   export const PATCH = withAudit(
 *     {
 *       action: "brand.update",
 *       actionType: "update",
 *       targetType: "brand",
 *     },
 *     async (request, { params }) => {
 *       const { id } = await params;
 *       const body = await request.json();
 *       const before = await loadBrand(id);
 *       const updated = await db.update(...).returning();
 *       return {
 *         response: NextResponse.json({ data: updated }),
 *         audit: {
 *           targetId: id,
 *           targetName: updated.name,
 *           changes: { before, after: updated },
 *         },
 *       };
 *     },
 *   );
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  createAuditLog,
  extractMetadata,
  type CreateAuditLogParams,
} from "@/lib/audit-logger";
import { getSession } from "@/lib/auth/supabase-server";
import { logger } from "@/lib/logger";

export interface AuditMeta {
  targetId?: string | null;
  targetName?: string | null;
  changes?: CreateAuditLogParams["changes"];
  metadata?: Record<string, unknown>;
}

export interface HandlerResult {
  response: NextResponse | Response;
  audit?: AuditMeta;
}

export interface AuditSpec
  extends Pick<CreateAuditLogParams, "action" | "actionType" | "targetType"> {
  /** Human description template — interpolate via {vars} from meta.metadata */
  description?: string;
  /**
   * When true, failures of the handler still log an audit entry with
   * status=failure. Default true — errors matter more than successes for
   * forensic review.
   */
  logFailures?: boolean;
}

type HandlerCtx<P = Record<string, string>> = {
  params: Promise<P>;
};

type Handler<P = Record<string, string>> = (
  request: NextRequest,
  ctx: HandlerCtx<P>,
) => Promise<HandlerResult>;

export function withAudit<P extends Record<string, string>>(
  spec: AuditSpec,
  handler: Handler<P>,
): (request: NextRequest, ctx: HandlerCtx<P>) => Promise<NextResponse | Response> {
  return async (request, ctx) => {
    const requestMeta = extractMetadata(request);

    // Pull actor context from session (if present). API-key auth routes
    // surface actor via middleware headers — extractMetadata reads those.
    const session = await getSession().catch(() => null);
    const actorId = session?.userId ?? null;

    try {
      const result = await handler(request, ctx);
      const status = result.response.status;
      const failed = status >= 400;

      await createAuditLog(
        {
          actorId,
          action: spec.action,
          actionType: spec.actionType,
          description:
            spec.description ??
            `${spec.action} on ${spec.targetType ?? "resource"}`,
          targetType: spec.targetType,
          targetId: result.audit?.targetId,
          targetName: result.audit?.targetName,
          changes: result.audit?.changes,
          metadata: { ...result.audit?.metadata, ...requestMeta },
          status: failed ? "failure" : "success",
          errorMessage: failed ? `HTTP ${status}` : null,
        },
        request,
      );

      return result.response;
    } catch (err) {
      const e = err as Error;
      if (spec.logFailures !== false) {
        await createAuditLog(
          {
            actorId,
            action: spec.action,
            actionType: spec.actionType,
            description:
              spec.description ??
              `${spec.action} on ${spec.targetType ?? "resource"}`,
            targetType: spec.targetType,
            metadata: { ...requestMeta } as Record<string, unknown>,
            status: "failure",
            errorMessage: e.message,
            errorStack: e.stack,
          },
          request,
        ).catch((logErr) => {
          logger.error("audit.write_failed_on_handler_error", {
            action: spec.action,
            handlerErr: e.message,
            auditErr: (logErr as Error).message,
          });
        });
      }
      throw err;
    }
  };
}
