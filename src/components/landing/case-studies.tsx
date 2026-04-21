'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Megaphone, ShoppingBag, Code2, ArrowRight, Search, BarChart3, FileText, Zap, Eye, GitCompare } from 'lucide-react';
import Link from 'next/link';

const useCases = [
  {
    id: 1,
    title: 'Digital Agency',
    icon: Megaphone,
    scenario: 'Your clients want to know why their competitors keep showing up in ChatGPT and Perplexity answers — and they don\'t.',
    workflow: [
      { icon: Search, text: 'Run GEO audits across 6 AI engines to benchmark each client\'s current visibility' },
      { icon: BarChart3, text: 'Identify gaps in structured data, schema markup, and content that AI models use for citations' },
      { icon: Zap, text: 'Deliver optimization roadmaps that improve share-of-answer over time' },
    ],
    value: 'Turn AI visibility into a measurable, reportable service line. Show clients exactly where they rank in AI-generated responses and prove the impact of your optimization work.',
    keyFeatures: ['GEO Score benchmarking', 'Multi-engine tracking', 'Client reporting dashboards'],
  },
  {
    id: 2,
    title: 'E-commerce Brand',
    icon: ShoppingBag,
    scenario: 'Shoppers increasingly ask AI assistants for product recommendations. You need to know if your products are being mentioned — or if competitors are getting all the citations.',
    workflow: [
      { icon: Eye, text: 'Monitor product mentions across ChatGPT, Perplexity, and Gemini shopping recommendations' },
      { icon: BarChart3, text: 'Track citation rates by product category and compare against key competitors' },
      { icon: FileText, text: 'Optimize product descriptions, reviews, and content to increase AI recommendation frequency' },
    ],
    value: 'Capture the growing wave of AI-assisted shopping decisions. Understand which products get recommended, which don\'t, and what content changes drive more AI citations.',
    keyFeatures: ['Product mention tracking', 'Citation rate monitoring', 'Competitor share-of-voice'],
  },
  {
    id: 3,
    title: 'SaaS Company',
    icon: Code2,
    scenario: 'Prospects ask AI models "What\'s the best tool for X?" before they ever visit your site. If you\'re not in that answer, you\'re invisible at the top of the funnel.',
    workflow: [
      { icon: GitCompare, text: 'Track how AI models position you against competitors in category and comparison queries' },
      { icon: FileText, text: 'Optimize documentation, help content, and landing pages for AI-friendly citation patterns' },
      { icon: BarChart3, text: 'Monitor changes in AI sentiment and positioning after content updates' },
    ],
    value: 'Own your narrative in AI responses before competitors do. Understand exactly how AI models describe your product versus alternatives, and systematically improve your positioning.',
    keyFeatures: ['Competitive positioning alerts', 'Documentation optimization', 'AI sentiment tracking'],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.21, 1.02, 0.73, 1] as [number, number, number, number],
    },
  },
};

export function CaseStudies() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

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
          className="mx-auto max-w-2xl text-center mb-20"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How teams use ApexGEO
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From agencies to e-commerce to SaaS — any team that depends on being discovered can use ApexGEO to track and improve their AI visibility.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="space-y-12"
        >
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.id}
                variants={cardVariants}
                className="grid gap-0 lg:grid-cols-2 items-stretch bg-card rounded-2xl border border-border/40 overflow-hidden hover:border-border transition-colors duration-300"
              >
                {/* Left: Scenario & Workflow */}
                <div className="p-8 lg:p-10">
                  {/* Header */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {useCase.title}
                    </h3>
                  </div>

                  {/* Scenario */}
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    {useCase.scenario}
                  </p>

                  {/* Workflow */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">
                      Workflow
                    </h4>
                    {useCase.workflow.map((step, i) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <StepIcon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Value & Features */}
                <div className="p-8 lg:p-10 bg-card/60 border-t lg:border-t-0 lg:border-l border-border/40">
                  {/* Value */}
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
                      The value
                    </h4>
                    <p className="text-foreground leading-relaxed">
                      {useCase.value}
                    </p>
                  </div>

                  {/* Key Features */}
                  <div className="border-t border-border/40 pt-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
                      Key features used
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {useCase.keyFeatures.map((feature, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Whatever your team looks like, ApexGEO gives you the visibility AI search demands.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
          >
            See how ApexGEO works for your team
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-gradient-to-l from-primary/10 to-transparent opacity-40 blur-3xl" />
    </section>
  );
}
