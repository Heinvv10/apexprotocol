"use client";

/**
 * Client-Facing Simplified Dashboard (Phase 4.2)
 *
 * Read-only summary view for end-client viewers. Respects org branding and
 * shows only the essentials: headline score, trend, open recs, recent wins.
 * Route-level auth/role enforcement should happen in middleware based on the
 * `viewer` role.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelectedBrand } from "@/stores";

interface ClientSummary {
  geoScore: number | null;
  geoScoreChange: number | null;
  trendDirection: "up" | "down" | "flat";
  mentionCount: number;
  citationCount: number;
  positiveSentimentPct: number;
  openCriticalRecs: number;
  openHighRecs: number;
  totalRecs: number;
  completedRecs: number;
  recentWins: Array<{ title: string; completedAt: string }>;
  topRecommendations: Array<{
    id: string;
    title: string;
    priority: "critical" | "high" | "medium" | "low";
    impact: "high" | "medium" | "low";
  }>;
  lastUpdated: string;
}

function fetchClientSummary(brandId: string): Promise<ClientSummary> {
  return fetch(`/api/client/summary?brandId=${encodeURIComponent(brandId)}`, {
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { summary: ClientSummary };
    return data.summary;
  });
}

export default function ClientDashboardPage() {
  const brand = useSelectedBrand();
  const [summary, setSummary] = React.useState<ClientSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!brand?.id) return;
    setError(null);
    try {
      const data = await fetchClientSummary(brand.id);
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, [brand?.id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!brand?.id) {
    return (
      <div className="min-h-screen bg-background">
        <BrandHeader pageName="Client Dashboard" />
        <main className="container mx-auto py-10">
          <div className="card-primary p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Select a brand</h2>
            <p className="text-muted-foreground">Choose a brand to view your client report.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BrandHeader pageName="Client Dashboard" />
        <main className="container mx-auto py-10">
          <div className="card-primary p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background">
        <BrandHeader pageName="Client Dashboard" />
        <main className="container mx-auto py-10">
          <div className="card-primary p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
            <p className="text-muted-foreground mb-4">{error ?? "No data returned"}</p>
            <Button onClick={() => void load()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const trendIcon =
    summary.trendDirection === "up" ? (
      <TrendingUp className="w-5 h-5 text-green-400" />
    ) : summary.trendDirection === "down" ? (
      <TrendingDown className="w-5 h-5 text-red-400" />
    ) : (
      <span className="w-5 h-5 text-muted-foreground">—</span>
    );

  const completionRate =
    summary.totalRecs > 0
      ? Math.round((summary.completedRecs / summary.totalRecs) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader pageName="Client Dashboard" />
      <main className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold">{brand.name} — Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated{" "}
            {new Date(summary.lastUpdated).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>

        <div className="card-primary p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Visibility Score
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl font-bold">
                  {summary.geoScore ?? "—"}
                </div>
                {summary.geoScoreChange !== null && (
                  <div className="flex items-center gap-1 text-sm">
                    {trendIcon}
                    <span
                      className={
                        summary.geoScoreChange > 0
                          ? "text-green-400"
                          : summary.geoScoreChange < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }
                    >
                      {summary.geoScoreChange > 0 ? "+" : ""}
                      {summary.geoScoreChange} pts vs last period
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card-secondary p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              AI Mentions
            </div>
            <div className="text-3xl font-semibold">{summary.mentionCount}</div>
            <div className="text-xs text-muted-foreground mt-1">This period</div>
          </div>
          <div className="card-secondary p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Citations
            </div>
            <div className="text-3xl font-semibold">{summary.citationCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {summary.mentionCount > 0
                ? `${Math.round((summary.citationCount / summary.mentionCount) * 100)}% of mentions`
                : "No mentions yet"}
            </div>
          </div>
          <div className="card-secondary p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Positive Sentiment
            </div>
            <div className="text-3xl font-semibold">
              {summary.positiveSentimentPct}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Of scored mentions</div>
          </div>
        </div>

        <section className="card-primary p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Priorities</h2>
            <Link
              href="/dashboard/recommendations"
              className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-5 text-sm">
            {summary.openCriticalRecs > 0 && (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/40">
                {summary.openCriticalRecs} critical
              </Badge>
            )}
            {summary.openHighRecs > 0 && (
              <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/40">
                {summary.openHighRecs} high
              </Badge>
            )}
            <span className="text-muted-foreground">
              {completionRate}% complete ({summary.completedRecs}/{summary.totalRecs})
            </span>
          </div>

          {summary.topRecommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No open priorities. 👏
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.topRecommendations.slice(0, 5).map((r) => (
                <li
                  key={r.id}
                  className="card-tertiary p-3 flex items-center gap-3"
                >
                  <Badge
                    variant="outline"
                    className={
                      r.priority === "critical"
                        ? "border-red-500/40 text-red-400"
                        : r.priority === "high"
                          ? "border-orange-500/40 text-orange-400"
                          : "text-muted-foreground"
                    }
                  >
                    {r.priority}
                  </Badge>
                  <span className="flex-1 text-sm">{r.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {r.impact} impact
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {summary.recentWins.length > 0 && (
          <section className="card-secondary p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Recent Wins
            </h2>
            <ul className="space-y-2">
              {summary.recentWins.slice(0, 5).map((w, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="flex-1">{w.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
