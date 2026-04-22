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
import { logger } from "@/lib/logger";

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
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
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
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
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
): "positive" | "neutral" | "negative" | "unrecognized" | "unrecognized" {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  // Check if brand is unrecognized by the AI
  const unrecognizedPhrases = [
    "don't have specific information",
    "don't have information",
    "do not have specific information",
    "do not have information",
    "i'm not aware of",
    "i am not aware of",
    "couldn't find information",
    "could not find information",
    "no specific information",
    "not familiar with",
    "unable to find information",
    "no information available",
    "i don't have data",
    "i do not have data",
    "not in my knowledge",
    "outside my knowledge",
    "not aware of a company",
    "cannot find any information",
    "can't find any information",
    "no record of",
    "doesn't appear in",
    "does not appear in",
  ];
  if (unrecognizedPhrases.some((phrase) => lowerResponse.includes(phrase))) {
    return "unrecognized";
  }

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
 * Derive a confidence score from real signals in the response. This replaces
 * the previous hardcoded per-platform constants (0.8/0.85/0.9) which gave the
 * GEO score pipeline fabricated metadata regardless of response quality.
 *
 * Signals, all bounded so the score stays in [0, 0.95]:
 *   - base 0.5 for any successful mention
 *   - +0.05 per brand-name occurrence in the response (capped at +0.2)
 *   - +0.15 if the brand has a detected ranking position
 *   - +0.10 if the AI provided a citation URL
 *   - +0.05 if the response is substantive (> 300 chars)
 */
function computeConfidenceScore(
  response: string,
  brandName: string,
  position: number | null,
  citationUrl: string | null,
): number {
  if (!response) return 0;
  let score = 0.5;
  const brandLower = brandName.toLowerCase();
  const escapedBrand = brandLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mentionCount = (response.toLowerCase().match(new RegExp(escapedBrand, "g")) || []).length;
  score += Math.min(mentionCount * 0.05, 0.2);
  if (position !== null && position > 0) score += 0.15;
  if (citationUrl) score += 0.1;
  if (response.length > 300) score += 0.05;
  return Math.min(score, 0.95);
}

/**
 * Deterministic per-brand-per-platform query template selector. Previously
 * used Math.random() which meant repeated monitoring runs asked different
 * questions and produced inconsistent trend data. Hashing brand+platform+day
 * keeps runs on the same day reproducible and still rotates daily.
 */
function pickTemplate(
  templates: Record<string, QueryTemplate>,
  brandName: string,
  platform: string,
): QueryTemplate {
  const keys = Object.keys(templates);
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const seed = `${brandName}|${platform}|${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % keys.length;
  return templates[keys[idx]];
}

function pickPrompt(
  template: QueryTemplate,
  brandName: string,
  platform: string,
): string {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const seed = `${brandName}|${platform}|prompt|${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return template.prompts[Math.abs(hash) % template.prompts.length];
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

    const query = pickPrompt(queryTemplate, brandName, "chatgpt")
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
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
      return null;
    }

    const position = extractPosition(response, brandName);
    const urlMatch = response.match(/https?:\/\/[^\s)]+/);
    const citationUrl = urlMatch ? urlMatch[0] : null;

    return {
      platform: "chatgpt",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position,
      citationUrl,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "online shopping"],
      metadata: {
        modelVersion: completion.model || "gpt-4o",
        responseLength: response.length,
        confidenceScore: computeConfidenceScore(response, brandName, position, citationUrl),
      },
    };
  } catch (error) {
    logger.error("[ai-platform-query] ChatGPT query error", { error });
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

    const query = pickPrompt(queryTemplate, brandName, "claude")
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

    const position = extractPosition(response, brandName);
    const urlMatch = response.match(/https?:\/\/[^\s)]+/);
    const citationUrl = urlMatch ? urlMatch[0] : null;

    return {
      platform: "claude",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position,
      citationUrl,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "retail"],
      metadata: {
        modelVersion: message.model || "claude-sonnet-4",
        responseLength: response.length,
        confidenceScore: computeConfidenceScore(response, brandName, position, citationUrl),
      },
    };
  } catch (error) {
    logger.error("[ai-platform-query] Claude query error", { error });
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
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const query = pickPrompt(queryTemplate, brandName, "gemini")
      .replace("{brand}", brandName)
      .replace("{industry}", "e-commerce")
      .replace("{region}", "South Africa")
      .replace("{product_category}", "online shopping");

    const result = await model.generateContent(query);
    const response = result.response.text();

    if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    const position = extractPosition(response, brandName);
    const urlMatch = response.match(/https?:\/\/[^\s)]+/);
    const citationUrl = urlMatch ? urlMatch[0] : null;

    return {
      platform: "gemini",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position,
      citationUrl,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "south africa"],
      metadata: {
        modelVersion: "gemini-2.5-flash",
        responseLength: response.length,
        confidenceScore: computeConfidenceScore(response, brandName, position, citationUrl),
      },
    };
  } catch (error) {
    logger.error("[ai-platform-query] Gemini query error", { error });
    return null;
  }
}

/**
 * Query Perplexity (using OpenAI-compatible API)
 *
 * Implements retry logic with exponential backoff to handle:
 * - 401 Authentication errors (token refresh)
 * - 429 Rate limit errors (backoff and retry)
 * - Network timeouts
 */
