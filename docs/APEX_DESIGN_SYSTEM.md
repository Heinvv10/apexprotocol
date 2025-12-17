# APEX Design System

> **Single Source of Truth** for all UI/UX implementation
> **Version**: 4.1
> **Last Updated**: December 2024
> **Implementation**: `src/app/globals.css`

---

## Quick Reference

### Primary Colors (Copy-Paste Ready)

```typescript
const DESIGN = {
  // Backgrounds (dark to light)
  bgDeep: "#0a0f1a",        // Page background
  bgBase: "#0d1224",        // Main content area
  bgElevated: "#111827",    // Elevated surfaces
  bgCard: "#141930",        // Card backgrounds
  bgCardHover: "#1a2040",   // Card hover state
  bgInput: "#101828",       // Input fields

  // Primary Brand
  primaryCyan: "#00E5CC",   // Main accent, CTAs, metrics
  cyanBright: "#00FFE0",    // Hover/emphasis
  cyanMuted: "#00B8A3",     // Subdued state

  // Secondary Accents
  accentPurple: "#8B5CF6",  // Secondary accent, gradients
  purpleLight: "#A78BFA",   // Light purple variant
  accentPink: "#EC4899",    // Tertiary accent
  accentBlue: "#3B82F6",    // Info states, links

  // Semantic
  success: "#22C55E",       // Positive states
  warning: "#F59E0B",       // Warning states
  error: "#EF4444",         // Error states
  info: "#3B82F6",          // Informational

  // Text
  textPrimary: "#FFFFFF",   // Main headings
  textSecondary: "#94A3B8", // Body text (slate-400)
  textMuted: "#64748B",     // Disabled (slate-500)
  textAccent: "#00E5CC",    // Links, highlights

  // Borders (ALWAYS use rgba)
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  borderAccent: "rgba(0, 229, 204, 0.3)",
  borderGlow: "rgba(0, 229, 204, 0.5)",
};
```

### CSS Variables (HSL Format)

```css
:root {
  /* Backgrounds */
  --bg-deep: 225 40% 6%;
  --bg-base: 227 50% 9%;
  --bg-elevated: 228 40% 11%;
  --bg-card: 232 35% 12%;

  /* Primary */
  --primary: 170 100% 45%;        /* #00E5CC */
  --primary-foreground: 230 67% 2%;

  /* Semantic */
  --success: 142 71% 45%;         /* #22C55E */
  --warning: 38 92% 50%;          /* #F59E0B */
  --error: 0 84% 60%;             /* #EF4444 */

  /* Accents */
  --accent-purple: 262 83% 66%;   /* #8B5CF6 */
  --accent-pink: 330 81% 56%;     /* #EC4899 */
  --accent-blue: 217 91% 60%;     /* #3B82F6 */
}
```

---

## Card Hierarchy (3-Tier System)

### Tier 1: Primary Cards (`.card-primary`)

**Use for:** Main KPIs, GEO Score gauge, hero metrics

```tsx
<div className="card-primary">
  <GEOScoreGauge score={72} />
</div>
```

**CSS:**
```css
.card-primary {
  background: linear-gradient(135deg, rgba(15, 18, 37, 0.9), rgba(10, 13, 26, 0.95));
  border: 1.5px solid rgba(0, 229, 204, 0.25);
  box-shadow: 0 0 30px rgba(0, 229, 204, 0.08), 0 4px 24px rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 24px;
}
```

### Tier 2: Secondary Cards (`.card-secondary`)

**Use for:** Charts, recommendations, data tables

```tsx
<div className="card-secondary">
  <RecommendationList items={recommendations} />
</div>
```

**CSS:**
```css
.card-secondary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
}
```

### Tier 3: Tertiary Cards (`.card-tertiary`)

**Use for:** List items, activity rows, compact stats

```tsx
<div className="card-tertiary">
  <ActivityItem timestamp="2h ago" />
</div>
```

**CSS:**
```css
.card-tertiary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
}
```

---

## AI Platform Colors

| Platform | Hex | CSS Variable |
|----------|-----|--------------|
| **ChatGPT** | `#10A37F` | `--ai-chatgpt` |
| **Claude** | `#D97757` | `--ai-claude` |
| **Gemini** | `#4285F4` | `--ai-gemini` |
| **Perplexity** | `#20B8CD` | `--ai-perplexity` |
| **Grok** | `#FFFFFF` | `--ai-grok` |
| **DeepSeek** | `#6366F1` | `--ai-deepseek` |
| **Copilot** | `#0078D4` | `--ai-copilot` |

---

## Status Badges

### Citation Badges

```tsx
<span className="badge-primary-citation">Primary Citation</span>
<span className="badge-mentioned">Mentioned</span>
<span className="badge-omitted">Omitted</span>
<span className="badge-featured">Featured</span>
```

### Impact Badges

