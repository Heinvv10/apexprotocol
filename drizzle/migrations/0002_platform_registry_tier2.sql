-- Phase 10: Expanded AI Platform Coverage (Tier 2)
-- Regional/Emerging Platforms Migration

-- Extend ai_platform enum to include new Tier 2 platforms
ALTER TYPE ai_platform ADD VALUE 'mistral' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'llama' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'yandexgpt' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'kimi' BEFORE 'copilot';
ALTER TYPE ai_platform ADD VALUE 'qwen' BEFORE 'copilot';

-- Migration note: This extends the existing platform_registry table structure
-- No new columns or tables required - Tier 2 uses the same schema as Tier 1
-- The difference is:
-- 1. New platforms will have tier = 'tier_2' instead of 'tier_1'
-- 2. Feature gating restricts Tier 2 to 'enterprise' plan only
-- 3. The platform integration and query result tables remain unchanged
