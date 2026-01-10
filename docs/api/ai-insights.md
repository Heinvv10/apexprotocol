# AI Platform Insights API Documentation

## Overview

The AI Platform Insights API provides endpoints to analyze how different AI platforms (ChatGPT, Claude, Gemini, Perplexity) weight, surface, and cite brand content. This competitive intelligence enables marketing specialists and content strategists to optimize content specifically for each AI platform.

**Base URL**: `/api/ai-insights`

**Authentication**: All endpoints require Clerk authentication via session token.

**Content Type**: `application/json`

---

## Table of Contents

1. [Analyze Endpoint](#analyze-endpoint)
2. [History Endpoint](#history-endpoint)
3. [Platform-Specific Endpoint](#platform-specific-endpoint)
4. [Error Responses](#error-responses)
5. [Data Models](#data-models)

---

## Analyze Endpoint

Analyze brand visibility across AI platforms, generating visibility scores, citations, content type performance metrics, and platform-specific recommendations.

### Endpoint

```
POST /api/ai-insights/analyze
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `queryText` | string | Yes | The query to analyze (e.g., "What is Acme Corp?"). Max 1000 characters. |
| `brandContext` | string | No | Additional brand context for better analysis. Max 2000 characters. |
| `brandId` | string | Yes | The ID of the brand to analyze. |
| `brandName` | string | Yes | The brand name for mention detection. |
| `brandKeywords` | string[] | No | Additional keywords associated with the brand. |
| `platforms` | string[] | No | Array of platforms to analyze: `["chatgpt", "claude", "gemini", "perplexity"]`. Defaults to all platforms. |

### Request Example

```json
{
  "queryText": "What are the best project management tools for remote teams?",
  "brandContext": "Acme Corp is a cloud-based project management platform designed for distributed teams.",
  "brandId": "brand_abc123xyz",
  "brandName": "Acme Corp",
  "brandKeywords": ["Acme", "Acme PM", "Acme Project Manager"],
  "platforms": ["chatgpt", "claude", "gemini", "perplexity"]
}
```

### Response Format

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "queryId": "query_def456uvw",
    "status": "completed",
    "analysis": {
      "summary": {
        "averageVisibilityScore": 72,
        "totalCitations": 8,
        "totalMentions": 12,
        "platformsAnalyzed": 4,
        "platformsRequested": 4,
        "bestPlatform": "perplexity",
        "worstPlatform": "gemini"
      },
      "platforms": [
        {
          "platform": "chatgpt",
          "status": "completed",
          "error": null,
          "analysis": {
            "visibilityScore": {
              "total": 75,
              "breakdown": {
                "mentionCount": 32,
                "citationQuality": 24,
                "prominence": 19
              },
              "metrics": {
                "totalMentions": 4,
                "averageCitationRelevance": 80,
                "firstMentionPosition": 145
              }
            },
            "citations": [
              {
                "type": "direct_quote",
                "text": "Acme Corp offers robust features for remote team collaboration",
                "sourceUrl": "https://acmecorp.com/features",
                "sourceTitle": "Acme Corp Features",
                "position": 0,
                "context": "According to their documentation, Acme Corp offers robust features...",
                "contentType": "product_page",
                "relevanceScore": 92
              },
              {
                "type": "link",
                "text": null,
                "sourceUrl": "https://acmecorp.com/blog/remote-work",
                "sourceTitle": "Remote Work Best Practices - Acme Blog",
                "position": 1,
                "context": "See more at Acme Corp's blog...",
                "contentType": "blog_post",
                "relevanceScore": 75
              }
            ],
            "contentTypePerformance": {
              "product_page": 1,
              "blog_post": 1,
              "documentation": 0,
              "case_study": 0
            },
            "recommendations": [
              {
                "id": "add_structured_data",
                "title": "Add Structured Data Markup",
                "description": "ChatGPT shows preference for content with schema.org markup. Adding structured data to your product pages can improve citation quality.",
                "priority": 1,
                "impact": "high",
                "difficulty": "moderate",
                "actionItems": [
                  "Implement schema.org Product markup on product pages",
                  "Add Organization schema to homepage",
                  "Include Review and Rating schemas for social proof"
                ],
                "examples": [
                  "Use schema.org/Product for product pages",
                  "Use schema.org/SoftwareApplication for your platform"
                ]
              },
              {
                "id": "optimize_first_paragraph",
                "title": "Optimize First Paragraph Content",
                "description": "ChatGPT heavily weights opening paragraphs. Ensure your brand value proposition appears in the first 150 words.",
                "priority": 2,
                "impact": "high",
                "difficulty": "easy",
                "actionItems": [
                  "Include brand name in first sentence",
                  "State primary value proposition within first paragraph",
                  "Add key differentiators early in content"
                ],
                "examples": []
              },
              {
                "id": "increase_use_cases",
                "title": "Create More Use Case Documentation",
                "description": "ChatGPT frequently cites use case content when answering 'how to' queries. Expand use case library.",
                "priority": 3,
                "impact": "medium",
                "difficulty": "moderate",
                "actionItems": [
                  "Document 5-10 common customer scenarios",
                  "Include specific examples and outcomes",
                  "Link use cases from product pages"
                ],
                "examples": []
              }
            ]
          }
        },
        {
          "platform": "claude",
          "status": "completed",
          "error": null,
          "analysis": {
            "visibilityScore": {
              "total": 68,
              "breakdown": {
                "mentionCount": 24,
                "citationQuality": 21,
                "prominence": 23
              },
              "metrics": {
                "totalMentions": 3,
                "averageCitationRelevance": 70,
                "firstMentionPosition": 98
              }
            },
            "citations": [
              {
                "type": "paraphrase",
                "text": "Acme Corporation provides project management tools focused on distributed teams",
                "sourceUrl": "https://acmecorp.com/about",
                "sourceTitle": "About Acme Corp",
                "position": 0,
                "context": "One option is Acme Corporation...",
                "contentType": "landing_page",
                "relevanceScore": 85
              }
            ],
            "contentTypePerformance": {
              "landing_page": 1,
              "blog_post": 0,
              "documentation": 0
            },
            "recommendations": [
              {
                "id": "improve_technical_docs",
                "title": "Enhance Technical Documentation",
                "description": "Claude shows preference for detailed technical documentation. Expand API docs and integration guides.",
                "priority": 1,
                "impact": "high",
                "difficulty": "moderate",
                "actionItems": [
                  "Add comprehensive API documentation",
                  "Create integration guides for popular tools",
                  "Include code examples and SDKs"
                ]
              }
            ]
          }
        },
        {
          "platform": "gemini",
          "status": "completed",
          "error": null,
          "analysis": {
            "visibilityScore": {
              "total": 58,
              "breakdown": {
                "mentionCount": 16,
                "citationQuality": 18,
                "prominence": 24
              },
              "metrics": {
                "totalMentions": 2,
                "averageCitationRelevance": 60,
                "firstMentionPosition": 67
              }
            },
            "citations": [
              {
                "type": "reference",
                "text": "Acme",
                "sourceUrl": null,
                "sourceTitle": null,
                "position": 0,
                "context": "Tools like Acme can help with...",
                "contentType": null,
                "relevanceScore": 60
              }
            ],
            "contentTypePerformance": {
              "unknown": 1
            },
            "recommendations": [
              {
                "id": "create_video_content",
                "title": "Develop Video Content Library",
                "description": "Gemini shows increased preference for video content. Create tutorial and demo videos.",
                "priority": 1,
                "impact": "medium",
                "difficulty": "hard",
                "actionItems": [
                  "Create 5-10 product demo videos",
                  "Upload to YouTube with proper metadata",
                  "Embed videos on key landing pages"
                ]
              }
            ]
          }
        },
        {
          "platform": "perplexity",
          "status": "completed",
          "error": null,
          "analysis": {
            "visibilityScore": {
              "total": 87,
              "breakdown": {
                "mentionCount": 40,
                "citationQuality": 27,
                "prominence": 20
              },
              "metrics": {
                "totalMentions": 5,
                "averageCitationRelevance": 90,
                "firstMentionPosition": 212
              }
            },
            "citations": [
              {
                "type": "link",
                "text": "Acme Corp - Remote Team Project Management",
                "sourceUrl": "https://acmecorp.com",
                "sourceTitle": "Acme Corp Official Site",
                "position": 0,
                "context": null,
                "contentType": "landing_page",
                "relevanceScore": 95
              },
              {
                "type": "direct_quote",
                "text": "Designed specifically for distributed teams",
                "sourceUrl": "https://acmecorp.com/features/remote-teams",
                "sourceTitle": "Remote Teams Feature",
                "position": 1,
                "context": "As stated on their website, 'Designed specifically for distributed teams'...",
                "contentType": "product_page",
                "relevanceScore": 88
              }
            ],
            "contentTypePerformance": {
              "landing_page": 1,
              "product_page": 1,
              "blog_post": 0
            },
            "recommendations": [
              {
                "id": "optimize_meta_descriptions",
                "title": "Optimize Meta Descriptions",
                "description": "Perplexity heavily uses meta descriptions in citations. Ensure all pages have compelling, keyword-rich meta descriptions.",
                "priority": 1,
                "impact": "high",
                "difficulty": "easy",
                "actionItems": [
                  "Audit all meta descriptions",
                  "Include brand name and value proposition",
                  "Keep within 155-160 characters",
                  "Add target keywords naturally"
                ]
              },
              {
                "id": "build_backlink_profile",
                "title": "Strengthen Backlink Profile",
                "description": "Perplexity gives weight to domain authority. Focus on earning quality backlinks from industry sites.",
                "priority": 2,
                "impact": "high",
                "difficulty": "hard",
                "actionItems": [
                  "Create linkable assets (research, tools)",
                  "Guest post on industry blogs",
                  "Build relationships with industry influencers"
                ]
              }
            ]
          }
        }
      ]
    }
  }
}
```

**Partial Success Response (200 OK)**

When some platforms succeed but others fail:

```json
{
  "success": true,
  "data": {
    "queryId": "query_ghi789rst",
    "status": "partial",
    "analysis": {
      "summary": {
        "averageVisibilityScore": 68,
        "totalCitations": 4,
        "totalMentions": 6,
        "platformsAnalyzed": 2,
        "platformsRequested": 4,
        "bestPlatform": "chatgpt",
        "worstPlatform": null
      },
      "platforms": [
        {
          "platform": "chatgpt",
          "status": "completed",
          "error": null,
          "analysis": {
            "visibilityScore": { /* ... */ },
            "citations": [ /* ... */ ],
            "contentTypePerformance": { /* ... */ },
            "recommendations": [ /* ... */ ]
          }
        },
        {
          "platform": "claude",
          "status": "failed",
          "error": "Rate limit exceeded. Please try again in 60 seconds.",
          "analysis": null
        },
        {
          "platform": "gemini",
          "status": "completed",
          "error": null,
          "analysis": { /* ... */ }
        },
        {
          "platform": "perplexity",
          "status": "failed",
          "error": "Request timeout after 30000ms",
          "analysis": null
        }
      ]
    }
  }
}
```

### Status Codes

- **200 OK**: Analysis completed successfully (full or partial)
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Brand not found
- **500 Internal Server Error**: Analysis failed
- **503 Service Unavailable**: Database not configured

### Error Examples

**Validation Error (400)**

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "message": "Query text is required",
      "path": ["queryText"]
    }
  ]
}
```

**Authentication Error (401)**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Brand Not Found (404)**

```json
{
  "success": false,
  "error": "Brand not found"
}
```

**Database Error (503)**

```json
{
  "success": false,
  "error": "Database not configured. Please set DATABASE_URL."
}
```

---

## History Endpoint

Retrieve the user's past AI platform analyses with pagination support.

### Endpoint

```
GET /api/ai-insights/history
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brandId` | string | No | - | Filter results by specific brand ID |
| `limit` | integer | No | 10 | Number of records to return (1-100) |
| `offset` | integer | No | 0 | Number of records to skip (pagination) |

### Request Example

```http
GET /api/ai-insights/history?brandId=brand_abc123xyz&limit=20&offset=0
```

### Response Format

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "query_def456uvw",
        "queryText": "What are the best project management tools for remote teams?",
        "brandContext": "Acme Corp is a cloud-based project management platform designed for distributed teams.",
        "platforms": ["chatgpt", "claude", "gemini", "perplexity"],
        "status": "completed",
        "createdAt": "2024-12-24T14:30:00.000Z",
        "completedAt": "2024-12-24T14:30:15.234Z",
        "brand": {
          "id": "brand_abc123xyz",
          "name": "Acme Corp",
          "domain": "acmecorp.com",
          "logoUrl": "https://cdn.acmecorp.com/logo.png"
        },
        "summary": {
          "platformsAnalyzed": 4,
          "averageVisibilityScore": 72,
          "totalCitations": 8,
          "totalMentions": 12
        },
        "platformBreakdown": [
          {
            "platform": "chatgpt",
            "visibilityScore": 75,
            "citationCount": 2,
            "mentionCount": 4,
            "prominenceScore": 19,
            "topCitations": [
              {
                "type": "direct_quote",
                "text": "Acme Corp offers robust features for remote team collaboration",
                "sourceUrl": "https://acmecorp.com/features",
                "sourceTitle": "Acme Corp Features",
                "relevanceScore": 92
              },
              {
                "type": "link",
                "text": null,
                "sourceUrl": "https://acmecorp.com/blog/remote-work",
                "sourceTitle": "Remote Work Best Practices - Acme Blog",
                "relevanceScore": 75
              }
            ]
          },
          {
            "platform": "claude",
            "visibilityScore": 68,
            "citationCount": 1,
            "mentionCount": 3,
            "prominenceScore": 23,
            "topCitations": [
              {
                "type": "paraphrase",
                "text": "Acme Corporation provides project management tools focused on distributed teams",
                "sourceUrl": "https://acmecorp.com/about",
                "sourceTitle": "About Acme Corp",
                "relevanceScore": 85
              }
            ]
          },
          {
            "platform": "gemini",
            "visibilityScore": 58,
            "citationCount": 1,
            "mentionCount": 2,
            "prominenceScore": 24,
            "topCitations": [
              {
                "type": "reference",
                "text": "Acme",
                "sourceUrl": null,
                "sourceTitle": null,
                "relevanceScore": 60
              }
            ]
          },
          {
            "platform": "perplexity",
            "visibilityScore": 87,
            "citationCount": 4,
            "mentionCount": 3,
            "prominenceScore": 20,
            "topCitations": [
              {
                "type": "link",
                "text": "Acme Corp - Remote Team Project Management",
                "sourceUrl": "https://acmecorp.com",
                "sourceTitle": "Acme Corp Official Site",
                "relevanceScore": 95
              },
              {
                "type": "direct_quote",
                "text": "Designed specifically for distributed teams",
                "sourceUrl": "https://acmecorp.com/features/remote-teams",
                "sourceTitle": "Remote Teams Feature",
                "relevanceScore": 88
              }
            ]
          }
        ]
      },
      {
        "id": "query_jkl012mno",
        "queryText": "How to manage remote teams effectively?",
        "brandContext": null,
        "platforms": ["chatgpt", "perplexity"],
        "status": "partial",
        "createdAt": "2024-12-23T10:15:00.000Z",
        "completedAt": "2024-12-23T10:15:08.456Z",
        "brand": {
          "id": "brand_abc123xyz",
          "name": "Acme Corp",
          "domain": "acmecorp.com",
          "logoUrl": "https://cdn.acmecorp.com/logo.png"
        },
        "summary": {
          "platformsAnalyzed": 1,
          "averageVisibilityScore": 45,
          "totalCitations": 1,
          "totalMentions": 2
        },
        "platformBreakdown": [
          {
            "platform": "chatgpt",
            "visibilityScore": 45,
            "citationCount": 1,
            "mentionCount": 2,
            "prominenceScore": 12,
            "topCitations": [
              {
                "type": "reference",
                "text": "Acme Corp",
                "sourceUrl": null,
                "sourceTitle": null,
                "relevanceScore": 50
              }
            ]
          }
        ]
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 47,
      "hasMore": true
    }
  }
}
```

### Status Codes

- **200 OK**: Successfully retrieved history
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Brand not found (when brandId is specified)
- **500 Internal Server Error**: Failed to fetch history
- **503 Service Unavailable**: Database not configured

### Error Examples

**Authentication Error (401)**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Brand Not Found (404)**

```json
{
  "success": false,
  "error": "Brand not found"
}
```

---

## Platform-Specific Endpoint

Retrieve insights filtered by a specific AI platform, allowing deep-dive analysis of how a brand performs on individual platforms over time.

### Endpoint

```
GET /api/ai-insights/[platform]
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | string | Yes | Platform name: `chatgpt`, `claude`, `gemini`, or `perplexity` |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brandId` | string | No | - | Filter results by specific brand ID |
| `limit` | integer | No | 10 | Number of records to return (1-100) |
| `offset` | integer | No | 0 | Number of records to skip (pagination) |

### Request Example

```http
GET /api/ai-insights/chatgpt?brandId=brand_abc123xyz&limit=10&offset=0
```

### Response Format

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "platform": "chatgpt",
    "insights": [
      {
        "id": "insight_pqr345stu",
        "queryId": "query_def456uvw",
        "platform": "chatgpt",
        "visibilityScore": 75,
        "citationCount": 2,
        "mentionCount": 4,
        "prominenceScore": 19,
        "contentTypePerformance": {
          "product_page": 1,
          "blog_post": 1,
          "documentation": 0,
          "case_study": 0
        },
        "recommendations": [
          "add_structured_data",
          "optimize_first_paragraph",
          "increase_use_cases"
        ],
        "metadata": {
          "model": "gpt-4",
          "modelVersion": "gpt-4-0613",
          "temperature": 0.7,
          "tokensUsed": 1245,
          "responseTimeMs": 3421
        },
        "createdAt": "2024-12-24T14:30:10.123Z",
        "query": {
          "id": "query_def456uvw",
          "queryText": "What are the best project management tools for remote teams?",
          "brandContext": "Acme Corp is a cloud-based project management platform designed for distributed teams.",
          "platforms": ["chatgpt", "claude", "gemini", "perplexity"],
          "status": "completed",
          "createdAt": "2024-12-24T14:30:00.000Z",
          "completedAt": "2024-12-24T14:30:15.234Z"
        },
        "brand": {
          "id": "brand_abc123xyz",
          "name": "Acme Corp",
          "domain": "acmecorp.com",
          "logoUrl": "https://cdn.acmecorp.com/logo.png"
        },
        "citations": [
          {
            "type": "direct_quote",
            "text": "Acme Corp offers robust features for remote team collaboration",
            "sourceUrl": "https://acmecorp.com/features",
            "sourceTitle": "Acme Corp Features",
            "position": 0,
            "context": "According to their documentation, Acme Corp offers robust features...",
            "contentType": "product_page",
            "relevanceScore": 92
          },
          {
            "type": "link",
            "text": null,
            "sourceUrl": "https://acmecorp.com/blog/remote-work",
            "sourceTitle": "Remote Work Best Practices - Acme Blog",
            "position": 1,
            "context": "See more at Acme Corp's blog...",
            "contentType": "blog_post",
            "relevanceScore": 75
          }
        ]
      },
      {
        "id": "insight_vwx678yza",
        "queryId": "query_jkl012mno",
        "platform": "chatgpt",
        "visibilityScore": 45,
        "citationCount": 1,
        "mentionCount": 2,
        "prominenceScore": 12,
        "contentTypePerformance": {
          "unknown": 1
        },
        "recommendations": [
          "optimize_first_paragraph",
          "add_structured_data"
        ],
        "metadata": {
          "model": "gpt-4",
          "modelVersion": "gpt-4-0613",
          "temperature": 0.7,
          "tokensUsed": 987,
          "responseTimeMs": 2876
        },
        "createdAt": "2024-12-23T10:15:05.678Z",
        "query": {
          "id": "query_jkl012mno",
          "queryText": "How to manage remote teams effectively?",
          "brandContext": null,
          "platforms": ["chatgpt", "perplexity"],
          "status": "partial",
          "createdAt": "2024-12-23T10:15:00.000Z",
          "completedAt": "2024-12-23T10:15:08.456Z"
        },
        "brand": {
          "id": "brand_abc123xyz",
          "name": "Acme Corp",
          "domain": "acmecorp.com",
          "logoUrl": "https://cdn.acmecorp.com/logo.png"
        },
        "citations": [
          {
            "type": "reference",
            "text": "Acme Corp",
            "sourceUrl": null,
            "sourceTitle": null,
            "position": 0,
            "context": "Tools like Acme Corp can help...",
            "contentType": null,
            "relevanceScore": 50
          }
        ]
      }
    ],
    "aggregateStats": {
      "averageVisibilityScore": 60,
      "totalCitations": 3,
      "totalMentions": 6,
      "totalAnalyses": 2,
      "averageProminenceScore": 16
    },
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 2,
      "hasMore": false
    }
  }
}
```

### Status Codes

- **200 OK**: Successfully retrieved platform insights
- **400 Bad Request**: Invalid platform name
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Brand not found (when brandId is specified)
- **500 Internal Server Error**: Failed to fetch insights
- **503 Service Unavailable**: Database not configured

### Error Examples

**Invalid Platform (400)**

```json
{
  "success": false,
  "error": "Invalid platform",
  "details": "Platform must be one of: chatgpt, claude, gemini, perplexity"
}
```

**Authentication Error (401)**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## Error Responses

All endpoints follow a consistent error response format.

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid request parameters, validation errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Brand not found, resource doesn't exist |
| 500 | Internal Server Error | Analysis failed, database error, platform API error |
| 503 | Service Unavailable | Database not configured, service unavailable |

### Validation Error Format

Validation errors include detailed information about what went wrong:

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "message": "Query text is required",
      "path": ["queryText"]
    },
    {
      "code": "too_big",
      "maximum": 100,
      "type": "number",
      "inclusive": true,
      "message": "Limit cannot exceed 100",
      "path": ["limit"]
    }
  ]
}
```

