"use client";

import { useSimulation } from "@/hooks/useSimulation";
import { useSelectedBrand } from "@/stores";
import { PlatformScoreCard } from "./platform-score-card";
import { ABComparisonChart } from "./ab-comparison-chart";
import { ResponseViewer } from "./response-viewer";
import { ArrowUp, ArrowDown, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulationResultsProps {
  simulationId: string;
  onNewSimulation: () => void;
}

export function SimulationResults({ simulationId, onNewSimulation }: SimulationResultsProps) {
  const { data, isLoading } = useSimulation(simulationId);
  const selectedBrand = useSelectedBrand();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-secondary p-4 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { simulation, results, summary } = data;
  const isABTest = simulation.type === "ab_test";

  const deltaIcon =
    summary.avgScoreDelta > 0 ? (
      <ArrowUp className="w-5 h-5 text-success" />
    ) : summary.avgScoreDelta < 0 ? (
      <ArrowDown className="w-5 h-5 text-error" />
    ) : (
      <Minus className="w-5 h-5 text-muted-foreground" />
    );

  const deltaColor =
    summary.avgScoreDelta > 0
      ? "text-success"
      : summary.avgScoreDelta < 0
        ? "text-error"
        : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="card-primary space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Simulation Results</h3>
          <Button variant="outline" size="sm" onClick={onNewSimulation}>
            <RotateCcw className="w-4 h-4 mr-2" />
            New Simulation
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Avg Score Delta</div>
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${deltaColor}`}>
              {deltaIcon}
              {summary.avgScoreDelta > 0 ? "+" : ""}
              {summary.avgScoreDelta}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Platforms Analyzed</div>
            <div className="text-2xl font-bold">
              {summary.successfulPlatforms}/{summary.totalPlatforms}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Avg Confidence</div>
            <div className="text-2xl font-bold">
              {(summary.avgConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {isABTest && summary.abWinner && (
          <div className="text-center pt-2 border-t border-white/10">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                summary.abWinner === "a"
                  ? "bg-primary/10 text-primary"
                  : summary.abWinner === "b"
                    ? "bg-accent-purple/10 text-accent-purple"
                    : "bg-white/10 text-muted-foreground"
              }`}
            >
              {summary.abWinner === "tie"
                ? "A/B Test: Tie"
                : `Variant ${summary.abWinner.toUpperCase()} Wins`}
            </span>
          </div>
        )}

        {/* Query context */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
          <span className="font-medium">Query:</span> {simulation.query}
        </div>
      </div>

      {/* A/B Chart */}
      {isABTest && (
        <ABComparisonChart
          results={results.map((r: any) => ({
            platform: r.platform,
            scoreDelta: r.scoreDelta,
            variantBScoreDelta: r.variantBScoreDelta,
            status: r.status,
          }))}
          winner={summary.abWinner}
        />
      )}

      {/* Platform breakdown */}
      <div>
        <h4 className="font-medium text-sm mb-3">Platform Breakdown</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r: any) => (
            <PlatformScoreCard
              key={r.platform}
              platform={r.platform}
              baselineScore={r.baselineScore}
              enrichedScore={r.enrichedScore}
              scoreDelta={r.scoreDelta}
              baselineCitations={r.baselineCitations}
              enrichedCitations={r.enrichedCitations}
              citationDelta={r.citationDelta}
              confidence={r.confidence}
              variantBScore={r.variantBScore}
              variantBDelta={r.variantBScoreDelta}
              status={r.status}
            />
          ))}
        </div>
      </div>

      {/* Response viewer */}
      <div>
        <h4 className="font-medium text-sm mb-3">AI Responses</h4>
        <div className="space-y-2">
          {results
            .filter((r: any) => r.status === "success")
            .map((r: any) => (
              <ResponseViewer
                key={r.platform}
                platform={r.platform}
                baselineResponse={r.baselineResponse}
                enrichedResponse={r.enrichedResponse}
                brandName={selectedBrand?.name}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
