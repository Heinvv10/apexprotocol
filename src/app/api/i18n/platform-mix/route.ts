/**
 * Platform Mix API (Phase 5.4)
 * GET /api/i18n/platform-mix?region=za&locale=af&max=7
 *
 * Returns the recommended monitoring platform mix for a given region + locale.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/supabase-server";
import {
  recommendedPlatformMix,
  platformsForRegion,
  platformsForLocale,
  PLATFORM_REGION_MAP,
  type RegionCode,
  type SupportedLocale,
} from "@/lib/i18n/platform-regions";

const VALID_REGIONS: RegionCode[] = [
  "global",
  "us",
  "eu",
  "uk",
  "fr",
  "de",
  "ru",
  "cn",
  "kr",
  "jp",
  "za",
  "ke",
  "ng",
  "in",
  "br",
];

const VALID_LOCALES: SupportedLocale[] = ["en", "zu", "xh", "af", "sw", "yo"];

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const regionParam = (searchParams.get("region") ?? "global") as RegionCode;
    const localeParam = searchParams.get("locale") as SupportedLocale | null;
    const maxParam = searchParams.get("max");
    const max = maxParam
      ? Math.min(17, Math.max(1, parseInt(maxParam, 10) || 7))
      : 7;

    if (!VALID_REGIONS.includes(regionParam)) {
      return NextResponse.json(
        {
          error: `Invalid region. Use one of: ${VALID_REGIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }
    if (localeParam && !VALID_LOCALES.includes(localeParam)) {
      return NextResponse.json(
        { error: `Invalid locale. Use one of: ${VALID_LOCALES.join(", ")}` },
        { status: 400 },
      );
    }

    const mix = recommendedPlatformMix({
      region: regionParam,
      locale: localeParam ?? undefined,
      maxPlatforms: max,
    });

    const regionalPlatforms = platformsForRegion(regionParam);
    const localePlatforms = localeParam ? platformsForLocale(localeParam) : null;

    return NextResponse.json({
      success: true,
      region: regionParam,
      locale: localeParam,
      recommended: mix,
      detail: {
        regionalPlatforms,
        localePlatforms,
        platformRegionInfo: mix.primary
          .concat(mix.secondary)
          .map((p) => PLATFORM_REGION_MAP[p]),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute platform mix",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
