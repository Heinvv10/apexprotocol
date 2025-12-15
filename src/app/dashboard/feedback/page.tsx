"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, MessageSquare, Sparkles, ArrowRight, Settings, Radar, Shield, CheckCircle2 } from "lucide-react";
import {
  HallucinationCard,
  FixDeployedCard,
  VerifiedCard,
  type HallucinationData,
  type FixDeployedData,
  type VerifiedData,
} from "@/components/feedback";

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientFeedback)"
        />
        <defs>
          <linearGradient id="starGradientFeedback" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Empty state component for feedback page
function FeedbackEmptyState() {
  const workflow = [
    { icon: Radar, title: "Detect", description: "AI monitors platforms for inaccurate information about your brand" },
    { icon: Shield, title: "Correct", description: "Deploy fixes to update AI knowledge graphs" },
    { icon: CheckCircle2, title: "Verify", description: "Confirm corrections are reflected in AI responses" },
  ];

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg space-y-8">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-24 h-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Knowledge Graph Corrections</span>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Feedback Items Yet
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Once you configure brand monitoring, we&apos;ll automatically detect when AI platforms
            share inaccurate information about your brand and help you correct it.
          </p>
        </div>

        {/* Workflow preview */}
        <div className="grid gap-3">
          {workflow.map((step, index) => (
            <div
              key={step.title}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/70">Step {index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{step.title}</span>
                </div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard/monitor"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)]"
        >
          <Settings className="w-5 h-5" />
          Configure Monitoring
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  // TODO: Fetch feedback data from API endpoint
  // const { data: hallucinations } = useQuery(['hallucinations'], fetchHallucinations);
  // const { data: fixesDeployed } = useQuery(['fixes'], fetchFixes);
  // const { data: verified } = useQuery(['verified'], fetchVerified);
  const hallucinations: HallucinationData[] = []; // Empty array - no mock data
  const fixesDeployed: FixDeployedData[] = []; // Empty array - no mock data
  const verified: VerifiedData[] = []; // Empty array - no mock data

  // Check if there's any data
  const hasData = hallucinations.length > 0 || fixesDeployed.length > 0 || verified.length > 0;

  return (
    <div className="dashboard-bg min-h-screen relative">
      {/* Header Row */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="apex-logo-icon w-8 h-8">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradFeedback)" />
              <defs>
                <linearGradient id="apexGradFeedback" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5CC"/>
                  <stop offset="1" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            APEX
          </span>
          <span className="text-xl font-light text-white ml-1">Feedback</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-8">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            Orbit
          </Link>
          <Link href="/dashboard/monitor" className="text-sm text-slate-400 hover:text-white transition-colors">
            Monitor
          </Link>
          <Link href="/dashboard/feedback" className="text-sm text-cyan-400 font-medium relative">
            Feedback
            <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          </Link>
          <Link href="/dashboard/engine-room" className="text-sm text-slate-400 hover:text-white transition-colors">
            Engines
          </Link>
          <Link href="/dashboard/settings" className="text-sm text-slate-400 hover:text-white transition-colors">
            Settings
          </Link>
        </nav>

        {/* AI Status */}
        <div className="ai-status-indicator">
          <span className="ai-status-dot active" />
          <span className="text-xs text-slate-400">AI Status:</span>
          <span className="text-xs text-cyan-400 font-medium">Active</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 relative">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-white mb-6">
          Knowledge Graph Corrections
        </h1>

        {hasData ? (
          /* 3-Column Workflow - only show when there's data */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Detected Hallucinations */}
            <div className="feedback-column-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Detected Hallucinations</h2>
                <button className="text-muted-foreground hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {hallucinations.map((item) => (
                  <HallucinationCard key={item.id} data={item} />
                ))}
              </div>
            </div>

            {/* Column 2: Fix Deployed */}
            <div className="feedback-column-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Fix Deployed</h2>
                <button className="text-muted-foreground hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {fixesDeployed.map((item) => (
                  <FixDeployedCard key={item.id} data={item} />
                ))}
              </div>
            </div>

            {/* Column 3: Verified in AI */}
            <div className="feedback-column-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Verified in AI</h2>
                <button className="text-muted-foreground hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {verified.map((item) => (
                  <VerifiedCard key={item.id} data={item} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <FeedbackEmptyState />
        )}

        {/* Decorative Star */}
        <DecorativeStar />
      </div>
    </div>
  );
}
