import { NextResponse } from "next/server";

/**
 * GET /api/v1/health
 *
 * Liveness probe. Deliberately cheap — no DB, no auth. Status page + load
 * balancers hit this at high frequency.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: process.env.APEX_VERSION ?? "dev",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

export const runtime = "edge";
