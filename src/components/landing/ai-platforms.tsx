"use client";

const platforms = [
  {
    name: "ChatGPT",
    description: "OpenAI's GPT-4 and GPT-4 Turbo",
    color: "#10A37F",
    icon: "🤖",
  },
  {
    name: "Claude",
    description: "Anthropic's Claude 3 Opus & Sonnet",
    color: "#D97757",
    icon: "🧠",
  },
  {
    name: "Gemini",
    description: "Google's Gemini Pro & Ultra",
    color: "#4285F4",
    icon: "💎",
  },
  {
    name: "Perplexity",
    description: "Real-time AI search engine",
    color: "#20B8CD",
    icon: "🔍",
  },
  {
    name: "Grok",
    description: "xAI's real-time assistant",
    color: "#FFFFFF",
    icon: "⚡",
  },
  {
    name: "DeepSeek",
    description: "Advanced reasoning AI",
    color: "#6366F1",
    icon: "🌊",
  },
  {
    name: "Copilot",
    description: "Microsoft's AI assistant",
    color: "#0078D4",
    icon: "✈️",
  },
];

export function AIPlatforms() {
  return (
    <section className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-blue/10 text-[hsl(var(--accent-blue))] text-sm font-medium mb-4">
            Platform Coverage
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Monitor{" "}
            <span className="bg-gradient-to-r from-accent-blue to-primary bg-clip-text text-transparent">
              Every AI Engine
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your brand presence across all major AI platforms. Real-time monitoring with automated alerts.
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="card-tertiary text-center group cursor-pointer"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${platform.color}15` }}
              >
                {platform.icon}
              </div>

              {/* Name */}
              <h4 className="font-semibold text-sm mb-1">{platform.name}</h4>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Live</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">7+</div>
            <div className="text-sm text-muted-foreground">AI Platforms</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">&lt;1m</div>
            <div className="text-sm text-muted-foreground">Alert Speed</div>
          </div>
        </div>
      </div>
    </section>
  );
}
