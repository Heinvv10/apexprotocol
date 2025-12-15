# Apex GEO/AEO Platform - UI/UX Design Strategy

## Color System (Extracted from Reference Images)

This document defines the **authoritative** color palette and visual design system for Apex, based on analysis of the reference mockups in `docs/images UI/`.

---

## Core Color Palette

### Primary Brand Colors

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Primary Cyan** | `#00E5CC` | `170 100% 45%` | Main accent, metrics, charts, active states, primary buttons |
| **Primary Purple** | `#7C3AED` | `258 77% 58%` | Secondary accent, gradients, hover states |
| **Accent Pink** | `#D82F71` | `340 70% 51%` | Highlights, notifications, special callouts |

### Background Colors

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Deep Space** | `#02030A` | `230 67% 2%` | Main page background |
| **Space Navy** | `#0A0F2E` | `230 66% 11%` | Gradient end, deeper sections |
| **Card Background** | `#0E1558` | `234 74% 20%` | Primary card surfaces |
| **Card Secondary** | `#0D1335` | `233 63% 13%` | Secondary/nested cards |
| **Elevated Surface** | `#141B4D` | `234 60% 19%` | Elevated elements, dropdowns |

### Semantic Status Colors

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Success Green** | `#22C55E` | `142 71% 45%` | Positive metrics, completed states |
| **Warning Yellow** | `#F59E0B` | `38 92% 50%` | Caution, pending states |
| **Error Red** | `#EF4444` | `0 84% 60%` | Errors, critical alerts |
| **Info Blue** | `#3B82F6` | `217 91% 60%` | Informational states |

### Text Colors

| Name | Hex | Opacity | Usage |
|------|-----|---------|-------|
| **Primary Text** | `#FFFFFF` | 100% | Headings, important content |
| **Secondary Text** | `#94A3B8` | - | Body text, descriptions |
| **Muted Text** | `#64748B` | - | Placeholder, disabled states |
| **Accent Text** | `#00E5CC` | - | Links, highlighted text |

### Border & Divider Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Border Default** | `#1E293B` | Card borders, dividers |
| **Border Accent** | `#00E5CC33` | Glowing borders (20% opacity) |
| **Border Hover** | `#00E5CC66` | Hover state borders (40% opacity) |

---

## AI Platform Brand Colors

Each AI platform has a signature color for instant recognition:

| Platform | Hex | RGB | Usage |
|----------|-----|-----|-------|
| **ChatGPT** | `#10A37F` | `16, 163, 127` | ChatGPT cards, icons |
| **Claude** | `#CC785C` | `204, 120, 92` | Claude cards, terracotta accent |
| **Gemini** | `#4285F4` | `66, 133, 244` | Gemini cards, Google blue |
| **Perplexity** | `#20B8CD` | `32, 184, 205` | Perplexity cards, teal |
| **Grok** | `#1DA1F2` | `29, 161, 242` | Grok cards, X/Twitter blue |
| **DeepSeek** | `#FF6B35` | `255, 107, 53` | DeepSeek cards, orange |
| **Copilot** | `#0078D4` | `0, 120, 212` | Copilot cards, Microsoft blue |

---

## CSS Variable Definitions

