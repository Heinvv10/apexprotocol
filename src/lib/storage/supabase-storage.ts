/**
 * Supabase Storage helper for uploading binary assets (brand logos, audit
 * PDFs, generated content media). Uses the service-role client so server-side
 * uploads bypass RLS.
 *
 * Bucket name: apex-assets (created in Plan 4 setup, public read)
 */

import { getAdminClient } from "@/lib/auth/supabase-admin";

export const STORAGE_BUCKET = "apex-assets";

/**
 * Upload a binary buffer to Supabase Storage and return a public URL.
 *
 * @param buffer - file contents
 * @param key - storage path within bucket, e.g. "brand-logos/foo.png"
 * @param contentType - MIME type
 * @returns public URL (CDN-cacheable)
 */
export async function uploadAsset(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const supabase = getAdminClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });
  if (error) {
    throw new Error(`Storage upload failed for ${key}: ${error.message}`);
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

/**
 * Delete an asset from Supabase Storage.
 */
export async function deleteAsset(key: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([key]);
  if (error && !error.message.includes("not found")) {
    throw new Error(`Storage delete failed for ${key}: ${error.message}`);
  }
}

/**
 * Return public URL for an existing asset key (no upload).
 */
export function publicUrlFor(key: string): string {
  const supabase = getAdminClient();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}
