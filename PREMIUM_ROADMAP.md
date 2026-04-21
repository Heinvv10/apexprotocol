# Apex Premium Features Roadmap

*Created: 2026-02-01*
*Last audited & updated: 2026-04-21 — audit-driven pass closed 10 open items*
*Status: Phases 2–5 substantially complete; deferred items flagged below*

## Vision
Make Apex the undisputed leader in GEO/AEO by delivering **insights + action**, not just dashboards.

---

## Phase 1: Foundation (Week 1-2)
*Priority: Get core premium infrastructure in place*

### 1.1 Real-Time Monitoring Engine
- [x] Replace batch processing with streaming architecture (SSE via `/api/realtime` + `/api/monitor/stream`)
- [x] Implement webhook-based notifications (`lib/webhooks/dispatcher.ts`, HMAC-SHA256)
- [ ] ~~Add WebSocket support for live dashboard updates~~ **Deferred** — SSE ships the pattern; WS adds infra cost without UX gain
- [ ] ~~Target: <5 min latency for new mentions~~ **Deferred** — requires observability stack decision

### 1.2 Expanded Platform Coverage ✅ DONE
- [x] 17 platforms now supported:
  - **Tier 1 Major (7):** ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, OpenAI Search
  - **Tier 1 Additional (5):** Microsoft Copilot, Bing Copilot, NotebookLM, Cohere, Janus
  - **Tier 2 Regional (5):** Mistral, Llama, YandexGPT, Kimi, Qwen
- [x] Platform registry with health monitoring
- [x] Graceful degradation when platforms unavailable

### 1.3 Historical Data Infrastructure
- [ ] ~~Time-series database for trend storage~~ **Deferred** — requires TimescaleDB/InfluxDB migration decision
- [x] Data retention policies (starter 90d / professional 180d / enterprise 720d) — `lib/retention/retention-policy.ts` + `/api/cron/retention-purge`
- [x] Historical comparison views (MoM, QoQ, YoY) — `lib/monitor/period-comparison.ts` + `/api/monitor/period-comparison`

---

## Phase 2: Intelligence Layer (Week 3-4)
*Priority: Transform data into actionable insights*

### 2.1 "Why" Analysis Engine ✅ DONE
- [x] Root cause analysis for ranking changes — `lib/ml/why-analysis.ts`
- [x] Factor attribution (content, freshness, authority, citations, competitor, sentiment) — ranked contributions with percentages
- [x] Natural language explanations — `buildNarrative()` in why-analysis.ts + existing `lib/ml/explainer.ts`
- [x] Exposed at `/api/monitor/why-analysis`

### 2.2 Predictive Visibility Forecasting ✅ DONE
- [x] ML model for visibility trend prediction — `lib/ml/forecaster.ts` (linear regression, 90d default, cached)
- [x] "What-if" scenario modeling — `lib/audit/what-if-simulator.ts`
- [x] Confidence intervals and accuracy tracking — R-squared + confidence bounds

### 2.3 Content Gap Detection ✅ DONE
- [x] Prompt gap detection — `/api/brands/[id]/prompt-gaps`
- [x] Brief generator for identified gaps — `lib/content/brief-generator.ts`

### 2.4 Competitive Threat Alerts ✅ DONE
- [x] Real-time alerts when competitor visibility spikes — `lib/competitive/alert-generator.ts` (5–20% SOV drop, 15% competitor surge)
- [x] Sentiment shift detection — `lib/notifications/crisis.ts` + sentiment trajectory
- [x] Share-of-voice change notifications — schema at `lib/db/schema/competitive.ts`

---

## Phase 3: Action Engine (Week 5-6)
*Priority: Help users take action, not just observe*

### 3.1 AI Content Brief Generator ✅ DONE
- [x] Auto-generate content briefs optimized for AI citation — `lib/content/brief-generator.ts`
- [x] Topics, keywords, structure, sources, schema recommendations
- [x] UI at `/dashboard/create/brief` via `components/create/content-brief-builder.tsx`

