/**
 * AI Platform Query Service
 *
 * Implements real AI platform queries to gather brand mentions for the Engine Room.
 * Uses official APIs for ChatGPT, Claude, Gemini, Perplexity, and DeepSeek.
 *
 * This service is called by geo-monitor.ts to populate brand_mentions table.
 */

import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// Types
// ============================================================================

export interface AIPlatformMention {
  platform:
    | "chatgpt"
    | "claude"
    | "gemini"
    | "perplexity"
    | "grok"
    | "deepseek"
    | "copilot";
  query: string;
  response: string;
  sentiment: "positive" | "neutral" | "negative";
  position: number | null;
  citationUrl: string | null;
  competitors: CompetitorMention[];
  promptCategory: string;
  topics: string[];
  metadata: {
    modelVersion: string;
    responseLength: number;
    confidenceScore: number;
  };
}

export interface CompetitorMention {
  name: string;
  position: number;
  sentiment: "positive" | "neutral" | "negative";
}

interface QueryTemplate {
  category: string;
  prompts: string[];
}

// ============================================================================
// API Clients (initialized lazily)
// ============================================================================

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

// ============================================================================
// Query Templates
// ============================================================================

const QUERY_TEMPLATES: Record<string, QueryTemplate> = {
  comparison: {
    category: "comparison",
    prompts: [
      "What are the best {industry} companies in {region}?",
      "Compare {brand} to its competitors",
      "Who are the top players in {industry}?",
      "Which {industry} company has the best reputation?",
    ],
  },
  recommendation: {
    category: "recommendation",
    prompts: [
      "Recommend a reliable {industry} company",
      "Where should I look for {product_category} services?",
      "What's the most trusted {industry} platform?",
      "Best company for {product_category}?",
    ],
  },
  review: {
    category: "review",
    prompts: [
      "Is {brand} a good company?",
      "What do people think about {brand}'s service?",
      "How reliable is {brand}?",
      "Tell me about {brand}'s customer satisfaction",
    ],
  },
  general: {
    category: "general",
    prompts: [
      "Tell me about {brand}",
      "What is {brand} known for?",
      "Who are the main competitors to {brand}?",
      "How does {brand} compare to others?",
    ],
  },
};

// ============================================================================
// Sentiment Analysis
// ============================================================================

/**
 * Analyze sentiment of AI response mentioning the brand
 * Uses keyword matching and context analysis
 */
function analyzeSentiment(
  response: string,
  brandName: string
): "positive" | "neutral" | "negative" {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  // Check if brand is mentioned
  if (!lowerResponse.includes(lowerBrand)) {
    return "neutral";
  }

  // Positive indicators
  const positiveWords = [
    "leading",
    "best",
    "excellent",
    "reliable",
    "trusted",
    "premier",
    "top",
    "quality",
    "outstanding",
    "recommended",
    "highly regarded",
    "reputation",
    "popular",
    "favorite",
    "competitive",
  ];

  // Negative indicators
  const negativeWords = [
    "poor",
    "bad",
    "worst",
    "unreliable",
    "complaints",
    "issues",
    "problems",
    "disappointing",
    "avoid",
    "concerning",
    "mixed reviews",
    "slow",
  ];

  const positiveCount = positiveWords.filter((word) =>
    lowerResponse.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    lowerResponse.includes(word)
  ).length;

  if (positiveCount > negativeCount + 1) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Extract position of brand mention in response (if it's a list/ranking)
 */
function extractPosition(response: string, brandName: string): number | null {
  const lines = response.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes(brandName.toLowerCase())) {
      // Check if line starts with a number or bullet point
      const match = line.match(/^(\d+)[.)\s]/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }
  return null; // Not in a ranked list
}

/**
 * Extract competitor mentions from response
 */
function extractCompetitors(
  response: string,
  brandName: string
): CompetitorMention[] {
  const competitors: CompetitorMention[] = [];
  const lines = response.split("\n");

  const commonCompetitorKeywords = [
    "amazon",
    "walmart",
    "ebay",
    "shopify",
    "makro",
    "game",
    "alibaba",
    "target",
  ];

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();

    // Skip the line if it mentions the brand itself
    if (lowerLine.includes(brandName.toLowerCase())) return;

    commonCompetitorKeywords.forEach((competitor) => {
      if (lowerLine.includes(competitor)) {
        // Extract position if it's a numbered list
        const match = line.match(/^(\d+)[.)\s]/);
        const position = match ? parseInt(match[1], 10) : index + 1;

        competitors.push({
          name: competitor.charAt(0).toUpperCase() + competitor.slice(1),
          position,
          sentiment: analyzeSentiment(line, competitor),
        });
      }
    });
  });

  return competitors;
}

