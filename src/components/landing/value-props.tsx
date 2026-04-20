"use client";

import { Brain, Target, Shield, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Pillar = {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
  kpi: string;
};

const INTELLIGENCE: Pillar = {
  number: "01",
  icon: Brain,
  title: "Intelligence",
  body: "Real-time decoding of how generative engines perceive, retrieve, and recommend your brand.",
  kpi: "7 engines tracked",
};

const OTHERS: Pillar[] = [
  {
    number: "02",
    icon: Target,
    title: "Precision",
    body: "Impact × Confidence × Effort prioritization so you fix what moves the needle first.",
    kpi: "3x ROI lift",
  },
  {
    number: "03",
    icon: Shield,
    title: "Authority",
    body: "Structured data, citations, and entity signals AI engines learn to trust.",
    kpi: "50+ schema checks",
  },
  {
    number: "04",
    icon: Zap,
    title: "Innovation",
    body: "The platform adapts as every AI search engine evolves — you stay ahead.",
    kpi: "Weekly model updates",
  },
];

const PLATFORM_PULSES = [
  { label: "ChatGPT", value: 85 },
  { label: "Claude", value: 72 },
  { label: "Perplexity", value: 91 },
  { label: "Gemini", value: 68 },
  { label: "Grok", value: 54 },
  { label: "DeepSeek", value: 41 },
];

export function ValueProps() {
  return (
    <section id="platform" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
            Pillars
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            What We <span className="text-primary">Stand For</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            The principles that drive every Apex feature, score, and
            recommendation.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {/* Featured: Intelligence (2 cols) */}
          <FeaturedPillar pillar={INTELLIGENCE} platforms={PLATFORM_PULSES} />

          {/* Side stack (1 col, 3 rows) */}
          <div className="grid gap-4">
            {OTHERS.map((pillar) => (
              <SidePillar key={pillar.title} pillar={pillar} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedPillar({
  pillar,
  platforms,
}: {
  pillar: Pillar;
  platforms: { label: string; value: number }[];
}) {
  const Icon = pillar.icon;
  return (
    <div className="lg:col-span-2 relative group overflow-hidden rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm p-7 md:p-9 flex flex-col">
      {/* Accent glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-primary/60">
            {pillar.number}
          </span>
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
          {pillar.kpi}
        </span>
      </div>

      {/* Title + Body */}
      <h3 className="text-2xl md:text-3xl font-semibold mb-2 relative z-10">
        {pillar.title}
      </h3>
      <p className="text-muted-foreground text-base max-w-md mb-6 relative z-10">
        {pillar.body}
      </p>

      {/* Mini platform pulse viz */}
      <div className="mt-auto pt-4 border-t border-border/40 relative z-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Live platform coverage
        </p>
        <div className="grid grid-cols-3 gap-2">
          {platforms.map((p) => (
            <div key={p.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-foreground/80">{p.label}</span>
                <span className="text-xs font-medium tabular-nums text-primary">
                  {p.value}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${p.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidePillar({ pillar }: { pillar: Pillar }) {
  const Icon = pillar.icon;
  return (
    <div className="relative group rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all hover:border-primary/40 hover:bg-card/70">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xs font-mono text-primary/60 mt-1">
          {pillar.number}
        </span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{pillar.title}</h3>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
              {pillar.kpi}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed pl-[44px]">
        {pillar.body}
      </p>
    </div>
  );
}
