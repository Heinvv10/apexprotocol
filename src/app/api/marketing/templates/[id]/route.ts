/**
 * Marketing Template Detail API Route
 * GET  /api/marketing/templates/[id] - Get single template details
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Mock templates data
const mockTemplates = [
  {
    id: "tmpl_001",
    name: "Welcome Email",
    description: "Standard welcome email for new subscribers",
    type: "welcome",
    category: "onboarding",
    status: "active",
    subject: "Welcome to {{company_name}}! Let's get started",
    previewText: "Your journey begins here. Here's what you need to know...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #00E5CC, #8B5CF6); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Welcome to {{company_name}}!</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p>Hi {{first_name}},</p>
    <p>We're thrilled to have you on board! Here's what you can do next:</p>
    <ul>
      <li>Complete your profile</li>
      <li>Explore our features</li>
      <li>Connect with our community</li>
    </ul>
    <a href="{{cta_url}}" style="display: inline-block; background: #00E5CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a>
  </div>
</body>
</html>`,
    variables: ["company_name", "first_name", "cta_url"],
    usageCount: 12450,
    openRate: 52.3,
    clickRate: 18.5,
    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["welcome", "onboarding", "automated"],
    thumbnail: "/templates/welcome-thumb.png",
  },
  {
    id: "tmpl_002",
    name: "Newsletter - Monthly Update",
    description: "Monthly newsletter template with product updates",
    type: "newsletter",
    category: "engagement",
    status: "active",
    subject: "{{month}} Update: What's New at {{company_name}}",
    previewText: "Check out our latest features, tips, and company news...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: #141930; padding: 30px 20px; text-align: center;">
    <h1 style="color: #00E5CC; margin: 0;">{{month}} Newsletter</h1>
  </div>
  <div style="background: white; padding: 30px 20px;">
    <h2 style="color: #141930;">What's New</h2>
    <p>{{main_content}}</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <h3 style="color: #8B5CF6;">Featured Article</h3>
    <p>{{article_excerpt}}</p>
    <a href="{{article_url}}" style="color: #00E5CC;">Read More →</a>
  </div>
</body>
</html>`,
    variables: ["month", "company_name", "main_content", "article_excerpt", "article_url"],
    usageCount: 8920,
    openRate: 38.7,
    clickRate: 12.4,
    lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["newsletter", "monthly", "updates"],
    thumbnail: "/templates/newsletter-thumb.png",
  },
  {
    id: "tmpl_003",
    name: "Promotional - Sale Announcement",
    description: "Eye-catching promotional template for sales",
    type: "promotional",
    category: "sales",
    status: "active",
    subject: "🎉 {{discount}}% OFF - Limited Time Only!",
    previewText: "Don't miss out on our biggest sale of the year...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #8B5CF6, #00E5CC); padding: 50px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">{{discount}}% OFF</h1>
    <p style="color: white; font-size: 20px;">{{sale_name}}</p>
  </div>
  <div style="padding: 30px 20px; text-align: center;">
    <p style="font-size: 18px;">Use code: <strong style="color: #8B5CF6;">{{promo_code}}</strong></p>
    <p>Offer ends {{end_date}}</p>
    <a href="{{shop_url}}" style="display: inline-block; background: #8B5CF6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 18px;">Shop Now</a>
  </div>
</body>
</html>`,
    variables: ["discount", "sale_name", "promo_code", "end_date", "shop_url"],
    usageCount: 5680,
    openRate: 45.2,
    clickRate: 22.8,
    lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Emily Chen",
    tags: ["promotional", "sale", "discount"],
    thumbnail: "/templates/promo-thumb.png",
  },
  {
    id: "tmpl_004",
    name: "Webinar Invitation",
    description: "Professional webinar invitation template",
    type: "event",
    category: "events",
    status: "active",
    subject: "You're Invited: {{webinar_title}} - {{date}}",
    previewText: "Join us for an exclusive webinar on {{topic}}...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #141930; padding: 40px 20px; text-align: center;">
    <p style="color: #00E5CC; margin: 0 0 10px;">You're Invited</p>
    <h1 style="color: white; margin: 0;">{{webinar_title}}</h1>
  </div>
  <div style="padding: 30px 20px;">
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p><strong>📅 Date:</strong> {{date}}</p>
      <p><strong>⏰ Time:</strong> {{time}}</p>
      <p><strong>👤 Host:</strong> {{host_name}}</p>
    </div>
    <h3>What You'll Learn</h3>
    <p>{{description}}</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{register_url}}" style="display: inline-block; background: #00E5CC; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px;">Register Now</a>
    </div>
  </div>
</body>
</html>`,
    variables: ["webinar_title", "date", "time", "host_name", "description", "register_url", "topic"],
    usageCount: 3420,
    openRate: 42.8,
    clickRate: 28.5,
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["webinar", "event", "invitation"],
    thumbnail: "/templates/webinar-thumb.png",
  },
  {
    id: "tmpl_005",
    name: "Cart Abandonment",
    description: "Recover abandoned carts with this reminder email",
    type: "transactional",
    category: "recovery",
    status: "active",
    subject: "Did you forget something? Your cart is waiting!",
    previewText: "Complete your purchase and get {{discount}}% off...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 30px 20px; text-align: center;">
    <h1 style="color: #141930;">You Left Something Behind!</h1>
    <p>Hi {{first_name}}, we noticed you didn't complete your purchase.</p>
  </div>
  <div style="background: #f5f5f5; padding: 20px; margin: 20px;">
    <h3>Your Cart:</h3>
    {{cart_items}}
    <p style="text-align: right; font-size: 18px;"><strong>Total: {{cart_total}}</strong></p>
  </div>
  <div style="text-align: center; padding: 20px;">
    <p style="color: #8B5CF6; font-size: 18px;">Use code <strong>COMEBACK{{discount}}</strong> for {{discount}}% off!</p>
    <a href="{{cart_url}}" style="display: inline-block; background: #00E5CC; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px;">Complete Purchase</a>
  </div>
</body>
</html>`,
    variables: ["first_name", "cart_items", "cart_total", "discount", "cart_url"],
    usageCount: 6240,
    openRate: 35.6,
    clickRate: 15.2,
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["cart", "abandonment", "recovery"],
    thumbnail: "/templates/cart-thumb.png",
  },
  {
    id: "tmpl_006",
    name: "Customer Feedback Request",
    description: "Request feedback and reviews from customers",
    type: "feedback",
    category: "engagement",
    status: "active",
    subject: "{{first_name}}, we'd love your feedback!",
    previewText: "Help us improve by sharing your experience...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 30px 20px; text-align: center;">
    <h1 style="color: #141930;">How Are We Doing?</h1>
    <p>Hi {{first_name}}, your opinion matters to us!</p>
  </div>
  <div style="padding: 20px; text-align: center;">
    <p>Rate your experience:</p>
    <div style="font-size: 32px; margin: 20px 0;">
      <a href="{{feedback_url}}?rating=1">😞</a>
      <a href="{{feedback_url}}?rating=2">😐</a>
      <a href="{{feedback_url}}?rating=3">🙂</a>
      <a href="{{feedback_url}}?rating=4">😊</a>
      <a href="{{feedback_url}}?rating=5">🤩</a>
    </div>
    <a href="{{survey_url}}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Take Full Survey</a>
  </div>
</body>
</html>`,
    variables: ["first_name", "feedback_url", "survey_url"],
    usageCount: 4520,
    openRate: 32.4,
    clickRate: 18.9,
    lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Emily Chen",
    tags: ["feedback", "survey", "nps"],
    thumbnail: "/templates/feedback-thumb.png",
  },
  {
    id: "tmpl_007",
    name: "Re-engagement - We Miss You",
    description: "Win back inactive subscribers",
    type: "reengagement",
    category: "recovery",
    status: "active",
    subject: "We miss you, {{first_name}}! Here's what's new",
    previewText: "It's been a while! Come see what you've been missing...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #141930; padding: 40px 20px; text-align: center;">
    <h1 style="color: white;">We Miss You! 💙</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p>Hi {{first_name}},</p>
    <p>It's been {{days_inactive}} days since we last saw you. A lot has changed!</p>
    <h3 style="color: #8B5CF6;">Here's What's New:</h3>
    {{whats_new}}
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{comeback_url}}" style="display: inline-block; background: #00E5CC; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px;">Come Back & Explore</a>
    </div>
  </div>
</body>
</html>`,
    variables: ["first_name", "days_inactive", "whats_new", "comeback_url"],
    usageCount: 2890,
    openRate: 28.5,
    clickRate: 8.6,
    lastUsed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Sarah Johnson",
    tags: ["reengagement", "winback", "inactive"],
    thumbnail: "/templates/winback-thumb.png",
  },
  {
    id: "tmpl_008",
    name: "Product Update Announcement",
    description: "Announce new features and updates",
    type: "announcement",
    category: "product",
    status: "draft",
    subject: "🚀 New Feature: {{feature_name}} is Here!",
    previewText: "Discover the latest addition to {{company_name}}...",
    content: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #00E5CC, #8B5CF6); padding: 40px 20px; text-align: center;">
    <p style="color: white; margin: 0;">🚀 NEW FEATURE</p>
    <h1 style="color: white; margin: 10px 0;">{{feature_name}}</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p>Hi {{first_name}},</p>
    <p>We're excited to announce {{feature_name}}!</p>
    <h3>What's New:</h3>
    {{feature_description}}
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <img src="{{feature_image}}" alt="{{feature_name}}" style="width: 100%; border-radius: 4px;">
    </div>
    <div style="text-align: center;">
      <a href="{{learn_more_url}}" style="display: inline-block; background: #8B5CF6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px;">Learn More</a>
    </div>
  </div>
</body>
</html>`,
    variables: ["feature_name", "first_name", "feature_description", "feature_image", "learn_more_url", "company_name"],
    usageCount: 0,
    openRate: 0,
    clickRate: 0,
    lastUsed: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    owner: "Mike Wilson",
    tags: ["product", "announcement", "feature"],
    thumbnail: "/templates/product-thumb.png",
  },
];

/**
 * GET /api/marketing/templates/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const template = mockTemplates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: template,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

/**
 * PUT /api/marketing/templates/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const template = mockTemplates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const updatedTemplate = { ...template, ...body, updatedAt: new Date().toISOString() };

    return NextResponse.json({
      data: updatedTemplate,
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

/**
 * DELETE /api/marketing/templates/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    return NextResponse.json({
      data: { id, deleted: true },
      meta: { success: true, source: "mock" },
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
