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
  type GenerationRequest,
  type GenerationResult,
  type GenerationJob,
  type JobStatus
} from './content-generation-sub-agent';

// All Services
export * from './services';
