/**
 * AI Services - Central export for all AI functionality
 */

// Claude Client (F082)
export {
  getClaudeClient,
  sendMessage as sendClaudeMessage,
  sendConversation as sendClaudeConversation,
  streamMessage as streamClaudeMessage,
  CLAUDE_MODELS,
} from "./claude";

// OpenAI Client (F083)
export {
  getOpenAIClient,
  sendMessage as sendOpenAIMessage,
  sendMessageWithConfig as sendOpenAIMessageWithConfig,
  sendConversation as sendOpenAIConversation,
  streamMessage as streamOpenAIMessage,
  GPT_MODELS,
  EMBEDDING_MODELS,
  type OpenAIResponse,
} from "./openai";

// Embeddings Generator (F084)
export {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  findMostSimilar,
  semanticSearch,
} from "./embeddings";

// Pinecone Vector DB (F085)
export {
  getPineconeClient,
  getIndex,
  upsertVectors,
  queryVectors,
  deleteVectors,
  INDEX_NAMES,
  type BrandMentionMetadata,
  type ContentMetadata,
} from "./pinecone";

// LLM Router (F086)
export {
  routeMessage,
  routeBatch,
  getDefaultProvider,
  isProviderAvailable,
  getAvailableProviders,
  type LLMProvider,
  type LLMConfig,
  type LLMResponse,
} from "./router";

// Rate Limiter (F087)
export {
  checkRateLimit,
  incrementRateLimit,
  checkTokenLimit,
  getRateLimitStatus,
  resetRateLimits,
  withRateLimit,
  RateLimitError,
  RATE_LIMIT_TIERS,
  type RateLimitTier,
  type RateLimitResult,
  type RateLimitStatus,
} from "./rate-limiter";

// Token Tracker (F088)
// Note: formatTokenCount and formatCost have been migrated to @/lib/utils centralized formatters
export {
  recordTokenUsage,
  getUsageSummary,
  getDailyUsage,
  getRemainingQuota,
  calculateCost,
  estimateTokens,
  TOKEN_PRICING,
  type TokenUsageRecord,
} from "./token-tracker";

// Prompt Templates (F089)
export {
  getPrompt,
  renderTemplate,
  validateVariables,
  createCustomPrompt,
  estimatePromptTokens,
  PROMPTS,
  type PromptTemplate,
} from "./prompts";

// Streaming (F090)
export {
  streamResponse,
  streamClaudeResponse,
  streamOpenAIResponse,
  streamToSSE,
  getSSEHeaders,
  createStreamingResponse,
  collectStream,
  type StreamEvent,
  type StreamEventType,
  type StreamOptions,
  type StreamUsage,
} from "./streaming";
