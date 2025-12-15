/**
 * Settings Hooks (F168, F169, F170)
 * Wire Settings UI to real APIs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  domain?: string;
  supportEmail?: string;
  timezone?: string;
  dateFormat?: string;
  language?: string;
  features: {
    audit: boolean;
    monitor: boolean;
    create: boolean;
    recommendations: boolean;
    integrations: boolean;
    billing: boolean;
  };
  limits: {
    maxBrands: number;
    maxTeamMembers: number;
    maxMentionsPerMonth: number;
    maxAuditsPerMonth: number;
  };
  billing?: {
    plan: string;
    status: string;
    customerId?: string;
    subscriptionId?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "pending" | "inactive";
  invitedAt?: string;
  joinedAt?: string;
  lastActiveAt?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamMember["role"];
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string; // First 8 chars for display
  permissions: string[];
  scopes?: string[];
  rateLimit?: number;
  lastUsedAt?: string;
  expiresAt?: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  createdBy: string;
}

export interface APIKeyCreateResponse {
  id: string;
  name: string;
  key: string; // Full key only shown once on creation
  keyPrefix: string;
  permissions: string[];
  expiresAt?: string;
  createdAt: string;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchOrganizationSettings(orgId: string): Promise<OrganizationSettings> {
  const response = await fetch(`/api/settings/organization/${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch organization settings");
  }
  return response.json();
}

async function updateOrganizationSettings(
  orgId: string,
  data: Partial<OrganizationSettings>
): Promise<OrganizationSettings> {
  const response = await fetch(`/api/settings/organization/${orgId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update organization settings");
  }
  return response.json();
}

async function fetchTeamMembers(orgId: string): Promise<TeamMember[]> {
  const response = await fetch(`/api/settings/team?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch team members");
  }
  const data = await response.json();
  return data.members || data;
}

async function fetchAPIKeys(orgId: string): Promise<APIKey[]> {
  const response = await fetch(`/api/settings/api-keys?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch API keys");
  }
  const data = await response.json();
  return data.keys || data;
}

// =============================================================================
// Organization Settings Hooks (F168)
// =============================================================================

/**
 * Hook to fetch organization settings
 */
export function useOrganizationSettings(
  orgId?: string,
  options?: Omit<UseQueryOptions<OrganizationSettings>, "queryKey" | "queryFn">
) {
  const currentOrgId = useOrganizationId();
  const targetOrgId = orgId || currentOrgId;

  return useQuery({
    queryKey: queryKeys.settings.organization(targetOrgId || ""),
    queryFn: () => fetchOrganizationSettings(targetOrgId!),
    enabled: !!targetOrgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to update organization settings
 */
export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: (data: Partial<OrganizationSettings>) =>
      updateOrganizationSettings(orgId!, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.organization(orgId!),
      });

      const previousSettings = queryClient.getQueryData<OrganizationSettings>(
        queryKeys.settings.organization(orgId!)
      );

      queryClient.setQueryData<OrganizationSettings>(
        queryKeys.settings.organization(orgId!),
        (old) =>
          old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old
      );

      return { previousSettings };
    },
    onError: (_err, _data, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.settings.organization(orgId!),
          context.previousSettings
        );
      }
    },
    onSettled: () => {
      invalidateQueries.settings(queryClient);
    },
  });
}

/**
 * Hook to upload organization logo
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch(`/api/settings/organization/${orgId}/logo`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateQueries.settings(queryClient);
    },
  });
}

// =============================================================================
// Team Members Hooks (F169)
// =============================================================================

/**
 * Hook to fetch team members
 */
export function useTeamMembers(
  orgId?: string,
  options?: Omit<UseQueryOptions<TeamMember[]>, "queryKey" | "queryFn">
) {
  const currentOrgId = useOrganizationId();
  const targetOrgId = orgId || currentOrgId;

  return useQuery({
    queryKey: queryKeys.settings.team(targetOrgId || ""),
    queryFn: () => fetchTeamMembers(targetOrgId!),
    enabled: !!targetOrgId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to invite team member
 */
export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: TeamMember["role"];
    }) => {
      const response = await fetch("/api/settings/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, orgId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to invite team member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.team(orgId!),
      });
    },
  });
}

/**
 * Hook to update team member role
 */
