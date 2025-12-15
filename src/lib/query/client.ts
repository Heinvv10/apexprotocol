/**
 * TanStack Query Client Configuration (F152)
 * Server state management with caching, refetching, and background updates
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";

// Default stale time - data is considered fresh for 1 minute
const DEFAULT_STALE_TIME = 1000 * 60;

// Default cache time - unused data is garbage collected after 5 minutes
const DEFAULT_GC_TIME = 1000 * 60 * 5;

/**
 * Create Query Client with default configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 1 minute
        staleTime: DEFAULT_STALE_TIME,
        // Keep unused data in cache for 5 minutes
        gcTime: DEFAULT_GC_TIME,
        // Retry failed requests up to 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus
        refetchOnWindowFocus: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: true,
        // Enable background refetching
        refetchInterval: false, // Can be overridden per query
        // Network mode - always try to fetch
        networkMode: "online",
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
        retryDelay: 1000,
        // Network mode
        networkMode: "online",
      },
    },
  });
}

/**
 * Singleton query client for the app
 */
let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    organization: () => [...queryKeys.auth.all, "organization"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // Brands
  brands: {
    all: ["brands"] as const,
    lists: () => [...queryKeys.brands.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.brands.lists(), filters] as const,
    details: () => [...queryKeys.brands.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.brands.details(), id] as const,
    settings: (id: string) => [...queryKeys.brands.detail(id), "settings"] as const,
  },

  // Mentions
  mentions: {
    all: ["mentions"] as const,
    lists: () => [...queryKeys.mentions.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.mentions.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.mentions.all, "detail", id] as const,
    byBrand: (brandId: string) => [...queryKeys.mentions.all, "brand", brandId] as const,
    analytics: (brandId: string, range?: string) =>
      [...queryKeys.mentions.byBrand(brandId), "analytics", range] as const,
  },

  // Audits
  audits: {
    all: ["audits"] as const,
    lists: () => [...queryKeys.audits.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.audits.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.audits.all, "detail", id] as const,
    byBrand: (brandId: string) => [...queryKeys.audits.all, "brand", brandId] as const,
    issues: (auditId: string) => [...queryKeys.audits.detail(auditId), "issues"] as const,
  },

  // Recommendations
  recommendations: {
    all: ["recommendations"] as const,
    lists: () => [...queryKeys.recommendations.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.recommendations.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.recommendations.all, "detail", id] as const,
    byBrand: (brandId: string) =>
      [...queryKeys.recommendations.all, "brand", brandId] as const,
  },

  // Content
  content: {
    all: ["content"] as const,
    lists: () => [...queryKeys.content.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.content.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.content.all, "detail", id] as const,
    byBrand: (brandId: string) => [...queryKeys.content.all, "brand", brandId] as const,
    templates: () => [...queryKeys.content.all, "templates"] as const,
  },

  // Analytics
  analytics: {
    all: ["analytics"] as const,
    dashboard: (brandId?: string) =>
      [...queryKeys.analytics.all, "dashboard", brandId] as const,
    geoScore: (brandId: string) =>
      [...queryKeys.analytics.all, "geoScore", brandId] as const,
    trends: (brandId: string, range?: string) =>
      [...queryKeys.analytics.all, "trends", brandId, range] as const,
    platforms: (brandId: string) =>
      [...queryKeys.analytics.all, "platforms", brandId] as const,
  },

  // Gamification
  gamification: {
    all: ["gamification"] as const,
    profile: (userId?: string) =>
      [...queryKeys.gamification.all, "profile", userId] as const,
    progress: (userId?: string) =>
      [...queryKeys.gamification.all, "progress", userId] as const,
    achievements: (userId?: string) =>
      [...queryKeys.gamification.all, "achievements", userId] as const,
    leaderboard: (timeframe?: string) =>
      [...queryKeys.gamification.all, "leaderboard", timeframe] as const,
  },

  // Settings
  settings: {
    all: ["settings"] as const,
    organization: (orgId?: string) =>
      [...queryKeys.settings.all, "organization", orgId] as const,
    user: (userId?: string) => [...queryKeys.settings.all, "user", userId] as const,
    team: (orgId?: string) => [...queryKeys.settings.all, "team", orgId] as const,
    apiKeys: (orgId?: string) => [...queryKeys.settings.all, "apiKeys", orgId] as const,
    integrations: (orgId?: string) =>
      [...queryKeys.settings.all, "integrations", orgId] as const,
    billing: () => [...queryKeys.settings.all, "billing"] as const,
  },

  // Notifications
  // Onboarding
  onboarding: {
    all: ["onboarding"] as const,
    status: () => [...queryKeys.onboarding.all, "status"] as const,
  },

  // Notifications
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.notifications.all, "detail", id] as const,
    unread: () => [...queryKeys.notifications.all, "unread"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
  },

  // Usage
  usage: {
    all: ["usage"] as const,
    summary: (orgId?: string, period?: string) =>
      [...queryKeys.usage.all, "summary", orgId, period] as const,
    metric: (orgId?: string, metricType?: string) =>
      [...queryKeys.usage.all, "metric", orgId, metricType] as const,
    breakdown: (orgId?: string) =>
      [...queryKeys.usage.all, "breakdown", orgId] as const,
    history: (orgId?: string, period?: string) =>
      [...queryKeys.usage.all, "history", orgId, period] as const,
    quotas: (orgId?: string) =>
      [...queryKeys.usage.all, "quotas", orgId] as const,
    realtime: (orgId?: string) =>
      [...queryKeys.usage.all, "realtime", orgId] as const,
  },

  // Health
  health: {
    all: ["health"] as const,
    status: () => [...queryKeys.health.all, "status"] as const,
    detailed: () => [...queryKeys.health.all, "detailed"] as const,
  },
} as const;

/**
 * Invalidation helpers
 */
export const invalidateQueries = {
  brands: (client: QueryClient) => client.invalidateQueries({ queryKey: queryKeys.brands.all }),
  mentions: (client: QueryClient) => client.invalidateQueries({ queryKey: queryKeys.mentions.all }),
  audits: (client: QueryClient) => client.invalidateQueries({ queryKey: queryKeys.audits.all }),
  recommendations: (client: QueryClient) =>
    client.invalidateQueries({ queryKey: queryKeys.recommendations.all }),
  content: (client: QueryClient) => client.invalidateQueries({ queryKey: queryKeys.content.all }),
  analytics: (client: QueryClient) =>
    client.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  gamification: (client: QueryClient) =>
    client.invalidateQueries({ queryKey: queryKeys.gamification.all }),
  settings: (client: QueryClient) => client.invalidateQueries({ queryKey: queryKeys.settings.all }),
  notifications: (client: QueryClient) =>
    client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  usage: (client: QueryClient) =>
    client.invalidateQueries({ queryKey: queryKeys.usage.all }),
  all: (client: QueryClient) => client.invalidateQueries(),
};

export { QueryClientProvider, ReactQueryDevtools };
export type { QueryClient };
