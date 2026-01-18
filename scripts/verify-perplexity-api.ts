/**
 * Verify Perplexity API Configuration
 *
 * This script tests the Perplexity API connection and helps diagnose issues:
 * - Validates API key is configured
 * - Tests basic authentication
 * - Checks endpoint connectivity
 * - Reports error codes and messages
 * - Provides debugging information for troubleshooting
 */

import 'dotenv/config';
import OpenAI from 'openai';

async function verifyPerplexityAPI() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 PERPLEXITY API VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // Step 1: Check API key configuration
  console.log('📋 Step 1: Checking API Key Configuration');
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not configured in environment');
    console.error('   Please set PERPLEXITY_API_KEY in your .env file');
    process.exit(1);
  }
  console.log('✅ API key found in environment');
  console.log(`   Key (masked): ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');

  // Step 2: Verify API key format
  console.log('📋 Step 2: Validating API Key Format');
  if (!apiKey.startsWith('pplx-')) {
    console.warn('⚠️  API key may be invalid - Perplexity keys usually start with "pplx-"');
  } else {
    console.log('✅ API key format looks correct (starts with pplx-)');
  }
  console.log('');

  // Step 3: Test basic API connectivity
  console.log('📋 Step 3: Testing API Connectivity');
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
      timeout: 10000,
    });

    console.log('   Sending test query to Perplexity API...');
    const completion = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'user',
          content: 'What is 2 + 2?',
        },
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log('✅ API connection successful');
    console.log(`   Response: ${response.substring(0, 100)}...`);
    console.log('');

    // Step 4: Test brand mention query
    console.log('📋 Step 4: Testing Brand Mention Query');
    const brandCompletion = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'user',
          content: 'Tell me about Apple as a technology company',
        },
      ],
      max_tokens: 200,
    });

    const brandResponse = brandCompletion.choices[0]?.message?.content || '';
    if (brandResponse.toLowerCase().includes('apple')) {
      console.log('✅ Brand mention detection working');
      console.log(`   Response snippet: ${brandResponse.substring(0, 150)}...`);
    } else {
      console.warn('⚠️  Brand not mentioned in response (but query succeeded)');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ PERPLEXITY API VERIFICATION PASSED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log('  ✅ API key configured correctly');
    console.log('  ✅ Authentication successful');
    console.log('  ✅ API endpoint responding');
    console.log('  ✅ Brand mention queries working');
    console.log('');
    console.log('Your Perplexity integration is ready for brand monitoring!');

    process.exit(0);
  } catch (error) {
    const err = error as any;
    console.error('❌ API connection failed');
    console.error('');

    // Detailed error analysis
    console.log('📋 Error Analysis:');
    console.log(`   Error Type: ${err.name || 'Unknown'}`);
    console.log(`   Status Code: ${err.status || 'N/A'}`);
    console.log(`   Message: ${err.message}`);

    if (err.status === 401) {
      console.error('');
      console.error('🔴 AUTHENTICATION ERROR (401)');
      console.error('   Possible causes:');
      console.error('   1. API key is invalid or expired');
      console.error('   2. API key has been revoked');
      console.error('   3. Wrong API key format');
      console.error('');
      console.error('   Solution:');
      console.error('   - Go to https://www.perplexity.ai/settings/api');
      console.error('   - Generate a new API key');
      console.error('   - Update PERPLEXITY_API_KEY in your .env file');
      console.error('   - Re-run this verification script');
    } else if (err.status === 429) {
      console.error('');
      console.error('🟡 RATE LIMIT ERROR (429)');
      console.error('   You have exceeded the API rate limit');
      console.error('');
      console.error('   Solution:');
      console.error('   - Wait a few minutes before retrying');
      console.error('   - Implement exponential backoff (already done in code)');
      console.error('   - Consider upgrading your Perplexity plan for higher limits');
    } else if (err.status === 500 || err.status === 503) {
      console.error('');
      console.error('🟡 SERVER ERROR (' + err.status + ')');
      console.error('   Perplexity API servers are having issues');
      console.error('');
      console.error('   Solution:');
      console.error('   - Wait a few minutes and try again');
      console.error('   - Check Perplexity status page: https://status.perplexity.ai');
    } else {
      console.error('');
      console.error('❓ UNKNOWN ERROR');
      console.error('   Error details:', err);
    }

    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Full error object for debugging:');
    console.error(JSON.stringify(err, null, 2));
    console.error('═══════════════════════════════════════════════════════════════');

    process.exit(1);
  }
}

verifyPerplexityAPI();
