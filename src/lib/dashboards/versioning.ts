/**
 * Dashboard versioning service.
 *
 * saveDashboard() always creates a new version row and moves head. Rollback
 * creates a NEW version that copies an old config forward — preserving the
 * full history and provenance link.
 *
 * Paired with the audit-logger so every save is auditable independently
 * of the version row itself.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dashboards,
  dashboardVersions,
  type DashboardConfig,
} from "@/lib/db/schema";

export interface SaveDashboardArgs {
  organizationId: string;
  slug: string;
  name: string;
  authorId: string;
  config: DashboardConfig;
  message?: string;
}

export async function saveDashboard(args: SaveDashboardArgs) {
  return db.transaction(async (tx) => {
    // Upsert the dashboard row
    const existing = await tx
      .select()
      .from(dashboards)
      .where(
        and(
          eq(dashboards.organizationId, args.organizationId),
          eq(dashboards.slug, args.slug),
        ),
      )
      .limit(1);

    let dashboardId: string;
    if (existing.length === 0) {
      const [created] = await tx
        .insert(dashboards)
        .values({
          organizationId: args.organizationId,
          slug: args.slug,
          name: args.name,
          createdById: args.authorId,
        })
        .returning();
      dashboardId = created.id;
    } else {
      dashboardId = existing[0].id;
      await tx
        .update(dashboards)
        .set({ name: args.name, updatedAt: new Date() })
        .where(eq(dashboards.id, dashboardId));
    }

    // Next version number
    const latest = await tx
      .select({ versionNumber: dashboardVersions.versionNumber })
      .from(dashboardVersions)
      .where(eq(dashboardVersions.dashboardId, dashboardId))
      .orderBy(desc(dashboardVersions.versionNumber))
      .limit(1);
    const nextVersion = (latest[0]?.versionNumber ?? 0) + 1;

    const [version] = await tx
      .insert(dashboardVersions)
      .values({
        dashboardId,
        versionNumber: nextVersion,
        config: args.config,
        authorId: args.authorId,
        message: args.message ?? null,
      })
      .returning();

    // Move head
    await tx
      .update(dashboards)
      .set({ headVersionId: version.id, updatedAt: new Date() })
      .where(eq(dashboards.id, dashboardId));

    return { dashboardId, version };
  });
}

export async function listVersions(
  dashboardId: string,
  limit = 50,
) {
  return db
    .select()
    .from(dashboardVersions)
    .where(eq(dashboardVersions.dashboardId, dashboardId))
    .orderBy(desc(dashboardVersions.versionNumber))
    .limit(limit);
}

export async function rollbackToVersion(args: {
  dashboardId: string;
  targetVersionId: string;
  authorId: string;
  message?: string;
}) {
  return db.transaction(async (tx) => {
    const target = await tx
      .select()
      .from(dashboardVersions)
      .where(
        and(
          eq(dashboardVersions.id, args.targetVersionId),
          eq(dashboardVersions.dashboardId, args.dashboardId),
        ),
      )
      .limit(1);
    if (target.length === 0) {
      throw new Error("Target version not found");
    }

    const latest = await tx
      .select({ versionNumber: dashboardVersions.versionNumber })
      .from(dashboardVersions)
      .where(eq(dashboardVersions.dashboardId, args.dashboardId))
      .orderBy(desc(dashboardVersions.versionNumber))
      .limit(1);
    const nextVersion = (latest[0]?.versionNumber ?? 0) + 1;

    const [restored] = await tx
      .insert(dashboardVersions)
      .values({
        dashboardId: args.dashboardId,
        versionNumber: nextVersion,
        config: target[0].config,
        authorId: args.authorId,
        message:
          args.message ??
          `Rolled back to v${target[0].versionNumber}`,
        rolledBackFromId: target[0].id,
      })
      .returning();

    await tx
      .update(dashboards)
      .set({ headVersionId: restored.id, updatedAt: new Date() })
      .where(eq(dashboards.id, args.dashboardId));

    return restored;
  });
}
