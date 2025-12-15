import {
  SiteHeader,
  HeroSection,
  ValueProps,
  FeaturesShowcase,
  DashboardPreview,
  AIPlatforms,
  Integrations,
  PricingSection,
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
        <AIPlatforms />
        <Integrations />
        <PricingSection />
        <FAQSection />
        <CTAFooter />
      </main>
      <SiteFooter />
    </div>
  );
}
