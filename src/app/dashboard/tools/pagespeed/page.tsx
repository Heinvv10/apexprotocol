"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ExternalLink, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PsiResult {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
  responseTime?: number;
}

interface Verdict {
  label: "Good" | "Needs improvement" | "Poor";
  tone: "good" | "warn" | "bad";
  description: string;
}

/**
 * Core Web Vitals thresholds per https://web.dev/articles/vitals
 * (good / needs improvement / poor). Mobile values are the ones Google
 * uses for search ranking, so we default to mobile strategy.
 */
const THRESHOLDS = {
  lcp: { good: 2500, ni: 4000 }, // ms
  tbt: { good: 200, ni: 600 }, // ms — lab proxy for INP
  cls: { good: 0.1, ni: 0.25 }, // unitless
  fcp: { good: 1800, ni: 3000 }, // ms
  si: { good: 3400, ni: 5800 }, // ms
} as const;

function verdictFor(metric: keyof typeof THRESHOLDS, value: number): Verdict {
  const t = THRESHOLDS[metric];
  if (value <= t.good) {
    return { label: "Good", tone: "good", description: "Passes Google's threshold." };
  }
  if (value <= t.ni) {
    return {
      label: "Needs improvement",
      tone: "warn",
      description: "Above Google's 'good' threshold but below 'poor'.",
    };
  }
  return {
    label: "Poor",
    tone: "bad",
    description: "Above Google's 'poor' threshold. Fix this first.",
  };
}

function toneClass(tone: Verdict["tone"]): string {
  if (tone === "good") return "text-success border-success/30 bg-success/10";
  if (tone === "warn") return "text-warning border-warning/30 bg-warning/10";
  return "text-error border-error/30 bg-error/10";
}

function VerdictIcon({ tone }: { tone: Verdict["tone"] }) {
  if (tone === "good") return <CheckCircle className="h-4 w-4" />;
  if (tone === "warn") return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

interface MetricProps {
  label: string;
  subtitle: string;
  value: string;
  verdict: Verdict;
}

function Metric({ label, subtitle, value, verdict }: MetricProps) {
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${toneClass(verdict.tone)}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</div>
        <VerdictIcon tone={verdict.tone} />
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-80">{subtitle}</div>
      <div className="text-xs font-medium">{verdict.label}</div>
    </div>
  );
}

interface Recommendation {
  metric: string;
  title: string;
  details: string;
}

function recommendations(result: PsiResult): Recommendation[] {
  const out: Recommendation[] = [];
  const lcp = verdictFor("lcp", result.largestContentfulPaint);
  const tbt = verdictFor("tbt", result.totalBlockingTime);
  const cls = verdictFor("cls", result.cumulativeLayoutShift);
  const fcp = verdictFor("fcp", result.firstContentfulPaint);

  if (lcp.tone !== "good") {
    out.push({
      metric: "LCP",
      title: "Speed up the largest content paint",
      details:
        "Optimize the hero image: convert to WebP/AVIF, right-size with srcset, add fetchpriority=\"high\". Preload the hero font. Move any render-blocking CSS above the fold inline.",
    });
  }
  if (tbt.tone !== "good") {
    out.push({
      metric: "TBT / INP",
      title: "Reduce JavaScript blocking time",
      details:
        "Add defer to non-critical scripts (analytics, chat). Defer 3rd-party tags until user interaction. Use PSI's \"Reduce unused JavaScript\" list and tree-shake.",
    });
  }
  if (cls.tone !== "good") {
    out.push({
      metric: "CLS",
      title: "Stop the page from shifting",
      details:
        "Add width + height attributes to every <img> and <iframe>. Reserve space for ads, embeds, and late-loaded content. Avoid inserting DOM above existing content.",
    });
  }
  if (fcp.tone !== "good") {
    out.push({
      metric: "FCP",
      title: "Render initial content faster",
      details:
        "Move critical CSS inline. Preconnect to required origins (fonts, CDN). Reduce server response time — the fastest content paint is gated by TTFB.",
    });
  }
  if (out.length === 0) {
    out.push({
      metric: "All",
      title: "All Core Web Vitals pass",
      details:
        "This URL passes every threshold Google uses for ranking. Re-measure in 28 days to confirm field data (Chrome UX Report) agrees.",
    });
  }
  return out;
}

