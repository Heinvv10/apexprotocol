"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PlatformScoreCardProps {
  platform: string;
  baselineScore: number;
  enrichedScore: number;
  scoreDelta: number;
  baselineCitations: number;
  enrichedCitations: number;
  citationDelta: number;
  confidence: number;
  variantBScore?: number | null;
  variantBDelta?: number | null;
  status: string;
}

const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
  deepseek: "DeepSeek",
  copilot: "Copilot",
};

const platformIcons: Record<string, string> = {
  chatgpt: "🤖",
  claude: "🟣",
  gemini: "🔵",
  perplexity: "🔍",
  grok: "⚡",
  deepseek: "🌊",
  copilot: "🪟",
};

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
        <ArrowUp className="w-3 h-3" />+{delta.toFixed(1)}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-medium">
        <ArrowDown className="w-3 h-3" />{delta.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground text-xs font-medium">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

export function PlatformScoreCard({
  platform,
  baselineScore,
  enrichedScore,
  scoreDelta,
  baselineCitations,
  enrichedCitations,
  citationDelta,
  confidence,
  variantBScore,
  variantBDelta,
  status,
}: PlatformScoreCardProps) {
  const isFailed = status === "failed";

  return (
    <div className={`card-secondary space-y-3 ${isFailed ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platformIcons[platform] || "📱"}</span>
          <span className="font-medium text-sm">{platformLabels[platform] || platform}</span>
        </div>
        {isFailed ? (
          <span className="text-xs text-error">Failed</span>
        ) : (
          <DeltaBadge delta={scoreDelta} />
        )}
      </div>

      {isFailed ? (
        <p className="text-xs text-muted-foreground">Platform analysis failed</p>
      ) : (
        <>
          {/* Score comparison */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Baseline</div>
              <div className="text-lg font-bold">{baselineScore.toFixed(0)}</div>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Enriched</div>
              <div className="text-lg font-bold text-primary">{enrichedScore.toFixed(0)}</div>
            </div>
            {variantBScore != null && (
              <>
                <div className="text-muted-foreground">|</div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Variant B</div>
                  <div className="text-lg font-bold text-accent-purple">{variantBScore.toFixed(0)}</div>
                </div>
              </>
            )}
          </div>

          {/* Score progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Visibility Score</span>
              <span>{enrichedScore.toFixed(0)}/100</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
                style={{ width: `${Math.min(enrichedScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Citations */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Citations: {baselineCitations} → {enrichedCitations}</span>
            <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
