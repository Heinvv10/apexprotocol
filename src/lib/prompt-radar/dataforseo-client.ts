import { logger } from "@/lib/logger";
/**
 * DataForSEO AI Optimization API client for Prompt Radar v1.
 *
 * Requirement: FR-PRV-001.
 *
 * DataForSEO exposes keyword-level volume data specific to AI chat
 * platforms (ChatGPT, Gemini). ~$0.0001 per item + $0.01 per task, 12mo
 * trend. Budget: $300-$800/mo depending on tracked prompt volume.
 *
 * We keep this client minimal — just the endpoints Prompt Radar uses. No
 * speculative wrapping.
 */


const DFS_BASE = "https://api.dataforseo.com/v3";

interface DFSResponseEnvelope<T> {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    result?: T[];
  }>;
}

export interface AIKeywordVolume {
  keyword: string;
  /** Platform segment — e.g. "chatgpt", "gemini" */
  search_volume: number;
  cpc?: number | null;
  competition?: number | null;
  categories?: string[];
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface DataForSEOConfig {
  login?: string;
  password?: string;
}

export class DataForSEOClient {
  private auth: string | null;

  constructor(config?: DataForSEOConfig) {
    const login = config?.login ?? process.env.DATAFORSEO_LOGIN;
    const password = config?.password ?? process.env.DATAFORSEO_PASSWORD;
    this.auth =
      login && password
        ? `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`
        : null;
  }

  get enabled(): boolean {
    return this.auth !== null;
  }

  /**
   * Pull AI-platform keyword volume for a batch of seed keywords.
   * Returns the rollup per keyword. Caller is responsible for clustering.
   */
  async keywordVolumes(
    keywords: string[],
    opts: { locationCode?: number; languageCode?: string } = {},
  ): Promise<AIKeywordVolume[]> {
    if (!this.enabled) {
      throw new Error(
        "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not configured",
      );
    }
    if (keywords.length === 0) return [];

    const res = await fetch(
      `${DFS_BASE}/keywords_data/google_ads/search_volume/live`,
      {
        method: "POST",
        headers: {
          Authorization: this.auth!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            keywords: keywords.slice(0, 700), // DFS hard-cap
            location_code: opts.locationCode ?? 2840, // US default
            language_code: opts.languageCode ?? "en",
            include_adult_keywords: false,
          },
        ]),
      },
    );

    if (!res.ok) {
      throw new Error(`DataForSEO ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as DFSResponseEnvelope<AIKeywordVolume>;
    if (data.status_code !== 20000) {
      logger.warn("dataforseo.non_ok_status", {
        status_code: data.status_code,
        status_message: data.status_message,
      });
    }

    const rows = data.tasks?.flatMap((t) => t.result ?? []) ?? [];
    return rows;
  }
}

export const dataForSEOClient = new DataForSEOClient();
