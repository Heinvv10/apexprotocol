/**
 * Public embed page: /embed/score?token=<signed-token>
 *
 * Rendered inside an <iframe> on the agency's or client's site.
 * No dashboard chrome — just the score widget. Tenant + brand scope
 * comes from the signed token, not cookies — so no session required.
 *
 * Security: CSP frame-ancestors is set via middleware (if we add it)
 * or by the caller's own CSP. By default we allow any origin to embed;
 * tenants who want origin-locking pass `origin` when minting the token.
 */

import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brands } from "@/lib/db/schema";
import { verifyEmbedToken } from "@/lib/embed/signed-token";
import { composeDecomposition, type FactorKey } from "@/lib/audit/score-decomposition";

export const dynamic = "force-dynamic";

const FACTOR_MAP: Record<string, FactorKey> = {
  schema: "schema",
  schema_markup: "schema",
  structure: "structure",
  content_structure: "structure",
  clarity: "clarity",
  readability: "clarity",
  metadata: "metadata",
  accessibility: "accessibility",
};

export default async function EmbedScorePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return <EmbedError message="Missing token" />;
  }

  const hdrs = await headers();
  const referer = hdrs.get("referer");
  const verification = verifyEmbedToken(token, { referer });
  if (!verification.ok) {
    return (
      <EmbedError
        message={`Widget unavailable (${verification.reason.replace(/_/g, " ")})`}
      />
    );
  }
  const { payload } = verification;

  const brandRows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .where(
      and(
        eq(brands.id, payload.brandId),
        eq(brands.organizationId, payload.tenantId),
      ),
    )
    .limit(1);
  if (brandRows.length === 0) {
    return <EmbedError message="Brand not found" />;
  }

  const auditRows = await db
    .select({
      overallScore: audits.overallScore,
      categoryScores: audits.categoryScores,
      completedAt: audits.completedAt,
    })
    .from(audits)
    .where(
      and(
        eq(audits.brandId, payload.brandId),
        eq(audits.status, "completed"),
      ),
    )
    .orderBy(desc(audits.completedAt))
    .limit(1);

  if (auditRows.length === 0) {
    return (
      <EmbedFrame brandName={brandRows[0].name}>
        <div className="text-center text-sm text-muted-foreground">
          No completed audit yet.
        </div>
      </EmbedFrame>
    );
  }

  const a = auditRows[0];
  const categoryScores = (a.categoryScores ?? []) as Array<{
    category: string;
    score: number;
  }>;
  const decomposition = composeDecomposition(
    categoryScores
      .map((c) => ({
        key: FACTOR_MAP[c.category] ?? null,
        rawScore: c.score,
      }))
      .filter((c): c is { key: FactorKey; rawScore: number } => c.key !== null),
  );

  return (
    <EmbedFrame brandName={brandRows[0].name}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            AI Readiness Score
          </p>
          <p className="mt-1 text-5xl font-semibold tabular-nums">
            {a.overallScore ?? decomposition.overall}
            <span className="ml-1 text-lg font-normal text-muted-foreground">
              /100
            </span>
          </p>
          {a.completedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              As of {new Date(a.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {decomposition.factors.map((f) => (
            <div key={f.key} className="text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="tabular-nums">{f.rawScore}/100</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${f.rawScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmbedFrame>
  );
}

function EmbedFrame({
  brandName,
  children,
}: {
  brandName: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="rounded-xl border border-border bg-card p-5">
        <header className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium">{brandName}</p>
          <a
            href="https://apex.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-cyan-400"
          >
            Powered by Apex
          </a>
        </header>
        {children}
      </div>
    </main>
  );
}

function EmbedError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
