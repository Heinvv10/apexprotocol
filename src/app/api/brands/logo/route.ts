/**
 * Brand Logo Fetch API
 * 
 * Fetches and saves a brand logo from domain using cascading fallbacks:
 * 1. Clearbit Logo API
 * 2. Website scraping (apple-touch-icon, og:image, favicon)
 * 3. Google Favicon API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchBrandLogo } from '@/lib/logo-fetcher';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check auth (skip in dev mode)
    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    
    if (!isDev) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { domain, brandId } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Fetch logo using cascading fallbacks
    const result = await fetchBrandLogo(domain);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          message: 'Could not auto-fetch logo. Please upload manually.',
        },
        { status: 404 }
      );
    }

    // If brandId provided, update the brand's logo_url
    if (brandId && result.logoUrl) {
      await db
        .update(brands)
        .set({ logoUrl: result.logoUrl })
        .where(eq(brands.id, brandId));
    }

    return NextResponse.json({
      success: true,
      logoUrl: result.logoUrl,
      source: result.source,
      originalUrl: result.originalUrl,
    });

  } catch (error) {
    console.error('Logo fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch logo without saving
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain query parameter is required' },
        { status: 400 }
      );
    }

    const result = await fetchBrandLogo(domain);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl: result.logoUrl,
      source: result.source,
    });

  } catch (error) {
    console.error('Logo fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
