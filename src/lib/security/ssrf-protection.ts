/**
 * SSRF Protection
 *
 * Validates URLs to prevent Server-Side Request Forgery attacks.
 * Blocks requests to private IPs, localhost, cloud metadata endpoints, etc.
 */

import { URL } from "url";

/** IP ranges that should never be accessed from the server */
const BLOCKED_IP_PATTERNS = [
  // Loopback
  /^127\./,
  /^0\./,
  // Private ranges (RFC 1918)
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // Link-local
  /^169\.254\./,
  // IPv6 loopback and link-local
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

/** Hostnames that should never be accessed from the server */
const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "169.254.169.254", // AWS/GCP metadata
  "100.100.100.200", // Alibaba metadata
  "[::1]",
  "0.0.0.0",
];

/**
 * Check if a URL is safe for server-side requests (not an SSRF target)
 *
 * @param urlString - The URL to validate
 * @returns true if the URL is safe to fetch
 */
export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Block known dangerous hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    // Block private IP ranges
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Block hostnames that resolve to private IPs (basic check)
    // Dots-only hostnames (IP addresses) are checked above
    // For domain-based, we rely on the IP pattern checks
    // A full DNS resolution check would be async and is optional

    return true;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Validate a URL and throw if it's not safe for server-side fetching
 *
 * @param urlString - The URL to validate
 * @throws Error if the URL is not safe
 */
export function assertSafeUrl(urlString: string): void {
  if (!isSafeUrl(urlString)) {
    throw new Error(`SSRF protection: URL not allowed: ${urlString}`);
  }
}
