"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, XCircle, Zap } from "lucide-react";

interface PlatformVisibility {
  name: string;
  icon: string;
  status: "visible" | "partial" | "not-visible";
  score: number;
  contentUsed: string;
  lastDetected?: string;
}

interface AIPlatformVisibilityProps {
  platforms: PlatformVisibility[];
}

export function AIPlatformVisibility({ platforms }: AIPlatformVisibilityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "visible":
        return "bg-success/10 border-success/20 text-success";
      case "partial":
        return "bg-warning/10 border-warning/20 text-warning";
      case "not-visible":
        return "bg-error/10 border-error/20 text-error";
      default:
        return "bg-muted/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "visible":
        return <CheckCircle2 className="h-5 w-5" />;
      case "partial":
        return <AlertCircle className="h-5 w-5" />;
      case "not-visible":
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "visible":
        return "Visible";
      case "partial":
        return "Partial Coverage";
      case "not-visible":
        return "Not Detected";
      default:
        return "Unknown";
    }
  };

  const visibleCount = platforms.filter((p) => p.status === "visible").length;
  const averageScore =
    platforms.length > 0
      ? Math.round(
          platforms.reduce((sum, p) => sum + p.score, 0) / platforms.length
        )
      : 0;

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Platform Visibility</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your content's presence and suitability across major AI platforms
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-success">{visibleCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Platforms</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-primary">{averageScore}</div>
          <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-warning">
            {platforms.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Tracked</div>
        </div>
      </div>

      {/* Platform list */}
      <div className="space-y-2">
        {platforms.map((platform, idx) => (
          <div
            key={idx}
            className={`card-tertiary p-4 border rounded-lg space-y-2 ${getStatusColor(
              platform.status
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl flex-shrink-0">{platform.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{platform.name}</span>
                    {getStatusIcon(platform.status)}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {getStatusLabel(platform.status)}
                  </div>
                  {platform.contentUsed && (
                    <div className="text-xs opacity-75 mt-1">
                      📝 {platform.contentUsed}
                    </div>
                  )}
                  {platform.lastDetected && (
                    <div className="text-xs opacity-75 mt-1">
                      📅 {platform.lastDetected}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold">{platform.score}</div>
                  <div className="text-xs opacity-75">Score</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Higher visibility across AI platforms means
          your content is more likely to be used in AI-generated responses and
          cited as a trusted source.
        </p>
      </div>
    </div>
  );
}
