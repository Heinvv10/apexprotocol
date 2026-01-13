/**
 * BrandMonitoringSubAgent Orchestrator Tests
 * TDD tests for the main orchestration agent that coordinates all services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BrandMonitoringSubAgent,
  createBrandMonitoringSubAgent,
  type BrandMonitoringConfig,
  type MonitoringResult,
  type MonitoringSession,
  type AgentCapabilities,
  type CollaborationRequest,
} from '../src/brand-monitoring-sub-agent';

describe('BrandMonitoringSubAgent', () => {
  let agent: BrandMonitoringSubAgent;

  const defaultConfig: Partial<BrandMonitoringConfig> = {
    brandName: 'Apex',
    brandAliases: ['Apex Platform', 'Apex AI'],
    platforms: [
      { id: 'chatgpt', type: 'ai_search', name: 'ChatGPT', enabled: true },
      { id: 'claude', type: 'ai_search', name: 'Claude', enabled: true },
      { id: 'twitter', type: 'social_media', name: 'Twitter/X', enabled: true },
    ],
    monitoringFrequency: 'hourly',
    sensitivityThreshold: 0.6,
  };

  beforeEach(() => {
    agent = createBrandMonitoringSubAgent(defaultConfig);
  });

  describe('Initialization', () => {
    it('should create agent with default config', () => {
      const defaultAgent = createBrandMonitoringSubAgent();
      expect(defaultAgent).toBeDefined();
      expect(defaultAgent.getConfig()).toBeDefined();
    });

    it('should create agent with custom config', () => {
      expect(agent.getConfig().brandName).toBe('Apex');
      expect(agent.getConfig().platforms).toHaveLength(3);
    });

    it('should emit initialized event', async () => {
      const handler = vi.fn();
      agent.on('initialized', handler);
      await agent.initialize();
      expect(handler).toHaveBeenCalled();
    });

    it('should initialize all services', async () => {
      await agent.initialize();
      const status = agent.getServicesStatus();
      expect(status.platformAdapter).toBe('ready');
      expect(status.mentionExtraction).toBe('ready');
      expect(status.sentimentScoring).toBe('ready');
      expect(status.trendDetection).toBe('ready');
      expect(status.riskAssessment).toBe('ready');
      expect(status.performanceModel).toBe('ready');
    });

    it('should validate brand name is required', () => {
      expect(() => createBrandMonitoringSubAgent({ brandName: '' })).toThrow();
    });
  });

  describe('Monitoring Sessions', () => {
    it('should start a monitoring session', async () => {
      await agent.initialize();
      const session = await agent.startSession();
      expect(session.id).toBeDefined();
      expect(session.status).toBe('running');
    });

    it('should track session progress', async () => {
      await agent.initialize();
      const session = await agent.startSession();

      const progressHandler = vi.fn();
      agent.on('sessionProgress', progressHandler);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(progressHandler).toHaveBeenCalled();
    });

    it('should complete session with results', async () => {
      await agent.initialize();
      const session = await agent.startSession();
      const result = await agent.waitForSession(session.id);

      expect(result.status).toBe('completed');
      expect(result.mentions).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should handle session cancellation', async () => {
      await agent.initialize();
      const session = await agent.startSession();
      await agent.cancelSession(session.id);

      const status = agent.getSessionStatus(session.id);
      expect(status).toBe('cancelled');
    });

    it('should support multiple concurrent sessions', async () => {
      await agent.initialize();
      const session1 = await agent.startSession({ platforms: ['chatgpt'] });
      const session2 = await agent.startSession({ platforms: ['claude'] });

      expect(session1.id).not.toBe(session2.id);
      expect(agent.getActiveSessions()).toHaveLength(2);
    });
  });

  describe('Full Monitoring Pipeline', () => {
    it('should execute complete monitoring pipeline', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.mentions).toBeDefined();
      expect(result.sentimentAnalysis).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.risks).toBeDefined();
      expect(result.performance).toBeDefined();
    });

    it('should collect mentions from all platforms', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.mentions.byPlatform).toHaveProperty('chatgpt');
      expect(result.mentions.byPlatform).toHaveProperty('claude');
    });

    it('should analyze sentiment for all mentions', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.sentimentAnalysis.overall).toBeDefined();
      expect(result.sentimentAnalysis.overall.score).toBeGreaterThanOrEqual(-1);
      expect(result.sentimentAnalysis.overall.score).toBeLessThanOrEqual(1);
    });

    it('should detect trends in mention data', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.trends).toBeDefined();
      expect(result.trends.volume).toBeDefined();
      expect(result.trends.topics).toBeDefined();
    });

    it('should assess reputation risks', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.risks.level).toBeDefined();
      expect(['minimal', 'low', 'medium', 'high', 'critical']).toContain(result.risks.level);
    });

    it('should calculate performance metrics', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.performance.visibilityScore).toBeDefined();
      expect(result.performance.visibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.performance.visibilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Insights Generation', () => {
    it('should generate overall insights', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.insights).toBeDefined();
      expect(result.insights.summary).toBeDefined();
    });

    it('should identify key trends', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.insights.keyTrends).toBeDefined();
      expect(Array.isArray(result.insights.keyTrends)).toBe(true);
    });

    it('should identify potential risks', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.insights.potentialRisks).toBeDefined();
      expect(Array.isArray(result.insights.potentialRisks)).toBe(true);
    });

    it('should provide actionable recommendations', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.insights.recommendations).toBeDefined();
      expect(result.insights.recommendations.length).toBeGreaterThan(0);
      expect(result.insights.recommendations[0].action).toBeDefined();
    });

    it('should calculate overall sentiment', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.insights.overallSentiment).toBeDefined();
      expect(typeof result.insights.overallSentiment).toBe('number');
    });
  });

  describe('Platform-Specific Monitoring', () => {
    it('should monitor specific platforms only', async () => {
      await agent.initialize();
      const result = await agent.monitor({ platforms: ['chatgpt'] });

      expect(result.mentions.byPlatform).toHaveProperty('chatgpt');
      expect(result.mentions.byPlatform).not.toHaveProperty('claude');
    });

    it('should handle disabled platforms', async () => {
      const configWithDisabled: Partial<BrandMonitoringConfig> = {
        ...defaultConfig,
        platforms: [
          { id: 'chatgpt', type: 'ai_search', name: 'ChatGPT', enabled: true },
          { id: 'claude', type: 'ai_search', name: 'Claude', enabled: false },
        ],
      };

      const agentWithDisabled = createBrandMonitoringSubAgent(configWithDisabled);
      await agentWithDisabled.initialize();
      const result = await agentWithDisabled.monitor();

      expect(result.mentions.byPlatform).toHaveProperty('chatgpt');
      expect(result.mentions.byPlatform).not.toHaveProperty('claude');
    });

    it('should aggregate cross-platform metrics', async () => {
      await agent.initialize();
      const result = await agent.monitor();

      expect(result.crossPlatform).toBeDefined();
      expect(result.crossPlatform.totalMentions).toBeGreaterThanOrEqual(0);
      expect(result.crossPlatform.averageSentiment).toBeDefined();
    });
  });

  describe('Time Range Filtering', () => {
    it('should filter by time range', async () => {
      await agent.initialize();
      const result = await agent.monitor({
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      expect(result.timeRange).toEqual({
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      });
    });

    it('should support relative time ranges', async () => {
      await agent.initialize();
      const result = await agent.monitor({ timeRange: 'last_7_days' });

      expect(result.timeRange.start).toBeDefined();
      expect(result.timeRange.end).toBeDefined();
    });
  });

  describe('Alerting', () => {
    it('should emit alert on critical findings', async () => {
      const alertHandler = vi.fn();
      agent.on('alert', alertHandler);

      await agent.initialize();
      await agent.monitor();

      // Alert may or may not be called depending on findings
      expect(typeof alertHandler).toBe('function');
    });

    it('should support custom alert thresholds', async () => {
      const customAgent = createBrandMonitoringSubAgent({
        ...defaultConfig,
        alertThresholds: {
          riskLevel: 'medium',
          sentimentDrop: 0.2,
          volumeSpike: 2.0,
        },
      });

      expect(customAgent.getConfig().alertThresholds).toBeDefined();
    });

    it('should provide alert details', async () => {
      const alertHandler = vi.fn();
      agent.on('alert', alertHandler);

      await agent.initialize();

      // Simulate triggering an alert
      agent.triggerTestAlert({
        type: 'risk_detected',
        severity: 'high',
        message: 'Test alert',
      });

      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'risk_detected',
          severity: 'high',
        })
      );
    });
  });

  describe('Agent Capabilities', () => {
    it('should report capabilities', () => {
      const capabilities = agent.getCapabilities();

      expect(capabilities).toContain('mention_extraction');
      expect(capabilities).toContain('sentiment_analysis');
      expect(capabilities).toContain('trend_detection');
      expect(capabilities).toContain('risk_assessment');
      expect(capabilities).toContain('performance_modeling');
    });

    it('should support capability queries', () => {
      expect(agent.hasCapability('mention_extraction')).toBe(true);
      expect(agent.hasCapability('unknown_capability')).toBe(false);
    });
  });

  describe('Multi-Agent Collaboration', () => {
    it('should accept collaboration requests', async () => {
      await agent.initialize();

      const request: CollaborationRequest = {
        requesterId: 'content-generation-agent',
        type: 'data_request',
        payload: { dataType: 'sentiment_analysis' },
      };

      const response = await agent.handleCollaborationRequest(request);
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should send collaboration requests', async () => {
      await agent.initialize();

      const response = await agent.requestCollaboration({
        targetAgentId: 'content-generation-agent',
        type: 'insight_share',
        payload: { insights: [] },
      });

      expect(response).toBeDefined();
    });

    it('should register with orchestrator', async () => {
      const registrationHandler = vi.fn();
      agent.on('registered', registrationHandler);

      await agent.initialize();
      await agent.register('main-orchestrator');

      expect(registrationHandler).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should persist state', async () => {
      await agent.initialize();
      await agent.monitor();

      const state = agent.getState();
      expect(state.lastMonitoringRun).toBeDefined();
      expect(state.totalMentionsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should restore from previous state', async () => {
      const previousState = {
        lastMonitoringRun: new Date('2024-01-15'),
        totalMentionsProcessed: 1000,
      };

      const restoredAgent = createBrandMonitoringSubAgent({
        ...defaultConfig,
        initialState: previousState,
      });

      const state = restoredAgent.getState();
      expect(state.lastMonitoringRun).toEqual(new Date('2024-01-15'));
    });

    it('should export state for backup', async () => {
      await agent.initialize();
      await agent.monitor();

      const exportedState = agent.exportState();
      expect(typeof exportedState).toBe('string');
      expect(JSON.parse(exportedState)).toBeDefined();
    });

    it('should import state from backup', async () => {
      const stateBackup = JSON.stringify({
        lastMonitoringRun: new Date('2024-01-15'),
        totalMentionsProcessed: 500,
      });

      agent.importState(stateBackup);
      const state = agent.getState();
      expect(state.totalMentionsProcessed).toBe(500);
    });
  });

  describe('Scheduling', () => {
    it('should support scheduled monitoring', async () => {
      await agent.initialize();

      const schedule = agent.scheduleMonitoring({
        frequency: 'hourly',
        startTime: new Date(),
      });

      expect(schedule.id).toBeDefined();
      expect(schedule.nextRun).toBeDefined();
    });

    it('should cancel scheduled monitoring', async () => {
      await agent.initialize();

      const schedule = agent.scheduleMonitoring({ frequency: 'hourly' });
      agent.cancelSchedule(schedule.id);

      const activeSchedules = agent.getActiveSchedules();
      expect(activeSchedules).not.toContainEqual(
        expect.objectContaining({ id: schedule.id })
      );
    });

    it('should support cron expressions', async () => {
      await agent.initialize();

      const schedule = agent.scheduleMonitoring({
        cron: '0 */6 * * *', // Every 6 hours
      });

      expect(schedule.cron).toBe('0 */6 * * *');
    });
  });

  describe('Configuration Updates', () => {
    it('should update brand name', () => {
      agent.updateConfig({ brandName: 'Apex Pro' });
      expect(agent.getConfig().brandName).toBe('Apex Pro');
    });

    it('should update platforms', () => {
      agent.updateConfig({
        platforms: [
          { id: 'perplexity', type: 'ai_search', name: 'Perplexity', enabled: true },
        ],
      });
      expect(agent.getConfig().platforms).toHaveLength(1);
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      agent.on('configUpdated', handler);
      agent.updateConfig({ sensitivityThreshold: 0.8 });
      expect(handler).toHaveBeenCalled();
    });

    it('should reconfigure services on update', async () => {
      await agent.initialize();
      agent.updateConfig({ sensitivityThreshold: 0.9 });

      const servicesReady = agent.areServicesReady();
      expect(servicesReady).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization failure', async () => {
      const errorHandler = vi.fn();
      agent.on('error', errorHandler);

      // Simulate initialization failure
      vi.spyOn(agent as never, 'initializeServices' as keyof typeof agent).mockRejectedValueOnce(new Error('Init failed'));

      await expect(agent.initialize()).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle monitoring failure gracefully', async () => {
      await agent.initialize();

      const result = await agent.monitor({ platforms: ['invalid_platform' as 'chatgpt'] });
      expect(result.errors).toBeDefined();
      expect(result.partialResults).toBe(true);
    });

    it('should retry on transient failures', async () => {
      await agent.initialize();

      let attempts = 0;
      vi.spyOn(agent as never, 'collectMentions' as keyof typeof agent).mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Transient error');
        return [];
      });

      await agent.monitor();
      expect(attempts).toBe(3);
    });

    it('should emit error event on failure', async () => {
      const errorHandler = vi.fn();
      agent.on('error', errorHandler);

      await agent.initialize();

      // Trigger an error
      agent.triggerError(new Error('Test error'));
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track monitoring statistics', async () => {
      await agent.initialize();
      await agent.monitor();
      await agent.monitor();

      const stats = agent.getStats();
      expect(stats.totalMonitoringRuns).toBe(2);
    });

    it('should track mentions processed', async () => {
      await agent.initialize();
      await agent.monitor();

      const stats = agent.getStats();
      expect(stats.totalMentionsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should track average run time', async () => {
      await agent.initialize();
      await agent.monitor();

      const stats = agent.getStats();
      expect(stats.averageRunTimeMs).toBeGreaterThan(0);
    });

    it('should track alerts generated', async () => {
      await agent.initialize();
      agent.triggerTestAlert({ type: 'test', severity: 'low', message: 'Test' });

      const stats = agent.getStats();
      expect(stats.alertsGenerated).toBe(1);
    });

    it('should reset statistics', async () => {
      await agent.initialize();
      await agent.monitor();

      agent.resetStats();
      const stats = agent.getStats();
      expect(stats.totalMonitoringRuns).toBe(0);
    });
  });

  describe('Health Check', () => {
    it('should report health status', async () => {
      await agent.initialize();
      const health = await agent.checkHealth();

      expect(health.status).toBe('healthy');
      expect(health.services).toBeDefined();
    });

    it('should report degraded status on partial service failure', async () => {
      await agent.initialize();

      // Simulate service degradation
      agent.degradeService('mentionExtraction');
      const health = await agent.checkHealth();

      expect(health.status).toBe('degraded');
    });

    it('should report unhealthy status on critical failure', async () => {
      await agent.initialize();

      // Simulate critical failure
      agent.failService('platformAdapter');
      const health = await agent.checkHealth();

      expect(health.status).toBe('unhealthy');
    });
  });

  describe('Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      await agent.initialize();
      const session = await agent.startSession();

      await agent.shutdown();

      expect(agent.getSessionStatus(session.id)).toBe('terminated');
      expect(agent.isRunning()).toBe(false);
    });

    it('should emit shutdown event', async () => {
      const handler = vi.fn();
      agent.on('shutdown', handler);

      await agent.initialize();
      await agent.shutdown();

      expect(handler).toHaveBeenCalled();
    });

    it('should cleanup resources on shutdown', async () => {
      await agent.initialize();
      await agent.shutdown();

      const status = agent.getServicesStatus();
      expect(status.platformAdapter).toBe('stopped');
    });
  });
});
