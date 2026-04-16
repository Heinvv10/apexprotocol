/**
 * Platform configuration — separated from re-exports to avoid Turbopack circular ref issues
 */
import { queryChatGPT } from "./chatgpt";
import { queryChatGPTBrowser } from "./chatgpt-browser";
import { queryClaude } from "./claude";
import { queryClaudeBrowser } from "./claude-browser";
import { queryGemini } from "./gemini";
import { queryGeminiBrowser } from "./gemini-browser";
import { queryPerplexity } from "./perplexity";
import { queryPerplexityBrowser } from "./perplexity-browser";
import { queryGrok } from "./grok";
import { queryDeepSeek } from "./deepseek";
import { queryOpenAISearch } from "./openai-search";
import { queryBingCopilot } from "./bing-copilot";
import { queryNotebookLM } from "./notebooklm";
import { queryCohere } from "./cohere";
import { queryJanus } from "./janus";
import { queryMistral } from "./mistral";
import { queryLlama } from "./llama";
import { queryYandexGPT } from "./yandexgpt";
import { queryKimi } from "./kimi";
import { queryQwen } from "./qwen";
import { queryO1Browser, queryO1MiniBrowser } from "./o1-browser";

export const PLATFORM_CONFIG = {
  chatgpt: { name: "ChatGPT", tier: 1, color: "#10a37f", icon: "🤖", queryFn: queryChatGPT },
  chatgpt_browser: { name: "ChatGPT (Browser)", tier: 1, color: "#10a37f", icon: "🤖", queryFn: queryChatGPTBrowser },
  claude: { name: "Claude", tier: 1, color: "#cc785c", icon: "🧠", queryFn: queryClaude },
  claude_browser: { name: "Claude (Browser)", tier: 1, color: "#cc785c", icon: "🧠", queryFn: queryClaudeBrowser },
  gemini: { name: "Gemini", tier: 1, color: "#4285f4", icon: "✨", queryFn: queryGemini },
  gemini_browser: { name: "Gemini (Browser)", tier: 1, color: "#4285f4", icon: "✨", queryFn: queryGeminiBrowser },
  perplexity: { name: "Perplexity", tier: 1, color: "#20808d", icon: "🔍", queryFn: queryPerplexity },
  perplexity_browser: { name: "Perplexity (Browser)", tier: 1, color: "#20808d", icon: "🔍", queryFn: queryPerplexityBrowser },
  o1_browser: { name: "OpenAI o1 (Browser)", tier: 1, color: "#412991", icon: "🧠‍💭", queryFn: queryO1Browser },
  o1_mini_browser: { name: "OpenAI o1-mini (Browser)", tier: 1, color: "#5a3fa0", icon: "🧠", queryFn: queryO1MiniBrowser },
  grok: { name: "Grok", tier: 1, color: "#1d9bf0", icon: "⚡", queryFn: queryGrok },
  deepseek: { name: "DeepSeek", tier: 1, color: "#0066ff", icon: "🌊", queryFn: queryDeepSeek },
  openai_search: { name: "OpenAI Search", tier: 1, color: "#412991", icon: "🔎", queryFn: queryOpenAISearch },
  copilot: { name: "Microsoft Copilot", tier: 1, color: "#0078d4", icon: "🪟", queryFn: queryBingCopilot },
  bing_copilot: { name: "Bing Copilot", tier: 1, color: "#008373", icon: "🅱️", queryFn: queryBingCopilot },
  notebooklm: { name: "NotebookLM", tier: 1, color: "#fbbc04", icon: "📓", queryFn: queryNotebookLM },
  cohere: { name: "Cohere", tier: 1, color: "#d4145a", icon: "🔗", queryFn: queryCohere },
  janus: { name: "Janus", tier: 1, color: "#6366f1", icon: "🎭", queryFn: queryJanus },
  mistral: { name: "Mistral", tier: 2, color: "#ff7000", icon: "🌬️", queryFn: queryMistral },
  llama: { name: "Llama", tier: 2, color: "#764abc", icon: "🦙", queryFn: queryLlama },
  yandexgpt: { name: "YandexGPT", tier: 2, color: "#ff0000", icon: "🇷🇺", queryFn: queryYandexGPT },
  kimi: { name: "Kimi", tier: 2, color: "#00d4aa", icon: "🌙", queryFn: queryKimi },
  qwen: { name: "Qwen", tier: 2, color: "#ff6a00", icon: "🐉", queryFn: queryQwen },
} as const;

export type PlatformKey = keyof typeof PLATFORM_CONFIG;

export function getPlatformsByTier(tier: 1 | 2): PlatformKey[] {
  return (Object.entries(PLATFORM_CONFIG) as [PlatformKey, typeof PLATFORM_CONFIG[PlatformKey]][])
    .filter(([_, config]) => config.tier === tier)
    .map(([key]) => key);
}

export function getPlatformName(key: string): string {
  return PLATFORM_CONFIG[key as PlatformKey]?.name || key;
}

export function getPlatformColor(key: string): string {
  return PLATFORM_CONFIG[key as PlatformKey]?.color || "#6b7280";
}
