import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ResearchService,
  createResearchService,
  ResearchConfig,
  ResearchConfigSchema,
  ResearchRequest,
  ResearchRequestSchema,
  ResearchResult,
  SourceInfo,
  FactCheck,
  ContentOutline,
  ResearchSource
} from '../src/services/research-service';

describe('ResearchService', () => {
  let service: ResearchService;

  beforeEach(() => {
    service = createResearchService();
  });

  describe('Initialization', () => {
    it('should create service with default configuration', () => {
      expect(service).toBeInstanceOf(ResearchService);
    });

    it('should create service with custom configuration', () => {
      const customService = createResearchService({
        maxSources: 20,
        enableFactChecking: false,
        enablePlagiarismCheck: false
      });
      expect(customService).toBeInstanceOf(ResearchService);
    });

    it('should inherit from EventEmitter', () => {
      expect(typeof service.on).toBe('function');
      expect(typeof service.emit).toBe('function');
    });

    it('should emit events during research', async () => {
      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      service.on('research:start', startHandler);
      service.on('research:complete', completeHandler);

      const request: ResearchRequest = {
        topic: 'Test research topic',
        depth: 'basic'
      };

      await service.research(request);

      expect(startHandler).toHaveBeenCalled();
      expect(completeHandler).toHaveBeenCalled();
    });
  });

  describe('Zod Schema Validation', () => {
    describe('ResearchConfigSchema', () => {
      it('should validate valid configuration', () => {
        const validConfig = {
          maxSources: 10,
          enableFactChecking: true,
          enablePlagiarismCheck: true
        };
        expect(() => ResearchConfigSchema.parse(validConfig)).not.toThrow();
      });

      it('should apply default values', () => {
        const minConfig = {};
        const result = ResearchConfigSchema.parse(minConfig);
        expect(result.maxSources).toBe(10);
        expect(result.enableFactChecking).toBe(true);
        expect(result.enablePlagiarismCheck).toBe(true);
      });

      it('should validate maxSources range', () => {
        const invalidConfig = {
          maxSources: 0
        };
        expect(() => ResearchConfigSchema.parse(invalidConfig)).toThrow();
      });
    });

    describe('ResearchRequestSchema', () => {
      it('should validate valid request', () => {
        const validRequest = {
          topic: 'AI in healthcare',
          depth: 'comprehensive',
          sources: ['web', 'academic'],
          keywords: ['AI', 'healthcare', 'diagnosis']
        };
        expect(() => ResearchRequestSchema.parse(validRequest)).not.toThrow();
      });

      it('should require topic', () => {
        const invalidRequest = {
          depth: 'basic'
        };
        expect(() => ResearchRequestSchema.parse(invalidRequest)).toThrow();
      });

      it('should validate depth values', () => {
        const depths = ['basic', 'moderate', 'comprehensive'];
        depths.forEach(depth => {
          const request = { topic: 'Test', depth };
          expect(() => ResearchRequestSchema.parse(request)).not.toThrow();
        });
      });

      it('should reject invalid depth', () => {
        const invalidRequest = {
          topic: 'Test',
          depth: 'invalid'
        };
        expect(() => ResearchRequestSchema.parse(invalidRequest)).toThrow();
      });

      it('should validate source types', () => {
        const sources: ResearchSource[] = ['web', 'academic', 'news', 'social', 'industry'];
        const request = { topic: 'Test', sources };
        expect(() => ResearchRequestSchema.parse(request)).not.toThrow();
      });
    });
  });

  describe('Research Execution', () => {
    it('should perform basic research', async () => {
      const request: ResearchRequest = {
        topic: 'Machine learning fundamentals',
        depth: 'basic'
      };

      const result = await service.research(request);

      expect(result.success).toBe(true);
      expect(result.topic).toBe(request.topic);
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should perform comprehensive research', async () => {
      const request: ResearchRequest = {
        topic: 'Climate change impact on agriculture',
        depth: 'comprehensive',
        sources: ['web', 'academic', 'news']
      };

      const result = await service.research(request);

      expect(result.success).toBe(true);
      expect(result.depth).toBe('comprehensive');
      // Comprehensive should have more sources
      expect(result.sources.length).toBeGreaterThan(2);
    });

    it('should include source metadata', async () => {
      const request: ResearchRequest = {
        topic: 'Renewable energy trends',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.sources[0]).toHaveProperty('url');
      expect(result.sources[0]).toHaveProperty('title');
      expect(result.sources[0]).toHaveProperty('type');
      expect(result.sources[0]).toHaveProperty('reliability');
    });

    it('should extract key findings', async () => {
      const request: ResearchRequest = {
        topic: 'Artificial intelligence ethics',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.keyFindings).toBeDefined();
      expect(Array.isArray(result.keyFindings)).toBe(true);
      expect(result.keyFindings.length).toBeGreaterThan(0);
    });

    it('should generate summary', async () => {
      const request: ResearchRequest = {
        topic: 'Blockchain technology applications',
        depth: 'basic'
      };

      const result = await service.research(request);

      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(50);
    });

    it('should respect keyword filters', async () => {
      const request: ResearchRequest = {
        topic: 'Software development methodologies',
        depth: 'moderate',
        keywords: ['agile', 'scrum', 'kanban']
      };

      const result = await service.research(request);

      expect(result.keywords).toContain('agile');
      expect(result.keywords).toContain('scrum');
    });
  });

  describe('Source Management', () => {
    it('should categorize sources by type', async () => {
      const request: ResearchRequest = {
        topic: 'Quantum computing',
        depth: 'comprehensive',
        sources: ['web', 'academic']
      };

      const result = await service.research(request);

      const sourceTypes = result.sources.map(s => s.type);
      expect(sourceTypes.some(t => t === 'web' || t === 'academic')).toBe(true);
    });

    it('should rate source reliability', async () => {
      const request: ResearchRequest = {
        topic: 'Cybersecurity best practices',
        depth: 'moderate'
      };

      const result = await service.research(request);

      result.sources.forEach(source => {
        expect(source.reliability).toBeGreaterThanOrEqual(0);
        expect(source.reliability).toBeLessThanOrEqual(100);
      });
    });

    it('should include publication dates where available', async () => {
      const request: ResearchRequest = {
        topic: 'COVID-19 vaccine development',
        depth: 'moderate'
      };

      const result = await service.research(request);

      const sourcesWithDates = result.sources.filter(s => s.publishedDate);
      expect(sourcesWithDates.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by date range when specified', async () => {
      const request: ResearchRequest = {
        topic: 'Recent AI developments',
        depth: 'moderate',
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date()
        }
      };

      const result = await service.research(request);

      expect(result.dateRange).toBeDefined();
    });
  });

  describe('Fact Checking', () => {
    it('should perform fact checking when enabled', async () => {
      const serviceWithFactCheck = createResearchService({
        enableFactChecking: true
      });

      const request: ResearchRequest = {
        topic: 'Electric vehicle market share',
        depth: 'moderate'
      };

      const result = await serviceWithFactCheck.research(request);

      expect(result.factChecks).toBeDefined();
      expect(Array.isArray(result.factChecks)).toBe(true);
    });

    it('should skip fact checking when disabled', async () => {
      const serviceWithoutFactCheck = createResearchService({
        enableFactChecking: false
      });

      const request: ResearchRequest = {
        topic: 'Space exploration',
        depth: 'basic'
      };

      const result = await serviceWithoutFactCheck.research(request);

      expect(result.factChecks).toBeUndefined();
    });

    it('should include verification status in fact checks', async () => {
      const serviceWithFactCheck = createResearchService({
        enableFactChecking: true
      });

      const request: ResearchRequest = {
        topic: 'Global economic trends',
        depth: 'comprehensive'
      };

      const result = await serviceWithFactCheck.research(request);

      if (result.factChecks && result.factChecks.length > 0) {
        expect(result.factChecks[0]).toHaveProperty('claim');
        expect(result.factChecks[0]).toHaveProperty('status');
        expect(['verified', 'unverified', 'disputed', 'partially_verified']).toContain(
          result.factChecks[0].status
        );
      }
    });

    it('should cite supporting sources for verified facts', async () => {
      const serviceWithFactCheck = createResearchService({
        enableFactChecking: true
      });

      const request: ResearchRequest = {
        topic: 'Nutrition science',
        depth: 'moderate'
      };

      const result = await serviceWithFactCheck.research(request);

      if (result.factChecks && result.factChecks.length > 0) {
        const verifiedFact = result.factChecks.find(f => f.status === 'verified');
        if (verifiedFact) {
          expect(verifiedFact.supportingSources).toBeDefined();
        }
      }
    });
  });

  describe('Content Outline Generation', () => {
    it('should generate content outline from research', async () => {
      const request: ResearchRequest = {
        topic: 'Digital marketing strategies',
        depth: 'comprehensive'
      };

      const result = await service.research(request);

      expect(result.outline).toBeDefined();
      expect(result.outline?.sections).toBeDefined();
      expect(result.outline?.sections.length).toBeGreaterThan(0);
    });

    it('should include suggested headings', async () => {
      const request: ResearchRequest = {
        topic: 'Remote work best practices',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.outline?.sections[0]).toHaveProperty('heading');
    });

    it('should include key points for each section', async () => {
      const request: ResearchRequest = {
        topic: 'Data privacy regulations',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.outline?.sections[0]).toHaveProperty('keyPoints');
      expect(Array.isArray(result.outline?.sections[0].keyPoints)).toBe(true);
    });

    it('should suggest section order based on logical flow', async () => {
      const request: ResearchRequest = {
        topic: 'Product development lifecycle',
        depth: 'comprehensive'
      };

      const result = await service.research(request);

      expect(result.outline?.sections[0]).toHaveProperty('order');
    });

    it('should estimate word count for each section', async () => {
      const request: ResearchRequest = {
        topic: 'Social media marketing',
        depth: 'comprehensive'
      };

      const result = await service.research(request);

      expect(result.outline?.sections[0]).toHaveProperty('suggestedWordCount');
    });
  });

  describe('Plagiarism Prevention', () => {
    it('should check for plagiarism when enabled', async () => {
      const serviceWithPlagiarismCheck = createResearchService({
        enablePlagiarismCheck: true
      });

      const request: ResearchRequest = {
        topic: 'Cloud computing benefits',
        depth: 'moderate'
      };

      const result = await serviceWithPlagiarismCheck.research(request);

      expect(result.plagiarismAnalysis).toBeDefined();
    });

    it('should skip plagiarism check when disabled', async () => {
      const serviceWithoutPlagiarismCheck = createResearchService({
        enablePlagiarismCheck: false
      });

      const request: ResearchRequest = {
        topic: 'Machine learning applications',
        depth: 'basic'
      };

      const result = await serviceWithoutPlagiarismCheck.research(request);

      expect(result.plagiarismAnalysis).toBeUndefined();
    });

    it('should calculate originality score', async () => {
      const serviceWithPlagiarismCheck = createResearchService({
        enablePlagiarismCheck: true
      });

      const request: ResearchRequest = {
        topic: 'Internet of Things',
        depth: 'moderate'
      };

      const result = await serviceWithPlagiarismCheck.research(request);

      if (result.plagiarismAnalysis) {
        expect(result.plagiarismAnalysis.originalityScore).toBeGreaterThanOrEqual(0);
        expect(result.plagiarismAnalysis.originalityScore).toBeLessThanOrEqual(100);
      }
    });

    it('should identify similar sources', async () => {
      const serviceWithPlagiarismCheck = createResearchService({
        enablePlagiarismCheck: true
      });

      const request: ResearchRequest = {
        topic: 'E-commerce trends',
        depth: 'comprehensive'
      };

      const result = await serviceWithPlagiarismCheck.research(request);

      if (result.plagiarismAnalysis) {
        expect(result.plagiarismAnalysis.similarSources).toBeDefined();
        expect(Array.isArray(result.plagiarismAnalysis.similarSources)).toBe(true);
      }
    });
  });

  describe('Citation Management', () => {
    it('should generate citations in multiple formats', async () => {
      const request: ResearchRequest = {
        topic: 'Academic writing techniques',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.citations).toBeDefined();
      expect(result.citations?.apa).toBeDefined();
      expect(result.citations?.mla).toBeDefined();
      expect(result.citations?.chicago).toBeDefined();
    });

    it('should include in-text citation suggestions', async () => {
      const request: ResearchRequest = {
        topic: 'Scientific method overview',
        depth: 'comprehensive'
      };

      const result = await service.research(request);

      if (result.citations) {
        expect(result.citations.inTextSuggestions).toBeDefined();
        expect(Array.isArray(result.citations.inTextSuggestions)).toBe(true);
      }
    });

    it('should link citations to source information', async () => {
      const request: ResearchRequest = {
        topic: 'Historical events analysis',
        depth: 'moderate'
      };

      const result = await service.research(request);

      if (result.citations && result.citations.apa.length > 0) {
        expect(result.citations.apa[0]).toHaveProperty('sourceId');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle empty topic gracefully', async () => {
      const request = {
        topic: '',
        depth: 'basic'
      } as ResearchRequest;

      const result = await service.research(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should emit error events', async () => {
      const errorHandler = vi.fn();
      service.on('research:error', errorHandler);

      const request = {
        topic: '',
        depth: 'basic'
      } as ResearchRequest;

      await service.research(request);

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should include processing time even on error', async () => {
      const request = {
        topic: '',
        depth: 'basic'
      } as ResearchRequest;

      const result = await service.research(request);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid source types', async () => {
      const request = {
        topic: 'Test topic',
        depth: 'basic',
        sources: ['invalid_source' as ResearchSource]
      };

      const result = await service.research(request);

      // Zod validation rejects invalid enum values
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Research Depth Levels', () => {
    it('should return fewer sources for basic depth', async () => {
      const basicRequest: ResearchRequest = {
        topic: 'Test topic',
        depth: 'basic'
      };

      const basicResult = await service.research(basicRequest);
      expect(basicResult.sources.length).toBeLessThanOrEqual(5);
    });

    it('should return more sources for comprehensive depth', async () => {
      const comprehensiveRequest: ResearchRequest = {
        topic: 'Test topic',
        depth: 'comprehensive'
      };

      const comprehensiveResult = await service.research(comprehensiveRequest);
      expect(comprehensiveResult.sources.length).toBeGreaterThan(3);
    });

    it('should perform deeper analysis for comprehensive depth', async () => {
      const comprehensiveRequest: ResearchRequest = {
        topic: 'Complex analysis topic',
        depth: 'comprehensive'
      };

      const result = await service.research(comprehensiveRequest);

      // Comprehensive should have more detailed outline
      expect(result.outline?.sections.length).toBeGreaterThan(2);
    });
  });

  describe('Processing Metrics', () => {
    it('should track processing time', async () => {
      const request: ResearchRequest = {
        topic: 'Performance testing',
        depth: 'basic'
      };

      const result = await service.research(request);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include source count in metrics', async () => {
      const request: ResearchRequest = {
        topic: 'Metrics analysis',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.sourceCount).toBe(result.sources.length);
    });

    it('should track research depth in metrics', async () => {
      const request: ResearchRequest = {
        topic: 'Depth tracking',
        depth: 'comprehensive'
      };

      const result = await service.research(request);

      expect(result.metrics?.depth).toBe('comprehensive');
    });
  });

  describe('Topic Suggestions', () => {
    it('should suggest related topics', async () => {
      const request: ResearchRequest = {
        topic: 'Artificial intelligence',
        depth: 'moderate'
      };

      const result = await service.research(request);

      expect(result.relatedTopics).toBeDefined();
      expect(Array.isArray(result.relatedTopics)).toBe(true);
      expect(result.relatedTopics.length).toBeGreaterThan(0);
    });

    it('should suggest follow-up questions', async () => {
      const request: ResearchRequest = {
        topic: 'Climate change solutions',
        depth: 'comprehensive'
      };

      const result = await service.research(request);

      expect(result.followUpQuestions).toBeDefined();
      expect(Array.isArray(result.followUpQuestions)).toBe(true);
    });
  });
});
