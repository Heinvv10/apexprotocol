"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  Sparkles,
  Copy,
  Check,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JobSnapshot {
  status: "discovering" | "fetching" | "completed" | "failed";
  rootUrl?: string;
  sitemapSource?: { kind: string; url: string };
  total?: number;
  done?: number;
  pageCount?: number;
  llmsTxt?: string;
  error?: string;
}

export default function LlmsTxtPage() {
  const [url, setUrl] = React.useState("");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<JobSnapshot | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

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
      const res = await fetch("/api/tools/llms-txt", {
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

  React.useEffect(() => {
    if (!jobId) return;
    if (snapshot?.status === "completed" || snapshot?.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/llms-txt?jobId=${encodeURIComponent(jobId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as JobSnapshot;
        setSnapshot(data);
        if (data.status === "completed" || data.status === "failed") clearInterval(t);
      } catch {
        /* transient — keep polling */
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

  const copyLlmsTxt = async () => {
    if (!snapshot?.llmsTxt) return;
    await navigator.clipboard.writeText(snapshot.llmsTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadUrl = jobId
    ? `/api/tools/llms-txt?jobId=${encodeURIComponent(jobId)}&download=1`
    : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/dashboard/competitive/roadmap"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to roadmap
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold">llms.txt Generator</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Crawls your site and builds an <code className="text-xs">llms.txt</code> file
          following the{" "}
          <a
            href="https://llmstxt.org"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            llmstxt.org
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          structure — a signal AI crawlers (ChatGPT, Claude, Perplexity) use to find
          the canonical pages worth indexing. Drop the result at the root of your site.
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
          <Button
            type="submit"
            disabled={loading || snapshot?.status === "fetching" || snapshot?.status === "discovering"}
            className="gap-2"
          >
            {loading || snapshot?.status === "discovering" || snapshot?.status === "fetching" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {snapshot?.status === "discovering"
              ? "Discovering pages…"
              : snapshot?.status === "fetching"
                ? `Reading ${snapshot.done ?? 0}/${snapshot.total ?? "?"}…`
                : loading
                  ? "Starting…"
                  : "Generate llms.txt"}
          </Button>
        </div>
        {error && (
          <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Up to 50 pages. Pages are grouped by URL prefix (docs, blog, features…) so the
          file stays readable. Fetches 4 pages at a time to finish in under a minute.
        </div>
      </form>

      {snapshot && snapshot.status !== "failed" && snapshot.status !== "completed" && (
        <div className="card-secondary p-5 space-y-3">
          <div className="text-sm font-medium">
            {snapshot.status === "discovering"
              ? "Discovering sitemap…"
              : `Reading page metadata — ${snapshot.done ?? 0} of ${snapshot.total ?? "?"}`}
          </div>
          {snapshot.sitemapSource && (
            <div className="text-xs text-muted-foreground">
              Source: {snapshot.sitemapSource.kind} · {snapshot.sitemapSource.url}
            </div>
          )}
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {snapshot?.status === "failed" && (
        <div className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {snapshot.error ?? "Job failed"}
        </div>
      )}

      {snapshot?.status === "completed" && snapshot.llmsTxt && (
        <div className="card-secondary p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Your llms.txt
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {snapshot.pageCount ?? 0} pages indexed ·{" "}
                {snapshot.sitemapSource ? snapshot.sitemapSource.kind : "discovered"} ·{" "}
                {(snapshot.llmsTxt.length / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={copyLlmsTxt}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download llms.txt
                </a>
              )}
            </div>
          </div>

          <pre className="rounded-md border border-border/50 bg-muted/20 p-4 text-xs overflow-auto max-h-[520px] font-mono whitespace-pre-wrap">
            {snapshot.llmsTxt}
          </pre>

          <div className="text-xs text-muted-foreground">
            Upload this to the root of your site (e.g. <code>/llms.txt</code>) so it&apos;s
            served at <code>https://{new URL(snapshot.rootUrl ?? "https://example.com").hostname}/llms.txt</code>.
            AI crawlers will discover it automatically — no other setup required.
          </div>
        </div>
      )}
    </div>
  );
}