```css
:root {
  /* Primary Brand Colors */
  --primary: 170 100% 45%;           /* #00E5CC - Bright Cyan */
  --primary-foreground: 230 67% 2%;  /* Dark text on primary */

  /* Secondary/Accent */
  --accent-purple: 258 77% 58%;      /* #7C3AED */
  --accent-pink: 340 70% 51%;        /* #D82F71 */

  /* Background Hierarchy */
  --background: 230 67% 2%;          /* #02030A - Deep Space */
  --background-secondary: 230 66% 11%; /* #0A0F2E */
  --card: 234 74% 20%;               /* #0E1558 - Card Background */
  --card-secondary: 233 63% 13%;     /* #0D1335 */
  --popover: 234 60% 19%;            /* #141B4D - Elevated */

  /* Text Colors */
  --foreground: 0 0% 100%;           /* #FFFFFF */
  --muted-foreground: 215 16% 62%;   /* #94A3B8 */
  --muted: 215 20% 45%;              /* #64748B */

  /* Semantic Colors */
  --success: 142 71% 45%;            /* #22C55E */
  --warning: 38 92% 50%;             /* #F59E0B */
  --error: 0 84% 60%;                /* #EF4444 */
  --info: 217 91% 60%;               /* #3B82F6 */

  /* Borders */
  --border: 217 33% 17%;             /* #1E293B */
  --ring: 170 100% 45%;              /* Same as primary for focus rings */
}
```

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-display: 'Inter Display', 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Note**: The reference images use Inter font family, NOT Poppins. Inter provides excellent legibility on screens and has a modern, professional appearance consistent with the premium dashboard aesthetic.

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display XL** | 48px / 3rem | 700 | 1.1 | Hero metrics (68%) |
| **Display** | 36px / 2.25rem | 600 | 1.2 | Page titles |
| **Heading 1** | 24px / 1.5rem | 600 | 1.3 | Section headings |
| **Heading 2** | 20px / 1.25rem | 600 | 1.4 | Card titles |
| **Heading 3** | 16px / 1rem | 600 | 1.4 | Subsection titles |
| **Body** | 14px / 0.875rem | 400 | 1.5 | Primary body text |
| **Small** | 12px / 0.75rem | 400 | 1.4 | Meta info, labels |
| **Tiny** | 10px / 0.625rem | 500 | 1.3 | Badges, tags |

---

## 3-Tier Card Hierarchy

Based on the reference images, cards follow a strict visual hierarchy:

### Tier 1: Primary Cards (`.card-primary`)

Used for: GEO Score, main KPIs, hero metrics

```css
.card-primary {
  background: hsl(var(--card));
  border: 2px solid hsl(var(--primary) / 0.4);
  border-radius: 16px;
  box-shadow:
    0 0 20px hsl(var(--primary) / 0.15),
    0 4px 24px hsl(0 0% 0% / 0.4);
}
```

### Tier 2: Secondary Cards (`.card-secondary`)

Used for: Charts, recommendations, data tables

```css
.card-secondary {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 4px 16px hsl(0 0% 0% / 0.3);
}
```

### Tier 3: Tertiary Cards (`.card-tertiary`)

Used for: List items, compact stats, activity items

```css
.card-tertiary {
  background: hsl(var(--card-secondary));
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 8px;
}
```

---

## Gradient Definitions

### Background Gradients

```css
/* Main page gradient (top to bottom) */
--gradient-page: linear-gradient(180deg, #02030A 0%, #0A0F2E 100%);

/* Radial glow effect for hero sections */
--gradient-glow: radial-gradient(ellipse at 50% 0%,
  hsl(170 100% 45% / 0.1) 0%,
  transparent 50%);

/* Card accent gradient */
--gradient-card-accent: linear-gradient(135deg,
  hsl(var(--primary) / 0.1) 0%,
  transparent 50%);
```

### Chart Gradients

```css
/* Area chart fill */
--gradient-chart-cyan: linear-gradient(180deg,
  hsl(170 100% 45% / 0.3) 0%,
  hsl(170 100% 45% / 0.05) 100%);

/* Multi-line chart colors */
--chart-line-1: #00E5CC;  /* Primary cyan */
--chart-line-2: #7C3AED;  /* Purple */
--chart-line-3: #D82F71;  /* Pink */
```

---

## Glassmorphism (Use Sparingly)

Only for modals, tooltips, and floating overlays - NOT for main content cards.

```css
.glass-modal {
  background: hsl(var(--card) / 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border) / 0.5);
}

.glass-tooltip {
  background: hsl(var(--card) / 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid hsl(var(--border));
}
```

---

## Animation Timing

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro-interactions | 150ms | ease-in-out |
| Card hover | 200ms | ease-out |
| Modal open/close | 250ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Page transitions | 300ms | ease-in-out |
| Gauge animations | 800ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Chart reveal | 600ms | ease-out |

---

