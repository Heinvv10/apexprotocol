import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";

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
// Checks API key headers (set by middleware) first, falls back to Clerk session
export async function getSession(): Promise<AuthSession | null> {
  // Check for API key auth headers set by middleware first
  try {
    const headersList = await headers();
    const authType = headersList.get("x-apex-auth-type");
    if (authType === "api-key") {
      const userId = headersList.get("x-apex-user-id");
      const orgId = headersList.get("x-apex-org-id");
      if (userId) {
        return {
          userId,
          orgId: orgId || null,
          orgRole: null,
          orgSlug: null,
        };
      }
    }
  } catch {
    // headers() may throw outside of request context — fall through to Clerk
  }

  // In development without Clerk, return mock session
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return {
      userId: DEV_USER_ID,
      orgId: DEV_ORG_ID,
      orgRole: "org:admin",
      orgSlug: "demo-org",
    };
  }

  try {
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
  } catch {
    if (process.env.NODE_ENV === "development") {
      return {
        userId: DEV_USER_ID,
        orgId: DEV_ORG_ID,
        orgRole: "org:admin",
        orgSlug: "demo-org",
      };
    }
    return null;
  }
}

// Mock user for development
const DEV_USER: ClerkUser = {
  id: DEV_USER_ID,
  firstName: "Dev",
  lastName: "User",
  fullName: "Dev User",
  username: "devuser",
  primaryEmailAddress: {
    emailAddress: "dev@example.com",
    id: "email_dev",
    linkedTo: [],
    verification: { status: "verified", strategy: "email_code" },
  },
  emailAddresses: [],
  phoneNumbers: [],
  web3Wallets: [],
  externalAccounts: [],
  samlAccounts: [],
  organizationMemberships: [],
  passkeys: [],
  primaryEmailAddressId: "email_dev",
  primaryPhoneNumberId: null,
  primaryWeb3WalletId: null,
  imageUrl: "",
  hasImage: false,
  twoFactorEnabled: false,
  passwordEnabled: false,
  totpEnabled: false,
  backupCodeEnabled: false,
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
  lastSignInAt: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createOrganizationEnabled: true,
  createOrganizationsLimit: null,
  deleteSelfEnabled: true,
  legalAcceptedAt: null,
  banned: false,
  locked: false,
  lockoutExpiresInSeconds: null,
} as unknown as ClerkUser;

// Get current user with organization context
export async function getCurrentUserWithOrg(): Promise<{
  user: ClerkUser;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
} | null> {
  // In development without Clerk, return mock user
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return {
      user: DEV_USER,
      orgId: DEV_ORG_ID,
      orgRole: "org:admin",
    };
  }

  try {
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
  } catch {
    if (process.env.NODE_ENV === "development") {
      return {
        user: DEV_USER,
        orgId: DEV_ORG_ID,
        orgRole: "org:admin",
      };
    }
    return null;
  }
}

// Check if user has specific organization role
export async function hasOrgRole(allowedRoles: string[]): Promise<boolean> {
  // In development without Clerk, return true for admin
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return allowedRoles.includes("org:admin");
  }

  try {
    const { orgRole } = await auth();

    if (!orgRole) {
      return false;
    }

    return allowedRoles.includes(orgRole);
  } catch {
    if (process.env.NODE_ENV === "development") {
      return allowedRoles.includes("org:admin");
    }
    return false;
  }
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
  // In development without Clerk, return mock organization
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return [{
      orgId: DEV_ORG_ID,
      orgName: "Demo Organization",
      orgSlug: "demo-org",
      role: "org:admin",
      createdAt: Date.now(),
    }];
  }

  try {
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
  } catch {
    if (process.env.NODE_ENV === "development") {
      return [{
        orgId: DEV_ORG_ID,
        orgName: "Demo Organization",
        orgSlug: "demo-org",
        role: "org:admin",
        createdAt: Date.now(),
      }];
    }
    return [];
  }
}

// Get organization details
export async function getOrganization(orgId: string) {
  // In development without Clerk, return mock organization
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return {
      id: DEV_ORG_ID,
      name: "Demo Organization",
      slug: "demo-org",
      imageUrl: null,
      createdAt: Date.now(),
      membersCount: 1,
    };
  }

  try {
    const client = await clerkClient();
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
    if (process.env.NODE_ENV === "development") {
      return {
        id: DEV_ORG_ID,
        name: "Demo Organization",
        slug: "demo-org",
        imageUrl: null,
        createdAt: Date.now(),
        membersCount: 1,
      };
    }
    return null;
  }
}

// Get organization members
export async function getOrganizationMembers(orgId: string) {
  // In development without Clerk, return mock member
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return [{
      userId: DEV_USER_ID,
      firstName: "Dev",
      lastName: "User",
      email: "dev@example.com",
      imageUrl: null,
      role: "org:admin",
      createdAt: Date.now(),
    }];
  }

  try {
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
  } catch {
    if (process.env.NODE_ENV === "development") {
      return [{
        userId: DEV_USER_ID,
        firstName: "Dev",
        lastName: "User",
        email: "dev@example.com",
        imageUrl: null,
        role: "org:admin",
        createdAt: Date.now(),
      }];
    }
    return [];
  }
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
// Returns the org ID from API key headers (set by middleware) or Clerk session,
// falls back to user ID for personal workspace
export async function getOrganizationId(): Promise<string | null> {
  // Check for API key auth headers set by middleware first
  try {
    const headersList = await headers();
    const authType = headersList.get("x-apex-auth-type");
    if (authType === "api-key") {
      const orgId = headersList.get("x-apex-org-id");
      if (orgId) return orgId;
    }
  } catch {
    // headers() may throw outside of request context — fall through to Clerk
  }

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

    // If user is authenticated but not in org context, use userId as personal workspace ID
    // This allows users without organizations to still use the platform
    if (userId && !orgId) {
      // Use user_<userId> format for personal workspaces
      return `user_${userId}`;
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
// Checks API key headers (set by middleware) first, falls back to Clerk session
export async function getUserId(): Promise<string | null> {
  // Check for API key auth headers set by middleware first
  try {
    const headersList = await headers();
    const authType = headersList.get("x-apex-auth-type");
    if (authType === "api-key") {
      const userId = headersList.get("x-apex-user-id");
      if (userId) return userId;
    }
  } catch {
    // headers() may throw outside of request context — fall through to Clerk
  }

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
// Checks API key headers (set by middleware) first, falls back to Clerk session
export async function requireAuth(): Promise<{ userId: string; orgId: string }> {
  // Check for API key auth headers set by middleware first
  try {
    const headersList = await headers();
    const authType = headersList.get("x-apex-auth-type");
    if (authType === "api-key") {
      const userId = headersList.get("x-apex-user-id");
      const orgId = headersList.get("x-apex-org-id");
      if (userId && orgId) {
        return { userId, orgId };
      }
    }
  } catch {
    // headers() may throw outside of request context — fall through to Clerk
  }

  // In development without Clerk, return dev credentials
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return { userId: DEV_USER_ID, orgId: DEV_ORG_ID };
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get org ID with fallback for development
    let organizationId = orgId;
    if (!organizationId && process.env.NODE_ENV === "development") {
      organizationId = DEV_ORG_ID;
    }

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    return { userId, orgId: organizationId };
  } catch (error) {
    // In development, return dev credentials on auth failure
    if (process.env.NODE_ENV === "development") {
      return { userId: DEV_USER_ID, orgId: DEV_ORG_ID };
    }
    throw error;
  }
}
