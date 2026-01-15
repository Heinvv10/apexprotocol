/**
 * Action Plan Generator
 *
 * Transforms recommendations into detailed, step-by-step implementation guides
 * that users can execute immediately or hand to their development team
 */

export interface ActionStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: "easy" | "medium" | "hard";
  prerequisites?: string[];
  codeSnippet?: {
    language: string;
    code: string;
    explanation: string;
  };
  verification: string[];
  resources?: string[];
  notes?: string[];
}

export interface ImplementationGuide {
  title: string;
  description: string;
  impact: {
    geoPointsExpected: string;
    platforms: string[];
    timeToComplete: string;
  };
  difficulty: "easy" | "medium" | "hard";
  prerequisites: string[];
  steps: ActionStep[];
  relatedRecommendations?: string[];
  successCriteria: string[];
  commonPitfalls: string[];
  timeline: {
    quickWin: string;
    fullImplementation: string;
  };
}

/**
 * Schema Markup Implementation Guide
 */
export const schemaMarkupGuide: ImplementationGuide = {
  title: "Add FAQ Schema to Homepage",
  description:
    "Implement JSON-LD schema markup for FAQ content to help AI platforms (ChatGPT, Claude, Perplexity) automatically identify and cite your answers.",
  impact: {
    geoPointsExpected: "+8-12 GEO points",
    platforms: ["ChatGPT", "Claude", "Gemini", "Perplexity"],
    timeToComplete: "30 minutes to 2 hours (depending on site complexity)",
  },
  difficulty: "easy",
  prerequisites: [
    "Access to your website's HTML or CMS",
    "Understanding of JSON-LD format (or willingness to copy-paste)",
    "Browser with developer tools (to test)",
  ],
  steps: [
    {
      stepNumber: 1,
      title: "Identify FAQ Content",
      description:
        "List 5-10 of your most common customer questions and their answers. These should be questions your target audience actually asks.",
      estimatedTime: "15 minutes",
      difficulty: "easy",
      verification: [
        "You have at least 5 questions",
        "Questions are phrased as customers would ask them",
        "Answers are 1-3 sentences, concise and clear",
        "Your brand name appears naturally in some answers",
      ],
      notes: [
        "Questions should match what people search for on Google + ask to AI platforms",
        'Example for project management tool: "How do I invite team members?" not "Configure user permissions"',
        "Include variations of the same question if they get asked different ways",
      ],
    },
    {
      stepNumber: 2,
      title: "Access Your Website Code",
      description:
        "Open your website's HTML or navigate to your CMS to find where you can add code to your homepage or FAQ page.",
      estimatedTime: "5 minutes",
      difficulty: "easy",
      prerequisites: ["CMS login credentials or FTP access"],
      verification: [
        "You can access the HTML head section of your page",
        "You have permission to edit and save changes",
      ],
      notes: [
        "If using WordPress: Dashboard → Pages/Posts → Edit → Code Editor",
        "If using Webflow: Designer → Settings → Custom Code → Head Code",
        "If using Shopify: Online Store → Themes → Edit Code → Assets or Snippets",
        "If using plain HTML: Open in your code editor",
      ],
    },
    {
      stepNumber: 3,
      title: "Add FAQ Schema to Page Head",
      description:
        "Copy the FAQ schema code and add it to the <head> section of your homepage (or FAQ page).",
      estimatedTime: "10 minutes",
      difficulty: "easy",
      codeSnippet: {
        language: "json-ld",
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [Your Product]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Your answer here - 2-3 sentences that AI can cite directly]"
      }
    },
    {
      "@type": "Question",
      "name": "How much does [Your Product] cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Your pricing answer]"
      }
    },
    {
      "@type": "Question",
      "name": "Does [Your Product] work with [Integration]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Yes/No answer with explanation]"
      }
    }
  ]
}
</script>`,
        explanation:
          "This JSON-LD schema tells AI platforms exactly what your FAQ questions and answers are. They can directly quote your answers instead of guessing.",
      },
      verification: [
        "Schema code is in the <head> section (not body)",
        "You have 5-10 question/answer pairs",
        "All answers are under 300 words each",
        "No HTML or special characters in answers (keep it plain text)",
      ],
      resources: [
        "Schema.org FAQPage Documentation: https://schema.org/FAQPage",
        "Schema Validator: https://validator.schema.org/",
      ],
    },
    {
      stepNumber: 4,
      title: "Test the Schema",
      description:
        "Verify your schema is valid using Google's Schema Validator and make sure it has no errors.",
      estimatedTime: "5 minutes",
      difficulty: "easy",
      verification: [
        "Go to https://validator.schema.org/",
        "Paste your schema code or page URL",
        "No validation errors shown",
        "All questions and answers are recognized",
      ],
      notes: [
        "Common error: Extra commas or missing quotes in JSON - JSON is strict about syntax",
        "If errors appear, check for special characters in your answers (use plain text only)",
      ],
    },
    {
      stepNumber: 5,
      title: "Deploy and Monitor",
      description:
        "Publish your changes to production. Wait 24-48 hours for AI platforms to recrawl your page.",
      estimatedTime: "5 minutes (+ 24-48 hour wait)",
      difficulty: "easy",
      verification: [
        "Schema code is live on your website",
        "After 24 hours: Run schema validator on live URL - still passes",
        "After 48 hours: Search ChatGPT for '[Your brand name] FAQ' - your answers appear",
      ],
      notes: [
        "AI platforms recrawl your site on a schedule - usually within 24-48 hours",
        "More active sites get crawled more frequently",
        "You can request recrawl by updating the page (add a new question)",
      ],
    },
  ],
  relatedRecommendations: ["Organization Schema", "Product Schema", "Article Schema"],
  successCriteria: [
    "Schema validator shows zero errors",
    "All questions and answers visible in validator output",
    "Page stays on your website for 48+ hours",
    "ChatGPT/Claude start citing your answers",
  ],
  commonPitfalls: [
    "Putting schema in body instead of head section",
    "Using HTML formatting in answers (breaks the JSON)",
    "Answers that are too long (500+ words - AI can't quote that)",
    "Questions that don't match what users actually search for",
    "Schema is there but answers are generic/unhelpful",
  ],
  timeline: {
    quickWin: "Add 5 FAQs with schema (30 min) - see initial visibility in 24 hours",
    fullImplementation: "Add 20+ FAQs across FAQ page + homepage (2 hours) - 7-14 day ramp-up in citations",
  },
};

/**
 * What is [Brand] Page Implementation Guide
 */
export const brandDefinitionGuide: ImplementationGuide = {
  title: 'Create "What is [Brand]?" Page',
  description:
    "Build a definitive page that explains exactly what your brand is. This is what AI platforms show when users ask 'What is [Brand]?'",
  impact: {
    geoPointsExpected: "+5-8 GEO points",
    platforms: ["ChatGPT", "Claude", "Gemini"],
    timeToComplete: "1-2 hours",
  },
  difficulty: "easy",
  prerequisites: [
    "Your brand positioning/messaging defined",
    "CMS or website where you can add a page",
    "Basic content writing ability",
  ],
  steps: [
    {
      stepNumber: 1,
      title: "Plan Your Content Structure",
      description:
        "Outline what your 'What is' page should include before writing. This gives you and AI platforms clarity.",
      estimatedTime: "15 minutes",
      difficulty: "easy",
      verification: [
        "You have a one-sentence brand definition",
        "You've listed 3-5 key features or benefits",
        "You have target audience description",
        "You have 2-3 competitors to compare against",
      ],
      notes: [
        "The one-sentence definition is critical - this is what AI will quote directly",
        "Example: 'Acme PM is project management software for remote teams that brings visibility and accountability to distributed work.'",
      ],
    },
    {
      stepNumber: 2,
      title: "Write Your Brand Definition",
      description:
        "Create a clear, factual explanation of your brand. This should answer 'What is [Brand]?' directly.",
      estimatedTime: "30 minutes",
      difficulty: "easy",
      codeSnippet: {
        language: "html",
        code: `<h1>What is [Brand Name]?</h1>

