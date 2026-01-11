import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AIVisibilityService,
  createAIVisibilityService,
  type AIVisibilityConfig,
  type AIVisibilityResult,
  type ContentRelevanceScore,
  type EntityOptimization,
  type AIReadabilityAnalysis,
  type StructuredDataOptimization,
  type AIVisibilityIssue
} from '../src/services/ai-visibility-service';

describe('AIVisibilityService', () => {
  let service: AIVisibilityService;

  beforeEach(() => {
    service = createAIVisibilityService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config.analyzeContentRelevance).toBe(true);
      expect(config.analyzeEntityOptimization).toBe(true);
      expect(config.analyzeAIReadability).toBe(true);
      expect(config.analyzeLLMFriendliness).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customService = createAIVisibilityService({
        analyzeContentRelevance: false,
        minimumContentLength: 500
      });
      const config = customService.getConfig();
      expect(config.analyzeContentRelevance).toBe(false);
      expect(config.minimumContentLength).toBe(500);
      customService.shutdown();
    });
  });

  describe('Content Relevance Analysis', () => {
    it('should analyze content relevance for target topic', () => {
      const content = `
        Machine learning is a subset of artificial intelligence that enables systems
        to learn and improve from experience. Deep learning, a type of machine learning,
        uses neural networks to process complex data patterns.
      `;
      const targetTopic = 'machine learning';

      const result = service.analyzeContentRelevance(content, targetTopic);

      expect(result.relevanceScore).toBeGreaterThan(70);
      expect(result.topicCoverage).toBeGreaterThan(0.5);
      expect(result.semanticMatch).toBe(true);
    });

    it('should detect low relevance content', () => {
      const content = `
        Today's weather forecast shows sunny skies with temperatures around 75 degrees.
        Tomorrow will bring scattered clouds with a slight chance of rain.
      `;
      const targetTopic = 'machine learning';

      const result = service.analyzeContentRelevance(content, targetTopic);

      expect(result.relevanceScore).toBeLessThan(30);
      expect(result.semanticMatch).toBe(false);
    });

    it('should identify topic gaps', () => {
      const content = `
        Machine learning algorithms process data efficiently.
        The technology is widely used in many applications.
      `;
      const targetTopic = 'machine learning';
      const expectedSubtopics = ['neural networks', 'training data', 'model accuracy', 'deep learning'];

      const result = service.analyzeTopicCoverage(content, targetTopic, expectedSubtopics);

      expect(result.coveredSubtopics).toBeDefined();
      expect(result.missingSubtopics.length).toBeGreaterThan(0);
      expect(result.coveragePercentage).toBeLessThan(100);
    });

    it('should analyze content comprehensiveness', () => {
      const content = `
        Machine learning is a branch of artificial intelligence. It uses algorithms
        to learn from data. There are three main types: supervised, unsupervised,
        and reinforcement learning. Each has specific use cases and applications.
        Training data is essential for model accuracy. Neural networks enable
        deep learning capabilities. Model evaluation metrics include accuracy,
        precision, and recall.
      `;

      const result = service.analyzeComprehensiveness(content, 'machine learning');

      expect(result.comprehensivenessScore).toBeGreaterThan(60);
      expect(result.topicDepth).toBe('moderate');
    });

    it('should calculate content uniqueness', () => {
      const content = `
        This unique perspective on machine learning explores novel approaches
        to neural network architecture. Our proprietary research demonstrates
        groundbreaking results in model efficiency.
      `;

      const result = service.analyzeContentUniqueness(content);

      expect(result.uniquenessScore).toBeGreaterThan(0);
      expect(result.hasOriginalInsights).toBe(true);
    });
  });

  describe('Entity Optimization Analysis', () => {
    it('should analyze entity mentions and context', () => {
      const content = `
        OpenAI developed ChatGPT, a powerful language model based on GPT-4 architecture.
        The company, founded by Sam Altman, is headquartered in San Francisco.
      `;

      const result = service.analyzeEntityOptimization(content);

      expect(result.entities.organizations).toContain('OpenAI');
      expect(result.entities.people).toContain('Sam Altman');
      expect(result.entities.products).toContain('ChatGPT');
      expect(result.entities.locations).toContain('San Francisco');
    });

    it('should evaluate entity context quality', () => {
      const content = `
        Apple Inc., the technology company known for the iPhone and Mac computers,
        reported strong quarterly earnings. CEO Tim Cook announced new product
        initiatives during the company's annual developer conference in Cupertino.
      `;

      const result = service.evaluateEntityContext(content);

      expect(result.contextQuality.Apple).toBeGreaterThan(70);
      expect(result.hasDefiningContext).toBe(true);
    });

    it('should identify entity disambiguation opportunities', () => {
      const content = `
        Apple released a new product yesterday. The company continues to innovate.
      `;

      const result = service.analyzeEntityAmbiguity(content);

      expect(result.ambiguousEntities).toContain('Apple');
      expect(result.suggestions.some(s => s.includes('Apple Inc.'))).toBe(true);
    });

    it('should analyze entity relationships', () => {
      const content = `
        Elon Musk is the CEO of Tesla and SpaceX. Tesla manufactures electric vehicles
        while SpaceX focuses on space exploration. Both companies are based in the United States.
      `;

      const result = service.analyzeEntityRelationships(content);

      expect(result.relationships.length).toBeGreaterThan(0);
      expect(result.relationships.some(r =>
        r.entity1 === 'Elon Musk' && r.entity2 === 'Tesla' && r.relationship === 'CEO of'
      )).toBe(true);
    });

    it('should recommend entity enrichment', () => {
      const content = `
        Google announced new AI features. The update improves search results.
      `;

      const result = service.recommendEntityEnrichment(content);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('context'))).toBe(true);
    });
  });

  describe('AI Readability Analysis', () => {
    it('should analyze content structure for AI processing', () => {
      const html = `
<html>
<body>
  <article>
    <h1>Main Topic</h1>
    <p>Clear introduction explaining the topic.</p>
    <h2>Subtopic 1</h2>
    <p>Detailed content about subtopic 1.</p>
    <h2>Subtopic 2</h2>
    <p>Detailed content about subtopic 2.</p>
    <h2>Conclusion</h2>
    <p>Summary of key points.</p>
  </article>
</body>
</html>`;

      const result = service.analyzeAIReadability(html);

      expect(result.structureScore).toBeGreaterThan(80);
      expect(result.hasLogicalFlow).toBe(true);
      expect(result.hasClearSections).toBe(true);
    });

    it('should detect content that may confuse AI models', () => {
      const html = `
<html>
<body>
  <div>Random content here</div>
  <div>More unrelated text</div>
  <div>No clear structure</div>
  <div onclick="javascript:void(0)">Lots of JS interactions</div>
</body>
</html>`;

      const result = service.analyzeAIReadability(html);

      expect(result.structureScore).toBeLessThan(50);
      expect(result.issues).toContain('Lack of semantic structure');
    });

    it('should analyze sentence clarity', () => {
      const content = `
        Machine learning enables computers to learn. The process involves training
        algorithms with data. Results improve with more training examples.
      `;

      const result = service.analyzeSentenceClarity(content);

      expect(result.averageSentenceLength).toBeLessThan(20);
      expect(result.clarityScore).toBeGreaterThan(70);
    });

    it('should detect complex or ambiguous sentences', () => {
      const content = `
        The implementation of the aforementioned paradigm shift in the context of
        the previously established framework necessitates a comprehensive reevaluation
        of the underlying assumptions that were predicated on the now-obsolete model.
      `;

      const result = service.analyzeSentenceClarity(content);

      expect(result.complexSentences).toBeGreaterThan(0);
      expect(result.clarityScore).toBeLessThan(50);
    });

    it('should analyze content for factual claims', () => {
      const content = `
        Studies show that 80% of businesses use AI. According to MIT research,
        machine learning improves efficiency by 40%. Experts predict continued growth.
      `;

      const result = service.analyzeFactualClaims(content);

      expect(result.claimsWithSources).toBeGreaterThan(0);
      expect(result.claimsWithoutSources).toBeGreaterThan(0);
      expect(result.citationScore).toBeGreaterThan(30);
    });

    it('should evaluate content freshness signals', () => {
      const html = `
<html>
<body>
  <article>
    <time datetime="2024-01-15">January 15, 2024</time>
    <p>Updated: Last reviewed on January 10, 2024</p>
    <p>Current statistics for 2024 show...</p>
  </article>
</body>
</html>`;

      const result = service.evaluateContentFreshness(html);

      expect(result.hasPublishDate).toBe(true);
      expect(result.hasUpdateDate).toBe(true);
      expect(result.freshnesssignals).toBeGreaterThan(0);
    });
  });

  describe('LLM Friendliness Analysis', () => {
    it('should evaluate content for LLM citation potential', () => {
      const content = `
        Definition: Machine learning is a type of artificial intelligence that
        enables systems to learn from data without being explicitly programmed.

        Key characteristics:
        1. Uses algorithms to identify patterns
        2. Improves accuracy over time
        3. Requires training data

        Example: A spam filter that learns to identify unwanted emails.
      `;

      const result = service.evaluateLLMCitationPotential(content);

      expect(result.citationScore).toBeGreaterThan(70);
      expect(result.hasDefinitions).toBe(true);
      expect(result.hasExamples).toBe(true);
      expect(result.hasLists).toBe(true);
    });

    it('should identify content that answers questions directly', () => {
      const content = `
        What is machine learning?
        Machine learning is a subset of artificial intelligence that enables
        computers to learn and improve from experience without being explicitly
        programmed.

        How does machine learning work?
        Machine learning works by training algorithms on large datasets to
        recognize patterns and make predictions.
      `;

      const result = service.analyzeQuestionAnswering(content);

      expect(result.questionsAddressed).toBeGreaterThan(0);
      expect(result.hasDirectAnswers).toBe(true);
      expect(result.faqFormat).toBe(true);
    });

    it('should evaluate structured data for AI consumption', () => {
      const html = `
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Understanding Machine Learning",
    "author": {"@type": "Person", "name": "John Doe"},
    "datePublished": "2024-01-15",
    "description": "A comprehensive guide to machine learning concepts."
  }
  </script>
</head>
<body>
  <article>Content here</article>
</body>
</html>`;

      const result = service.evaluateStructuredDataForAI(html);

      expect(result.hasRelevantSchema).toBe(true);
      expect(result.schemaCompleteness).toBeGreaterThan(70);
      expect(result.aiUsefulProperties).toContain('headline');
      expect(result.aiUsefulProperties).toContain('author');
    });

    it('should analyze content for snippet optimization', () => {
      const content = `
        Machine learning is a method of data analysis that automates analytical
        model building. It is a branch of artificial intelligence based on the
        idea that systems can learn from data, identify patterns and make decisions
        with minimal human intervention.
      `;

      const result = service.analyzeSnippetOptimization(content);

      expect(result.hasConcisDedefinition).toBe(true);
      expect(result.snippetReadyContent).toBe(true);
      expect(result.idealSnippetLength).toBeGreaterThan(0);
    });

    it('should evaluate E-E-A-T signals', () => {
      const html = `
<html>
<body>
  <article>
    <div class="author-info">
      <span>Written by Dr. Jane Smith, PhD in Computer Science</span>
      <span>15 years of experience in AI research</span>
      <a href="https://linkedin.com/in/janesmith">LinkedIn Profile</a>
    </div>
    <p>Based on peer-reviewed research from MIT and Stanford...</p>
    <footer>
      <p>Last updated: January 2024</p>
      <p>Reviewed by industry experts</p>
    </footer>
  </article>
</body>
</html>`;

      const result = service.evaluateEEATSignals(html);

      expect(result.experienceSignals).toBeGreaterThan(0);
      expect(result.expertiseSignals).toBeGreaterThan(0);
      expect(result.authoritativeSignals).toBeGreaterThan(0);
      expect(result.trustSignals).toBeGreaterThan(0);
      expect(result.overallEEATScore).toBeGreaterThan(50);
    });
  });

  describe('Structured Data Optimization', () => {
    it('should analyze structured data for AI visibility', () => {
      const schemas = [
        {
          '@type': 'Article',
          'headline': 'Machine Learning Guide',
          'author': { '@type': 'Person', 'name': 'John Doe' },
          'datePublished': '2024-01-15',
          'description': 'A comprehensive guide to machine learning concepts'
        }
      ];

      const result = service.analyzeStructuredDataOptimization(schemas);

      expect(result.optimizationScore).toBeGreaterThan(60);
      expect(result.hasEssentialProperties).toBe(true);
    });

    it('should identify missing AI-valuable properties', () => {
      const schemas = [
        {
          '@type': 'Article',
          'headline': 'Machine Learning Guide'
          // Missing author, datePublished, description
        }
      ];

      const result = service.analyzeStructuredDataOptimization(schemas);

      expect(result.missingProperties).toContain('author');
      expect(result.missingProperties).toContain('datePublished');
      expect(result.optimizationScore).toBeLessThan(50);
    });

    it('should recommend schema enhancements', () => {
      const pageContent = {
        hasAuthor: true,
        hasPublishDate: true,
        hasFAQ: true,
        hasHowTo: false
      };
      const currentSchemas = ['Article'];

      const result = service.recommendSchemaEnhancements(pageContent, currentSchemas);

      expect(result.recommendations).toContain('Add FAQPage schema');
    });

    it('should validate schema property values', () => {
      const schema = {
        '@type': 'Article',
        'headline': '',  // Empty
        'author': 'John',  // Should be Person object
        'datePublished': 'yesterday'  // Invalid date format
      };

      const result = service.validateSchemaPropertyValues(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('headline'))).toBe(true);
      expect(result.errors.some(e => e.includes('datePublished'))).toBe(true);
    });
  });

  describe('AI Visibility Scoring', () => {
    it('should calculate overall AI visibility score', () => {
      const analysis = {
        contentRelevance: { score: 80 },
        entityOptimization: { score: 75 },
        aiReadability: { score: 85 },
        llmFriendliness: { score: 70 },
        structuredData: { score: 90 }
      };

      const score = service.calculateAIVisibilityScore(analysis);

      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should generate AI visibility grade', () => {
      expect(service.gradeAIVisibility(95)).toBe('A+');
      expect(service.gradeAIVisibility(85)).toBe('A');
      expect(service.gradeAIVisibility(75)).toBe('B');
      expect(service.gradeAIVisibility(65)).toBe('C');
      expect(service.gradeAIVisibility(55)).toBe('D');
      expect(service.gradeAIVisibility(40)).toBe('F');
    });

    it('should compare AI visibility with competitors', () => {
      const siteScore = {
        overall: 75,
        contentRelevance: 80,
        entityOptimization: 70,
        aiReadability: 75
      };
      const competitorScores = [
        { domain: 'competitor1.com', overall: 85 },
        { domain: 'competitor2.com', overall: 70 },
        { domain: 'competitor3.com', overall: 80 }
      ];

      const result = service.compareWithCompetitors(siteScore, competitorScores);

      expect(result.ranking).toBe(3); // 3rd out of 4
      expect(result.aboveAverage).toBe(false);
      expect(result.gap).toBeGreaterThan(0);
    });
  });

  describe('Issue Reporting', () => {
    it('should create AI visibility issues with severity', () => {
      const issue = service.createIssue({
        type: 'low_content_relevance',
        description: 'Content relevance score below 50%',
        severity: 'high',
        recommendation: 'Add more topic-specific content'
      });

      expect(issue.type).toBe('low_content_relevance');
      expect(issue.severity).toBe('high');
      expect(issue.id).toBeDefined();
    });

    it('should prioritize issues by impact', () => {
      service.addIssue({ type: 'missing_schema', severity: 'medium', impact: 'high', description: 'Schema issue' });
      service.addIssue({ type: 'low_readability', severity: 'high', impact: 'critical', description: 'Readability issue' });
      service.addIssue({ type: 'weak_entities', severity: 'low', impact: 'medium', description: 'Entity issue' });

      const issues = service.getIssuesByImpact();

      expect(issues[0].impact).toBe('critical');
      expect(issues[1].impact).toBe('high');
    });

    it('should generate actionable recommendations', () => {
      const analysis = {
        contentRelevance: { score: 45, topicCoverage: 0.3 },
        entityOptimization: { score: 60, ambiguousEntities: ['Apple'] },
        aiReadability: { score: 55, complexSentences: 5 },
        structuredData: { score: 30, missingProperties: ['author', 'datePublished'] }
      };

      const recommendations = service.generateRecommendations(analysis);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.action)).toBe(true);
      expect(recommendations.some(r => r.priority)).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit events during analysis', () => {
      const events: string[] = [];

      service.on('analysis:start', () => events.push('start'));
      service.on('analysis:progress', () => events.push('progress'));
      service.on('analysis:complete', () => events.push('complete'));

      service.emit('analysis:start', { url: 'https://example.com' });
      service.emit('analysis:progress', { phase: 'content', progress: 50 });
      service.emit('analysis:complete', { score: 80 });

      expect(events).toContain('start');
      expect(events).toContain('progress');
      expect(events).toContain('complete');
    });
  });
});
