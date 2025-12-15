/**
 * LLM Router Service Unit Tests
 * Tests for provider routing and fallback logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Claude client
vi.mock("@/lib/ai/claude", () => ({
  getClaudeClient: vi.fn(() => ({
    messages: {
      create: vi.fn(() => Promise.resolve({
        content: [{ type: "text", text: "Claude response" }],
        usage: { input_tokens: 100, output_tokens: 50 },
      })),
    },
  })),
  sendMessage: vi.fn(() => Promise.resolve("Claude response")),
}));

// Mock OpenAI client
vi.mock("@/lib/ai/openai", () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{ message: { content: "OpenAI response" } }],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        })),
      },
    },
  })),
  sendMessage: vi.fn(() => Promise.resolve({
    content: "OpenAI response",
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  })),
  GPT_MODELS: {
    GPT4_TURBO: "gpt-4-turbo-preview",
    GPT4: "gpt-4",
    GPT35_TURBO: "gpt-3.5-turbo",
  },
}));

// Import after mocking
import {
  getDefaultProvider,
  isProviderAvailable,
  getAvailableProviders,
} from "@/lib/ai/router";

describe("LLM Router Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.DEFAULT_LLM_PROVIDER = undefined;
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.OPENAI_API_KEY = "test-openai-key";
  });

  describe("getDefaultProvider", () => {
    it("should return claude by default", () => {
      delete process.env.DEFAULT_LLM_PROVIDER;
      expect(getDefaultProvider()).toBe("claude");
    });

    it("should return openai when configured", () => {
      process.env.DEFAULT_LLM_PROVIDER = "openai";
      expect(getDefaultProvider()).toBe("openai");
    });

    it("should return claude for invalid provider", () => {
      process.env.DEFAULT_LLM_PROVIDER = "invalid";
      expect(getDefaultProvider()).toBe("claude");
    });
  });

  describe("isProviderAvailable", () => {
    it("should return true for claude when API key is set", () => {
      process.env.ANTHROPIC_API_KEY = "test-key";
      expect(isProviderAvailable("claude")).toBe(true);
    });

    it("should return false for claude when API key is not set", () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(isProviderAvailable("claude")).toBe(false);
    });

    it("should return true for openai when API key is set", () => {
      process.env.OPENAI_API_KEY = "test-key";
      expect(isProviderAvailable("openai")).toBe(true);
    });

    it("should return false for openai when API key is not set", () => {
      delete process.env.OPENAI_API_KEY;
      expect(isProviderAvailable("openai")).toBe(false);
    });
  });

  describe("getAvailableProviders", () => {
    it("should return both providers when both keys are set", () => {
      process.env.ANTHROPIC_API_KEY = "test-key";
      process.env.OPENAI_API_KEY = "test-key";
      const providers = getAvailableProviders();
      expect(providers).toContain("claude");
      expect(providers).toContain("openai");
    });

    it("should return only claude when only anthropic key is set", () => {
      process.env.ANTHROPIC_API_KEY = "test-key";
      delete process.env.OPENAI_API_KEY;
      const providers = getAvailableProviders();
      expect(providers).toContain("claude");
      expect(providers).not.toContain("openai");
    });

    it("should return only openai when only openai key is set", () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENAI_API_KEY = "test-key";
      const providers = getAvailableProviders();
      expect(providers).not.toContain("claude");
      expect(providers).toContain("openai");
    });

    it("should return empty array when no keys are set", () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      const providers = getAvailableProviders();
      expect(providers).toHaveLength(0);
    });
  });
});
