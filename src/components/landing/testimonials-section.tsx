'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, TrendingUp } from 'lucide-react';

const EASE = [0.21, 1.02, 0.73, 1] as [number, number, number, number];

const testimonials = [
  {
    id: 1,
    quote:
      "We had zero visibility into how ChatGPT or Perplexity talked about our brand. Within two weeks of using ApexGEO, we identified three competitor brands being recommended instead of us \u2014 and fixed it. Our share of answer on Claude went from 12% to 41%.",
    author: 'Naledi Mokoena',
    title: 'Head of Digital',
    company: 'Firebird Agency, Johannesburg',
    rating: 5,
  },
  {
    id: 2,
    quote:
      "The GEO score breakdown showed us our structured data was solid but our content authority was holding us back. We focused on the recommendations ApexGEO surfaced and saw a measurable lift in brand mentions across Gemini and Perplexity within a month.",
    author: 'Ruan du Plessis',
    title: 'E-commerce Director',
    company: 'Karoo & Co, Cape Town',
    rating: 4,
  },
  {
    id: 3,
    quote:
      "As a fintech, trust signals in AI answers matter. ApexGEO tracks exactly when and how we're cited across ChatGPT, Claude, and DeepSeek. The weekly share-of-answer reports are now a standing agenda item in our growth meetings.",
    author: 'Priya Govender',
    title: 'Growth Marketing Lead',
    company: 'Zephyr Financial, Durban',
    rating: 5,
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
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: EASE,
    },
  },
};

export function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* Background gradient orb */}
      <div className="absolute top-0 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/15 to-transparent opacity-40 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Early adopters seeing results
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            How forward-thinking brands are using AI visibility data to get
            recommended, not just ranked.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid gap-8 lg:grid-cols-3"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:bg-card/80"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? 'fill-primary text-primary'
                        : 'fill-muted/30 text-muted/30'
                    }`}
                  />
                ))}
              </div>

              {/* Quote Mark */}
              <div className="mb-4">
                <svg
                  className="h-6 w-6 text-primary/30"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Quote Text */}
              <p className="text-foreground/80 leading-relaxed text-sm mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author Info */}
              <div className="border-t border-border/40 pt-4 mt-auto">
                <p className="font-semibold text-foreground text-sm">
                  {testimonial.author}
                </p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.title}, {testimonial.company}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-col items-center justify-center gap-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/40">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Join the brands making AI search work <span className="text-foreground font-medium">for</span> them, not against them
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
