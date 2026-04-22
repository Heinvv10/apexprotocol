import Script from "next/script";
import {
  SiteHeader,
  HeroSection,
  ValueProps,
  FeaturesShowcase,
  DashboardPreview,
  AIPlatforms,
  Integrations,
  PricingSection,
  TestimonialsSection,
  ComparisonTable,
  DemoMode,
  CaseStudies,
  PerplexitySection,
  FAQSection,
  CTAFooter,
  SiteFooter,
} from "@/components/landing";

const SITE_URL = "https://www.apexgeo.app";

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Apex",
  alternateName: "ApexGEO",
  url: SITE_URL,
  logo: `${SITE_URL}/apex-linkedin-logo-400x400.png`,
  description:
    "Apex is a GEO/AEO platform that monitors brand visibility across AI search engines (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot) and ships ready-to-deploy fixes.",
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
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Apex",
  url: SITE_URL,
  description:
    "Track and optimize your brand visibility across AI-powered search engines.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="ld-organization"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(organizationLd)}
      </Script>
      <Script
        id="ld-website"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(websiteLd)}
      </Script>
      <SiteHeader />
      <main>
        <HeroSection />
        <ValueProps />
        <FeaturesShowcase />
        <DashboardPreview />
        <TestimonialsSection />
        <ComparisonTable />
        <DemoMode />
        <CaseStudies />
        <AIPlatforms />
        <Integrations />
        <PerplexitySection />
        <PricingSection />
        <FAQSection />
        <CTAFooter />
      </main>
      <SiteFooter />
    </div>
  );
}
