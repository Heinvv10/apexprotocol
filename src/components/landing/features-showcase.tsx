"use client";

import {
  Gauge,
  Brain,
  Radio,
  FileSearch,
  Wand2,
  Plug,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  pill: string;
};

const FEATURED: Feature = {
  icon: Gauge,
  title: "GEO Score Dashboard",
  body: "Your single source of truth for AI visibility. Technical (30%) · Content (35%) · AEO (35%) sub-scores with trend analysis and alerting.",
  pill: "Real-time scoring",
};

const SUPPORTING: Feature[] = [
  {
    icon: Brain,
    title: "Smart Recommendations",
    body: "Auto-prioritized actions ranked by Impact × Confidence × Effort.",
    pill: "AI-prioritized",
  },
  {
    icon: Radio,
    title: "AI Visibility Monitor",
    body: "Mentions & citations across ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek.",
    pill: "7+ AI platforms",
  },
  {
    icon: FileSearch,
    title: "Technical Site Audit",
    body: "Schema, structured data, entity extraction, Core Web Vitals — continuously.",
    pill: "50+ checks",
  },
  {
    icon: Wand2,
    title: "Content Generator",
    body: "FAQs, how-tos, and articles written in your brand voice to maximize AI citations.",
    pill: "Brand-aligned",
  },
];

const INTEGRATION_HUB: Feature = {
  icon: Plug,
  title: "Integration Hub",
  body: "Jira, Trello, Linear, Slack, WhatsApp, Teams, Google Analytics, Search Console, Ahrefs — recommendations flow into the tools your team already uses.",
  pill: "15+ integrations",
};

const INTEGRATION_LOGOS = [
  "Jira",
  "Trello",
  "Linear",
  "Slack",
  "Teams",
  "WhatsApp",
  "Analytics",
  "Search Console",
  "Ahrefs",
];

const SUBSCORES = [
  { label: "Technical", value: 88 },
  { label: "Content", value: 74 },
  { label: "AEO", value: 69 },
];

const sectionVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 1.02, 0.73, 1] as [number, number, number, number] } },
};

export function FeaturesShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-card/50 via-background to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Powerful Tools for <span className="text-primary">AI Dominance</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature designed to maximize your visibility across AI search.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          ref={ref}
          variants={sectionVariants}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
        >
          <FeaturedCard feature={FEATURED} />
          <StandardCard feature={SUPPORTING[0]} />
          <StandardCard feature={SUPPORTING[1]} />
          <StandardCard feature={SUPPORTING[2]} />
          <StandardCard feature={SUPPORTING[3]} />
          <IntegrationHubCard feature={INTEGRATION_HUB} logos={INTEGRATION_LOGOS} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            See all 20+ features
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <motion.div variants={cardVariants} className="lg:col-span-2 relative group overflow-hidden rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-sm p-6 md:p-7">
      {/* Accent glow */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top row: pill + icon */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/15 text-primary text-xs font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {feature.pill}
        </span>
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center relative z-10">
        {/* Copy */}
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">
            {feature.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {feature.body}
          </p>
        </div>

        {/* Mini gauge */}
        <div className="rounded-xl bg-background/60 border border-border/50 p-4">
          <div className="flex items-center gap-4">
            <MiniGauge value={72} />
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">
                72
                <span className="text-sm text-muted-foreground font-normal">
                  /100
                </span>
              </p>
              <p className="text-xs text-success mt-1">▲ +12% this week</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {SUBSCORES.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">{s.value}</span>
                </div>
                <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StandardCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, boxShadow: "0 16px 36px rgba(0,0,0,0.14)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative group rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-primary/40 hover:bg-card/70"
    >
      {/* Pill on top — lead with proof */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">
          {feature.pill}
        </span>
        <div className="w-9 h-9 rounded-lg bg-muted/40 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.body}
      </p>
    </motion.div>
  );
}

function IntegrationHubCard({
  feature,
  logos,
}: {
  feature: Feature;
  logos: string[];
}) {
  const Icon = feature.icon;
  return (
    <motion.div variants={cardVariants} className="lg:col-span-3 relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-center">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
              {feature.pill}
            </span>
            <div className="w-9 h-9 rounded-lg bg-muted/40 text-primary flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-1.5">{feature.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            {feature.body}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end">
          {logos.map((logo) => (
            <span
              key={logo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/60 border border-border/40 text-xs font-medium text-foreground/80"
            >
              <CheckCircle2 className="w-3 h-3 text-success" />
              {logo}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MiniGauge({ value }: { value: number }) {
  const size = 72;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
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
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
