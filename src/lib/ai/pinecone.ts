/**
 * Pinecone Vector Database Setup
 * Configure Pinecone client for semantic search storage
 */

import { Pinecone, Index, RecordMetadata } from "@pinecone-database/pinecone";

// Singleton instance
let pineconeClient: Pinecone | null = null;

/**
 * Get or create Pinecone client instance
 */
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "PINECONE_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }

  return pineconeClient;
}

/**
 * Pinecone index configuration
 */
export interface PineconeIndexConfig {
  dimension: number;
  metric: "cosine" | "euclidean" | "dotproduct";
  cloud: "aws" | "gcp" | "azure";
  region: string;
}

/**
 * Default index configuration for text-embedding-3-small
 */
export const DEFAULT_INDEX_CONFIG: PineconeIndexConfig = {
  dimension: 1536, // text-embedding-3-small dimension
  metric: "cosine",
  cloud: "aws",
  region: "us-east-1",
};

/**
 * Index names for different data types
 */
export const INDEX_NAMES = {
  BRAND_MENTIONS: "apex-brand-mentions",
  CONTENT: "apex-content",
  RECOMMENDATIONS: "apex-recommendations",
} as const;

export type IndexName = (typeof INDEX_NAMES)[keyof typeof INDEX_NAMES];

/**
 * Get a Pinecone index
 */
export function getIndex<T extends RecordMetadata = RecordMetadata>(
  indexName: IndexName | string
): Index<T> {
  const client = getPineconeClient();
  return client.index<T>(indexName);
}

/**
 * Vector metadata for brand mentions
 */
export interface BrandMentionMetadata extends RecordMetadata {
  brandId: string;
  platform: string;
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  query: string;
  timestamp: string;
}

/**
 * Vector metadata for content
 */
export interface ContentMetadata extends RecordMetadata {
  brandId: string;
  contentId: string;
  type: string;
  title: string;
  status: string;
}

/**
 * Upsert vectors to an index
 */
export async function upsertVectors<T extends RecordMetadata>(
  indexName: IndexName | string,
  vectors: Array<{
    id: string;
    values: number[];
    metadata: T;
  }>,
  namespace?: string
): Promise<void> {
  const index = getIndex<T>(indexName);
  const ns = namespace ? index.namespace(namespace) : index;

  // Pinecone supports up to 100 vectors per upsert
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await ns.upsert(batch);
  }
}

/**
 * Query vectors from an index
 */
export async function queryVectors<T extends RecordMetadata>(
  indexName: IndexName | string,
  queryVector: number[],
  options: {
    topK?: number;
    filter?: Record<string, unknown>;
    includeMetadata?: boolean;
    includeValues?: boolean;
    namespace?: string;
  } = {}
): Promise<
  Array<{
    id: string;
    score: number;
    metadata?: T;
    values?: number[];
  }>
> {
  const {
    topK = 10,
    filter,
    includeMetadata = true,
    includeValues = false,
    namespace,
  } = options;

  const index = getIndex<T>(indexName);
  const ns = namespace ? index.namespace(namespace) : index;

  const results = await ns.query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata,
    includeValues,
  });

  return results.matches.map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: match.metadata as T | undefined,
    values: match.values,
  }));
}

/**
 * Delete vectors from an index
 */
export async function deleteVectors(
  indexName: IndexName | string,
  ids: string[],
  namespace?: string
): Promise<void> {
  const index = getIndex(indexName);
  const ns = namespace ? index.namespace(namespace) : index;

  await ns.deleteMany(ids);
}

/**
 * Delete all vectors in a namespace
 */
export async function deleteNamespace(
  indexName: IndexName | string,
  namespace: string
): Promise<void> {
  const index = getIndex(indexName);
  await index.namespace(namespace).deleteAll();
}

/**
 * Get index statistics
 */
export async function getIndexStats(indexName: IndexName | string) {
  const index = getIndex(indexName);
  return await index.describeIndexStats();
}

// Export client getter for advanced usage
export { pineconeClient };