---

## Data Models

### Citation Types

Citations are categorized by how the AI platform referenced the brand:

| Type | Description | Example |
|------|-------------|---------|
| `direct_quote` | Platform directly quoted brand content | "Acme Corp offers robust features" |
| `paraphrase` | Platform paraphrased brand content | "Acme provides project management tools" |
| `link` | Platform provided a clickable link | [Acme Corp](https://acmecorp.com) |
| `reference` | Platform mentioned brand without citation | "Tools like Acme can help..." |

### Content Types

Content types indicate what kind of content was cited:

| Content Type | Description |
|--------------|-------------|
| `blog_post` | Blog article or post |
| `documentation` | Technical documentation, API docs |
| `case_study` | Customer case study or success story |
| `press_release` | Press release or news announcement |
| `social_media` | Social media content (Twitter, LinkedIn, etc.) |
| `video` | Video content (YouTube, Vimeo, etc.) |
| `podcast` | Podcast episode or audio content |
| `whitepaper` | Whitepaper or research document |
| `tutorial` | Tutorial or how-to guide |
| `faq` | FAQ page or help article |
| `product_page` | Product landing page or feature page |
| `landing_page` | Marketing landing page or homepage |
| `unknown` | Content type could not be determined |

### Visibility Score Breakdown

Visibility scores range from 0-100 and are calculated based on three components:

| Component | Weight | Max Score | Description |
|-----------|--------|-----------|-------------|
| **Mention Count** | 40% | 40 | Number of times brand is mentioned in response |
| **Citation Quality** | 30% | 30 | Quality and relevance of citations |
| **Prominence** | 30% | 30 | Position of first mention and overall prominence |

**Score Interpretation:**

- **80-100**: Excellent visibility - Brand is prominently featured with quality citations
- **60-79**: Good visibility - Brand appears with decent prominence
- **40-59**: Moderate visibility - Brand mentioned but not prominently
- **20-39**: Low visibility - Minimal brand presence
- **0-19**: Poor visibility - Brand barely mentioned or not cited

### Query Status

| Status | Description |
|--------|-------------|
| `pending` | Analysis is in progress |
| `completed` | All platforms analyzed successfully |
| `partial` | Some platforms succeeded, others failed |
| `failed` | All platforms failed to analyze |

### Platform Names

Valid platform identifiers:

- `chatgpt` - OpenAI ChatGPT
- `claude` - Anthropic Claude
- `gemini` - Google Gemini
- `perplexity` - Perplexity AI

### Recommendation Priority & Impact

**Priority Levels** (1-5, with 1 being highest):
- **1**: Critical - Implement immediately
- **2**: High - Implement soon
- **3**: Medium - Plan for next quarter
- **4**: Low - Nice to have
- **5**: Optional - Consider if time allows

**Impact Levels**:
- **high**: Significant improvement expected
- **medium**: Moderate improvement expected
- **low**: Minor improvement expected

**Difficulty Levels**:
- **easy**: Can be implemented quickly with minimal resources
- **moderate**: Requires some planning and resources
- **hard**: Requires significant time, effort, or expertise

---

## Rate Limits & Best Practices

### Rate Limits

- Analysis endpoint: Recommended max 10 requests per minute per user
- History endpoint: Max 60 requests per minute per user
- Platform endpoint: Max 60 requests per minute per user

### Best Practices

1. **Cache Results**: Store analysis results client-side to avoid redundant API calls
2. **Pagination**: Use appropriate `limit` values (10-20) for better performance
3. **Error Handling**: Implement retry logic with exponential backoff for transient errors
4. **Partial Results**: Handle partial success responses gracefully - some platform data is better than none
5. **Batch Analysis**: Avoid analyzing the same query multiple times in quick succession
6. **Platform Selection**: Only request platforms you need to reduce API costs and response time
7. **Context Quality**: Provide detailed `brandContext` for better analysis results
8. **Monitoring**: Track `queryId` values for debugging and support requests

---

## Changelog

### Version 1.0 (December 2024)

- Initial release
- POST `/api/ai-insights/analyze` - Multi-platform analysis
- GET `/api/ai-insights/history` - Historical analysis retrieval
- GET `/api/ai-insights/[platform]` - Platform-specific insights
- Support for ChatGPT, Claude, Gemini, and Perplexity platforms
- Visibility scoring, citation extraction, and recommendation generation
