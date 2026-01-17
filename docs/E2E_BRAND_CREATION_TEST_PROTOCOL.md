# E2E Brand Creation Test Protocol

**Purpose**: Document the exact steps for creating test brands to ensure reproducible E2E testing and benchmarking.

**Date Created**: 2026-01-16
**Last Updated**: 2026-01-16
**Status**: In Progress

---

## Test Brand Selection Criteria

For effective E2E testing, test brands should have:
1. **High Social Media Visibility** - Active presence across multiple platforms
2. **Well-Known Brand** - Globally recognized for realistic AI platform mentions
3. **Rich Content** - Comprehensive website with product catalogs, FAQs, etc.
4. **Competitive Landscape** - Multiple competitors in the same space
5. **Industry Diversity** - Test different industries across multiple brands

---

## Test Brand #1: Nike

### Brand Details
- **Name**: Nike
- **Website**: https://www.nike.com
- **Industry**: Fashion/Athletic Apparel
- **Why Nike**:
  - Global brand with massive social media presence
  - Well-documented across AI platforms
  - Strong competitor landscape (Adidas, Under Armour, Puma, etc.)
  - Rich product catalog and content

### Creation Steps (Browser UI)

1. **Navigate to Brands Page**
   - URL: `http://localhost:3000/dashboard/brands`
   - Verify page loads successfully

2. **Initiate Brand Creation**
   - Click "+ Add Brand" button
   - Modal appears: "Add New Brand"
   - Two options shown:
     - "Auto-fill from Website" (Recommended)
     - "Add Manually"

3. **Select Auto-fill Method**
   - Click "Auto-fill from Website" option
   - Modal transitions to "Enter Website URL"

4. **Enter Website URL**
   - Input field: "WEBSITE URL"
   - Enter: `https://www.nike.com`
   - Click "Analyze Website" button

5. **Wait for AI Analysis**
   - System analyzes website (approximately 3-5 seconds)
   - Progress indicator shown
   - Analysis completes with confidence score

6. **Review Extracted Data**
   - **Analysis Complete** modal shows:
     - Confidence: 90%
     - Brand Name: Nike
     - Tagline: "Just Do It"
     - Industry: Fashion
     - Description: "Nike is a global leader in the design, marketing, and distribution of athletic footwear, apparel, equipment, and accessories..."
     - Target Audience: "Nike serves athletes and active individuals of all ages..."
     - Value Propositions:
       - Innovative and high-performance athletic products
       - Iconic design and style in sportswear
       - Broad range of products for various sports and lifestyles
     - Keywords (15): athletic footwear, sports apparel, Nike shoes, sports equipment, innovative design, Nike clothing, athletic accessories, running shoes, etc.
     - SEO Keywords: Nike shoes, sports apparel, athletic footwear, Nike clothing, sports equipment
     - GEO Keywords (AI Optimization): What are the latest Nike shoes?, Where can I buy Nike apparel?, Innovative Nike sports gear, Best Nike running shoes
     - Competitors (5): Adidas, Under Armour, Puma, Reebok, New Balance

7. **Accept Extracted Data**
   - Review all extracted information
   - Click "Use This Data" button
   - Form pre-populated with all extracted data

8. **Review Pre-filled Form**
   - **BASIC INFORMATION**:
     - Brand Name: Nike
     - Website Domain: nike.com
     - Description: [Full description populated]
     - Industry: Fashion
     - Brand Color: #111111
     - Brand Logo: Nike swoosh logo (auto-fetched)

   - **SEO/GEO SETTINGS**:
     - Target Keywords: All 15 keywords populated as tags
     - Competitors to Track: All 5 competitors populated

   - **BRAND VOICE (FOR AI CONTENT)**:
     - Voice Tone: Professional
     - Target Audience: [Full description populated]

   - **AI PLATFORM MONITORING**:
     - Enable Monitoring: Toggle ON
     - Platforms selected: ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot

9. **Submit Brand Creation**
   - Scroll to bottom of form
   - Click "Create Brand" button
   - Wait for creation confirmation

10. **Add Physical Locations (Step 7)**
    - Extract location data from company website
    - Check "Contact Us" or "Locations" pages
    - For Nike: Visit https://www.nike.com/retail or contact page
    - Extract: Address, City, Country
    - **Implementation Note**: This should be automated by:
      - Scraping company website for contact/location data
      - Parsing address information from structured data (schema.org)
      - Extracting from footer, contact pages, or store locators
      - For large companies: Search online for headquarters address

11. **Complete Onboarding**
    - Review final step (Step 8)
    - Click "Complete" or "Finish" button

