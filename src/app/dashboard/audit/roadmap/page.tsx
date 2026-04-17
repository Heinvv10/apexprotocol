"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Download,
  Share2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  useRoadmapGenerator,
  type Roadmap as RoadmapType,
} from "@/hooks/useRoadmapGenerator";
import { useAudit } from "@/hooks/useAudit";
import { RoadmapPhaseCard } from "@/components/audit/roadmap/RoadmapPhaseCard";
import { ProgressTimeline } from "@/components/audit/roadmap/ProgressTimeline";

function RoadmapPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = searchParams.get("id");
  const mode = (searchParams.get("mode") || "leader") as "leader" | "beat_competitor";
  const competitorName = searchParams.get("competitor");

  const { data: audit, isLoading, error } = useAudit(auditId || "");

  const roadmap = useRoadmapGenerator(audit, mode, competitorName || undefined);

  const [expandedPhases, setExpandedPhases] = React.useState<Set<number>>(
    new Set([1])
  );

  const togglePhase = (phase: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  };

  // Missing audit id — show a picker state instead of a generic error.
  if (!auditId) {
    return (
      <div className="flex items-center justify-center py-20 px-6">
        <div className="card-secondary max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Select an audit run
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Improvement roadmaps are generated from a specific audit. Pick one
            from your audit history to get started.
          </p>
          <Link href="/dashboard/audit">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to audits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Generating improvement roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex items-center justify-center py-20 px-6">
        <div className="card-secondary max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 border border-error/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Roadmap unavailable
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {error?.message || "Could not generate the improvement roadmap."}
          </p>
          <Link href={`/dashboard/audit/results?id=${auditId}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to audit
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/audit/results?id=${auditId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">{roadmap.title}</h1>
              <p className="text-xs text-muted-foreground">
                {roadmap.mode === "leader"
                  ? "Path to industry leadership"
                  : `Competitive strategy to beat ${roadmap.targetCompetitor}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Roadmap Overview */}
        <div className="card-primary p-6 border rounded-lg space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Your Improvement Roadmap
            </h2>
            <p className="text-muted-foreground">{roadmap.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Current Score</div>
              <div className="text-3xl font-bold text-primary">
                {roadmap.currentUnifiedScore}
              </div>
              <div className="text-xs text-muted-foreground">
                Grade: <span className="font-semibold">{roadmap.currentGrade}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Target Score</div>
              <div className="text-3xl font-bold text-success">
                {roadmap.targetUnifiedScore}
              </div>
              <div className="text-xs text-muted-foreground">
                Grade: <span className="font-semibold">{roadmap.targetGrade}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Total Impact</div>
              <div className="text-3xl font-bold text-warning">
                +{roadmap.phases.reduce((sum, p) => sum + p.totalExpectedImpact, 0)}
              </div>
              <div className="text-xs text-muted-foreground">points across phases</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Timeline</div>
              <div className="text-3xl font-bold text-cyan-400">
                {roadmap.estimatedWeeks}w
              </div>
              <div className="text-xs text-muted-foreground">estimated duration</div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <ProgressTimeline roadmap={roadmap} />

        {/* Phases */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Implementation Phases
            </h2>
            <p className="text-sm text-muted-foreground">
              Follow these prioritized phases to reach your improvement targets
            </p>
          </div>

          {roadmap.phases.map((phase) => (
            <RoadmapPhaseCard
              key={phase.phase}
              phase={phase}
              isExpanded={expandedPhases.has(phase.phase)}
              onToggle={() => togglePhase(phase.phase)}
            />
          ))}
        </div>

        {/* Action Recommendations */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Quick Start Guide
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              <strong className="text-foreground">Review Phase 1 milestones</strong> -
              These are quick wins that can be implemented immediately
            </li>
            <li>
              <strong className="text-foreground">Prioritize by effort</strong> -
              Start with "easy" difficulty tasks to build momentum
            </li>
            <li>
              <strong className="text-foreground">Assign team members</strong> -
              Break tasks across your team based on skills and availability
            </li>
            <li>
              <strong className="text-foreground">Track progress weekly</strong> -
              Update milestone status and monitor score improvements
            </li>
            <li>
              <strong className="text-foreground">Iterate on Phase 2 & 3</strong> -
              Adjust tactics based on Phase 1 results
            </li>
          </ol>
        </div>

        {/* Expected Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-secondary p-6 border rounded-lg space-y-3">
            <div className="text-3xl">⚡</div>
            <h4 className="font-semibold text-foreground">Quick Wins (Week 1-2)</h4>
            <p className="text-sm text-muted-foreground">
              Expect +12 points from easy, high-impact improvements. Great for building
              momentum and team confidence.
            </p>
          </div>

          <div className="card-secondary p-6 border rounded-lg space-y-3">
            <div className="text-3xl">🎯</div>
            <h4 className="font-semibold text-foreground">Sustained Growth (Week 3-8)</h4>
            <p className="text-sm text-muted-foreground">
              Medium-effort improvements yield +18 points. Focus on pillar content,
              backlinks, and social strategy.
            </p>
          </div>

          <div className="card-secondary p-6 border rounded-lg space-y-3">
            <div className="text-3xl">🚀</div>
            <h4 className="font-semibold text-foreground">Long-term Excellence</h4>
            <p className="text-sm text-muted-foreground">
              Maintain leadership with ongoing optimizations. +8 points from continuous
              improvements and monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
export default function RoadmapPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <RoadmapPageInner />
    </Suspense>
  );
}
