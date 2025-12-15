/**
 * Public API Library (F139)
 * External REST API with API key authentication for integrations
 */

import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// API Key tiers with different rate limits and permissions
export type ApiKeyTier = "free" | "starter" | "professional" | "enterprise";

export interface ApiKey {
  id: string;
  key: string;
  keyHash: string;
  organizationId: string;
  name: string;
  tier: ApiKeyTier;
  permissions: ApiPermission[];
  rateLimit: RateLimitConfig;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export type ApiPermission =
  | "brands:read"
  | "brands:write"
  | "mentions:read"
  | "mentions:write"
  | "recommendations:read"
  | "recommendations:write"
  | "audits:read"
  | "audits:write"
  | "analytics:read"
  | "content:read"
  | "content:write"
  | "settings:read"
  | "settings:write"
  | "webhooks:manage";

export interface ApiKeyUsage {
  keyId: string;
  minute: number;
  hour: number;
  day: number;
  lastReset: {
    minute: Date;
    hour: Date;
    day: Date;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

// Rate limit configurations by tier
export const RATE_LIMITS: Record<ApiKeyTier, RateLimitConfig> = {
  free: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    burstLimit: 5,
  },
  starter: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 20,
  },
  professional: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 50,
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
    burstLimit: 100,
  },
};

// Default permissions by tier
export const TIER_PERMISSIONS: Record<ApiKeyTier, ApiPermission[]> = {
  free: ["brands:read", "mentions:read", "recommendations:read"],
  starter: [
    "brands:read",
    "brands:write",
    "mentions:read",
    "recommendations:read",
    "audits:read",
    "analytics:read",
  ],
  professional: [
    "brands:read",
    "brands:write",
    "mentions:read",
    "mentions:write",
    "recommendations:read",
    "recommendations:write",
    "audits:read",
    "audits:write",
    "analytics:read",
    "content:read",
    "content:write",
  ],
  enterprise: [
    "brands:read",
    "brands:write",
    "mentions:read",
    "mentions:write",
    "recommendations:read",
    "recommendations:write",
    "audits:read",
    "audits:write",
    "analytics:read",
    "content:read",
    "content:write",
    "settings:read",
    "settings:write",
    "webhooks:manage",
  ],
};

// Error codes
export const API_ERROR_CODES = {
  INVALID_API_KEY: "INVALID_API_KEY",
  EXPIRED_API_KEY: "EXPIRED_API_KEY",
  INACTIVE_API_KEY: "INACTIVE_API_KEY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  FORBIDDEN: "FORBIDDEN",
  BAD_REQUEST: "BAD_REQUEST",
};

/**
 * Public API Manager
 * Handles API key management, authentication, and rate limiting
 */
export class PublicApiManager {
  private apiKeys: Map<string, ApiKey> = new Map();
  private keyHashIndex: Map<string, string> = new Map();
  private usage: Map<string, ApiKeyUsage> = new Map();

  /**
   * Generate a new API key
   */
  generateApiKey(
    organizationId: string,
    name: string,
    tier: ApiKeyTier = "starter",
    options?: {
      permissions?: ApiPermission[];
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    }
  ): ApiKey {
    const id = `key_${uuidv4()}`;
    const key = `apex_${tier}_${this.generateSecureKey()}`;
    const keyHash = this.hashKey(key);

    const apiKey: ApiKey = {
      id,
      key,
      keyHash,
      organizationId,
      name,
      tier,
      permissions: options?.permissions || TIER_PERMISSIONS[tier],
      rateLimit: RATE_LIMITS[tier],
      createdAt: new Date(),
      lastUsedAt: null,
      expiresAt: options?.expiresAt || null,
      isActive: true,
      metadata: options?.metadata,
    };

    this.apiKeys.set(id, apiKey);
    this.keyHashIndex.set(keyHash, id);

    return apiKey;
  }

  /**
   * Validate an API key and return key info
   */
  validateApiKey(key: string): {
    valid: boolean;
    apiKey?: ApiKey;
    error?: { code: string; message: string };
  } {
    const keyHash = this.hashKey(key);
    const keyId = this.keyHashIndex.get(keyHash);

    if (!keyId) {
      return {
        valid: false,
        error: {
          code: API_ERROR_CODES.INVALID_API_KEY,
          message: "Invalid API key",
        },
      };
    }

    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      return {
        valid: false,
        error: {
          code: API_ERROR_CODES.INVALID_API_KEY,
          message: "API key not found",
        },
      };
    }

