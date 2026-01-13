/**
 * Content Generation Sub-Agent
 *
 * A comprehensive sub-agent for generating AI-optimized content
 * across multiple platforms with brand voice consistency,
 * performance prediction, and quality assurance.
 */

// Main Agent
export {
  ContentGenerationSubAgent,
  createContentGenerationSubAgent,
  type ContentGenerationConfig,
  type ContentRequest,
  type ContentGenerationResult,
  type GeneratedContent,
  type ContentType,
  type Platform,
  type ContentStatus,
  type BrandVoiceProfile,
  type PerformancePrediction,
  type ABTestSuggestion,
} from './content-generation-sub-agent';

// All Services
export * from './services';
