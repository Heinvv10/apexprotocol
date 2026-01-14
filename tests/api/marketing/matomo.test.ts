/**
 * Matomo API Wrapper Tests
 * Tests URL parameter token authentication and analytics metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

class MatomoClient {
  private baseUrl: string;
  private token: string;
  private siteId: string;

  constructor() {
    this.baseUrl = process.env.MATOMO_URL || 'http://localhost:8080';
    this.token = process.env.MATOMO_TOKEN || 'dev-token';
    this.siteId = process.env.MATOMO_SITE_ID || '1';
  }

  private async request(method: string, params: Record<string, any>) {
    const url = new URL(`${this.baseUrl}/index.php`);
    url.searchParams.append('module', 'API');
    url.searchParams.append('method', method);
    url.searchParams.append('idSite', this.siteId);
    url.searchParams.append('format', 'JSON');
    url.searchParams.append('token_auth', this.token);

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

  async getVisits(period = 'day', date = 'last30') {
    return this.request('VisitsSummary.getVisits', {
      period,
      date,
    });
  }

  async getUniqueVisitors(period = 'day', date = 'last30') {
    return this.request('VisitsSummary.getUniqueVisitors', {
      period,
      date,
    });
  }

  async getConversions(period = 'day', date = 'last30') {
    return this.request('Conversions.getConversions', {
      period,
      date,
    });
  }

  async getTrafficSources(period = 'day', date = 'last30') {
    return this.request('Referrers.getReferrerTypes', {
      period,
      date,
      expanded: 'true',
    });
  }
}

describe('MatomoClient', () => {
  let client: MatomoClient;

  beforeEach(() => {
    client = new MatomoClient();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should include token_auth in URL parameters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 123: { nb_visits: 100 } }),
      });

      await client.getVisits();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('token_auth=');
    });

    it('should use configured site ID', async () => {
      process.env.MATOMO_SITE_ID = '5';
      const newClient = new MatomoClient();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 123: { nb_visits: 100 } }),
      });

      await newClient.getVisits();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('idSite=5');
    });

    it('should include module=API and format=JSON parameters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 123: { nb_visits: 100 } }),
      });

      await client.getVisits();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('module=API');
      expect(url).toContain('format=JSON');
    });

    it('should throw error on authentication failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(client.getVisits()).rejects.toThrow('Matomo API error');
    });
  });

  describe('getVisits', () => {
    it('should fetch visitor count metrics', async () => {
      const mockData = {
        123: { nb_visits: 2340 },
        124: { nb_visits: 2145 },
        125: { nb_visits: 2456 },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.getVisits();
      expect(result[123].nb_visits).toBe(2340);
    });

    it('should pass period and date parameters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getVisits('week', 'last7');

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('period=week');
      expect(url).toContain('date=last7');
    });

    it('should use default period and date', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getVisits();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('period=day');
      expect(url).toContain('date=last30');
    });

    it('should call VisitsSummary.getVisits API method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getVisits();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('method=VisitsSummary.getVisits');
    });
  });

  describe('getUniqueVisitors', () => {
    it('should fetch unique visitor metrics', async () => {
      const mockData = {
        123: { nb_uniq_visitors: 1250 },
        124: { nb_uniq_visitors: 1180 },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.getUniqueVisitors();
      expect(result[123].nb_uniq_visitors).toBe(1250);
    });

    it('should call VisitsSummary.getUniqueVisitors API method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getUniqueVisitors();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('method=VisitsSummary.getUniqueVisitors');
    });
  });

  describe('getConversions', () => {
    it('should fetch conversion metrics', async () => {
      const mockData = {
        123: { nb_conversions: 45, conversion_rate: 1.92 },
        124: { nb_conversions: 38, conversion_rate: 1.77 },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.getConversions();
      expect(result[123].nb_conversions).toBe(45);
      expect(result[123].conversion_rate).toBe(1.92);
    });

    it('should call Conversions.getConversions API method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getConversions();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('method=Conversions.getConversions');
    });
  });

  describe('getTrafficSources', () => {
    it('should fetch traffic source breakdown', async () => {
      const mockData = {
        'Direct': { nb_visits: 450, percentage: 19.2 },
        'Google': { nb_visits: 1250, percentage: 53.4 },
        'Facebook': { nb_visits: 580, percentage: 24.8 },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.getTrafficSources();
      expect(result.Google.percentage).toBe(53.4);
    });

    it('should include expanded=true parameter', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getTrafficSources();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('expanded=true');
    });

    it('should call Referrers.getReferrerTypes API method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getTrafficSources();

      const call = (global.fetch as any).mock.calls[0];
      const url = call[0];
      expect(url).toContain('method=Referrers.getReferrerTypes');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(client.getVisits()).rejects.toThrow('Matomo API error');
    });

    it('should include response status in error message', async () => {
      const statusText = 'Service Unavailable';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText,
      });

      try {
        await client.getVisits();
      } catch (error) {
        expect((error as Error).message).toContain(statusText);
      }
    });
  });
});