    if (!apiKey.isActive) {
      return {
        valid: false,
        error: {
          code: API_ERROR_CODES.INACTIVE_API_KEY,
          message: "API key is inactive",
        },
      };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return {
        valid: false,
        error: {
          code: API_ERROR_CODES.EXPIRED_API_KEY,
          message: "API key has expired",
        },
      };
    }

    // Update last used
    apiKey.lastUsedAt = new Date();

    return { valid: true, apiKey };
  }

  /**
   * Check if API key has required permission
   */
  hasPermission(apiKey: ApiKey, permission: ApiPermission): boolean {
    return apiKey.permissions.includes(permission);
  }

  /**
   * Check multiple permissions
   */
  hasPermissions(apiKey: ApiKey, permissions: ApiPermission[]): boolean {
    return permissions.every((p) => apiKey.permissions.includes(p));
  }

  /**
   * Check rate limit for API key
   */
  checkRateLimit(keyId: string): {
    allowed: boolean;
    remaining: {
      minute: number;
      hour: number;
      day: number;
    };
    resetAt: {
      minute: Date;
      hour: Date;
      day: Date;
    };
    error?: { code: string; message: string; retryAfter: number };
  } {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      return {
        allowed: false,
        remaining: { minute: 0, hour: 0, day: 0 },
        resetAt: {
          minute: new Date(),
          hour: new Date(),
          day: new Date(),
        },
        error: {
          code: API_ERROR_CODES.INVALID_API_KEY,
          message: "Invalid API key",
          retryAfter: 0,
        },
      };
    }

    const usage = this.getOrCreateUsage(keyId, apiKey.rateLimit);
    const now = new Date();

    // Reset counters if needed
    this.resetUsageCounters(usage, now);

    // Check limits
    const { rateLimit } = apiKey;
    const minuteRemaining = rateLimit.requestsPerMinute - usage.minute;
    const hourRemaining = rateLimit.requestsPerHour - usage.hour;
    const dayRemaining = rateLimit.requestsPerDay - usage.day;

    if (minuteRemaining <= 0) {
      const retryAfter = Math.ceil(
        (usage.lastReset.minute.getTime() + 60000 - now.getTime()) / 1000
      );
      return {
        allowed: false,
        remaining: {
          minute: 0,
          hour: hourRemaining,
          day: dayRemaining,
        },
        resetAt: {
          minute: new Date(usage.lastReset.minute.getTime() + 60000),
          hour: new Date(usage.lastReset.hour.getTime() + 3600000),
          day: new Date(usage.lastReset.day.getTime() + 86400000),
        },
        error: {
          code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: "Rate limit exceeded (per minute)",
          retryAfter,
        },
      };
    }

    if (hourRemaining <= 0) {
      const retryAfter = Math.ceil(
        (usage.lastReset.hour.getTime() + 3600000 - now.getTime()) / 1000
      );
      return {
        allowed: false,
        remaining: {
          minute: minuteRemaining,
          hour: 0,
          day: dayRemaining,
        },
        resetAt: {
          minute: new Date(usage.lastReset.minute.getTime() + 60000),
          hour: new Date(usage.lastReset.hour.getTime() + 3600000),
          day: new Date(usage.lastReset.day.getTime() + 86400000),
        },
        error: {
          code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: "Rate limit exceeded (per hour)",
          retryAfter,
        },
      };
    }

    if (dayRemaining <= 0) {
      const retryAfter = Math.ceil(
        (usage.lastReset.day.getTime() + 86400000 - now.getTime()) / 1000
      );
      return {
        allowed: false,
        remaining: {
          minute: minuteRemaining,
          hour: hourRemaining,
          day: 0,
        },
        resetAt: {
          minute: new Date(usage.lastReset.minute.getTime() + 60000),
          hour: new Date(usage.lastReset.hour.getTime() + 3600000),
          day: new Date(usage.lastReset.day.getTime() + 86400000),
        },
        error: {
          code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: "Rate limit exceeded (per day)",
          retryAfter,
        },
      };
    }

    // Increment usage
    usage.minute++;
    usage.hour++;
    usage.day++;

    return {
      allowed: true,
      remaining: {
        minute: minuteRemaining - 1,
        hour: hourRemaining - 1,
        day: dayRemaining - 1,
      },
      resetAt: {
        minute: new Date(usage.lastReset.minute.getTime() + 60000),
        hour: new Date(usage.lastReset.hour.getTime() + 3600000),
        day: new Date(usage.lastReset.day.getTime() + 86400000),
      },
    };
  }

  /**
   * Get API key by ID (excluding the actual key)
   */
  getApiKey(keyId: string): Omit<ApiKey, "key" | "keyHash"> | null {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, keyHash, ...rest } = apiKey;
    return rest;
  }

  /**
   * List all API keys for an organization
   */
  listApiKeys(organizationId: string): Omit<ApiKey, "key" | "keyHash">[] {
    return Array.from(this.apiKeys.values())
      .filter((k) => k.organizationId === organizationId)
      .map(({ key, keyHash, ...rest }) => {
        void key;
        void keyHash;
        return rest;
      });
  }

  /**
   * Revoke an API key
   */
  revokeApiKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    apiKey.isActive = false;
    return true;
  }

  /**
   * Delete an API key
   */
  deleteApiKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    this.keyHashIndex.delete(apiKey.keyHash);
    this.apiKeys.delete(keyId);
    this.usage.delete(keyId);
    return true;
  }

  /**
   * Rotate an API key (generate new key, keep same permissions)
   */
  rotateApiKey(keyId: string): ApiKey | null {
    const oldKey = this.apiKeys.get(keyId);
    if (!oldKey) return null;

    // Generate new key
    const newKey = `apex_${oldKey.tier}_${this.generateSecureKey()}`;
    const newKeyHash = this.hashKey(newKey);

    // Update key
    this.keyHashIndex.delete(oldKey.keyHash);
    oldKey.key = newKey;
    oldKey.keyHash = newKeyHash;
    this.keyHashIndex.set(newKeyHash, keyId);

    return oldKey;
  }

  /**
   * Update API key permissions
   */
  updatePermissions(keyId: string, permissions: ApiPermission[]): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    apiKey.permissions = permissions;
    return true;
  }

  /**
   * Get usage statistics for a key
   */
  getUsageStats(keyId: string): ApiKeyUsage | null {
    return this.usage.get(keyId) || null;
  }

  // Private helpers
  private generateSecureKey(): string {
    return crypto.randomBytes(24).toString("base64url");
  }

  private hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  private getOrCreateUsage(
    keyId: string,
    _rateLimit: RateLimitConfig
  ): ApiKeyUsage {
    let usage = this.usage.get(keyId);
    if (!usage) {
      const now = new Date();
      usage = {
        keyId,
        minute: 0,
        hour: 0,
        day: 0,
        lastReset: {
          minute: now,
          hour: now,
          day: now,
        },
      };
      this.usage.set(keyId, usage);
    }
    return usage;
  }

  private resetUsageCounters(usage: ApiKeyUsage, now: Date): void {
    // Reset minute counter
    if (now.getTime() - usage.lastReset.minute.getTime() > 60000) {
      usage.minute = 0;
      usage.lastReset.minute = now;
    }

    // Reset hour counter
    if (now.getTime() - usage.lastReset.hour.getTime() > 3600000) {
      usage.hour = 0;
      usage.lastReset.hour = now;
    }

    // Reset day counter
    if (now.getTime() - usage.lastReset.day.getTime() > 86400000) {
      usage.day = 0;
      usage.lastReset.day = now;
    }
  }
}

// Singleton instance
export const publicApiManager = new PublicApiManager();

// Response helpers
export function createSuccessResponse<T>(
  data: T,
  options?: {
    requestId?: string;
    pagination?: PaginationMeta;
  }
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: options?.requestId || uuidv4(),
      timestamp: new Date().toISOString(),
      pagination: options?.pagination,
    },
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId: requestId || uuidv4(),
      timestamp: new Date().toISOString(),
    },
  };
}

export function createPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasMore: page < totalPages,
  };
}

// Format API key for response (hide actual key except on creation)
export function formatApiKeyResponse(
  apiKey: ApiKey,
  includeKey: boolean = false
): Record<string, unknown> {
  return {
    id: apiKey.id,
    ...(includeKey ? { key: apiKey.key } : {}),
    keyPrefix: apiKey.key.substring(0, 15) + "...",
    organizationId: apiKey.organizationId,
    name: apiKey.name,
    tier: apiKey.tier,
    permissions: apiKey.permissions,
    rateLimit: apiKey.rateLimit,
    createdAt: apiKey.createdAt.toISOString(),
    lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
    expiresAt: apiKey.expiresAt?.toISOString() || null,
    isActive: apiKey.isActive,
  };
}
