'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Camera, Clock, Eye, Search, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  {
    title: 'Automated AI Monitoring',
    description:
      'Queries AI engines — Perplexity, ChatGPT, Gemini, Grok, DeepSeek — with your brand terms on a schedule. No manual searching.',
    icon: Clock,
  },
  {
    title: 'Visual Evidence',
    description:
      'Full-page screenshots prove exactly how AI platforms present your brand. Timestamped, verifiable, and impossible to dispute.',
    icon: Camera,
  },
  {
    title: 'Actionable Insights',
    description:
      'See which queries mention you, which don\'t, and what to fix. Turn AI visibility gaps into optimisation targets.',
    icon: Eye,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.21, 1.02, 0.73, 1] as [number, number, number, number],
    },
  },
};

export function PerplexitySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 mb-4">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Visual Proof Engine
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See how AI sees your brand
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Puppeteer-powered automation queries AI search engines for your brand terms
            and captures screenshot evidence of every mention, citation, and recommendation.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid gap-8 lg:grid-cols-3 mb-16"
        >
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                className="bg-card/60 rounded-xl p-8 border border-border/40"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Mock Browser Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl p-px overflow-hidden shadow-2xl shadow-primary/5 bg-gradient-to-br from-primary/20 via-border/60 to-border/20"
        >
          <div className="bg-card rounded-2xl overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-card border-b border-border/40 rounded-t-2xl p-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-background border border-border/40 text-xs text-muted-foreground font-mono">
                  <Search className="h-3 w-3" />
                  perplexity.ai
                </div>
              </div>
            </div>

            {/* Perplexity-style Content */}
            <div className="bg-background p-8 min-h-[28rem]">
              {/* Search Query */}
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">
                    &quot;Best fibre internet providers in Johannesburg&quot;
                  </p>
                </div>

                {/* AI Response */}
                <div className="space-y-4 mb-8">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    Based on recent reviews and coverage data, the top fibre providers
                    in Johannesburg include:
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        1. <span className="text-primary">YourBrand Fibre</span> —
                        Recommended for speed and reliability
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cited from yourbrand.co.za, TechCentral, MyBroadband
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-card/60 border border-border/40"
                  >
                    <span className="text-muted-foreground text-sm flex-shrink-0 mt-0.5 w-5 text-center">2.</span>
                    <div>
                      <p className="text-sm text-foreground/70">
                        Competitor A — Good coverage in northern suburbs
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cited from competitora.co.za
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-card/60 border border-border/40"
                  >
                    <span className="text-muted-foreground text-sm flex-shrink-0 mt-0.5 w-5 text-center">3.</span>
                    <div>
                      <p className="text-sm text-foreground/70">
                        Competitor B — Budget-friendly options
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cited from competitorb.co.za
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Capture Metadata */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1 }}
                  className="flex items-center justify-between pt-4 border-t border-border/30"
                >
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-primary" />
                      Screenshot captured
                    </span>
                    <span>2026-04-21 09:14:22 UTC</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Brand detected
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Know exactly how AI platforms talk about your brand.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-200 shadow-lg shadow-primary/20"
          >
            See your brand through AI&apos;s eyes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      {/* Accent glow */}
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary/5 opacity-40 blur-3xl" />
    </section>
  );
}
