"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TrustScoreCardProps {
  score: number;
  maxScore?: number;
  benchmark?: number;
  className?: string;
}

export function TrustScoreCard({
  score,
  maxScore = 100,
  benchmark = 72,
  className,
}: TrustScoreCardProps) {
  const [displayScore, setDisplayScore] = React.useState(0);
  const progress = (score / maxScore) * 100;

  React.useEffect(() => {
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressAnim = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progressAnim, 4);
      const currentScore = Math.round(score * eased);

      setDisplayScore(currentScore);

      if (progressAnim < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className={cn("card-primary p-6", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Apex Trust Score
      </h3>

      {/* Score Display */}
      <div className="text-center mb-4">
        <span className="metric-medium text-foreground">
          {displayScore}
        </span>
        <span className="text-lg text-muted-foreground">/{maxScore}</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-muted/30">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-[800ms] ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent-purple)))",
            boxShadow: "0 0 12px hsl(var(--primary) / 0.5)",
          }}
        />
        {/* Benchmark marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground"
          style={{ left: `${(benchmark / maxScore) * 100}%` }}
        />
      </div>

      {/* Benchmark Label */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Industry Benchmark: {benchmark}
      </p>
    </div>
  );
}
