/**
 * Browser Session Manager
 *
 * Manages persistent browser sessions for platforms that benefit from session reuse
 * (Perplexity, Claude Web, etc.). Handles encryption, expiration, and session pooling.
 *
 * Features:
 * - Encrypted session storage (AES-256-GCM)
 * - Session expiration and cleanup
 * - Session pooling for connection reuse
 * - Metrics collection
 * - Error logging
 */

import { randomUUID } from "crypto";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { BrowserSession, SessionEncryption } from "./types";
import { Logger } from "@/lib/utils/logger";

export class BrowserSessionManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private logger: Logger;
  private encryptionKey: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(encryptionKey?: string) {
    this.logger = new Logger("[BrowserSessionManager]");
    this.encryptionKey = encryptionKey || this.generateEncryptionKey();

    // Start automatic cleanup of expired sessions
    this.startCleanupTimer();
  }

  /**
   * Create a new browser session
   */
  createSession(
    platformName: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): BrowserSession {
    const session: BrowserSession = {
      id: randomUUID(),
      platformName,
      userId,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: "active",
      metadata: {
        ...metadata,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
      },
    };

    this.sessions.set(session.id, session);
    this.logger.debug(`Created session ${session.id} for ${platformName}`);

    return session;
  }

  /**
   * Get active session for platform
   */
  getActiveSession(platformName: string, userId: string): BrowserSession | null {
    for (const session of this.sessions.values()) {
      if (
        session.platformName === platformName &&
        session.userId === userId &&
        session.status === "active" &&
        session.expiresAt > new Date()
      ) {
        // Update last used time
        session.lastUsedAt = new Date();
        return session;
      }
    }
    return null;
  }

  /**
   * Get or create session (reuse if available)
   */
  getOrCreateSession(
    platformName: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): BrowserSession {
    const existing = this.getActiveSession(platformName, userId);
    if (existing) {
      this.logger.debug(`Reusing existing session ${existing.id}`);
      return existing;
    }

    return this.createSession(platformName, userId, metadata);
  }

  /**
   * Update session metadata
   */
  updateSession(sessionId: string, updates: Partial<BrowserSession>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Session ${sessionId} not found for update`);
      return;
    }

    Object.assign(session, updates);
    session.lastUsedAt = new Date();
    this.logger.debug(`Updated session ${sessionId}`);
  }

  /**
   * Mark query as successful
   */
  recordSuccess(sessionId: string, responseTimeMs: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.metadata.successCount = (session.metadata.successCount || 0) + 1;
    session.metadata.requestCount = (session.metadata.requestCount || 0) + 1;
    session.lastUsedAt = new Date();
  }

  /**
   * Mark query as failed
   */
  recordFailure(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.metadata.failureCount = (session.metadata.failureCount || 0) + 1;
    session.metadata.requestCount = (session.metadata.requestCount || 0) + 1;
    session.lastError = error;
    session.lastUsedAt = new Date();

    // Suspend session after too many failures
    const failureCount = session.metadata.failureCount || 0;
    if (failureCount >= 5) {
      session.status = "suspended";
      session.suspensionReason = `Too many failures (${failureCount})`;
      this.logger.warn(`Session ${sessionId} suspended after ${failureCount} failures`);
    }
  }

  /**
   * Encrypt and store session data
   */
  async saveEncryptedSessionData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const encrypted = this.encrypt(JSON.stringify(data));
      session.encryptedSessionData = encrypted;
      this.logger.debug(`Encrypted session data for ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to encrypt session data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Decrypt and retrieve session data
   */
  async loadEncryptedSessionData(sessionId: string): Promise<Record<string, unknown> | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.encryptedSessionData) {
      return null;
    }

    try {
      const decrypted = this.decrypt(session.encryptedSessionData);
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error(
        `Failed to decrypt session data: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string, reason?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = "revoked";
    session.suspensionReason = reason;
    this.logger.info(`Revoked session ${sessionId}`);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    requestCount: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    sessionAge: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const requestCount = session.metadata.requestCount || 0;
    const successCount = session.metadata.successCount || 0;
    const failureCount = session.metadata.failureCount || 0;
    const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 0;
    const sessionAge = Date.now() - session.createdAt.getTime();

    return {
      requestCount,
      successCount,
      failureCount,
      successRate,
      sessionAge,
    };
  }

  /**
   * Get all active sessions for a platform
   */
  getActiveSessions(platformName: string): BrowserSession[] {
    const now = new Date();
    return Array.from(this.sessions.values()).filter(
      (s) =>
        s.platformName === platformName &&
        s.status === "active" &&
        s.expiresAt > now
    );
  }

  /**
   * Cleanup expired sessions (runs automatically)
   */
  private startCleanupTimer(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    // Allow timer to not block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Manual cleanup of expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Shutdown manager and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Revoke all active sessions
    for (const session of this.sessions.values()) {
      if (session.status === "active") {
        session.status = "revoked";
        session.suspensionReason = "Manager shutdown";
      }
    }

    this.logger.info("Session manager shutdown complete");
  }

  // ============================================================================
  // Encryption/Decryption
  // ============================================================================

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(data: string): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(
        "aes-256-gcm",
        Buffer.from(this.encryptionKey, "hex"),
        iv
      );

      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted
      return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(encrypted: string): string {
    try {
      const [ivHex, authTagHex, encryptedData] = encrypted.split(":");

      if (!ivHex || !authTagHex || !encryptedData) {
        throw new Error("Invalid encrypted data format");
      }

      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const decipher = createDecipheriv(
        "aes-256-gcm",
        Buffer.from(this.encryptionKey, "hex"),
        iv
      );

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate encryption key if not provided
   */
  private generateEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (key && key.length === 64) {
      return key;
    }

    // Fallback: derive from a seed (INSECURE - dev only)
    if (process.env.NODE_ENV === "development") {
      const seed = "dev-fallback-key-insecure-do-not-use-in-production";
      return scryptSync(seed, "salt", 32).toString("hex");
    }

    throw new Error("ENCRYPTION_KEY environment variable not set or invalid");
  }
}

/**
 * Global session manager instance
 */
let globalSessionManager: BrowserSessionManager | null = null;

export function getSessionManager(): BrowserSessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new BrowserSessionManager(process.env.ENCRYPTION_KEY);
  }
  return globalSessionManager;
}

export async function shutdownSessionManager(): Promise<void> {
  if (globalSessionManager) {
    await globalSessionManager.shutdown();
    globalSessionManager = null;
  }
}
