import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Content item with workflow status
export interface ContentItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  geoData: Record<string, unknown> | null;
  status: "draft" | "review" | "scheduled" | "published";
  createdAt: string;
  updatedAt: string;
}

// Schedule information
export interface ContentSchedule {
  id: string;
  contentId: string;
  scheduledAt: string;
  qstashScheduleId: string | null;
  qstashMessageId: string | null;
  status: "pending" | "completed" | "failed" | "cancelled";
  platforms: string[];
  createdAt: string;
  updatedAt: string;
}

// Publishing history record
export interface PublishingHistory {
  id: string;
  contentId: string;
  platform: "wordpress" | "medium";
  externalId: string;
  externalUrl: string;
  publishedAt: string;
  status: "success" | "failed";
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
}

// Performance metrics
export interface ContentMetrics {
  id: string;
  contentId: string;
  platform: "wordpress" | "medium";
  views: number;
  engagementScore: number;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentWorkflowMeta {
  total: number;
  limit: number;
  canAddMore: boolean;
}

interface ContentWorkflowState {
  // Content items
  contentItems: ContentItem[];
  meta: ContentWorkflowMeta | null;
  isLoading: boolean;
  error: string | null;

  // Selected content
  selectedContentId: string | null;
  selectedContent: ContentItem | null;

  // Schedules
  schedules: ContentSchedule[];
  schedulesLoading: boolean;

  // Publishing history
  publishingHistory: PublishingHistory[];
  historyLoading: boolean;

  // Metrics
  metrics: ContentMetrics[];
  metricsLoading: boolean;

  // Actions - Content Items
  setContentItems: (items: ContentItem[], meta: ContentWorkflowMeta) => void;
  setSelectedContentId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addContentItem: (item: ContentItem) => void;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  removeContentItem: (id: string) => void;
  refreshContentItems: () => Promise<void>;

  // Actions - Status Transitions
  transitionStatus: (
    contentId: string,
    newStatus: ContentItem["status"],
    scheduledAt?: string
  ) => Promise<void>;

  // Actions - Schedules
  setSchedules: (schedules: ContentSchedule[]) => void;
  setSchedulesLoading: (loading: boolean) => void;
  addSchedule: (schedule: ContentSchedule) => void;
  updateSchedule: (id: string, updates: Partial<ContentSchedule>) => void;
  removeSchedule: (id: string) => void;
  refreshSchedules: (contentId: string) => Promise<void>;

