import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface SidebarState {
  isCollapsed: boolean;
  isOpen: boolean; // For mobile drawer
  pinnedItems: string[];
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "small" | "medium" | "large";
}

interface ConnectivitySettings {
  lowBandwidthMode: boolean;
  loadsheddingMode: boolean;
  offlineMode: boolean;
}

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  pinSidebarItem: (itemId: string) => void;
  unpinSidebarItem: (itemId: string) => void;

  // Navigation
  breadcrumbs: Array<{ label: string; href?: string }>;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void;

  // Notifications
  notificationPreferences: NotificationPreferences;
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;

  // Accessibility
  accessibility: AccessibilitySettings;
  setAccessibilitySetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;

  // Connectivity
  connectivity: ConnectivitySettings;
  setConnectivitySetting: <K extends keyof ConnectivitySettings>(
    key: K,
    value: ConnectivitySettings[K]
  ) => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Active views / panels
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Tour / onboarding
  hasCompletedTour: boolean;
  setHasCompletedTour: (completed: boolean) => void;
  currentTourStep: number;
  setCurrentTourStep: (step: number) => void;

  // Reset
  resetUIState: () => void;
}

const initialState = {
  theme: "dark" as Theme,
  sidebar: {
    isCollapsed: false,
    isOpen: false,
    pinnedItems: [],
  },
  breadcrumbs: [],
  notificationPreferences: {
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: false,
    desktopNotifications: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontSize: "medium" as const,
  },
  connectivity: {
    lowBandwidthMode: false,
    loadsheddingMode: false,
    offlineMode: false,
  },
  isCommandPaletteOpen: false,
  activePanel: null,
  recentSearches: [],
  hasCompletedTour: false,
  currentTourStep: 0,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Theme
      setTheme: (theme) => set({ theme }),

      // Sidebar
      toggleSidebar: () =>
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: !state.sidebar.isCollapsed },
        })),
      setSidebarCollapsed: (collapsed) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: collapsed },
        })),
      toggleMobileSidebar: () =>
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
        })),
      setMobileSidebarOpen: (open) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: open },
        })),
      pinSidebarItem: (itemId) =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            pinnedItems: state.sidebar.pinnedItems.includes(itemId)
              ? state.sidebar.pinnedItems
              : [...state.sidebar.pinnedItems, itemId],
          },
        })),
      unpinSidebarItem: (itemId) =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            pinnedItems: state.sidebar.pinnedItems.filter((id) => id !== itemId),
          },
        })),

      // Navigation
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      // Notifications
      setNotificationPreference: (key, value) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: value,
          },
        })),

      // Accessibility
      setAccessibilitySetting: (key, value) =>
        set((state) => ({
          accessibility: {
            ...state.accessibility,
            [key]: value,
          },
        })),

      // Connectivity
      setConnectivitySetting: (key, value) =>
        set((state) => ({
          connectivity: {
            ...state.connectivity,
            [key]: value,
          },
        })),

      // Command palette
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

      // Active panel
      setActivePanel: (panel) => set({ activePanel: panel }),

      // Recent searches
      addRecentSearch: (query) =>
        set((state) => {
          const searches = [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 10);
          return { recentSearches: searches };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Tour
      setHasCompletedTour: (completed) => set({ hasCompletedTour: completed }),
      setCurrentTourStep: (step) => set({ currentTourStep: step }),

      // Reset
      resetUIState: () => set(initialState),
    }),
    {
      name: "apex-ui-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebar: state.sidebar,
        notificationPreferences: state.notificationPreferences,
        accessibility: state.accessibility,
        connectivity: state.connectivity,
        recentSearches: state.recentSearches,
        hasCompletedTour: state.hasCompletedTour,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const useConnectivity = () => useUIStore((state) => state.connectivity);
export const useAccessibility = () => useUIStore((state) => state.accessibility);
