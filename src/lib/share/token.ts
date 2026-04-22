import crypto from "node:crypto";
import { db } from "@/lib/db";
import { auditShares, type AuditShare } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type ExpiryChoice = "7d" | "14d" | "30d" | "never";

const NEVER_CAP_DAYS = 365;

export function computeExpiresAt(choice: ExpiryChoice): Date {
  const days =
    choice === "7d" ? 7
    : choice === "14d" ? 14
    : choice === "30d" ? 30
    : NEVER_CAP_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function isShareActive(share: Pick<AuditShare, "expiresAt" | "revokedAt">): boolean {
  if (share.revokedAt) return false;
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function resolveShareToken(token: string): Promise<AuditShare | null> {
  const share = await db.query.auditShares.findFirst({
    where: eq(auditShares.token, token),
  });
  if (!share) return null;
  if (!isShareActive(share)) return null;
  return share;
}

export async function recordShareView(shareId: string): Promise<void> {
  await db
    .update(auditShares)
    .set({
      viewCount: sql`${auditShares.viewCount} + 1`,
      lastViewedAt: new Date(),
    })
    .where(eq(auditShares.id, shareId));
}

export async function revokeShare(token: string, organizationId: string): Promise<boolean> {
  const result = await db
    .update(auditShares)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(auditShares.token, token),
        eq(auditShares.organizationId, organizationId),
      ),
    )
    .returning({ id: auditShares.id });
  return result.length > 0;
}
