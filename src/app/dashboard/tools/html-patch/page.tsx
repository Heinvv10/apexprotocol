"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Download, Copy, Check, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CodemodChange {
  kind: string;
  summary: string;
  before: string;
  after: string;
}
interface PatchResult {
  url: string | null;
  sourceBytes: number;
  patchedBytes: number;
  patched: string;
  changes: CodemodChange[];
  estimatedLift: number;
  metricsImpacted: Array<"LCP" | "FCP" | "TBT" | "CLS" | "SI">;
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className="gap-1.5 h-7 text-xs"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : label}
    </Button>
  );
}

const KIND_LABEL: Record<string, { label: string; tone: string }> = {
  defer_script: { label: "Defer script", tone: "text-primary bg-primary/10" },
  lazy_load_image: { label: "Lazy-load", tone: "text-success bg-success/10" },
  image_dimensions: { label: "Dimensions", tone: "text-success bg-success/10" },
  preconnect_fonts: { label: "Preconnect", tone: "text-primary bg-primary/10" },
  fetchpriority_hero: { label: "Fetch priority", tone: "text-warning bg-warning/10" },
  async_third_party: { label: "Async", tone: "text-primary bg-primary/10" },
};

function HtmlPatcherInner() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") ?? "";
  const [mode, setMode] = React.useState<"url" | "paste">("url");
  const [url, setUrl] = React.useState(initialUrl);
  const [rawHtml, setRawHtml] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PatchResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const body: { url?: string; html?: string } = {};
    if (mode === "url") {
      let target = url.trim();
      if (!target) {
        setError("Enter a URL.");
        setLoading(false);
        return;
      }
      if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
      body.url = target;
    } else {
      if (!rawHtml.trim()) {
        setError("Paste some HTML to patch.");
        setLoading(false);
        return;
      }
      body.html = rawHtml;
    }

    try {
      const res = await fetch("/api/tools/html-patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (HTTP ${res.status})`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.patched], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const basename = result.url
      ? new URL(result.url).hostname + "-index.html"
      : "patched.html";
    a.download = basename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold">HTML Auto-Patcher</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Applies safe performance fixes to your page&apos;s HTML: defers non-critical
          scripts, lazy-loads below-fold images, adds width/height to prevent layout
          shift, preconnects to font CDNs, and marks the hero image as high-priority.
          Preview the diff and download the patched file — deploy when you&apos;re ready.
        </p>
      </div>

      <form onSubmit={run} className="card-secondary p-5 space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={mode === "url"}
              onChange={() => setMode("url")}
              className="cursor-pointer"
            />
            Fetch by URL
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={mode === "paste"}
              onChange={() => setMode("paste")}
              className="cursor-pointer"
            />
            Paste HTML
          </label>
        </div>

        {mode === "url" ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoComplete="url"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              HTML source (paste your full page)
            </label>
            <textarea
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              placeholder="<!DOCTYPE html>&#10;<html>..."
              rows={10}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Patching…" : "Apply fixes"}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
      </form>

      {result && (
        <>
          <div className="card-secondary p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-medium">
                  {result.changes.length === 0
                    ? "No changes needed — page already optimized"
                    : `${result.changes.length} change${result.changes.length === 1 ? "" : "s"} applied`}
                </div>
                {result.url && (
                  <div className="text-xs text-muted-foreground truncate max-w-xl">
                    Source: {result.url}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {result.sourceBytes.toLocaleString()} → {result.patchedBytes.toLocaleString()} bytes
                  {result.estimatedLift > 0 && (
                    <>
                      {" · "}
                      <span className="text-success font-medium">
                        Est. +{result.estimatedLift} perf points
                      </span>
                    </>
                  )}
                </div>
              </div>
              {result.changes.length > 0 && (
                <div className="flex items-center gap-2">
                  <CopyBtn text={result.patched} label="Copy patched HTML" />
                  <Button onClick={download} className="gap-2" size="sm">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            {result.metricsImpacted.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Metrics affected:</span>
                {result.metricsImpacted.map((m) => (
                  <span
                    key={m}
                    className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            {result.changes.length === 0 && (
              <div className="rounded-md border border-success/30 bg-success/10 px-4 py-8 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-sm font-medium">
                  Nothing to patch — this page already has the common fixes in place.
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  For deeper optimization, run the PageSpeed Scanner and apply its
                  recommendations manually.
                </div>
              </div>
            )}
          </div>

          {result.changes.length > 0 && (
            <div className="card-secondary p-5 space-y-3">
              <div className="text-sm font-medium">Changes</div>
              <div className="space-y-2">
                {result.changes.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border/50 bg-muted/10 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          KIND_LABEL[c.kind]?.tone ?? "text-muted-foreground bg-muted/30"
                        }`}
                      >
                        {KIND_LABEL[c.kind]?.label ?? c.kind}
                      </span>
                      <span className="text-xs text-muted-foreground flex-1">{c.summary}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="rounded bg-error/10 border border-error/30 p-2 space-y-1">
                        <div className="text-[9px] uppercase text-error/80 font-semibold">Before</div>
                        <div className="break-all text-error">{c.before}</div>
                      </div>
                      <div className="rounded bg-success/10 border border-success/30 p-2 space-y-1">
                        <div className="text-[9px] uppercase text-success/80 font-semibold">After</div>
                        <div className="break-all text-success">{c.after}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.changes.length > 0 && (
            <div className="card-secondary p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Patched HTML preview</div>
                <CopyBtn text={result.patched} />
              </div>
              <pre className="rounded-md bg-muted/40 border border-border/50 p-3 text-[11px] overflow-x-auto leading-relaxed max-h-96">
                <code>{result.patched.slice(0, 8000)}{result.patched.length > 8000 ? `\n\n... (truncated — ${result.patched.length - 8000} more chars. Use Download / Copy for full file.)` : ""}</code>
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HtmlPatcherPage() {
  return (
    <React.Suspense fallback={<div className="max-w-6xl mx-auto p-6 text-sm text-muted-foreground">Loading…</div>}>
      <HtmlPatcherInner />
    </React.Suspense>
  );
}
