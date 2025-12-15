"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is GEO/AEO and why does it matter?",
    answer: "GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization) are strategies to improve your brand's visibility in AI-powered search engines like ChatGPT, Claude, and Gemini. As more users turn to AI for answers, appearing in AI responses becomes critical for brand awareness and traffic."
  },
  {
    question: "How often is brand visibility data updated?",
    answer: "Professional and Enterprise plans include daily monitoring. We scan all major AI platforms every 24 hours and provide real-time alerts when your brand is mentioned. Starter plans include weekly monitoring."
  },
  {
    question: "Can I monitor multiple brands?",
    answer: "Yes! Starter plans include 1 brand, Professional plans include 5 brands, and Enterprise plans offer unlimited brand monitoring. Each brand can have its own keywords, competitors, and alert settings."
  },
  {
    question: "Does Apex work with my language?",
    answer: "Absolutely. Apex supports content analysis and monitoring in multiple languages including English, Afrikaans, Zulu, Xhosa, Swahili, French, Portuguese, and Arabic. We're continuously adding more language support."
  },
  {
    question: "How do Smart Recommendations work?",
    answer: "Our AI analyzes your website, content, and AI visibility data to generate prioritized recommendations. Each recommendation includes an impact score (how much it will improve visibility), confidence level, and estimated effort. We prioritize high-impact, low-effort tasks first."
  },
  {
    question: "What integrations are available?",
    answer: "Apex integrates with Jira, Trello, Asana, Linear, Slack, Microsoft Teams, WhatsApp Business, Google Analytics, and Google Search Console. Enterprise plans can request custom integrations."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required. You get full access to all features in your chosen plan tier during the trial period."
  },
  {
    question: "How is pricing adjusted for different regions?",
    answer: "We use Purchasing Power Parity (PPP) to offer fair pricing globally. South African Rand, Nigerian Naira, and Kenyan Shilling prices are adjusted to reflect local purchasing power, making world-class AI visibility tools accessible to African businesses."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Apex and AI visibility optimization.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="card-secondary overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-2">Still have questions?</p>
          <a
            href="mailto:support@apex.example.com"
            className="text-primary hover:underline font-medium"
          >
            Contact our support team
          </a>
        </div>
      </div>

      {/* FAQ Schema (for SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />
    </section>
  );
}
