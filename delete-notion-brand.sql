-- Delete all Notion-related data
DELETE FROM "platformMentions" WHERE "brandId" IN (SELECT id FROM brands WHERE name = 'Notion');
DELETE FROM "competitorTracking" WHERE "brandId" IN (SELECT id FROM brands WHERE name = 'Notion');
DELETE FROM "contentRecommendations" WHERE "brandId" IN (SELECT id FROM brands WHERE name = 'Notion');
DELETE FROM "auditResults" WHERE "brandId" IN (SELECT id FROM brands WHERE name = 'Notion');
DELETE FROM brands WHERE name = 'Notion';
