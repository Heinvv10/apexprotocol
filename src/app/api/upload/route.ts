import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import { uploadAsset } from "@/lib/storage/supabase-storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// Maps the client-supplied `type` field to a Supabase Storage path prefix
// inside the `apex-assets` bucket. Keep in sync with other uploaders
// (logo-fetcher writes brand-logos/*).
const TYPE_TO_PREFIX: Record<string, string> = {
  "brand-logos": "brand-logos",
  logo: "brand-logos",
  brand: "brand-logos",
  avatar: "avatars",
  general: "uploads",
};

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

    const prefix = TYPE_TO_PREFIX[rawType] ?? TYPE_TO_PREFIX.general;

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

    const filename = `${orgId}-${createId()}.${ext}`;
    const key = `${prefix}/${filename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const url = await uploadAsset(buffer, key, file.type);

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
