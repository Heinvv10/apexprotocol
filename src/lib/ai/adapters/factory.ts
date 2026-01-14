/**
 * Adapter Factory for AI Platform Analysis
 * Instantiates the correct adapter based on platform name
 */

import type { AIPlatform, PlatformAdapter } from "./base";
import { ChatGPTAdapter } from "./chatgpt";
import { ClaudeAdapter } from "./claude";
import { GeminiAdapter } from "./gemini";
import { PerplexityAdapter } from "./perplexity";
import { GrokAdapter } from "./grok";
import { DeepSeekAdapter } from "./deepseek";
import { CopilotAdapter } from "./copilot";

/**
 * Create a platform adapter instance for the specified AI platform
 *
 * @param platform - The AI platform to create an adapter for
 * @returns PlatformAdapter instance for the specified platform
 * @throws Error if the platform is not supported
 *
 * @example
 * ```typescript
 * const adapter = createPlatformAdapter('chatgpt');
 * const response = await adapter.analyze(
 *   "What are the best project management tools?",
 *   "Acme Corp is a project management software company"
 * );
 * ```
 */
export function createPlatformAdapter(platform: AIPlatform): PlatformAdapter {
  switch (platform) {
    case "chatgpt":
      return new ChatGPTAdapter();

    case "claude":
      return new ClaudeAdapter();

    case "gemini":
      return new GeminiAdapter();

    case "perplexity":
      return new PerplexityAdapter();

    case "grok":
      return new GrokAdapter();

    case "deepseek":
      return new DeepSeekAdapter();

    case "copilot":
      return new CopilotAdapter();

    default:
      // TypeScript exhaustiveness check - this should never happen
      const exhaustiveCheck: never = platform;
      throw new Error(`Unsupported platform: ${exhaustiveCheck}`);
  }
}

/**
 * Create adapter instances for all supported platforms
 *
 * @returns Object mapping platform names to their adapter instances
 * @throws Error if any adapter fails to instantiate (e.g., missing API keys)
 *
 * @example
 * ```typescript
 * const adapters = createAllPlatformAdapters();
 * const responses = await Promise.all(
 *   Object.values(adapters).map(adapter =>
 *     adapter.analyze(query, brandContext)
 *   )
 * );
 * ```
 */
export function createAllPlatformAdapters(): Record<
  AIPlatform,
  PlatformAdapter
> {
  return {
    chatgpt: new ChatGPTAdapter(),
    claude: new ClaudeAdapter(),
    gemini: new GeminiAdapter(),
    perplexity: new PerplexityAdapter(),
    grok: new GrokAdapter(),
    deepseek: new DeepSeekAdapter(),
    copilot: new CopilotAdapter(),
  };
}

/**
 * Get a list of all supported AI platforms
 *
 * @returns Array of supported platform names
 */
export function getSupportedPlatforms(): AIPlatform[] {
  return ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"];
}

/**
 * Check if a platform name is supported
 *
 * @param platform - Platform name to check
 * @returns true if the platform is supported, false otherwise
 */
export function isSupportedPlatform(platform: string): platform is AIPlatform {
  const supportedPlatforms = getSupportedPlatforms();
  return supportedPlatforms.includes(platform as AIPlatform);
}
