/**
 * Universal API Keys Utility
 * Retrieves universal API keys for use across the application
 */

import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema/system-settings";
import { decrypt } from "@/lib/encryption";
import { eq, and } from "drizzle-orm";

/**
 * Get universal API key for a provider
 * Returns the decrypted key or null if not configured
 */
export async function getUniversalApiKey(
  provider: "openai" | "anthropic" | "gemini"
): Promise<string | null> {
  try {
    const settingKey = `universal_api_key_${provider}`;

    const setting = await db
      .select()
      .from(systemSettings)
      .where(
        and(
          eq(systemSettings.key, settingKey),
          eq(systemSettings.isActive, true)
        )
      )
      .limit(1);

    if (setting.length === 0) {
      return null;
    }

    // Decrypt and return the key
    const decrypted = decrypt(setting[0].value as any);
    return decrypted;
  } catch (error) {
    console.error(`Error retrieving universal ${provider} API key:`, error);
    return null;
  }
}

/**
 * Get all configured universal API keys
 * Returns an object with provider keys
 */
export async function getAllUniversalApiKeys(): Promise<{
  openai: string | null;
  anthropic: string | null;
  gemini: string | null;
}> {
  const [openai, anthropic, gemini] = await Promise.all([
    getUniversalApiKey("openai"),
    getUniversalApiKey("anthropic"),
    getUniversalApiKey("gemini"),
  ]);

  return {
    openai,
    anthropic,
    gemini,
  };
}

/**
 * Check if a universal API key is configured
 */
export async function hasUniversalApiKey(
  provider: "openai" | "anthropic" | "gemini"
): Promise<boolean> {
  const key = await getUniversalApiKey(provider);
  return key !== null;
}
