/**
 * Platform Integrations Index
 * 
 * All supported AI platform integrations for brand monitoring
 */

// Tier 1: Major AI Platforms (7)
export { queryChatGPT } from "./chatgpt";
export { queryClaude } from "./claude";
export { queryGemini } from "./gemini";
export { queryPerplexity } from "./perplexity";
export { queryGrok } from "./grok";
export { queryDeepSeek } from "./deepseek";
export { queryOpenAISearch } from "./openai-search";

// Tier 1: Additional (5)
export { queryBingCopilot } from "./bing-copilot";
export { queryNotebookLM } from "./notebooklm";
export { queryCohere } from "./cohere";
export { queryJanus } from "./janus";

// Tier 2: Regional/Emerging (5)
export { queryMistral } from "./mistral";
export { queryLlama } from "./llama";
export { queryYandexGPT } from "./yandexgpt";
export { queryKimi } from "./kimi";
export { queryQwen } from "./qwen";

/**
 * Platform metadata for display
 */
/**
 * Platform configuration with query functions for registry-based dispatch.
 * Adding a new platform only requires adding an entry here.
 */
export const PLATFORM_CONFIG = {
  // Tier 1: Major
  chatgpt: { name: "ChatGPT", tier: 1, color: "#10a37f", icon: "🤖", queryFn: queryChatGPT },
  claude: { name: "Claude", tier: 1, color: "#cc785c", icon: "🧠", queryFn: queryClaude },
  gemini: { name: "Gemini", tier: 1, color: "#4285f4", icon: "✨", queryFn: queryGemini },
  perplexity: { name: "Perplexity", tier: 1, color: "#20808d", icon: "🔍", queryFn: queryPerplexity },
  grok: { name: "Grok", tier: 1, color: "#1d9bf0", icon: "⚡", queryFn: queryGrok },
  deepseek: { name: "DeepSeek", tier: 1, color: "#0066ff", icon: "🌊", queryFn: queryDeepSeek },
  openai_search: { name: "OpenAI Search", tier: 1, color: "#412991", icon: "🔎", queryFn: queryOpenAISearch },

  // Tier 1: Additional
  copilot: { name: "Microsoft Copilot", tier: 1, color: "#0078d4", icon: "🪟", queryFn: queryBingCopilot },
  bing_copilot: { name: "Bing Copilot", tier: 1, color: "#008373", icon: "🅱️", queryFn: queryBingCopilot },
  notebooklm: { name: "NotebookLM", tier: 1, color: "#fbbc04", icon: "📓", queryFn: queryNotebookLM },
  cohere: { name: "Cohere", tier: 1, color: "#d4145a", icon: "🔗", queryFn: queryCohere },
  janus: { name: "Janus", tier: 1, color: "#6366f1", icon: "🎭", queryFn: queryJanus },

  // Tier 2: Regional/Emerging
  mistral: { name: "Mistral", tier: 2, color: "#ff7000", icon: "🌬️", queryFn: queryMistral },
  llama: { name: "Llama", tier: 2, color: "#764abc", icon: "🦙", queryFn: queryLlama },
  yandexgpt: { name: "YandexGPT", tier: 2, color: "#ff0000", icon: "🇷🇺", queryFn: queryYandexGPT },
  kimi: { name: "Kimi", tier: 2, color: "#00d4aa", icon: "🌙", queryFn: queryKimi },
  qwen: { name: "Qwen", tier: 2, color: "#ff6a00", icon: "🐉", queryFn: queryQwen },
} as const;

export type PlatformKey = keyof typeof PLATFORM_CONFIG;

/**
 * Get all platforms by tier
 */
export function getPlatformsByTier(tier: 1 | 2): PlatformKey[] {
  return (Object.entries(PLATFORM_CONFIG) as [PlatformKey, typeof PLATFORM_CONFIG[PlatformKey]][])
    .filter(([_, config]) => config.tier === tier)
    .map(([key]) => key);
}

/**
 * Get platform display name
 */
export function getPlatformName(key: string): string {
  return PLATFORM_CONFIG[key as PlatformKey]?.name || key;
}

/**
 * Get platform color for charts
 */
export function getPlatformColor(key: string): string {
  return PLATFORM_CONFIG[key as PlatformKey]?.color || "#6b7280";
}
