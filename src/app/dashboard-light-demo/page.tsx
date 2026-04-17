"use client";

import * as React from "react";
import Link from "next/link";
import {
  Radar,
  FileSearch,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  Globe,
  Bot,
  MessageSquare,
  PenTool,
  Moon,
} from "lucide-react";

// Animated background orbs component (lighter for light theme)
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Teal orb */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(27, 168, 144, 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse-glow-light 8s ease-in-out infinite',
        }}
      />
      {/* Purple orb */}
      <div
        className="absolute -bottom-48 -left-32 w-[500px] h-[500px] rounded-full opacity-8"
        style={{
          background: 'radial-gradient(circle, rgba(109, 40, 217, 0.25) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse-glow-light 10s ease-in-out infinite reverse',
        }}
      />
      {/* Blue accent orb */}
      <div
        className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full opacity-6"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'pulse-glow-light 6s ease-in-out infinite 2s',
        }}
      />
    </div>
  );
}

// Animated particle grid (subtle)
function ParticleGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(27, 168, 144, 0.1) 1px, transparent 0)
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
          stroke="rgba(0, 0, 0, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradientLight)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            filter: 'drop-shadow(0 0 4px rgba(27, 168, 144, 0.3))',
          }}
        />
        <defs>
          <linearGradient id="progressGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1BA890" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold bg-gradient-to-r from-[#1BA890] to-[#6D28D9] bg-clip-text text-transparent">
          {Math.round(progress)}%
        </span>
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
    score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : score >= 40 ? "#EAB308" : "#DC2626";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0, 0, 0, 0.08)"
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
            filter: `drop-shadow(0 0 6px ${scoreColor}60)`,
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
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
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
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors">
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

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-40 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientDashboardLight)"
        />
        <defs>
          <linearGradient id="starGradientDashboardLight" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1BA890" stopOpacity="0.4"/>
            <stop offset="1" stopColor="#6D28D9" stopOpacity="0.2"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function DashboardLightDemoPage() {
  const [progress] = React.useState(67);
  const [geoScore] = React.useState(72);

  // AI Platforms with brand colors
  const aiPlatforms = [
    { name: 'ChatGPT', color: '#0D8B63' },
    { name: 'Claude', color: '#C96D4D' },
    { name: 'Gemini', color: '#2563EB' },
    { name: 'Perplexity', color: '#1A8FA0' },
    { name: 'Grok', color: '#0F172A' },
    { name: 'DeepSeek', color: '#5254E8' },
    { name: 'Copilot', color: '#0078D4' },
  ];

  // Force light theme - override ThemeProvider
  React.useEffect(() => {
    const html = document.documentElement;

    // Remove dark class and add light-theme class
    const applyLightTheme = () => {
      html.classList.remove('dark');
      html.classList.add('light-theme');
    };

    // Apply immediately
    applyLightTheme();

    // Also watch for changes (ThemeProvider might add dark back)
    const observer = new MutationObserver(applyLightTheme);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      html.classList.remove('light-theme');
      html.classList.add('dark');
    };
  }, []);

  return (
    <div className="space-y-6 relative">
      <div className="relative min-h-full pb-8">
        {/* Animated Background */}
        <BackgroundOrbs />
        <ParticleGrid />

        <div className="relative z-10 space-y-10 max-w-6xl mx-auto px-4 py-8">
          {/* Hero Welcome Section */}
          <div className="text-center space-y-6">
            {/* Glowing badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 shadow-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Apex Light Theme Preview</span>
            </div>

            {/* Gradient heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-foreground">Professional</span>
              <br />
              <span className="bg-gradient-to-r from-[#1BA890] via-[#6D28D9] to-[#1BA890] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer-light_3s_linear_infinite]">
                Light Theme
              </span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              A clean, professional theme optimized for bright environments and extended viewing sessions.
            </p>
          </div>

          {/* Progress Card - Gradient border */}
          <div className="card-primary-gradient max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <ProgressRing progress={progress} size={100} />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Theme Progress
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Professional design with excellent contrast
                </p>
                {/* Linear progress bar with glow */}
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #1BA890 0%, #6D28D9 100%)',
                      boxShadow: '0 0 15px rgba(27, 168, 144, 0.3)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* GEO Score - Featured Card */}
            <div className="card-primary md:col-span-2 lg:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                AI Visibility Score
              </h3>
              <div className="flex flex-col items-center text-center">
                <GEOScoreGauge score={geoScore} />
                <p className="mt-4 text-sm text-muted-foreground">
                  Excellent visibility across AI platforms
                </p>
              </div>
            </div>

            {/* Mentions */}
            <MetricCard
              title="Total Mentions"
              value={247}
              change={12}
              trend="up"
              icon={MessageSquare}
              href="#"
              accentColor="#1BA890"
            />

            {/* Pending Recommendations */}
            <MetricCard
              title="Pending Actions"
              value={8}
              icon={Lightbulb}
              href="#"
              accentColor="#6D28D9"
            />

            {/* Content Created */}
            <MetricCard
              title="Content Pieces"
              value={42}
              change={5}
              trend="up"
              icon={PenTool}
              href="#"
              accentColor="#2563EB"
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink
                title="Monitor"
                description="Track AI mentions"
                href="#"
                icon={Radar}
              />
              <QuickLink
                title="Create"
                description="Generate content"
                href="#"
                icon={PenTool}
              />
              <QuickLink
                title="Audit"
                description="Analyze your site"
                href="#"
                icon={FileSearch}
              />
              <QuickLink
                title="Recommendations"
                description="View action items"
                href="#"
                icon={Lightbulb}
              />
            </div>
          </div>

          {/* What You'll Track Section */}
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                Key Metrics
              </h2>
              <p className="text-muted-foreground text-sm">
                Powerful metrics to understand your AI presence
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Share of Answer */}
              <div className="card-tertiary group hover:border-primary/30 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:shadow-md transition-all">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Share of Answer</h3>
                <p className="text-sm text-muted-foreground">
                  Track how often your brand appears in AI responses
                </p>
              </div>

              {/* Trust Score */}
              <div className="card-tertiary group hover:border-accent-purple/30 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center mx-auto mb-4 group-hover:shadow-md transition-all">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Trust Score</h3>
                <p className="text-sm text-muted-foreground">
                  Measure your authority across AI platforms
                </p>
              </div>

              {/* Smart Recommendations */}
              <div className="card-tertiary group hover:border-accent-blue/30 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center mx-auto mb-4 group-hover:shadow-md transition-all">
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
                  className="group px-5 py-2.5 rounded-full bg-black/5 border border-black/10 hover:border-black/15 transition-all duration-300 cursor-default"
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
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              <Moon className="w-5 h-5" />
              Switch to Dark Theme
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <DecorativeStar />
    </div>
  );
}
