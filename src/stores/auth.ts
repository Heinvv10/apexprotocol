/**
 * Auth Store (F154)
 * Global auth state with user and organization info from Clerk
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand/middleware";

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  imageUrl?: string;
  username?: string;
  createdAt?: string;
  lastSignInAt?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  externalId?: string;
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  createdAt?: string;
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
  maxAllowedMemberships?: number;
  adminDeleteEnabled?: boolean;
  membersCount?: number;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: "admin" | "member" | "basic_member" | string;
  createdAt?: string;
  permissions?: string[];
}

export interface Session {
  id: string;
  userId: string;
  status: "active" | "ended" | "expired" | "removed" | "abandoned";
  lastActiveAt?: string;
  expireAt?: string;
  abandonAt?: string;
}

export interface AuthState {
  // State
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  organization: Organization | null;
  membership: OrganizationMembership | null;
  session: Session | null;

  // Derived state
  userId: string | null;
  organizationId: string | null;
  userRole: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setMembership: (membership: OrganizationMembership | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  setIsSignedIn: (signedIn: boolean) => void;

  // Batch update
  setAuthState: (state: Partial<{
    user: User | null;
    organization: Organization | null;
    membership: OrganizationMembership | null;
    session: Session | null;
    isLoaded: boolean;
    isSignedIn: boolean;
  }>) => void;

  // Reset
  reset: () => void;

  // Helpers
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  isLoaded: false,
  isSignedIn: false,
  user: null,
  organization: null,
  membership: null,
  session: null,
  userId: null,
  organizationId: null,
  userRole: null,
};

// =============================================================================
// Store
// =============================================================================

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions
        setUser: (user) =>
          set(
            { user, userId: user?.id || null, isSignedIn: !!user },
            false,
            "setUser"
          ),

        setOrganization: (organization) =>
          set(
            { organization, organizationId: organization?.id || null },
            false,
            "setOrganization"
          ),

        setMembership: (membership) =>
          set(
            { membership, userRole: membership?.role || null },
            false,
            "setMembership"
          ),

        setSession: (session) => set({ session }, false, "setSession"),

        setIsLoaded: (isLoaded) => set({ isLoaded }, false, "setIsLoaded"),

        setIsSignedIn: (isSignedIn) => set({ isSignedIn }, false, "setIsSignedIn"),

        setAuthState: (newState) =>
          set(
            (state) => ({
              ...state,
              ...newState,
              userId: newState.user !== undefined ? newState.user?.id || null : state.userId,
              organizationId:
                newState.organization !== undefined
                  ? newState.organization?.id || null
                  : state.organizationId,
              userRole:
                newState.membership !== undefined
                  ? newState.membership?.role || null
                  : state.userRole,
              isSignedIn:
                newState.user !== undefined ? !!newState.user : state.isSignedIn,
            }),
            false,
            "setAuthState"
          ),

        reset: () => set(initialState, false, "reset"),

        // Helpers
        hasRole: (role: string) => {
          const { membership } = get();
          return membership?.role === role;
        },

        hasPermission: (permission: string) => {
          const { membership } = get();
          return membership?.permissions?.includes(permission) || false;
        },

        isAdmin: () => {
          const { membership } = get();
          return membership?.role === "admin" || membership?.role === "org:admin";
        },

        isMember: () => {
          const { membership } = get();
          return !!membership;
        },
      }),
      {
        name: "apex-auth-store",
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          // Only persist these fields
          user: state.user,
          organization: state.organization,
          membership: state.membership,
          isSignedIn: state.isSignedIn,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectOrganization = (state: AuthState) => state.organization;
export const selectMembership = (state: AuthState) => state.membership;
export const selectSession = (state: AuthState) => state.session;
export const selectIsLoaded = (state: AuthState) => state.isLoaded;
export const selectIsSignedIn = (state: AuthState) => state.isSignedIn;
export const selectUserId = (state: AuthState) => state.userId;
export const selectOrganizationId = (state: AuthState) => state.organizationId;
export const selectUserRole = (state: AuthState) => state.userRole;

// Compound selectors
export const selectAuthInfo = (state: AuthState) => ({
  user: state.user,
  organization: state.organization,
  membership: state.membership,
  isSignedIn: state.isSignedIn,
});

export const selectUserInfo = (state: AuthState) => ({
  id: state.userId,
  email: state.user?.email,
  name: state.user?.fullName,
  imageUrl: state.user?.imageUrl,
});

export const selectOrgInfo = (state: AuthState) => ({
  id: state.organizationId,
  name: state.organization?.name,
  slug: state.organization?.slug,
  imageUrl: state.organization?.imageUrl,
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to get current user
 */
export function useUser() {
  return useAuthStore(selectUser);
}

/**
 * Hook to get current organization
 */
export function useOrganization() {
  return useAuthStore(selectOrganization);
}

/**
 * Hook to check if signed in
 */
export function useIsSignedIn() {
  return useAuthStore(selectIsSignedIn);
}

/**
 * Hook to check if auth is loaded
 */
export function useIsLoaded() {
  return useAuthStore(selectIsLoaded);
}

/**
 * Hook to get user ID
 */
export function useUserId() {
  return useAuthStore(selectUserId);
}

/**
 * Hook to get organization ID
 */
export function useOrganizationId() {
  return useAuthStore(selectOrganizationId);
}

/**
 * Hook to get user role in current organization
 */
export function useUserRole() {
  return useAuthStore(selectUserRole);
}

/**
 * Hook to check admin status
 */
export function useIsAdmin() {
  return useAuthStore((state) => state.isAdmin());
}

/**
 * Combined auth info hook
 */
export function useAuth() {
  return useAuthStore(selectAuthInfo);
}

// =============================================================================
// Helper: Sync with Clerk
// =============================================================================

/**
 * Sync Clerk user data to auth store
 * Call this in your Clerk integration component
 */
export function syncClerkToStore(clerkData: {
  user?: User | null;
  organization?: Organization | null;
  membership?: OrganizationMembership | null;
  session?: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}) {
  const store = useAuthStore.getState();
  store.setAuthState({
    user: clerkData.user ?? null,
    organization: clerkData.organization ?? null,
    membership: clerkData.membership ?? null,
    session: clerkData.session ?? null,
    isLoaded: clerkData.isLoaded,
    isSignedIn: clerkData.isSignedIn,
  });
}
