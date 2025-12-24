/**
 * Optimization Store
 * State management for GEO content optimization workflow
 */

import { create } from "zustand";
import type {
  Suggestion,
  AnalysisResult,
} from "@/lib/ai/content-analyzer";

// =============================================================================
// Types
// =============================================================================

/**
 * Optimization state interface
 */
export interface OptimizationState {
  // State
  suggestions: Suggestion[];
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;

  // Actions
  setSuggestions: (suggestions: Suggestion[]) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  clearSuggestions: () => void;
  removeSuggestion: (suggestionId: string) => void;
  applySuggestion: (suggestionId: string) => void;
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  suggestions: [],
  analysisResult: null,
  isAnalyzing: false,
  error: null,
};

// =============================================================================
// Store
// =============================================================================

export const useOptimizationStore = create<OptimizationState>((set, get) => ({
  ...initialState,

  // Actions
  setSuggestions: (suggestions) => set({ suggestions }),

  setAnalysisResult: (analysisResult) => {
    set({
      analysisResult,
      suggestions: analysisResult?.suggestions || [],
    });
  },

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setError: (error) => set({ error, isAnalyzing: false }),

  clearSuggestions: () =>
    set({
      suggestions: [],
      analysisResult: null,
      error: null,
    }),

  removeSuggestion: (suggestionId) => {
    const { suggestions, analysisResult } = get();
    const newSuggestions = suggestions.filter((s) => s.id !== suggestionId);

    set({
      suggestions: newSuggestions,
      analysisResult: analysisResult
        ? { ...analysisResult, suggestions: newSuggestions }
        : null,
    });
  },

  applySuggestion: (suggestionId) => {
    // Mark suggestion as applied by removing it from the list
    get().removeSuggestion(suggestionId);
  },

  reset: () => set(initialState),
}));

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

export const selectSuggestions = (state: OptimizationState) => state.suggestions;
export const selectAnalysisResult = (state: OptimizationState) =>
  state.analysisResult;
export const selectIsAnalyzing = (state: OptimizationState) => state.isAnalyzing;
export const selectError = (state: OptimizationState) => state.error;

// Derived selectors
export const selectSuggestionsByType = (
  state: OptimizationState,
  type: "keyword" | "structure" | "formatting"
) => state.suggestions.filter((s) => s.type === type);

export const selectHighConfidenceSuggestions = (state: OptimizationState) =>
  state.suggestions.filter((s) => s.confidence >= 0.7);

export const selectSuggestionCount = (state: OptimizationState) =>
  state.suggestions.length;

export const selectHasSuggestions = (state: OptimizationState) =>
  state.suggestions.length > 0;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to get all suggestions
 */
export function useSuggestions() {
  return useOptimizationStore(selectSuggestions);
}

/**
 * Hook to get analysis result
 */
export function useAnalysisResult() {
  return useOptimizationStore(selectAnalysisResult);
}

/**
 * Hook to check if analysis is in progress
 */
export function useIsAnalyzing() {
  return useOptimizationStore(selectIsAnalyzing);
}

/**
 * Hook to get error state
 */
export function useOptimizationError() {
  return useOptimizationStore(selectError);
}

/**
 * Hook to check if there are suggestions
 */
export function useHasSuggestions() {
  return useOptimizationStore(selectHasSuggestions);
}

/**
 * Hook to get suggestions by type
 */
export function useSuggestionsByType(
  type: "keyword" | "structure" | "formatting"
) {
  return useOptimizationStore((state) =>
    state.suggestions.filter((s) => s.type === type)
  );
}

/**
 * Hook to get high confidence suggestions
 */
export function useHighConfidenceSuggestions() {
  return useOptimizationStore((state) =>
    state.suggestions.filter((s) => s.confidence >= 0.7)
  );
}
