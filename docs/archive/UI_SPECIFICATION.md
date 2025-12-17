# APEX UI Specification

> **Design Reference**: Based on UI mockups in `docs/images UI/`
> **Version**: 2.0 (Complete Redesign)
> **Last Updated**: December 2024

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout Structure](#layout-structure)
5. [Component Library](#component-library)
6. [Page Specifications](#page-specifications)
7. [Animation & Interactions](#animation--interactions)
8. [Responsive Design](#responsive-design)

---

## Brand Identity

### Module Naming Convention

The APEX platform uses a modular naming system where each section has a distinct identity:

| Module | Purpose | Nav Label |
|--------|---------|-----------|
| **APEX ORBIT** | Main Dashboard / Command Center | Orbit |
| **APEX Monitor** | Live Query Tracking & Analysis | Monitor |
| **APEX Feedback** | Knowledge Graph Corrections | Feedback |
| **APEX Infographics** | Neural Graphs & Visualizations | (sub-section) |
| **APEX Engines** | Per-AI Engine Deep Dives | Engines |

### Logo Treatment

- **Primary Logo**: APEX wordmark with triangle icon
- **Module Indicator**: `APEX [Module]` in header with module name in accent color
- **Icon**: Stylized "A" triangle that can animate/pulse

### AI Status Indicator

Top-right corner displays real-time AI monitoring status:
- **Active** (Green pulse): AI engines responding normally
- **Degraded** (Yellow): Some engines slow/unavailable
- **Offline** (Red): Connection issues

---

## Color System

### Primary Palette

```css
:root {
  /* Background Layers */
  --bg-deep: #02030F;           /* Deepest background */
  --bg-base: #080B1A;           /* Main background */
  --bg-elevated: #0D1025;       /* Elevated surfaces */
  --bg-card: #121629;           /* Card backgrounds */
  --bg-card-hover: #1A1F3D;     /* Card hover state */

  /* Primary Brand Colors */
  --apex-cyan: #00E5CC;         /* Primary accent - cyan/teal */
  --apex-purple: #8B5CF6;       /* Secondary accent - purple */
  --apex-blue: #3B82F6;         /* Tertiary accent - blue */
  --apex-pink: #EC4899;         /* Highlight accent - pink */

  /* Semantic Colors */
  --success: #22C55E;           /* Positive/Success states */
  --warning: #F59E0B;           /* Warning states */
  --error: #EF4444;             /* Error/Negative states */
  --info: #3B82F6;              /* Informational */

  /* Text Colors */
  --text-primary: #FFFFFF;      /* Primary text */
  --text-secondary: #A1A1AA;    /* Secondary text */
  --text-muted: #71717A;        /* Muted/disabled text */
  --text-accent: #00E5CC;       /* Accent text */

  /* Border Colors */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-accent: rgba(0, 229, 204, 0.30);
  --border-glow: rgba(0, 229, 204, 0.50);

  /* Gradients */
  --gradient-card: linear-gradient(135deg, rgba(13, 16, 37, 0.8) 0%, rgba(8, 11, 26, 0.9) 100%);
  --gradient-accent: linear-gradient(135deg, #00E5CC 0%, #3B82F6 100%);
  --gradient-purple: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
}
```

### AI Platform Colors

Each AI platform has a consistent brand color:

| Platform | Color | Usage |
|----------|-------|-------|
| ChatGPT | `#10A37F` | Icon tint, badges |
| Claude | `#D97757` | Icon tint, badges |
| Gemini | `#4285F4` | Icon tint, badges |
| Perplexity | `#20B8CD` | Icon tint, badges |
| Grok | `#FFFFFF` | Icon tint, badges |
| DeepSeek | `#6366F1` | Icon tint, badges |

### Sentiment Colors

| Sentiment | Color | Badge Style |
|-----------|-------|-------------|
| Highly Positive | `#22C55E` | Green with glow |
| Positive | `#86EFAC` | Light green |
| Neutral | `#A1A1AA` | Gray |
| Negative | `#F87171` | Light red |
| Highly Negative | `#EF4444` | Red with glow |

### Status Badge Colors

| Status | Background | Text |
|--------|------------|------|
| Primary Citation | `rgba(0, 229, 204, 0.15)` | `#00E5CC` |
| Mentioned | `rgba(139, 92, 246, 0.15)` | `#8B5CF6` |
| Omitted | `rgba(239, 68, 68, 0.15)` | `#EF4444` |
| Featured | `rgba(59, 130, 246, 0.15)` | `#3B82F6` |

---

## Typography

### Font Stack

```css
:root {
  --font-display: 'Inter Display', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| **H1 - Page Title** | 28px | 600 | 1.2 | -0.02em |
| **H2 - Section Title** | 20px | 600 | 1.3 | -0.01em |
| **H3 - Card Title** | 16px | 600 | 1.4 | 0 |
| **H4 - Subsection** | 14px | 600 | 1.4 | 0 |
| **Body Large** | 16px | 400 | 1.5 | 0 |
| **Body** | 14px | 400 | 1.5 | 0 |
| **Body Small** | 13px | 400 | 1.5 | 0 |
| **Caption** | 12px | 500 | 1.4 | 0.01em |
| **Overline** | 11px | 600 | 1.4 | 0.08em |

### Numeric Display

Large metrics use special treatment:

```css
.metric-large {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.metric-medium {
  font-size: 32px;
  font-weight: 600;
}

.metric-small {
  font-size: 24px;
  font-weight: 600;
}
```

---

## Layout Structure

### Global Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX [Module]    Orbit  Monitor  Feedback  Engines  Settings  ● │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         [Page Content]                              │
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

### Header Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX Monitor    Orbit  Monitor  Feedback  Engines  Settings    ● │
│   [Logo]          [────────Nav Items────────]        [AI Status]   │
└─────────────────────────────────────────────────────────────────────┘
```

- **Logo**: Left-aligned, clickable to Orbit
- **Module Name**: Adjacent to logo, colored per module
- **Nav Items**: Center-aligned, hover underline animation
- **AI Status**: Right-aligned, pill badge with pulse animation

### Spacing System

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Grid System

- **Container Max Width**: 1440px
- **Page Padding**: 32px (desktop), 16px (mobile)
- **Card Gap**: 24px
- **Section Gap**: 48px

---

## Component Library

### Cards

#### Primary Card (Main Metrics)

```tsx
<div className="card-primary">
  {/* 2px cyan border with glow */}
  {/* Used for: AI Visibility Pulse, Trust Score, main KPIs */}
</div>
```

```css
.card-primary {
  background: var(--gradient-card);
  border: 2px solid var(--border-accent);
  border-radius: 16px;
  padding: 24px;
  box-shadow:
    0 0 20px rgba(0, 229, 204, 0.1),
    0 4px 24px rgba(0, 0, 0, 0.4);
}
```

#### Secondary Card (Content Sections)

```css
.card-secondary {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
```

#### Tertiary Card (List Items)

```css
.card-tertiary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
}
```

### Gauge Component (AI Visibility Pulse)

The main dashboard features a large circular gauge:

```
       ╭────────────╮
      ╱              ╲
     │                │
     │      68%       │
     │   +12% ▲       │
      ╲              ╱
       ╰────────────╯
    AI Visibility Pulse
```

**Implementation Details**:
- Size: 200x200px minimum
- Stroke width: 12px
- Background track: `var(--border-subtle)`
- Progress: Gradient from cyan to purple
- Center: Large percentage with trend indicator
- Animation: 800ms ease-out on load

### Trust Score Card

```
┌─────────────────────────────────┐
│  Apex Trust Score               │
│  ┌─────────────────────────┐   │
│  │         85/100          │   │
│  │    ████████████░░░      │   │
│  └─────────────────────────┘   │
│  Industry Benchmark: 72        │
└─────────────────────────────────┘
```

### AI Platform Cards

Horizontal cards showing AI engine status:

```
┌──────────────────────────────────────────────────────────────┐
│  [ChatGPT Icon]  ChatGPT        55% Share    [Trend Graph]  │
├──────────────────────────────────────────────────────────────┤
│  [Claude Icon]   Claude         60% Share    [Trend Graph]  │
├──────────────────────────────────────────────────────────────┤
│  [Gemini Icon]   Gemini         88% Share    [Trend Graph]  │
├──────────────────────────────────────────────────────────────┤
│  [Perplexity]    Perplexity     45% Share    [Trend Graph]  │
├──────────────────────────────────────────────────────────────┤
│  [Grok Icon]     Grok           32% Share    [Trend Graph]  │
└──────────────────────────────────────────────────────────────┘
```

### Smart Table

Used in Monitor page for query results:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Smart Table                                              [Filter ▾] │
├──────────────────────────────────────────────────────────────────────┤
│  ▶ Best enterprise AEO platform    [Primary Citation] [Claude] 13h  │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ AI Output                    │ Apex Analysis                │  │
│    │ "Apex is the premier AEO     │ [Highly Positive]           │  │
│    │  platform for new customers, │                              │  │
│    │  reduces one brand code..."  │ Claude cited your "How it   │  │
│    │                              │ Works" page as definitive.   │  │
│    │                              │ [────────●───] Gauge         │  │
│    └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  ○ Apex pricing model             [Mentioned] [Leading] 27h ago     │
├──────────────────────────────────────────────────────────────────────┤
│  ○ AI visibility tool             [Omitted] [Leading] 11 min ago    │
└──────────────────────────────────────────────────────────────────────┘
```

### Filter Sidebar

```
┌──────────────────────────┐
│  Filters            ...  │
├──────────────────────────┤
│  ☑ Tracked Topics   (12) │
│    ☑ ChatGPT             │
│    ☑ Competitors         │
│    ☐ Citations...        │
├──────────────────────────┤
│  ☑ Entity Types     (4)  │
│    ☑ Entity              │
│    ☐ Comments            │
│    ☐ Collaborations      │
├──────────────────────────┤
│  ☑ AI Engines       (5)  │
│    [GPT] [Claude] [Gem]  │
│    [Perp] [Grok]         │
├──────────────────────────┤
│  [+ Add Tracking Scenario]│
└──────────────────────────┘
```

### Status Badges

```tsx
// Badge variants
<Badge variant="primary-citation">Primary Citation</Badge>
<Badge variant="mentioned">Mentioned</Badge>
<Badge variant="omitted">Omitted</Badge>
<Badge variant="featured">Featured</Badge>
<Badge variant="sentiment-positive">Highly Positive</Badge>
<Badge variant="sentiment-negative">Negative</Badge>
```

### Neural Association Graph

Network visualization with central brand node:

```
              [SEO Tools]
                   │
    [Marketing]────┼────[Feature Set]
         │         │         │
         └────[APEX Brand]───┘
              ╱    │    ╲
     [Pricing]   [Tech]   [Use Cases]
```

**Implementation**:
- Use D3.js or React Flow for network rendering
- Central node: Brand with glow effect
- Connected nodes: Topics with varying sizes based on importance
- Edges: Curved lines with animated flow
- Interaction: Click to focus, hover for details

### Authority Heatmap

Grid of tags showing citation status across AI engines:

```
┌─────────────────────────────────────────────────────────────┐
│ Authority Heatmap                                           │
├─────────────────────────────────────────────────────────────┤
│ Topic          │ Claude  │ ChatGPT │ Gemini  │ Perplexity  │
├────────────────┼─────────┼─────────┼─────────┼─────────────┤
│ Pricing Model  │ [+++]   │ [+++]   │ [++]    │ [-]         │
│ Marketing AI   │ [++]    │ [+++]   │ [++]    │ [++]        │
│ SEO Tools      │ [+]     │ [++]    │ [-]     │ [+++]       │
└─────────────────────────────────────────────────────────────┘
```

Tags are colored by status:
- `[+++]` Primary Citation: Cyan
- `[++]` Mentioned: Purple
- `[+]` Featured: Blue
- `[-]` Omitted: Red/Gray

### Competitive Radar Chart

Pentagon/hexagon radar showing brand perception:

```
             Frequency
                │
                │
   Accuracy ────┼──── Opinion
                │
                │
          Link Prowess
```

- Brand line: Cyan filled area
- Industry average: Dashed gray line
- Labels at each axis point
- Hover: Show exact values

### Code Snippet Display

For Knowledge Graph fixes:

```css
.code-block {
  background: #0D0D0D;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}

.code-block .keyword { color: #C678DD; }
.code-block .string { color: #98C379; }
.code-block .property { color: #E06C75; }
.code-block .value { color: #D19A66; }
```

---

## Page Specifications

### 1. Orbit (Main Dashboard)

**Reference**: `Dash idea.png`, `Dash idea 1.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX ORBIT     Orbit  Monitor  Feedback  Engines  Settings    ●  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ AI VISIBILITY   │  │ Trust Score  │  │   Citation Velocity  │   │
│  │    PULSE        │  │              │  │   [Area Chart]       │   │
│  │    68%          │  │   85/100     │  │                      │   │
│  │  +12% this mo   │  │              │  │                      │   │
│  └─────────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                     │
│  Prioritized Recommendations                                        │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ ⚡ Medium Impact: Proxy is hallucinating your enterprise...   ││
│  │ ✓ Review Suggested Correction                                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ ChatGPT  │ │  Claude  │ │  Gemini  │ │Perplexity│ │   Grok   │  │
│  │   55%    │ │   60%    │ │   88%    │ │   45%    │ │   32%    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                     │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

**Components**:
1. **AI Visibility Pulse** (Primary Card) - Large gauge with percentage
2. **Trust Score** (Primary Card) - Score out of 100 with benchmark
3. **Citation Velocity** (Secondary Card) - Area chart showing trend
4. **Prioritized Recommendations** (Secondary Card) - Top action items
5. **AI Platform Cards** (Tertiary Cards) - Row of 5 engine cards

### 2. Monitor (Live Query Analysis)

**Reference**: `Monitor.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX Monitor    Orbit  Monitor  Feedback  Engines  Settings   ●  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌────────────────────────────────────────────┐  │
│  │   Filters    │  │  Live Query Analysis                       │  │
│  │              │  │                                            │  │
│  │ Tracked (12) │  │  ┌─────────────────────────────────────┐  │  │
│  │ ☑ ChatGPT    │  │  │ Smart Table                         │  │  │
│  │ ☑ Competitors│  │  │                                     │  │  │
│  │              │  │  │ ▶ Query row (expanded)              │  │  │
│  │ Entity (4)   │  │  │   AI Output | Apex Analysis         │  │  │
│  │ ☑ Entity     │  │  │                                     │  │  │
│  │ ☐ Comments   │  │  │ ○ Query row                         │  │  │
│  │              │  │  │ ○ Query row                         │  │  │
│  │ AI Engines   │  │  │ ○ Query row                         │  │  │
│  │ [Icons]      │  │  └─────────────────────────────────────┘  │  │
│  │              │  │                                            │  │
│  │ [+ Add New]  │  │                                            │  │
│  └──────────────┘  └────────────────────────────────────────────┘  │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

**Components**:
1. **Filter Sidebar** - Collapsible, sticky
2. **Live Query Analysis** - Main content area
3. **Smart Table** - Expandable rows with AI Output + Analysis

### 3. Feedback (Knowledge Graph Corrections)

**Reference**: `Knowledge graph.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX Feedback    Orbit  Monitor  Feedback  Engines  Settings  ●  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Knowledge Graph Corrections                                        │
│                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │ Detected         │ │ Fix Deployed     │ │ Verified in AI   │    │
│  │ Hallucinations   │ │                  │ │                  │    │
│  │                  │ │ ● Claude         │ │ ● Perplexity     │    │
│  │ ● Gemini         │ │ Pricing Error    │ │ Feature          │    │
│  │ Wrong Launch     │ │                  │ │ Hallucination    │    │
│  │ Date             │ │ [View Schema]    │ │                  │    │
│  │                  │ │                  │ │                  │    │
│  │ Predicted: ~4wks │ │ ┌────────────┐   │ │                  │    │
│  │ ████████░░░      │ │ │{code...}   │   │ │                  │    │
│  └──────────────────┘ │ └────────────┘   │ └──────────────────┘    │
│                       └──────────────────┘                          │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

**Workflow Columns**:
1. **Detected Hallucinations** - Issues found in AI responses
2. **Fix Deployed** - Corrections pushed to knowledge graph
3. **Verified in AI** - Confirmed fixes reflected in AI outputs

### 4. Engines (Per-AI Deep Dive)

**Reference**: `Engin room.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX ORBIT     Orbit  Monitor  Feedback  Engines  Settings    ●  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [ChatGPT] [Claude*] [Gemini] [Perplexity] [Grok]                  │
│                                                                     │
│  ┌──────────────┐  Engine Room - Claude                            │
│  │ Tracked (2)  │  Tracking Model: Claude 3 Opus                   │
│  │ ☑ Chaucer    │                                                  │
│  │ ○ Matuca     │  How Claude Perceives Your Brand                 │
│  │ ○ Continent  │                                                  │
│  │              │  ┌─────────────────┐  ┌────────────────────────┐ │
│  │ Entity Types │  │ Competitive     │  │ Brand Perception      │ │
│  │              │  │ Radar           │  │ Bubble Chart          │ │
│  │ AI Engines   │  │                 │  │                       │ │
│  └──────────────┘  │   [Pentagon]    │  │ (Authoritative)       │ │
│                    │                 │  │ (Technical) (Reliable)│ │
│                    └─────────────────┘  └────────────────────────┘ │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

**Components**:
1. **AI Engine Tabs** - Switch between platforms
2. **Competitive Radar** - Pentagon chart comparing to industry
3. **Brand Perception Bubbles** - Tag cloud with perception terms

### 5. Infographics (Neural Graphs)

**Reference**: `AI neural graph.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX Infographics  Orbit  Monitor  Feedback  Engines  Settings ● │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────┐  ┌───────────────────────────────┐ │
│  │ Neural Association Graph   │  │ Authority Heatmap             │ │
│  │                            │  │                               │ │
│  │         [Network           │  │ Topic    │ Claude │ GPT │ ... │ │
│  │          Diagram           │  │ Pricing  │ [tag]  │[tag]│     │ │
│  │           with             │  │ SEO      │ [tag]  │[tag]│     │ │
│  │          APEX Brand        │  │ Marketing│ [tag]  │[tag]│     │ │
│  │          at center]        │  │                               │ │
│  │                            │  │                               │ │
│  └────────────────────────────┘  └───────────────────────────────┘ │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. Content Strategist

**Reference**: `strategist.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ apex  Content Strategist            [Schema Engine] [Help]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐ ┌──────────────────────┐ ┌──────────────────────┐│
│  │ AI Query     │ │ Strategic            │ │ Schema Builder       ││
│  │ Trends       │ │ Opportunities        │ │                      ││
│  │              │ │                      │ │ Topic Origin:        ││
│  │ ● AI in Mktg │ │ Definitive Guide:    │ │ [AI Persona Preview] ││
│  │   500k+ vol  │ │ AI Ethics      80%   │ │                      ││
│  │              │ │                      │ │ [Generate Code]      ││
│  │ High-Potential│ │ Citation Potential  │ │                      ││
│  │ Keywords     │ │ Suggested Potential  │ │ Validation:          ││
│  │              │ │                      │ │ ✓ Schema valid       ││
│  │ Topic Owners │ │ Name: ___________    │ │ ✓ Indexed correctly  ││
│  │ ● Product    │ │ Suggested GPTF:      │ │                      ││
│  │              │ │ [_______________]    │ │ After Knowledge...   ││
│  │ Targeted     │ │                      │ │                      ││
│  │ Types        │ │ Validate & Relations │ │                      ││
│  └──────────────┘ └──────────────────────┘ └──────────────────────┘│
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

### 7. Performance Review

**Reference**: `Performance ideas.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX Monitor    Orbit  Monitor  Feedback  Engines  Settings   ●  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Comprehensive Performance Review                                   │
│                                                                     │
│  ┌────────────────────────────────┐ ┌────────────────────────────┐ │
│  │ Citation & Trend Analysis      │ │ Monthly Executive Summary  │ │
│  │ (Last 12 Months)               │ │                            │ │
│  │                                │ │ ● Apex Brand               │ │
│  │ [Multi-line Area Chart]        │ │   Directory: +8.0%         │ │
│  │ - Total Citations              │ │                            │ │
│  │ - Answer Share                 │ │ [Download PDF Report]      │ │
│  │ - Top 3 Mentions               │ │                            │ │
│  │                                │ ├────────────────────────────┤ │
│  └────────────────────────────────┘ │ Competitive Benchmark      │ │
│                                     │ ● Apex Brand               │ │
│  ┌──────────┐┌──────────┐┌────────┐│   Answer Share: -1.3%      │ │
│  │ ChatGPT  ││  Claude  ││ Gemini ││                            │ │
│  │  55%     ││   60%    ││  88%   ││ [Download PDF Report]      │ │
│  └──────────┘└──────────┘└────────┘└────────────────────────────┘ │
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

### 8. Settings

**Reference**: `Settings.png`

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▲ APEX Onboard    Orbit  Monitor  Feedback  Engines  Settings   ●  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  APEX Settings                    General Settings                  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐│
│  │ ○ General    │  │ [Avatar]  Dr. Arya Shams    [Grace Hathor]  ││
│  │ ○ Integrations│  │          @arya             Your             ││
│  │ ○ Notifications│ │          Marketing lead     [Avatar]        ││
│  │ ○ Team       │  │                                              ││
│  │ ○ Billing    │  │ Brand Name: _______________     ┌──────────┐││
│  │              │  │ Brand Identity: [Dropdown]      │ [APEX    │││
│  │              │  │ Industry: _______________       │  Logo]   │││
│  │              │  │ Language: English ▾             └──────────┘││
│  │              │  │                                              ││
│  │              │  │ Localization                                 ││
│  │              │  │ ○ Manage Proof Score                        ││
│  │              │  │ ● Data Tool View                            ││
│  │              │  │                                              ││
│  │              │  │                          [Save Changes]      ││
│  └──────────────┘  └──────────────────────────────────────────────┘│
│                                                                 ◆   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Animation & Interactions

### Timing Functions

```css
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-gauge: 800ms;
}
```

### Hover States

```css
/* Card hover */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-color: var(--border-accent);
  transition: all var(--duration-normal) var(--ease-default);
}

/* Button hover */
.btn-primary:hover {
  background: var(--apex-cyan);
  box-shadow: 0 0 20px rgba(0, 229, 204, 0.4);
}
```

### Loading States

1. **Skeleton**: Shimmer animation for loading content
2. **Gauge**: Animate from 0 to value on mount
3. **Charts**: Fade in with slight Y transform
4. **Tables**: Row-by-row stagger animation

### AI Status Pulse

```css
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.ai-status-active {
  animation: pulse 2s infinite;
}
```

### Network Graph Animations

- **Node hover**: Scale 1.1x, increase glow
- **Edge flow**: Animated dash offset
- **Focus mode**: Dim unconnected nodes

---

## Responsive Design

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Mobile Adaptations

**Navigation**:
- Hamburger menu on mobile
- Bottom tab bar for primary nav
- Module name hidden, icon only

**Dashboard**:
- Single column layout
- Gauge: 150px size
- AI Platform cards: 2-column grid
- Recommendations: Full width

**Monitor**:
- Filter sidebar: Collapsible drawer
- Smart Table: Card-based on mobile
- Query details: Full-screen modal

**Settings**:
- Sidebar: Top horizontal tabs
- Form: Single column

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Update `globals.css` with new color system
- [ ] Create base card components (Primary/Secondary/Tertiary)
- [ ] Update typography system
- [ ] Create header navigation component

### Phase 2: Dashboard
- [ ] AI Visibility Pulse gauge component
- [ ] Trust Score card
- [ ] Citation Velocity chart
- [ ] Prioritized Recommendations list
- [ ] AI Platform cards row

### Phase 3: Monitor
- [ ] Filter sidebar component
- [ ] Smart Table with expandable rows
- [ ] AI Output + Analysis panels
- [ ] Status badges

### Phase 4: Feedback
- [ ] Knowledge Graph workflow columns
- [ ] Hallucination detection cards
- [ ] Code snippet display
- [ ] Progress indicators

### Phase 5: Engines
- [ ] AI Engine tabs
- [ ] Competitive Radar chart
- [ ] Brand Perception bubble chart

### Phase 6: Infographics
- [ ] Neural Association Graph (D3/React Flow)
- [ ] Authority Heatmap grid

### Phase 7: Settings
- [ ] Settings sidebar navigation
- [ ] Profile editing form
- [ ] Brand identity section
- [ ] Localization options

---

## Design Tokens Export

For Figma/design tool synchronization:

```json
{
  "colors": {
    "bg-deep": "#02030F",
    "bg-base": "#080B1A",
    "apex-cyan": "#00E5CC",
    "apex-purple": "#8B5CF6"
  },
  "typography": {
    "font-display": "Inter Display",
    "font-body": "Inter"
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "4": "16px",
    "6": "24px",
    "8": "32px"
  },
  "radii": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px"
  }
}
```

---

*This specification is the single source of truth for APEX UI implementation. All components must adhere to these patterns.*