### 3.2 "Test Before Publish" Simulator ✅ DONE
- [x] Sandbox environment to test content
- [x] Simulate how each AI would respond to queries after content published
- [x] A/B test different content approaches
- [x] Prediction confidence scores

### 3.3 Smart Recommendations Engine
- [x] Priority scoring (impact × effort matrix) — `lib/recommendations/priority-scoring.ts`
- [x] Personalized based on brand's specific gaps — `lib/recommendations/engine.ts`
- [x] Track recommendation completion and impact — `lib/recommendations/smart-engine.ts` now wires to `recommendation_lift` (no longer a no-op stub)
- [ ] ~~Learn from outcomes to improve suggestions~~ **Deferred** — needs a labelled outcome dataset first (captured via the lift pipeline)

### 3.4 Prompt Tracking & Analysis ✅ DONE
- [x] Log exact prompts that trigger brand mentions — `/api/monitor/prompts`
- [x] Identify high-value prompt patterns — `lib/prompt-radar/radar.ts` (GSC + DataForSEO volume bands)
- [x] Suggest content targeting specific prompt types — `/api/v1/brands/[id]/revenue-per-prompt`

---

## Phase 4: Agency & Enterprise (Week 7-8)
*Priority: Enable white-label and scale*

### 4.1 Full White-Label System ✅ DONE
- [x] Custom domains (client.agencyname.com) — `organizations.branding.customDomain` field
- [x] Full branding customization (logo, colors, fonts) — `BrandingSettings` JSONB
- [x] White-labeled emails and notifications — `lib/notifications/white-label-templates.ts` (`renderCrisisEmail`, `renderDigestEmail`)
- [x] Custom report templates — `renderReportCover` feeds PDF + PPTX exports

### 4.2 Client-Facing Dashboards ✅ DONE
- [x] Simplified views for end clients — `/dashboard/client` page + `/api/client/summary`
- [x] Role-based access control (Admin, Editor, Viewer) — `roleEnum` in `users` schema
- [x] Client-specific branding per organization — reuses `BrandingSettings`

### 4.3 API Access ✅ DONE
- [x] RESTful API with full coverage (15+ route prefixes, Swagger UI docs at /api/docs)
- [x] GraphQL endpoint for flexible queries (/api/graphql)
- [x] API key management with rate limits by plan (generate, revoke, rotate via Settings > Developer)
- [x] Webhooks for integrations (Clerk, PayFast, Listmonk, Mautic, Postiz)
- [ ] SDKs (JavaScript, Python) — planned for future

### 4.4 Advanced Reporting ✅ DONE
- [x] Scheduled report delivery (daily, weekly, monthly) — `lib/queue/scheduler.ts`
- [x] Custom report builder — `/api/reports` with `reportType: "custom"`
- [x] Export formats: PDF, CSV, Excel, PowerPoint — PPTX added via `lib/export/pptx.ts` (jszip-based OpenXML)
- [x] Automated insights narrative in reports — `lib/export/narrative.ts` (deterministic, template-based)

---

## Phase 5: Differentiators (Week 9-10)
*Priority: Features competitors don't have*

### 5.1 Source Attribution Tracking ✅ DONE
- [x] Identify which sources AI models cite — existing `/api/monitor/citations`
- [x] Track source authority and freshness — `lib/monitor/source-attribution.ts` (TLD tier + known-authority list + citation freq; 60d half-life freshness decay)
- [x] Recommend sources to update/create — `buildRecommendations` surfaces strengthen-stale / diversify-low / double-down actions via `/api/monitor/sources`

### 5.2 Sentiment Trajectory Analysis ✅ DONE
- [x] Track sentiment changes over time — `lib/monitor/sentiment-trajectory.ts` (day/week buckets)
- [x] Identify sentiment triggers — shift detection (|delta| ≥ 0.2 with ≥3 mentions, sample queries/responses surfaced)
- [x] Predict sentiment trends — feeds the existing ML forecaster for near-term prediction
- [x] Exposed at `/api/monitor/sentiment/trajectory`

