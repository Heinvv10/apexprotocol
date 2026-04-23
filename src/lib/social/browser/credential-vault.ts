/**
 * Credential vault for browser-automation social posting.
 *
 * Wraps src/lib/encryption.ts (AES-256-GCM) and writes to social_browser_credentials.
 * The TOTP secret is never returned in plaintext — callers can only request a
 * computed one-time code, which is scoped to the immediate login attempt.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  socialBrowserCredentials,
  type NewSocialBrowserCredential,
  type SocialBrowserCredential,
} from "@/lib/db/schema/social-browser-auth";
import { decrypt, encrypt, type EncryptedData } from "@/lib/encryption";
import { generateCode } from "./totp";

export interface CreateCredentialInput {
  organizationId: string;
  brandId: string;
  platform: SocialBrowserCredential["platform"];
  username: string;
  password: string;
  totpSecret?: string;
  profileUrl?: string;
  userAgent: string;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * What callers get back when they ask for a credential. The TOTP secret is
 * intentionally absent — use getOneTimeCode() instead.
 */
export interface DecryptedCredential {
  id: string;
  organizationId: string;
  brandId: string;
  platform: SocialBrowserCredential["platform"];
  username: string;
  profileUrl: string | null;
  password: string;
  hasTotp: boolean;
  sessionState: string | null;
  sessionExpiresAt: Date | null;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  status: SocialBrowserCredential["status"];
}

export async function createCredential(
  input: CreateCredentialInput,
): Promise<SocialBrowserCredential> {
  const db = getDb();
  const row: NewSocialBrowserCredential = {
    organizationId: input.organizationId,
    brandId: input.brandId,
    platform: input.platform,
    username: input.username,
    profileUrl: input.profileUrl,
    passwordEncrypted: encrypt(input.password),
    totpSecretEncrypted: input.totpSecret ? encrypt(input.totpSecret) : null,
    userAgent: input.userAgent,
    viewportWidth: input.viewportWidth ?? 1366,
    viewportHeight: input.viewportHeight ?? 768,
  };

  const [inserted] = await db
    .insert(socialBrowserCredentials)
    .values(row)
    .returning();
  return inserted;
}

export async function getCredential(
  credentialId: string,
): Promise<DecryptedCredential | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(socialBrowserCredentials)
    .where(eq(socialBrowserCredentials.id, credentialId))
    .limit(1);
  if (!row) return null;
  return toDecrypted(row);
}

export async function findCredential(
  brandId: string,
  platform: SocialBrowserCredential["platform"],
  username: string,
): Promise<DecryptedCredential | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(socialBrowserCredentials)
    .where(
      and(
        eq(socialBrowserCredentials.brandId, brandId),
        eq(socialBrowserCredentials.platform, platform),
        eq(socialBrowserCredentials.username, username),
      ),
    )
    .limit(1);
  if (!row) return null;
  return toDecrypted(row);
}

export async function listCredentialsForBrand(
  brandId: string,
): Promise<DecryptedCredential[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(socialBrowserCredentials)
    .where(eq(socialBrowserCredentials.brandId, brandId));
  return rows.map(toDecrypted);
}

/**
 * Update persisted session state (Puppeteer cookies + storage) and its
 * expiry. Called after a successful login.
 */
export async function updateSessionState(
  credentialId: string,
  sessionStateJson: string,
  expiresAt: Date,
): Promise<void> {
  const db = getDb();
  await db
    .update(socialBrowserCredentials)
    .set({
      sessionStateEncrypted: encrypt(sessionStateJson),
      sessionExpiresAt: expiresAt,
      lastUsedAt: new Date(),
      lastError: null,
      lastErrorAt: null,
      updatedAt: new Date(),
    })
    .where(eq(socialBrowserCredentials.id, credentialId));
}

/**
 * Mark the credential as flagged (e.g. after a CAPTCHA / unusual-activity
 * detection signal) so it won't be picked up by the automation loop.
 */
export async function markFlagged(
  credentialId: string,
  reason: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(socialBrowserCredentials)
    .set({
      status: "flagged",
      lastError: reason,
      lastErrorAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(socialBrowserCredentials.id, credentialId));
}

/**
 * Compute the current one-time code for a credential's TOTP secret.
 * Throws if the credential has no TOTP secret configured.
 */
export async function getOneTimeCode(credentialId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ totpSecretEncrypted: socialBrowserCredentials.totpSecretEncrypted })
    .from(socialBrowserCredentials)
    .where(eq(socialBrowserCredentials.id, credentialId))
    .limit(1);
  if (!row?.totpSecretEncrypted) {
    throw new Error(
      `Credential ${credentialId} has no TOTP secret — cannot compute one-time code`,
    );
  }
  const secret = decrypt(row.totpSecretEncrypted as EncryptedData);
  return generateCode(secret);
}

function toDecrypted(row: SocialBrowserCredential): DecryptedCredential {
  return {
    id: row.id,
    organizationId: row.organizationId,
    brandId: row.brandId,
    platform: row.platform,
    username: row.username,
    profileUrl: row.profileUrl,
    password: decrypt(row.passwordEncrypted as EncryptedData),
    hasTotp: row.totpSecretEncrypted !== null,
    sessionState: row.sessionStateEncrypted
      ? decrypt(row.sessionStateEncrypted as EncryptedData)
      : null,
    sessionExpiresAt: row.sessionExpiresAt,
    userAgent: row.userAgent,
    viewportWidth: row.viewportWidth,
    viewportHeight: row.viewportHeight,
    status: row.status,
  };
}
