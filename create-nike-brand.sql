-- Create Nike brand with comprehensive test data
-- This brand will be used for E2E testing with realistic data

-- 1. Create Nike brand
INSERT INTO brands (id, name, "organizationId", "createdAt", "updatedAt")
VALUES (
  'nike-test-brand-001',
  'Nike',
  'org_2odG7bWlHQkTvCOGbWQa74PiPLr',
  NOW(),
  NOW()
);

-- 2. Create platform mentions across 7 AI platforms
INSERT INTO "platformMentions" (id, "brandId", platform, "mentionCount", sentiment, "lastCrawled", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'nike-test-brand-001', 'ChatGPT', 142, 'positive', NOW() - INTERVAL '2 hours', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Claude', 98, 'positive', NOW() - INTERVAL '3 hours', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Gemini', 156, 'positive', NOW() - INTERVAL '1 hour', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Perplexity', 87, 'neutral', NOW() - INTERVAL '4 hours', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Grok', 45, 'positive', NOW() - INTERVAL '5 hours', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'DeepSeek', 34, 'neutral', NOW() - INTERVAL '6 hours', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Janus', 28, 'positive', NOW() - INTERVAL '7 hours', NOW(), NOW());

-- 3. Create competitor tracking data
INSERT INTO "competitorTracking" (id, "brandId", "competitorName", "shareOfVoice", visibility, "lastUpdated", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'nike-test-brand-001', 'Adidas', 28.5, 'high', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Under Armour', 18.2, 'medium', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Puma', 15.8, 'medium', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'New Balance', 12.3, 'low', NOW(), NOW(), NOW());

-- 4. Create content recommendations
INSERT INTO "contentRecommendations" (id, "brandId", title, description, priority, status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'nike-test-brand-001', 'Create FAQ about Nike Air technology', 'AI platforms frequently ask about Air cushioning technology. Create comprehensive FAQ.', 'high', 'pending', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Update sustainability initiatives content', 'Expand content on Move to Zero and sustainable materials to increase visibility.', 'high', 'pending', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Add structured data for product catalog', 'Implement schema.org Product markup for better AI platform understanding.', 'medium', 'pending', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Create athlete partnership stories', 'Document partnerships with athletes like LeBron James, Serena Williams for brand queries.', 'medium', 'in_progress', NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'Optimize innovation timeline content', 'Create timeline of Nike innovations (Waffle sole, Air, Flyknit, etc.) for historical queries.', 'low', 'completed', NOW(), NOW());

-- 5. Create audit results
INSERT INTO "auditResults" (id, "brandId", "auditType", score, issues, recommendations, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'nike-test-brand-001', 'technical', 87,
   '{"page_speed": "Some product pages load slowly", "mobile_usability": "Minor issues on checkout flow", "structured_data": "Missing schema on blog posts"}',
   '{"page_speed": "Optimize images, enable lazy loading", "mobile_usability": "Fix tap target sizes", "structured_data": "Add Article schema to blog"}',
   NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'content', 92,
   '{"freshness": "Some sustainability pages outdated", "depth": "Product descriptions could be more detailed"}',
   '{"freshness": "Update quarterly sustainability reports", "depth": "Expand technical specifications on products"}',
   NOW(), NOW()),
  (gen_random_uuid(), 'nike-test-brand-001', 'visibility', 85,
   '{"ai_platforms": "Lower visibility on DeepSeek and Janus", "citations": "Limited citations from recent content"}',
   '{"ai_platforms": "Create content targeting Asian markets", "citations": "Publish more research-backed content"}',
   NOW(), NOW());