```tsx
<span className="badge-critical">Critical</span>
<span className="badge-high">High</span>
<span className="badge-medium">Medium</span>
<span className="badge-low">Low</span>
```

### Semantic Badges

```tsx
<span className="badge-success">Completed</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Failed</span>
```

---

## Glassmorphism (Modals Only)

**DO NOT** use glassmorphism on main content cards. Reserve for:
- Modal dialogs
- Tooltips/popovers
- Floating overlays

### Modal Pattern

```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center p-4"
  style={{ backgroundColor: "rgba(10, 15, 26, 0.8)" }}
>
  <div
    className="rounded-2xl backdrop-blur-xl max-w-3xl w-full"
    style={{
      backgroundColor: `${DESIGN.bgCard}B3`, // 70% opacity
      border: `1px solid ${DESIGN.primaryCyan}33`,
      boxShadow: `0 0 40px ${DESIGN.primaryCyan}15, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
    }}
  >
    {/* Modal content */}
  </div>
</div>
```

### Opacity Reference

| Suffix | Opacity | Use |
|--------|---------|-----|
| `FF` | 100% | Solid |
| `CC` | 80% | Slightly translucent |
| `B3` | 70% | Modal backgrounds |
| `80` | 50% | Alternative modal |
| `33` | 20% | Borders, accents |
| `15` | ~8% | Glow shadows |

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Display XL | 48px | 700 | Hero metrics ("68%") |
| Display | 36px | 600 | Page titles |
| Heading 1 | 24px | 600 | Section headers |
| Heading 2 | 20px | 600 | Card titles |
| Heading 3 | 16px | 600 | Subsections |
| Body | 14px | 400 | Primary content |
| Small | 12px | 500 | Labels, meta |
| Tiny | 10px | 500 | Badges |

---

## Animation Timing

```css
/* Micro-interactions */
--duration-fast: 150ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

/* Modal transitions */
--duration-normal: 250ms;
--ease-modal: cubic-bezier(0.4, 0, 0.2, 1);

/* Gauge/chart animations */
--duration-gauge: 800ms;
--ease-gauge: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Chart Colors

```css
--chart-1: 170 100% 45%;  /* Cyan - primary series */
--chart-2: 262 83% 66%;   /* Purple - secondary series */
--chart-3: 142 71% 45%;   /* Green - tertiary */
--chart-4: 217 91% 60%;   /* Blue */
--chart-5: 330 81% 56%;   /* Pink */
```

### Area Chart Gradient

```tsx
<defs>
  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#00E5CC" stopOpacity={0.3} />
    <stop offset="100%" stopColor="#00E5CC" stopOpacity={0} />
  </linearGradient>
</defs>
```

---

## Layout

### Spacing Scale

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |

### Grid

- **Container**: 1440px max-width
- **Page padding**: 32px (desktop), 16px (mobile)
- **Card gap**: 24px (desktop), 16px (mobile)

---

## Page Layout Pattern (Unified)

All dashboard pages follow a consistent layout structure. There are two patterns: **Main Pages** and **Sub-Pages**.

---

### Main Page Structure

Main pages (top-level dashboard routes) use the full APEX header with decorative elements.

```tsx
<div className="space-y-6 relative">
  {/* 1. APEX Branding Header + AI Status */}
  <PageHeader />

  {/* 2. Main Content (cards, tables, etc.) */}
  {/* Uses card-primary, card-secondary, card-tertiary */}

  {/* 3. Decorative Star (fixed position) */}
  <DecorativeStar />
</div>
```

### PageHeader Component (Main Pages)

**IMPORTANT**: Each page must use a unique gradient ID to avoid SVG conflicts.

```tsx
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* Left: APEX Logo + Module Name */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradMonitor)" />
            <defs>
              <linearGradient id="apexGradMonitor" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Monitor</span>
      </div>

      {/* Right: AI Status Indicator */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">AI Status:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
    </div>
  );
}
```

### DecorativeStar Component

**IMPORTANT**: Each page must use a unique gradient ID (e.g., `starGradientMonitor`).

```tsx
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientMonitor)"
        />
        <defs>
          <linearGradient id="starGradientMonitor" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
```

---

### Sub-Page Structure

Sub-pages (nested routes like `/dashboard/monitor/mentions`) use a simpler pattern with a back link instead of the full APEX header.

```tsx
<div className="space-y-6">
  {/* 1. Back Link */}
  <Link
    href="/dashboard/monitor"
    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    <ArrowLeft className="w-4 h-4" />
    Back to Monitor
  </Link>

  {/* 2. Page Title */}
  <h1 className="text-2xl font-bold text-foreground">Mentions</h1>

  {/* 3. Main Content */}
  {/* Uses card-primary, card-secondary, card-tertiary */}
</div>
```

**Key differences from Main Pages:**
- No `relative` on wrapper (no DecorativeStar)
- No PageHeader component
- Uses back link for navigation
- Simpler, cleaner layout

