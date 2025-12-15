import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/nextjs/server";

// Re-export Clerk auth function for server-side use
export { auth, currentUser, clerkClient };

// Check if Clerk is properly configured
const CLERK_CONFIGURED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

// Dev mode fallback values
const DEV_USER_ID = "dev-user-id";
const DEV_ORG_ID = "demo-org-id";

// Type for authenticated session
export interface AuthSession {
  userId: string;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
  orgSlug: string | null | undefined;
}

// Get current session data
export async function getSession(): Promise<AuthSession | null> {
  const { userId, orgId, orgRole, orgSlug } = await auth();

  if (!userId) {
    return null;
  }

  return {
    userId,
    orgId,
    orgRole,
    orgSlug,
  };
}

// Get current user with organization context
export async function getCurrentUserWithOrg(): Promise<{
  user: ClerkUser;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
} | null> {
  const user = await currentUser();
  const { orgId, orgRole } = await auth();

  if (!user) {
    return null;
  }

  return {
    user,
    orgId,
    orgRole,
  };
}

// Check if user has specific organization role
export async function hasOrgRole(allowedRoles: string[]): Promise<boolean> {
  const { orgRole } = await auth();

  if (!orgRole) {
    return false;
  }

  return allowedRoles.includes(orgRole);
}

// Check if user is admin (org:admin role)
export async function isOrgAdmin(): Promise<boolean> {
  return hasOrgRole(["org:admin"]);
}

// Check if user is at least a member
export async function isOrgMember(): Promise<boolean> {
  return hasOrgRole(["org:admin", "org:member"]);
}

// Get user's organizations
export async function getUserOrganizations(userId: string) {
  const client = await clerkClient();

  const memberships = await client.users.getOrganizationMembershipList({
    userId,
  });

  return memberships.data.map((membership) => ({
    orgId: membership.organization.id,
    orgName: membership.organization.name,
    orgSlug: membership.organization.slug,
    role: membership.role,
    createdAt: membership.createdAt,
  }));
}

// Get organization details
export async function getOrganization(orgId: string) {
  const client = await clerkClient();

  try {
    const org = await client.organizations.getOrganization({ organizationId: orgId });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      imageUrl: org.imageUrl,
      createdAt: org.createdAt,
      membersCount: org.membersCount,
    };
  } catch {
    return null;
  }
}

// Get organization members
export async function getOrganizationMembers(orgId: string) {
  const client = await clerkClient();

  const members = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
  });

  return members.data.map((member) => ({
    userId: member.publicUserData?.userId,
    firstName: member.publicUserData?.firstName,
    lastName: member.publicUserData?.lastName,
    email: member.publicUserData?.identifier,
    imageUrl: member.publicUserData?.imageUrl,
    role: member.role,
    createdAt: member.createdAt,
  }));
}

// Sync helpers for webhook processing
export interface ClerkUserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface ClerkOrgData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

// Extract user data from Clerk webhook
export function extractUserData(data: Record<string, unknown>): ClerkUserData {
  const emailAddresses = data.email_addresses as Array<{ email_address: string }> | undefined;

  return {
    id: data.id as string,
    email: emailAddresses?.[0]?.email_address ?? "",
    firstName: (data.first_name as string | null) ?? null,
    lastName: (data.last_name as string | null) ?? null,
    imageUrl: (data.image_url as string | null) ?? null,
  };
}

// Extract organization data from Clerk webhook
export function extractOrgData(data: Record<string, unknown>): ClerkOrgData {
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    imageUrl: (data.image_url as string | null) ?? null,
  };
}

// Get organization ID for API routes
// Returns the org ID from Clerk session, falls back to demo-org-id in development
export async function getOrganizationId(): Promise<string | null> {
  // In development without Clerk, return demo org ID
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return DEV_ORG_ID;
  }

  try {
    const { orgId, userId } = await auth();

    // Return org ID if user is in an organization context
    if (orgId) {
      return orgId;
    }

    // If user is authenticated but not in org context, return null
    // The API should prompt them to select/create an organization
    if (userId && !orgId) {
      // In development, fall back to demo-org-id for testing
      if (process.env.NODE_ENV === "development") {
        return DEV_ORG_ID;
      }
      return null;
    }

    return null;
  } catch {
    // If auth fails entirely, return demo org in development
    if (process.env.NODE_ENV === "development") {
      return DEV_ORG_ID;
    }
    return null;
  }
}

// Get user ID for API routes
export async function getUserId(): Promise<string | null> {
  // In development without Clerk, return demo user ID
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return DEV_USER_ID;
  }

  try {
    const { userId } = await auth();
    return userId;
  } catch {
    // If auth fails entirely, return demo user in development
    if (process.env.NODE_ENV === "development") {
      return DEV_USER_ID;
    }
    return null;
  }
}

// Require authentication - throws if not authenticated
export async function requireAuth(): Promise<{ userId: string; orgId: string }> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  // Get org ID with fallback for development
  let organizationId = orgId;
  if (!organizationId && process.env.NODE_ENV === "development") {
    organizationId = "demo-org-id";
  }

  if (!organizationId) {
    throw new Error("Organization context required");
  }

  return { userId, orgId: organizationId };
}
