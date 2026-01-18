import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to query the content table
    const totalResult = await db
      .select({ count: count() })
      .from(content)
      .execute();

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      status: "success",
      userId,
      contentType: typeof content,
      contentKeys: content ? Object.keys(content).slice(0, 10) : [],
      totalRecords: total,
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
