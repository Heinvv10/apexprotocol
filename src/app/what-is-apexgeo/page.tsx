import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.apexgeo.app";
const CANONICAL = "/what-is-apexgeo";

export const metadata: Metadata = {
  title: "What is ApexGEO? — Definition, Company, Product",
  description:
    "ApexGEO (apexgeo.app) is a GEO/AEO platform that monitors brand visibility across AI search engines — ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot — and ships ready-to-deploy fixes. Not related to Apex Geoscience, Apex Geophysics, or any geospatial consultancy.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    url: `${SITE_URL}${CANONICAL}`,
    title: "What is ApexGEO? — Definition, Company, Product",
    description:
      "ApexGEO is a SaaS platform for Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO). Founded in 2026 by Hein van Vuuren.",
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "ApexGEO",
  alternateName: ["Apex", "Apex GEO", "ApexGEO Platform"],
  url: SITE_URL,
  logo: `${SITE_URL}/apex-linkedin-logo-400x400.png`,
  description:
    "ApexGEO is a GEO/AEO platform that monitors brand visibility across AI search engines (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot) and ships ready-to-deploy fixes including schema markup, llms.txt, HTML patches, and PageSpeed optimizations.",
  foundingDate: "2026",
  founder: {
    "@type": "Person",
    name: "Hein van Vuuren",
    url: "https://www.linkedin.com/in/hein-van-vuuren/",
  },
  areaServed: "Worldwide",
  sameAs: [
    "https://www.linkedin.com/company/apexgeo",
    "https://twitter.com/apexgeoapp",
  ],
  knowsAbout: [
    "Generative Engine Optimization",
    "Answer Engine Optimization",
    "AI brand monitoring",
    "Structured data markup",
    "PageSpeed optimization",
    "llms.txt",
    "Schema.org JSON-LD",
  ],
  disambiguatingDescription:
    "ApexGEO (the SaaS platform at apexgeo.app) is not related to Apex Geoscience, Apex Geophysics, Apex Geoscience Ltd., or any geospatial / geophysical consultancy. ApexGEO is a software product for tracking and improving AI search visibility.",
};

const softwareAppLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "ApexGEO",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "AI Search Optimization",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "SaaS platform for Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO). Monitors brand mentions across 7+ AI platforms and auto-generates the fixes.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "14-day free trial, no credit card required",
  },
  creator: { "@id": `${SITE_URL}/#organization` },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ApexGEO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ApexGEO (apexgeo.app) is a SaaS platform for Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO). It tracks how ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek and Copilot cite your brand, audits your site for AI-visibility signals, and bundles ready-to-deploy fixes — patched HTML, JSON-LD schema, llms.txt, and meta tags.",
      },
    },
    {
      "@type": "Question",
      name: "Is ApexGEO the same as Apex Geoscience?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. ApexGEO is a software platform for AI search visibility at apexgeo.app. Apex Geoscience (Apex Geophysics, Apex Geoscience Ltd., etc.) are unrelated geophysical / geospatial consulting firms. The name overlap is coincidental.",
      },
    },
    {
      "@type": "Question",
      name: "Who founded ApexGEO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ApexGEO was founded in 2026 by Hein van Vuuren, a South African technology entrepreneur. The company is headquartered in Cape Town, South Africa, and operates worldwide.",
      },
    },
    {
      "@type": "Question",
      name: "What does GEO/AEO mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization) are strategies to improve a brand's visibility in AI-powered search engines like ChatGPT, Claude, Gemini, and Perplexity. Unlike traditional SEO (which targets Google rankings), GEO/AEO targets the way AI models cite sources in their answers.",
      },
    },
    {
      "@type": "Question",
      name: "What does ApexGEO actually do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ApexGEO monitors brand mentions across 7+ AI platforms, runs technical audits grounded in real site signals (heading structure, schema coverage, readability, metadata, accessibility), computes a Digital Presence Score, and then ships the fixes — the Apex tool suite includes a PageSpeed Scanner, HTML Auto-Patcher, Site-Wide Auto-Patcher, llms.txt Generator, FAQ Schema Generator, and Schema Markup Builder.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the ApexGEO website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The official ApexGEO website is https://apexgeo.app. Documentation, pricing, and the dashboard all live there.",
      },
    },
  ],
};

