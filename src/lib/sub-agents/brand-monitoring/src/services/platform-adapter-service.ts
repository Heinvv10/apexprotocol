/**
 * PlatformAdapterService
 * Multi-platform adapter management for brand monitoring
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export type PlatformType = 'ai_search' | 'social_media' | 'news';

export const PlatformCredentialsSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export type PlatformCredentials = z.infer<typeof PlatformCredentialsSchema>;

export const RateLimitSchema = z.object({
  requestsPerMinute: z.number().positive(),
  requestsPerHour: z.number().positive(),
});

export type RateLimit = z.infer<typeof RateLimitSchema>;

export const PlatformAdapterSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['ai_search', 'social_media', 'news']),
  baseUrl: z.string().url(),
  enabled: z.boolean(),
  rateLimit: RateLimitSchema,
  priority: z.number().optional().default(5),
});

export type PlatformAdapter = z.infer<typeof PlatformAdapterSchema>;

export const PlatformAdapterConfigSchema = z.object({
  maxConcurrentRequests: z.number().positive().default(10),
  requestTimeoutMs: z.number().positive().default(30000),
  retryAttempts: z.number().nonnegative().default(3),
  retryDelayMs: z.number().positive().default(1000),
});

export type PlatformAdapterConfig = z.infer<typeof PlatformAdapterConfigSchema>;

export interface PlatformResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  latencyMs: number;
}

export interface AdapterStats {
  totalRequests: number;
  requestsLastMinute: number;
  requestsLastHour: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  averageLatencyMs: number;
  lastRequestTime?: Date;
  lastError?: string;
}

export interface AdapterHealth {
  healthy: boolean;
  latencyMs: number;
  lastChecked: Date;
  errorMessage?: string;
}

export interface AggregatedStats {
  totalAdapters: number;
  enabledAdapters: number;
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  overallSuccessRate: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

export interface PlatformAdapterService extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration
  getConfig(): PlatformAdapterConfig;
  updateConfig(config: Partial<PlatformAdapterConfig>): void;

  // Adapter Management
  registerAdapter(adapter: PlatformAdapter): Promise<void>;
  unregisterAdapter(id: string): Promise<void>;
  getAdapter(id: string): PlatformAdapter | undefined;
  getRegisteredAdapters(): PlatformAdapter[];
  getAdaptersByType(type: PlatformType): PlatformAdapter[];
  getEnabledAdapters(): PlatformAdapter[];
  getAdaptersByPriority(): PlatformAdapter[];

  // Enable/Disable
  enableAdapter(id: string): Promise<void>;
  disableAdapter(id: string): Promise<void>;

  // Credentials
  setCredentials(id: string, credentials: PlatformCredentials): Promise<void>;
  clearCredentials(id: string): Promise<void>;
  hasCredentials(id: string): boolean;

  // Rate Limiting
  recordRequest(id: string): Promise<void>;
  isRateLimited(id: string): boolean;
  getRateLimitResetTime(id: string): number;

  // Statistics
  recordSuccess(id: string): Promise<void>;
  recordError(id: string, error: string): Promise<void>;
  getAdapterStats(id: string): AdapterStats | undefined;
  getAggregatedStats(): AggregatedStats;

  // Health
  checkAdapterHealth(id: string): Promise<AdapterHealth>;
  checkAllAdaptersHealth(): Promise<Record<string, AdapterHealth>>;

  // Priority
  setAdapterPriority(id: string, priority: number): Promise<void>;
}

interface InternalAdapterState {
  adapter: PlatformAdapter;
  credentials?: PlatformCredentials;
  stats: AdapterStats;
  requestTimestamps: number[];
  lastHealthCheck?: AdapterHealth;
}

class PlatformAdapterServiceImpl extends EventEmitter implements PlatformAdapterService {
  private config: PlatformAdapterConfig;
  private adapters: Map<string, InternalAdapterState> = new Map();
  private initialized = false;

  constructor(config: Partial<PlatformAdapterConfig> = {}) {
    super();
    this.config = PlatformAdapterConfigSchema.parse(config);
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.adapters.clear();
    this.emit('shutdown');
  }

  getConfig(): PlatformAdapterConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PlatformAdapterConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async registerAdapter(adapter: PlatformAdapter): Promise<void> {
    const validated = PlatformAdapterSchema.parse(adapter);

    const existingState = this.adapters.get(validated.id);

    const state: InternalAdapterState = {
      adapter: validated,
      credentials: existingState?.credentials,
      stats: existingState?.stats || this.createEmptyStats(),
      requestTimestamps: existingState?.requestTimestamps || [],
      lastHealthCheck: existingState?.lastHealthCheck,
    };

    this.adapters.set(validated.id, state);
    this.emit('adapterRegistered', validated);
  }

  async unregisterAdapter(id: string): Promise<void> {
    this.adapters.delete(id);
    this.emit('adapterUnregistered', id);
  }

  getAdapter(id: string): PlatformAdapter | undefined {
    return this.adapters.get(id)?.adapter;
  }

  getRegisteredAdapters(): PlatformAdapter[] {
    return Array.from(this.adapters.values()).map(s => s.adapter);
  }

  getAdaptersByType(type: PlatformType): PlatformAdapter[] {
    return this.getRegisteredAdapters().filter(a => a.type === type);
  }

  getEnabledAdapters(): PlatformAdapter[] {
    return this.getRegisteredAdapters().filter(a => a.enabled);
  }

  getAdaptersByPriority(): PlatformAdapter[] {
    return this.getRegisteredAdapters().sort((a, b) => (b.priority || 5) - (a.priority || 5));
  }

  async enableAdapter(id: string): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      state.adapter = { ...state.adapter, enabled: true };
      this.emit('adapterEnabled', id);
    }
  }

  async disableAdapter(id: string): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      state.adapter = { ...state.adapter, enabled: false };
      this.emit('adapterDisabled', id);
    }
  }

  async setCredentials(id: string, credentials: PlatformCredentials): Promise<void> {
    const state = this.adapters.get(id);
    if (!state) {
      throw new Error(`Adapter ${id} not found`);
    }

    // Validate credentials have at least one value
    const parsed = PlatformCredentialsSchema.parse(credentials);
    const hasValue = Object.values(parsed).some(v => v !== undefined && v !== '');
    if (!hasValue) {
      throw new Error('Credentials must have at least one value');
    }

    state.credentials = parsed;
    this.emit('credentialsSet', id);
  }

  async clearCredentials(id: string): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      state.credentials = undefined;
      this.emit('credentialsCleared', id);
    }
  }

  hasCredentials(id: string): boolean {
    const state = this.adapters.get(id);
    return state?.credentials !== undefined;
  }

  async recordRequest(id: string): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      const now = Date.now();
      state.requestTimestamps.push(now);
      state.stats.totalRequests++;
      state.stats.lastRequestTime = new Date();

      // Clean old timestamps (older than 1 hour)
      const oneHourAgo = now - 3600000;
      state.requestTimestamps = state.requestTimestamps.filter(t => t > oneHourAgo);

      // Update minute/hour counts
      const oneMinuteAgo = now - 60000;
      state.stats.requestsLastMinute = state.requestTimestamps.filter(t => t > oneMinuteAgo).length;
      state.stats.requestsLastHour = state.requestTimestamps.length;
    }
  }

  isRateLimited(id: string): boolean {
    const state = this.adapters.get(id);
    if (!state) return false;

    const { rateLimit } = state.adapter;
    return state.stats.requestsLastMinute >= rateLimit.requestsPerMinute ||
           state.stats.requestsLastHour >= rateLimit.requestsPerHour;
  }

  getRateLimitResetTime(id: string): number {
    const state = this.adapters.get(id);
    if (!state || state.requestTimestamps.length === 0) return 0;

    const now = Date.now();
    const oldestInMinute = state.requestTimestamps.find(t => t > now - 60000);

    if (oldestInMinute) {
      return (oldestInMinute + 60000) - now;
    }
    return 0;
  }

  async recordSuccess(id: string): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      state.stats.successCount++;
      this.updateSuccessRate(state);
    }
  }

  async recordError(id: string, error: string): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      state.stats.errorCount++;
      state.stats.lastError = error;
      this.updateSuccessRate(state);
    }
  }

  private updateSuccessRate(state: InternalAdapterState): void {
    const total = state.stats.successCount + state.stats.errorCount;
    state.stats.successRate = total > 0 ? state.stats.successCount / total : 0;
  }

  getAdapterStats(id: string): AdapterStats | undefined {
    return this.adapters.get(id)?.stats;
  }

  getAggregatedStats(): AggregatedStats {
    const adapters = Array.from(this.adapters.values());
    const totalRequests = adapters.reduce((sum, s) => sum + s.stats.totalRequests, 0);
    const totalSuccess = adapters.reduce((sum, s) => sum + s.stats.successCount, 0);
    const totalErrors = adapters.reduce((sum, s) => sum + s.stats.errorCount, 0);

    return {
      totalAdapters: adapters.length,
      enabledAdapters: adapters.filter(s => s.adapter.enabled).length,
      totalRequests,
      totalSuccess,
      totalErrors,
      overallSuccessRate: totalRequests > 0 ? totalSuccess / (totalSuccess + totalErrors) : 0,
    };
  }

  async checkAdapterHealth(id: string): Promise<AdapterHealth> {
    const state = this.adapters.get(id);
    if (!state) {
      throw new Error(`Adapter ${id} not found`);
    }

    const startTime = Date.now();

    // Simulate health check (in real implementation, would ping the service)
    const health: AdapterHealth = {
      healthy: state.adapter.enabled && this.hasCredentials(id),
      latencyMs: Date.now() - startTime,
      lastChecked: new Date(),
    };

    if (!state.adapter.enabled) {
      health.errorMessage = 'Adapter is disabled';
    } else if (!this.hasCredentials(id)) {
      health.errorMessage = 'No credentials configured';
    }

    state.lastHealthCheck = health;
    this.emit('healthCheckComplete', { id, health });
    return health;
  }

  async checkAllAdaptersHealth(): Promise<Record<string, AdapterHealth>> {
    const results: Record<string, AdapterHealth> = {};

    for (const id of this.adapters.keys()) {
      results[id] = await this.checkAdapterHealth(id);
    }

    return results;
  }

  async setAdapterPriority(id: string, priority: number): Promise<void> {
    const state = this.adapters.get(id);
    if (state) {
      state.adapter = { ...state.adapter, priority };
      this.emit('priorityChanged', { id, priority });
    }
  }

  private createEmptyStats(): AdapterStats {
    return {
      totalRequests: 0,
      requestsLastMinute: 0,
      requestsLastHour: 0,
      successCount: 0,
      errorCount: 0,
      successRate: 0,
      averageLatencyMs: 0,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPlatformAdapterService(
  config: Partial<PlatformAdapterConfig> = {}
): PlatformAdapterService {
  return new PlatformAdapterServiceImpl(config);
}