export default function PageSpeedToolPage() {
  const [url, setUrl] = React.useState("");
  const [strategy, setStrategy] = React.useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PsiResult | null>(null);
  const [scannedUrl, setScannedUrl] = React.useState<string | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!url.trim()) {
      setError("Enter a URL to scan.");
      return;
    }
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;

    setLoading(true);
    try {
      // Start the scan — returns jobId immediately (Cloudflare's 30s
      // request timeout would kill a synchronous PSI call).
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

      // Poll every 3s for up to 2 minutes.
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await fetch(`/api/tools/pagespeed?jobId=${encodeURIComponent(jobId)}`);
        if (!poll.ok) {
          setError(`Poll failed (HTTP ${poll.status})`);
          return;
        }
        const data = await poll.json();
        if (data.status === "completed") {
          setResult(data.result);
          setScannedUrl(data.url);
          return;
        }
        if (data.status === "failed") {
          setError(data.error ?? "Scan failed.");
          return;
        }
        // else: still running, keep polling
      }
      setError("Scan is taking longer than expected. Try again or use the external PageSpeed Insights link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/dashboard/competitive/roadmap"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to roadmap
        </Link>
        <h1 className="text-2xl font-semibold">PageSpeed Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Runs Google PageSpeed Insights against any URL and reports the Core Web Vitals with
          prioritized fixes. Mobile is the strategy Google uses for ranking — default to that.
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
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
            {loading ? "Scanning…" : "Run scan"}
          </Button>
        </div>
        {error && (
          <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Scans can take 15–45 seconds. PSI is rate-limited (~25 scans / 100s unless
          GOOGLE_PAGESPEED_API_KEY is set).
        </div>
      </form>

      {result && (
        <>
          <div className="card-secondary p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Results — {scannedUrl}</div>
                <div className="text-xs text-muted-foreground">
                  Strategy: {strategy}
                </div>
              </div>
              <a
                href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(scannedUrl ?? "")}&form_factor=${strategy}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open in PageSpeed Insights <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Metric
                label="LCP"
                subtitle="Largest Contentful Paint"
                value={`${(result.largestContentfulPaint / 1000).toFixed(1)}s`}
                verdict={verdictFor("lcp", result.largestContentfulPaint)}
              />
              <Metric
                label="TBT"
                subtitle="Total Blocking Time (INP proxy)"
                value={`${result.totalBlockingTime}ms`}
                verdict={verdictFor("tbt", result.totalBlockingTime)}
              />
              <Metric
                label="CLS"
                subtitle="Cumulative Layout Shift"
                value={result.cumulativeLayoutShift.toFixed(3)}
                verdict={verdictFor("cls", result.cumulativeLayoutShift)}
              />
              <Metric
                label="FCP"
                subtitle="First Contentful Paint"
                value={`${(result.firstContentfulPaint / 1000).toFixed(1)}s`}
                verdict={verdictFor("fcp", result.firstContentfulPaint)}
              />
              <Metric
                label="SI"
                subtitle="Speed Index"
                value={`${(result.speedIndex / 1000).toFixed(1)}s`}
                verdict={verdictFor("si", result.speedIndex)}
              />
              {result.responseTime !== undefined && result.responseTime > 0 && (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    TTFB
                  </div>
                  <div className="text-3xl font-bold tabular-nums">
                    {result.responseTime}ms
                  </div>
                  <div className="text-xs text-muted-foreground">Time to First Byte</div>
                </div>
              )}
            </div>
          </div>

          <div className="card-secondary p-5 space-y-3">
            <div className="text-sm font-medium">Prioritized fixes</div>
            <div className="space-y-3">
              {recommendations(result).map((rec, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/50 p-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {rec.metric}
                    </span>
                    <span className="text-sm font-medium">{rec.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed pl-1">
                    {rec.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