  // Actions - Publishing History
  setPublishingHistory: (history: PublishingHistory[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  addPublishingRecord: (record: PublishingHistory) => void;
  refreshPublishingHistory: (contentId: string) => Promise<void>;

  // Actions - Metrics
  setMetrics: (metrics: ContentMetrics[]) => void;
  setMetricsLoading: (loading: boolean) => void;
  updateMetrics: (contentId: string, metrics: ContentMetrics[]) => void;
  refreshMetrics: (contentId: string) => Promise<void>;
}

export const useContentWorkflowStore = create<ContentWorkflowState>()(
  persist(
    (set, get) => ({
      // Initial state
      contentItems: [],
      meta: null,
      isLoading: false,
      error: null,
      selectedContentId: null,
      selectedContent: null,
      schedules: [],
      schedulesLoading: false,
      publishingHistory: [],
      historyLoading: false,
      metrics: [],
      metricsLoading: false,

      // Content Items Actions
      setContentItems: (items, meta) => {
        const { selectedContentId } = get();
        // If current selection is invalid, select first item
        const validSelection = items.find((i) => i.id === selectedContentId);
        const newSelectedId = validSelection?.id ?? items[0]?.id ?? null;
        const newSelectedContent = items.find((i) => i.id === newSelectedId) ?? null;

        set({
          contentItems: items,
          meta,
          selectedContentId: newSelectedId,
          selectedContent: newSelectedContent,
        });
      },

      setSelectedContentId: (id) => {
        const { contentItems } = get();
        const selectedContent = contentItems.find((i) => i.id === id) ?? null;
        set({ selectedContentId: id, selectedContent });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      addContentItem: (item) => {
        const { contentItems, meta } = get();
        const newItems = [...contentItems, item];
        const newMeta = meta
          ? {
              ...meta,
              total: meta.total + 1,
              canAddMore: newItems.length < meta.limit,
            }
          : null;
        set({ contentItems: newItems, meta: newMeta });
      },

      updateContentItem: (id, updates) => {
        const { contentItems, selectedContent } = get();
        const newItems = contentItems.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        );
        const newSelectedContent =
          selectedContent?.id === id
            ? { ...selectedContent, ...updates }
            : selectedContent;
        set({ contentItems: newItems, selectedContent: newSelectedContent });
      },

      removeContentItem: (id) => {
        const { contentItems, meta, selectedContentId } = get();
        const newItems = contentItems.filter((i) => i.id !== id);
        const newMeta = meta
          ? {
              ...meta,
              total: meta.total - 1,
              canAddMore: newItems.length < meta.limit,
            }
          : null;

        // If we removed the selected item, select the first available
        let newSelectedId = selectedContentId;
        let newSelectedContent = null;
        if (selectedContentId === id) {
          newSelectedId = newItems[0]?.id ?? null;
          newSelectedContent = newItems[0] ?? null;
        } else {
          newSelectedContent = newItems.find((i) => i.id === newSelectedId) ?? null;
        }

        set({
          contentItems: newItems,
          meta: newMeta,
          selectedContentId: newSelectedId,
          selectedContent: newSelectedContent,
        });
      },

      refreshContentItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/content");
          const data = await response.json();

          if (data.success) {
            get().setContentItems(data.data.items, data.data.meta);
          } else {
            set({ error: data.error || "Failed to load content items" });
          }
        } catch (err) {
          set({
            error:
              err instanceof Error ? err.message : "Failed to load content items",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Status Transition Actions
      transitionStatus: async (contentId, newStatus, scheduledAt) => {
        const { contentItems, selectedContent } = get();

        // Optimistic update
        const previousItems = [...contentItems];
        const previousSelected = selectedContent;
        get().updateContentItem(contentId, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        try {
          const response = await fetch("/api/content/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentId, newStatus, scheduledAt }),
          });

          const data = await response.json();

          if (!data.success) {
            // Revert optimistic update on failure
            set({
              contentItems: previousItems,
              selectedContent: previousSelected,
              error: data.error || "Failed to transition status",
            });
          }
        } catch (err) {
          // Revert optimistic update on error
          set({
            contentItems: previousItems,
            selectedContent: previousSelected,
            error:
              err instanceof Error ? err.message : "Failed to transition status",
          });
        }
      },

      // Schedules Actions
      setSchedules: (schedules) => set({ schedules }),

      setSchedulesLoading: (schedulesLoading) => set({ schedulesLoading }),

      addSchedule: (schedule) => {
        const { schedules } = get();
        set({ schedules: [...schedules, schedule] });
      },

      updateSchedule: (id, updates) => {
        const { schedules } = get();
        const newSchedules = schedules.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        );
        set({ schedules: newSchedules });
      },

      removeSchedule: (id) => {
        const { schedules } = get();
        set({ schedules: schedules.filter((s) => s.id !== id) });
      },

      refreshSchedules: async (contentId) => {
        set({ schedulesLoading: true });
        try {
          const response = await fetch(`/api/content/schedule?contentId=${contentId}`);
          const data = await response.json();

          if (data.success) {
            get().setSchedules(data.data.schedules);
          }
        } catch (err) {
          set({
            error:
              err instanceof Error ? err.message : "Failed to load schedules",
          });
        } finally {
          set({ schedulesLoading: false });
        }
      },

      // Publishing History Actions
      setPublishingHistory: (publishingHistory) => set({ publishingHistory }),

      setHistoryLoading: (historyLoading) => set({ historyLoading }),

      addPublishingRecord: (record) => {
        const { publishingHistory } = get();
        set({ publishingHistory: [...publishingHistory, record] });
      },

      refreshPublishingHistory: async (contentId) => {
        set({ historyLoading: true });
        try {
          const response = await fetch(`/api/content/history?contentId=${contentId}`);
          const data = await response.json();

          if (data.success) {
            get().setPublishingHistory(data.data.history);
          }
        } catch (err) {
          set({
            error:
              err instanceof Error
                ? err.message
                : "Failed to load publishing history",
          });
        } finally {
          set({ historyLoading: false });
        }
      },

      // Metrics Actions
      setMetrics: (metrics) => set({ metrics }),

      setMetricsLoading: (metricsLoading) => set({ metricsLoading }),

      updateMetrics: (contentId, newMetrics) => {
        const { metrics } = get();
        // Remove old metrics for this content and add new ones
        const filteredMetrics = metrics.filter((m) => m.contentId !== contentId);
        set({ metrics: [...filteredMetrics, ...newMetrics] });
      },

      refreshMetrics: async (contentId) => {
        set({ metricsLoading: true });
        try {
          const response = await fetch(`/api/content/metrics?contentId=${contentId}`);
          const data = await response.json();

          if (data.success && data.data.metrics?.byPlatform) {
            // Map the API response to ContentMetrics format
            const metricsArray: ContentMetrics[] = data.data.metrics.byPlatform.map((m: {
              platform: "wordpress" | "medium";
              views: number;
              engagementScore: number;
              lastSyncedAt: string;
            }) => ({
              id: `${contentId}-${m.platform}`,
              contentId,
              platform: m.platform,
              views: m.views,
              engagementScore: m.engagementScore,
              lastSyncedAt: m.lastSyncedAt,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));

            get().updateMetrics(contentId, metricsArray);
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to load metrics",
          });
        } finally {
          set({ metricsLoading: false });
        }
      },
    }),
    {
      name: "apex-content-workflow-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedContentId: state.selectedContentId,
        // Don't persist full data - will be refreshed on load
      }),
    }
  )
);

// Selector hooks for common queries
export const useSelectedContent = () =>
  useContentWorkflowStore((state) => state.selectedContent);

export const useContentStatus = (contentId: string) =>
  useContentWorkflowStore(
    (state) =>
      state.contentItems.find((i) => i.id === contentId)?.status ?? null
  );

export const useContentSchedules = (contentId: string) =>
  useContentWorkflowStore((state) =>
    state.schedules.filter((s) => s.contentId === contentId)
  );

export const useContentMetrics = (contentId: string) =>
  useContentWorkflowStore((state) =>
    state.metrics.filter((m) => m.contentId === contentId)
  );

export const useContentPublishingHistory = (contentId: string) =>
  useContentWorkflowStore((state) =>
    state.publishingHistory.filter((h) => h.contentId === contentId)
  );
