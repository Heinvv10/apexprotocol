import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { revokeShare } from "@/lib/share/token";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const userId = await getUserId();
  const orgId = await getOrganizationId();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  const revoked = await revokeShare(token, orgId);
  if (!revoked) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
