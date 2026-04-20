"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PageResult {
  url: string;
  status: "patched" | "skipped" | "fetch_failed" | "not_html";
  changeCount?: number;
  sourceBytes?: number;
  patchedBytes?: number;
}

interface JobSnapshot {
  status: "discovering" | "patching" | "completed" | "failed";
  rootUrl?: string;
  sitemapSource?: { kind: string; url: string };
  total?: number;
  done?: number;
  pages?: PageResult[];
  totalChanges?: number;
  zipBytes?: number;
  error?: string;
}

function StatusBadge({ status }: { status: PageResult["status"] }) {
  const map: Record<PageResult["status"], { label: string; cls: string }> = {
    patched: { label: "Patched", cls: "text-success bg-success/10 border-success/30" },
    skipped: { label: "Optimized", cls: "text-muted-foreground bg-muted/30 border-border/50" },
    fetch_failed: { label: "Fetch failed", cls: "text-error bg-error/10 border-error/30" },
    not_html: { label: "Not HTML", cls: "text-muted-foreground bg-muted/30 border-border/50" },
  };
  const m = map[status];
  return (
    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${m.cls}`}>
      {m.label}
    </span>
  );
}

export default function SitePatcherPage() {
  const [url, setUrl] = React.useState("");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<JobSnapshot | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSnapshot(null);
    setJobId(null);
    if (!url.trim()) {
      setError("Enter a site root URL.");
      return;
    }
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;

    setLoading(true);
    try {
      const res = await fetch("/api/tools/site-patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setJobId(data.jobId);
      setSnapshot({ status: data.status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // Poll every 2s while a job is active
  React.useEffect(() => {
    if (!jobId) return;
    if (snapshot?.status === "completed" || snapshot?.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/site-patch?jobId=${encodeURIComponent(jobId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as JobSnapshot;
        setSnapshot(data);
        if (data.status === "completed" || data.status === "failed") clearInterval(t);
      } catch {
        /* transient error — keep polling */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [jobId, snapshot?.status]);

  const progressPct = React.useMemo(() => {
    if (!snapshot) return 0;
    if (snapshot.status === "completed") return 100;
    if (snapshot.status === "discovering") return 5;
    if (snapshot.total && snapshot.done !== undefined) {
      return Math.round((snapshot.done / snapshot.total) * 100);
    }
    return 0;
  }, [snapshot]);

  const downloadUrl = jobId ? `/api/tools/site-patch?jobId=${encodeURIComponent(jobId)}&download=1` : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/dashboard/competitive/roadmap"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to roadmap
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold">Site-Wide Auto-Patcher</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Crawls your sitemap (up to 50 pages), applies the same safe perf fixes as the
          single-page patcher to each HTML page, and bundles everything into a single zip
          you can drop into your CMS or deploy target. Apex identifies the issues AND
          provides the solution.
        </p>
      </div>

      <form onSubmit={run} className="card-secondary p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Site root URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            autoComplete="url"
          />
        </div>
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading || snapshot?.status === "patching" || snapshot?.status === "discovering"} className="gap-2">
            {loading || snapshot?.status === "discovering" || snapshot?.status === "patching" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {snapshot?.status === "discovering"
              ? "Discovering pages…"
              : snapshot?.status === "patching"
                ? `Patching ${snapshot.done ?? 0}/${snapshot.total ?? "?"}…`
                : loading
                  ? "Starting…"
                  : "Patch this site"}
          </Button>
        </div>
        {error && (
          <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Runs up to 50 pages per job with polite throttling (~7 requests/sec). Pages
          that already have the fixes in place are counted as Optimized and not included
          in the zip — only pages we actually changed ship.
        </div>
      </form>

      {snapshot && snapshot.status !== "failed" && (
        <div className="card-secondary p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">
                {snapshot.status === "discovering"
                  ? "Discovering sitemap…"
                  : snapshot.status === "patching"
                    ? `Patching pages — ${snapshot.done ?? 0} of ${snapshot.total ?? "?"}`
                    : "Complete"}
              </div>
              {snapshot.sitemapSource && (
                <div className="text-xs text-muted-foreground">
                  Source: {snapshot.sitemapSource.kind} · {snapshot.sitemapSource.url}
                </div>
              )}
            </div>
            {snapshot.status === "completed" && downloadUrl && (
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download zip
                {snapshot.zipBytes && (
                  <span className="opacity-80">
                    ({Math.round(snapshot.zipBytes / 1024)} KB)
                  </span>
                )}
              </a>
            )}
          </div>

          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {snapshot.status === "completed" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Patched"
                value={snapshot.pages?.filter((p) => p.status === "patched").length ?? 0}
                tone="success"
              />
              <StatCard
                label="Already optimized"
                value={snapshot.pages?.filter((p) => p.status === "skipped").length ?? 0}
                tone="muted"
              />
              <StatCard
                label="Fetch failed"
                value={snapshot.pages?.filter((p) => p.status === "fetch_failed").length ?? 0}
                tone="error"
              />
              <StatCard
                label="Total changes"
                value={snapshot.totalChanges ?? 0}
                tone="primary"
              />
            </div>
          )}
        </div>
      )}

      {snapshot?.status === "failed" && (
        <div className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <XCircle className="h-4 w-4 inline mr-2 -mt-0.5" />
          {snapshot.error ?? "Job failed"}
        </div>
      )}

      {snapshot?.pages && snapshot.pages.length > 0 && (
        <div className="card-secondary p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium">
              Per-page results ({snapshot.pages.length})
            </div>
          </div>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    <th className="text-left font-semibold px-3 py-2">URL</th>
                    <th className="text-left font-semibold px-3 py-2 w-28">Status</th>
                    <th className="text-right font-semibold px-3 py-2 w-20">Changes</th>
                    <th className="text-right font-semibold px-3 py-2 w-24">Bytes</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.pages.map((p, i) => (
                    <tr key={i} className="border-t border-border/30">
                      <td className="px-3 py-1.5 truncate max-w-md font-mono text-[11px]">{p.url}</td>
                      <td className="px-3 py-1.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {p.changeCount ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                        {p.patchedBytes ? `${Math.round(p.patchedBytes / 1024)}K` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {snapshot.status === "completed" && (
            <div className="text-xs text-muted-foreground">
              The zip includes a <code>_summary.csv</code> and <code>_README.txt</code>
              alongside the patched HTML files.
            </div>
          )}
        </div>
      )}

      {snapshot?.status === "completed" && snapshot.pages?.every((p) => p.status !== "patched") && (
        <div className="rounded-md border border-success/30 bg-success/10 px-4 py-4 text-sm text-success flex items-start gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Nothing to patch — site already optimized</div>
            <div className="text-xs text-success/80 mt-1">
              All discovered pages already have defers, lazy-loading, and width/height
              attributes in place. Run PageSpeed Scanner for deeper improvements.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "success" | "primary" | "error" | "muted" }) {
  const cls =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "error"
        ? "border-error/30 bg-error/10 text-error"
        : tone === "primary"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border/50 bg-muted/20 text-foreground";
  return (
    <div className={`rounded-lg border p-3 space-y-1 ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
