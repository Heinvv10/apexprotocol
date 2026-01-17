import { db } from './src/lib/db/index.ts';
import { brandLocations } from './src/lib/db/schema/locations.ts';
import { eq } from 'drizzle-orm';

async function check() {
  const results = await db.execute(`
    SELECT b.id, b.name, b.domain, COUNT(bl.id) as location_count
    FROM brands b
    LEFT JOIN brand_locations bl ON b.id = bl."brandId"
    WHERE b.domain IN ('takealot.com', 'velocityfibre.co.za')
    GROUP BY b.id, b.name, b.domain
  `);
  
  console.log(results);
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
