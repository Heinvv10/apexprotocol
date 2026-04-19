/**
 * GET /api/admin/audit-debug/[id]
 *
 * Admin-only dump of an audit's full internals — raw signals, scoring
 * decomposition, evidence trail, timing. Use for investigating score
 * anomalies without having to read the DB directly.
 *
 * Gated behind the super-admin check so auditors don't surface this on
 * customer dashboards. Metadata may contain crawled URLs + site content.
 */

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, users } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth/supabase-server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Super-admin gate — matches the pattern in /api/admin/* routes.
  const me = await db.query.users.findFirst({
    where: eq(users.authUserId, userId),
  });
  if (!me?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, id),
  });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // metadata.scoring was added in the Phase A rewrite — older audits
  // predate it and won't have this field. Surface that explicitly so the
  // debug consumer knows they're looking at a legacy row.
  const meta = (audit.metadata as Record<string, unknown>) ?? {};
  const scoring = meta.scoring as Record<string, unknown> | undefined;

  return NextResponse.json({
    audit: {
      id: audit.id,
      brandId: audit.brandId,
      url: audit.url,
      status: audit.status,
      overallScore: audit.overallScore,
      categoryScores: audit.categoryScores,
      issueCount: audit.issueCount,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
    },
    scoring: scoring ?? { note: "Pre-Phase-A audit — no scoring decomposition persisted." },
    rawMetadata: meta,
    issues: audit.issues,
  });
}
