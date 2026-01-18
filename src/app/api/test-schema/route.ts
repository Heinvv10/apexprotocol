import { NextResponse } from "next/server";
import * as schema from "@/lib/db/schema";

export async function GET() {
  try {
    const exports = Object.keys(schema);
    const hasContent = 'content' in schema;
    const contentType = typeof schema.content;

    return NextResponse.json({
      status: "success",
      totalExports: exports.length,
      hasContent,
      contentType,
      sampleExports: exports.slice(0, 20),
      contentDefined: schema.content !== undefined,
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
