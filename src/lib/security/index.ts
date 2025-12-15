/**
 * Security Module (F142, F143)
 * Security headers, input sanitization, and protection utilities
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers configuration
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
  crossOriginEmbedderPolicy?: string;
}

// Default security headers
export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.anthropic.com https://api.openai.com https://*.clerk.accounts.dev https://*.clerk.com wss://*",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: [
    "accelerometer=()",
    "autoplay=()",
    "camera=()",
    "cross-origin-isolated=()",
    "display-capture=()",
    "encrypted-media=()",
    "fullscreen=(self)",
    "geolocation=()",
    "gyroscope=()",
    "keyboard-map=()",
    "magnetometer=()",
    "microphone=()",
    "midi=()",
    "payment=()",
    "picture-in-picture=()",
    "publickey-credentials-get=()",
    "screen-wake-lock=()",
    "sync-xhr=()",
    "usb=()",
    "web-share=()",
    "xr-spatial-tracking=()",
  ].join(", "),
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "same-origin",
  crossOriginEmbedderPolicy: "require-corp",
};

// API-specific headers (more relaxed for API routes)
export const API_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "no-referrer",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "cross-origin",
};

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = DEFAULT_SECURITY_HEADERS
): NextResponse {
  if (config.contentSecurityPolicy) {
    response.headers.set("Content-Security-Policy", config.contentSecurityPolicy);
  }
  if (config.strictTransportSecurity) {
    response.headers.set("Strict-Transport-Security", config.strictTransportSecurity);
  }
  if (config.xFrameOptions) {
    response.headers.set("X-Frame-Options", config.xFrameOptions);
  }
  if (config.xContentTypeOptions) {
    response.headers.set("X-Content-Type-Options", config.xContentTypeOptions);
  }
  if (config.referrerPolicy) {
    response.headers.set("Referrer-Policy", config.referrerPolicy);
  }
  if (config.permissionsPolicy) {
    response.headers.set("Permissions-Policy", config.permissionsPolicy);
  }
  if (config.crossOriginOpenerPolicy) {
    response.headers.set("Cross-Origin-Opener-Policy", config.crossOriginOpenerPolicy);
  }
  if (config.crossOriginResourcePolicy) {
    response.headers.set("Cross-Origin-Resource-Policy", config.crossOriginResourcePolicy);
  }
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set("Cross-Origin-Embedder-Policy", config.crossOriginEmbedderPolicy);
  }

  return response;
}

/**
 * Security middleware for Next.js
 */
export function securityMiddleware(
  request: NextRequest,
  isApiRoute: boolean = false
): NextResponse | null {
  // For API routes, we'll apply headers in the response
  // For page routes, we apply headers here
  if (!isApiRoute) {
    const response = NextResponse.next();
    return applySecurityHeaders(response, DEFAULT_SECURITY_HEADERS);
  }
  return null;
}

// ====================
// INPUT SANITIZATION (F143)
// ====================

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove all HTML tags from a string
 */
export function stripHtml(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Sanitize string input - removes dangerous characters and patterns
 */
export function sanitizeString(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    allowNewlines?: boolean;
    trim?: boolean;
  } = {}
): string {
  const { maxLength = 10000, allowHtml = false, allowNewlines = true, trim = true } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove or escape HTML
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, " ");
  }

  // Remove control characters (except newlines/tabs if allowed)
  if (allowNewlines) {
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  } else {
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
  }

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = sanitizeString(email, {
    maxLength: 254,
    allowHtml: false,
    allowNewlines: false,
  }).toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  const sanitized = sanitizeString(url, {
    maxLength: 2048,
    allowHtml: false,
    allowNewlines: false,
  });

  try {
    const parsed = new URL(sanitized);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    // Prevent javascript: URLs that might slip through
    if (parsed.href.toLowerCase().includes("javascript:")) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Sanitize integer
 */
export function sanitizeInteger(
  value: unknown,
  options: { min?: number; max?: number; default?: number } = {}
): number {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, default: defaultValue = 0 } = options;

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Math.floor(value)));
  }

  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return Math.max(min, Math.min(max, parsed));
    }
  }

  return defaultValue;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxDepth?: number;
    maxStringLength?: number;
    allowHtml?: boolean;
  } = {}
): T {
  const { maxDepth = 10, maxStringLength = 10000, allowHtml = false } = options;

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      return null;
    }

    if (typeof value === "string") {
      return sanitizeString(value, { maxLength: maxStringLength, allowHtml });
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        return 0;
      }
      return value;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        const sanitizedKey = sanitizeString(key, { maxLength: 256, allowHtml: false });
        sanitized[sanitizedKey] = sanitizeValue(val, depth + 1);
      }
      return sanitized;
    }

    return null;
  }

  return sanitizeValue(obj, 0) as T;
}

/**
 * Validate and sanitize SQL-like input (for search queries)
 * Prevents SQL injection patterns
 */
export function sanitizeSearchQuery(query: string): string {
  let sanitized = sanitizeString(query, {
    maxLength: 500,
    allowHtml: false,
    allowNewlines: false,
  });

  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|UNION|JOIN)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
    /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/gi,
    /(\bxp_)/gi,
    /(\bsp_)/gi,
  ];

  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized;
}

/**
 * Validate file name
 */
export function sanitizeFileName(filename: string): string {
  let sanitized = sanitizeString(filename, {
    maxLength: 255,
    allowHtml: false,
    allowNewlines: false,
  });

  // Remove path traversal attempts
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[/\\]/g, "_");

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, "_");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

  // Ensure non-empty
  if (!sanitized) {
    sanitized = "file";
  }

  return sanitized;
}

/**
 * Check if input contains potential XSS patterns
 */
export function containsXssPatterns(input: string): boolean {
  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:\s*text\/html/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<svg\b.*?on\w+/i,
    /expression\s*\(/i,
    /url\s*\(\s*["']?\s*javascript/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize JSON payload from request
 */
export async function sanitizeRequestBody<T>(
  request: Request,
  options: {
    maxSize?: number;
    maxStringLength?: number;
    allowHtml?: boolean;
  } = {}
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const { maxSize = 1048576, maxStringLength = 10000, allowHtml = false } = options; // 1MB default

  try {
    // Check content length
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > maxSize) {
      return { success: false, error: "Request body too large" };
    }

    // Parse JSON
    const text = await request.text();
    if (text.length > maxSize) {
      return { success: false, error: "Request body too large" };
    }

    const data = JSON.parse(text);

    // Sanitize the parsed data
    const sanitized = sanitizeObject(data, { maxStringLength, allowHtml });

    return { success: true, data: sanitized as T };
  } catch {
    return { success: false, error: "Invalid JSON body" };
  }
}

// Export all security utilities
export const security = {
  headers: {
    apply: applySecurityHeaders,
    default: DEFAULT_SECURITY_HEADERS,
    api: API_SECURITY_HEADERS,
  },
  sanitize: {
    string: sanitizeString,
    html: stripHtml,
    escape: escapeHtml,
    email: sanitizeEmail,
    url: sanitizeUrl,
    integer: sanitizeInteger,
    object: sanitizeObject,
    search: sanitizeSearchQuery,
    filename: sanitizeFileName,
    requestBody: sanitizeRequestBody,
  },
  validate: {
    containsXss: containsXssPatterns,
  },
};
