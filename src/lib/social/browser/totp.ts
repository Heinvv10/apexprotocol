/**
 * TOTP (RFC 6238) implementation.
 *
 * Pure node:crypto, no external deps. Used for 2FA login flows on social
 * platforms where browser automation must compute the current 6-digit code
 * from a stored shared secret.
 */

import { createHmac } from "crypto";

const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_DIGITS = 6;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(input: string): Buffer {
  const cleaned = input.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export interface TOTPOptions {
  periodSeconds?: number;
  digits?: number;
  /** Override current time (Unix seconds) — used in tests. */
  now?: number;
}

/**
 * Compute the current TOTP code for a shared secret.
 *
 * @param secret - Base32-encoded shared secret (the kind authenticator apps display).
 */
export function generateCode(secret: string, options: TOTPOptions = {}): string {
  const period = options.periodSeconds ?? DEFAULT_PERIOD_SECONDS;
  const digits = options.digits ?? DEFAULT_DIGITS;
  const nowSeconds = options.now ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(nowSeconds / period);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const key = decodeBase32(secret);
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();

  // RFC 4226 dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = binary % 10 ** digits;
  return code.toString().padStart(digits, "0");
}

/**
 * Verify a code against the secret, allowing ±1 period of clock skew.
 */
export function verifyCode(
  secret: string,
  code: string,
  options: TOTPOptions = {},
): boolean {
  const nowSeconds = options.now ?? Math.floor(Date.now() / 1000);
  const period = options.periodSeconds ?? DEFAULT_PERIOD_SECONDS;
  for (const offset of [-1, 0, 1]) {
    if (
      generateCode(secret, { ...options, now: nowSeconds + offset * period }) ===
      code
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Seconds remaining in the current TOTP period (useful for UI countdowns
 * and for deciding whether to wait before submitting a code that's about
 * to expire mid-flight).
 */
export function secondsUntilNextCode(options: TOTPOptions = {}): number {
  const period = options.periodSeconds ?? DEFAULT_PERIOD_SECONDS;
  const nowSeconds = options.now ?? Math.floor(Date.now() / 1000);
  return period - (nowSeconds % period);
}
