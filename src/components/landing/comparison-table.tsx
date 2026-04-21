'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, X, Minus } from 'lucide-react';

type Support = 'full' | 'partial' | 'none';

interface Feature {
  name: string;
  traditional: Support;
  genericAI: Support;
  apex: Support;
}

interface Category {
  category: string;
  features: Feature[];
}

const comparisonData: Category[] = [
  {
    category: 'AI Search Visibility',
    features: [
      { name: 'GEO Score tracking across AI engines', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Multi-engine coverage (7 AI platforms)', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Share-of-answer analytics', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Citation tracking & attribution', traditional: 'none', genericAI: 'partial', apex: 'full' },
    ],
  },
  {
    category: 'Optimization & Strategy',
    features: [
      { name: 'AEO content optimization', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Structured data auditing', traditional: 'partial', genericAI: 'none', apex: 'full' },
      { name: 'Traditional keyword tracking', traditional: 'full', genericAI: 'none', apex: 'partial' },
      { name: 'Backlink analysis', traditional: 'full', genericAI: 'none', apex: 'none' },
    ],
  },
  {
    category: 'Market Intelligence',
    features: [
      { name: 'Competitor AI visibility benchmarking', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Africa-market focus & local context', traditional: 'none', genericAI: 'none', apex: 'full' },
      { name: 'Brand sentiment in AI responses', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Traditional SERP tracking', traditional: 'full', genericAI: 'none', apex: 'partial' },
    ],
  },
  {
    category: 'Platform & Reporting',
    features: [
      { name: 'AI-ready content recommendations', traditional: 'none', genericAI: 'partial', apex: 'full' },
      { name: 'Automated visibility reports', traditional: 'full', genericAI: 'partial', apex: 'full' },
      { name: 'API access', traditional: 'full', genericAI: 'partial', apex: 'full' },
      { name: 'Visual proof-of-presence (screenshots)', traditional: 'none', genericAI: 'none', apex: 'full' },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.21, 1.02, 0.73, 1] as [number, number, number, number],
    },
  },
};

function FullSupport() {
  return (
    <Check className="h-5 w-5 text-emerald-500" strokeWidth={3} />
  );
}

function PartialSupport() {
  return (
    <Minus className="h-5 w-5 text-yellow-500" strokeWidth={3} />
  );
}

function NoSupport() {
  return (
    <X className="h-5 w-5 text-muted-foreground/40" strokeWidth={3} />
  );
}

function SupportIcon({ support }: { support: Support }) {
  switch (support) {
    case 'full':
      return <FullSupport />;
    case 'partial':
      return <PartialSupport />;
    case 'none':
      return <NoSupport />;
  }
}

export function ComparisonTable() {
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
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What makes ApexGEO different
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Traditional SEO tools weren&apos;t built for AI search. Generic monitors only scratch the surface.
            ApexGEO is purpose-built for the generative engine era.
          </p>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
            Full support
          </span>
          <span className="flex items-center gap-1.5">
            <Minus className="h-4 w-4 text-yellow-500" strokeWidth={3} />
            Limited
          </span>
          <span className="flex items-center gap-1.5">
            <X className="h-4 w-4 text-muted-foreground/40" strokeWidth={3} />
            Not available
          </span>
        </motion.div>

        {/* Comparison Table */}
        <motion.div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-5 gap-4 mb-8 px-4 py-4 bg-card rounded-lg border border-border/40"
            >
              <div className="col-span-2">
                <p className="font-semibold text-foreground text-sm">Capability</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="font-semibold text-muted-foreground text-sm">Traditional SEO Tools</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="font-semibold text-muted-foreground text-sm">Generic AI Monitoring</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center px-3 py-1 rounded-full bg-primary/10">
                  <p className="font-bold text-primary text-sm">ApexGEO</p>
                </div>
              </div>
            </motion.div>

            {/* Categories and Features */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
            >
              {comparisonData.map((category) => (
                <div key={category.category} className="mb-8">
                  {/* Category Header */}
                  <motion.div
                    variants={rowVariants}
                    className="px-4 py-3 bg-primary/10 border-l-4 border-primary mb-2 rounded"
                  >
                    <h3 className="font-bold text-foreground text-sm">
                      {category.category}
                    </h3>
                  </motion.div>

                  {/* Feature Rows */}
                  {category.features.map((feature) => (
                    <motion.div
                      key={feature.name}
                      variants={rowVariants}
                      className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-border/40 hover:bg-card/60 transition-colors duration-200"
                    >
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-sm">{feature.name}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <SupportIcon support={feature.traditional} />
                      </div>
                      <div className="flex items-center justify-center">
                        <SupportIcon support={feature.genericAI} />
                      </div>
                      <div className="flex items-center justify-center">
                        <SupportIcon support={feature.apex} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Your customers are asking AI about you. Make sure the answers are right.
          </p>
          <button className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-200">
            Start optimizing your AI visibility
          </button>
        </motion.div>
      </div>
    </section>
  );
}
