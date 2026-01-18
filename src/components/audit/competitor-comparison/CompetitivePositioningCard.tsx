"use client";

import * as React from "react";
import { Award, TrendingUp, Rocket } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PositioningProps {
  overallRank: number;
  totalCompetitors: number;
  percentilRank: number;
  competitiveStatus: "leader" | "competitive" | "lagging";
  auditId?: string;
}

export function CompetitivePositioningCard({
  overallRank,
  totalCompetitors,
  percentilRank,
  competitiveStatus,
  auditId,
}: PositioningProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "leader":
        return {
          icon: "🏆",
          label: "Industry Leader",
          color: "text-success",
          bgColor: "bg-success/5 border-success/20",
          description: "You're among the top performers in your industry",
        };
      case "competitive":
        return {
          icon: "⚔️",
          label: "Competitive Position",
          color: "text-warning",
          bgColor: "bg-warning/5 border-warning/20",
          description: "You're holding your own but have room for improvement",
        };
      default:
        return {
          icon: "📊",
          label: "Lagging",
          color: "text-error",
          bgColor: "bg-error/5 border-error/20",
          description: "You're behind the curve - time to catch up",
        };
    }
  };

  const status = getStatusInfo(competitiveStatus);
  const positionPercentile = Math.round(((totalCompetitors - overallRank + 1) / totalCompetitors) * 100);

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Competitive Positioning</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your market position and competitive strength overview
        </p>
      </div>

      {/* Main positioning card */}
      <div className={`card-tertiary p-6 border rounded-lg space-y-4 ${status.bgColor}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-4xl mb-3">{status.icon}</div>
            <div className="text-2xl font-bold">{status.label}</div>
            <p className="text-sm text-muted-foreground mt-2">{status.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary"># {overallRank}</div>
            <div className="text-xs text-muted-foreground mt-1">of {totalCompetitors}</div>
          </div>
        </div>
      </div>

      {/* Percentile ranking */}
      <div className="card-tertiary p-4 border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Percentile Rank</span>
          <span className={`text-lg font-bold ${status.color}`}>{percentilRank}th</span>
        </div>
        <Progress value={percentilRank} className="h-3" />
        <p className="text-xs text-muted-foreground">
          You're performing better than{" "}
          <strong>
            {percentilRank}% of {totalCompetitors}
          </strong>{" "}
          competitors in your competitive set
        </p>
      </div>

      {/* Rank brackets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Competitive Tiers</h4>
        <div className="space-y-2">
          {/* Top Tier */}
          <div className="card-tertiary p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">🏆 Top Tier (Top 20%)</span>
              <span className={`text-xs font-semibold ${percentilRank >= 80 ? "text-success" : "text-muted-foreground"}`}>
                {percentilRank >= 80 ? "✓ You're here" : `Need +${80 - percentilRank} points`}
              </span>
            </div>
            <Progress value={percentilRank >= 80 ? 100 : 0} className="h-1.5" />
          </div>

          {/* Competitive Tier */}
          <div className="card-tertiary p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">⚔️ Competitive (40-80%)</span>
              <span className={`text-xs font-semibold ${percentilRank >= 40 && percentilRank < 80 ? "text-warning" : "text-muted-foreground"}`}>
                {percentilRank >= 40 && percentilRank < 80 ? "✓ You're here" : ""}
              </span>
            </div>
            <Progress value={percentilRank >= 40 && percentilRank < 80 ? 100 : 0} className="h-1.5" />
          </div>

          {/* Lagging Tier */}
          <div className="card-tertiary p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">📊 Lagging (&lt;40%)</span>
              <span className={`text-xs font-semibold ${percentilRank < 40 ? "text-error" : "text-muted-foreground"}`}>
                {percentilRank < 40 ? "✓ You're here" : ""}
              </span>
            </div>
            <Progress value={percentilRank < 40 ? 100 : 0} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Actionable next steps */}
      <div className={`border rounded-lg p-3 space-y-2 ${status.bgColor}`}>
        <p className="text-xs font-medium text-foreground mb-1">Next Steps:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          {competitiveStatus === "leader" && (
            <>
              <li>• Maintain your competitive edge with continuous optimization</li>
              <li>• Leverage your leadership position in marketing materials</li>
              <li>• Monitor competitor moves and adapt quickly</li>
              <li>• Share best practices with your team</li>
            </>
          )}
          {competitiveStatus === "competitive" && (
            <>
              <li>• Focus on your weakest dimension to gain ground</li>
              <li>• Implement 2-3 quick wins to improve scores</li>
              <li>• Set quarterly targets to reach top 20% tier</li>
              <li>• Monitor leader strategies and adapt tactically</li>
            </>
          )}
          {competitiveStatus === "lagging" && (
            <>
              <li>• Prioritize high-impact improvements immediately</li>
              <li>• Focus on closing gaps with industry average first</li>
              <li>• Consider hiring specialist talent or agencies</li>
              <li>• Set aggressive quarterly improvement targets</li>
            </>
          )}
        </ul>
      </div>

      {/* Growth opportunity */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
        <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-foreground mb-1">Growth Opportunity:</p>
          <p className="text-xs text-muted-foreground">
            {competitiveStatus === "leader"
              ? "You have the foundation to become the undisputed category leader. Focus on innovation and thought leadership."
              : competitiveStatus === "competitive"
                ? `Closing the gap to the leader is achievable. Focus on high-impact improvements to move into the top tier.`
                : `Moving from lagging to competitive is critical. Target 15-20 point improvement within 90 days.`}
          </p>
        </div>
      </div>

      {/* Improvement Roadmap CTA */}
      {auditId && (
        <Link href={`/dashboard/audit/roadmap?id=${auditId}&mode=leader`}>
          <Button className="w-full gap-2 bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-400/90">
            <Rocket className="h-4 w-4" />
            Start Improvement Roadmap
          </Button>
        </Link>
      )}
    </div>
  );
}