<p><strong>[Brand]</strong> is [one-sentence definition that answers the question directly].
Founded in [year], we [core value proposition].</p>

<h2>Key Features</h2>
<ul>
  <li><strong>Feature 1:</strong> [What it does and who it's for]</li>
  <li><strong>Feature 2:</strong> [What it does and who it's for]</li>
  <li><strong>Feature 3:</strong> [What it does and who it's for]</li>
</ul>

<h2>Who Uses [Brand]?</h2>
<p>[Target audience description. Example: "Remote teams of 5-500 people who need central visibility into projects and accountability"]</p>

<h2>How [Brand] Compares to Alternatives</h2>
<p>[Honest comparison. What makes you different? Don't trash competitors, just be honest.]</p>`,
        explanation:
          "This structure helps both human visitors and AI understand exactly what you are, why you exist, and who you help.",
      },
      verification: [
        "First sentence directly answers 'What is [Brand]?'",
        "Your brand name appears in first paragraph",
        "Content is factual and verifiable",
        "No marketing fluff - straightforward explanation",
        "Include founding year or relevant history",
      ],
    },
    {
      stepNumber: 3,
      title: "Create the Page",
      description:
        "Add the page to your website. URL should be something clear like /about or /what-is-[brand]",
      estimatedTime: "10 minutes",
      difficulty: "easy",
      prerequisites: ["CMS access"],
      verification: [
        "Page is published at a consistent URL",
        "Page title is something like 'What is [Brand]?'",
        "Meta description starts with 'What is [Brand]?'",
        "Content is easily readable (good formatting, short paragraphs)",
      ],
      notes: [
        "Don't use /about if you already have a different /about page",
        "Good URL: yoursite.com/what-is-[brand]",
        "Add this page to your main navigation if space allows",
      ],
    },
    {
      stepNumber: 4,
      title: "Add Organization Schema",
      description:
        "Add JSON-LD Organization schema so AI platforms have structured data about your company.",
      estimatedTime: "10 minutes",
      difficulty: "easy",
      codeSnippet: {
        language: "json-ld",
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Brand Name]",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "sameAs": [
    "https://www.linkedin.com/company/[your-company]",
    "https://twitter.com/[your-handle]",
    "https://www.youtube.com/@[your-channel]"
  ],
  "description": "[Your one-sentence brand definition]",
  "foundingDate": "[Year]",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "[Your phone]",
    "contactType": "Customer Service",
    "email": "[Your email]"
  }
}
</script>`,
        explanation:
          "Organization schema gives AI platforms complete information about who you are. Add this to your 'What is' page.",
      },
      verification: [
        "Schema validates at https://validator.schema.org/",
        "Your company name, URL, and description are in the schema",
        "Social media links are included",
      ],
    },
    {
      stepNumber: 5,
      title: "Link and Monitor",
      description:
        "Make sure your page is discoverable and monitor how AI platforms represent your brand.",
      estimatedTime: "5 minutes (+ ongoing)",
      difficulty: "easy",
      verification: [
        "Page is linked from your homepage",
        "Page appears in your sitemap.xml",
        "After 24 hours: Search ChatGPT 'What is [Brand]?' - your page appears in answer",
      ],
      notes: [
        "Update this page as your company evolves",
        "If AI is misrepresenting you, update the page and ask AI to refresh its knowledge",
      ],
    },
  ],
  relatedRecommendations: ["Add FAQ Schema", "Optimize Meta Descriptions", "Build Content Hub"],
  successCriteria: [
    "Page directly answers 'What is [Brand]?'",
    "Schema validates without errors",
    "AI platforms cite this page when asked about your brand",
    "Page shows up in Google results for '[Brand]'",
  ],
  commonPitfalls: [
    "Page is too salesy/marketing-focused - AI wants facts",
    "Page buries the key information - put your definition in first sentence",
    "Page is out of date - if company evolved, page should too",
    "Mixing multiple brand pages - consolidate on one definitive page",
    "Page has no outbound links or data - AI wants references",
  ],
  timeline: {
    quickWin: "Write basic page (30 min) - immediate improvement in how AI describes you",
    fullImplementation: "Polished page with schema + internal links (2 hours) - full AI knowledge graph integration",
  },
};

/**
 * Meta Description Optimization Guide
 */
export const metaDescriptionGuide: ImplementationGuide = {
  title: "Optimize Meta Descriptions for AI",
  description:
    "Rewrite meta descriptions on key pages to be AI-friendly. Meta descriptions tell AI (and search engines) what your page is about.",
  impact: {
    geoPointsExpected: "+3-5 GEO points",
    platforms: ["All platforms"],
    timeToComplete: "30 minutes to 1 hour",
  },
  difficulty: "easy",
  prerequisites: [
    "CMS access to edit page metadata",
    "List of your top 10 pages",
  ],
  steps: [
    {
      stepNumber: 1,
      title: "Identify Key Pages",
      description:
        "Make a list of your 10 most important pages. Focus on pages that are relevant to your brand positioning.",
      estimatedTime: "10 minutes",
      difficulty: "easy",
      verification: [
        "You have at least 10 pages listed",
        "Pages are ones visitors actually see (not admin pages)",
        "Mix of product pages, about pages, help pages",
      ],
    },
    {
      stepNumber: 2,
      title: "Write AI-Friendly Meta Descriptions",
      description:
        "Create meta descriptions that are clear, factual, and help AI understand what the page is about.",
      estimatedTime: "20 minutes",
      difficulty: "easy",
      codeSnippet: {
        language: "html",
        code: `<!-- WRONG - Generic and unhelpful -->