export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: TeamMember["role"];
    }) => {
      const response = await fetch(`/api/settings/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        throw new Error("Failed to update team member role");
      }
      return response.json();
    },
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.team(orgId!),
      });

      const previousMembers = queryClient.getQueryData<TeamMember[]>(
        queryKeys.settings.team(orgId!)
      );

      queryClient.setQueryData<TeamMember[]>(
        queryKeys.settings.team(orgId!),
        (old) => old?.map((m) => (m.id === memberId ? { ...m, role } : m))
      );

      return { previousMembers };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          queryKeys.settings.team(orgId!),
          context.previousMembers
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.team(orgId!),
      });
    },
  });
}

/**
 * Hook to remove team member
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/settings/team/${memberId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove team member");
      }
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.team(orgId!),
      });

      const previousMembers = queryClient.getQueryData<TeamMember[]>(
        queryKeys.settings.team(orgId!)
      );

      queryClient.setQueryData<TeamMember[]>(
        queryKeys.settings.team(orgId!),
        (old) => old?.filter((m) => m.id !== memberId)
      );

      return { previousMembers };
    },
    onError: (_err, _memberId, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          queryKeys.settings.team(orgId!),
          context.previousMembers
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.team(orgId!),
      });
    },
  });
}

/**
 * Hook to resend invite
 */
export function useResendInvite() {
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetch(`/api/settings/team/invite/${inviteId}/resend`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to resend invite");
      }
      return response.json();
    },
  });
}

/**
 * Hook to cancel invite
 */
export function useCancelInvite() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetch(`/api/settings/team/invite/${inviteId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel invite");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.team(orgId!),
      });
    },
  });
}

// =============================================================================
// API Keys Hooks (F170)
// =============================================================================

/**
 * Hook to fetch API keys
 */
export function useAPIKeys(
  orgId?: string,
  options?: Omit<UseQueryOptions<APIKey[]>, "queryKey" | "queryFn">
) {
  const currentOrgId = useOrganizationId();
  const targetOrgId = orgId || currentOrgId;

  return useQuery({
    queryKey: queryKeys.settings.apiKeys(targetOrgId || ""),
    queryFn: () => fetchAPIKeys(targetOrgId!),
    enabled: !!targetOrgId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to create API key
 */
export function useCreateAPIKey() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      name,
      permissions,
      expiresIn,
    }: {
      name: string;
      permissions: string[];
      expiresIn?: string; // e.g., "30d", "90d", "1y", "never"
    }): Promise<APIKeyCreateResponse> => {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions, expiresIn, orgId }),
      });
      if (!response.ok) {
        throw new Error("Failed to create API key");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.apiKeys(orgId!),
      });
    },
  });
}

/**
 * Hook to revoke API key
 */
export function useRevokeAPIKey() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }
    },
    onMutate: async (keyId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.apiKeys(orgId!),
      });

      const previousKeys = queryClient.getQueryData<APIKey[]>(
        queryKeys.settings.apiKeys(orgId!)
      );

      queryClient.setQueryData<APIKey[]>(
        queryKeys.settings.apiKeys(orgId!),
        (old) =>
          old?.map((key) =>
            key.id === keyId ? { ...key, status: "revoked" as const } : key
          )
      );

      return { previousKeys };
    },
    onError: (_err, _keyId, context) => {
      if (context?.previousKeys) {
        queryClient.setQueryData(
          queryKeys.settings.apiKeys(orgId!),
          context.previousKeys
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.apiKeys(orgId!),
      });
    },
  });
}

/**
 * Hook to regenerate API key
 */
export function useRegenerateAPIKey() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (keyId: string): Promise<APIKeyCreateResponse> => {
      const response = await fetch(`/api/settings/api-keys/${keyId}/regenerate`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate API key");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.apiKeys(orgId!),
      });
    },
  });
}

/**
 * Hook to update API key name
 */
export function useUpdateAPIKeyName() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({ keyId, name }: { keyId: string; name: string }) => {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error("Failed to update API key");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.apiKeys(orgId!),
      });
    },
  });
}

// =============================================================================
// User Preferences Hooks
// =============================================================================

/**
 * Hook to fetch user preferences
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: ["user", "preferences"],
    queryFn: async () => {
      const response = await fetch("/api/user/preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to update user preferences
 */
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Record<string, unknown>) => {
      const response = await fetch("/api/user/preferences", {
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
      queryClient.invalidateQueries({ queryKey: ["user", "preferences"] });
    },
  });
}
