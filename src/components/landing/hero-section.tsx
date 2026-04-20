"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp } from "lucide-react";
import Link from "next/link";

const TRUST_LOGOS = ["Vodacom", "Takealot", "Discovery", "MTN", "Standard Bank"];

const SUBSCORES = [
  { label: "Technical", value: 88, color: "var(--primary)" },
  { label: "Content", value: 74, color: "var(--accent-blue)" },
  { label: "AEO", value: 69, color: "var(--accent-purple)" },
];

const PLATFORMS = [
  { name: "ChatGPT", share: 85 },
  { name: "Claude", share: 72 },
  { name: "Perplexity", share: 91 },
  { name: "Gemini", share: 68 },
];

export function HeroSection() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden py-16 lg:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />

      {/* Aurora gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-gradient-to-br from-primary/30 via-accent-purple/20 to-transparent rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-accent-blue/25 via-primary/15 to-transparent rounded-full blur-[100px]" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 items-center gap-10 lg:gap-14">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              GEO / AEO Platform · Africa-first
            </span>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              <span className="block text-foreground">Be the Answer.</span>
              <span className="block text-primary">Not Just A Result.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-7">
              Track, optimize, and amplify your brand&apos;s presence across
              ChatGPT, Claude, Gemini, Perplexity, Grok and DeepSeek — with a
              dashboard-first workflow built for African markets.
            </p>

            {/* CTA Buttons — Start Free Trial is the solid primary */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="gap-2 text-base h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 text-base h-12 px-6 border-border/60 hover:bg-card/50"
              >
                <Link href="#demo">
                  <Play className="w-4 h-4" />
                  See ApexGEO in Action
                </Link>
              </Button>
            </div>

            {/* Trust Bar — chips with pill treatment */}
            <div className="mt-10 pt-6 border-t border-border/30">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">
                Trusted by brands across Africa
              </p>
              <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                {TRUST_LOGOS.map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 rounded-md bg-card/60 border border-border/40 text-sm font-medium text-foreground/70"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content — Live GEO Score preview */}
          <div className="flex justify-center lg:justify-end">
            <GeoScorePreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function GeoScorePreview() {
  const score = 72;
  const trend = 12;
  return (
    <div className="relative w-full max-w-md">
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/25 via-accent-blue/20 to-accent-purple/25 rounded-3xl blur-2xl" />

      {/* Card */}
      <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-2xl shadow-primary/5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              GEO Score
            </p>
            <p className="text-sm font-medium text-foreground/80">
              mybrand.com
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
            <TrendingUp className="w-3 h-3" />
            +{trend}%
          </span>
        </div>

        {/* Score + Gauge */}
        <div className="flex items-center gap-5 mb-6">
          <Gauge value={score} />
          <div className="flex-1">
            <p className="text-5xl font-bold tabular-nums leading-none">
              {score}
              <span className="text-xl text-muted-foreground">/100</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Above average — top 22%
            </p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="space-y-2.5 mb-5">
          {SUBSCORES.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">{s.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.value}%`,
                    background: `linear-gradient(90deg, hsl(${s.color}) 0%, hsl(${s.color} / 0.6) 100%)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI Platform share-of-answer */}
        <div className="pt-4 border-t border-border/40">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Share of Answer
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/30"
              >
                <span className="text-xs text-foreground/80">{p.name}</span>
                <span className="text-xs font-semibold tabular-nums text-primary">
                  {p.share}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const size = 112;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="50%" stopColor="hsl(var(--accent-blue))" />
          <stop offset="100%" stopColor="hsl(var(--accent-purple))" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeOpacity="0.3"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
