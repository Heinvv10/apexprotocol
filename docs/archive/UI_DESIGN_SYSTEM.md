# APEX UI Design System

> **Source of Truth**: Based on reference images in `docs/images UI/`
> **Version**: 3.0
> **Last Updated**: December 2024

---

## Table of Contents

1. [Visual Language](#visual-language)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout & Grid](#layout--grid)
5. [Component Patterns](#component-patterns)
6. [Page Blueprints](#page-blueprints)
7. [Animation & Motion](#animation--motion)
8. [Implementation Guide](#implementation-guide)

---

## Visual Language

### Design Philosophy

Based on the reference images, APEX follows a **premium dark space aesthetic** with these core principles:

1. **Deep Space Foundation** - Near-black backgrounds with subtle depth
2. **Cyan/Teal Primary Accent** - Distinctive brand color for key metrics
3. **Soft Gradients** - Smooth purple-to-blue transitions for visual interest
4. **Contained Cards** - Clear visual hierarchy through bordered containers
5. **Data Density** - Information-rich without feeling cluttered

### Visual Atmosphere

From analyzing `Dash idea.png` and `Landing Page.png`:

- **Background**: Deep navy-black with subtle grain texture
- **Ambient Effects**: Decorative star/sparkle elements in corners
- **Depth**: Multi-layered cards creating visual depth
- **Glow Effects**: Subtle cyan/purple glows on primary elements
- **Wave Graphics**: Flowing gradient waves for area charts

---

## Color System

### Background Layers

```css
:root {
  /* Background Hierarchy (from deepest to surface) */
  --bg-deep: #02030A;           /* Page background */
  --bg-base: #060812;           /* Main content area */
  --bg-elevated: #0A0D1A;       /* Elevated surfaces */
  --bg-card: #0F1225;           /* Card backgrounds */
  --bg-card-hover: #151935;     /* Card hover state */
  --bg-input: #0D1020;          /* Input field backgrounds */
}
```

### Primary Brand Colors

From `Dash idea.png` - the large "68%" metric and accent elements:

```css
:root {
  /* Primary Accent - Cyan/Teal */
  --apex-cyan: #00E5CC;         /* Primary accent (metrics, CTAs) */
  --apex-cyan-bright: #00FFE0;  /* Hover/emphasis state */
  --apex-cyan-muted: #00B8A3;   /* Subdued state */

  /* Secondary Accent - Purple */
  --apex-purple: #8B5CF6;       /* Secondary accent */
  --apex-purple-light: #A78BFA; /* Light purple */
  --apex-purple-dark: #6D28D9;  /* Dark purple */

  /* Tertiary - Blue */
  --apex-blue: #3B82F6;         /* Informational elements */

  /* Accent - Pink/Magenta */
  --apex-pink: #EC4899;         /* Highlights, notifications */
}
```

### Semantic Colors

From status badges in `Monitor.png`:

```css
:root {
  /* Semantic Status */
  --success: #22C55E;           /* Positive states */
  --success-muted: rgba(34, 197, 94, 0.15);

  --warning: #F59E0B;           /* Warning states */
  --warning-muted: rgba(245, 158, 11, 0.15);

  --error: #EF4444;             /* Error/negative states */
  --error-muted: rgba(239, 68, 68, 0.15);

  --info: #3B82F6;              /* Informational */
  --info-muted: rgba(59, 130, 246, 0.15);
}
```

### Text Colors

```css
:root {
  --text-primary: #FFFFFF;      /* Primary text */
  --text-secondary: #94A3B8;    /* Secondary text (slate-400) */
  --text-muted: #64748B;        /* Muted text (slate-500) */
  --text-accent: #00E5CC;       /* Accent text (cyan) */
  --text-link: #60A5FA;         /* Links */
}
```

### Border Colors

From card styles in reference images:

```css
:root {
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.12);
  --border-accent: rgba(0, 229, 204, 0.3);
  --border-glow: rgba(0, 229, 204, 0.5);
}
```

### AI Platform Colors

From `Dash idea.png` bottom platform cards:

| Platform | Color | Icon Style |
|----------|-------|------------|
| **ChatGPT** | `#10A37F` | Green circle with OpenAI logo |
| **Claude** | `#D97757` | Orange/terracotta with Anthropic logo |
| **Gemini** | `#4285F4` | Blue with Google star logo |
| **Perplexity** | `#20B8CD` | Teal/cyan with magnifying glass |
| **Grok** | `#FFFFFF` | White with X logo |
| **DeepSeek** | `#6366F1` | Indigo with whale logo |

### Gradient Definitions

From `Dash idea.png` chart area and card accents:

```css
:root {
  /* Chart Gradients */
  --gradient-chart-cyan: linear-gradient(180deg, rgba(0, 229, 204, 0.3) 0%, rgba(0, 229, 204, 0) 100%);
  --gradient-chart-purple: linear-gradient(180deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 100%);

  /* Card Border Gradients */
  --gradient-card-border: linear-gradient(135deg,
    rgba(0, 229, 204, 0.4) 0%,
    rgba(139, 92, 246, 0.4) 50%,
    rgba(236, 72, 153, 0.4) 100%);

  /* Background Ambient Gradient */
  --gradient-ambient: radial-gradient(ellipse at top right,
    rgba(139, 92, 246, 0.15) 0%,
    transparent 50%);
}
```

---

## Typography

### Font Stack

```css
:root {
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale

From reference images:

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **Display Large** | 48px | 700 | 1.1 | Hero metrics ("68%") |
| **Display Medium** | 36px | 700 | 1.2 | Secondary metrics ("85/100") |
| **Display Small** | 28px | 600 | 1.2 | Page titles |
| **Heading 1** | 24px | 600 | 1.3 | Section headers |
| **Heading 2** | 20px | 600 | 1.3 | Card titles |
| **Heading 3** | 16px | 600 | 1.4 | Subsections |
| **Body Large** | 16px | 400 | 1.5 | Primary content |
| **Body** | 14px | 400 | 1.5 | Standard text |
| **Body Small** | 13px | 400 | 1.5 | Secondary content |
| **Caption** | 12px | 500 | 1.4 | Labels, timestamps |
| **Overline** | 11px | 600 | 1.4 | Category labels |

### Metric Display Styles

From `Dash idea.png` - the large percentage display:

```css
.metric-hero {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #00E5CC 0%, #00B8A3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(0, 229, 204, 0.3);
}

.metric-secondary {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-change-positive {
  font-size: 14px;
  font-weight: 500;
  color: var(--success);
}

.metric-change-negative {
  font-size: 14px;
  font-weight: 500;
  color: var(--error);
}
```

---

## Layout & Grid

### Global Layout Structure

From all reference images - consistent header + content structure:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ▲ APEX [Module]    Orbit  Monitor  Feedback  Engines  Settings    ●   │
│  [Logo]             [─────────Navigation──────────]     [AI Status]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                                                                         │
│                          [Page Content]                                 │
│                                                                         │
│                                                                         │
│                                                                     ◆   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Header Navigation

From `Dash idea.png`:

- **Height**: 64px
- **Logo**: Left-aligned, APEX wordmark with triangle icon
- **Module Name**: Adjacent to logo in accent color (e.g., "ORBIT")
- **Nav Items**: Center-aligned, horizontal tabs with hover underline
- **Status Indicator**: Right-aligned, "AI Status: Active" with green dot

```tsx
// Header structure
<header className="h-16 flex items-center justify-between px-6 border-b border-white/5">
  <div className="flex items-center gap-3">
    <ApexLogo />
    <span className="text-cyan-400 font-semibold">ORBIT</span>
  </div>

  <nav className="flex items-center gap-8">
    <NavLink active>Orbit</NavLink>
    <NavLink>Monitor</NavLink>
    <NavLink>Feedback</NavLink>
    <NavLink>Engines</NavLink>
    <NavLink>Settings</NavLink>
  </nav>

  <AIStatusIndicator status="active" />
</header>
```

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

### Grid Specifications

- **Container Max Width**: 1440px
- **Page Padding**: 32px (desktop), 24px (tablet), 16px (mobile)
- **Card Gap**: 24px (desktop), 16px (mobile)
- **Section Gap**: 32px

---

## Component Patterns

### Cards (3-Tier Hierarchy)

From reference images - clear visual differentiation between card types:

#### Primary Card (Hero Metrics)

Used for: AI Visibility Pulse, Trust Score, main KPIs

From `Dash idea.png` - the large metric card on the left:

```css
.card-primary {
  background: linear-gradient(135deg,
    rgba(15, 18, 37, 0.9) 0%,
    rgba(10, 13, 26, 0.95) 100%);
  border: 1.5px solid rgba(0, 229, 204, 0.25);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 0 30px rgba(0, 229, 204, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.4);
}

.card-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(0, 229, 204, 0.5) 50%,
    transparent 100%);
}
```

#### Secondary Card (Content Sections)

Used for: Charts, recommendations, data tables

From `Dash idea.png` - the Trust Score and Citation Velocity cards:

```css
.card-secondary {
  background: rgba(15, 18, 37, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.card-secondary:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
```

#### Tertiary Card (List Items)

Used for: AI platform cards, activity items, list rows

From `Dash idea.png` - the bottom AI platform cards:

```css
.card-tertiary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
  transition: all 150ms ease;
}

.card-tertiary:hover {
  background: rgba(15, 18, 37, 0.6);
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}
```

### AI Platform Cards

From `Dash idea.png` bottom section - horizontal row of 5 platform cards:

```tsx
// AI Platform Card Component
<div className="card-tertiary flex items-center gap-4 min-w-[140px]">
  <div className="w-10 h-10 rounded-lg bg-[platform-color]/20 flex items-center justify-center">
    <PlatformIcon className="w-5 h-5" />
  </div>
  <div>
    <div className="text-sm font-medium text-white">ChatGPT</div>
    <div className="text-xs text-slate-400">55% Share</div>
  </div>
</div>
```

Layout: Horizontal scroll on mobile, flex row on desktop with equal spacing.

### Status Badges

From `Monitor.png` - various status indicators:

```css
.badge-primary-citation {
  background: rgba(0, 229, 204, 0.15);
  color: #00E5CC;
  border: 1px solid rgba(0, 229, 204, 0.3);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-mentioned {
  background: rgba(139, 92, 246, 0.15);
  color: #A78BFA;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-omitted {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-highly-positive {
  background: rgba(34, 197, 94, 0.15);
  color: #4ADE80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
```

### Gauge Component (AI Visibility Pulse)

From `Dash idea.png` - large circular progress gauge:

**Specifications**:
- **Size**: 180-200px diameter
- **Stroke Width**: 10-12px
- **Track Color**: `rgba(255, 255, 255, 0.05)`
- **Progress Color**: Gradient from `#00E5CC` to `#8B5CF6`
- **Center**: Large percentage with trend indicator below

```tsx
// Implementation with Recharts
<ResponsiveContainer width={200} height={200}>
  <PieChart>
    <defs>
      <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00E5CC" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <Pie
      data={[
        { value: percentage, fill: "url(#gaugeGradient)" },
        { value: 100 - percentage, fill: "rgba(255,255,255,0.05)" }
      ]}
      innerRadius={70}
      outerRadius={90}
      startAngle={90}
      endAngle={-270}
      dataKey="value"
    />
  </PieChart>
</ResponsiveContainer>

// Center overlay
<div className="absolute inset-0 flex flex-col items-center justify-center">
  <span className="metric-hero">68%</span>
  <span className="text-sm text-slate-400">Share of Answer</span>
  <span className="text-xs text-green-400">+12% this month</span>
</div>
```

### Area Chart (Citation Velocity)

From `Dash idea.png` right side chart:

**Specifications**:
- Multi-line with gradient fills
- Smooth curve interpolation (`type="monotone"`)
- Grid lines at 20% opacity
- Cyan and purple color scheme

```tsx
<ResponsiveContainer width="100%" height={160}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00E5CC" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#00E5CC" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="rgba(255,255,255,0.05)"
      vertical={false}
    />
    <XAxis
      dataKey="name"
      axisLine={false}
      tickLine={false}
      tick={{ fill: '#64748B', fontSize: 11 }}
    />
    <YAxis hide />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#00E5CC"
      strokeWidth={2}
      fill="url(#areaGradient)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### Recommendation Cards

From `Dash idea.png` "Prioritized Recommendations" section:

```tsx
<div className="card-secondary space-y-3">
  <h3 className="text-sm font-medium text-slate-400">Prioritized Recommendations</h3>

  {/* Recommendation Item */}
  <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
    <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="badge-warning text-xs">Medium Impact</span>
      </div>
      <p className="text-sm text-white mt-1">
        Perplexity is hallucinating your enterprise pricing. Review suggested correction.
      </p>
    </div>
  </div>
</div>
```

### Smart Table (Monitor Page)

From `Monitor.png` - expandable table rows:

```tsx
// Table structure
<div className="card-secondary">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Smart Table</h3>
    <FilterDropdown />
  </div>

  {/* Expandable Row */}
  <div className="border border-white/5 rounded-lg overflow-hidden">
    {/* Row Header (clickable) */}
    <div className="flex items-center gap-4 p-4 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
      <ChevronDown className="w-4 h-4 text-slate-400" />
      <span className="flex-1 text-sm">Best enterprise AEO platform</span>
      <Badge variant="primary-citation">Primary Citation</Badge>
      <PlatformIcon platform="claude" />
      <span className="text-xs text-slate-400">13 hours ago</span>
    </div>

    {/* Expanded Content */}
    <div className="grid grid-cols-2 gap-4 p-4 border-t border-white/5">
      {/* AI Output Panel */}
      <div className="bg-white/[0.02] rounded-lg p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-2">AI Output</h4>
        <p className="text-sm text-slate-300">
          "Apex is the premier AEO platform for new customers, reduces one brand code to brand..."
        </p>
      </div>

      {/* Apex Analysis Panel */}
      <div className="bg-white/[0.02] rounded-lg p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Apex Analysis</h4>
        <Badge variant="highly-positive" className="mb-2">Highly Positive</Badge>
        <p className="text-sm text-slate-300">
          Claude cited your "How it Works" page as the definitive source.
        </p>
        <MiniGauge value={85} className="mt-3" />
      </div>
    </div>
  </div>
</div>
```

### Filter Sidebar

From `Monitor.png` left sidebar:

```tsx
<aside className="w-64 shrink-0">
  <div className="card-secondary sticky top-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">Filters</h3>
      <MoreHorizontal className="w-4 h-4 text-slate-400" />
    </div>

    {/* Filter Group */}
    <div className="space-y-4">
      <FilterGroup title="Tracked Topics" count={12}>
        <Checkbox label="ChatGPT" checked />
        <Checkbox label="Competitors" checked />
        <Checkbox label="Citations..." />
      </FilterGroup>

      <FilterGroup title="Entity Types" count={4}>
        <Checkbox label="Entity" checked />
        <Checkbox label="Comments" />
        <Checkbox label="Collaborations" />
      </FilterGroup>

      <FilterGroup title="AI Engines" count={5}>
        <div className="flex flex-wrap gap-2">
          <PlatformToggle platform="chatgpt" active />
          <PlatformToggle platform="claude" active />
          <PlatformToggle platform="gemini" active />
          <PlatformToggle platform="perplexity" />
          <PlatformToggle platform="grok" />
        </div>
      </FilterGroup>
    </div>

    <Button variant="outline" className="w-full mt-4">
      <Plus className="w-4 h-4 mr-2" />
      Add New Tracking Scenario
    </Button>
  </div>
</aside>
```

### Knowledge Graph Workflow

From `Knowledge graph.png` - 3-column workflow:

```tsx
<div className="grid grid-cols-3 gap-6">
  {/* Column 1: Detected Hallucinations */}
  <div className="card-secondary">
    <h3 className="text-lg font-semibold mb-4">Detected Hallucinations</h3>

    <div className="space-y-3">
      <HallucinationCard
        platform="gemini"
        title="Wrong Launch Date"
        description="Gemini states 2022. Actual: 2024."
        predictedPickup="~4 weeks"
        progress={65}
      />
    </div>
  </div>

  {/* Column 2: Fix Deployed */}
  <div className="card-secondary">
    <h3 className="text-lg font-semibold mb-4">Fix Deployed</h3>

    <FixCard
      platform="claude"
      title="Pricing Error"
      showSchema
    >
      <CodeBlock language="json">
        {`{
  "name": "Apex",
  "method": "Pricing Error",
  "response": "NET"
}`}
      </CodeBlock>
    </FixCard>
  </div>

  {/* Column 3: Verified in AI */}
  <div className="card-secondary bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
    <h3 className="text-lg font-semibold mb-4">Verified in AI</h3>

    <VerifiedCard
      platform="perplexity"
      title="Feature Hallucination"
      status="verified"
    />
  </div>
</div>
```

### Neural Association Graph

From `AI neural graph.png` - network visualization:

**Specifications**:
- Central node: Brand (larger, glowing)
- Connected nodes: Topics/entities
- Edge lines: Curved with animated flow
- Colors: Purple for brand, varying for topics

```tsx
// Using React Flow or D3
<div className="card-secondary h-[400px]">
  <h3 className="text-lg font-semibold mb-4">Neural Association Graph</h3>

  <ReactFlow
    nodes={[
      {
        id: 'brand',
        position: { x: 200, y: 200 },
        data: { label: 'APEX Brand' },
        type: 'brandNode'
      },
      {
        id: 'pricing',
        position: { x: 50, y: 100 },
        data: { label: 'Pricing Model' }
      },
      // ... more nodes
    ]}
    edges={[
      { id: 'e1', source: 'brand', target: 'pricing', animated: true },
      // ... more edges
    ]}
  />
</div>
```

### Competitive Radar Chart

From `Engin room.png` - pentagon radar:

```tsx
<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={radarData}>
    <PolarGrid stroke="rgba(255,255,255,0.1)" />
    <PolarAngleAxis
      dataKey="axis"
      tick={{ fill: '#94A3B8', fontSize: 11 }}
    />
    <PolarRadiusAxis
      angle={30}
      domain={[0, 100]}
      tick={{ fill: '#64748B', fontSize: 10 }}
    />
    <Radar
      name="Your Brand"
      dataKey="brand"
      stroke="#00E5CC"
      fill="#00E5CC"
      fillOpacity={0.2}
    />
    <Radar
      name="Industry Average"
      dataKey="industry"
      stroke="#64748B"
      strokeDasharray="5 5"
      fill="transparent"
    />
  </RadarChart>
</ResponsiveContainer>
```

---

## Page Blueprints

### 1. Dashboard (Orbit)

**Reference**: `Dash idea.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APEX ORBIT                                              AI Status: ●   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  AI VISIBILITY PULSE    │  │ Apex Trust   │  │ Citation Velocity  │ │
│  │                         │  │   Score      │  │                    │ │
│  │       ╭──────╮          │  │              │  │ [Area Chart]       │ │
│  │      ╱   68%  ╲         │  │   85/100     │  │ ~~~~~~~~~~~~~~~    │ │
│  │      ╲        ╱         │  │ High Auth    │  │ +15% this week     │ │
│  │       ╰──────╯          │  │              │  │                    │ │
│  │    Share of Answer      │  │              │  │                    │ │
│  │    +12% this month      │  │              │  │                    │ │
│  └─────────────────────────┘  └──────────────┘  └────────────────────┘ │
│                                                                         │
│  Prioritized Recommendations                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ⚠ [Medium Impact] Perplexity is hallucinating your enterprise...   ││
│  │ ℹ [High Impact] Optimize knowledge base for Gemini's new format    ││
│  │ ○ [Low Impact] Monitor recent brand mentions on Claude             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ ChatGPT │ │ Claude  │ │ Gemini  │ │Perplxty │ │  Grok   │           │
│  │  55%    │ │  62%    │ │  48%    │ │  70%    │ │  40%    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                                     ◆   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Monitor

**Reference**: `Monitor.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APEX Monitor                                            AI Status: ●   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌─────────────────────────────────────────────┐ │
│  │     Filters      │  │          Live Query Analysis                │ │
│  │                  │  │                                             │ │
│  │ Tracked Topics   │  │  ┌─────────────────────────────────────┐   │ │
│  │ ☑ ChatGPT       │  │  │ Smart Table                         │   │ │
│  │ ☑ Competitors   │  │  ├─────────────────────────────────────┤   │ │
│  │ ☐ Citations     │  │  │ ▼ Best enterprise AEO platform      │   │ │
│  │                  │  │  │   [Primary Citation] [Claude] 13h   │   │ │
│  │ Entity Types     │  │  │   ┌───────────────┬───────────────┐ │   │ │
│  │ ☑ Entity        │  │  │   │ AI Output     │ Apex Analysis │ │   │ │
│  │ ☐ Comments      │  │  │   │ "Apex is the  │ Highly Posit. │ │   │ │
│  │                  │  │  │   │  premier..."  │ [gauge]       │ │   │ │
│  │ AI Engines       │  │  │   └───────────────┴───────────────┘ │   │ │
│  │ [G][C][Gm][P][X] │  │  ├─────────────────────────────────────┤   │ │
│  │                  │  │  │ ○ Apex pricing model [Mentioned]    │   │ │
│  │ [+ Add Scenario] │  │  │ ○ AI visibility tool [Omitted]      │   │ │
│  └──────────────────┘  │  └─────────────────────────────────────┘   │ │
│                        └─────────────────────────────────────────────┘ │
│                                                                     ◆   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Feedback (Knowledge Graph)

**Reference**: `Knowledge graph.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APEX Feedback                                           AI Status: ●   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Knowledge Graph Corrections                                            │
│                                                                         │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐     │
│  │ Detected          │ │ Fix Deployed      │ │ Verified in AI    │     │
│  │ Hallucinations    │ │                   │ │                   │     │
│  │                   │ │ ● Claude          │ │ ● Perplexity      │     │
│  │ ● Gemini          │ │   Pricing Error   │ │   Feature         │     │
│  │   Wrong Launch    │ │                   │ │   Hallucination   │     │
│  │   Date            │ │ [View Schema]     │ │                   │     │
│  │                   │ │ ┌───────────────┐ │ │                   │     │
│  │ Predicted: ~4wks  │ │ │ {code...}     │ │ │                   │     │
│  │ [████████░░]      │ │ └───────────────┘ │ │                   │     │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘     │
│                                                                     ◆   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Engine Room

**Reference**: `Engin room.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APEX ORBIT                                              AI Status: ●   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [ChatGPT] [ChatGPT] [Claude*] [Gemini] [Perplexity] [Grok]            │
│                                                                         │
│  ┌──────────────────┐  Engine Room - Claude                            │
│  │ Tracked Topics   │  Tracking Model: Claude 3 Opus                   │
│  │ ☑ Chaucer        │                                                  │
│  │ ○ Matuca         │  How Claude Perceives Your Brand                 │
│  │ ○ Continent      │                                                  │
│  │                  │  ┌──────────────────┐  ┌────────────────────┐    │
│  │ Entity Types     │  │ Competitive      │  │ Brand Perception   │    │
│  │ -                │  │ Radar            │  │                    │    │
│  │                  │  │    Frequency     │  │ (Authoritative)    │    │
│  │ AI Engines       │  │       ▲          │  │   (Technical)      │    │
│  │                  │  │   ╱─────╲        │  │     (Reliable)     │    │
│  │                  │  │  ╱       ╲       │  │       (Focused)    │    │
│  │                  │  │ Accuracy ── Opin │  │                    │    │
│  │                  │  │  ╲       ╱       │  │                    │    │
│  └──────────────────┘  │   ╲─────╱        │  └────────────────────┘    │
│                        │    Link Prowess  │                            │
│                        └──────────────────┘                            │
│                                                                     ◆   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5. Settings

**Reference**: `Settings.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APEX Onboard                                            AI Status: ●   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  APEX Settings                        General Settings                  │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────────────────────────────────┐│
│  │ ● General        │  │                                              ││
│  │ ○ Integrations   │  │ [Avatar] Dr. Anya Sharma   [Grace Hahee]    ││
│  │ ○ Notifications  │  │          @email            Customer Success ││
│  │ ○ Team           │  │          Marketing Lead    [Avatar]         ││
│  │ ○ Billing & Plan │  │                                              ││
│  │                  │  │ Brand Name: _______________  ┌────────────┐  ││
│  │                  │  │                              │   APEX     │  ││
│  │                  │  │ Brand Identity: [▾ Dropdown] │   Logo     │  ││
│  │                  │  │                              └────────────┘  ││
│  │                  │  │ Language: English (US) ▾                     ││
│  │                  │  │ Timezone: UTC+1:00 ▾                         ││
│  │                  │  │                                              ││
│  │                  │  │ Localization                                 ││
│  │                  │  │ ○ Prompt-Proof Score Strategies              ││
│  │                  │  │ ● Draw Your Year                             ││
│  │                  │  │                                              ││
│  │                  │  │                        [Save Changes]        ││
│  │                  │  │                                              ││
│  │                  │  │ ⚠ Delete Account                            ││
│  └──────────────────┘  └──────────────────────────────────────────────┘│
│                                                                     ◆   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6. Landing Page

**Reference**: `Landing Page.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ▲ Apex    Platform  Pricing  Resources  Company      [Get Started]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │   Be the Answer.                        ┌──────────────────────┐   ││
│  │   Not Just A Result                     │                      │   ││
│  │                                         │   [3D Isometric      │   ││
│  │   Maximize Your Brand's Visibility      │    AI Cube           │   ││
│  │   Across AI-Powered Search              │    Illustration]     │   ││
│  │                                         │                      │   ││
│  │   [See Apex in Action]                  └──────────────────────┘   ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  What We Stand For                                                      │
│                                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│  │Intelligence│ │ Precision │ │ Authority │ │Innovation │               │
│  │    ◇      │ │    ◇      │ │    ◇      │ │    ◇      │               │
│  │ AI-driven │ │ Accurate  │ │ Establish │ │ Stay ahead│               │
│  │ insights  │ │ targeting │ │  trust    │ │ of trends │               │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘               │
│                                                                         │
│  ▲ Apex                               Terms   Privacy   [Social Icons] │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7. Pricing Page

**Reference**: `Landing Pricing.png`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ▲ Apex    Platform  Pricing  Resources  Company      [Get Started]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Simple, Transparent Pricing           Annual Billing (Save 20%) [○]   │
│  Maximize Brand the AI Optimization Platform                            │
│                                                                         │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐     │
│  │     Startup       │ │      Growth       │ │    Enterprise     │     │
│  │                   │ │   [Recommended]   │ │                   │     │
│  │   $10/month       │ │   $50/month       │ │     Custom        │     │
│  │                   │ │                   │ │                   │     │
│  │ ○ Basic AI vis.   │ │ ○ Multi-Engine    │ │ ○ All Growth      │     │
│  │ ○ Single Engine   │ │ ○ Basic Schema    │ │ ○ Dedicated Supp. │     │
│  │ ○ Community Supp. │ │ ○ Priority Supp.  │ │ ○ Custom Integ.   │     │
│  │ ○ Community Supp. │ │ ○ Priority Supp.  │ │ ○ Advanced Anal.  │     │
│  │                   │ │                   │ │                   │     │
│  │ [Start Free Trial]│ │ [Start Free Trial]│ │ [Contact Sales]   │     │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘     │
│                                                                         │
│  FAQ                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ What happens if to exceed to the usage?                        ▾   ││
│  │ Can change plans?                                              ▾   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ▲ Apex                               Terms   Privacy   [Social Icons] │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Animation & Motion

### Using Motion Library

Based on research from Motion (framer-motion):

#### Page Transitions

```tsx
import { motion } from 'motion/react'

// Page entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
>
  {children}
</motion.div>
```

#### Card Hover Effects

```tsx
<motion.div
  className="card-secondary"
  whileHover={{
    y: -4,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

#### Staggered List Animation

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.div key={i} variants={item}>{i}</motion.div>
  ))}
</motion.div>
```

#### Animated Numbers

Based on Motion Primitives research:

```tsx
import { AnimatedNumber } from '@/components/motion-primitives/animated-number'

<AnimatedNumber
  value={percentage}
  className="metric-hero"
  springOptions={{ bounce: 0, duration: 2000 }}
/>
```

### Animation Timing

```css
:root {
  /* Timing Functions */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-gauge: 800ms;
}
```

### Scroll-Linked Animations

```tsx
import { scroll, animate } from 'motion'

// Fade in on scroll
scroll(
  animate('.fade-in', { opacity: [0, 1], y: [20, 0] }),
  { target: document.querySelector('.trigger') }
)
```

### AI Status Pulse

```css
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.ai-status-active {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Implementation Guide

### CSS Variables Setup

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* All color and spacing variables from above */
  }
}

@layer components {
  .card-primary { /* styles */ }
  .card-secondary { /* styles */ }
  .card-tertiary { /* styles */ }

  .badge-primary-citation { /* styles */ }
  .badge-mentioned { /* styles */ }
  .badge-omitted { /* styles */ }

  .metric-hero { /* styles */ }
  .metric-secondary { /* styles */ }
}
```

### Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'apex-cyan': '#00E5CC',
        'apex-purple': '#8B5CF6',
        'apex-blue': '#3B82F6',
        'apex-pink': '#EC4899',

        'bg-deep': '#02030A',
        'bg-base': '#060812',
        'bg-elevated': '#0A0D1A',
        'bg-card': '#0F1225',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(0, 229, 204, 0.15)',
        'glow-purple': '0 0 30px rgba(139, 92, 246, 0.15)',
      },
    },
  },
}
```

### Component Library Dependencies

```json
{
  "dependencies": {
    "motion": "^11.0.0",
    "recharts": "^2.12.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "lucide-react": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

### Implementation Checklist

#### Phase 1: Foundation
- [ ] Set up CSS variables in `globals.css`
- [ ] Configure Tailwind theme extension
- [ ] Create base card components (Primary/Secondary/Tertiary)
- [ ] Implement header navigation component
- [ ] Create AI Status indicator
- [ ] Set up badge variants

#### Phase 2: Charts & Data Visualization
- [ ] Implement gauge component (AI Visibility Pulse)
- [ ] Create area chart component (Citation Velocity)
- [ ] Build radar chart component (Competitive Radar)
- [ ] Design line chart patterns

#### Phase 3: Dashboard Page
- [ ] AI Visibility Pulse card
- [ ] Trust Score card
- [ ] Citation Velocity chart
- [ ] Prioritized Recommendations
- [ ] AI Platform cards row

#### Phase 4: Monitor Page
- [ ] Filter sidebar
- [ ] Smart Table with expandable rows
- [ ] AI Output + Analysis panels
- [ ] Status badges integration

#### Phase 5: Feedback Page
- [ ] 3-column workflow layout
- [ ] Hallucination cards
- [ ] Code snippet display
- [ ] Progress indicators

#### Phase 6: Engine Room
- [ ] AI Engine tabs
- [ ] Competitive Radar chart
- [ ] Brand Perception bubbles

#### Phase 7: Settings Page
- [ ] Settings sidebar navigation
- [ ] Profile editing form
- [ ] Brand identity section

#### Phase 8: Landing Pages
- [ ] Hero section with 3D illustration
- [ ] Feature cards
- [ ] Pricing tiers
- [ ] FAQ accordion
- [ ] Footer

---

*This design system is the authoritative reference for APEX UI implementation. All components must follow these specifications exactly.*
