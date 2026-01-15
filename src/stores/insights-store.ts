import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AIPlatform,
  QueryStatus,
  ContentTypePerformance,
  VisibilityScore,
  Recommendation,
  Citation,
} from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

/**
 * Platform-specific loading state
 */
export interface PlatformLoadingState {
  chatgpt: boolean;
  claude: boolean;
  gemini: boolean;
  perplexity: boolean;
  grok: boolean;
  deepseek: boolean;
  copilot: boolean;
}

/**
 * Platform-specific error state
 */
export interface PlatformErrorState {
  chatgpt: string | null;
  claude: string | null;
  gemini: string | null;
  perplexity: string | null;
  grok: string | null;
  deepseek: string | null;
  copilot: string | null;
}

/**
 * Summary statistics from an analysis
 */
export interface AnalysisSummary {
  averageScore: number;
  totalCitations: number;
  totalMentions: number;
  platformsAnalyzed: number;
  bestPlatform: AIPlatform | null;
  worstPlatform: AIPlatform | null;
}

/**
 * History entry for past analyses
 */
export interface HistoryEntry {
  id: string;
  queryText: string;
  brandContext: string | null;
  brandId: string;
  brandName: string;
  platforms: AIPlatform[];
  status: QueryStatus;
  summary: AnalysisSummary;
  createdAt: string;
  platformResults: {
    platform: AIPlatform;
    visibilityScore: number;
    citationCount: number;
    mentionCount: number;
  }[];
}

/**
 * Pagination metadata for history
 */
export interface HistoryPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

/**
 * Analysis request configuration
 */
export interface AnalysisRequest {
  queryText: string;
  brandContext?: string;
  brandId: string;
  brandName: string;
  brandKeywords?: string[];
  platforms?: AIPlatform[];
}

/**
 * Platform result within current analysis
 */
export interface PlatformResult {
  status: "success" | "failed" | "pending";
  error?: string;
  analysis?: {
    visibilityScore: VisibilityScore;
    contentTypePerformance: ContentTypePerformance;
    recommendations: Recommendation[];
    citations: Citation[];
    mentionCount: number;
  };
}

/**
 * Current analysis result from API
 */
export interface CurrentAnalysis {
  queryId: string;
  query: string;
  status: QueryStatus;
  summary: AnalysisSummary;
  platforms: {
    [K in AIPlatform]?: PlatformResult;
  };
  createdAt: string;
  completedAt?: string;
}

/**
 * API response structure for history entry
 */
interface HistoryApiEntry {
  id: string;
  queryText: string;
  brandContext: string | null;
  brand?: {
    id: string;
    name: string;
  };
  platforms: AIPlatform[];
  status: QueryStatus;
  summary?: {
    averageVisibilityScore: number;
    totalCitations: number;
    totalMentions: number;
    platformsAnalyzed: number;
  };
  createdAt: string;
  platformBreakdown?: Array<{
    platform: AIPlatform;
    visibilityScore: number;
    citationCount: number;
    mentionCount: number;
  }>;
}

// ============================================================================
// Store Interface
// ============================================================================

interface InsightsState {
  // Current analysis state
  currentAnalysis: CurrentAnalysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;

  // Platform-specific loading/error states
  platformLoading: PlatformLoadingState;
  platformErrors: PlatformErrorState;

  // History state
  history: HistoryEntry[];
  historyPagination: HistoryPagination | null;
  isLoadingHistory: boolean;
  historyError: string | null;

  // Selected platform for detailed view
  selectedPlatform: AIPlatform | null;

  // Recent queries for quick access
  recentQueries: string[];

  // Actions - Analysis
  analyzeQuery: (request: AnalysisRequest) => Promise<void>;
  setCurrentAnalysis: (analysis: CurrentAnalysis | null) => void;
  clearCurrentAnalysis: () => void;

  // Actions - Loading States
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  setPlatformLoading: (platform: AIPlatform, loading: boolean) => void;
  setPlatformError: (platform: AIPlatform, error: string | null) => void;
  clearAllPlatformErrors: () => void;

  // Actions - History
  fetchHistory: (brandId?: string, limit?: number, offset?: number) => Promise<void>;
  setHistory: (history: HistoryEntry[], pagination: HistoryPagination) => void;
  loadMoreHistory: () => Promise<void>;
  setLoadingHistory: (isLoading: boolean) => void;
  setHistoryError: (error: string | null) => void;

