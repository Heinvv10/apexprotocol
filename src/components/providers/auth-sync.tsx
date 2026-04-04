"use client";

import { useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/auth";

/**
 * AuthSync — bridges Clerk session into Zustand auth store.
 * Must be rendered inside ClerkProvider on every authenticated page.
 * Without this, useAuthStore().user is always null and all data hooks
 * stay permanently disabled (enabled: !!user never fires).
 */
export function AuthSync() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();
  const setUser = useAuthStore((s) => s.setUser);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const setMembership = useAuthStore((s) => s.setMembership);

  useEffect(() => {
    if (!userLoaded) return;
    if (!isSignedIn || !user) {
      setUser(null);
      return;
    }
    setUser({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      fullName: user.fullName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      username: user.username ?? undefined,
    });
  }, [userLoaded, isSignedIn, user, setUser]);

  useEffect(() => {
    if (!orgLoaded) return;
    if (organization) {
      setOrganization({
        id: organization.id,
        name: organization.name,
        slug: organization.slug ?? undefined,
        imageUrl: organization.imageUrl ?? undefined,
      });
    } else {
      setOrganization(null);
    }
    if (membership) {
      setMembership({
        id: membership.id,
        role: membership.role,
        userId: membership.publicUserData?.userId ?? "",
        organizationId: organization?.id ?? "",
      });
    } else {
      setMembership(null);
    }
  }, [orgLoaded, organization, membership, setOrganization, setMembership]);

  return null;
}
