/**
 * OAuth Token Service
 * Handles token encryption, storage, refresh, and validation
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { db } from "@/lib/db";
import { socialOauthTokens, socialPlatformEnum } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Derive type from enum
export type SocialPlatform = (typeof socialPlatformEnum.enumValues)[number];

// ============================================================================
// Types
// ============================================================================

export interface TokenData {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresAt?: Date | null;
  scopes?: string[];
}

export interface OAuthAccountInfo {
  accountId: string;
  accountName?: string;
  accountHandle?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
}

export interface StoredToken {
  id: string;
  organizationId: string;
  brandId: string;
  platform: SocialPlatform;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  expiresAt: Date | null;
  scopes: string[] | null;
  accountId: string | null;
  accountName: string | null;
  accountHandle: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  connectionStatus: "active" | "expired" | "revoked" | "error" | "pending" | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectionStatus = "active" | "expired" | "revoked" | "error" | "pending";

// ============================================================================
// Encryption Configuration
// ============================================================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment or generate a default (DEV ONLY)
 * In production, OAUTH_ENCRYPTION_KEY must be set
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.OAUTH_ENCRYPTION_KEY;

  if (!envKey) {
    // DEV MODE: Use a deterministic key derived from a constant
    // ⚠️ WARNING: This is NOT secure for production
    console.warn("[TokenService] OAUTH_ENCRYPTION_KEY not set - using dev key (NOT SECURE)");
    const devSecret = "apex-dev-oauth-key-not-for-production";
    return scryptSync(devSecret, "apex-salt", 32);
  }

  // Production: Derive key from environment variable
  return scryptSync(envKey, "apex-oauth-salt", 32);
}

// ============================================================================
// Encryption Functions
// ============================================================================

/**
 * Encrypt a token string
 * Returns: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext, base64 encoded
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt a token string
 * Expects: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext, base64 encoded
 */
