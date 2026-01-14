// AI Platform Adapters exports
// Provides unified interface for querying ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, and Copilot

// Base types and interfaces
export type {
  AIPlatform,
  CitationType,
  Citation,
  PlatformResponse,
  PlatformAdapter,
  AnalysisOptions,
} from "./base";

// Adapter implementations
export { ChatGPTAdapter } from "./chatgpt";
export { ClaudeAdapter } from "./claude";
export { GeminiAdapter } from "./gemini";
export { PerplexityAdapter } from "./perplexity";
export { GrokAdapter } from "./grok";
export { DeepSeekAdapter } from "./deepseek";
export { CopilotAdapter } from "./copilot";

// Factory functions
export {
  createPlatformAdapter,
  createAllPlatformAdapters,
  getSupportedPlatforms,
  isSupportedPlatform,
} from "./factory";
