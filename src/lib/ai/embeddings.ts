/**
 * Embeddings Generator
 * OpenAI text-embedding-3-small integration for vector search
 */

import { getOpenAIClient, EMBEDDING_MODELS, EmbeddingModel } from "./openai";

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  model?: EmbeddingModel;
  dimensions?: number;
}

/**
 * Default embedding configuration
 */
export const DEFAULT_EMBEDDING_CONFIG: Required<EmbeddingConfig> = {
  model: EMBEDDING_MODELS.TEXT_3_SMALL,
  dimensions: 1536, // Default for text-embedding-3-small
};

/**
 * Embedding result
 */
export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = {}
): Promise<EmbeddingResult> {
  const client = getOpenAIClient();
  const { model, dimensions } = { ...DEFAULT_EMBEDDING_CONFIG, ...config };

  const response = await client.embeddings.create({
    model,
    input: text,
    dimensions,
  });

  return {
    embedding: response.data[0].embedding,
    model: response.model,
    usage: {
      promptTokens: response.usage.prompt_tokens,
      totalTokens: response.usage.total_tokens,
    },
  };
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateBatchEmbeddings(
  texts: string[],
  config: EmbeddingConfig = {}
): Promise<BatchEmbeddingResult> {
  const client = getOpenAIClient();
  const { model, dimensions } = { ...DEFAULT_EMBEDDING_CONFIG, ...config };

  // OpenAI supports up to 2048 texts per batch
  if (texts.length > 2048) {
    throw new Error(
      "Batch size exceeds maximum of 2048. Please split into smaller batches."
    );
  }

  const response = await client.embeddings.create({
    model,
    input: texts,
    dimensions,
  });

  // Sort by index to maintain order
  const sortedData = response.data.sort((a, b) => a.index - b.index);

  return {
    embeddings: sortedData.map((d) => d.embedding),
    model: response.model,
    usage: {
      promptTokens: response.usage.prompt_tokens,
      totalTokens: response.usage.total_tokens,
    },
  };
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Find most similar embeddings from a list
 */
export function findMostSimilar(
  queryEmbedding: number[],
  embeddings: number[][],
  topK: number = 5
): Array<{ index: number; similarity: number }> {
  const similarities = embeddings.map((embedding, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, embedding),
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topK);
}

/**
 * Semantic search helper
 * Generates embedding for query and finds similar items
 */
export async function semanticSearch<T>(
  query: string,
  items: Array<{ text: string; data: T }>,
  topK: number = 5,
  config: EmbeddingConfig = {}
): Promise<Array<{ data: T; similarity: number }>> {
  // Generate query embedding
  const queryResult = await generateEmbedding(query, config);

  // Generate embeddings for all items if not cached
  const itemEmbeddings = await generateBatchEmbeddings(
    items.map((i) => i.text),
    config
  );

  // Find most similar
  const similar = findMostSimilar(
    queryResult.embedding,
    itemEmbeddings.embeddings,
    topK
  );

  return similar.map(({ index, similarity }) => ({
    data: items[index].data,
    similarity,
  }));
}

// Export models for external use
export { EMBEDDING_MODELS };
