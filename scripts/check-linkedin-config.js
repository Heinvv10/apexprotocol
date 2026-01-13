#!/usr/bin/env node

/**
 * Check LinkedIn OAuth Configuration
 * Verifies that all required environment variables are set
 */

console.log('\n🔍 Checking LinkedIn OAuth Configuration...\n');

const requiredVars = {
  'LINKEDIN_CLIENT_ID': process.env.LINKEDIN_CLIENT_ID,
  'LINKEDIN_CLIENT_SECRET': process.env.LINKEDIN_CLIENT_SECRET,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
};

let allSet = true;

for (const [key, value] of Object.entries(requiredVars)) {
  const isSet = !!value;
  const status = isSet ? '✅' : '❌';
  const displayValue = isSet
    ? (key.includes('SECRET') ? '***' + value.slice(-4) : value)
    : 'NOT SET';

  console.log(`${status} ${key}: ${displayValue}`);

  if (!isSet) {
    allSet = false;
  }
}

console.log('\n' + '='.repeat(60));

if (allSet) {
  console.log('✅ All LinkedIn OAuth credentials are configured!');
  console.log('\nExpected redirect URI:');
  console.log(`   ${process.env.NEXT_PUBLIC_APP_URL}/api/settings/oauth/linkedin/callback`);
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your dev server (Ctrl+C then npm run dev)');
  console.log('   2. Navigate to: http://localhost:3000/admin/integrations');
  console.log('   3. Click "Connect LinkedIn"');
  console.log('   4. Authorize the Apex app on LinkedIn');
} else {
  console.log('❌ Some LinkedIn OAuth credentials are missing!');
  console.log('\nPlease add them to .env.local:');
  console.log('   LINKEDIN_CLIENT_ID=77cw9yqsbb9dcy');
  console.log('   LINKEDIN_CLIENT_SECRET=REDACTED_LINKEDIN_SECRET');
  console.log('   NEXT_PUBLIC_APP_URL=http://localhost:3000');
}

console.log('='.repeat(60) + '\n');

process.exit(allSet ? 0 : 1);