  // Actions - Platform Selection
  setSelectedPlatform: (platform: AIPlatform | null) => void;

  // Actions - Recent Queries
  addRecentQuery: (query: string) => void;
  clearRecentQueries: () => void;

  // Actions - Load Historical Entry
  loadedHistoryEntry: HistoryEntry | null;
  loadHistoryEntry: (entry: HistoryEntry) => void;
  clearLoadedHistoryEntry: () => void;

  // Actions - Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialPlatformLoading: PlatformLoadingState = {
  chatgpt: false,
  claude: false,
  gemini: false,
  perplexity: false,
  grok: false,
  deepseek: false,
  copilot: false,
};

const initialPlatformErrors: PlatformErrorState = {
  chatgpt: null,
  claude: null,
  gemini: null,
  perplexity: null,
  grok: null,
  deepseek: null,
  copilot: null,
};

const initialState = {
  currentAnalysis: null as CurrentAnalysis | null,
  isAnalyzing: false,
  analysisError: null as string | null,
  platformLoading: { ...initialPlatformLoading },
  platformErrors: { ...initialPlatformErrors },
  history: [] as HistoryEntry[],
  historyPagination: null as HistoryPagination | null,
  isLoadingHistory: false,
  historyError: null as string | null,
  selectedPlatform: null as AIPlatform | null,
  recentQueries: [] as string[],
  loadedHistoryEntry: null as HistoryEntry | null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useInsightsStore = create<InsightsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // Analysis Actions
      // ========================================================================

      analyzeQuery: async (request: AnalysisRequest) => {
        const { queryText, brandContext, brandId, brandName, brandKeywords, platforms } = request;

        // Reset states and start analyzing
        set({
          isAnalyzing: true,
          analysisError: null,
          currentAnalysis: null,
          platformLoading: { ...initialPlatformLoading },
          platformErrors: { ...initialPlatformErrors },
        });

        // Set all requested platforms to loading
        const platformsToAnalyze = platforms || ["chatgpt", "claude", "gemini", "perplexity"] as AIPlatform[];
        const newPlatformLoading = { ...initialPlatformLoading };
        for (const platform of platformsToAnalyze) {
          newPlatformLoading[platform] = true;
        }
        set({ platformLoading: newPlatformLoading });

        // Add to recent queries
        get().addRecentQuery(queryText);

        try {
          const response = await fetch("/api/ai-insights/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              queryText,
              brandContext,
              brandId,
              brandName,
              brandKeywords,
              platforms: platformsToAnalyze,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Analysis failed with status ${response.status}`);
          }

          if (!data.success) {
            throw new Error(data.error || "Analysis failed");
          }

          // Transform API response to CurrentAnalysis format
          // API returns: { queryId, status, analysis: { summary: {...}, platforms: [...] } }
          const analysisResult = data.data;
          const analysisSummary = analysisResult.analysis?.summary;
          const analysisPlatforms = analysisResult.analysis?.platforms;

          const currentAnalysis: CurrentAnalysis = {
            queryId: analysisResult.queryId,
            query: queryText,
            status: analysisResult.status,
            summary: {
              averageScore: analysisSummary?.averageVisibilityScore || 0,
              totalCitations: analysisSummary?.totalCitations || 0,
              totalMentions: analysisSummary?.totalMentions || 0,
              platformsAnalyzed: analysisSummary?.platformsAnalyzed || 0,
              bestPlatform: analysisSummary?.bestPlatform || null,
              worstPlatform: analysisSummary?.worstPlatform || null,
            },
            platforms: {},
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          };

          // Process platform results
          const platformErrorsUpdate = { ...initialPlatformErrors };

          if (analysisPlatforms) {
            for (const platformResult of analysisPlatforms) {
              const platform = platformResult.platform as AIPlatform;

              if (platformResult.status === "success" && platformResult.analysis) {
                // Extract mentionCount from visibilityScore.metrics.totalMentions
                const mentionCount = platformResult.analysis.visibilityScore?.metrics?.totalMentions || 0;

                currentAnalysis.platforms[platform] = {
                  status: "success",
                  analysis: {
                    visibilityScore: platformResult.analysis.visibilityScore,
                    contentTypePerformance: platformResult.analysis.contentTypePerformance || {},
                    recommendations: platformResult.analysis.recommendations || [],
                    citations: platformResult.analysis.citations || [],
                    mentionCount,
                  },
                };
              } else {
                currentAnalysis.platforms[platform] = {
                  status: "failed",
                  error: platformResult.error || "Analysis failed",
                };
                platformErrorsUpdate[platform] = platformResult.error || "Analysis failed";
              }
            }
          }

          set({
            currentAnalysis,
            isAnalyzing: false,
            platformLoading: { ...initialPlatformLoading },
            platformErrors: platformErrorsUpdate,
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Analysis failed";
          set({
            isAnalyzing: false,
            analysisError: errorMessage,
            platformLoading: { ...initialPlatformLoading },
          });
        }
      },

      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

      clearCurrentAnalysis: () =>
        set({
          currentAnalysis: null,
          analysisError: null,
          platformErrors: { ...initialPlatformErrors },
        }),

      // ========================================================================
      // Loading State Actions
      // ========================================================================

      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      setAnalysisError: (error) => set({ analysisError: error }),

      setPlatformLoading: (platform, loading) =>
        set((state) => ({
          platformLoading: {
            ...state.platformLoading,
            [platform]: loading,
          },
        })),

      setPlatformError: (platform, error) =>
        set((state) => ({
          platformErrors: {
            ...state.platformErrors,
            [platform]: error,
          },
        })),

      clearAllPlatformErrors: () =>
        set({ platformErrors: { ...initialPlatformErrors } }),

      // ========================================================================
      // History Actions
      // ========================================================================

      fetchHistory: async (brandId?: string, limit = 10, offset = 0) => {
        set({ isLoadingHistory: true, historyError: null });

        try {
          const params = new URLSearchParams();
          if (brandId) params.append("brandId", brandId);
          params.append("limit", String(limit));
          params.append("offset", String(offset));

          const response = await fetch(`/api/ai-insights/history?${params.toString()}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to fetch history with status ${response.status}`);
          }

          if (!data.success) {
            throw new Error(data.error || "Failed to fetch history");
          }

          // Transform API response to HistoryEntry format
          const historyEntries: HistoryEntry[] = (data.data.history || []).map((entry: HistoryApiEntry) => ({
            id: entry.id,
            queryText: entry.queryText,
            brandContext: entry.brandContext,
            brandId: entry.brand?.id || "",
            brandName: entry.brand?.name || "",
            platforms: entry.platforms || [],
            status: entry.status,
            summary: {
              averageScore: entry.summary?.averageVisibilityScore || 0,
              totalCitations: entry.summary?.totalCitations || 0,
              totalMentions: entry.summary?.totalMentions || 0,
              platformsAnalyzed: entry.summary?.platformsAnalyzed || 0,
              bestPlatform: null,
              worstPlatform: null,
            },
            createdAt: entry.createdAt,
            platformResults: (entry.platformBreakdown || []).map((p) => ({
              platform: p.platform,
              visibilityScore: p.visibilityScore || 0,
              citationCount: p.citationCount || 0,
              mentionCount: p.mentionCount || 0,
            })),
          }));

          const pagination: HistoryPagination = {
            limit: data.data.pagination?.limit || limit,
            offset: data.data.pagination?.offset || offset,
            total: data.data.pagination?.total || historyEntries.length,
            hasMore: data.data.pagination?.hasMore || false,
          };

          // If offset is 0, replace history; otherwise append
          if (offset === 0) {
            set({
              history: historyEntries,
              historyPagination: pagination,
              isLoadingHistory: false,
            });
          } else {
            set((state) => ({
              history: [...state.history, ...historyEntries],
              historyPagination: pagination,
              isLoadingHistory: false,
            }));
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch history";
          set({
            isLoadingHistory: false,
            historyError: errorMessage,
          });
        }
      },

      setHistory: (history, pagination) => set({ history, historyPagination: pagination }),

      loadMoreHistory: async () => {
        const { historyPagination, isLoadingHistory } = get();
        if (isLoadingHistory || !historyPagination?.hasMore) return;

        const newOffset = historyPagination.offset + historyPagination.limit;
        await get().fetchHistory(undefined, historyPagination.limit, newOffset);
      },

      setLoadingHistory: (isLoading) => set({ isLoadingHistory: isLoading }),

      setHistoryError: (error) => set({ historyError: error }),

      // ========================================================================
      // Platform Selection Actions
      // ========================================================================

      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),

      // ========================================================================
      // Recent Queries Actions
      // ========================================================================

      addRecentQuery: (query) =>
        set((state) => {
          // Remove duplicate and add to front, limit to 10 entries
          const queries = [
            query,
            ...state.recentQueries.filter((q) => q !== query),
          ].slice(0, 10);
          return { recentQueries: queries };
        }),

      clearRecentQueries: () => set({ recentQueries: [] }),

      // ========================================================================
      // Load Historical Entry Actions
      // ========================================================================

      loadedHistoryEntry: null,

      loadHistoryEntry: (entry) => set({ loadedHistoryEntry: entry }),

      clearLoadedHistoryEntry: () => set({ loadedHistoryEntry: null }),

      // ========================================================================
      // Reset Action
      // ========================================================================

      reset: () => set({ ...initialState, recentQueries: get().recentQueries }),
    }),
    {
      name: "apex-insights-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist recent queries and selected platform
        recentQueries: state.recentQueries,
        selectedPlatform: state.selectedPlatform,
      }),
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Get the current analysis result
 */
export const useCurrentAnalysis = () =>
  useInsightsStore((state) => state.currentAnalysis);

/**
 * Get the overall analyzing state
 */
export const useIsAnalyzing = () =>
  useInsightsStore((state) => state.isAnalyzing);

/**
 * Get the analysis error
 */
export const useAnalysisError = () =>
  useInsightsStore((state) => state.analysisError);

/**
 * Get platform-specific loading states
 */
export const usePlatformLoading = () =>
  useInsightsStore((state) => state.platformLoading);

/**
 * Get platform-specific error states
 */
export const usePlatformErrors = () =>
  useInsightsStore((state) => state.platformErrors);

/**
 * Get loading state for a specific platform
 */
export const usePlatformLoadingFor = (platform: AIPlatform) =>
  useInsightsStore((state) => state.platformLoading[platform]);

/**
 * Get error state for a specific platform
 */
export const usePlatformErrorFor = (platform: AIPlatform) =>
  useInsightsStore((state) => state.platformErrors[platform]);

/**
 * Get the history entries
 */
export const useHistory = () =>
  useInsightsStore((state) => state.history);

/**
 * Get history pagination info
 */
export const useHistoryPagination = () =>
  useInsightsStore((state) => state.historyPagination);

/**
 * Get history loading state
 */
export const useIsLoadingHistory = () =>
  useInsightsStore((state) => state.isLoadingHistory);

/**
 * Get history error
 */
export const useHistoryError = () =>
  useInsightsStore((state) => state.historyError);

/**
 * Get the selected platform for detailed view
 */
export const useSelectedPlatform = () =>
  useInsightsStore((state) => state.selectedPlatform);

/**
 * Get recent queries
 */
export const useRecentQueries = () =>
  useInsightsStore((state) => state.recentQueries);

/**
 * Get analysis summary from current analysis
 */
export const useAnalysisSummary = () =>
  useInsightsStore((state) => state.currentAnalysis?.summary || null);

/**
 * Get platform result for a specific platform from current analysis
 */
export const usePlatformResult = (platform: AIPlatform) =>
  useInsightsStore((state) => state.currentAnalysis?.platforms[platform] || null);

/**
 * Check if any platform is currently loading
 */
export const useIsAnyPlatformLoading = () =>
  useInsightsStore((state) =>
    Object.values(state.platformLoading).some((loading) => loading)
  );

/**
 * Check if there are any platform errors
 */
export const useHasAnyPlatformError = () =>
  useInsightsStore((state) =>
    Object.values(state.platformErrors).some((error) => error !== null)
  );

/**
 * Get all platforms with successful results
 */
export const useSuccessfulPlatforms = () =>
  useInsightsStore((state) => {
    if (!state.currentAnalysis?.platforms) return [];
    return (Object.entries(state.currentAnalysis.platforms) as [AIPlatform, PlatformResult | undefined][])
      .filter(([, result]) => result?.status === "success")
      .map(([platform]) => platform);
  });

/**
 * Get all platforms with failed results
 */
export const useFailedPlatforms = () =>
  useInsightsStore((state) => {
    if (!state.currentAnalysis?.platforms) return [];
    return (Object.entries(state.currentAnalysis.platforms) as [AIPlatform, PlatformResult | undefined][])
      .filter(([, result]) => result?.status === "failed")
      .map(([platform]) => platform);
  });

/**
 * Get the loaded history entry for rerun
 */
export const useLoadedHistoryEntry = () =>
  useInsightsStore((state) => state.loadedHistoryEntry);