---

### Gradient ID Naming Convention

To avoid SVG gradient conflicts when multiple pages are rendered, use unique IDs:

| Page | Logo Gradient ID | Star Gradient ID |
|------|------------------|------------------|
| Dashboard | `apexGradDashboard` | `starGradientDashboard` |
| Monitor | `apexGradMonitor` | `starGradientMonitor` |
| Audit | `apexGradAudit` | `starGradientAudit` |
| Create | `apexGradCreate` | `starGradientCreate` |
| Feedback | `apexGradFeedback` | `starGradientFeedback` |
| Engines | `apexGradEngine` | `starGradientEngine` |
| Settings | `apexGradSettings` | `starGradientSettings` |
| Reports | `apexGradReports` | `starGradientReports` |
| Brands | `apexGradBrands` | `starGradientBrands` |
| Portfolios | `apexGradPortfolios` | `starGradientPortfolios` |
| Competitive | `apexGradCompetitive` | `starGradientCompetitive` |
| Social | `apexGradSocial` | `starGradientSocial` |
| People | `apexGradPeople` | `starGradientPeople` |

---

### Key Layout Rules

| Rule | Main Pages | Sub-Pages |
|------|------------|-----------|
| **Wrapper** | `space-y-6 relative` | `space-y-6` |
| **Header** | PageHeader with APEX logo + AI status | Back link only |
| **Content** | Uses card hierarchy | Uses card hierarchy |
| **Decorative** | DecorativeStar at bottom-right | None |
| **Navigation** | Via main sidebar | Back link to parent |

---

### All Main Pages (with unified layout)

| Route | Module Name | Gradient Suffix |
|-------|-------------|-----------------|
| `/dashboard` | Orbit | Dashboard |
| `/dashboard/monitor` | Monitor | Monitor |
| `/dashboard/audit` | Audit | Audit |
| `/dashboard/create` | Create | Create |
| `/dashboard/feedback` | Feedback | Feedback |
| `/dashboard/engine-room` | Engines | Engine |
| `/dashboard/settings` | Settings | Settings |
| `/dashboard/reports` | Reports | Reports |
| `/dashboard/brands` | Brands | Brands |
| `/dashboard/portfolios` | Portfolios | Portfolios |
| `/dashboard/competitive` | Competitive | Competitive |
| `/dashboard/social` | Social | Social |
| `/dashboard/people` | People | People |
| `/dashboard/recommendations` | Recommendations | Recommendations |

### Sub-Pages (with back link pattern)

- `/dashboard/monitor/mentions`
- `/dashboard/monitor/settings`
- `/dashboard/monitor/prompts`
- `/dashboard/monitor/analytics/*`
- `/dashboard/create/new`
- `/dashboard/create/brief`
- `/dashboard/audit/history`
- `/dashboard/audit/results`
- `/dashboard/settings/social`
- `/dashboard/recommendations/calendar`
- `/dashboard/recommendations/kanban`

---

## Anti-Patterns

| DO NOT | DO INSTEAD |
|--------|------------|
| Use `#000000` background | Use `#0a0f1a` (bgDeep) |
| Use hex for borders | Use rgba: `rgba(255, 255, 255, 0.08)` |
| Glassmorphism on main cards | Reserve for modals/overlays only |
| More than 3-4 colors per view | Stick to primary + 1-2 accents |
| Bouncy animations | Use smooth, professional easing |
| Basic `<Card>` component | Use `.card-primary/.secondary/.tertiary` |
| Pure white text everywhere | Use `textSecondary` for body text |
| Module shell wrappers | Use `space-y-6 relative` (flowing content) |
| Secondary nav in pages | Use main sidebar for module navigation |

---

## Module Naming

| Module | Purpose | Header Display |
|--------|---------|----------------|
| **ORBIT** | Main Dashboard | APEX ORBIT |
| **Monitor** | Query Tracking | APEX Monitor |
| **Feedback** | Knowledge Graph | APEX Feedback |
| **Engines** | Per-AI Deep Dives | APEX Engines |
| **Settings** | Configuration | APEX Settings |

---

## Reference Files

- **Implementation**: `src/app/globals.css`
- **Reference images**: `docs/images UI/Dash idea.png` (primary reference)
- **Skills**: `~/.claude/skills/apex-ui/` and `~/.claude/skills/apex-ui-ux/`

---

## Archived Documentation

The following docs are superseded by this file and moved to `docs/archive/`:
- `UI_DESIGN_SYSTEM.md` (v3.0)
- `UI_UX_DESIGN_STRATEGY.md`
- `UI_SPECIFICATION.md`
- `DRIBBBLE_DESIGN_ANALYSIS.md`
- `VISUAL_DESIGN_RESEARCH.md`

For wireframes, see `UI_WIREFRAMES.md` (still active).

---

*This is the authoritative design reference. All UI implementation must follow these specifications.*
