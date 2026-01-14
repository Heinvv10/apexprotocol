/**
 * Marketing Analytics API Route
 * Wraps Matomo API for unified analytics and reporting
 * GET  /api/marketing/analytics - Get unified metrics
 * GET  /api/marketing/analytics/roi - Get ROI by channel
 * GET  /api/marketing/analytics/funnel - Get conversion funnel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/auth';

/**
 * Matomo API Client
 */
class MatomoClient {
  private baseUrl: string;
  private token: string;
  private siteId: string;

  constructor() {
    this.baseUrl = process.env.MATOMO_URL || 'http://localhost:8080';
    this.token = process.env.MATOMO_TOKEN || 'dev-token';
    this.siteId = process.env.MATOMO_SITE_ID || '1';
  }

  /**
   * Make API request to Matomo
   */
  private async request(method: string, params: Record<string, any>) {
    const url = new URL(`${this.baseUrl}/index.php`);
    url.searchParams.append('module', 'API');
    url.searchParams.append('method', method);
    url.searchParams.append('idSite', this.siteId);
    url.searchParams.append('format', 'JSON');
    url.searchParams.append('token_auth', this.token);

    // Add additional parameters
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Matomo API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get visitor metrics for period
   */
  async getVisits(period = 'day', date = 'last30') {
    return this.request('VisitsSummary.getVisits', {
      period,
      date,
    });
  }

  /**
   * Get unique visitors
   */
  async getUniqueVisitors(period = 'day', date = 'last30') {
    return this.request('VisitsSummary.getUniqueVisitors', {
      period,
      date,
    });
  }

  /**
   * Get conversion rates
   */
  async getConversions(period = 'day', date = 'last30') {
    return this.request('Conversions.getConversions', {
      period,
      date,
    });
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(period = 'day', date = 'last30') {
    return this.request('Referrers.getReferrerTypes', {
      period,
      date,
      expanded: 'true',
    });
  }

  /**
   * Get page performance
   */
  async getPagePerformance(period = 'day', date = 'last30') {
    return this.request('Actions.getPageUrls', {
      period,
      date,
      filter_limit: -1,
    });
  }

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(period = 'day', date = 'last30') {
    return this.request('DevicesDetection.getDevices', {
      period,
      date,
    });
  }

  /**
   * Get goals
   */
  async getGoals() {
    return this.request('Goals.getGoals', {});
  }

  /**
   * Get goal conversions
   */
  async getGoalConversions(goalId: string, period = 'day', date = 'last30') {
    return this.request('Goals.getConversions', {
      idGoal: goalId,
      period,
      date,
    });
  }
}

/**
 * GET /api/marketing/analytics
 * Get unified marketing metrics
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'overview';
    const period = searchParams.get('period') || 'day';
    const date = searchParams.get('date') || 'last30';

    const matomo = new MatomoClient();

    try {
      // Fetch different metrics based on request
      if (metric === 'roi') {
        // ROI calculations require conversion data
        const visits = await matomo.getVisits(period, date);
        const conversions = await matomo.getConversions(period, date);

        return NextResponse.json({
          data: {
            metric: 'roi',
            visits: visits || 0,
            conversions: conversions || 0,
            conversionRate:
              visits && visits > 0
                ? ((conversions || 0 / visits) * 100).toFixed(2)
                : 0,
          },
          meta: { success: true },
        });
      }

      if (metric === 'sources') {
        const sources = await matomo.getTrafficSources(period, date);
        return NextResponse.json({
          data: {
            metric: 'traffic_sources',
            sources: sources || [],
          },
          meta: { success: true },
        });
      }

      if (metric === 'pages') {
        const pages = await matomo.getPagePerformance(period, date);
        return NextResponse.json({
          data: {
            metric: 'page_performance',
            pages: pages || [],
          },
          meta: { success: true },
        });
      }

      if (metric === 'devices') {
        const devices = await matomo.getDeviceBreakdown(period, date);
        return NextResponse.json({
          data: {
            metric: 'device_breakdown',
            devices: devices || [],
          },
          meta: { success: true },
        });
      }

      // Default: Overview metrics
      const [visits, uniqueVisitors, conversions, sources] = await Promise.all([
        matomo.getVisits(period, date),
        matomo.getUniqueVisitors(period, date),
        matomo.getConversions(period, date),
        matomo.getTrafficSources(period, date),
      ]);

      const totalVisits = Array.isArray(visits)
        ? visits.reduce((sum: number, day: any) => sum + (day.nb_visits || 0), 0)
        : visits.nb_visits || 0;

      const totalUniqueVisitors = Array.isArray(uniqueVisitors)
        ? uniqueVisitors.reduce(
            (sum: number, day: any) => sum + (day.nb_uniq_visitors || 0),
            0
          )
        : uniqueVisitors.nb_uniq_visitors || 0;

      return NextResponse.json({
        data: {
          metric: 'overview',
          visits: totalVisits,
          uniqueVisitors: totalUniqueVisitors,
          conversions: conversions || 0,
          conversionRate:
            totalVisits > 0
              ? ((conversions || 0) / totalVisits * 100).toFixed(2)
              : '0',
          trafficSources: sources || [],
          period,
          date,
        },
        meta: { success: true },
      });
    } catch (error) {
      // Graceful fallback if Matomo is not fully initialized
      console.warn('Matomo connection warning:', error);
      return NextResponse.json({
        data: {
          metric: 'overview',
          visits: 0,
          uniqueVisitors: 0,
          conversions: 0,
          conversionRate: '0',
          trafficSources: [],
          period,
          date,
          warning: 'Matomo not fully initialized',
        },
        meta: { success: true, warning: true },
      });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