export async function queryPerplexity(
  brandName: string,
  keyword: string,
  queryTemplate: QueryTemplate
): Promise<AIPlatformMention | null> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 1000; // 1 second
  const TIMEOUT_MS = 30000; // 30 second timeout

  async function queryWithRetry(attempt = 0): Promise<AIPlatformMention | null> {
    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        console.warn("PERPLEXITY_API_KEY not configured, skipping");
        return null;
      }

      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.perplexity.ai",
        timeout: TIMEOUT_MS,
        maxRetries: 1, // Let our custom retry handle it
      });

      const query = pickPrompt(queryTemplate, brandName, "perplexity")
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
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "";

      if (!response || !response.toLowerCase().includes(brandName.toLowerCase())) {
        return null;
      }

      // Perplexity's API response includes a `citations` array alongside the
      // message. Fall back to scraping a URL out of the response text if the
      // SDK version doesn't surface it. DO NOT fabricate a brand domain here
      // — prior code synthesised https://www.<brand>.com which was a lie.
      const completionAny = completion as unknown as { citations?: string[] };
      const perplexityCitations = completionAny.citations;
      const urlMatch = response.match(/https?:\/\/[^\s)]+/);
      const citationUrl = perplexityCitations?.[0] ?? (urlMatch ? urlMatch[0] : null);

      const position = extractPosition(response, brandName);

      return {
        platform: "perplexity",
        query,
        response,
        sentiment: analyzeSentiment(response, brandName),
        position,
        citationUrl,
        competitors: extractCompetitors(response, brandName),
        promptCategory: queryTemplate.category,
        topics: ["e-commerce", "online shopping", "south africa"],
        metadata: {
          modelVersion: completion.model || "sonar-pro",
          responseLength: response.length,
          confidenceScore: computeConfidenceScore(response, brandName, position, citationUrl),
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const statusCode = (error as any)?.status;

      // Log detailed error info
      if (attempt === 0) {
        logger.debug(`Perplexity query attempt 1/3 - Error: ${errorMsg} (${statusCode})`);
      }

      // Handle specific errors with retry logic
      if (statusCode === 401) {
        // Authentication error - could be expired token
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt);
          logger.debug(
            `Perplexity 401 Auth error - Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return queryWithRetry(attempt + 1);
        } else {
          console.warn(
            `Perplexity 401 Auth failed after ${MAX_RETRIES} attempts - Token may be invalid or expired`
          );
          return null;
        }
      } else if (statusCode === 429) {
        // Rate limit - backoff and retry
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt + 1); // Longer delay for rate limit
          logger.debug(
            `Perplexity 429 Rate limit - Backing off for ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return queryWithRetry(attempt + 1);
        } else {
          console.warn(
            `Perplexity rate limited after ${MAX_RETRIES} attempts - Skipping this query`
          );
          return null;
        }
      } else if (statusCode === 500 || statusCode === 503) {
        // Server error - retry with backoff
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt);
          logger.debug(
            `Perplexity ${statusCode} Server error - Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return queryWithRetry(attempt + 1);
        }
      }

      // For other errors, log and return null
      if (attempt === 0) {
        console.warn(`Perplexity query error: ${errorMsg}`);
      }
      return null;
    }
  }

  return queryWithRetry();
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

    const query = pickPrompt(queryTemplate, brandName, "deepseek")
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

    const position = extractPosition(response, brandName);
    const urlMatch = response.match(/https?:\/\/[^\s)]+/);
    const citationUrl = urlMatch ? urlMatch[0] : null;

    return {
      platform: "deepseek",
      query,
      response,
      sentiment: analyzeSentiment(response, brandName),
      position,
      citationUrl,
      competitors: extractCompetitors(response, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce"],
      metadata: {
        modelVersion: completion.model || "deepseek-chat",
        responseLength: response.length,
        confidenceScore: computeConfidenceScore(response, brandName, position, citationUrl),
      },
    };
  } catch (error) {
    logger.error("[ai-platform-query] DeepSeek query error", { error });
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
    const query = pickPrompt(queryTemplate, brandName, "grok")
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

    const position = extractPosition(aiResponse, brandName);

    return {
      platform: "grok",
      query,
      response: aiResponse,
      sentiment: analyzeSentiment(aiResponse, brandName),
      position,
      citationUrl,
      competitors: extractCompetitors(aiResponse, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "technology"],
      metadata: {
        modelVersion: data.model || "grok-beta",
        responseLength: aiResponse.length,
        confidenceScore: computeConfidenceScore(aiResponse, brandName, position, citationUrl),
      },
    };
  } catch (error) {
    logger.error("[ai-platform-query] Grok query error", { error });
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
    const query = pickPrompt(queryTemplate, brandName, "copilot")
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

    const position = extractPosition(aiResponse, brandName);

    return {
      platform: "copilot",
      query,
      response: aiResponse,
      sentiment: analyzeSentiment(aiResponse, brandName),
      position,
      citationUrl,
      competitors: extractCompetitors(aiResponse, brandName),
      promptCategory: queryTemplate.category,
      topics: ["e-commerce", "technology"],
      metadata: {
        modelVersion: deploymentName,
        responseLength: aiResponse.length,
        confidenceScore: computeConfidenceScore(aiResponse, brandName, position, citationUrl),
      },
    };
  } catch (error) {
    logger.error("[ai-platform-query] Copilot query error", { error });
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
  // Deterministic template per brand+platform+day so repeated runs produce
  // comparable results. Previous Math.random() selection made GEO score
  // trend data jumpy because each run asked a different question.
  const template = pickTemplate(QUERY_TEMPLATES, brandName, platform);

  switch (platform.toLowerCase()) {
    case "chatgpt":
      return queryChatGPT(brandName, keyword, template);
    case "claude":
      return queryClaude(brandName, keyword, template);
    case "gemini":
      return queryGemini(brandName, keyword, template);
    case "perplexity":
      return queryPerplexity(brandName, keyword, template);
    case "grok":
      return queryGrok(brandName, keyword, template);
    case "deepseek":
      return queryDeepSeek(brandName, keyword, template);
    case "copilot":
      return queryCopilot(brandName, keyword, template);
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
