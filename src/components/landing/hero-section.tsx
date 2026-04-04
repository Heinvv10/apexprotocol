"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 bg-[#0a0f1a]" />

      {/* Aurora gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-gradient-to-br from-primary/30 via-accent-purple/20 to-transparent rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-accent-blue/25 via-primary/15 to-transparent rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-gradient-to-tr from-accent-purple/20 via-accent-blue/10 to-transparent rounded-full blur-[80px]" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Main Headline - Design Reference Style */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
              <span className="text-foreground">Be the Answer.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent-blue to-accent-purple bg-clip-text text-transparent">
                Not Just A Result.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Maximize Your Brand&apos;s Visibility Across AI-Powered Search. Track, optimize, and amplify your presence on ChatGPT, Claude, Gemini, and Perplexity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="gap-2 text-base h-12 px-8 bg-primary hover:bg-primary/90">
                <Link href="#demo">
                  See ApexGEO in Action
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 text-base h-12 px-8 border-border/50 hover:bg-card/50">
                <Link href="/sign-up">
                  <Play className="w-4 h-4" />
                  Start Free Trial
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-10 pt-8 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-4">Trusted by innovative brands across Africa</p>
              <div className="flex items-center gap-8 justify-center lg:justify-start opacity-50">
                <span className="text-lg font-medium">Vodacom</span>
                <span className="text-lg font-medium">Takealot</span>
                <span className="text-lg font-medium">Discovery</span>
              </div>
            </div>
          </div>

          {/* Right Content - 3D Isometric AI Cube Visualization */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-80 h-80 md:w-96 md:h-96">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent-blue/20 to-accent-purple/30 rounded-full blur-[60px]" />

              {/* 3D Isometric Cube with AI Platform Nodes */}
              <div className="relative w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <defs>
                    {/* Gradients for cube faces */}
                    <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="hsl(var(--accent-blue))" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--accent-purple))" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Main isometric cube */}
                  <g transform="translate(150, 150)">
                    {/* Left face */}
                    <polygon
                      points="-60,0 0,35 0,-35 -60,-70"
                      fill="url(#cubeLeft)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    {/* Right face */}
                    <polygon
                      points="60,0 0,35 0,-35 60,-70"
                      fill="url(#cubeRight)"
                      stroke="hsl(var(--accent-purple))"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    {/* Top face */}
                    <polygon
                      points="0,-105 -60,-70 0,-35 60,-70"
                      fill="url(#cubeTop)"
                      stroke="hsl(var(--accent-blue))"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                  </g>

                  {/* AI Platform Nodes orbiting the cube */}
                  {/* ChatGPT Node */}
                  <g transform="translate(60, 80)" filter="url(#glow)">
                    <circle r="20" fill="hsl(var(--card))" stroke="hsl(var(--success))" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="hsl(var(--success))" fontSize="8" fontWeight="600">GPT</text>
                  </g>

                  {/* Claude Node */}
                  <g transform="translate(240, 80)" filter="url(#glow)">
                    <circle r="20" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="hsl(var(--primary))" fontSize="8" fontWeight="600">Claude</text>
                  </g>

                  {/* Gemini Node */}
                  <g transform="translate(60, 220)" filter="url(#glow)">
                    <circle r="20" fill="hsl(var(--card))" stroke="hsl(var(--accent-blue))" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="hsl(var(--accent-blue))" fontSize="8" fontWeight="600">Gemini</text>
                  </g>

                  {/* Perplexity Node */}
                  <g transform="translate(240, 220)" filter="url(#glow)">
                    <circle r="20" fill="hsl(var(--card))" stroke="hsl(var(--accent-purple))" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="hsl(var(--accent-purple))" fontSize="7" fontWeight="600">Perplexity</text>
                  </g>

                  {/* Brand center node */}
                  <g transform="translate(150, 150)" filter="url(#glow)">
                    <circle r="24" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="700">Brand</text>
                  </g>

                  {/* Connection lines */}
                  <line x1="80" y1="80" x2="126" y2="126" stroke="hsl(var(--success))" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4,4" />
                  <line x1="220" y1="80" x2="174" y2="126" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4,4" />
                  <line x1="80" y1="220" x2="126" y2="174" stroke="hsl(var(--accent-blue))" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4,4" />
                  <line x1="220" y1="220" x2="174" y2="174" stroke="hsl(var(--accent-purple))" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4,4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
