"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Copy, Check, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FieldReport {
  value: string;
  length: number;
  verdict: "good" | "warn" | "bad";
  issues: string[];
}

interface MetaReport {
  url: string;
  title: FieldReport;
  description: FieldReport;
  canonical: { value: string | null; issues: string[] };
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    issues: string[];
  };
  suggestions: {
    titleDraft: string;
    descriptionDraft: string;
  };
}

function toneClass(v: "good" | "warn" | "bad"): string {
  if (v === "good") return "text-success border-success/30 bg-success/10";
  if (v === "warn") return "text-warning border-warning/30 bg-warning/10";
  return "text-error border-error/30 bg-error/10";
}

function VerdictIcon({ v }: { v: "good" | "warn" | "bad" }) {
  if (v === "good") return <CheckCircle className="h-4 w-4" />;
  if (v === "warn") return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 h-7 text-xs">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function FieldCard({
  label,
  value,
  length,
  verdict,
  issues,
  idealRange,
}: {
  label: string;
  value: string;
  length: number;
  verdict: "good" | "warn" | "bad";
  issues: string[];
  idealRange: string;
}) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${toneClass(verdict)}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider">{label}</div>
        <VerdictIcon v={verdict} />
      </div>
      <div className="text-sm font-medium break-words min-h-[1.25rem]">
        {value || <span className="italic opacity-60">(empty)</span>}
      </div>
      <div className="text-xs opacity-80">
        {length} chars · ideal {idealRange}
      </div>
      {issues.length > 0 && (
        <ul className="text-xs opacity-90 space-y-1 pt-1 border-t border-current/20">
          {issues.map((i, idx) => (
            <li key={idx}>• {i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MetaTagsToolPage() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<MetaReport | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReport(null);
    if (!url.trim()) {
      setError("Enter a URL to scan.");
      return;
    }
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;

    setLoading(true);
    try {
      const res = await fetch("/api/tools/meta-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to analyze the page.");
        return;
      }
      setReport(data);
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
        <h1 className="text-2xl font-semibold">Meta Tag Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyzes a page&apos;s <code>&lt;title&gt;</code>, meta description, canonical, and
          Open Graph tags. Flags issues and drafts suggested replacements you can paste
          straight into your CMS.
        </p>
      </div>

      <form onSubmit={run} className="card-secondary p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">URL to scan</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/about"
            autoComplete="url"
          />
        </div>
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Scanning…" : "Scan meta tags"}
          </Button>
        </div>
        {error && (
          <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Fetches the page HTML directly — no headless browser, so SPA-rendered meta tags
          won&apos;t be visible. For client-rendered sites, check your page source.
        </div>
      </form>

      {report && (
        <>
          <div className="card-secondary p-5 space-y-3">
            <div className="text-sm font-medium">Current meta tags — {report.url}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldCard
                label="Title"
                value={report.title.value}
                length={report.title.length}
                verdict={report.title.verdict}
                issues={report.title.issues}
                idealRange="30–60 chars"
              />
              <FieldCard
                label="Meta description"
                value={report.description.value}
                length={report.description.length}
                verdict={report.description.verdict}
                issues={report.description.issues}
                idealRange="120–160 chars"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className={`rounded-lg border p-4 space-y-2 ${
                  report.canonical.value ? toneClass("good") : toneClass("warn")
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider">
                    Canonical URL
                  </div>
                  <VerdictIcon v={report.canonical.value ? "good" : "warn"} />
                </div>
                <div className="text-sm font-medium break-words min-h-[1.25rem]">
                  {report.canonical.value ?? (
                    <span className="italic opacity-60">(not set)</span>
                  )}
                </div>
                {report.canonical.issues.length > 0 && (
                  <ul className="text-xs opacity-90 space-y-1 pt-1 border-t border-current/20">
                    {report.canonical.issues.map((i, idx) => (
                      <li key={idx}>• {i}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className={`rounded-lg border p-4 space-y-2 ${
                  report.og.issues.length === 0
                    ? toneClass("good")
                    : report.og.issues.length <= 2
                      ? toneClass("warn")
                      : toneClass("bad")
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider">
                    Open Graph
                  </div>
                  <VerdictIcon
                    v={
                      report.og.issues.length === 0
                        ? "good"
                        : report.og.issues.length <= 2
                          ? "warn"
                          : "bad"
                    }
                  />
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    og:title:{" "}
                    {report.og.title ? (
                      <span className="opacity-90">✓</span>
                    ) : (
                      <span className="italic opacity-60">missing</span>
                    )}
                  </div>
                  <div>
                    og:description:{" "}
                    {report.og.description ? "✓" : <span className="italic opacity-60">missing</span>}
                  </div>
                  <div>
                    og:image:{" "}
                    {report.og.image ? "✓" : <span className="italic opacity-60">missing</span>}
                  </div>
                  <div>
                    og:type:{" "}
                    {report.og.type ?? <span className="italic opacity-60">missing</span>}
                  </div>
                </div>
                {report.og.issues.length > 0 && (
                  <ul className="text-xs opacity-90 space-y-1 pt-1 border-t border-current/20">
                    {report.og.issues.map((i, idx) => (
                      <li key={idx}>• {i}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="card-secondary p-5 space-y-4">
            <div className="text-sm font-medium">Suggested replacements</div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    New Title ({report.suggestions.titleDraft.length} chars)
                  </div>
                  <div className="text-sm mt-1 font-medium">
                    {report.suggestions.titleDraft}
                  </div>
                </div>
                <CopyButton text={report.suggestions.titleDraft} />
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    New Meta Description ({report.suggestions.descriptionDraft.length} chars)
                  </div>
                  <div className="text-sm mt-1 font-medium">
                    {report.suggestions.descriptionDraft}
                  </div>
                </div>
                <CopyButton text={report.suggestions.descriptionDraft} />
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              Drafts are rule-based — treat them as a starting point. Review for voice
              before shipping.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
