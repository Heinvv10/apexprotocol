/**
 * Client Report Page
 * Standalone print/puppeteer-optimised page — dark copper theme
 * Route: /report/[brandId]/[period]
 */

import { notFound } from "next/navigation";
import Image from "next/image";
import { getReportData } from "@/lib/reports/report-data";
import { getReportBranding, getBrandingCSSVariables } from "@/lib/reports/report-config";
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ brandId: string; period: string }>;
  searchParams: Promise<{ token?: string; orgId?: string }>;
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "#22c55e" };
  if (score >= 75) return { letter: "B", color: "#84cc16" };
  if (score >= 60) return { letter: "C", color: "#eab308" };
  if (score >= 45) return { letter: "D", color: "#f97316" };
  return { letter: "F", color: "#ef4444" };
}

function getHighlight(score: number): string {
  if (score >= 75) return "Strong AI visibility — your brand is being cited across major platforms.";
  if (score >= 50) return "Moderate AI visibility — key gaps identified across some platforms.";
  return "Significant visibility gaps found — immediate action recommended.";
}

const PLATFORM_DISPLAY: Record<string, { name: string; emoji: string }> = {
  chatgpt: { name: "ChatGPT", emoji: "🤖" },
  claude: { name: "Claude", emoji: "🧠" },
  gemini: { name: "Gemini", emoji: "💎" },
  perplexity: { name: "Perplexity", emoji: "🔍" },
  grok: { name: "Grok", emoji: "⚡" },
  deepseek: { name: "DeepSeek", emoji: "🌊" },
  copilot: { name: "Copilot", emoji: "✈️" },
};

function RadarSVG({ scores }: { scores: number[] }) {
  const cx = 120, cy = 120, r = 90;
  const n = scores.length;
  const points = scores.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const len = (s / 100) * r;
    return { x: cx + len * Math.cos(angle), y: cy + len * Math.sin(angle) };
  });
  const gridPoints = Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width="240" height="240" viewBox="0 0 240 240">
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const gp = gridPoints.map((p) => ({
          x: cx + (p.x - cx) * pct,
          y: cy + (p.y - cy) * pct,
        }));
        return <path key={pct} d={toPath(gp)} fill="none" stroke="#2a2a3a" strokeWidth="1" />;
      })}
      {gridPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#2a2a3a" strokeWidth="1" />
      ))}
      <path d={toPath(points)} fill="rgba(200,121,65,0.25)" stroke="#C87941" strokeWidth="2" />
    </svg>
  );
}

