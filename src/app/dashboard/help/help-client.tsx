"use client";

import { Book, Lightbulb, MessageCircle, Rocket, Search, Settings, Video, FileText, HelpCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const helpCategories = [
  {
    title: "Getting Started",
    icon: Rocket,
    color: "text-blue-400",
    articles: [
      {
        title: "Quick Start Guide",
        description: "Get up and running with Apex in minutes",
        link: "#quick-start"
      },
      {
        title: "Create Your First Brand",
        description: "Learn how to add and configure a brand",
        link: "#create-brand"
      },
      {
        title: "Understanding Your Dashboard",
        description: "Navigate the dashboard and key metrics",
        link: "#dashboard"
      }
    ]
  },
  {
    title: "Monitoring & Analytics",
    icon: Search,
    color: "text-cyan-400",
    articles: [
      {
        title: "Brand Mention Tracking",
        description: "Monitor your brand across AI platforms",
        link: "#monitoring"
      },
      {
        title: "Competitive Analysis",
        description: "Track competitors and share of voice",
        link: "#competitive"
      },
      {
        title: "Performance Metrics",
        description: "Understand GEO, SEO, and AEO scores",
        link: "#metrics"
      }
    ]
  },
  {
    title: "Content Creation",
    icon: FileText,
    color: "text-purple-400",
    articles: [
      {
        title: "Generate Content Briefs",
        description: "AI-powered content brief generation",
        link: "#briefs"
      },
      {
        title: "AI Content Generation",
        description: "Create blog posts, FAQs, and press releases",
        link: "#generate"
      },
      {
        title: "Optimize for AI Citations",
        description: "Make your content citation-ready",
        link: "#citations"
      }
    ]
  },
  {
    title: "Site Auditing",
    icon: Settings,
    color: "text-orange-400",
    articles: [
      {
        title: "Run a Site Audit",
        description: "Comprehensive technical analysis",
        link: "#audit"
      },
      {
        title: "Fix Critical Issues",
        description: "Address high-priority audit findings",
        link: "#fix-issues"
      },
      {
        title: "Schema Markup Guide",
        description: "Implement structured data correctly",
        link: "#schema"
      }
    ]
  },
  {
    title: "Integrations",
    icon: Settings,
    color: "text-green-400",
    articles: [
      {
        title: "Connect AI Platforms",
        description: "Integrate ChatGPT, Claude, Gemini, and more",
        link: "#integrations"
      },
      {
        title: "API Documentation",
        description: "Use the Apex API for custom workflows",
        link: "#api"
      },
      {
        title: "Webhooks & Automation",
        description: "Set up automated workflows",
        link: "#webhooks"
      }
    ]
  },
  {
    title: "Best Practices",
    icon: Lightbulb,
    color: "text-yellow-400",
    articles: [
      {
        title: "GEO Optimization Tips",
        description: "Maximize AI platform visibility",
        link: "#geo-tips"
      },
      {
        title: "Content Strategy",
        description: "Build an AI-first content plan",
        link: "#strategy"
      },
      {
        title: "Citation Optimization",
        description: "Increase AI citation rates",
        link: "#optimize-citations"
      }
    ]
  }
];

const faqs = [
  {
    question: "What is GEO (Generative Engine Optimization)?",
    answer: "GEO is the practice of optimizing your content to appear in AI-generated responses from platforms like ChatGPT, Claude, Gemini, and Perplexity. Unlike traditional SEO which targets search engine rankings, GEO focuses on making your content citation-worthy for AI models."
  },
  {
    question: "How does Apex track my brand mentions across AI platforms?",
    answer: "Apex continuously monitors 7+ AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot) by running relevant queries and analyzing responses for brand mentions. We track mention position, sentiment, and frequency to calculate your GEO Score."
  },
  {
    question: "What's the difference between GEO, SEO, and AEO?",
    answer: "SEO (Search Engine Optimization) targets traditional search engines like Google. AEO (Answer Engine Optimization) targets answer-focused platforms like featured snippets. GEO (Generative Engine Optimization) targets AI language models that generate complete responses. Apex tracks all three for comprehensive visibility."
  },
  {
    question: "How often does Apex update brand mention data?",
    answer: "Brand mentions are tracked in real-time as queries are processed. Your dashboard updates every 15 minutes with new mention data. Competitive analysis and GEO scores are recalculated daily."
  },
  {
    question: "Can I monitor my competitors?",
    answer: "Yes! Apex tracks up to 10 competitors per brand. You can see their mention frequency, share of voice, and compare your performance against theirs across all AI platforms."
  },
  {
    question: "What content types does Apex generate?",
    answer: "Apex can generate blog posts, FAQs, press releases, landing pages, how-to guides, listicles, comparisons, case studies, and product descriptions. All content is optimized for AI citation with structured data and semantic markup."
  },
  {
    question: "How does the site audit work?",
    answer: "The audit crawls your website to analyze technical SEO, content structure, schema markup, AI readiness, and citation potential. It identifies critical issues, provides prioritized recommendations, and scores your site across multiple dimensions."
  },
  {
    question: "What's included in my plan?",
    answer: "All plans include: unlimited brand monitoring, content generation, site audits, competitor tracking, and API access. Pro plans add advanced analytics, custom integrations, and priority support. See our pricing page for details."
  },
  {
    question: "Can I white-label Apex for my agency?",
    answer: "Yes! Apex offers white-label plans for agencies and resellers. You can customize branding, domain, pricing, and features. Contact our sales team for white-label options."
  },
  {
    question: "How do I get support?",
    answer: "You can reach our support team via the in-app chat (bottom right), email (support@apex.com), or by scheduling a call. Pro plan customers get priority support with 2-hour response times."
  }
];

export function HelpClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    articles: category.articles.filter(
      article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.articles.length > 0 || searchQuery === "");

  const filteredFAQs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Help Center</h1>
            <p className="text-sm text-gray-400">Find answers and learn how to use Apex</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Contact Support
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for help articles, guides, or FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 bg-card/50 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Quick Links */}
      {searchQuery === "" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="card-secondary p-6 text-left hover:border-cyan-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Video className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-400">Watch step-by-step guides</p>
          </button>

          <button className="card-secondary p-6 text-left hover:border-cyan-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Book className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Documentation</h3>
            <p className="text-sm text-gray-400">Browse the full docs</p>
          </button>

          <button className="card-secondary p-6 text-left hover:border-cyan-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <MessageCircle className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Live Chat</h3>
            <p className="text-sm text-gray-400">Chat with support team</p>
          </button>

          <button className="card-secondary p-6 text-left hover:border-cyan-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <ExternalLink className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">API Reference</h3>
            <p className="text-sm text-gray-400">Developer documentation</p>
          </button>
        </div>
      )}

      {/* Help Categories */}
      {(searchQuery === "" || filteredCategories.length > 0) && (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="card-secondary p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <h3 className="font-semibold text-white">{category.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <a
                        key={articleIndex}
                        href={article.link}
                        className="block group"
                      >
                        <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">{article.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQs */}
      {(searchQuery === "" || filteredFAQs.length > 0) && (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="card-secondary p-6">
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <Collapsible key={index} className="border border-white/10 rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left text-white hover:text-cyan-400 transition-colors">
                    <span className="font-medium">{faq.question}</span>
                    <span className="text-gray-400">+</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 text-gray-400">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery !== "" && filteredCategories.length === 0 && filteredFAQs.length === 0 && (
        <div className="card-secondary p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
          <p className="text-gray-400 mb-6">
            We couldn't find any help articles matching "{searchQuery}"
          </p>
          <Button onClick={() => setSearchQuery("")} variant="outline">
            Clear Search
          </Button>
        </div>
      )}

      {/* Still Need Help */}
      <div className="card-primary p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Still need help?</h2>
        <p className="text-gray-400 mb-6">
          Our support team is here to assist you with any questions
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Start Live Chat
          </Button>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Email Support
          </Button>
        </div>
      </div>
    </div>
  );
}