// ============================================================================
// Platform Query Functions
// ============================================================================

/**
 * Query ChatGPT (OpenAI GPT-4)
 */
export async function queryChatGPT(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  try {
    const client = getOpenAIClient();

    // Generate query from template
    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const completion = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "";

    if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
      return null; // Brand not mentioned
    }

    return {
      platform: "chatgpt",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position: extractPosition(response, brandName),
      citationUrl: null, // ChatGPT doesn't provide citations by default
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "online shopping"],
      metadata: {
        modelVersion: "GPT-4 Turbo",
        responseLength: response.length,
        confidenceScore: 0.85,
      },
    };
  } catch (error) {
    console.error("ChatGPT query error:", error);
    return null;
  }
}

/**
 * Query Claude (Anthropic)
 */
export async function queryClaude(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  try {
    const client = getAnthropicClient();

    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    return {
      platform: "claude",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position: extractPosition(response, brandName),
      citationUrl: null,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "retail"],
      metadata: {
        modelVersion: "Claude 3.5 Sonnet",
        responseLength: response.length,
        confidenceScore: 0.9,
      },
    };
  } catch (error) {
    console.error("Claude query error:", error);
    return null;
  }
}

/**
 * Query Gemini (Google AI)
 */
export async function queryGemini(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const result = await model.generateContent(query);
    const response = result.response.text();

    if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    return {
      platform: "gemini",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position: extractPosition(response, brandName),
      citationUrl: null,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "south africa"],
      metadata: {
        modelVersion: "Gemini 1.5 Pro",
        responseLength: response.length,
        confidenceScore: 0.8,
      },
    };
  } catch (error) {
    console.error("Gemini query error:", error);
    return null;
  }
}

/**
 * Query Perplexity (using OpenAI-compatible API)
 */
export async function queryPerplexity(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.warn("PERPLEXITY_API_KEY not configured, skipping");
      return null;
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.perplexity.ai",
    });

    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const completion = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content || "";

    if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    // Perplexity often includes citations
    const citationMatch = response.match(/\[(\d+)\]/);
    const citationUrl = citationMatch ? `https://www.${brandName.toLowerCase()}.com` : null;

    return {
      platform: "perplexity",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position: extractPosition(response, brandName),
      citationUrl,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "online shopping", "south africa"],
      metadata: {
        modelVersion: "Perplexity Pro",
        responseLength: response.length,
        confidenceScore: 0.85,
      },
    };
  } catch (error) {
    console.error("Perplexity query error:", error);
    return null;
  }
}

/**
 * Query DeepSeek (using OpenAI-compatible API)
 */
export async function queryDeepSeek(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn("DEEPSEEK_API_KEY not configured, skipping");
      return null;
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || "";

    if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    return {
      platform: "deepseek",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position: extractPosition(response, brandName),
      citationUrl: null,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce"],
      metadata: {
        modelVersion: "DeepSeek V3",
        responseLength: response.length,
        confidenceScore: 0.75,
      },
    };
  } catch (error) {
    console.error("DeepSeek query error:", error);
    return null;
  }
}

/**
 * Query Grok (X.AI)
 *
 * Uses X.AI API (Grok) for AI-powered brand mention detection.
 * Requires GROK_API_KEY environment variable.
 *
 * Note: X.AI API is currently in limited access. If API key is not set,
 * this function will return null without attempting a request.
 *
 * @see https://docs.x.ai/api for API documentation
 */
