/**
 * Signed-token helpers for embeddable widgets (FR-AGY-011 🏆).
 *
 * Agencies paste an <iframe src="…/embed/score?token=…"> into their own
 * client dashboards. The token carries: tenantId, brandId, widget type,
 * expiry. Signed with HMAC-SHA256 over WIDGET_EMBED_SECRET so recipients
 * can't tamper with scope.
 *
 * Separate secret from WEBHOOK_SIGNING_SECRET so rotation policies can
 * differ. Widget tokens are typically shorter-lived (hours) than webhook
 * signatures (continuous).
 */

import crypto from "node:crypto";

export type EmbedWidget = "score" | "mentions" | "recommendations";

export interface EmbedTokenPayload {
  tenantId: string;
  brandId: string;
  widget: EmbedWidget;
  /** Unix seconds */
  exp: number;
  /** Optional — locks widget to a specific referring origin */
  origin?: string;
}

function getSecret(): string | undefined {
  // Read at call time, not module-init time — so tests/scripts that load
  // dotenv *after* this module still see the value.
  return process.env.WIDGET_EMBED_SECRET;
}

function ensureSecret(): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "WIDGET_EMBED_SECRET not configured — required for signed embed tokens",
    );
  }
  return secret;
}

function base64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}
function base64urlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function signEmbedToken(
  payload: Omit<EmbedTokenPayload, "exp"> & { ttlSeconds?: number },
): string {
  const secret = ensureSecret();
  const ttl = payload.ttlSeconds ?? 60 * 60 * 24; // 24h default
  const full: EmbedTokenPayload = {
    tenantId: payload.tenantId,
    brandId: payload.brandId,
    widget: payload.widget,
    origin: payload.origin,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const body = base64urlEncode(Buffer.from(JSON.stringify(full), "utf8"));
  const sig = base64urlEncode(
    crypto.createHmac("sha256", secret).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export type VerifyResult =
  | { ok: true; payload: EmbedTokenPayload }
  | {
      ok: false;
      reason:
        | "malformed"
        | "bad_signature"
        | "expired"
        | "origin_mismatch"
        | "server_misconfigured";
    };

export function verifyEmbedToken(
  token: string,
  options?: { referer?: string | null },
): VerifyResult {
  const secret = getSecret();
  if (!secret) {
    // Soft-fail instead of throwing: lets the embed page render a clean
    // error card ("widget unavailable") rather than surfacing a 500 error
    // boundary that leaks the misconfiguration message to end users.
    return { ok: false, reason: "server_misconfigured" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, sig] = parts;

  const expected = base64urlEncode(
    crypto.createHmac("sha256", secret).update(body).digest(),
  );
  // Constant-time compare to avoid timing-leak
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: EmbedTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }

  if (payload.origin && options?.referer) {
    try {
      const refOrigin = new URL(options.referer).origin;
      if (refOrigin !== payload.origin) {
        return { ok: false, reason: "origin_mismatch" };
      }
    } catch {
      return { ok: false, reason: "origin_mismatch" };
    }
  }

  return { ok: true, payload };
}
