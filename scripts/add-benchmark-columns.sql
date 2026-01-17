-- Add benchmark brand columns to brands table

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS is_benchmark BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS benchmark_tier TEXT,
  ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster benchmark brand queries
CREATE INDEX IF NOT EXISTS idx_brands_is_benchmark ON brands(is_benchmark) WHERE is_benchmark = true;
CREATE INDEX IF NOT EXISTS idx_brands_benchmark_tier ON brands(benchmark_tier) WHERE benchmark_tier IS NOT NULL;
