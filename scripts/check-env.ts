import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local explicitly (Next.js style)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('[ENV] Loading .env.local from:', envLocalPath);
  dotenv.config({ path: envLocalPath });
} else {
  console.log('[ENV] .env.local not found');
}

// Check DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  // Mask the URL for security
  const masked = dbUrl.substring(0, 30) + '***' + dbUrl.substring(dbUrl.length - 10);
  console.log('[ENV] DATABASE_URL is set:', masked);
  console.log('[ENV] DATABASE_URL length:', dbUrl.length);
} else {
  console.log('[ENV] DATABASE_URL is NOT set');
}

// List all env vars starting with DATABASE
console.log('\n[ENV] Database-related environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('DATABASE') || key.includes('POSTGRES'))
  .forEach(key => {
    const value = process.env[key] || '';
    const masked = value.length > 30 ? value.substring(0, 15) + '***' + value.substring(value.length - 5) : '***';
    console.log(`  ${key}: ${masked}`);
  });

console.log('\n[ENV] Script complete');
process.exit(0);
