"use client";

import { Brain, Target, Shield, Zap } from "lucide-react";

const pillars = [
  {
    icon: Brain,
    title: "Intelligence",
    description: "AI-powered insights that decode how generative engines perceive and recommend your brand. Real-time monitoring across 7+ platforms.",
    color: "primary",
  },
  {
    icon: Target,
    title: "Precision",
    description: "Laser-focused recommendations prioritized by impact. Know exactly what to optimize first for maximum AI visibility gains.",
    color: "accent-blue",
  },
  {
    icon: Shield,
    title: "Authority",
    description: "Build brand credibility that AI engines trust and cite. Establish your expertise through structured data and optimized content.",
    color: "accent-purple",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Stay ahead with cutting-edge GEO strategies. Our platform evolves as AI search engines evolve, keeping you at the forefront.",
    color: "success",
  },
];

export function ValueProps() {
  return (
    <section id="platform" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            What We{" "}
            <span className="bg-gradient-to-r from-primary via-accent-blue to-accent-purple bg-clip-text text-transparent">
              Stand For
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The pillars that drive our mission to maximize your AI visibility.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card with gradient border on hover */}
              <div className="relative p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm transition-all duration-300 hover:border-transparent hover:shadow-lg hover:shadow-primary/10">
                {/* Gradient border effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 via-accent-blue/10 to-accent-purple/20 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110
                    ${pillar.color === "primary" ? "bg-primary/10 text-primary" : ""}
                    ${pillar.color === "accent-blue" ? "bg-accent-blue/10 text-[hsl(var(--accent-blue))]" : ""}
                    ${pillar.color === "accent-purple" ? "bg-accent-purple/10 text-[hsl(var(--accent-purple))]" : ""}
                    ${pillar.color === "success" ? "bg-success/10 text-[hsl(var(--success))]" : ""}
                  `}
                >
                  <pillar.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{pillar.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
