import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import UsageAdminClient from "./usage-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/dashboard?error=super_admin_required");
  }
  return <UsageAdminClient />;
}