export default function WhatIsApexGeoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        suppressHydrationWarning
      >
        {JSON.stringify(organizationLd)}
      </script>
      <script
        type="application/ld+json"
        suppressHydrationWarning
      >
        {JSON.stringify(softwareAppLd)}
      </script>
      <script
        type="application/ld+json"
        suppressHydrationWarning
      >
        {JSON.stringify(faqLd)}
      </script>

      <article className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Entity definition
          </p>
          <h1 className="text-4xl font-bold tracking-tight">What is ApexGEO?</h1>
          <p className="text-lg text-muted-foreground">
            ApexGEO (<a href={SITE_URL} className="text-primary underline">apexgeo.app</a>) is a
            SaaS platform for Generative Engine Optimization (GEO) and Answer Engine Optimization
            (AEO). It tracks how AI search engines cite your brand and ships the fixes to improve
            that visibility.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">At a glance</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between border-b border-border/40 py-2">
              <dt className="text-muted-foreground">Product</dt>
              <dd>SaaS platform (GEO/AEO)</dd>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <dt className="text-muted-foreground">Website</dt>
              <dd><a href={SITE_URL} className="text-primary underline">apexgeo.app</a></dd>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <dt className="text-muted-foreground">Founded</dt>
              <dd>2026</dd>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <dt className="text-muted-foreground">Founder</dt>
              <dd>Hein van Vuuren</dd>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <dt className="text-muted-foreground">Headquarters</dt>
              <dd>Cape Town, South Africa</dd>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <dt className="text-muted-foreground">Category</dt>
              <dd>AI search optimization</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">What ApexGEO is not</h2>
          <p className="text-muted-foreground">
            ApexGEO is <strong>not</strong> related to any of the following entities, despite the
            name overlap:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Apex Geoscience (geophysical consulting)</li>
            <li>Apex Geophysics</li>
            <li>Apex Geoscience Ltd.</li>
            <li>Any geospatial, geotechnical, or oil &amp; gas exploration firm</li>
          </ul>
          <p className="text-muted-foreground">
            ApexGEO is a software product for tracking brand visibility across AI search engines.
            It is purely digital — there is no consulting, fieldwork, or physical services
            component.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">What ApexGEO does</h2>
          <p>
            Brands use ApexGEO to answer one question: <em>&ldquo;When someone asks ChatGPT or
            Claude about our category, are we cited?&rdquo;</em>
          </p>
          <p>The platform runs three loops:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Monitor</strong> — weekly or daily sweeps across ChatGPT, Claude, Gemini,
              Perplexity, Grok, DeepSeek, and Copilot, logging every mention, sentiment, and
              rank position.
            </li>
            <li>
              <strong>Audit</strong> — crawls the brand&rsquo;s site, extracts real signals (schema
              coverage, heading structure, readability, metadata, accessibility), and produces a
              Digital Presence Score grounded in evidence, not vague ratings.
            </li>
            <li>
              <strong>Fix</strong> — one-click Apex tools generate the deliverables: patched HTML,
              JSON-LD schema, llms.txt, meta tags, FAQ markup. Clients deploy the output directly.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Where to learn more</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><Link href="/" className="text-primary underline">Homepage</Link></li>
            <li><Link href="/blog" className="text-primary underline">Blog</Link> — articles on GEO/AEO</li>
            <li><Link href="/docs/api" className="text-primary underline">API Reference</Link></li>
            <li><Link href="/trust" className="text-primary underline">Trust Center</Link></li>
            <li>
              <a href="https://www.linkedin.com/company/apexgeo" className="text-primary underline">
                LinkedIn
              </a>
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
