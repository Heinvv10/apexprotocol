"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Radar,
  FileSearch,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  Activity,
  Globe,
  Bot,
  Loader2,
  MessageSquare,
  PenTool,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrandStore, useBrands, useSelectedBrand } from "@/stores";
import { useOnboardingProgress } from "@/hooks/useOnboarding";
import { useDashboardMetrics, useGEOScore, useUnifiedScore } from "@/hooks/useDashboard";
import { UnifiedScoreGauge } from "@/components/dashboard/unified-score-gauge";
import { ScoreTrend } from "@/components/dashboard/score-trend";

// Onboarding step type
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  ctaText: string;
  completed: boolean;
  accentColor: string;
}

// Animated background orbs component
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Cyan orb */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse-glow 8s ease-in-out infinite',
        }}
      />
      {/* Purple orb */}
      <div
        className="absolute -bottom-48 -left-32 w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse-glow 10s ease-in-out infinite reverse',
        }}
      />
      {/* Blue accent orb */}
      <div
        className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'pulse-glow 6s ease-in-out infinite 2s',
        }}
      />
    </div>
  );
}

// Animated particle grid (subtle)
function ParticleGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(0, 229, 204, 0.15) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

// Glowing progress ring component
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            filter: 'drop-shadow(0 0 6px rgba(0, 229, 204, 0.5))',
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5CC" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// Futuristic Empty State Dashboard Component
function EmptyStateDashboard() {
  // Get real onboarding progress from API
  const { progress, completedSteps, totalSteps, status } = useOnboardingProgress();

  // Build onboarding steps with real completion status
  const onboardingSteps: OnboardingStep[] = [
    {
      id: "brand",
      title: "Add Your Brand",
      description: "Set up your company profile to start monitoring AI mentions across platforms.",
      icon: Building2,
      href: "/dashboard/brands",
      ctaText: "Add Brand",
      completed: status?.brandAdded ?? false,
      accentColor: "rgba(0, 229, 204, 0.15)",
    },
    {
      id: "monitor",
      title: "Configure Monitoring",
      description: "Choose which AI platforms to track and set up your monitoring keywords.",
      icon: Radar,
      href: "/dashboard/monitor",
      ctaText: "Set Up Monitoring",
      completed: status?.monitoringConfigured ?? false,
      accentColor: "rgba(139, 92, 246, 0.15)",
    },
    {
      id: "audit",
      title: "Run Your First Audit",
      description: "Analyze your website's AI visibility and get actionable recommendations.",
      icon: FileSearch,
      href: "/dashboard/audit",
      ctaText: "Start Audit",
      completed: status?.auditRun ?? false,
      accentColor: "rgba(59, 130, 246, 0.15)",
    },
    {
      id: "recommendations",
      title: "Review Recommendations",
      description: "Get AI-powered suggestions to improve your visibility across answer engines.",
      icon: Lightbulb,
      href: "/dashboard/recommendations",
      ctaText: "View Recommendations",
      completed: status?.recommendationsReviewed ?? false,
      accentColor: "rgba(168, 85, 247, 0.15)",
    },
  ];

  // AI Platforms with brand colors
  const aiPlatforms = [
    { name: 'ChatGPT', color: '#10A37F' },
    { name: 'Claude', color: '#D97757' },
    { name: 'Gemini', color: '#4285F4' },
    { name: 'Perplexity', color: '#20B8CD' },
    { name: 'Grok', color: '#FFFFFF' },
    { name: 'DeepSeek', color: '#6366F1' },
    { name: 'Copilot', color: '#0078D4' },
  ];

  return (
    <div className="relative min-h-full pb-8 overflow-y-auto">
      {/* Animated Background */}
      <BackgroundOrbs />
      <ParticleGrid />

      <div className="relative z-10 space-y-10 max-w-6xl mx-auto px-4 py-8">
        {/* Hero Welcome Section */}
        <div className="text-center space-y-6">
          {/* Glowing badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(0,229,204,0.15)]">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Welcome to Apex</span>
          </div>

          {/* Gradient heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Let&apos;s optimize your</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-accent-purple to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              AI visibility
            </span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Complete these steps to start monitoring your brand across AI platforms
            and improve your share of AI-generated answers.
          </p>
        </div>

        {/* Progress Card - Gradient border */}
        <div className="card-primary-gradient max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <ProgressRing progress={progress} size={100} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Setup Progress
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                {completedSteps} of {totalSteps} steps completed
              </p>
              {/* Linear progress bar with glow */}
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #00E5CC 0%, #8B5CF6 100%)',
                    boxShadow: '0 0 20px rgba(0, 229, 204, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Steps Grid - with stagger animation */}
        <div className="grid gap-4 md:grid-cols-2 stagger-children">
          {onboardingSteps.map((step, index) => (
            <Link
              key={step.id}
              href={step.href}
              className="group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`card-secondary h-full transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(0,229,204,0.15)] ${
                  step.completed ? 'opacity-60' : ''
                }`}
              >
                {/* Accent gradient background */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: step.accentColor }}
                />

                <div className="relative flex items-start gap-4">
                  {/* Icon with glow */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      step.completed
                        ? 'bg-success/20 text-success'
                        : 'bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_rgba(0,229,204,0.3)]'
                    }`}
                  >
                    <step.icon className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground/70 font-medium tracking-wider uppercase">
                        Step {index + 1}
                      </span>
                      {step.completed && (
                        <span className="badge-success text-[10px]">Completed</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {step.description}
                    </p>

                    {/* CTA with arrow animation */}
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                      {step.ctaText}
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* What You'll Track Section */}
        <div className="space-y-6 pt-4">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              What you&apos;ll be able to track
            </h2>
            <p className="text-muted-foreground text-sm">
              Powerful metrics to understand your AI presence
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Share of Answer */}
            <div className="card-tertiary group hover:border-primary/30 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_15px_rgba(0,229,204,0.3)] transition-all">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Share of Answer</h3>
              <p className="text-sm text-muted-foreground">
                Track how often your brand appears in AI responses
              </p>
            </div>

            {/* Trust Score */}
            <div className="card-tertiary group hover:border-accent-purple/30 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Trust Score</h3>
              <p className="text-sm text-muted-foreground">
                Measure your authority across AI platforms
              </p>
            </div>

            {/* Smart Recommendations */}
            <div className="card-tertiary group hover:border-accent-blue/30 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Smart Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered suggestions to improve visibility
              </p>
            </div>
          </div>
        </div>

        {/* AI Platforms Section */}
        <div className="space-y-6 pt-4 pb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm mb-4">
              <Globe className="w-4 h-4" />
              <span>Monitor your brand across these AI platforms</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {aiPlatforms.map((platform, index) => (
              <div
                key={platform.name}
                className="group px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-default"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center gap-2">
                  <Bot
                    className="w-4 h-4 transition-colors duration-300"
                    style={{ color: platform.color }}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {platform.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-8">
          <Link
            href="/dashboard/brands"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.4)] hover:shadow-[0_0_35px_rgba(0,229,204,0.5)]"
          >
            <Activity className="w-5 h-5" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for dashboard
function DashboardSkeleton() {
  return (
    <div className="relative min-h-full pb-8 overflow-y-auto" data-testid="dashboard-loading">
      <BackgroundOrbs />
      <ParticleGrid />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  );
}

// GEO Score Gauge Component
function GEOScoreGauge({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : score >= 40 ? "#EAB308" : "#EF4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(0 0 8px ${scoreColor}80)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">GEO Score</span>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  href,
  accentColor,
}: {
  title: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: React.ElementType;
  href: string;
  accentColor: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="card-secondary h-full transition-all duration-300 hover:border-primary/40">
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <span
              className={`text-sm font-medium ${
                trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-muted-foreground"
              }`}
            >
              {trend === "up" ? "+" : trend === "down" ? "-" : ""}
              {Math.abs(change)}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
        <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View details
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

// Quick Link Component
function QuickLink({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} className="group">
      <div className="card-tertiary h-full transition-all hover:border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground group-hover:text-primary transition-colors">{title}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// Error State Component
function DashboardErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="relative min-h-full pb-8 overflow-y-auto">
      <BackgroundOrbs />
      <ParticleGrid />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error/10 border border-error/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Failed to Load Dashboard</h3>
          <p className="text-muted-foreground text-sm mb-6">{error.message}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

// Populated Dashboard Component - shows when brand is selected with metrics
function PopulatedDashboard({ brandId, brandName }: { brandId: string; brandName: string }) {
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch,
  } = useDashboardMetrics(brandId);

  const { data: geoScore } = useGEOScore(brandId);
  const { data: unifiedScoreData } = useUnifiedScore(brandId);

  // Show loading state
  if (metricsLoading && !metrics) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (metricsError && !metrics) {
    return <DashboardErrorState error={metricsError as Error} onRetry={() => refetch()} />;
  }

  // Get the unified score data or fallback to GEO score
  const hasUnifiedScore = !!unifiedScoreData?.score;
  const unifiedScore = unifiedScoreData?.score;
  const currentGeoScore = geoScore?.overall ?? metrics?.geoScore?.current ?? 0;
  const geoTrend = metrics?.geoScore?.trend ?? "stable";
  const geoChange = metrics?.geoScore?.change ?? 0;

  return (
    <div className="relative min-h-full pb-8 overflow-y-auto" data-testid="dashboard-metrics">
      <BackgroundOrbs />
      <ParticleGrid />

      <div className="relative z-10 space-y-8 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{brandName}</h1>
            <p className="text-muted-foreground">Your AI visibility dashboard</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {geoTrend === "up" && (
              <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/30">
                +{geoChange} this week
              </span>
            )}
            {geoTrend === "down" && (
              <span className="px-3 py-1 rounded-full bg-error/10 text-error border border-error/30">
                -{Math.abs(geoChange)} this week
              </span>
            )}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Unified Score - Featured Card */}
          <div className="card-primary md:col-span-2 lg:col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              Digital Presence Score
            </h3>
            {hasUnifiedScore ? (
              <UnifiedScoreGauge
                overall={unifiedScore?.overall ?? 0}
                seoScore={unifiedScore?.components?.seo?.score ?? 0}
                geoScore={unifiedScore?.components?.geo?.score ?? 0}
                aeoScore={unifiedScore?.components?.aeo?.score ?? 0}
                grade={unifiedScore?.grade}
                trend={unifiedScore ? { value: unifiedScore.change, direction: unifiedScore.trend } : undefined}
                size="md"
              />
            ) : (
              <div className="flex flex-col items-center text-center">
                <GEOScoreGauge score={currentGeoScore} />
                <p className="mt-4 text-sm text-muted-foreground">
                  {currentGeoScore >= 80
                    ? "Excellent visibility"
                    : currentGeoScore >= 60
                    ? "Good progress"
                    : "Room to improve"}
                </p>
              </div>
            )}
          </div>

          {/* Mentions */}
          <MetricCard
            title="Total Mentions"
            value={metrics?.mentions?.total ?? 0}
            change={metrics?.mentions?.change}
            trend={metrics?.mentions?.trend}
            icon={MessageSquare}
            href="/dashboard/monitor"
            accentColor="#00E5CC"
          />

          {/* Pending Recommendations */}
          <MetricCard
            title="Pending Recommendations"
            value={metrics?.recommendations?.pending ?? 0}
            icon={Lightbulb}
            href="/dashboard/recommendations"
            accentColor="#8B5CF6"
          />

          {/* Content Created */}
          <MetricCard
            title="Content Pieces"
            value={metrics?.content?.total ?? 0}
            icon={PenTool}
            href="/dashboard/create"
            accentColor="#3B82F6"
          />
        </div>

        {/* Score Trend Chart */}
        {unifiedScoreData?.history && unifiedScoreData.history.length > 0 && (
          <ScoreTrend
            data={unifiedScoreData.history}
            targetScore={80}
            showComponents={true}
          />
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink
              title="Monitor"
              description="Track AI mentions"
              href="/dashboard/monitor"
              icon={Radar}
            />
            <QuickLink
              title="Create"
              description="Generate content"
              href="/dashboard/create"
              icon={PenTool}
            />
            <QuickLink
              title="Audit"
              description="Analyze your site"
              href="/dashboard/audit"
              icon={FileSearch}
            />
            <QuickLink
              title="Recommendations"
              description="View action items"
              href="/dashboard/recommendations"
              icon={Lightbulb}
            />
          </div>
        </div>

        {/* Platform Breakdown */}
        {metrics?.platforms && metrics.platforms.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Platform Performance</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.platforms.map((platform) => (
                <div key={platform.name} className="card-tertiary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{platform.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{platform.mentions} mentions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {metrics?.topRecommendations && metrics.topRecommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Top Recommendations</h2>
              <Link
                href="/dashboard/recommendations"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {metrics.topRecommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="card-tertiary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          rec.priority === "critical"
                            ? "bg-error"
                            : rec.priority === "high"
                            ? "bg-warning"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <span className="text-foreground">{rec.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{rec.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const brands = useBrands();
  const selectedBrand = useSelectedBrand();
  const isLoading = useBrandStore((state) => state.isLoading);
  const refreshBrands = useBrandStore((state) => state.refreshBrands);

  // Fetch brands on mount
  React.useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  // Show loading state while fetching
  if (isLoading && brands.length === 0) {
    return <DashboardSkeleton />;
  }

  // Determine if user has data (at least one brand set up)
  const hasData = brands.length > 0;

  if (!hasData) {
    return <EmptyStateDashboard />;
  }

  // Show populated dashboard when brand is selected
  if (selectedBrand) {
    return <PopulatedDashboard brandId={selectedBrand.id} brandName={selectedBrand.name} />;
  }

  // Show onboarding if brands exist but none selected
  return <EmptyStateDashboard />;
}