12. **Verify Brand Created**
    - Modal closes
    - Redirected to brands list
    - Nike brand card appears in list
    - Verify brand shows:
      - Nike logo
      - Industry badge
      - Monitoring status
      - Platform count
      - Location data populated

---

## Expected Data Created

When Nike brand is created, the following data should be generated:

### Database Records
1. **brands** table:
   - Brand record with Nike details
   - Organization association
   - Monitoring enabled
   - All platforms configured

2. **brand_mentions** table (expected):
   - Initial mentions may be empty
   - Background jobs may populate over time
   - OR pre-populated with test data

3. **competitor_mentions** table (expected):
   - Competitor tracking records for each competitor
   - Initial data may be empty or pre-populated

4. **recommendations** table (expected):
   - Auto-generated recommendations based on brand analysis
   - Content optimization suggestions
   - Schema markup recommendations

5. **audits** table (expected):
   - Initial audit may be triggered automatically
   - OR manual audit can be run after creation

---

## Verification Checklist

After brand creation, verify:

- [ ] Brand appears in brands list at `/dashboard/brands`
- [ ] Brand card shows correct name, industry, logo
- [ ] Clicking brand card navigates to brand detail page
- [ ] Monitor page shows Nike data at `/dashboard/monitor?brand=<nike-id>`
- [ ] Competitive page shows Nike competitors at `/dashboard/competitive?brand=<nike-id>`
- [ ] Insights page loads for Nike
- [ ] Create page allows content creation for Nike
- [ ] Audit page shows Nike audits (or allows new audit)
- [ ] No console errors during entire flow
- [ ] All API calls return 200 status codes
- [ ] Data persists after page refresh

---

## Future Test Brands (To Be Added)

### Test Brand #2: [TBD]
- Industry: Technology
- Example: Spotify, Airbnb, or similar

### Test Brand #3: [TBD]
- Industry: Automotive/Energy
- Example: Tesla or similar

### Test Brand #4: [TBD]
- Industry: Food & Beverage
- Example: Starbucks or similar

---

## Benchmarking Metrics

Track these metrics for each brand creation:

1. **Performance**:
   - Time to analyze website: ___ seconds
   - Time to create brand: ___ seconds
   - Total time: ___ seconds

2. **Data Quality**:
   - AI confidence score: ___%
   - Number of keywords extracted: ___
   - Number of competitors identified: ___
   - Logo fetch success: Yes/No

3. **System Health**:
   - Console errors: Count
   - API failures: Count
   - Database writes successful: Yes/No

4. **User Experience**:
   - Steps required: ___
   - Clicks required: ___
   - Manual edits needed: Yes/No

---

## Test Execution Log

### Run #1: 2026-01-16

**Brand**: Nike
**Tester**: AI Agent
**Environment**: localhost:3000
**Node Version**: v20.11.0
**Status**: In Progress

#### Steps Completed:
1. ✅ Navigated to brands page
2. ✅ Clicked "+ Add Brand"
3. ✅ Selected "Auto-fill from Website"
4. ✅ Entered https://www.nike.com
5. ✅ Clicked "Analyze Website"
6. ✅ AI analysis completed (90% confidence)
7. ✅ Reviewed extracted data
8. ✅ Clicked "Use This Data"
9. ✅ Reviewed pre-filled form
10. ✅ Clicked "Create Brand"
11. ✅ Completed 8-step onboarding wizard:
    - Step 1: Social Media Profiles (Skipped)
    - Step 2: SEO/GEO Keywords (15 keywords pre-populated)
    - Step 3: Competitors (5 competitors pre-populated)
    - Step 4: Target Audience (Pre-filled)
    - Step 5: Value Propositions (5 propositions pre-populated)
    - Step 6: Team Members (Skipped)
    - Step 7: Locations (Added: One Bowerman Drive, Beaverton, OR 97005, United States)
    - Step 8: Brand Voice (Professional tone pre-selected)
12. ✅ Clicked "Finish"
13. ✅ Brand created successfully - redirected to brands list
14. ✅ Verified Nike brand appears with all data

#### Observations:
- Website analysis took approximately 3 seconds
- All data extracted correctly with 90% confidence
- Logo fetched successfully (Nike swoosh)
- 15 keywords identified
- 5 competitors identified (Adidas, Under Armour, Puma, Reebok, New Balance)
- Headquarters location added from web search
- GEO Score displayed: 90%
- All 7 AI platforms enabled for monitoring
- No console errors observed during entire flow
- Smooth onboarding experience with 8 steps
- Total time: approximately 2-3 minutes

#### Issues:
- None - flow completed successfully

---

## Notes

- This protocol should be run before every major release
- Test brands should be deleted and recreated fresh for each test run
- Compare results across test runs to identify regressions
- Update this document when new test scenarios are added