export function decryptToken(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// ============================================================================
// Token Storage Operations
// ============================================================================

/**
 * Store OAuth tokens for a brand/platform combination
 */
export async function storeTokens(params: {
  organizationId: string;
  brandId: string;
  platform: SocialPlatform;
  tokens: TokenData;
  accountInfo: OAuthAccountInfo;
}): Promise<StoredToken> {
  const { organizationId, brandId, platform, tokens, accountInfo } = params;

  // Encrypt sensitive tokens
  const encryptedAccessToken = encryptToken(tokens.accessToken);
  const encryptedRefreshToken = tokens.refreshToken
    ? encryptToken(tokens.refreshToken)
    : null;

  // Check if token already exists for this brand/platform/account
  const existing = await db.query.socialOauthTokens.findFirst({
    where: and(
      eq(socialOauthTokens.brandId, brandId),
      eq(socialOauthTokens.platform, platform),
      eq(socialOauthTokens.accountId, accountInfo.accountId)
    ),
  });

  if (existing) {
    // Update existing token
    const [updated] = await db
      .update(socialOauthTokens)
      .set({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenType: tokens.tokenType || "Bearer",
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes || [],
        accountName: accountInfo.accountName,
        accountHandle: accountInfo.accountHandle,
        profileUrl: accountInfo.profileUrl,
        avatarUrl: accountInfo.avatarUrl,
        connectionStatus: "active",
        lastError: null,
        lastErrorAt: null,
        updatedAt: new Date(),
      })
      .where(eq(socialOauthTokens.id, existing.id))
      .returning();

    return updated as StoredToken;
  }

  // Insert new token
  const [inserted] = await db
    .insert(socialOauthTokens)
    .values({
      organizationId,
      brandId,
      platform,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenType: tokens.tokenType || "Bearer",
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes || [],
      accountId: accountInfo.accountId,
      accountName: accountInfo.accountName,
      accountHandle: accountInfo.accountHandle,
      profileUrl: accountInfo.profileUrl,
      avatarUrl: accountInfo.avatarUrl,
      connectionStatus: "active",
    })
    .returning();

  return inserted as StoredToken;
}

/**
 * Get decrypted tokens for a brand/platform
 */
export async function getTokens(params: {
  brandId: string;
  platform: SocialPlatform;
  accountId?: string;
}): Promise<(StoredToken & { decryptedAccessToken: string; decryptedRefreshToken: string | null }) | null> {
  const { brandId, platform, accountId } = params;

  const conditions = [
    eq(socialOauthTokens.brandId, brandId),
    eq(socialOauthTokens.platform, platform),
  ];

  if (accountId) {
    conditions.push(eq(socialOauthTokens.accountId, accountId));
  }

  const token = await db.query.socialOauthTokens.findFirst({
    where: and(...conditions),
  });

  if (!token) return null;

  // Decrypt tokens
  const decryptedAccessToken = decryptToken(token.accessToken);
  const decryptedRefreshToken = token.refreshToken
    ? decryptToken(token.refreshToken)
    : null;

  return {
    ...(token as StoredToken),
    decryptedAccessToken,
    decryptedRefreshToken,
  };
}

/**
 * Get all connected accounts for a brand
 */
export async function getConnectedAccounts(brandId: string): Promise<StoredToken[]> {
  const tokens = await db.query.socialOauthTokens.findMany({
    where: eq(socialOauthTokens.brandId, brandId),
  });

  return tokens as StoredToken[];
}

/**
 * Get all connected accounts for an organization
 */
export async function getOrganizationAccounts(organizationId: string): Promise<StoredToken[]> {
  const tokens = await db.query.socialOauthTokens.findMany({
    where: eq(socialOauthTokens.organizationId, organizationId),
  });

  return tokens as StoredToken[];
}

// ============================================================================
// Token Status Management
// ============================================================================

/**
 * Update token connection status
 */
export async function updateTokenStatus(params: {
  tokenId: string;
  status: ConnectionStatus;
  error?: string;
}): Promise<void> {
  const { tokenId, status, error } = params;

  await db
    .update(socialOauthTokens)
    .set({
      connectionStatus: status,
      lastError: error || null,
      lastErrorAt: error ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(socialOauthTokens.id, tokenId));
}

/**
 * Check if token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(token: StoredToken, bufferMinutes: number = 5): boolean {
  if (!token.expiresAt) return false; // No expiry = never expires

  const bufferMs = bufferMinutes * 60 * 1000;
  const expiryWithBuffer = new Date(token.expiresAt.getTime() - bufferMs);

  return new Date() >= expiryWithBuffer;
}

/**
 * Update tokens after a refresh
 */
export async function updateRefreshedTokens(params: {
  tokenId: string;
  tokens: TokenData;
}): Promise<StoredToken> {
  const { tokenId, tokens } = params;

  const encryptedAccessToken = encryptToken(tokens.accessToken);
  const encryptedRefreshToken = tokens.refreshToken
    ? encryptToken(tokens.refreshToken)
    : undefined;

  const updateData: Record<string, unknown> = {
    accessToken: encryptedAccessToken,
    tokenType: tokens.tokenType || "Bearer",
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes,
    connectionStatus: "active" as const,
    lastError: null,
    lastErrorAt: null,
    updatedAt: new Date(),
  };

  // Only update refresh token if provided (some platforms don't rotate it)
  if (encryptedRefreshToken) {
    updateData.refreshToken = encryptedRefreshToken;
  }

  const [updated] = await db
    .update(socialOauthTokens)
    .set(updateData)
    .where(eq(socialOauthTokens.id, tokenId))
    .returning();

  return updated as StoredToken;
}

// ============================================================================
// Token Deletion
// ============================================================================

/**
 * Update account info (handle, profile URL) for a token
 * Used when user manually adds/edits their handle
 */
export async function updateAccountInfo(params: {
  tokenId: string;
  accountHandle?: string;
  profileUrl?: string;
}): Promise<StoredToken> {
  const { tokenId, accountHandle, profileUrl } = params;

  const [updated] = await db
    .update(socialOauthTokens)
    .set({
      accountHandle: accountHandle ?? undefined,
      profileUrl: profileUrl ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(socialOauthTokens.id, tokenId))
    .returning();

  return updated as StoredToken;
}

/**
 * Revoke/delete a token connection
 */
export async function revokeToken(tokenId: string): Promise<void> {
  await db
    .delete(socialOauthTokens)
    .where(eq(socialOauthTokens.id, tokenId));
}

/**
 * Revoke all tokens for a brand on a specific platform
 */
export async function revokeAllPlatformTokens(params: {
  brandId: string;
  platform: SocialPlatform;
}): Promise<void> {
  await db
    .delete(socialOauthTokens)
    .where(
      and(
        eq(socialOauthTokens.brandId, params.brandId),
        eq(socialOauthTokens.platform, params.platform)
      )
    );
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Validate a token is usable (active, not expired)
 */
export async function validateToken(params: {
  brandId: string;
  platform: SocialPlatform;
  accountId?: string;
}): Promise<{
  valid: boolean;
  reason?: "not_found" | "expired" | "revoked" | "error" | "pending";
  token?: StoredToken;
}> {
  const token = await getTokens(params);

  if (!token) {
    return { valid: false, reason: "not_found" };
  }

  // Check connection status
  if (token.connectionStatus === "revoked") {
    return { valid: false, reason: "revoked", token };
  }

  if (token.connectionStatus === "error") {
    return { valid: false, reason: "error", token };
  }

  if (token.connectionStatus === "pending") {
    return { valid: false, reason: "pending", token };
  }

  // Check expiry
  if (isTokenExpired(token)) {
    // Mark as expired in DB
    await updateTokenStatus({
      tokenId: token.id,
      status: "expired",
    });
    return { valid: false, reason: "expired", token };
  }

  return { valid: true, token };
}

// ============================================================================
// Utility Exports
// ============================================================================

export const TokenService = {
  // Encryption
  encryptToken,
  decryptToken,

  // Storage
  storeTokens,
  getTokens,
  getConnectedAccounts,
  getOrganizationAccounts,

  // Status
  updateTokenStatus,
  isTokenExpired,
  updateRefreshedTokens,

  // Account Info
  updateAccountInfo,

  // Deletion
  revokeToken,
  revokeAllPlatformTokens,

  // Validation
  validateToken,
};

export default TokenService;
