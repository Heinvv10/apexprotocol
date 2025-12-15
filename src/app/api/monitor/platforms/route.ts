import { NextRequest, NextResponse } from "next/server";

/**
 * AI Platforms available for monitoring
 * These are the LLM platforms that can be monitored for brand mentions
 */
export const AI_PLATFORMS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    provider: "OpenAI",
    description: "OpenAI's conversational AI assistant",
    icon: "/icons/chatgpt.svg",
    apiEndpoint: "https://api.openai.com/v1",
    capabilities: ["text", "code", "analysis"],
    popularityRank: 1,
    monthlyUsers: "100M+",
  },
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    description: "Anthropic's helpful, harmless, and honest AI assistant",
    icon: "/icons/claude.svg",
    apiEndpoint: "https://api.anthropic.com/v1",
    capabilities: ["text", "code", "analysis", "documents"],
    popularityRank: 2,
    monthlyUsers: "50M+",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    description: "Google's multimodal AI model",
    icon: "/icons/gemini.svg",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1",
    capabilities: ["text", "code", "images", "video"],
    popularityRank: 3,
    monthlyUsers: "30M+",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    provider: "Perplexity",
    description: "AI-powered search engine with real-time information",
    icon: "/icons/perplexity.svg",
    apiEndpoint: "https://api.perplexity.ai",
    capabilities: ["search", "text", "citations"],
    popularityRank: 4,
    monthlyUsers: "20M+",
  },
  {
    id: "grok",
    name: "Grok",
    provider: "xAI",
    description: "xAI's conversational AI with real-time X data access",
    icon: "/icons/grok.svg",
    apiEndpoint: "https://api.x.ai/v1",
    capabilities: ["text", "realtime", "social"],
    popularityRank: 5,
    monthlyUsers: "10M+",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "DeepSeek",
    description: "Advanced AI model with strong coding capabilities",
    icon: "/icons/deepseek.svg",
    apiEndpoint: "https://api.deepseek.com",
    capabilities: ["text", "code", "math"],
    popularityRank: 6,
    monthlyUsers: "5M+",
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    provider: "Microsoft",
    description: "Microsoft's AI assistant powered by GPT-4",
    icon: "/icons/copilot.svg",
    apiEndpoint: "https://api.bing.microsoft.com",
    capabilities: ["text", "search", "images"],
    popularityRank: 7,
    monthlyUsers: "50M+",
  },
];

export type AIPlatform = (typeof AI_PLATFORMS)[number];
export type PlatformId = (typeof AI_PLATFORMS)[number]["id"];

/**
 * GET /api/monitor/platforms
 * Returns list of available AI platforms for monitoring
 */
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: AI_PLATFORMS,
      meta: {
        total: AI_PLATFORMS.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
