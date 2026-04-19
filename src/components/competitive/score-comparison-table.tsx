"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreBadge, getScoreColor } from "./score-badge";

interface ScoreData {
  geoScore: number;
  seoScore: number;
  aeoScore: number;
  smoScore: number;
  ppoScore: number;
  unifiedScore: number;
}

interface ScoreComparisonTableProps {
  brandName: string;
  brandScores: ScoreData;
  competitors: Array<{
    name: string;
    domain?: string;
    scores: ScoreData;
  }>;
  className?: string;
}

// Score categories with descriptions
const SCORE_CATEGORIES = [
  { key: "geoScore", label: "GEO", description: "Generative Engine Optimization" },
  { key: "seoScore", label: "SEO", description: "Search Engine Optimization" },
  { key: "aeoScore", label: "AEO", description: "Answer Engine Optimization" },
  { key: "smoScore", label: "SMO", description: "Social Media Optimization" },
  { key: "ppoScore", label: "PPO", description: "Personal/People Optimization" },
  { key: "unifiedScore", label: "Overall", description: "Weighted unified score" },
] as const;

// Delta indicator
function DeltaIndicator({ delta }: { delta: number }) {
  if (delta > 5) {
    return (
      <span className="inline-flex items-center text-success text-xs font-medium">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        +{delta}
      </span>
    );
  }
  if (delta < -5) {
    return (
      <span className="inline-flex items-center text-error text-xs font-medium">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-muted-foreground text-xs font-medium">
      <Minus className="w-3 h-3 mr-0.5" />
      {delta >= 0 ? "+" : ""}{delta}
    </span>
  );
}

// Score cell
function ScoreCell({
  score,
  brandScore,
  showDelta = true,
}: {
  score: number;
  brandScore: number;
  showDelta?: boolean;
}) {
  const delta = score - brandScore;
  const { text } = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn("font-semibold", text)}>{score}</span>
      {showDelta && <DeltaIndicator delta={delta} />}
    </div>
  );
}

// Expandable row component
function CompetitorRow({
  competitor,
  brandScores,
  isExpanded,
  onToggle,
}: {
  competitor: { name: string; domain?: string; scores: ScoreData };
  brandScores: ScoreData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const overallDelta = competitor.scores.unifiedScore - brandScores.unifiedScore;

  return (
    <>
      <tr
        className="border-b border-border/20 hover:bg-white/5 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">
                {competitor.name}
              </span>
              {competitor.domain && (
                <span className="text-xs text-muted-foreground ml-2">
                  {competitor.domain}
                </span>
              )}
            </div>
          </div>
        </td>
        {SCORE_CATEGORIES.map(({ key }) => (
          <td key={key} className="py-3 px-2 text-center">
            <ScoreCell
              score={competitor.scores[key as keyof ScoreData]}
              brandScore={brandScores[key as keyof ScoreData]}
            />
          </td>
        ))}
      </tr>

      {/* Expanded details */}
      {isExpanded && (
        <tr className="bg-muted/10">
          <td colSpan={7} className="py-4 px-4">
            <div className="grid grid-cols-5 gap-4">
              {SCORE_CATEGORIES.slice(0, 5).map(({ key, label, description }) => {
                const competitorScore = competitor.scores[key as keyof ScoreData];
                const brandScore = brandScores[key as keyof ScoreData];
                const delta = competitorScore - brandScore;

                return (
                  <div key={key} className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {label}
                      <span className="block text-[10px] opacity-70">
                        {description}
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                      {/* Brand bar */}
                      <div
                        className="absolute h-full bg-primary/50 rounded-full"
                        style={{ width: `${brandScore}%` }}
                      />
                      {/* Competitor bar */}
                      <div
                        className="absolute h-full bg-purple-500/70 rounded-full"
                        style={{ width: `${competitorScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-primary">You: {brandScore}</span>
                      <span className="text-purple-400">
                        Them: {competitorScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ScoreComparisonTable({
  brandName,
  brandScores,
  competitors,
  className,
}: ScoreComparisonTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = (name: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Competitor
              </th>
              {SCORE_CATEGORIES.map(({ label }) => (
                <th
                  key={label}
                  className="py-3 px-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  {label}
                </th>
              ))}
            </tr>
            {/* Brand row (reference) */}
            <tr className="bg-primary/5 border-b border-border/30">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {brandName}
                  </span>
                  <span className="text-xs text-muted-foreground">(You)</span>
                </div>
              </td>
              {SCORE_CATEGORIES.map(({ key }) => (
                <td key={key} className="py-3 px-2 text-center">
                  <span className="font-semibold text-primary">
                    {brandScores[key as keyof ScoreData]}
                  </span>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor) => (
              <CompetitorRow
                key={competitor.name}
                competitor={competitor}
                brandScores={brandScores}
                isExpanded={expandedRows.has(competitor.name)}
                onToggle={() => toggleRow(competitor.name)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border/30 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-success" />
          <span>Competitor ahead</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="w-3 h-3" />
          <span>Competitive (within 5 pts)</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-error" />
          <span>You&apos;re ahead</span>
        </div>
      </div>
    </div>
  );
}
