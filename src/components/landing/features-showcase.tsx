"use client";

import {
  Gauge,
  Brain,
  Radio,
  FileSearch,
  Wand2,
  Plug,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const features = [
  {
    icon: Gauge,
    title: "GEO Score Dashboard",
    description: "Your central metric for AI visibility. Technical (30%), Content (35%), and AEO (35%) sub-scores with trend analysis.",
    highlight: "Real-time scoring",
    gradient: "from-primary to-accent-blue",
  },
  {
    icon: Brain,
    title: "Smart Recommendations",
    description: "Auto-generated, prioritized actions based on Impact, Confidence, and Effort. Know exactly what to fix first.",
    highlight: "AI-Prioritized",
    gradient: "from-accent-purple to-accent-pink",
  },
  {
    icon: Radio,
    title: "AI Visibility Monitor",
    description: "Track mentions across ChatGPT, Claude, Gemini, Perplexity, Grok, and DeepSeek. Real-time alerts and competitor tracking.",
    highlight: "7+ AI Platforms",
    gradient: "from-accent-blue to-primary",
  },
  {
    icon: FileSearch,
    title: "Technical Site Audit",
    description: "Schema.org validation, structured data testing, content analysis, entity extraction, and Core Web Vitals.",
    highlight: "50+ Technical Checks",
    gradient: "from-success to-primary",
  },
  {
    icon: Wand2,
    title: "Content Generator",
    description: "AI-optimized FAQs, How-to guides, and articles. Built with your brand voice to maximize AI citations.",
    highlight: "Brand-Aligned Content",
    gradient: "from-accent-pink to-accent-purple",
  },
  {
    icon: Plug,
    title: "Integration Hub",
    description: "Connect with Jira, Trello, Slack, WhatsApp, Google Analytics, and Search Console. Seamless workflow integration.",
    highlight: "15+ Integrations",
    gradient: "from-warning to-accent-purple",
  },
];

export function FeaturesShowcase() {
  return (
    <section id="features" className="py-24 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-card/50 via-background to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Tools for{" "}
            <span className="bg-gradient-to-r from-primary via-accent-purple to-accent-pink bg-clip-text text-transparent">
              AI Dominance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature designed to maximize your visibility in AI-powered search engines.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-secondary group relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient Accent Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} opacity-50 group-hover:opacity-100 transition-opacity`}
              />

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Highlight Tag */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/5 text-primary text-xs font-medium">
                {feature.highlight}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-up">
              Explore All Features
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
