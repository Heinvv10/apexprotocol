import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SemanticAnalysisService,
  createSemanticAnalysisService,
  type SemanticConfig,
  type SchemaOrgData,
  type SemanticMarkup,
  type EntityAnalysis,
  type ContentStructure,
  type SemanticIssue
} from '../src/services/semantic-analysis-service';

describe('SemanticAnalysisService', () => {
  let service: SemanticAnalysisService;

  beforeEach(() => {
    service = createSemanticAnalysisService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config.validateSchema).toBe(true);
      expect(config.extractEntities).toBe(true);
      expect(config.analyzeSemanticHTML).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customService = createSemanticAnalysisService({
        validateSchema: false,
        extractEntities: false
      });
      const config = customService.getConfig();
      expect(config.validateSchema).toBe(false);
      expect(config.extractEntities).toBe(false);
      customService.shutdown();
    });
  });

  describe('Schema.org Analysis', () => {
    it('should extract JSON-LD schema', () => {
      const html = `
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Example Company",
    "url": "https://example.com",
    "logo": "https://example.com/logo.png"
  }
  </script>
</head>
<body></body>
</html>`;

      const result = service.extractSchemaOrg(html);

      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0].type).toBe('Organization');
      expect(result.schemas[0].properties.name).toBe('Example Company');
    });

    it('should extract multiple JSON-LD schemas', () => {
      const html = `
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Example Site"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Example Company"
  }
  </script>
</head>
<body></body>
</html>`;

      const result = service.extractSchemaOrg(html);

      expect(result.schemas).toHaveLength(2);
      expect(result.schemas.map(s => s.type)).toContain('WebSite');
      expect(result.schemas.map(s => s.type)).toContain('Organization');
    });

    it('should extract Microdata schema', () => {
      const html = `
<html>
<body>
  <div itemscope itemtype="https://schema.org/Product">
    <span itemprop="name">Widget</span>
    <span itemprop="price">$19.99</span>
    <link itemprop="availability" href="https://schema.org/InStock">
  </div>
</body>
</html>`;

      const result = service.extractSchemaOrg(html);

      expect(result.schemas.some(s => s.type === 'Product')).toBe(true);
      expect(result.schemas[0].format).toBe('microdata');
    });

    it('should extract RDFa schema', () => {
      const html = `
<html>
<body>
  <div vocab="https://schema.org/" typeof="Person">
    <span property="name">John Doe</span>
    <span property="jobTitle">Software Engineer</span>
  </div>
</body>
</html>`;

      const result = service.extractSchemaOrg(html);

      expect(result.schemas.some(s => s.type === 'Person')).toBe(true);
      expect(result.schemas[0].format).toBe('rdfa');
    });

    it('should validate schema structure', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Test Article',
        'author': {
          '@type': 'Person',
          'name': 'John Doe'
        },
        'datePublished': '2024-01-15'
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required properties', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article'
        // Missing headline, author, datePublished
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.warnings.some(w => w.includes('headline'))).toBe(true);
    });

    it('should detect invalid schema types', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'InvalidTypeThatDoesNotExist',
        'name': 'Test'
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('type'))).toBe(true);
    });

    it('should recommend appropriate schema types for pages', () => {
      const pageData = {
        url: 'https://example.com/blog/article-title',
        title: 'Article Title',
        type: 'blog-post',
        hasAuthor: true,
        hasPublishDate: true
      };

      const recommendations = service.recommendSchemaTypes(pageData);

      expect(recommendations).toContain('Article');
      expect(recommendations).toContain('BlogPosting');
    });

    it('should recommend Product schema for e-commerce pages', () => {
      const pageData = {
        url: 'https://example.com/products/widget',
        title: 'Widget - Buy Now',
        type: 'product',
        hasPrice: true,
        hasReviews: true
      };

      const recommendations = service.recommendSchemaTypes(pageData);

      expect(recommendations).toContain('Product');
    });
  });

  describe('Semantic HTML Analysis', () => {
    it('should analyze semantic HTML5 elements', () => {
      const html = `
<html>
<body>
  <header>
    <nav>Navigation</nav>
  </header>
  <main>
    <article>
      <header><h1>Title</h1></header>
      <section>Section 1</section>
      <section>Section 2</section>
      <footer>Article footer</footer>
    </article>
    <aside>Sidebar</aside>
  </main>
  <footer>Site footer</footer>
</body>
</html>`;

      const result = service.analyzeSemanticHTML(html);

      expect(result.hasHeader).toBe(true);
      expect(result.hasNav).toBe(true);
      expect(result.hasMain).toBe(true);
      expect(result.hasArticle).toBe(true);
      expect(result.hasSection).toBe(true);
      expect(result.hasAside).toBe(true);
      expect(result.hasFooter).toBe(true);
      expect(result.semanticScore).toBeGreaterThan(80);
    });

    it('should detect non-semantic markup', () => {
      const html = `
<html>
<body>
  <div id="header">
    <div class="nav">Navigation</div>
  </div>
  <div id="main">
    <div class="content">Content</div>
  </div>
  <div id="footer">Footer</div>
</body>
</html>`;

      const result = service.analyzeSemanticHTML(html);

      expect(result.hasHeader).toBe(false);
      expect(result.hasNav).toBe(false);
      expect(result.hasMain).toBe(false);
      expect(result.semanticScore).toBeLessThan(50);
      expect(result.suggestions).toContain('Use <header> instead of <div id="header">');
    });

    it('should analyze landmark roles', () => {
      const html = `
<html>
<body>
  <div role="banner">Header</div>
  <div role="navigation">Nav</div>
  <div role="main">Main content</div>
  <div role="complementary">Sidebar</div>
  <div role="contentinfo">Footer</div>
</body>
</html>`;

      const result = service.analyzeLandmarkRoles(html);

      expect(result.hasBanner).toBe(true);
      expect(result.hasNavigation).toBe(true);
      expect(result.hasMain).toBe(true);
      expect(result.hasComplementary).toBe(true);
      expect(result.hasContentinfo).toBe(true);
    });

    it('should detect duplicate landmarks', () => {
      const html = `
<html>
<body>
  <main>First main</main>
  <main>Second main</main>
</body>
</html>`;

      const result = service.analyzeSemanticHTML(html);

      expect(result.issues).toContain('Multiple <main> elements found');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract named entities from content', () => {
      const content = `
        Apple Inc. announced a new iPhone at their headquarters in Cupertino, California.
        CEO Tim Cook presented the device to journalists from around the world.
      `;

      const result = service.extractEntities(content);

      expect(result.organizations).toContain('Apple Inc.');
      expect(result.people).toContain('Tim Cook');
      expect(result.locations).toContain('Cupertino');
      expect(result.locations).toContain('California');
      expect(result.products).toContain('iPhone');
    });

    it('should extract dates and times', () => {
      const content = `
        The event will be held on January 15, 2024 at 10:00 AM Pacific Time.
        Registration opens December 1st, 2023.
      `;

      const result = service.extractEntities(content);

      expect(result.dates.length).toBeGreaterThan(0);
    });

    it('should extract monetary values', () => {
      const content = `
        The product costs $199.99. Premium version is €249 or £199.
        Annual revenue exceeded $1.5 billion.
      `;

      const result = service.extractEntities(content);

      expect(result.monetaryValues.some(v => v.includes('199.99'))).toBe(true);
      expect(result.monetaryValues.some(v => v.includes('billion'))).toBe(true);
    });

    it('should extract email addresses and URLs', () => {
      const content = `
        Contact us at support@example.com or visit https://example.com/contact.
        For sales: sales@example.com
      `;

      const result = service.extractEntities(content);

      expect(result.emails).toContain('support@example.com');
      expect(result.emails).toContain('sales@example.com');
      expect(result.urls).toContain('https://example.com/contact');
    });

    it('should calculate entity density', () => {
      const content = `
        Apple announced the iPhone 15 Pro. The device features an A17 chip.
        Tim Cook said sales exceeded expectations in all markets.
      `;

      const result = service.calculateEntityDensity(content);

      expect(result.density).toBeGreaterThan(0);
      expect(result.entityCount).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });

  describe('Content Structure Analysis', () => {
    it('should analyze content hierarchy', () => {
      const html = `
<html>
<body>
  <h1>Main Title</h1>
  <p>Introduction paragraph.</p>
  <h2>Section 1</h2>
  <p>Section 1 content.</p>
  <h3>Subsection 1.1</h3>
  <p>Subsection content.</p>
  <h2>Section 2</h2>
  <p>Section 2 content.</p>
</body>
</html>`;

      const result = service.analyzeContentStructure(html);

      expect(result.headingHierarchy.isValid).toBe(true);
      expect(result.headingHierarchy.h1Count).toBe(1);
      expect(result.headingHierarchy.h2Count).toBe(2);
      expect(result.headingHierarchy.h3Count).toBe(1);
    });

    it('should detect heading hierarchy issues', () => {
      const html = `
<html>
<body>
  <h2>No H1 present</h2>
  <h4>Skipped H3</h4>
  <h3>Out of order</h3>
</body>
</html>`;

      const result = service.analyzeContentStructure(html);

      expect(result.headingHierarchy.isValid).toBe(false);
      expect(result.headingHierarchy.issues).toContain('Missing H1');
      expect(result.headingHierarchy.issues).toContain('Skipped heading level');
    });

    it('should analyze paragraph structure', () => {
      const html = `
<html>
<body>
  <p>Short paragraph.</p>
  <p>This is a longer paragraph with more content that provides additional context and information about the topic at hand. It includes multiple sentences and ideas.</p>
  <p>Medium length paragraph with some details.</p>
</body>
</html>`;

      const result = service.analyzeContentStructure(html);

      expect(result.paragraphs.count).toBe(3);
      expect(result.paragraphs.averageLength).toBeGreaterThan(0);
    });

    it('should analyze list usage', () => {
      const html = `
<html>
<body>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
  <ol>
    <li>First</li>
    <li>Second</li>
    <li>Third</li>
  </ol>
</body>
</html>`;

      const result = service.analyzeContentStructure(html);

      expect(result.lists.unordered).toBe(1);
      expect(result.lists.ordered).toBe(1);
      expect(result.lists.totalItems).toBe(5);
    });

    it('should analyze table structure', () => {
      const html = `
<html>
<body>
  <table>
    <caption>Data Table</caption>
    <thead>
      <tr><th>Column 1</th><th>Column 2</th></tr>
    </thead>
    <tbody>
      <tr><td>Data 1</td><td>Data 2</td></tr>
      <tr><td>Data 3</td><td>Data 4</td></tr>
    </tbody>
  </table>
</body>
</html>`;

      const result = service.analyzeContentStructure(html);

      expect(result.tables.count).toBe(1);
      expect(result.tables.withHeaders).toBe(1);
      expect(result.tables.withCaptions).toBe(1);
      expect(result.tables.accessibilityScore).toBeGreaterThan(80);
    });

    it('should detect tables without headers', () => {
      const html = `
<html>
<body>
  <table>
    <tr><td>Data 1</td><td>Data 2</td></tr>
    <tr><td>Data 3</td><td>Data 4</td></tr>
  </table>
</body>
</html>`;

      const result = service.analyzeContentStructure(html);

      expect(result.tables.withHeaders).toBe(0);
      expect(result.tables.accessibilityIssues).toContain('Table missing header row');
    });
  });

  describe('Accessibility Semantics', () => {
    it('should analyze ARIA attributes', () => {
      const html = `
<html>
<body>
  <button aria-label="Close menu" aria-expanded="false">X</button>
  <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <h2 id="dialog-title">Dialog Title</h2>
  </div>
</body>
</html>`;

      const result = service.analyzeARIA(html);

      expect(result.ariaLabels).toBeGreaterThan(0);
      expect(result.ariaRoles).toContain('dialog');
      expect(result.hasAriaLabelledby).toBe(true);
    });

    it('should detect missing ARIA on interactive elements', () => {
      const html = `
<html>
<body>
  <div onclick="doSomething()">Clickable div</div>
  <span class="button">Button-like span</span>
</body>
</html>`;

      const result = service.analyzeARIA(html);

      expect(result.issues).toContain('Interactive element missing role attribute');
    });

    it('should analyze form accessibility', () => {
      const html = `
<html>
<body>
  <form>
    <label for="name">Name</label>
    <input id="name" type="text" required>

    <label for="email">Email</label>
    <input id="email" type="email" aria-describedby="email-hint">
    <span id="email-hint">We'll never share your email</span>

    <input type="text" placeholder="No label">
  </form>
</body>
</html>`;

      const result = service.analyzeFormAccessibility(html);

      expect(result.inputsWithLabels).toBe(2);
      expect(result.inputsWithoutLabels).toBe(1);
      expect(result.hasAriaDescribedby).toBe(true);
      expect(result.accessibilityScore).toBeGreaterThan(60);
    });

    it('should analyze image accessibility', () => {
      const html = `
<html>
<body>
  <img src="photo.jpg" alt="A detailed description of the photo">
  <img src="icon.svg" alt="" role="presentation">
  <img src="important.jpg">
</body>
</html>`;

      const result = service.analyzeImageAccessibility(html);

      expect(result.imagesWithAlt).toBe(2);
      expect(result.imagesWithoutAlt).toBe(1);
      expect(result.decorativeImages).toBe(1);
    });
  });

  describe('Topic and Keyword Analysis', () => {
    it('should extract main topics from content', () => {
      const content = `
        Machine learning is transforming artificial intelligence.
        Deep learning models use neural networks to process data.
        AI applications include natural language processing and computer vision.
      `;

      const result = service.extractTopics(content);

      expect(result.mainTopics).toContain('machine learning');
      expect(result.mainTopics).toContain('artificial intelligence');
    });

    it('should calculate keyword density', () => {
      const content = `
        The keyword appears here. The keyword is important.
        This content mentions the keyword multiple times.
        The keyword density should be calculated.
      `;

      const result = service.calculateKeywordDensity(content, 'keyword');

      expect(result.count).toBe(4);
      expect(result.density).toBeGreaterThan(0);
    });

    it('should identify keyword stuffing', () => {
      const content = `
        SEO keywords SEO tips SEO tricks SEO strategy SEO optimization.
        Best SEO practices SEO guide SEO tutorial SEO help SEO services.
      `;

      const result = service.detectKeywordStuffing(content);

      expect(result.isStuffed).toBe(true);
      expect(result.stuffedKeywords).toContain('seo');
    });

    it('should extract key phrases (n-grams)', () => {
      const content = `
        Content marketing strategies help businesses grow.
        Digital marketing and content marketing are essential.
        Learn more about content marketing best practices.
      `;

      const result = service.extractKeyPhrases(content);

      expect(result.some(p => p.phrase === 'content marketing')).toBe(true);
    });
  });

  describe('Semantic Scoring', () => {
    it('should calculate overall semantic score', () => {
      const analysis = {
        schemaOrg: { isValid: true, schemas: [{ type: 'Article' }] },
        semanticHTML: { score: 85 },
        accessibility: { score: 90 },
        contentStructure: { score: 80 }
      };

      const score = service.calculateSemanticScore(analysis);

      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should generate semantic recommendations', () => {
      const analysis = {
        schemaOrg: { isValid: false, schemas: [] },
        semanticHTML: { hasMain: false, hasArticle: false },
        accessibility: { imagesWithoutAlt: 5 }
      };

      const recommendations = service.generateRecommendations(analysis);

      expect(recommendations.some(r => r.includes('schema'))).toBe(true);
      expect(recommendations.some(r => r.includes('semantic'))).toBe(true);
      expect(recommendations.some(r => r.includes('alt'))).toBe(true);
    });
  });

  describe('Issue Reporting', () => {
    it('should create semantic issues with severity', () => {
      const issue = service.createIssue({
        type: 'missing_schema',
        description: 'No Schema.org markup found',
        severity: 'medium',
        recommendation: 'Add appropriate Schema.org markup'
      });

      expect(issue.type).toBe('missing_schema');
      expect(issue.severity).toBe('medium');
      expect(issue.id).toBeDefined();
    });

    it('should group issues by category', () => {
      service.addIssue({ type: 'schema', category: 'structured_data', severity: 'high', description: 'Schema issue' });
      service.addIssue({ type: 'accessibility', category: 'a11y', severity: 'medium', description: 'A11y issue' });
      service.addIssue({ type: 'semantic', category: 'html', severity: 'low', description: 'Semantic issue' });

      const grouped = service.getIssuesByCategory();

      expect(grouped['structured_data']).toHaveLength(1);
      expect(grouped['a11y']).toHaveLength(1);
      expect(grouped['html']).toHaveLength(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit events during analysis', () => {
      const events: string[] = [];

      service.on('analysis:start', () => events.push('start'));
      service.on('analysis:complete', () => events.push('complete'));

      service.emit('analysis:start', { url: 'https://example.com' });
      service.emit('analysis:complete', { score: 85 });

      expect(events).toContain('start');
      expect(events).toContain('complete');
    });
  });
});
