/**
 * Notifications Hooks (F174)
 * Wire In-App Notifications to real APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import { useAuthStore } from "@/stores/auth";
import { useCallback, useEffect } from "react";

// =============================================================================
// Types
// =============================================================================

export type NotificationType =
  | "mention"
  | "score_change"
  | "recommendation"
  | "important";

export type NotificationStatus = "unread" | "read" | "archived";

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  // Computed status for backward compatibility with UI components
  status?: NotificationStatus;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  since?: string;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationPreferences {
  id?: string;
  userId: string;
  organizationId: string;
  emailEnabled: boolean;
  emailDigestFrequency: "none" | "daily" | "weekly";
  emailDigestHour: number;
  inAppEnabled: boolean;
  notificationTypes: NotificationType[];
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchNotifications(
  filters: NotificationFilters = {}
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/notifications?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  const data = await response.json();

  // Transform API response to include computed status field for UI compatibility
  if (data.success && data.data?.notifications) {
    data.data.notifications = data.data.notifications.map((n: Notification) => ({
      ...n,
      status: n.isArchived ? "archived" : n.isRead ? "read" : "unread",
      actionUrl: n.metadata?.linkUrl,
    }));
    return data.data;
  }

  return data;
}

async function fetchUnreadCount(): Promise<number> {
  const response = await fetch("/api/notifications/unread-count");
  if (!response.ok) {
    throw new Error("Failed to fetch unread count");
  }
  const data = await response.json();
  return data.success ? data.data.count : 0;
}

// =============================================================================
// Notification List Hooks
// =============================================================================

/**
 * Hook to fetch notifications with filters
 */
export function useNotifications(
  filters: NotificationFilters = {},
  options?: Omit<UseQueryOptions<NotificationListResponse>, "queryKey" | "queryFn">
) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.notifications.list(filters as Record<string, unknown>),
    queryFn: () => fetchNotifications(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    enabled: !!user,
    ...options,
  });
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadNotificationCount() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: fetchUnreadCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    enabled: !!user,
  });
}

/**
 * Hook to fetch single notification
 */
export function useNotification(
  id: string,
  options?: Omit<UseQueryOptions<Notification>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/notifications/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notification");
      }
      return response.json();
    },
    enabled: !!id,
    ...options,
  });
}

// =============================================================================
// Notification Mutation Hooks
// =============================================================================

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.detail(id),
      });

      const previousNotification = queryClient.getQueryData<Notification>(
        queryKeys.notifications.detail(id)
      );

      queryClient.setQueryData<Notification>(
        queryKeys.notifications.detail(id),
        (old) =>
          old
            ? {
                ...old,
                isRead: true,
                status: "read" as NotificationStatus,
                readAt: new Date().toISOString()
              }
            : old
      );

      // Optimistically decrement unread count
      queryClient.setQueryData<number>(
        queryKeys.notifications.unreadCount(),
        (old) => (old && old > 0 ? old - 1 : 0)
      );

      return { previousNotification };
    },
    onError: (_err, id, context) => {
      if (context?.previousNotification) {
        queryClient.setQueryData(
          queryKeys.notifications.detail(id),
          context.previousNotification
        );
      }
    },
    onSettled: () => {
      invalidateQueries.notifications(queryClient);
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      // Set unread count to 0 optimistically
      queryClient.setQueryData<number>(
        queryKeys.notifications.unreadCount(),
        0
      );
    },
    onSettled: () => {
      invalidateQueries.notifications(queryClient);
    },
  });
}

/**
 * Hook to archive notification
 */
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/archive`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to archive notification");
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      });

      // Remove from list optimistically
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) =>
          old
            ? {
                ...old,
                notifications: old.notifications.filter((n) => n.id !== id),
                total: old.total - 1,
              }
            : old
      );

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      invalidateQueries.notifications(queryClient);
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }
    },
    onSettled: () => {
      invalidateQueries.notifications(queryClient);
    },
  });
}

/**
 * Hook to bulk archive notifications
 */
export function useBulkArchiveNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/notifications/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw new Error("Failed to archive notifications");
      }
      return response.json();
    },
    onSettled: () => {
      invalidateQueries.notifications(queryClient);
    },
  });
}

/**
 * Hook to clear all notifications
 */
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/clear", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }
      return response.json();
    },
    onSettled: () => {
      invalidateQueries.notifications(queryClient);
    },
  });
}

// =============================================================================
// Notification Preferences Hooks
// =============================================================================

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      return response.json() as Promise<NotificationPreferences>;
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
  });
}

// =============================================================================
// Real-time Notification Hooks
// =============================================================================

/**
 * Hook to subscribe to real-time notifications
 */
export function useNotificationSubscription(
  onNotification?: (notification: Notification) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up SSE or WebSocket connection for real-time notifications
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;

        // Call the callback if provided
        if (onNotification) {
          onNotification(notification);
        }

        // Invalidate queries to refetch
        invalidateQueries.notifications(queryClient);
      } catch {
        // Silent fail for parse errors
      }
    };

    eventSource.onerror = () => {
      // Reconnect logic is handled by EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, onNotification]);
}

/**
 * Hook to request push notification permission
 */
export function useRequestPushPermission() {
  return useMutation({
    mutationFn: async () => {
      if (!("Notification" in window)) {
        throw new Error("Push notifications not supported");
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // Register service worker and get subscription
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        const response = await fetch("/api/notifications/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (!response.ok) {
          throw new Error("Failed to register push subscription");
        }

        return { permission: "granted", subscription };
      }

      return { permission };
    },
  });
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Hook for notification bell component
 * Provides recent unread notifications and actions for the notification bell dropdown
 */
export function useNotificationBell() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data } = useNotifications({ limit: 10 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  return {
    unreadCount,
    recentNotifications: data?.notifications ?? [],
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

/**
 * Hook to show toast notification for new notifications
 */
export function useNotificationToast() {
  const queryClient = useQueryClient();

  const showNotification = useCallback(
    (notification: Notification) => {
      // If browser notifications are enabled and permission granted
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/icon.png",
          tag: notification.id,
        });
      }

      // Invalidate to show in bell dropdown
      invalidateQueries.notifications(queryClient);
    },
    [queryClient]
  );

  return { showNotification };
}
