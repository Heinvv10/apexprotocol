import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  audits,
  brands,
  organizations,
  type AuditIssue,
  type CategoryScore,
} from "@/lib/db/schema";
import { resolveShareToken, recordShareView } from "@/lib/share/token";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const share = await resolveShareToken(token);
  if (!share) return { title: "Report not found" };
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, share.brandId),
  });
  return {
    title: brand?.name
      ? `AI Visibility Report — ${brand.name}`
      : "AI Visibility Report",
    robots: { index: false, follow: false },
  };
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "#22C55E" };
  if (score >= 75) return { letter: "B", color: "#84CC16" };
  if (score >= 60) return { letter: "C", color: "#EAB308" };
  if (score >= 45) return { letter: "D", color: "#F59E0B" };
  return { letter: "F", color: "#EF4444" };
}

const SEVERITY_META: Record<AuditIssue["severity"], { label: string; color: string }> = {
  critical: { label: "Critical", color: "#EF4444" },
  high: { label: "High", color: "#F59E0B" },
  medium: { label: "Medium", color: "#EAB308" },
  low: { label: "Low", color: "#22C55E" },
};

export default async function SharedAuditPage({ params }: PageProps) {
  const { token } = await params;
  const share = await resolveShareToken(token);
  if (!share) notFound();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, share.auditId),
  });
  if (!audit) notFound();

  const [brand, org] = await Promise.all([
    db.query.brands.findFirst({ where: eq(brands.id, share.brandId) }),
    db.query.organizations.findFirst({ where: eq(organizations.id, share.organizationId) }),
  ]);

  await recordShareView(share.id).catch(() => {
    // Non-fatal: telemetry failure shouldn't block the page.
  });

  const agencyName = org?.name ?? "ApexGEO";
  const agencyLogo = org?.branding?.logoUrl ?? null;
  const accentColor = org?.branding?.primaryColor ?? "#00E5CC";

  const brandName = brand?.name ?? audit.url;
  const brandLogo = brand?.logoUrl ?? null;
  const brandDomain = brand?.domain ?? null;

  const overallScore = audit.overallScore ?? 0;
  const grade = getGrade(overallScore);

  const categoryScores: CategoryScore[] = audit.categoryScores ?? [];
  const issues: AuditIssue[] = audit.issues ?? [];

  const severityCounts = {
    critical: audit.criticalCount ?? issues.filter((i) => i.severity === "critical").length,
    high: audit.highCount ?? issues.filter((i) => i.severity === "high").length,
    medium: audit.mediumCount ?? issues.filter((i) => i.severity === "medium").length,
    low: audit.lowCount ?? issues.filter((i) => i.severity === "low").length,
  };

  const SEVERITY_ORDER: AuditIssue["severity"][] = ["critical", "high", "medium", "low"];
  const issuesBySeverity: Record<AuditIssue["severity"], AuditIssue[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };
  for (const issue of issues) issuesBySeverity[issue.severity].push(issue);

  const scannedOn = audit.startedAt
    ? new Date(audit.startedAt).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-200">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #000 !important; }
          .shared-report { background: #ffffff !important; color: #000 !important; }
          .shared-card { background: #ffffff !important; border: 1px solid #e5e7eb !important; color: #000 !important; break-inside: avoid; }
          .shared-muted { color: #475569 !important; }
          @page { size: A4; margin: 18mm; }
        }
      `}</style>

      <div className="shared-report mx-auto max-w-5xl px-6 py-10 md:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {agencyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agencyLogo}
                alt={agencyName}
                className="h-10 max-w-[180px] object-contain"
              />
            ) : (
              <span className="text-xl font-bold" style={{ color: accentColor }}>
                {agencyName}
              </span>
            )}
            <div className="hidden h-8 w-px bg-white/10 md:block" />
            <div className="hidden md:block">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Prepared by</p>
              <p className="text-sm font-medium text-slate-200">{agencyName}</p>
            </div>
          </div>
          <PrintButton />
        </header>

        {/* Title block */}
        <section className="shared-card mb-8 rounded-2xl border border-white/10 bg-[#141930] p-8">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            AI Visibility Report
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {brandLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandLogo}
                alt={brandName}
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-50">{brandName}</h1>
              {brandDomain && (
                <p className="shared-muted text-sm text-slate-400">{brandDomain}</p>
              )}
            </div>
          </div>
          {scannedOn && (
            <p className="shared-muted mt-4 text-xs text-slate-500">
              Scanned on {scannedOn}
            </p>
          )}
        </section>

        {/* Score + severity grid */}
        <section className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="shared-card rounded-2xl border border-white/10 bg-[#141930] p-6 text-center">
            <p className="shared-muted text-xs uppercase tracking-wider text-slate-500">
              Overall Score
            </p>
            <p
              className="mt-2 text-7xl font-black leading-none"
              style={{ color: accentColor }}
            >
              {overallScore}
            </p>
            <p className="shared-muted mt-1 text-xs text-slate-500">out of 100</p>
            <span
              className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-1 text-2xl font-black"
              style={{ background: grade.color + "22", color: grade.color }}
            >
              {grade.letter}
            </span>
          </div>

          <div className="shared-card md:col-span-2 rounded-2xl border border-white/10 bg-[#141930] p-6">
            <p className="shared-muted mb-4 text-xs uppercase tracking-wider text-slate-500">
              Issues Found
            </p>
            <div className="grid grid-cols-4 gap-4">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const meta = SEVERITY_META[sev];
                return (
                  <div key={sev} className="text-center">
                    <p
                      className="text-4xl font-bold"
                      style={{ color: meta.color }}
                    >
                      {severityCounts[sev]}
                    </p>
                    <p className="shared-muted mt-1 text-xs text-slate-400">
                      {meta.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="shared-muted mt-6 text-sm leading-relaxed text-slate-400">
              {overallScore >= 75
                ? "Strong AI visibility — your brand is being cited across major platforms."
                : overallScore >= 50
                ? "Moderate AI visibility — key gaps identified across some platforms."
                : "Significant visibility gaps found — immediate action recommended."}
            </p>
          </div>
        </section>

        {/* Category breakdown */}
        {categoryScores.length > 0 && (
          <section className="shared-card mb-8 rounded-2xl border border-white/10 bg-[#141930] p-8">
            <h2 className="mb-6 text-lg font-semibold text-slate-50">Category Breakdown</h2>
            <div className="space-y-5">
              {categoryScores.map((cat) => {
                const pct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{cat.category}</span>
                      <span
                        className="font-semibold"
                        style={{ color: accentColor }}
                      >
                        {cat.score}/{cat.maxScore}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: accentColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Full action plan — every issue with full remediation context */}
        {issues.length > 0 && (
          <section className="shared-card mb-8 rounded-2xl border border-white/10 bg-[#141930] p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Action Plan</h2>
                <p className="shared-muted mt-1 text-sm text-slate-400">
                  Every outstanding issue, grouped by severity. Work top-down to move the score fastest.
                </p>
              </div>
              <p className="shared-muted text-xs uppercase tracking-wider text-slate-500">
                {issues.length} {issues.length === 1 ? "task" : "tasks"} total
              </p>
            </div>

            {SEVERITY_ORDER.map((sev) => {
              const list = issuesBySeverity[sev];
              if (list.length === 0) return null;
              const meta = SEVERITY_META[sev];
              let counter = 0;
              return (
                <div key={sev} className="mb-8 last:mb-0">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ background: meta.color + "22", color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="shared-muted text-xs text-slate-500">
                      {list.length} {list.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                  <ol className="space-y-5">
                    {list.map((issue) => {
                      counter += 1;
                      return (
                        <li
                          key={issue.id}
                          className="flex gap-4 border-b border-white/5 pb-5 last:border-b-0 last:pb-0"
                        >
                          <span
                            className="w-7 shrink-0 text-xl font-black tabular-nums"
                            style={{ color: meta.color }}
                          >
                            {String(counter).padStart(2, "0")}
                          </span>
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="shared-muted text-[11px] uppercase tracking-wider text-slate-500">
                                {issue.category}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-100">
                              {issue.title}
                            </h3>
                            {issue.description && (
                              <p className="shared-muted mt-2 text-sm leading-relaxed text-slate-400">
                                {issue.description}
                              </p>
                            )}
                            {issue.recommendation && (
                              <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                <p
                                  className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                                  style={{ color: accentColor }}
                                >
                                  How to fix
                                </p>
                                <p className="text-sm leading-relaxed text-slate-200">
                                  {issue.recommendation}
                                </p>
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                              {issue.impact && (
                                <div className="flex-1 min-w-[180px]">
                                  <p className="shared-muted text-[10px] uppercase tracking-wider text-slate-500">
                                    Expected impact
                                  </p>
                                  <p className="mt-0.5 text-slate-300">{issue.impact}</p>
                                </div>
                              )}
                              {issue.element && (
                                <div className="flex-1 min-w-[180px]">
                                  <p className="shared-muted text-[10px] uppercase tracking-wider text-slate-500">
                                    Target element
                                  </p>
                                  <p className="mt-0.5 break-all font-mono text-slate-300">
                                    {issue.element}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-6 text-center">
          <p className="shared-muted text-xs text-slate-500">
            Prepared by <span className="font-medium text-slate-300">{agencyName}</span>
            <span className="mx-2">·</span>
            Powered by{" "}
            <a
              href="https://apexgeo.app"
              className="font-medium text-slate-300 hover:text-slate-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              ApexGEO
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
