import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Loadshedding Schedule API
 * GET /api/loadshedding/schedule - Get current loadshedding schedule
 *
 * In production, this would integrate with EskomSePush API or similar
 * For now, provides structured response for the connectivity settings component
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Response type matching LoadsheddingSchedule interface in component
export interface LoadsheddingScheduleItem {
  stage: number;
  startTime: string;
  endTime: string;
  area: string;
}

export interface LoadsheddingStatus {
  currentStage: number;
  nextStage: number | null;
  schedule: LoadsheddingScheduleItem[];
  lastUpdated: string;
  source: string;
}

// EskomSePush API integration (when API key is available)
async function fetchFromEskomSePush(): Promise<LoadsheddingStatus | null> {
  const apiKey = process.env.ESKOMSEPUSH_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    // Get current status
    const statusResponse = await fetch(
      "https://developer.sepush.co.za/business/2.0/status",
      {
        headers: {
          token: apiKey,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!statusResponse.ok) {
      console.error("EskomSePush API error:", statusResponse.status);
      return null;
    }

    const statusData = await statusResponse.json();

    // Extract current stage from status
    const currentStage = parseInt(
      statusData.status?.eskom?.stage || "0",
      10
    );

    // For detailed schedule, would need area search API
    // This requires user's area/suburb which could be stored in preferences

    return {
      currentStage,
      nextStage: null, // Would come from schedule API
      schedule: [],
      lastUpdated: new Date().toISOString(),
      source: "EskomSePush",
    };
  } catch (error) {
    console.error("Error fetching from EskomSePush:", error);
    return null;
  }
}

// Fallback status when API unavailable
function getDefaultStatus(): LoadsheddingStatus {
  return {
    currentStage: 0,
    nextStage: null,
    schedule: [],
    lastUpdated: new Date().toISOString(),
    source: "default",
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area");

    // Try to fetch from EskomSePush
    const eskomData = await fetchFromEskomSePush();

    if (eskomData) {
      return NextResponse.json({
        success: true,
        data: eskomData,
      });
    }

    // Return default status if no API available
    return NextResponse.json({
      success: true,
      data: getDefaultStatus(),
      message: area
        ? "Configure ESKOMSEPUSH_API_KEY for live loadshedding data"
        : "No area specified. Set your area in settings for schedule.",
    });
  } catch (error) {
    console.error("Error fetching loadshedding schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch loadshedding schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