### 5.3 Crisis Detection & Response ✅ DONE
- [x] Real-time negative spike alerts — `lib/notifications/crisis.ts` (5 crisis types, 3 severities)
- [x] Suggested response actions — generated per crisis type in `generateSuggestedActions`
- [x] Crisis playbook templates — per-type action templates built in
- [x] War room dashboard mode — `/dashboard/monitor/war-room` with active list, severity-coded detail, timeline, acknowledge/resolve/false-positive controls

### 5.4 Multi-Language Support ✅ DONE
- [x] Monitor AI responses in multiple languages — `lib/i18n/translations.ts` (6 langs: en, zu, xh, af, sw, yo)
- [x] Localized recommendations — `LOCALIZED_RECOMMENDATION_TEMPLATES` in `lib/i18n/platform-regions.ts`
- [x] Regional platform focus — `PLATFORM_REGION_MAP` with weighted recommendations via `/api/i18n/platform-mix` (e.g., YandexGPT for RU, Kimi/Qwen for ZH)

---

## Technical Architecture Needed

### Infrastructure
- [ ] Redis/Upstash for real-time caching (already have)
- [ ] Time-series DB (TimescaleDB or InfluxDB)
- [ ] Queue system for async processing (BullMQ)
- [ ] WebSocket server for live updates

### AI/ML
- [ ] Fine-tuned model for insight generation
- [ ] Prediction model for visibility forecasting
- [ ] NLP pipeline for content analysis

### Integrations
- [ ] Each AI platform API wrapper
- [ ] Email service for alerts (Resend/SendGrid)
- [ ] Slack/Teams/Discord for notifications

---

## Implementation Priority Order

### Immediate (This Week)
1. ✅ Payment integration (PayFast) - DONE
2. ✅ Logo auto-fetch - DONE
3. ✅ PDF reports with branding - DONE
4. ✅ Real-time alert system - DONE
5. ✅ Expand to 17 platforms - DONE

### Next Sprint
6. ✅ "Why" analysis for visibility changes - DONE
7. ✅ Content gap detection - DONE
8. ✅ Smart recommendations with scoring - DONE

### Following Sprint
9. [x] Test before publish simulator ✅ DONE
10. [x] API access ✅ DONE
11. [x] White-label domains ✅ DONE (2026-04-21)

### Shipped 2026-04-21 (audit-driven pass)
12. [x] Why Analysis Engine (Phase 2.1)
13. [x] Recommendation completion tracking (Phase 3.3)
14. [x] White-labeled emails + report templates (Phase 4.1)
15. [x] Client-facing dashboard (Phase 4.2)
16. [x] PowerPoint export + insights narrative (Phase 4.4)
17. [x] Source authority + freshness (Phase 5.1)
18. [x] Sentiment trajectory + triggers (Phase 5.2)
19. [x] War Room dashboard UI (Phase 5.3)
20. [x] Regional platform routing (Phase 5.4)
21. [x] MoM/QoQ/YoY + retention automation (Phase 1.3)

### Deferred (architecture decisions, not scope)
- TimescaleDB/InfluxDB adoption (Phase 1.3)
- Native WebSocket live updates (Phase 1.1 — SSE ships the pattern)
- Latency SLA monitoring (Phase 1.1)
- ML outcome-learning loop for recommendations (Phase 3.3 — needs labelled dataset first)

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Real-time monitoring | Latency | <5 min |
| Platform coverage | Count | 12+ platforms |
| Predictions | Accuracy | >75% |
| Recommendations | Completion rate | >40% |
| Recommendations | Impact correlation | >0.6 |
| API | Uptime | 99.9% |
| Reports | Generation time | <10s |

---

## Notes
- Each phase builds on previous
- Can parallelize some work
- Focus on value delivery, not feature count
- Get feedback after each phase
