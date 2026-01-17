-- Check brands that were newly enriched
SELECT 
  id,
  name,
  domain,
  CASE 
    WHEN locations IS NOT NULL THEN jsonb_array_length(locations)
    ELSE 0
  END as location_count,
  CASE 
    WHEN personnel IS NOT NULL THEN jsonb_array_length(personnel)
    ELSE 0
  END as personnel_count
FROM brands
WHERE domain IN (
  'greenleaforganics.com',
  'hubspot.com',
  'nike.com',
  'puma.com',
  'stripe.com',
  'takealot.com',
  'underarmour.com',
  'velocityfibre.co.za',
  'vercel.com'
)
ORDER BY name;
