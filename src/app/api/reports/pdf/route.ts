/**
 * PDF Report Generation API
 * 
 * Generates beautiful PDF reports for brands
 */

import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchReportData, ReportDocument, ReportOptions, ReportPeriod } from '@/lib/reports';
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      brandId, 
      period = 'monthly',
      startDate,
      endDate,
      includeCompetitors = true,
      includeRecommendations = true,
      includeROI = false,
      includeForecast = true,
      forecastHorizon = 90,
      whiteLabel,
    } = body;

    // Validate required fields
    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Validate period
    const validPeriods: ReportPeriod[] = ['weekly', 'monthly', 'quarterly', 'custom'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be weekly, monthly, quarterly, or custom' },
        { status: 400 }
      );
    }

    // Check auth (skip in dev mode)
    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    
    if (!isDev) {
      const __session = await getSession();
  const { userId, orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
      
      if (!userId || !orgId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Verify brand belongs to user's organization
      const [brand] = await db
        .select()
        .from(brands)
        .where(eq(brands.id, brandId))
        .limit(1);

      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        );
      }

      // TODO: Verify brand.organizationId matches orgId
    }

    // Auto-fetch org branding if whiteLabel not provided
    let resolvedWhiteLabel = whiteLabel;
    
    if (!whiteLabel) {
      // Get brand to find org
      const [brand] = await db
        .select({ organizationId: brands.organizationId })
        .from(brands)
        .where(eq(brands.id, brandId))
        .limit(1);
      
      if (brand?.organizationId) {
        // Get org branding
        const [org] = await db
          .select({ branding: organizations.branding })
          .from(organizations)
          .where(eq(organizations.id, brand.organizationId))
          .limit(1);
        
        if (org?.branding) {
          const b = org.branding as {
            themeId?: string;
            primaryColor?: string;
            accentColor?: string;
            appName?: string;
            supportEmail?: string;
            customDomain?: string;
          };
          
          resolvedWhiteLabel = {
            agencyName: b.appName || 'Apex',
            agencyWebsite: b.customDomain || 'www.apexgeo.app',
            agencyEmail: b.supportEmail || 'reports@apexgeo.app',
            primaryColor: b.primaryColor || '#6366f1',
            secondaryColor: b.accentColor || '#8b5cf6',
            accentColor: b.accentColor || '#06b6d4',
            // Enable dark mode for copper/dark themes
            darkMode: b.themeId === 'copper' || b.themeId === 'midnight',
          };
        }
      }
    }

    // Build report options
    const options: ReportOptions = {
      brandId,
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeCompetitors,
      includeRecommendations,
      includeROI,
      includeForecast,
      forecastHorizon: forecastHorizon as 30 | 60 | 90,
      whiteLabel: resolvedWhiteLabel,
    };

    // Fetch report data
    const reportData = await fetchReportData(options);

    if (!reportData) {
      return NextResponse.json(
        { error: 'Failed to fetch report data' },
        { status: 500 }
      );
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(ReportDocument, { data: reportData }) as unknown as React.ReactElement<import('@react-pdf/renderer').DocumentProps>
    );

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${reportData.brandName.replace(/\s+/g, '-')}-AI-Visibility-Report-${dateStr}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch report data without PDF (for preview)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const period = (searchParams.get('period') || 'monthly') as ReportPeriod;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Check auth (skip in dev mode)
    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    
    if (!isDev) {
      const __session = await getSession();
  const { userId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const options: ReportOptions = {
      brandId,
      period,
      includeCompetitors: true,
      includeRecommendations: true,
    };

    const reportData = await fetchReportData(options);

    return NextResponse.json({
      success: true,
      data: reportData,
    });

  } catch (error) {
    console.error('Report data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
