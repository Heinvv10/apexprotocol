'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Brain,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Sparkles,
  Quote,
} from 'lucide-react';

const sampleBrands = [
  {
    id: 1,
    name: 'Shoprite Group',
    domain: 'shoprite.co.za',
    geoScore: 74,
    aiPlatforms: '5 of 7',
    shareOfAnswer: 31,
    topEngine: 'ChatGPT',
    citationRate: 18,
    trend: +9,
    trendingUp: true,
    topQueries: [
      'best grocery delivery South Africa',
      'affordable supermarkets near me',
      'Checkers vs Woolworths comparison',
    ],
  },
  {
    id: 2,
    name: 'Discovery Ltd',
    domain: 'discovery.co.za',
    geoScore: 88,
    aiPlatforms: '6 of 7',
    shareOfAnswer: 47,
    topEngine: 'Perplexity',
    citationRate: 34,
    trend: +14,
    trendingUp: true,
    topQueries: [
      'best medical aid South Africa',
      'health insurance comparison Africa',
      'Discovery Vitality rewards explained',
    ],
  },
  {
    id: 3,
    name: 'Takealot',
    domain: 'takealot.com',
    geoScore: 91,
    aiPlatforms: '7 of 7',
    shareOfAnswer: 52,
    topEngine: 'Gemini',
    citationRate: 41,
    trend: +18,
    trendingUp: true,
    topQueries: [
      'best online shopping South Africa',
      'where to buy electronics SA',
      'Takealot vs Amazon SA delivery',
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
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

export function DemoMode() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [selectedBrand, setSelectedBrand] = useState(sampleBrands[0]);

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
            See the power in action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore AI visibility analytics powered by ApexGEO intelligence
          </p>
        </motion.div>

        {/* Demo Interface */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Brand Selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            {sampleBrands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedBrand.id === brand.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border/40 bg-card hover:border-border'
                }`}
              >
                <p className="font-semibold text-foreground">{brand.name}</p>
                <p className="text-sm text-muted-foreground">
                  {brand.domain}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-primary font-medium">
                    GEO Score: {brand.geoScore}
                  </span>
                  {brand.trendingUp && (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  )}
                </div>
              </button>
            ))}
          </motion.div>

          {/* Data Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
            }
            transition={{ duration: 0.5, delay: 0.1 }}
            key={selectedBrand.id}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
              {/* Brand Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedBrand.name}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {selectedBrand.domain} &middot; Tracked across{' '}
                    {selectedBrand.aiPlatforms} AI engines
                  </p>
                </div>
                {selectedBrand.trendingUp && (
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20"
                  >
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-500">
                      +{selectedBrand.trend}% this month
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* GEO Score */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="p-6 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      GEO Score
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-foreground">
                    {selectedBrand.geoScore}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    out of 100
                  </p>
                </motion.div>

                {/* Share of Answer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="p-6 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      Share of Answer
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-foreground">
                    {selectedBrand.shareOfAnswer}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    brand mentioned in AI responses
                  </p>
                </motion.div>

                {/* Citation Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-6 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      Citation Rate
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-foreground">
                    {selectedBrand.citationRate}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    cited with source link
                  </p>
                </motion.div>

                {/* Top AI Engine */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="p-6 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      Top AI Engine
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {selectedBrand.topEngine}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    highest brand visibility
                  </p>
                </motion.div>
              </div>

              {/* Top Queries */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={
                  inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h4 className="font-semibold text-foreground mb-3">
                  Top AI Queries Mentioning Brand
                </h4>
                <div className="space-y-2">
                  {selectedBrand.topQueries.map((query, idx) => (
                    <motion.div
                      key={query}
                      initial={{ opacity: 0, x: -10 }}
                      animate={
                        inView
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: -10 }
                      }
                      transition={{
                        duration: 0.3,
                        delay: 0.45 + idx * 0.05,
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/40"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        &ldquo;{query}&rdquo;
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={
                  inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.4, delay: 0.5 }}
                className="w-full mt-8 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors duration-200"
              >
                Analyze your brand
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-muted-foreground mt-12 text-sm"
        >
          Sample data for illustration. Sign up to analyze your own brand and
          competitors across all major AI engines.
        </motion.p>
      </div>
    </section>
  );
}
