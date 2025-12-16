/**
 * Tests for Cheerio-based DOM Extractor (Phase 7.0)
 */

import { describe, it, expect } from "vitest";
import {
  createExtractor,
  extractTeamFromHtml,
  extractSocialsFromHtml,
  extractSchemasFromHtml,
} from "../index";

// ============================================================================
// Test Fixtures
// ============================================================================

const BASIC_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Company | Home</title>
  <meta name="description" content="Test company description here">
  <meta name="keywords" content="test, company, keywords">
  <meta property="og:title" content="Test Company OG Title">
  <meta property="og:description" content="OG Description">
  <meta property="og:image" content="https://example.com/og-image.jpg">
  <link rel="canonical" href="https://example.com/">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Test Company",
    "url": "https://example.com"
  }
  </script>
</head>
<body>
  <header>
    <a href="https://linkedin.com/company/test-company">LinkedIn</a>
    <a href="https://twitter.com/testcompany">Twitter</a>
  </header>
  <main>
    <h1>Welcome to Test Company</h1>
    <h2>Our Services</h2>
    <h2>About Us</h2>
    <p>Some content here.</p>
    <img src="logo.png" alt="Test Company Logo">
    <a href="https://example.com/about">About</a>
    <a href="https://external.com/link" rel="nofollow">External</a>
  </main>
  <footer>
    <a href="https://facebook.com/testcompany">Facebook</a>
    <a href="https://instagram.com/testcompany">Instagram</a>
  </footer>
</body>
</html>
`;

const TEAM_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Our Team</title></head>
<body>
  <section class="team-section">
    <h2>Meet Our Team</h2>
    <div class="team-member">
      <img src="jane-photo.jpg" alt="Jane Doe">
      <h3>Jane Doe</h3>
      <p class="title">CEO & Founder</p>
      <p class="bio">Jane has over 20 years of experience in technology.</p>
      <a href="https://linkedin.com/in/janedoe">LinkedIn</a>
      <a href="https://twitter.com/janedoe">Twitter</a>
    </div>
    <div class="team-member">
      <img src="john-photo.jpg" alt="John Smith">
      <h3>John Smith</h3>
      <p class="title">CTO</p>
      <p class="bio">John is our technical leader with expertise in AI.</p>
      <a href="https://linkedin.com/in/johnsmith">LinkedIn</a>
    </div>
    <div class="team-member">
      <img src="alice-photo.jpg" alt="Alice Johnson">
      <h3>Alice Johnson</h3>
      <p class="title">VP of Marketing</p>
      <a href="https://linkedin.com/in/alicejohnson">LinkedIn</a>
    </div>
  </section>
</body>
</html>
`;

const LEADERSHIP_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Leadership</title></head>
<body>
  <div class="leadership-team">
    <div class="leader-card">
      <h4>Michael Chen</h4>
      <span class="position">Chief Executive Officer</span>
      <a href="mailto:michael@example.com">Email</a>
      <a href="https://linkedin.com/in/michaelchen">Connect</a>
    </div>
    <div class="leader-card">
      <h4>Sarah Williams</h4>
      <span class="position">Chief Financial Officer</span>
      <a href="https://linkedin.com/in/sarahwilliams">Connect</a>
    </div>
  </div>
</body>
</html>
`;

const SOCIAL_FOOTER_HTML = `
<!DOCTYPE html>
<html>
<head><title>Company</title></head>
<body>
  <footer>
    <div class="social-links">
      <a href="https://linkedin.com/company/acme" aria-label="LinkedIn">
        <svg class="icon"></svg>
      </a>
      <a href="https://twitter.com/acmeinc" aria-label="Twitter">
        <svg class="icon"></svg>
      </a>
      <a href="https://facebook.com/acmeinc" aria-label="Facebook">
        <svg class="icon"></svg>
      </a>
      <a href="https://youtube.com/@acmeinc" aria-label="YouTube">
        <svg class="icon"></svg>
      </a>
      <a href="https://github.com/acmeinc" aria-label="GitHub">
        <svg class="icon"></svg>
      </a>
    </div>
  </footer>
</body>
</html>
`;

const MULTIPLE_SCHEMAS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Product Page</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Example Corp"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Widget Pro"
  }
  </script>
</head>
<body></body>
</html>
`;

// ============================================================================
// Tests
// ============================================================================