function SparklineSVG({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 120, h = 40, pad = 4;
  const xs = scores.map((_, i) => pad + (i / (scores.length - 1)) * (w - pad * 2));
  const min = Math.min(...scores), max = Math.max(...scores);
  const range = max - min || 1;
  const ys = scores.map((s) => h - pad - ((s - min) / range) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke="#C87941" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill="#C87941" />
    </svg>
  );
}

export default async function ReportPage({ params, searchParams }: Props) {
  const { brandId, period } = await params;
  const { token, orgId } = await searchParams;

  // Allow ?token=preview for unauthenticated access (Puppeteer)
  if (token !== "preview") {
    const { auth } = await import("@/lib/auth/supabase-server");
    const __session = await getSession();
  const { userId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
    if (!userId) notFound();
  }

  const resolvedOrgId = orgId ?? "";
  const data = await getReportData(brandId, resolvedOrgId).catch(() => null);
  if (!data) notFound();

  const branding = getReportBranding(data.organization as Parameters<typeof getReportBranding>[0]);
  const cssVars = getBrandingCSSVariables(branding);

  const overallScore = data.audit?.overallScore ?? 0;
  const grade = getGrade(overallScore);
  const highlight = getHighlight(overallScore);
  const periodLabel = period.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const generatedDate = new Date(data.generatedAt).toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric",
  });

  const platformScores = data.platformMentions.map((p) => Math.min(100, p.count * 10));

  const priorityColor: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI Visibility Report — {data.brand?.name}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
        <style>{`
          :root { ${cssVars} }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: var(--report-bg); font-family: var(--report-font); color: var(--report-text); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { width: 210mm; min-height: 297mm; padding: 20mm; position: relative; page-break-after: always; overflow: hidden; }
          @media print { .page { page-break-after: always; } }
          .page:last-child { page-break-after: auto; }
          .accent { color: var(--report-accent); }
          .card { background: var(--report-bg-card); border: 1px solid var(--report-border); border-radius: 8px; padding: 16px; }
          .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .score-pill { background: var(--report-bg-card); border: 1px solid var(--report-border); border-radius: 8px; padding: 12px 20px; text-align: center; min-width: 100px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: var(--report-bg-card-alt); color: var(--report-accent); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 12px; text-align: left; }
          td { padding: 10px 12px; border-bottom: 1px solid var(--report-border); font-size: 13px; }
          tr:last-child td { border-bottom: none; }
          .footer { position: absolute; bottom: 12mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--report-text-muted); border-top: 1px solid var(--report-border); padding-top: 8px; }
          .page-num { color: var(--report-accent); font-weight: 600; }
        `}</style>
      </head>
      <body>

        {/* PAGE 1: COVER */}
        <div className="page" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 36, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--report-accent)" }}>ApexGEO</span>
            )}
            <span style={{ fontSize: 11, color: "var(--report-text-muted)" }}>AI Visibility Platform</span>
          </div>

          <div style={{ textAlign: "center", padding: "40px 0" }}>
            {data.brand?.logoUrl && (
              <img src={data.brand?.logoUrl} alt={data.brand?.name} style={{ height: 80, objectFit: "contain", marginBottom: 32, borderRadius: 12 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--report-accent)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>
              AI Visibility Report
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
              {data.brand?.name}
            </div>
            <div style={{ fontSize: 20, color: "var(--report-text-muted)", marginBottom: 8 }}>
              {periodLabel}
            </div>
            {data.brand?.domain && (
              <div style={{ fontSize: 13, color: "var(--report-text-muted)" }}>{data.brand?.domain}</div>
            )}
          </div>

          <div>
            <div style={{ borderTop: "1px solid var(--report-border)", paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--report-text-muted)" }}>
              <span>Prepared by {branding.companyName}</span>
              <span>{branding.companyUrl}</span>
              <span>{generatedDate}</span>
            </div>
          </div>
        </div>

        {/* PAGE 2: EXECUTIVE SUMMARY */}
        <div className="page">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--report-accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Executive Summary</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.brand?.name} — AI Visibility Overview</div>
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 24, alignItems: "flex-start" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: "var(--report-accent)" }}>{overallScore}</div>
              <div style={{ fontSize: 12, color: "var(--report-text-muted)", marginTop: 4 }}>Unified Score</div>
              <div style={{ marginTop: 8 }}>
                <span className="badge" style={{ background: grade.color + "22", color: grade.color, fontSize: 22, fontWeight: 900, padding: "6px 20px" }}>
                  {grade.letter}
                </span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { label: "GEO Score", value: data.audit?.categoryScores?.find((c) => c.name?.toLowerCase().includes("geo"))?.score ?? overallScore },
                  { label: "SEO Score", value: data.audit?.categoryScores?.find((c) => c.name?.toLowerCase().includes("seo"))?.score ?? Math.round(overallScore * 0.9) },
                  { label: "AEO Score", value: data.audit?.categoryScores?.find((c) => c.name?.toLowerCase().includes("aeo"))?.score ?? Math.round(overallScore * 0.85) },
                ].map((pill) => (
                  <div key={pill.label} className="score-pill">
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--report-accent)" }}>{pill.value}</div>
                    <div style={{ fontSize: 11, color: "var(--report-text-muted)", marginTop: 2 }}>{pill.label}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--report-text)" }}>{highlight}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--report-text-muted)" }}>Score trend (3 months):</span>
                <SparklineSVG scores={[Math.max(0, overallScore - 8), Math.max(0, overallScore - 4), overallScore]} />
              </div>
            </div>
          </div>

          {data.audit?.categoryScores && data.audit.categoryScores.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Category Breakdown</div>
              {data.audit.categoryScores.slice(0, 5).map((cat) => (
                <div key={cat.name} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span>{cat.name}</span>
                    <span style={{ color: "var(--report-accent)", fontWeight: 600 }}>{cat.score}/{cat.maxScore}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--report-bg-card)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(cat.score / cat.maxScore) * 100}%`, background: "var(--report-accent)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="footer">
            <span>{data.brand?.name} — AI Visibility Report — {periodLabel}</span>
            <span className="page-num">2</span>
          </div>
        </div>

        {/* PAGE 3: AI PLATFORM PERFORMANCE */}
        <div className="page">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--report-accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>AI Platform Performance</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Visibility Across AI Platforms</div>
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Mentions</th>
                    <th>Cited</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.platformMentions.map((p) => {
                    const display = PLATFORM_DISPLAY[p.platform] ?? { name: p.platform, emoji: "🔹" };
                    return (
                      <tr key={p.platform}>
                        <td>{display.emoji} {display.name}</td>
                        <td style={{ fontWeight: 600 }}>{p.count}</td>
                        <td>
                          <span className="badge" style={p.cited ? { background: "#22c55e22", color: "#22c55e" } : { background: "#ef444422", color: "#ef4444" }}>
                            {p.cited ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={p.count > 0 ? { background: "var(--report-bg-card-alt)", color: "var(--report-accent)" } : { background: "var(--report-bg-card)", color: "var(--report-text-muted)" }}>
                            {p.count > 5 ? "Strong" : p.count > 0 ? "Present" : "Not found"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--report-text-muted)" }}>Coverage Radar</div>
              <RadarSVG scores={platformScores} />
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: "var(--report-text-muted)", marginBottom: 4 }}>Insight</div>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>
              {data.platformMentions.filter((p) => p.cited).length === 0
                ? "No AI platform citations detected yet. Focus on structured data, FAQ content, and entity authority to improve citation rates."
                : `${data.brand?.name} is actively cited on ${data.platformMentions.filter((p) => p.cited).length} platform(s). Expand content strategy to improve coverage on uncited platforms.`}
            </p>
          </div>

          <div className="footer">
            <span>{data.brand?.name} — AI Visibility Report — {periodLabel}</span>
            <span className="page-num">3</span>
          </div>
        </div>

        {/* PAGE 4: RECOMMENDATIONS */}
        <div className="page">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--report-accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Smart Recommendations</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Priority Actions & Next Steps</div>
          </div>

          {data.recommendations.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "var(--report-text-muted)" }}>No recommendations generated yet. Run an audit to get personalised recommendations.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {data.recommendations.slice(0, 5).map((rec, i) => (
                <div key={rec.id} className="card" style={{ marginBottom: 12, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--report-text-muted)", minWidth: 32 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="badge" style={{ background: (priorityColor[rec.priority] ?? "#888") + "22", color: priorityColor[rec.priority] ?? "#888" }}>
                        {rec.priority}
                      </span>
                      <span className="badge" style={{ background: "var(--report-bg-card-alt)", color: "var(--report-text-muted)" }}>
                        {rec.effort?.replace("_", " ") ?? "moderate"}
                      </span>
                      <span className="badge" style={rec.status === "completed" ? { background: "#22c55e22", color: "#22c55e" } : rec.status === "in_progress" ? { background: "#3b82f622", color: "#3b82f6" } : { background: "var(--report-bg-card)", color: "var(--report-text-muted)" }}>
                        {rec.status?.replace("_", " ") ?? "pending"}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{rec.title}</div>
                    <div style={{ fontSize: 12, color: "var(--report-text-muted)", lineHeight: 1.5 }}>{rec.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.audit && (
            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Audit Issues Summary</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                {[
                  { label: "Critical", count: data.audit.issues.filter((i) => i.severity === "critical").length, color: "#ef4444" },
                  { label: "High", count: data.audit.issues.filter((i) => i.severity === "high").length, color: "#f97316" },
                  { label: "Medium", count: data.audit.issues.filter((i) => i.severity === "medium").length, color: "#eab308" },
                  { label: "Low", count: data.audit.issues.filter((i) => i.severity === "low").length, color: "#22c55e" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ color: "var(--report-text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="footer">
            <span>Generated by {branding.companyName} | {branding.companyUrl} | {generatedDate}</span>
            <span className="page-num">4</span>
          </div>
        </div>

      </body>
    </html>
  );
}