## Component Visual Reference

### Dashboard Layout (from Dash idea.png)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Apex Logo]  Platform | Pricing | Resources | Company  [Get Started] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ AI Visibility Pulse      │  │ Trust Score│  │ Citation   │   │
│  │                          │  │            │  │ Velocity   │   │
│  │         68%              │  │  85/100    │  │ +15% week  │   │
│  │  [Cyan Glowing Chart]    │  │ [Gauge]    │  │ [Sparkline]│   │
│  │  +12% this month         │  │High Auth   │  │            │   │
│  └──────────────────────────┘  └────────────┘  └────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Prioritized Recommendations                                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ ⚠️ [Medium Impact] Perply is hallucinating your pricing    │ │
│  │ ✓ Review suggested correction                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ChatGPT  │ │ Claude  │ │ Gemini  │ │ Gemini  │ │  Grok   │   │
│  │55% Share│ │55% Share│ │55% Share│ │85% Share│ │50% Share│   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Visual Characteristics (from reference images)

1. **Deep Space Background**: Not pure black (#000) but a rich dark blue (#02030A)
2. **Cyan as Hero Color**: The 68% metric, charts, and primary accents all use bright cyan
3. **Subtle Glow Effects**: Cards have soft cyan border glow, not harsh neon
4. **Clean Typography**: Inter font with clear hierarchy
5. **Platform Brand Colors**: Each AI platform card uses its signature brand color
6. **Gradient Charts**: Area charts have cyan-to-transparent gradients
7. **Minimal Borders**: Cards use subtle 1-2px borders, not heavy outlines

---

## Anti-Patterns to Avoid

| DO NOT | DO INSTEAD |
|--------|------------|
| Use pure black (#000000) backgrounds | Use deep space navy (#02030A) |
| Use bright blue (#4A90E2) as primary | Use cyan (#00E5CC) as primary |
| Apply glassmorphism to all cards | Reserve for modals/tooltips only |
| Use more than 3-4 colors per view | Stick to primary + 1-2 accents |
| Use bouncy/elastic animations | Use smooth, professional easing |
| Use Poppins font | Use Inter font family |
| Use heavy drop shadows | Use subtle, dark shadows |
| Mix card hierarchy tiers randomly | Follow strict visual hierarchy |

---

## Color Application Examples

### Metric Cards
- **Positive change**: `+12%` in success green (#22C55E)
- **Negative change**: `-5%` in error red (#EF4444)
- **Neutral/info**: Use muted text (#94A3B8)

### Charts
- **Primary line/area**: Cyan (#00E5CC) with gradient fill
- **Secondary line**: Purple (#7C3AED)
- **Tertiary line**: Pink (#D82F71)
- **Grid lines**: Very subtle (#1E293B at 30% opacity)

### Buttons
- **Primary CTA**: Solid cyan background with dark text
- **Secondary**: Transparent with cyan border
- **Ghost**: Transparent with cyan text
- **Destructive**: Red background (#EF4444)

---

## Implementation Checklist

- [ ] Update `globals.css` with correct CSS variables
- [ ] Remove conflicting `.dark` class overrides
- [ ] Verify card classes use correct hierarchy
- [ ] Ensure Inter font is loaded (not Poppins)
- [ ] Check all charts use cyan color scheme
- [ ] Verify AI platform cards use brand colors
- [ ] Test glow effects are subtle, not harsh
- [ ] Confirm background is deep space navy, not pure black

---

## Reference Files

- `docs/images UI/Dash idea.png` - Main dashboard reference
- `docs/images UI/Dash idea 1.png` - Dashboard variant with platform cards
- `docs/images UI/Monitor.png` - Monitor page with charts
- `docs/images UI/Performance ideas.png` - Performance review with trends
- `docs/images UI/Knowledge graph.png` - Feedback page with cards
- `docs/images UI/Settings.png` - Settings page layout
- `docs/images UI/Landing Page.png` - Marketing landing page

---

*Last Updated: 2024-12-15*
*Source: Visual analysis of reference mockups in docs/images UI/*
