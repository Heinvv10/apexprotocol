// AI Platform Adapters exports
// Provides unified interface for querying ChatGPT, Claude, Gemini, and Perplexity

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

// Factory functions
export {
  createPlatformAdapter,
  createAllPlatformAdapters,
  getSupportedPlatforms,
  isSupportedPlatform,
} from "./factory";
