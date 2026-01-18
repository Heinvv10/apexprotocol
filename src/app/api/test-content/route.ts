import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test 1: Can we import from @/lib/auth/clerk?
    const { getUserId } = await import("@/lib/auth/clerk");
    const userId = await getUserId();

    // Test 2: Can we import from @/lib/db?
    const { db } = await import("@/lib/db");

    // Test 3: Can we import from @/lib/db/schema?
    const { content } = await import("@/lib/db/schema");

    return NextResponse.json({
      status: "success",
      tests: {
        authImport: "✓",
        dbImport: "✓",
        schemaImport: "✓",
        userId,
        contentTableName: content._.name,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
