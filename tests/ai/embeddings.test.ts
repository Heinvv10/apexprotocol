/**
 * Embeddings Service Unit Tests
 * Tests for vector embedding functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock OpenAI client
vi.mock("@/lib/ai/openai", () => ({
  getOpenAIClient: vi.fn(() => ({
    embeddings: {
      create: vi.fn(() => Promise.resolve({
        data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
        model: "text-embedding-3-small",
        usage: { prompt_tokens: 10, total_tokens: 10 },
      })),
    },
  })),
  EMBEDDING_MODELS: {
    TEXT_3_SMALL: "text-embedding-3-small",
    TEXT_3_LARGE: "text-embedding-3-large",
    ADA_002: "text-embedding-ada-002",
  },
}));

// Import after mocking
import { cosineSimilarity, findMostSimilar } from "@/lib/ai/embeddings";

describe("Embeddings Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vector = [0.5, 0.5, 0.5];
      expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
    });

    it("should return -1 for opposite vectors", () => {
      const a = [1, 0, 0];
      const b = [-1, 0, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
    });

    it("should handle positive similarity", () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it("should throw error for different length vectors", () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow("Embeddings must have the same length");
    });

    it("should handle zero vectors", () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it("should be commutative", () => {
      const a = [1, 2, 3, 4];
      const b = [5, 6, 7, 8];
      expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
    });
  });

  describe("findMostSimilar", () => {
    const queryEmbedding = [1, 0, 0];
    const embeddings = [
      [1, 0, 0],      // Identical - similarity = 1
      [0.9, 0.1, 0],  // Very similar
      [0.5, 0.5, 0],  // Somewhat similar
      [0, 1, 0],      // Orthogonal
      [-1, 0, 0],     // Opposite
    ];

    it("should return top K similar embeddings", () => {
      const results = findMostSimilar(queryEmbedding, embeddings, 3);
      expect(results).toHaveLength(3);
    });

    it("should sort by similarity descending", () => {
      const results = findMostSimilar(queryEmbedding, embeddings, 5);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it("should identify the most similar embedding correctly", () => {
      const results = findMostSimilar(queryEmbedding, embeddings, 1);
      expect(results[0].index).toBe(0); // Identical vector
      expect(results[0].similarity).toBeCloseTo(1, 5);
    });

    it("should return fewer results if topK exceeds embeddings count", () => {
      const results = findMostSimilar(queryEmbedding, embeddings, 100);
      expect(results.length).toBe(embeddings.length);
    });

    it("should handle empty embeddings array", () => {
      const results = findMostSimilar(queryEmbedding, [], 5);
      expect(results).toHaveLength(0);
    });

    it("should include index and similarity in results", () => {
      const results = findMostSimilar(queryEmbedding, embeddings, 2);
      results.forEach(result => {
        expect(result).toHaveProperty("index");
        expect(result).toHaveProperty("similarity");
        expect(typeof result.index).toBe("number");
        expect(typeof result.similarity).toBe("number");
      });
    });

    it("should correctly identify opposite vectors as least similar", () => {
      const results = findMostSimilar(queryEmbedding, embeddings, 5);
      const lastResult = results[results.length - 1];
      expect(lastResult.index).toBe(4); // Opposite vector
      expect(lastResult.similarity).toBeCloseTo(-1, 5);
    });
  });
});
