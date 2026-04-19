/**
 * Auth helper for Public REST API v1.
 *
 * Accepts:
 *   - `Authorization: Bearer apx_<key>` — Apex API key (validated in middleware,
 *     result forwarded via x-apex-* headers)
 *   - Supabase cookie session (when called from first-party UI)
 *
 * Returns a scope-narrowed context for every v1 request.
 */

import { headers } from "next/headers";
import { getSession } from "@/lib/auth/supabase-server";
import { ApiError } from "./error";

export interface V1AuthContext {
  tenantId: string;
  userId: string;
  authType: "api-key" | "session";
  /** API-key scopes if authType === "api-key", else "full" */
  scopes: string[] | "full";
}

export async function requireV1Auth(): Promise<V1AuthContext> {
  // 1. API-key path — middleware has already validated + set headers
  const hdrs = await headers();
  const authType = hdrs.get("x-apex-auth-type");
  if (authType === "api-key") {
    const tenantId = hdrs.get("x-apex-org-id");
    const userId = hdrs.get("x-apex-user-id");
    const scopesHeader = hdrs.get("x-apex-scopes");
    if (!tenantId || !userId) {
      throw new ApiError(
        "unauthorized",
        "API key is missing tenant or user binding.",
      );
    }
    return {
      tenantId,
      userId,
      authType: "api-key",
      scopes: scopesHeader ? scopesHeader.split(",") : "full",
    };
  }

  // 2. Session path
  const session = await getSession();
  if (!session || !session.orgId) {
    throw new ApiError(
      "unauthorized",
      "Missing or invalid credentials. Provide a Bearer token or a valid session cookie.",
    );
  }
  return {
    tenantId: session.orgId,
    userId: session.userId,
    authType: "session",
    scopes: "full",
  };
}

export function requireScope(ctx: V1AuthContext, scope: string): void {
  if (ctx.scopes === "full") return;
  if (!ctx.scopes.includes(scope)) {
    throw new ApiError(
      "forbidden",
      `API key lacks required scope "${scope}".`,
    );
  }
}