describe("createExtractor", () => {
  describe("Basic Metadata Extraction", () => {
    it("should extract page title", () => {
      const extractor = createExtractor(BASIC_HTML);
      expect(extractor.extractTitle()).toBe("Test Company | Home");
    });

    it("should extract meta description", () => {
      const extractor = createExtractor(BASIC_HTML);
      expect(extractor.extractMetaDescription()).toBe(
        "Test company description here"
      );
    });

    it("should extract full metadata object", () => {
      const extractor = createExtractor(BASIC_HTML);
      const meta = extractor.extractMeta();
      expect(meta.title).toBe("Test Company | Home");
      expect(meta.description).toBe("Test company description here");
      expect(meta.keywords).toContain("test");
      expect(meta.canonical).toBe("https://example.com/");
    });

    it("should handle empty/missing metadata gracefully", () => {
      const extractor = createExtractor("<html><head></head><body></body></html>");
      expect(extractor.extractTitle()).toBe("");
      expect(extractor.extractMetaDescription()).toBe("");
      const meta = extractor.extractMeta();
      expect(meta.keywords).toEqual([]);
    });
  });

  describe("Heading Structure Extraction", () => {
    it("should extract all heading levels", () => {
      const extractor = createExtractor(BASIC_HTML);
      const headings = extractor.extractHeadings();
      expect(headings.h1).toContain("Welcome to Test Company");
      expect(headings.h2).toContain("Our Services");
      expect(headings.h2).toContain("About Us");
    });

    it("should handle pages with no headings", () => {
      const extractor = createExtractor("<html><body><p>No headings</p></body></html>");
      const headings = extractor.extractHeadings();
      expect(headings.h1).toEqual([]);
      expect(headings.h2).toEqual([]);
      expect(headings.h3).toEqual([]);
    });
  });

  describe("OpenGraph Extraction", () => {
    it("should extract OpenGraph data", () => {
      const extractor = createExtractor(BASIC_HTML);
      const og = extractor.extractOpenGraph();
      expect(og.title).toBe("Test Company OG Title");
      expect(og.description).toBe("OG Description");
      expect(og.image).toBe("https://example.com/og-image.jpg");
    });
  });

  describe("JSON-LD Schema Extraction", () => {
    it("should extract JSON-LD schema", () => {
      const extractor = createExtractor(BASIC_HTML);
      const schemas = extractor.extractJsonLd();
      expect(schemas).toHaveLength(1);
      expect(schemas[0]["@type"]).toBe("Organization");
      expect(schemas[0].name).toBe("Test Company");
    });

    it("should extract multiple schemas", () => {
      const extractor = createExtractor(MULTIPLE_SCHEMAS_HTML);
      const schemas = extractor.extractJsonLd();
      expect(schemas).toHaveLength(2);
      expect(schemas.map((s) => s["@type"])).toContain("Organization");
      expect(schemas.map((s) => s["@type"])).toContain("Product");
    });

    it("should handle invalid JSON-LD gracefully", () => {
      const html = `
        <html><head>
        <script type="application/ld+json">{ invalid json }</script>
        </head><body></body></html>
      `;
      const extractor = createExtractor(html);
      const schemas = extractor.extractJsonLd();
      expect(schemas).toEqual([]);
    });
  });

  describe("Link Extraction", () => {
    it("should extract all links with metadata", () => {
      const extractor = createExtractor(BASIC_HTML);
      const links = extractor.extractLinks();
      expect(links.length).toBeGreaterThan(0);

      const aboutLink = links.find((l) => l.href.includes("/about"));
      expect(aboutLink).toBeDefined();
      expect(aboutLink?.text).toBe("About");
      expect(aboutLink?.isExternal).toBe(false);

      const externalLink = links.find((l) => l.href.includes("external.com"));
      expect(externalLink).toBeDefined();
      expect(externalLink?.isExternal).toBe(true);
      expect(externalLink?.isNoFollow).toBe(true);
    });
  });

  describe("Image Extraction", () => {
    it("should extract images with alt text", () => {
      const extractor = createExtractor(BASIC_HTML);
      const images = extractor.extractImages();
      expect(images.length).toBeGreaterThan(0);

      const logo = images.find((i) => i.isLogo);
      expect(logo).toBeDefined();
      expect(logo?.alt).toBe("Test Company Logo");
    });
  });

  describe("Query Methods", () => {
    it("should query elements by selector", () => {
      const extractor = createExtractor(BASIC_HTML);
      const h2s = extractor.query("h2");
      expect(h2s).toContain("Our Services");
      expect(h2s).toContain("About Us");
    });

    it("should get single element text", () => {
      const extractor = createExtractor(BASIC_HTML);
      expect(extractor.queryOne("h1")).toBe("Welcome to Test Company");
    });

    it("should get attribute value", () => {
      const extractor = createExtractor(BASIC_HTML);
      const canonical = extractor.queryAttr('link[rel="canonical"]', "href");
      expect(canonical).toBe("https://example.com/");
    });

    it("should check element existence", () => {
      const extractor = createExtractor(BASIC_HTML);
      expect(extractor.exists("header")).toBe(true);
      expect(extractor.exists("nonexistent")).toBe(false);
    });
  });
});

