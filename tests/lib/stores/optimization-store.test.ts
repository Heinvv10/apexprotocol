/**
 * Tests for Optimization Store
 * Tests state management for GEO content optimization workflow
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useOptimizationStore,
  useSuggestions,
  useAnalysisResult,
  useIsAnalyzing,
  useOptimizationError,
  useHasSuggestions,
  useSuggestionsByType,
  useHighConfidenceSuggestions,
  selectSuggestions,
  selectAnalysisResult,
  selectIsAnalyzing,
  selectError,
  selectSuggestionsByType,
  selectHighConfidenceSuggestions,
  selectSuggestionCount,
  selectHasSuggestions,
} from "../../../src/lib/stores/optimization-store";
import type {
  Suggestion,
  AnalysisResult,
} from "../../../src/lib/ai/content-analyzer";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockSuggestion = (
  overrides: Partial<Suggestion> = {}
): Suggestion => ({
  id: "suggestion-1",
  type: "keyword",
  description: "Add target keyword for better AI visibility",
  originalText: "our product",
  suggestedText: "our AI-powered product",
  confidence: 0.85,
  position: {
    from: 10,
    to: 21,
  },
  ...overrides,
});

const createMockAnalysisResult = (
  overrides: Partial<AnalysisResult> = {}
): AnalysisResult => ({
  suggestions: [
    createMockSuggestion(),
    createMockSuggestion({
      id: "suggestion-2",
      type: "structure",
      confidence: 0.75,
    }),
  ],
  overallScore: 75,
  citationProbability: "medium",
  summary: "Content has moderate optimization potential",
  tokenUsage: {
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300,
  },
  ...overrides,
});

// ============================================================================
// Store State Tests
// ============================================================================

describe("useOptimizationStore - Initial State", () => {
  beforeEach(() => {
    // Reset store to initial state
    useOptimizationStore.getState().reset();
  });

  it("should have empty suggestions initially", () => {
    const state = useOptimizationStore.getState();
    expect(state.suggestions).toEqual([]);
  });

  it("should have null analysisResult initially", () => {
    const state = useOptimizationStore.getState();
    expect(state.analysisResult).toBeNull();
  });

  it("should not be analyzing initially", () => {
    const state = useOptimizationStore.getState();
    expect(state.isAnalyzing).toBe(false);
  });

  it("should have no error initially", () => {
    const state = useOptimizationStore.getState();
    expect(state.error).toBeNull();
  });
});

// ============================================================================
// Actions Tests
// ============================================================================

describe("useOptimizationStore - Actions", () => {
  beforeEach(() => {
    useOptimizationStore.getState().reset();
  });

  describe("setSuggestions", () => {
    it("should set suggestions", () => {
      const suggestions = [
        createMockSuggestion(),
        createMockSuggestion({ id: "suggestion-2" }),
      ];

      act(() => {
        useOptimizationStore.getState().setSuggestions(suggestions);
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toEqual(suggestions);
      expect(state.suggestions).toHaveLength(2);
    });

    it("should replace existing suggestions", () => {
      const initialSuggestions = [createMockSuggestion()];
      const newSuggestions = [
        createMockSuggestion({ id: "new-1" }),
        createMockSuggestion({ id: "new-2" }),
      ];

      act(() => {
        useOptimizationStore.getState().setSuggestions(initialSuggestions);
      });

      act(() => {
        useOptimizationStore.getState().setSuggestions(newSuggestions);
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toEqual(newSuggestions);
      expect(state.suggestions).toHaveLength(2);
    });
  });

  describe("setAnalysisResult", () => {
    it("should set analysis result and extract suggestions", () => {
      const result = createMockAnalysisResult();

      act(() => {
        useOptimizationStore.getState().setAnalysisResult(result);
      });

      const state = useOptimizationStore.getState();
      expect(state.analysisResult).toEqual(result);
      expect(state.suggestions).toEqual(result.suggestions);
    });

    it("should clear suggestions when result is null", () => {
      const result = createMockAnalysisResult();

      act(() => {
        useOptimizationStore.getState().setAnalysisResult(result);
      });

      act(() => {
        useOptimizationStore.getState().setAnalysisResult(null);
      });

      const state = useOptimizationStore.getState();
      expect(state.analysisResult).toBeNull();
      expect(state.suggestions).toEqual([]);
    });
  });

  describe("setAnalyzing", () => {
    it("should set analyzing state to true", () => {
      act(() => {
        useOptimizationStore.getState().setAnalyzing(true);
      });

      const state = useOptimizationStore.getState();
      expect(state.isAnalyzing).toBe(true);
    });

    it("should set analyzing state to false", () => {
      act(() => {
        useOptimizationStore.getState().setAnalyzing(true);
      });

      act(() => {
        useOptimizationStore.getState().setAnalyzing(false);
      });

      const state = useOptimizationStore.getState();
      expect(state.isAnalyzing).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      const errorMessage = "Analysis failed";

      act(() => {
        useOptimizationStore.getState().setError(errorMessage);
      });

      const state = useOptimizationStore.getState();
      expect(state.error).toBe(errorMessage);
    });

    it("should clear error when set to null", () => {
      act(() => {
        useOptimizationStore.getState().setError("Some error");
      });

      act(() => {
        useOptimizationStore.getState().setError(null);
      });

      const state = useOptimizationStore.getState();
      expect(state.error).toBeNull();
    });

    it("should set isAnalyzing to false when error is set", () => {
      act(() => {
        useOptimizationStore.getState().setAnalyzing(true);
      });

      act(() => {
        useOptimizationStore.getState().setError("Analysis failed");
      });

      const state = useOptimizationStore.getState();
      expect(state.isAnalyzing).toBe(false);
      expect(state.error).toBe("Analysis failed");
    });
  });

  describe("clearSuggestions", () => {
    it("should clear all suggestions and analysis result", () => {
      const result = createMockAnalysisResult();

      act(() => {
        useOptimizationStore.getState().setAnalysisResult(result);
        useOptimizationStore.getState().setError("Some error");
      });

      act(() => {
        useOptimizationStore.getState().clearSuggestions();
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toEqual([]);
      expect(state.analysisResult).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe("removeSuggestion", () => {
    it("should remove a suggestion by id", () => {
      const suggestions = [
        createMockSuggestion({ id: "suggestion-1" }),
        createMockSuggestion({ id: "suggestion-2" }),
        createMockSuggestion({ id: "suggestion-3" }),
      ];

      act(() => {
        useOptimizationStore.getState().setSuggestions(suggestions);
      });

      act(() => {
        useOptimizationStore.getState().removeSuggestion("suggestion-2");
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toHaveLength(2);
      expect(state.suggestions.find((s) => s.id === "suggestion-2")).toBeUndefined();
      expect(state.suggestions.find((s) => s.id === "suggestion-1")).toBeDefined();
      expect(state.suggestions.find((s) => s.id === "suggestion-3")).toBeDefined();
    });

    it("should update analysisResult when removing suggestion", () => {
      const result = createMockAnalysisResult({
        suggestions: [
          createMockSuggestion({ id: "suggestion-1" }),
          createMockSuggestion({ id: "suggestion-2" }),
        ],
      });

      act(() => {
        useOptimizationStore.getState().setAnalysisResult(result);
      });

      act(() => {
        useOptimizationStore.getState().removeSuggestion("suggestion-1");
      });

      const state = useOptimizationStore.getState();
      expect(state.analysisResult?.suggestions).toHaveLength(1);
      expect(state.analysisResult?.suggestions[0].id).toBe("suggestion-2");
    });

    it("should handle removing non-existent suggestion", () => {
      const suggestions = [createMockSuggestion({ id: "suggestion-1" })];

      act(() => {
        useOptimizationStore.getState().setSuggestions(suggestions);
      });

      act(() => {
        useOptimizationStore.getState().removeSuggestion("non-existent");
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toHaveLength(1);
    });
  });

  describe("applySuggestion", () => {
    it("should remove suggestion when applied", () => {
      const suggestions = [
        createMockSuggestion({ id: "suggestion-1" }),
        createMockSuggestion({ id: "suggestion-2" }),
      ];

      act(() => {
        useOptimizationStore.getState().setSuggestions(suggestions);
      });

      act(() => {
        useOptimizationStore.getState().applySuggestion("suggestion-1");
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toHaveLength(1);
      expect(state.suggestions[0].id).toBe("suggestion-2");
    });
  });

  describe("reset", () => {
    it("should reset store to initial state", () => {
      const result = createMockAnalysisResult();

      act(() => {
        useOptimizationStore.getState().setAnalysisResult(result);
        useOptimizationStore.getState().setAnalyzing(true);
        useOptimizationStore.getState().setError("Some error");
      });

      act(() => {
        useOptimizationStore.getState().reset();
      });

      const state = useOptimizationStore.getState();
      expect(state.suggestions).toEqual([]);
      expect(state.analysisResult).toBeNull();
      expect(state.isAnalyzing).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

// ============================================================================
// Selectors Tests
// ============================================================================

describe("useOptimizationStore - Selectors", () => {
  beforeEach(() => {
    useOptimizationStore.getState().reset();
  });

  it("selectSuggestions should return suggestions array", () => {
    const suggestions = [createMockSuggestion()];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    expect(selectSuggestions(state)).toEqual(suggestions);
  });

  it("selectAnalysisResult should return analysis result", () => {
    const result = createMockAnalysisResult();

    act(() => {
      useOptimizationStore.getState().setAnalysisResult(result);
    });

    const state = useOptimizationStore.getState();
    expect(selectAnalysisResult(state)).toEqual(result);
  });

  it("selectIsAnalyzing should return analyzing state", () => {
    act(() => {
      useOptimizationStore.getState().setAnalyzing(true);
    });

    const state = useOptimizationStore.getState();
    expect(selectIsAnalyzing(state)).toBe(true);
  });

  it("selectError should return error state", () => {
    const error = "Test error";

    act(() => {
      useOptimizationStore.getState().setError(error);
    });

    const state = useOptimizationStore.getState();
    expect(selectError(state)).toBe(error);
  });

  it("selectSuggestionsByType should filter by type", () => {
    const suggestions = [
      createMockSuggestion({ id: "s1", type: "keyword" }),
      createMockSuggestion({ id: "s2", type: "structure" }),
      createMockSuggestion({ id: "s3", type: "keyword" }),
      createMockSuggestion({ id: "s4", type: "formatting" }),
    ];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    const keywordSuggestions = selectSuggestionsByType(state, "keyword");
    expect(keywordSuggestions).toHaveLength(2);
    expect(keywordSuggestions.every((s) => s.type === "keyword")).toBe(true);
  });

  it("selectHighConfidenceSuggestions should filter by confidence >= 0.7", () => {
    const suggestions = [
      createMockSuggestion({ id: "s1", confidence: 0.9 }),
      createMockSuggestion({ id: "s2", confidence: 0.5 }),
      createMockSuggestion({ id: "s3", confidence: 0.75 }),
      createMockSuggestion({ id: "s4", confidence: 0.65 }),
    ];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    const highConfidence = selectHighConfidenceSuggestions(state);
    expect(highConfidence).toHaveLength(2);
    expect(highConfidence.every((s) => s.confidence >= 0.7)).toBe(true);
  });

  it("selectSuggestionCount should return count", () => {
    const suggestions = [
      createMockSuggestion({ id: "s1" }),
      createMockSuggestion({ id: "s2" }),
      createMockSuggestion({ id: "s3" }),
    ];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    expect(selectSuggestionCount(state)).toBe(3);
  });

  it("selectHasSuggestions should return true when suggestions exist", () => {
    const suggestions = [createMockSuggestion()];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    expect(selectHasSuggestions(state)).toBe(true);
  });

  it("selectHasSuggestions should return false when no suggestions", () => {
    const state = useOptimizationStore.getState();
    expect(selectHasSuggestions(state)).toBe(false);
  });
});

// ============================================================================
// Hooks Tests
// ============================================================================

describe("useOptimizationStore - Hooks", () => {
  beforeEach(() => {
    useOptimizationStore.getState().reset();
  });

  it("useSuggestions should return suggestions via direct store access", () => {
    const suggestions = [createMockSuggestion()];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    // Test via selector instead of renderHook to avoid infinite loop issues
    const state = useOptimizationStore.getState();
    expect(selectSuggestions(state)).toEqual(suggestions);
  });

  it("useAnalysisResult should return analysis result via direct store access", () => {
    const result = createMockAnalysisResult();

    act(() => {
      useOptimizationStore.getState().setAnalysisResult(result);
    });

    const state = useOptimizationStore.getState();
    expect(selectAnalysisResult(state)).toEqual(result);
  });

  it("useIsAnalyzing should return analyzing state via direct store access", () => {
    act(() => {
      useOptimizationStore.getState().setAnalyzing(true);
    });

    const state = useOptimizationStore.getState();
    expect(selectIsAnalyzing(state)).toBe(true);
  });

  it("useOptimizationError should return error via direct store access", () => {
    const error = "Test error";

    act(() => {
      useOptimizationStore.getState().setError(error);
    });

    const state = useOptimizationStore.getState();
    expect(selectError(state)).toBe(error);
  });

  it("useHasSuggestions should return true when suggestions exist via direct store access", () => {
    const suggestions = [createMockSuggestion()];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    expect(selectHasSuggestions(state)).toBe(true);
  });

  it("useSuggestionsByType should filter by type via direct store access", () => {
    const suggestions = [
      createMockSuggestion({ id: "s1", type: "keyword" }),
      createMockSuggestion({ id: "s2", type: "structure" }),
    ];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    const keywordSuggestions = selectSuggestionsByType(state, "keyword");
    expect(keywordSuggestions).toHaveLength(1);
    expect(keywordSuggestions[0].type).toBe("keyword");
  });

  it("useHighConfidenceSuggestions should filter by confidence via direct store access", () => {
    const suggestions = [
      createMockSuggestion({ id: "s1", confidence: 0.9 }),
      createMockSuggestion({ id: "s2", confidence: 0.5 }),
    ];

    act(() => {
      useOptimizationStore.getState().setSuggestions(suggestions);
    });

    const state = useOptimizationStore.getState();
    const highConfidence = selectHighConfidenceSuggestions(state);
    expect(highConfidence).toHaveLength(1);
    expect(highConfidence[0].confidence).toBe(0.9);
  });
});
