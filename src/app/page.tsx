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

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
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
