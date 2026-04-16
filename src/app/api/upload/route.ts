import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createId } from "@paralleldrive/cuid2";
import { getOrganizationId } from "@/lib/auth/clerk";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const ALLOWED_UPLOAD_TYPES = new Set(["logo", "avatar", "brand", "general"]);

export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawType = (formData.get("type") as string | null) ?? "general";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const type = ALLOWED_UPLOAD_TYPES.has(rawType) ? rawType : "general";

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", type);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filename = `${orgId}-${createId()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const url = `/uploads/${type}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