describe("Team Discovery", () => {
  describe("extractTeamMembers", () => {
    it("should extract team members from team section", () => {
      const extractor = createExtractor(TEAM_PAGE_HTML);
      const result = extractor.extractTeamMembers();

      expect(result.sectionFound).toBe(true);
      expect(result.members.length).toBe(3);

      const jane = result.members.find((m) => m.name === "Jane Doe");
      expect(jane).toBeDefined();
      expect(jane?.title).toBe("CEO & Founder");
      expect(jane?.bio).toContain("20 years");
      expect(jane?.linkedin).toContain("linkedin.com/in/janedoe");
      expect(jane?.twitter).toContain("twitter.com/janedoe");
    });

    it("should extract leadership from leadership section", () => {
      const extractor = createExtractor(LEADERSHIP_PAGE_HTML);
      const result = extractor.extractTeamMembers();

      expect(result.sectionFound).toBe(true);
      expect(result.sectionType).toBe("leadership");
      expect(result.members.length).toBe(2);

      const michael = result.members.find((m) => m.name === "Michael Chen");
      expect(michael).toBeDefined();
      expect(michael?.title).toBe("Chief Executive Officer");
    });

    it("should handle pages without team sections", () => {
      const extractor = createExtractor(BASIC_HTML);
      const result = extractor.extractTeamMembers();
      expect(result.members.length).toBe(0);
    });

    it("should have confidence scores", () => {
      const extractor = createExtractor(TEAM_PAGE_HTML);
      const result = extractor.extractTeamMembers();

      expect(result.confidence).toBeGreaterThan(0);
      result.members.forEach((m) => {
        expect(m.confidence).toBeGreaterThanOrEqual(0);
        expect(m.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("extractTeamFromHtml helper", () => {
    it("should provide quick extraction", () => {
      const members = extractTeamFromHtml(TEAM_PAGE_HTML);
      expect(members.length).toBe(3);
      expect(members[0].name).toBeDefined();
    });
  });
});

describe("Social Discovery", () => {
  describe("extractSocialLinks", () => {
    it("should extract social links from header", () => {
      const extractor = createExtractor(BASIC_HTML);
      const result = extractor.extractSocialLinks();

      expect(result.links.length).toBeGreaterThan(0);
      expect(result.foundInHeader).toBe(true);

      const linkedin = result.links.find((l) => l.platform === "linkedin");
      expect(linkedin).toBeDefined();
      expect(linkedin?.handle).toBe("test-company");
    });

    it("should extract social links from footer", () => {
      const extractor = createExtractor(SOCIAL_FOOTER_HTML);
      const result = extractor.extractSocialLinks();

      expect(result.foundInFooter).toBe(true);
      expect(result.links.length).toBe(5);

      const platforms = result.links.map((l) => l.platform);
      expect(platforms).toContain("linkedin");
      expect(platforms).toContain("twitter");
      expect(platforms).toContain("facebook");
      expect(platforms).toContain("youtube");
      expect(platforms).toContain("github");
    });

    it("should extract handles from URLs", () => {
      const extractor = createExtractor(SOCIAL_FOOTER_HTML);
      const result = extractor.extractSocialLinks();

      const twitter = result.links.find((l) => l.platform === "twitter");
      expect(twitter?.handle).toBe("acmeinc");

      const youtube = result.links.find((l) => l.platform === "youtube");
      expect(youtube?.handle).toBe("acmeinc");
    });

    it("should identify company vs personal profiles", () => {
      const extractor = createExtractor(SOCIAL_FOOTER_HTML);
      const result = extractor.extractSocialLinks();

      const linkedin = result.links.find((l) => l.platform === "linkedin");
      expect(linkedin?.type).toBe("company");
    });

    it("should have confidence scores", () => {
      const extractor = createExtractor(SOCIAL_FOOTER_HTML);
      const result = extractor.extractSocialLinks();

      expect(result.confidence).toBeGreaterThan(0);
      result.links.forEach((l) => {
        expect(l.confidence).toBeGreaterThanOrEqual(0);
        expect(l.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("extractSocialsFromHtml helper", () => {
    it("should provide quick extraction", () => {
      const links = extractSocialsFromHtml(SOCIAL_FOOTER_HTML);
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].platform).toBeDefined();
    });
  });
});

describe("Schema Extraction Helper", () => {
  it("should provide quick schema extraction", () => {
    const schemas = extractSchemasFromHtml(MULTIPLE_SCHEMAS_HTML);
    expect(schemas.length).toBe(2);
  });
});