<meta name="description" content="Products">

<!-- CORRECT - Clear and informative for AI -->
<meta name="description" content="[Brand] offers [product type] for [audience]. Features include [top 3 features].">

<!-- EXAMPLE -->
<meta name="description" content="Acme PM offers project management software for remote teams. Features include real-time visibility, team accountability, and automated reporting.">`,
        explanation:
          "Meta descriptions should be 150-160 characters and clearly state what the page offers. AI uses these to understand context.",
      },
      verification: [
        "Each description is 150-160 characters (fits in search results)",
        "No keyword stuffing or repetition",
        "Descriptions accurately describe page content",
        "Brand name appears where natural",
        "Includes what makes you different",
      ],
      notes: [
        "Format: [What you offer] for [who]. [Key benefit]. [How to get started]",
        "Put the most important info first (AI and humans read left to right)",
        "Use active voice and clear language",
      ],
    },
    {
      stepNumber: 3,
      title: "Update All Key Pages",
      description:
        "Go through your list and update each page's meta description with the AI-friendly version.",
      estimatedTime: "20 minutes",
      difficulty: "easy",
      verification: [
        "All 10 key pages have updated meta descriptions",
        "Each description follows the template",
        "No generic 'Welcome' or 'Page' descriptions",
      ],
    },
    {
      stepNumber: 4,
      title: "Test and Verify",
      description:
        "Check that your meta descriptions appear correctly in search and when AI quotes your site.",
      estimatedTime: "5 minutes (+ ongoing)",
      difficulty: "easy",
      verification: [
        "View page source (Ctrl+U) - meta description is there",
        "Google results show your description",
        "After 24 hours: ChatGPT/Claude use your description in summaries",
      ],
    },
  ],
  relatedRecommendations: ["Add Schema Markup", "Create 'What is [Brand]' Page"],
  successCriteria: [
    "All meta descriptions follow AI-friendly format",
    "Descriptions are 150-160 characters",
    "AI platforms use your descriptions in responses",
    "No duplicate descriptions across pages",
  ],
  commonPitfalls: [
    "Descriptions are too generic ('Welcome', 'Page', 'Products')",
    "Descriptions are way too long (200+ characters - gets cut off)",
    "Keyword stuffing ('best project management for remote teams software solutions')",
    "Descriptions don't match page content",
    "Using same description on multiple pages",
  ],
  timeline: {
    quickWin: "Update top 5 pages (15 min) - immediate improvement in AI summaries",
    fullImplementation: "Update all 50+ pages (2 hours) - consistent AI representation across site",
  },
};

/**
 * Get all implementation guides
 */
export function getAllImplementationGuides(): ImplementationGuide[] {
  return [schemaMarkupGuide, brandDefinitionGuide, metaDescriptionGuide];
}

/**
 * Get implementation guide by title/ID
 */
export function getImplementationGuide(title: string): ImplementationGuide | undefined {
  const guides: Record<string, ImplementationGuide> = {
    schema: schemaMarkupGuide,
    "what-is-brand": brandDefinitionGuide,
    "meta-descriptions": metaDescriptionGuide,
  };

  return guides[title.toLowerCase().replace(/\s+/g, "-")];
}

/**
 * Generate a complete action plan for a brand based on priority
 */
export interface BrandActionPlan {
  brand: {
    name: string;
    id: string;
  };
  currentGeoScore: number;
  projectedGeoScore: number;
  timeline: {
    quickWins: ImplementationGuide[];
    firstMonth: ImplementationGuide[];
    threeMonths: ImplementationGuide[];
  };
  totalEstimatedTime: string;
  expectedROI: {
    points: string;
    newScore: string;
    timeline: string;
  };
}

export function generateBrandActionPlan(
  brandName: string,
  brandId: string,
  currentScore: number
): BrandActionPlan {
  const guides = getAllImplementationGuides();

  return {
    brand: { name: brandName, id: brandId },
    currentGeoScore: currentScore,
    projectedGeoScore: currentScore + 16, // Conservative estimate
    timeline: {
      quickWins: [guides[0]], // Schema Markup (30 min)
      firstMonth: [guides[1], guides[2]], // What is Brand + Meta Descriptions
      threeMonths: guides, // All three by month 3
    },
    totalEstimatedTime: "2-4 hours total implementation",
    expectedROI: {
      points: "+16-25 GEO points",
      newScore: `${currentScore + 16}-${currentScore + 25}`,
      timeline: "4-8 weeks to see full impact",
    },
  };
}
