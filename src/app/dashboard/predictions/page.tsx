"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  Brain,
  Lightbulb,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { useSelectedBrand } from "@/stores";

type Trend = "up" | "down" | "stable";
type Priority = "critical" | "high" | "medium" | "low";

interface PredictionsSummary {
  brandId: string;
  visibilityForecast: {
    available: boolean;
    currentScore?: number;
    predictedScore?: number;
    deltaPercent?: number;
    trend?: Trend;
    confidence?: number;
    horizonDays?: number;
    lastUpdated?: string;
  };
  mentionOpportunity: {
    available: boolean;
    level?: "high" | "medium" | "low";
    recentInsights?: number;
    platforms?: string[];
    note?: string;
  };
  competitorGap: {
    available: boolean;
    topicCount?: number;
    competitorCount?: number;
    topCompetitor?: string;
  };
  recommendedAction: {
    available: boolean;
    recommendationId?: string;
    title?: string;
    description?: string;
    priority?: Priority;
    category?: string;
  };
}

function usePredictionsSummary(brandId: string | undefined) {
  return useQuery({
    queryKey: ["predictions-summary", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<PredictionsSummary> => {
      const res = await fetch(`/api/predictions/summary?brandId=${brandId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

function PriorityPill({ priority }: { priority: Priority }) {
  const map: Record<Priority, { label: string; cls: string }> = {
    critical: { label: "Critical", cls: "bg-error/10 text-error border-error/30" },
    high: { label: "High", cls: "bg-warning/10 text-warning border-warning/30" },
    medium: { label: "Medium", cls: "bg-primary/10 text-primary border-primary/30" },
    low: { label: "Low", cls: "bg-muted/30 text-muted-foreground border-border" },
  };
  const { label, cls } = map[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: Trend | undefined }) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-success" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-error" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

interface CardShellProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

function CardShell({ icon: Icon, title, children }: CardShellProps) {
  return (
    <div className="card-secondary p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
  );
}

function VisibilityCard({ data }: { data: PredictionsSummary["visibilityForecast"] }) {
  if (!data.available) {
    return (
      <CardShell icon={TrendingUp} title="Visibility Score Forecast">
        <EmptyRow message="No forecast yet — run an audit and wait for the next scoring cycle. Forecasts appear after ~30 days of score history." />
      </CardShell>
    );
  }
  const delta = data.deltaPercent ?? 0;
  const sign = delta > 0 ? "+" : "";
  const color =
    data.trend === "up" ? "text-success" : data.trend === "down" ? "text-error" : "text-muted-foreground";
  return (
    <CardShell icon={TrendingUp} title="Visibility Score Forecast">
      <div className="flex items-center justify-between">
        <div className={`text-2xl font-bold ${color}`}>
          {sign}
          {delta.toFixed(1)}%
        </div>
        <TrendIcon trend={data.trend} />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {data.currentScore != null ? (
          <>
            Predicted score <strong className="text-foreground">{data.predictedScore}</strong>{" "}
            over the next <strong className="text-foreground">{data.horizonDays}</strong> days
            (currently {data.currentScore}).
          </>
        ) : (
          <>
            Predicted score{" "}
            <strong className="text-foreground">{data.predictedScore}</strong> over the next{" "}
            <strong className="text-foreground">{data.horizonDays}</strong> days.
          </>
        )}{" "}
        Model confidence {data.confidence}%.
      </p>
    </CardShell>
  );
}

function MentionCard({ data }: { data: PredictionsSummary["mentionOpportunity"] }) {
  if (!data.available) {
    return (
      <CardShell icon={Brain} title="AI Mention Opportunity">
        <EmptyRow
          message={
            data.note ??
            "No platform monitoring data yet. Start a platform query from the Insights page to begin collecting mention signals."
          }
        />
      </CardShell>
    );
  }
  const levelColor =
    data.level === "high" ? "text-success" : data.level === "medium" ? "text-primary" : "text-muted-foreground";
  return (
    <CardShell icon={Brain} title="AI Mention Opportunity">
      <div className={`text-2xl font-bold capitalize ${levelColor}`}>{data.level}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">{data.recentInsights}</strong> platform insights
        captured in the last 14 days across{" "}
        <strong className="text-foreground">{data.platforms?.length ?? 0}</strong> platforms.
      </p>
    </CardShell>
  );
}

function CompetitorCard({ data }: { data: PredictionsSummary["competitorGap"] }) {
  if (!data.available) {
    return (
      <CardShell icon={Target} title="Competitor Gap">
        <EmptyRow message="No competitor gaps detected yet. Add competitors on the brand page or run discovery from Competitive Intelligence." />
      </CardShell>
    );
  }
  const topicText = data.topicCount === 1 ? "topic" : "topics";
  return (
    <CardShell icon={Target} title="Competitor Gap">
      <div className="text-2xl font-bold text-accent-purple">
        {data.topicCount} {topicText}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Gaps where your competitors are visible but you aren&apos;t. Tracking{" "}
        <strong className="text-foreground">{data.competitorCount}</strong> competitors
        {data.topCompetitor ? (
          <>
            ; closest rival:{" "}
            <strong className="text-foreground">{data.topCompetitor}</strong>.
          </>
        ) : (
          "."
        )}
      </p>
    </CardShell>
  );
}

function RecommendationCard({ data }: { data: PredictionsSummary["recommendedAction"] }) {
  if (!data.available) {
    return (
      <CardShell icon={Lightbulb} title="Recommended Action">
        <EmptyRow message="No open recommendations. Completing an audit will surface prioritized actions here." />
      </CardShell>
    );
  }
  return (
    <CardShell icon={Lightbulb} title="Recommended Action">
      <div className="flex items-start justify-between gap-2">
        <div className="text-base font-semibold text-foreground leading-snug">
          {data.title}
        </div>
        {data.priority && <PriorityPill priority={data.priority} />}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {data.description}
      </p>
      <Link
        href={`/dashboard/recommendations?focus=${data.recommendationId}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Open recommendation
        <ArrowRight className="w-3 h-3" />
      </Link>
    </CardShell>
  );
}

export default function PredictionsPage() {
  const selectedBrand = useSelectedBrand();
  const { data, isLoading, error } = usePredictionsSummary(selectedBrand?.id);

  return (
    <div className="space-y-6">
      <BrandHeader pageName="Predictions" />
      <div>
        <p className="text-muted-foreground text-sm">
          AI-powered forecasts and recommendations, grounded in your brand&apos;s
          real audit history, competitor data, and platform insights.
        </p>
      </div>

      {!selectedBrand && (
        <div className="card-tertiary p-6 text-center border-dashed">
          <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Select a brand from the header dropdown to see predictions.
          </p>
        </div>
      )}

      {selectedBrand && isLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading predictions for {selectedBrand.name}…
        </div>
      )}

      {selectedBrand && error && (
        <div className="card-tertiary p-6 border border-error/30 bg-error/5">
          <p className="text-sm text-error">
            Couldn&apos;t load predictions: {(error as Error).message}
          </p>
        </div>
      )}

      {selectedBrand && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VisibilityCard data={data.visibilityForecast} />
            <MentionCard data={data.mentionOpportunity} />
            <CompetitorCard data={data.competitorGap} />
            <RecommendationCard data={data.recommendedAction} />
          </div>

          <div className="card-tertiary p-6 text-center border-dashed">
            <Zap className="w-6 h-6 text-primary mx-auto mb-3 opacity-70" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Predictions refresh every 24 hours. Visibility forecasts draw from{" "}
              <Link href="/dashboard/audit" className="text-primary hover:underline">
                audit history
              </Link>
              . Mention opportunities need running{" "}
              <Link href="/dashboard/insights" className="text-primary hover:underline">
                platform queries
              </Link>{" "}
              to get denser.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
