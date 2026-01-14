# AEO/GEO Analysis Report
## VEA Group - AI Visibility Assessment

**Report Date:** January 13, 2026
**Analysis Query:** "What are the best AI safety companies and how does Anthropic compare to its competitors?"
**Brand:** VEA Group
**Platforms Analyzed:** 6 (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek)
**Platforms Successful:** 3 (ChatGPT, Claude, Gemini)

---

## Executive Summary

This report analyzes VEA Group's visibility across major AI platforms to understand how the brand is being surfaced in AI-generated responses. The analysis reveals significant variance in brand visibility across platforms, with **Gemini showing excellent visibility (93/100)** while **Claude shows no visibility (0/100)**.

### Key Findings

| Metric | Value |
|--------|-------|
| Average Visibility Score | **45/100** |
| Total Citations | **15** |
| Total Mentions | **14** |
| Best Performing Platform | **Gemini** (93/100) |
| Worst Performing Platform | **Claude** (0/100) |

---

## Platform-by-Platform Analysis

### 1. Google Gemini - Excellent Performance (93/100)

| Component | Score | Max |
|-----------|-------|-----|
| Mentions | 40 | 40 |
| Citation Quality | 23 | 30 |
| Prominence | 30 | 30 |

**Raw Metrics:**
- Total Mentions: **11**
- Total Citations: **14**
- First Mention Position: **112** (early in response)
- Average Relevance Score: **59%**

**Key Observation:** Gemini provided excellent coverage of VEA Group, mentioning the brand 11 times and citing it 14 times throughout its response. The brand appeared early in the response (position 112), indicating high prominence.

**Sample Citation:**
> "Okay, I can help you analyze the AI safety company landscape and how Anthropic fits in, while also checking how VEA Group is referenced in these discussions"

---

### 2. OpenAI ChatGPT - Fair Performance (42/100)

| Component | Score | Max |
|-----------|-------|-----|
| Mentions | 25 | 40 |
| Citation Quality | 5 | 30 |
| Prominence | 12 | 30 |

**Raw Metrics:**
- Total Mentions: **3**
- Total Citations: **1**
- First Mention Position: **1,610** (late in response)
- Average Relevance Score: **70%**

**Key Observation:** ChatGPT mentioned VEA Group but only 3 times, and it appeared late in the response. Citation quality was low with only 1 paraphrased citation.

**Sample Citation:**
> "As for the VEA Group, while the VEA Group has not been specifically mentioned in the context of AI safety companies or in direct comparison with Anthropic, it would be beneficial to have more information on the specific services, projects, or initiatives the VEA Group is involved in within the AI safety field to provide a more comprehensive analysis"

---

### 3. Anthropic Claude - Very Low Performance (0/100)

| Component | Score | Max |
|-----------|-------|-----|
| Mentions | 0 | 40 |
| Citation Quality | 0 | 30 |
| Prominence | 0 | 30 |

**Raw Metrics:**
- Total Mentions: **0**
- Total Citations: **0**
- First Mention Position: **N/A**

**Key Observation:** Claude did not mention VEA Group in its response. This represents a significant gap in AI visibility that should be addressed.

---

### 4. Perplexity - Analysis Failed

The Perplexity API connection failed during analysis. This platform should be re-tested.

---

### 5. Grok (X.AI) - Analysis Failed

The Grok API connection failed during analysis. This platform should be re-tested.

---

### 6. DeepSeek - Analysis Failed

The DeepSeek API connection failed during analysis. This platform should be re-tested.

---

## Recommendations

Based on the analysis, here are prioritized recommendations to improve VEA Group's AI visibility:

### Priority 1 - High Impact

1. **Increase Brand Mention Frequency**
   - Create comprehensive, brand-focused content that establishes expertise
   - Publish in-depth guides and tutorials demonstrating expertise
   - Develop case studies showcasing solutions and results
   - Build topic clusters around core offerings

2. **Improve Citation Quality and Frequency**
   - Add clear, quotable statements and key takeaways
   - Structure content with clear headings, bullet points, and summaries
   - Include data, statistics, and research findings
   - Create definitive resources that become go-to references

3. **Optimize for ChatGPT's Q&A Format**
   - Create comprehensive FAQ sections
   - Structure content with question headings and direct answers
   - Use conversational language matching user queries

### Priority 2 - Medium Impact

4. **Implement Structured Data Markup**
   - Add Article schema for blog posts and news
   - Add FAQPage schema for Q&A content
   - Include Organization schema with brand details

5. **Establish Content Authority**
   - Publish original research and industry reports
   - Create comprehensive long-form content (2000+ words)
   - Include expert quotes and third-party validation

### Priority 3 - Platform-Specific

6. **Claude-Specific: Provide In-Depth Analysis**
   - Write long-form analysis pieces (3000+ words)
   - Include multiple perspectives and balanced viewpoints
   - Provide historical context and evolution of concepts

7. **ChatGPT-Specific: Use Conversational Style**
   - Write in second person ('you')
   - Use simple, clear language
   - Include real-world examples and scenarios

---

## Technical Notes

### Bug Fix Applied

During this analysis session, a critical bug was identified and fixed in the insights store data mapping:

**Issue:** The UI was showing 0 values for all metrics despite the API returning correct data.

**Root Cause:** The insights store was looking for `analysisResult.summary` but the API returns `analysisResult.analysis.summary`.

**Fix Applied:** Updated `src/stores/insights-store.ts` to correctly map:
- `analysisResult.analysis.summary.averageVisibilityScore` → `summary.averageScore`
- `analysisResult.analysis.summary.totalCitations` → `summary.totalCitations`
- `analysisResult.analysis.summary.totalMentions` → `summary.totalMentions`
- `analysisResult.analysis.summary.platformsAnalyzed` → `summary.platformsAnalyzed`
- `analysisResult.analysis.platforms` → platform results array

### Platform API Status

| Platform | Status | Notes |
|----------|--------|-------|
| ChatGPT (OpenAI) | Working | GPT-4 responses |
| Claude (Anthropic) | Working | Claude 3 responses |
| Gemini (Google) | Working | Gemini Pro responses |
| Perplexity | Failed | API connection issue |
| Grok (X.AI) | Failed | API connection issue |
| DeepSeek | Failed | API connection issue |
| Copilot (Microsoft) | Skipped | No Azure credentials |

---

## Appendix: Raw API Response

```json
{
  "success": true,
  "data": {
    "queryId": "x0nhkca1bcck1soyawaecphn",
    "status": "partial",
    "analysis": {
      "summary": {
        "averageVisibilityScore": 45,
        "totalCitations": 15,
        "totalMentions": 14,
        "platformsAnalyzed": 3,
        "platformsRequested": 6,
        "bestPlatform": "gemini",
        "worstPlatform": "claude"
      }
    }
  }
}
```

---

**Report Generated by:** Apex AI Visibility Platform
**Analysis Engine Version:** 1.0.0
