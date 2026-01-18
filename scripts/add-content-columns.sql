-- Add missing columns to content table
-- Run this if db:push interactive mode fails

-- Add SEO fields
ALTER TABLE content ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS indexing_errors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE content ADD COLUMN IF NOT EXISTS visits INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITH TIME ZONE;

-- Add SEO/AI optimization fields
ALTER TABLE content ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE content ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE content ADD COLUMN IF NOT EXISTS readability_score INTEGER;
ALTER TABLE content ADD COLUMN IF NOT EXISTS seo_score INTEGER;

-- Add target platform
ALTER TABLE content ADD COLUMN IF NOT EXISTS target_platform TEXT;

-- Add versioning
ALTER TABLE content ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS parent_id TEXT;

-- Add AI generation metadata
ALTER TABLE content ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

-- Add timestamps
ALTER TABLE content ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content'
ORDER BY ordinal_position;
