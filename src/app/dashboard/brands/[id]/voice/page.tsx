import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, brandVoiceSamples } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/supabase-server";
import { VoiceManager } from "./voice-manager";

export const dynamic = "force-dynamic";

export default async function BrandVoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: brandId } = await params;
  const session = await requireSession();
  if (!session.orgId) notFound();

  const brandRows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.organizationId, session.orgId)))
    .limit(1);

  if (brandRows.length === 0) notFound();
  const brand = brandRows[0];

  const samples = await db
    .select()
    .from(brandVoiceSamples)
    .where(eq(brandVoiceSamples.brandId, brandId))
    .orderBy(desc(brandVoiceSamples.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{brand.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Brand Voice
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Upload 1–5 writing samples. Apex extracts a structured style descriptor
          and injects it into every draft generated for this brand. Aim for
          samples that are unmistakably &ldquo;you&rdquo; — landing pages, blog
          posts, founder letters, not generic announcements.
        </p>
      </header>

      <VoiceManager
        brandId={brandId}
        initialSamples={samples.map((s) => ({
          id: s.id,
          label: s.label,
          sourceType: s.sourceType,
          sourceUrl: s.sourceUrl,
          rawText: s.rawText,
          descriptor: s.descriptorJson,
          extractionError: s.extractionError,
          extractedAt: s.extractedAt?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
