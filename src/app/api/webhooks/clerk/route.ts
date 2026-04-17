import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { WebhookEvent, UserJSON, OrganizationJSON, OrganizationMembershipJSON } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  // Get the webhook secret from env
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data as UserJSON);
        break;

      case "user.updated":
        await handleUserUpdated(evt.data as UserJSON);
        break;

      case "user.deleted":
        await handleUserDeleted(evt.data as { id?: string });
        break;

      case "organization.created":
        await handleOrgCreated(evt.data as OrganizationJSON);
        break;

      case "organization.updated":
        await handleOrgUpdated(evt.data as OrganizationJSON);
        break;

      case "organization.deleted":
        await handleOrgDeleted(evt.data as { id?: string });
        break;

      case "organizationMembership.created":
        await handleMembershipCreated(evt.data as OrganizationMembershipJSON);
        break;

      case "organizationMembership.updated":
        await handleMembershipUpdated(evt.data as OrganizationMembershipJSON);
        break;

      case "organizationMembership.deleted":
        await handleMembershipDeleted(evt.data as OrganizationMembershipJSON);
        break;

      default:
        // Log unhandled events but don't error
        break;
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Handler functions for each event type

async function handleUserCreated(data: UserJSON) {
  const email = data.email_addresses?.[0]?.email_address ?? "";
  const firstName = data.first_name ?? "";
  const lastName = data.last_name ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || null;
  const imageUrl = data.image_url ?? null;

  await db.insert(users).values({
    clerkUserId: data.id,
    email,
    name,
    avatarUrl: imageUrl,
    role: "viewer",
  });
}

async function handleUserUpdated(data: UserJSON) {
  const email = data.email_addresses?.[0]?.email_address ?? "";
  const firstName = data.first_name ?? "";
  const lastName = data.last_name ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || null;
  const imageUrl = data.image_url ?? null;

  await db
    .update(users)
    .set({
      email,
      name,
      avatarUrl: imageUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, data.id));
}

async function handleUserDeleted(data: { id?: string }) {
  const clerkId = data.id;

  if (clerkId) {
    await db.delete(users).where(eq(users.clerkUserId, clerkId));
  }
}

async function handleOrgCreated(data: OrganizationJSON) {
  const name = data.name;
  const slug = data.slug || name.toLowerCase().replace(/\s+/g, "-");
  const imageUrl = data.image_url ?? null;

  await db.insert(organizations).values({
    clerkOrgId: data.id,
    name,
    slug,
    plan: "starter",
    branding: {
      themeId: "apexgeo-default",
      primaryColor: "#00E5CC",
      accentColor: "#8B5CF6",
      logoUrl: imageUrl,
      logoDarkUrl: null,
      faviconUrl: null,
      appName: null,
      tagline: null,
      customDomain: null,
      supportEmail: null,
      showPoweredBy: true,
      customFooterText: null,
    },
  });
}

async function handleOrgUpdated(data: OrganizationJSON) {
  const name = data.name;
  const slug = data.slug || name.toLowerCase().replace(/\s+/g, "-");

  await db
    .update(organizations)
    .set({
      name,
      slug,
      updatedAt: new Date(),
    })
    .where(eq(organizations.clerkOrgId, data.id));
}

async function handleOrgDeleted(data: { id?: string }) {
  const clerkOrgId = data.id;

  if (clerkOrgId) {
    await db.delete(organizations).where(eq(organizations.clerkOrgId, clerkOrgId));
  }
}

async function handleMembershipCreated(data: OrganizationMembershipJSON) {
  const userId = data.public_user_data?.user_id;
  const orgId = data.organization?.id;
  const role = data.role;

  if (userId && orgId) {
    // Get the organization from our database
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.clerkOrgId, orgId))
      .limit(1);

    if (org.length > 0) {
      // Update user's organization association
      await db
        .update(users)
        .set({
          organizationId: org[0].id,
          role: role === "org:admin" ? "admin" : "viewer",
          updatedAt: new Date(),
        })
        .where(eq(users.clerkUserId, userId));
    }
  }
}

async function handleMembershipUpdated(data: OrganizationMembershipJSON) {
  const userId = data.public_user_data?.user_id;
  const role = data.role;

  if (userId) {
    await db
      .update(users)
      .set({
        role: role === "org:admin" ? "admin" : "viewer",
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, userId));
  }
}

async function handleMembershipDeleted(data: OrganizationMembershipJSON) {
  const userId = data.public_user_data?.user_id;

  if (userId) {
    // Remove organization association
    await db
      .update(users)
      .set({
        organizationId: null,
        role: "viewer",
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, userId));
  }
}
