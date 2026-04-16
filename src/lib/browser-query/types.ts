/**
 * Browser Query Types & Interfaces
 *
 * Core type definitions for browser-based platform queries (Perplexity, Claude Web, etc.)
 * Defines session management, DOM extraction, error handling, and query execution.
 */

/**
 * Browser query result after DOM extraction and parsing
 */
export interface BrowserQueryResult {
  platformName: string;
  platformId: string;
  query: string;
  rawContent: string;
  extractedData: {
    mainContent: string;
    citations?: Array<{ url: string; title?: string; description?: string }>;
    relatedQueries?: string[];
    responseTime?: number;
  };
  status: "success" | "partial" | "failed";
  timestamp: Date;
  screenshotPath?: string; // Path to error screenshot
  error?: string;
}

/**
 * Browser session configuration & state
 */
export interface BrowserSession {
  id: string;
  platformName: string;
  userId: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;

  // Encrypted session data (cookies, localStorage, etc.)
  encryptedSessionData?: string;

  // Session metadata
  metadata: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    timezone?: string;
    language?: string;
    lastIpAddress?: string;
    requestCount?: number;
    successCount?: number;
    failureCount?: number;
  };

  // Status
  status: "active" | "expired" | "revoked" | "suspended";
  suspensionReason?: string;
  lastError?: string;
}

/**
 * Detected errors during browser queries
 */
export type BrowserQueryError =
  | CaptchaDetectedError
  | RateLimitError
  | AuthenticationError
  | TimeoutError
  | SessionExpiredError
  | ContentExtractionError
  | BrowserCrashError;

export class CaptchaDetectedError extends Error {
  constructor(
    public readonly message: string,
    public readonly captchaProvider?: string,
    public readonly screenshotPath?: string
  ) {
    super(message);
    this.name = "CaptchaDetectedError";
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly message: string,
    public readonly retryAfterSeconds?: number,
    public readonly platformName?: string
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    public readonly message: string,
    public readonly reason?: "invalid_credentials" | "session_expired" | "unauthorized" | "token_revoked"
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class TimeoutError extends Error {
  constructor(
    public readonly message: string,
    public readonly timeoutMs?: number
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class SessionExpiredError extends Error {
  constructor(
    public readonly message: string,
    public readonly sessionId?: string
  ) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export class ContentExtractionError extends Error {
  constructor(
    public readonly message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ContentExtractionError";
  }
}

export class BrowserCrashError extends Error {
  constructor(
    public readonly message: string,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = "BrowserCrashError";
  }
}

/**
 * DOM extraction strategies for different platforms
 */
export interface DOMExtractor {
  platformName: string;
  extractMainContent(page: any): Promise<string>;
  extractCitations(page: any): Promise<Array<{ url: string; title?: string; description?: string }>>;
  extractRelatedQueries(page: any): Promise<string[]>;
  detectCaptcha(page: any): Promise<boolean>;
  detectRateLimit(page: any): Promise<boolean>;
  waitForContentReady(page: any, timeoutMs?: number): Promise<void>;
}

/**
 * Platform-specific browser configuration
 */
export interface PlatformBrowserConfig {
  platformName: string;
  baseUrl: string;
  searchUrl: string; // URL pattern for search queries

  // Authentication
  authRequired: boolean;
  authMethod?: "cookies" | "sessionStorage" | "localStorage" | "headers";
  authHeaders?: Record<string, string>;

  // Selectors for DOM extraction
  selectors: {
    mainContent?: string;
    citations?: string;
    relatedQueries?: string;
    loadingIndicator?: string;
  };

  // Timeouts and delays
  pageLoadTimeoutMs?: number;
  contentReadyTimeoutMs?: number;
  navigationDelayMs?: number;

  // Rate limiting
  minQueryIntervalMs?: number;
  maxQueriesPerMinute?: number;

  // Headless browser options
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

/**
 * Retry configuration for failed queries
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;

  // Retry on specific errors
  retryOn: {
    timeout?: boolean;
    captcha?: boolean;
    rateLimit?: boolean;
    networkError?: boolean;
  };
}

/**
 * Metrics collected during query execution
 */
export interface BrowserQueryMetrics {
  startTime: Date;
  endTime: Date;
  elapsedMs: number;

  // Network timing
  navigationStartMs?: number;
  navigationEndMs?: number;
  domReadyMs?: number;

  // Interaction timing
  queryInputMs?: number;
  submitMs?: number;
  responseReceivedMs?: number;

  // Resource metrics
  cpuUsagePercent?: number;
  memoryUsageMb?: number;
  networkBytesDown?: number;

  // Error metrics
  captchaDetected?: boolean;
  rateLimitHit?: boolean;
  retryCount?: number;
}

/**
 * Browser query execution options
 */
export interface BrowserQueryOptions {
  timeoutMs?: number;
  maxRetries?: number;
  captureScreenshot?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
  sessionId?: string; // Reuse existing session
  headless?: boolean;
  collectMetrics?: boolean;
  proxyUrl?: string; // Optional proxy for requests
}

/**
 * Encryption config for session storage
 */
export interface SessionEncryption {
  algorithm: "aes-256-gcm";
  encryptionKey: string;
  ivLength: number; // Initialization vector length
}
