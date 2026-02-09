"use client";

import { useSimulationStatus } from "@/hooks/useSimulation";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useEffect } from "react";

const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
  deepseek: "DeepSeek",
  copilot: "Copilot",
};

interface SimulationProgressProps {
  simulationId: string;
  onComplete: () => void;
}

export function SimulationProgress({ simulationId, onComplete }: SimulationProgressProps) {
  const { data: status } = useSimulationStatus(simulationId);

  const isFinished =
    status?.status === "completed" ||
    status?.status === "failed" ||
    status?.status === "partial";

  useEffect(() => {
    if (isFinished) {
      // Brief delay so user sees 100%
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFinished, onComplete]);

  const progress = status?.progress ?? 0;
  const completed = status?.platforms?.completed ?? [];
  const failed = status?.platforms?.failed ?? [];
  const pending = status?.platforms?.pending ?? [];

  return (
    <div className="space-y-6">
      <div className="card-primary text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {!isFinished && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
          <h3 className="text-lg font-semibold">
            {isFinished ? "Simulation Complete" : "Running Simulation..."}
          </h3>
        </div>

        <Progress value={progress} className="h-2" />

        <p className="text-sm text-muted-foreground">
          {progress}% complete
          {!isFinished && " - Querying AI platforms with your content"}
        </p>
      </div>

      {/* Per-platform status */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {completed.map((p: string) => (
          <div key={p} className="card-tertiary flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span className="text-sm">{platformLabels[p] || p}</span>
            <span className="ml-auto text-xs text-success">Done</span>
          </div>
        ))}
        {failed.map((p: string) => (
          <div key={p} className="card-tertiary flex items-center gap-3">
            <XCircle className="w-4 h-4 text-error shrink-0" />
            <span className="text-sm">{platformLabels[p] || p}</span>
            <span className="ml-auto text-xs text-error">Failed</span>
          </div>
        ))}
        {pending.map((p: string) => (
          <div key={p} className="card-tertiary flex items-center gap-3">
            {!isFinished ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm text-muted-foreground">{platformLabels[p] || p}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {!isFinished ? "Running" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
