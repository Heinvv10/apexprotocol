/**
 * Browser Query Module - Public API
 *
 * Exports the complete browser query system for multi-platform monitoring.
 * Provides clean interface for integrating browser-based queries into the
 * existing multi-platform-query.ts architecture.
 */

export * from "./types";
export * from "./base-browser-query";
export * from "./perplexity-browser-query";
export * from "./claude-browser-query";
export * from "./gemini-browser-query";
export * from "./o1-browser-query";
export * from "./session-manager";

// Re-export for convenience
export {
  getPerplexityExecutor,
  cleanupPerplexityExecutor,
  PerplexityBrowserQueryExecutor,
} from "./perplexity-browser-query";

export {
  getClaudeExecutor,
  cleanupClaudeExecutor,
  ClaudeBrowserQueryExecutor,
} from "./claude-browser-query";

export {
  getGeminiExecutor,
  cleanupGeminiExecutor,
  GeminiBrowserQueryExecutor,
} from "./gemini-browser-query";

export {
  getO1Executor,
  getO1MiniExecutor,
  cleanupO1Executor,
  cleanupO1MiniExecutor,
  cleanupAllO1Executors,
  O1BrowserQueryExecutor,
  type O1ThinkingMetadata,
} from "./o1-browser-query";

export { getSessionManager, shutdownSessionManager, BrowserSessionManager } from "./session-manager";
