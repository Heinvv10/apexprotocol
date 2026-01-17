-- Add locations and personnel columns to brands table

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS personnel JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brands_locations ON brands USING GIN (locations);
CREATE INDEX IF NOT EXISTS idx_brands_personnel ON brands USING GIN (personnel);

-- Add comment for documentation
COMMENT ON COLUMN brands.locations IS 'Business locations (headquarters, offices, regional)';
COMMENT ON COLUMN brands.personnel IS 'Key personnel (C-suite, directors, executives with LinkedIn profiles)';
