/**
 * DELETE /api/brands/:id/voice-samples/:sampleId — delete a sample
 * POST   /api/brands/:id/voice-samples/:sampleId/re-extract — retry extraction
 *
 * The POST handler here is for the DELETE+update pair. Re-extract lives at
 * /re-extract because Next.js route handlers are keyed by method per path.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, brandVoiceSamples } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/supabase-server";

async function ownsSample(sampleId: string, brandId: string, orgId: string) {
  const rows = await db
    .select({ id: brandVoiceSamples.id })
    .from(brandVoiceSamples)
    .innerJoin(brands, eq(brands.id, brandVoiceSamples.brandId))
    .where(
      and(
        eq(brandVoiceSamples.id, sampleId),
        eq(brandVoiceSamples.brandId, brandId),
        eq(brands.organizationId, orgId),
      ),
    )
    .limit(1);
  return rows.length === 1;
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; sampleId: string }> },
) {
  const { id: brandId, sampleId } = await params;
  const session = await requireSession();
  if (!session.orgId) {
    return NextResponse.json(
      { error: "unauthorized", message: "No active org." },
      { status: 401 },
    );
  }

  if (!(await ownsSample(sampleId, brandId, session.orgId))) {
    return NextResponse.json(
      { error: "not_found", message: "Sample not found." },
      { status: 404 },
    );
  }

  await db.delete(brandVoiceSamples).where(eq(brandVoiceSamples.id, sampleId));
  return new NextResponse(null, { status: 204 });
}
