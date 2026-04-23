import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, or, gt } from "drizzle-orm";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { audits, auditShares, users } from "@/lib/db/schema";
import {
  computeExpiresAt,
  generateShareToken,
  type ExpiryChoice,
} from "@/lib/share/token";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function buildShareUrl(token: string, request: NextRequest): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return `${base}/shared/audit/${token}`;
}

function isValidExpiry(value: unknown): value is ExpiryChoice {
  return value === "7d" || value === "14d" || value === "30d" || value === "never";
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = await getUserId();
  const orgId = await getOrganizationId();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const expiry = body?.expiry;
  if (!isValidExpiry(expiry)) {
    return NextResponse.json(
      { error: "Invalid expiry. Use 7d, 14d, 30d, or never." },
      { status: 400 },
    );
  }

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, id),
    with: { brand: true },
  });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }
  if (audit.brand.organizationId !== orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const token = generateShareToken();
  const expiresAt = computeExpiresAt(expiry);

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authUserId, userId),
    columns: { id: true },
  });

  const [share] = await db
    .insert(auditShares)
    .values({
      auditId: audit.id,
      brandId: audit.brandId,
      organizationId: orgId,
      token,
      expiresAt,
      createdById: dbUser?.id ?? null,
    })
    .returning();

  return NextResponse.json({
    share,
    url: buildShareUrl(token, request),
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = await getUserId();
  const orgId = await getOrganizationId();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, id),
    with: { brand: true },
  });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }
  if (audit.brand.organizationId !== orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const now = new Date();
  const shares = await db
    .select()
    .from(auditShares)
    .where(
      and(
        eq(auditShares.auditId, id),
        isNull(auditShares.revokedAt),
        or(isNull(auditShares.expiresAt), gt(auditShares.expiresAt, now)),
      ),
    )
    .orderBy(desc(auditShares.createdAt));

  return NextResponse.json({
    shares: shares.map((s) => ({
      ...s,
      url: buildShareUrl(s.token, request),
    })),
  });
}
