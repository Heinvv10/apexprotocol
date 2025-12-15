// Auth exports for Apex platform

export {
  auth,
  currentUser,
  clerkClient,
  getSession,
  getCurrentUserWithOrg,
  hasOrgRole,
  isOrgAdmin,
  isOrgMember,
  getUserOrganizations,
  getOrganization,
  getOrganizationMembers,
  extractUserData,
  extractOrgData,
  getOrganizationId,
  getUserId,
  requireAuth,
  type AuthSession,
  type ClerkUserData,
  type ClerkOrgData,
} from "./clerk";
