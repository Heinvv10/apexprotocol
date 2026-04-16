#!/bin/bash

# Test ApexGEO browser automation endpoints
echo "=== Testing ApexGEO Browser Automation Endpoints ==="
echo ""

# Test Perplexity Browser
echo "1. Testing Perplexity Browser Query..."
curl -s -X POST http://localhost:3010/api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{"brandId":"test-brand","query":"test query","platformName":"perplexity_browser"}' | jq . 2>/dev/null || echo "Request failed"
echo ""

# Test Claude Browser
echo "2. Testing Claude Browser Query..."
curl -s -X POST http://localhost:3010/api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{"brandId":"test-brand","query":"test query","platformName":"claude_browser"}' | jq . 2>/dev/null || echo "Request failed"
echo ""

# Test ChatGPT Browser
echo "3. Testing ChatGPT Browser Query..."
curl -s -X POST http://localhost:3010/api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{"brandId":"test-brand","query":"test query","platformName":"chatgpt_browser"}' | jq . 2>/dev/null || echo "Request failed"
echo ""

# Test Gemini Browser
echo "4. Testing Gemini Browser Query..."
curl -s -X POST http://localhost:3010/api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{"brandId":"test-brand","query":"test query","platformName":"gemini_browser"}' | jq . 2>/dev/null || echo "Request failed"
echo ""

# Test O1 Browser
echo "5. Testing O1 Browser Query..."
curl -s -X POST http://localhost:3010/api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{"brandId":"test-brand","query":"test query","platformName":"o1_browser"}' | jq . 2>/dev/null || echo "Request failed"
echo ""

echo "=== All browser endpoints tested ==="
