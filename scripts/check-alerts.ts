/**
 * Check competitive alerts
 */
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function check() {
  const alerts = await db.execute(sql`
    SELECT id, brand_id, alert_type, title, severity, is_read, is_dismissed, triggered_at
    FROM competitive_alerts
    ORDER BY triggered_at DESC
    LIMIT 10
  `);

  console.log('All alerts in database:', alerts.rows.length);
  for (const a of alerts.rows) {
    console.log('');
    console.log('  ID:', a.id);
    console.log('  Brand ID:', a.brand_id);
    console.log('  Type:', a.alert_type);
    console.log('  Title:', a.title);
    console.log('  Severity:', a.severity);
    console.log('  Is Read:', a.is_read);
    console.log('  Is Dismissed:', a.is_dismissed);
    console.log('  Triggered At:', a.triggered_at);
  }
}

check().catch(console.error);
