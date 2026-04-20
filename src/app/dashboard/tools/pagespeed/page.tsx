"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryScore {
  score: number;
  title: string;
}
interface Opportunity {
  id: string;
  title: string;
  description: string;
  savingsMs?: number;
  score: number | null;
  numericValue?: number;
}
interface PageSpeedFullResult {
  url: string;
  strategy: "mobile" | "desktop";
  fetchedAt: string;
  categories: {
    performance: CategoryScore;
    accessibility: CategoryScore;
    bestPractices: CategoryScore;
    seo: CategoryScore;
  };
  metrics: {
    lcp: number;
    fcp: number;
    tbt: number;
    cls: number;
    speedIndex: number;
    ttfb: number;
  };
  finalScreenshot: string | null;
  opportunities: Opportunity[];
  diagnostics: Opportunity[];
  fieldData: {
    lcp?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
    fid?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
    cls?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
    inp?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
  } | null;
}

const METRIC_THRESHOLDS = {
  lcp: { good: 2500, ni: 4000 },
  tbt: { good: 200, ni: 600 },
  cls: { good: 0.1, ni: 0.25 },
  fcp: { good: 1800, ni: 3000 },
  si: { good: 3400, ni: 5800 },
} as const;

function metricVerdict(kind: keyof typeof METRIC_THRESHOLDS, value: number): "good" | "warn" | "bad" {
  const t = METRIC_THRESHOLDS[kind];
  if (value <= t.good) return "good";
  if (value <= t.ni) return "warn";
  return "bad";
}

function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 90) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

function toneColor(tone: "good" | "warn" | "bad"): { stroke: string; text: string; bg: string; border: string } {
  if (tone === "good")
    return {
      stroke: "hsl(var(--color-success))",
      text: "text-success",
      bg: "bg-success/10",
      border: "border-success/30",
    };
  if (tone === "warn")
    return {
      stroke: "hsl(var(--color-warning))",
      text: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/30",
    };
  return {
    stroke: "hsl(var(--color-error))",
    text: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
  };
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const tone = scoreTone(score);
  const c = toneColor(tone);
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted-foreground/20"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={c.stroke}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums ${c.text}`}>
          {score}
        </div>
      </div>
      <div className="text-xs font-medium text-center">{label}</div>
    </div>
  );
}

function MetricCard({
  label,
  subtitle,
  value,
  tone,
}: {
  label: string;
  subtitle: string;
  value: string;
  tone: "good" | "warn" | "bad";
}) {
  const c = toneColor(tone);
  const Icon = tone === "good" ? CheckCircle : tone === "warn" ? AlertTriangle : XCircle;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-3 space-y-1`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${c.text}`}>
          {label}
        </span>
        <Icon className={`h-3.5 w-3.5 ${c.text}`} />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] opacity-80">{subtitle}</div>
    </div>
  );
}

