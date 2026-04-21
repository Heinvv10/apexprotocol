"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const EASE = [0.21, 1.02, 0.73, 1] as [number, number, number, number];

const blurReveal = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 8 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.6 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

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
            <motion.span
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-5"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              GEO / AEO Platform · Africa-first
            </motion.span>

            {/* Headline — blur reveal */}
            <motion.h1
              variants={blurReveal}
              initial="hidden"
              animate="show"
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5"
            >
              <span className="block text-foreground">Be the Answer.</span>
              <span className="block text-primary">Not Just A Result.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              custom={0.25}
              initial="hidden"
              animate="show"
              className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-7"
            >
              Track, optimize, and amplify your brand&apos;s presence across
              ChatGPT, Claude, Gemini, Perplexity, Grok and DeepSeek — with a
              dashboard-first workflow built for African markets.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              custom={0.4}
              initial="hidden"
              animate="show"
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.03, boxShadow: "0 8px 28px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
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
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
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
              </motion.div>
            </motion.div>

            {/* Trust Bar — stagger in */}
            <motion.div
              variants={fadeUp}
              custom={0.55}
              initial="hidden"
              animate="show"
              className="mt-10 pt-6 border-t border-border/30"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">
                Trusted by brands across Africa
              </p>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="flex flex-wrap items-center gap-2 justify-center lg:justify-start"
              >
                {TRUST_LOGOS.map((name) => (
                  <motion.span
                    key={name}
                    variants={staggerItem}
                    className="px-3 py-1.5 rounded-md bg-card/60 border border-border/40 text-sm font-medium text-foreground/70"
                  >
                    {name}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Right Content — Live GEO Score preview */}
          <motion.div
            variants={fadeUp}
            custom={0.2}
            initial="hidden"
            animate="show"
            className="flex justify-center lg:justify-end"
          >
            <GeoScorePreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Animated count-up hook
// ---------------------------------------------------------------------------

function useCountUp(target: number, duration = 1.4, delay = 0.8) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionVal.set(target), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, target, motionVal, delay]);

  return { ref, display };
}

// ---------------------------------------------------------------------------
// GEO Score Preview card
// ---------------------------------------------------------------------------

function GeoScorePreview() {
  const score = 72;
  const trend = 12;
  const { ref: scoreRef, display: scoreDisplay } = useCountUp(score, 1.2, 0.6);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true });

  return (
    <div ref={cardRef} className="relative w-full max-w-md">
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/25 via-accent-blue/20 to-accent-purple/25 rounded-3xl blur-2xl" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.21, 1.02, 0.73, 1] }}
        className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-2xl shadow-primary/5"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              GEO Score
            </p>
            <p className="text-sm font-medium text-foreground/80">mybrand.com</p>
          </div>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.3, type: "spring" }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold"
          >
            <TrendingUp className="w-3 h-3" />
            +{trend}%
          </motion.span>
        </div>

        {/* Score + Gauge */}
        <div className="flex items-center gap-5 mb-6">
          <AnimatedGauge value={score} animate={inView} />
          <div className="flex-1">
            <p className="text-5xl font-bold tabular-nums leading-none">
              <motion.span ref={scoreRef}>{scoreDisplay}</motion.span>
              <span className="text-xl text-muted-foreground">/100</span>
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1.6 }}
              className="text-sm text-muted-foreground mt-1"
            >
              Above average — top 22%
            </motion.p>
          </div>
        </div>

        {/* Sub-scores — bars animate in */}
        <div className="space-y-2.5 mb-5">
          {SUBSCORES.map((s, i) => (
            <SubScoreBar key={s.label} {...s} animate={inView} delay={0.9 + i * 0.12} />
          ))}
        </div>

        {/* AI Platform share-of-answer */}
        <div className="pt-4 border-t border-border/40">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Share of Answer
          </p>
          <motion.div
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07, delayChildren: 1.4 } },
            }}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="grid grid-cols-2 gap-2"
          >
            {PLATFORMS.map((p) => (
              <motion.div
                key={p.name}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/30"
              >
                <span className="text-xs text-foreground/80">{p.name}</span>
                <PlatformShare value={p.share} animate={inView} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-score bar with animated width
// ---------------------------------------------------------------------------

function SubScoreBar({
  label,
  value,
  color,
  animate,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  animate: boolean;
  delay: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={animate ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 0.9, delay, ease: EASE }}
          style={{
            background: `linear-gradient(90deg, hsl(${color}) 0%, hsl(${color} / 0.6) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Platform share — count-up
// ---------------------------------------------------------------------------

function PlatformShare({ value, animate }: { value: number; animate: boolean }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 900, bounce: 0 });
  const display = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => motionVal.set(value), 1500);
    return () => clearTimeout(t);
  }, [animate, value, motionVal]);

  return (
    <motion.span className="text-xs font-semibold tabular-nums text-primary">
      {display}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Animated SVG Gauge
// ---------------------------------------------------------------------------

function AnimatedGauge({ value, animate }: { value: number; animate: boolean }) {
  const size = 112;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="50%" stopColor="hsl(var(--accent-blue))" />
          <stop offset="100%" stopColor="hsl(var(--accent-purple))" />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeOpacity="0.3"
        strokeWidth={strokeWidth}
      />
      {/* Animated fill */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={animate ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
        transition={{ duration: 1.3, delay: 0.5, ease: [0.21, 1.02, 0.73, 1] }}
      />
    </svg>
  );
}