export async function queryGrok(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

  if (!apiKey) {
    // Silently return null if Grok/X.AI API is not configured
    // This is expected in most deployments
    return null;
  }

  try {
    // Generate query from template (same pattern as other platforms)
    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    // X.AI API endpoint (similar to OpenAI format)
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Provide accurate, informative responses.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Grok API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";

    // Check if brand is mentioned
    if (!aiResponse || !aiResponse.toLowerCase().includes(brandName.toLowerCase())) {
      return null; // Brand not mentioned
    }

    // Extract first URL from response (if any)
    const urlMatch = aiResponse.match(/https?:\/\/[^\s)]+/);
    const citationUrl = urlMatch ? urlMatch[0] : null;

    return {
      platform: "grok",
      query,
      response: aiResponse,
      sentiment: analyzeSentiment(aiResponse, brandName),
      position: extractPosition(aiResponse, brandName),
      citationUrl,
      competitors: extractCompetitors(aiResponse, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "technology"],
      metadata: {
        modelVersion: data.model || "grok-beta",
        responseLength: aiResponse.length,
        confidenceScore: 0.75,
      },
    };
  } catch (error) {
    console.error("Grok query error:", error);
    return null;
  }
}

/**
 * Query Microsoft Copilot
 *
 * Uses Azure OpenAI API for Copilot integration.
 * Requires AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.
 *
 * @param brandName - Brand name to search for
 * @param keyword - Keyword context for the query
 * @param queryTemplate - Query template to use
 * @returns AIPlatformMention if successful, null otherwise
 */
export async function queryCopilot(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";

  if (!apiKey || !endpoint) {
    // Silently return null if credentials not configured
    return null;
  }

  try {
    // Generate query from template
    const promptIndex = Math.floor(Math.random() * queryTemplate.prompts.length);
    const query = queryTemplate.prompts[promptIndex]
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const apiUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant providing accurate information about products, services, and brands.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Copilot API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      console.warn("No response from Copilot API");
      return null;
    }

    const aiResponse = data.choices[0].message.content;

    // Check if brand is mentioned
    if (!aiResponse.toLowerCase().includes(brandName.toLowerCase())) {
      return null; // Brand not mentioned
    }

    // Extract citation if any URL is mentioned
    const urlMatch = aiResponse.match(/https?:\/\/[^\s)]+/);
    const citationUrl = urlMatch ? urlMatch[0] : null;

    return {
      platform: "copilot",
      query,
      response: aiResponse,
      sentiment: analyzeSentiment(aiResponse, brandName),
      position: extractPosition(aiResponse, brandName),
      citationUrl,
      competitors: extractCompetitors(aiResponse, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "technology"],
      metadata: {
        modelVersion: deploymentName,
        responseLength: aiResponse.length,
        confidenceScore: 0.75,
      },
    };
  } catch (error) {
    console.error("Copilot query error:", error);
    return null;
  }
}

// ============================================================================
// Platform Router
// ============================================================================

/**
 * Query an AI platform with a specific template
 */
export async function queryAIPlatform(
  platform: string,
  brandName: string,
  keyword: string
): Promise<AIPlatformMention | null> {
  // Select a random query template
  const templateKeys = Object.keys(QUERY_TEMPLATES);
  const randomTemplate =
    QUERY_TEMPLATES[templateKeys[Math.floor(Math.random() * templateKeys.length)]];

  switch (platform.toLowerCase()) {
    case "chatgpt":
      return queryChatGPT(brandName, keyword, randomTemplate);
    case "claude":
      return queryClaude(brandName, keyword, randomTemplate);
    case "gemini":
      return queryGemini(brandName, keyword, randomTemplate);
    case "perplexity":
      return queryPerplexity(brandName, keyword, randomTemplate);
    case "grok":
      return queryGrok(brandName, keyword, randomTemplate);
    case "deepseek":
      return queryDeepSeek(brandName, keyword, randomTemplate);
    case "copilot":
      return queryCopilot(brandName, keyword, randomTemplate);
    default:
      console.warn(`Unknown platform: ${platform}`);
      return null;
  }
}

/**
 * Batch query all platforms for a brand
 * Returns array of successful mentions
 */
export async function queryAllPlatforms(
  brandName: string,
  platforms: string[],
  keyword: string
): Promise<AIPlatformMention[]> {
  const mentions: AIPlatformMention[] = [];

  for (const platform of platforms) {
    try {
      const mention = await queryAIPlatform(platform, brandName, keyword);
      if (mention) {
        mentions.push(mention);
      }
    } catch (error) {
      console.error(`Error querying ${platform}:`, error);
    }
  }

  return mentions;
}