function formatSavings(ms?: number): string | null {
  if (ms === undefined || ms === null) return null;
  if (ms < 50) return null;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PageSpeedToolPage() {
  const [url, setUrl] = React.useState("");
  const [strategy, setStrategy] = React.useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PageSpeedFullResult | null>(null);
  const [progress, setProgress] = React.useState(0);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setProgress(0);
    if (!url.trim()) {
      setError("Enter a URL to scan.");
      return;
    }
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;

    setLoading(true);
    try {
      const kickoff = await fetch("/api/tools/pagespeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, strategy }),
      });
      if (!kickoff.ok) {
        const err = await kickoff.json().catch(() => ({}));
        setError(err.error ?? `Couldn't start scan (HTTP ${kickoff.status})`);
        return;
      }
      const { jobId } = (await kickoff.json()) as { jobId: string };

      const startedAt = Date.now();
      const deadline = startedAt + 120_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2500));
        const elapsed = Date.now() - startedAt;
        setProgress(Math.min(95, Math.round((elapsed / 60000) * 100)));

        const poll = await fetch(`/api/tools/pagespeed?jobId=${encodeURIComponent(jobId)}`);
        if (!poll.ok) {
          setError(`Poll failed (HTTP ${poll.status})`);
          return;
        }
        const data = await poll.json();
        if (data.status === "completed") {
          setProgress(100);
          setResult(data.result);
          return;
        }
        if (data.status === "failed") {
          setError(data.error ?? "Scan failed.");
          return;
        }
      }
      setError("Scan is taking longer than expected. Retry in a moment.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/dashboard/competitive/roadmap"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to roadmap
        </Link>
        <h1 className="text-2xl font-semibold">PageSpeed Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Runs Google&apos;s Lighthouse engine against any URL via the PageSpeed Insights API.
          Returns performance, accessibility, best-practices, and SEO scores with Core Web
          Vitals, a page screenshot, and prioritized fixes — no browsing away from Apex.
        </p>
      </div>

      <form onSubmit={run} className="card-secondary p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">URL to scan</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            autoComplete="url"
          />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={strategy === "mobile"}
                onChange={() => setStrategy("mobile")}
                className="cursor-pointer"
              />
              Mobile (ranking signal)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={strategy === "desktop"}
                onChange={() => setStrategy("desktop")}
                className="cursor-pointer"
              />
              Desktop
            </label>
          </div>
          <div className="flex-1" />
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? `Scanning… ${progress}%` : "Run scan"}
          </Button>
        </div>
        {loading && (
          <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && (
          <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Real sites take 30–60 seconds. Lab data is Lighthouse simulations; field data comes
          from Chrome UX Report (28-day rolling).
        </div>
      </form>

      {result && (
        <>
          {/* Header: URL + timestamp */}
          <div className="card-secondary p-5 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Report from {new Date(result.fetchedAt).toLocaleString()}</div>
                <div className="text-base font-medium truncate">{result.url}</div>
                <div className="text-xs text-muted-foreground capitalize">Strategy: {result.strategy}</div>
              </div>
            </div>

            {/* 4 category rings */}
            <div className="grid grid-cols-4 gap-4 pt-2">
              <ScoreRing score={result.categories.performance.score} label="Performance" />
              <ScoreRing score={result.categories.accessibility.score} label="Accessibility" />
              <ScoreRing score={result.categories.bestPractices.score} label="Best Practices" />
              <ScoreRing score={result.categories.seo.score} label="SEO" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 pt-2">
              {/* Screenshot */}
              {result.finalScreenshot ? (
                <div className="flex items-center justify-center bg-muted/20 rounded-lg border border-border/50 p-3">
                  <img
                    src={result.finalScreenshot}
                    alt="Final page paint"
                    className="max-h-[320px] w-auto rounded-md shadow-lg"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/50 p-8 text-center text-xs text-muted-foreground">
                  PSI didn&apos;t return a screenshot for this scan.
                </div>
              )}

              {/* Lab Metrics */}
              <div className="grid grid-cols-2 gap-2 min-w-[280px]">
                <MetricCard
                  label="LCP"
                  subtitle="Largest Contentful Paint"
                  value={`${(result.metrics.lcp / 1000).toFixed(1)}s`}
                  tone={metricVerdict("lcp", result.metrics.lcp)}
                />
                <MetricCard
                  label="TBT"
                  subtitle="Total Blocking Time"
                  value={`${result.metrics.tbt}ms`}
                  tone={metricVerdict("tbt", result.metrics.tbt)}
                />
                <MetricCard
                  label="CLS"
                  subtitle="Cumulative Layout Shift"
                  value={result.metrics.cls.toFixed(3)}
                  tone={metricVerdict("cls", result.metrics.cls)}
                />
                <MetricCard
                  label="FCP"
                  subtitle="First Contentful Paint"
                  value={`${(result.metrics.fcp / 1000).toFixed(1)}s`}
                  tone={metricVerdict("fcp", result.metrics.fcp)}
                />
                <MetricCard
                  label="SI"
                  subtitle="Speed Index"
                  value={`${(result.metrics.speedIndex / 1000).toFixed(1)}s`}
                  tone={metricVerdict("si", result.metrics.speedIndex)}
                />
                {result.metrics.ttfb > 0 && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      TTFB
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {result.metrics.ttfb}ms
                    </div>
                    <div className="text-[11px] opacity-70">Time to First Byte</div>
                  </div>
                )}
              </div>
            </div>

            {/* Field data (CrUX) if available */}
            {result.fieldData && (result.fieldData.lcp || result.fieldData.cls || result.fieldData.inp) && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Field data (real users, last 28 days)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {result.fieldData.lcp && (
                    <div>
                      <div className="text-xs text-muted-foreground">LCP p75</div>
                      <div className="font-semibold">
                        {(result.fieldData.lcp.p75 / 1000).toFixed(1)}s
                        <span className="text-xs text-muted-foreground ml-1">
                          · {result.fieldData.lcp.category}
                        </span>
                      </div>
                    </div>
                  )}
                  {result.fieldData.cls && (
                    <div>
                      <div className="text-xs text-muted-foreground">CLS p75</div>
                      <div className="font-semibold">
                        {(result.fieldData.cls.p75 / 100).toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-1">
                          · {result.fieldData.cls.category}
                        </span>
                      </div>
                    </div>
                  )}
                  {result.fieldData.inp && (
                    <div>
                      <div className="text-xs text-muted-foreground">INP p75</div>
                      <div className="font-semibold">
                        {result.fieldData.inp.p75}ms
                        <span className="text-xs text-muted-foreground ml-1">
                          · {result.fieldData.inp.category}
                        </span>
                      </div>
                    </div>
                  )}
                  {result.fieldData.fid && (
                    <div>
                      <div className="text-xs text-muted-foreground">FID p75</div>
                      <div className="font-semibold">
                        {result.fieldData.fid.p75}ms
                        <span className="text-xs text-muted-foreground ml-1">
                          · {result.fieldData.fid.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Field data is what Google uses for ranking — lab data is a simulation. If
                  field and lab disagree, field is the source of truth.
                </div>
              </div>
            )}
          </div>

          {/* Opportunities */}
          {result.opportunities.length > 0 && (
            <div className="card-secondary p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <div className="text-sm font-medium">
                  Opportunities ({result.opportunities.length})
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimated time savings when implemented
                </div>
              </div>
              <div className="space-y-2">
                {result.opportunities.map((o) => (
                  <OpportunityRow key={o.id} opp={o} />
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics */}
          {result.diagnostics.length > 0 && (
            <div className="card-secondary p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">
                  Diagnostics ({result.diagnostics.length})
                </div>
                <div className="text-xs text-muted-foreground">
                  Additional issues — no direct savings estimate
                </div>
              </div>
              <div className="space-y-2">
                {result.diagnostics.map((d) => (
                  <OpportunityRow key={d.id} opp={d} />
                ))}
              </div>
            </div>
          )}

          {result.opportunities.length === 0 && result.diagnostics.length === 0 && (
            <div className="card-secondary p-5 text-center">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-sm font-medium">All performance audits pass</div>
              <div className="text-xs text-muted-foreground mt-1">
                Nothing to fix — keep monitoring to catch regressions.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OpportunityRow({ opp }: { opp: Opportunity }) {
  const [open, setOpen] = React.useState(false);
  const savings = formatSavings(opp.savingsMs);
  return (
    <div className="rounded-md border border-border/50 bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{opp.title}</div>
        </div>
        {savings && (
          <span className="shrink-0 text-xs font-semibold text-warning px-2 py-0.5 rounded bg-warning/10">
            Save {savings}
          </span>
        )}
        <svg
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs text-muted-foreground border-t border-border/30 pt-2 leading-relaxed">
          {opp.description.replace(/\[.*?\]\(.*?\)/g, "").trim() ||
            "(No description provided by PSI for this audit.)"}
        </div>
      )}
    </div>
  );
}
