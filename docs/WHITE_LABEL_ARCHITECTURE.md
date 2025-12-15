# White-Label Architecture - Apex Platform

## Executive Summary

The Apex GEO/AEO platform is designed with **modular white-label architecture** from the ground up, enabling rapid brand customization (<1 hour setup) while maintaining core functionality and trust signals.

**White-label mantra**: *"Change the colors, keep the credibility."*

---

## Architecture Overview

### Design Philosophy

```
White-Label Platform =
  (Immutable Trust Signals + Core Features)
  ×
  (Customizable Visual Identity)
```

**What this means**:
- **Trust signals** (verification badges, audit icons, source transparency) remain consistent across all white-label deployments
- **Core features** (GEO Score, Impact Index, Recommendations) maintain identical functionality
- **Visual identity** (logo, colors, typography, copywriting) can be fully customized per client

---

## Five-Layer White-Label System

### Layer 1: Environment Variable Configuration 🔧

**Purpose**: Single source of truth for brand customization

**Configuration File**: `.env` or `.env.production`

```env
# ===================================
# BRAND IDENTITY (White-Label Config)
# ===================================

# Brand Information
NEXT_PUBLIC_BRAND_NAME="Apex"
NEXT_PUBLIC_BRAND_TAGLINE="The Credibility Engine for African Business"
NEXT_PUBLIC_BRAND_PRESET="apex"  # Links to preset in config/brand-presets.ts

# Logo Assets
NEXT_PUBLIC_BRAND_LOGO_URL="/brands/apex/logo.svg"
NEXT_PUBLIC_BRAND_LOGO_DARK_URL="/brands/apex/logo-dark.svg"
NEXT_PUBLIC_BRAND_FAVICON_URL="/brands/apex/favicon.ico"

# ===================================
# COLOR SYSTEM (CSS Custom Properties)
# ===================================

# Primary Colors
NEXT_PUBLIC_PRIMARY_COLOR="#4926FA"          # Electric purple-blue (Apex default)
NEXT_PUBLIC_SECONDARY_COLOR="#3B82F6"        # Trust blue
NEXT_PUBLIC_SUCCESS_COLOR="#17CA29"          # Impact green
NEXT_PUBLIC_WARNING_COLOR="#FE9F06"          # Warning amber
NEXT_PUBLIC_ERROR_COLOR="#FB1306"            # Critical red

# Background Colors
NEXT_PUBLIC_BACKGROUND_LIGHT="#FAFAFA"       # Off-white (light mode)
NEXT_PUBLIC_BACKGROUND_DARK="#0A0A0B"        # Neutral dark (dark mode)
NEXT_PUBLIC_SURFACE_LIGHT="#FFFFFF"          # Cards/elevated surfaces (light)
NEXT_PUBLIC_SURFACE_DARK="#18181B"           # Cards/elevated surfaces (dark)

# Border Colors
NEXT_PUBLIC_BORDER_LIGHT="#E4E4E7"           # Subtle borders (light)
NEXT_PUBLIC_BORDER_DARK="#27272A"            # Subtle borders (dark)

# Text Colors
NEXT_PUBLIC_TEXT_PRIMARY_LIGHT="#0A0A0B"     # Main text (light mode)
NEXT_PUBLIC_TEXT_PRIMARY_DARK="#FAFAFA"      # Main text (dark mode)
NEXT_PUBLIC_TEXT_SECONDARY_LIGHT="#71717A"   # Secondary text (light)
NEXT_PUBLIC_TEXT_SECONDARY_DARK="#A1A1AA"    # Secondary text (dark)

# ===================================
# TYPOGRAPHY (Font Families)
# ===================================

NEXT_PUBLIC_FONT_HEADING="Inter Display"     # Headings/titles
NEXT_PUBLIC_FONT_BODY="Inter"                # Body text
NEXT_PUBLIC_FONT_MONO="JetBrains Mono"       # Code/monospace

# ===================================
# DESIGN TOKENS (Spacing & Effects)
# ===================================

NEXT_PUBLIC_BORDER_RADIUS="12px"             # Default border radius
NEXT_PUBLIC_SPACING_SCALE="4"                # Base spacing unit (4px)
NEXT_PUBLIC_TRANSITION_SPEED="150ms"         # Default transition duration

# ===================================
# OPTIONAL: CUSTOM DOMAIN
# ===================================

NEXT_PUBLIC_APP_URL="https://apex-platform.com"
```

**Key Benefits**:
- ✅ No code changes required for brand customization
- ✅ Environment-specific deployments (dev/staging/prod)
- ✅ Git-safe (`.env` files excluded from version control)
- ✅ Can override presets for one-off customizations

---

### Layer 2: Brand Preset System 🎛️

**Purpose**: Pre-configured brand packages for common use cases

**Configuration File**: `config/brand-presets.ts`

```typescript
export type BrandPreset = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    backgroundLight: string;
    backgroundDark: string;
    surfaceLight: string;
    surfaceDark: string;
    borderLight: string;
    borderDark: string;
    textPrimaryLight: string;
    textPrimaryDark: string;
    textSecondaryLight: string;
    textSecondaryDark: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    borderRadius: string;
    scale: number; // Base unit in px (typically 4px)
  };
  effects: {
    transitionSpeed: string;
    shadowElevation: 'subtle' | 'medium' | 'strong';
  };
  assets: {
    logo: {
      light: string;
      dark: string;
    };
    favicon: string;
    ogImage: string;
  };
  features?: {
    enableGlassmorphism?: boolean;
    enableAnimations?: boolean;
  };
};

// ===================================
// DEFAULT PRESETS
// ===================================

export const BRAND_PRESETS: Record<string, BrandPreset> = {
  // Apex - Default brand (Forbes+Gartner+BlackRock positioning)
  apex: {
    id: 'apex',
    name: 'Apex',
    tagline: 'The Credibility Engine for African Business',
    description: 'Premium GEO/AEO platform with Forbes-style authority',
    colors: {
      primary: '#4926FA',        // Electric purple-blue (innovation)
      secondary: '#3B82F6',      // Trust blue
      success: '#17CA29',        // Impact green (from Conceptzilla)
      warning: '#FE9F06',        // Warning amber
      error: '#FB1306',          // Critical red
      backgroundLight: '#FAFAFA', // Off-white (from Dribbble research)
      backgroundDark: '#0A0A0B',  // Neutral dark (Linear-style)
      surfaceLight: '#FFFFFF',
      surfaceDark: '#18181B',
      borderLight: '#E4E4E7',
      borderDark: '#27272A',
      textPrimaryLight: '#0A0A0B',
      textPrimaryDark: '#FAFAFA',
      textSecondaryLight: '#71717A',
      textSecondaryDark: '#A1A1AA',
    },
    fonts: {
      heading: 'Inter Display',
      body: 'Inter',
      mono: 'JetBrains Mono',
    },
    spacing: {
      borderRadius: '12px',
      scale: 4,
    },
    effects: {
      transitionSpeed: '150ms',
      shadowElevation: 'subtle',
    },
    assets: {
      logo: {
        light: '/brands/apex/logo.svg',
        dark: '/brands/apex/logo-dark.svg',
      },
      favicon: '/brands/apex/favicon.ico',
      ogImage: '/brands/apex/og-image.png',
    },
    features: {
      enableGlassmorphism: true,
      enableAnimations: true,
    },
  },

  // Enterprise - Conservative professional theme
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise GEO Platform',
    tagline: 'AI Visibility for Global Brands',
    description: 'Professional B2B SaaS with Gartner-style credibility',
    colors: {
      primary: '#1D4ED8',        // Professional blue
      secondary: '#059669',      // Growth green
      success: '#10B981',        // Success green
      warning: '#F59E0B',        // Warning amber
      error: '#DC2626',          // Error red
      backgroundLight: '#F9FAFB',
      backgroundDark: '#111827',
      surfaceLight: '#FFFFFF',
      surfaceDark: '#1F2937',
      borderLight: '#E5E7EB',
      borderDark: '#374151',
      textPrimaryLight: '#111827',
      textPrimaryDark: '#F9FAFB',
      textSecondaryLight: '#6B7280',
      textSecondaryDark: '#9CA3AF',
    },
    fonts: {
      heading: 'Satoshi',
      body: 'Satoshi',
      mono: 'IBM Plex Mono',
    },
    spacing: {
      borderRadius: '8px',  // More conservative rounding
      scale: 4,
    },
    effects: {
      transitionSpeed: '200ms',
      shadowElevation: 'medium',
    },
    assets: {
      logo: {
        light: '/brands/enterprise/logo.svg',
        dark: '/brands/enterprise/logo-dark.svg',
      },
      favicon: '/brands/enterprise/favicon.ico',
      ogImage: '/brands/enterprise/og-image.png',
    },
    features: {
      enableGlassmorphism: false,
      enableAnimations: false,
    },
  },

  // African Markets - Vibrant, culturally relevant theme
  'african-markets': {
    id: 'african-markets',
    name: 'African Business Index',
    tagline: 'Future Builders of the Continent',
    description: 'Africa-focused platform with vibrant, culturally resonant design',
    colors: {
      primary: '#EA580C',        // Vibrant orange (energy)
      secondary: '#0891B2',      // Cyan blue (innovation)
      success: '#16A34A',        // Green (growth)
      warning: '#CA8A04',        // Gold (value)
      error: '#DC2626',          // Red (critical)
      backgroundLight: '#FFFBEB', // Warm off-white
      backgroundDark: '#1C1917',  // Warm dark
      surfaceLight: '#FFFFFF',
      surfaceDark: '#292524',
      borderLight: '#FDE68A',     // Warm accent border
      borderDark: '#78716C',
      textPrimaryLight: '#1C1917',
      textPrimaryDark: '#FFFBEB',
      textSecondaryLight: '#78716C',
      textSecondaryDark: '#A8A29E',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
      mono: 'JetBrains Mono',
    },
    spacing: {
      borderRadius: '16px',  // More rounded (friendly)
      scale: 4,
    },
    effects: {
      transitionSpeed: '150ms',
      shadowElevation: 'medium',
    },
    assets: {
      logo: {
        light: '/brands/african-markets/logo.svg',
        dark: '/brands/african-markets/logo-dark.svg',
      },
      favicon: '/brands/african-markets/favicon.ico',
      ogImage: '/brands/african-markets/og-image.png',
    },
    features: {
      enableGlassmorphism: true,
      enableAnimations: true,
    },
  },
};

// ===================================
// ACTIVE BRAND LOADER
// ===================================

export function getActiveBrand(): BrandPreset {
  const presetId = process.env.NEXT_PUBLIC_BRAND_PRESET || 'apex';

  if (!BRAND_PRESETS[presetId]) {
    console.warn(`Brand preset "${presetId}" not found, falling back to "apex"`);
    return BRAND_PRESETS.apex;
  }

  return BRAND_PRESETS[presetId];
}

// Load active brand
export const ACTIVE_BRAND = getActiveBrand();
```

**Usage**:
```bash
# Development - switch brands instantly
NEXT_PUBLIC_BRAND_PRESET=apex npm run dev
NEXT_PUBLIC_BRAND_PRESET=enterprise npm run dev
NEXT_PUBLIC_BRAND_PRESET=african-markets npm run dev

# Production - deploy different brands
NEXT_PUBLIC_BRAND_PRESET=apex npm run build
NEXT_PUBLIC_BRAND_PRESET=client-custom npm run build
```

---

### Layer 3: Theme Provider (Runtime CSS Variables) 🎨

**Purpose**: Apply brand configuration as CSS custom properties at runtime

**Implementation File**: `app/providers/theme-provider.tsx`

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ACTIVE_BRAND, type BrandPreset } from '@/config/brand-presets';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  brandConfig: BrandPreset;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Get brand configuration from active preset
  const brandConfig = ACTIVE_BRAND;

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    setMounted(true);
  }, []);

  // Apply theme and brand CSS variables
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);

    // Apply brand colors
    root.style.setProperty('--primary', brandConfig.colors.primary);
    root.style.setProperty('--secondary', brandConfig.colors.secondary);
    root.style.setProperty('--success', brandConfig.colors.success);
    root.style.setProperty('--warning', brandConfig.colors.warning);
    root.style.setProperty('--error', brandConfig.colors.error);

    // Apply theme-specific colors
    const colors = effectiveTheme === 'dark'
      ? {
          background: brandConfig.colors.backgroundDark,
          surface: brandConfig.colors.surfaceDark,
          border: brandConfig.colors.borderDark,
          textPrimary: brandConfig.colors.textPrimaryDark,
          textSecondary: brandConfig.colors.textSecondaryDark,
        }
      : {
          background: brandConfig.colors.backgroundLight,
          surface: brandConfig.colors.surfaceLight,
          border: brandConfig.colors.borderLight,
          textPrimary: brandConfig.colors.textPrimaryLight,
          textSecondary: brandConfig.colors.textSecondaryLight,
        };

    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--surface', colors.surface);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);

    // Apply typography
    root.style.setProperty('--font-heading', brandConfig.fonts.heading);
    root.style.setProperty('--font-body', brandConfig.fonts.body);
    root.style.setProperty('--font-mono', brandConfig.fonts.mono);

    // Apply spacing & effects
    root.style.setProperty('--border-radius', brandConfig.spacing.borderRadius);
    root.style.setProperty('--spacing-scale', `${brandConfig.spacing.scale}px`);
    root.style.setProperty('--transition-speed', brandConfig.effects.transitionSpeed);

    // Apply shadow elevation
    const shadowElevations = {
      subtle: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      strong: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    };
    root.style.setProperty('--shadow-elevation', shadowElevations[brandConfig.effects.shadowElevation]);

    // Store theme preference
    localStorage.setItem('theme', theme);
  }, [theme, brandConfig, mounted]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    brandConfig,
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Usage in Components**:
```tsx
'use client';

import { useTheme } from '@/app/providers/theme-provider';

export function Header() {
  const { brandConfig, theme, setTheme } = useTheme();

  return (
    <header>
      <h1>{brandConfig.name}</h1>
      <p>{brandConfig.tagline}</p>

      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </header>
  );
}
```

---

### Layer 4: Tailwind Configuration (Design Tokens) 🎨

**Purpose**: Map CSS custom properties to Tailwind utility classes

**Configuration File**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from CSS custom properties
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: '#FFFFFF',
        },
        error: {
          DEFAULT: 'var(--error)',
          foreground: '#FFFFFF',
        },
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Inter Display', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
        sm: 'calc(var(--border-radius) * 0.5)',
        lg: 'calc(var(--border-radius) * 1.5)',
        xl: 'calc(var(--border-radius) * 2)',
      },
      spacing: {
        // Base scale from CSS variable
        'xs': 'calc(var(--spacing-scale) * 1)',   // 4px
        'sm': 'calc(var(--spacing-scale) * 2)',   // 8px
        'md': 'calc(var(--spacing-scale) * 4)',   // 16px
        'lg': 'calc(var(--spacing-scale) * 6)',   // 24px
        'xl': 'calc(var(--spacing-scale) * 8)',   // 32px
        '2xl': 'calc(var(--spacing-scale) * 12)', // 48px
        '3xl': 'calc(var(--spacing-scale) * 16)', // 64px
      },
      transitionDuration: {
        DEFAULT: 'var(--transition-speed)',
      },
      boxShadow: {
        elevation: 'var(--shadow-elevation)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**Usage in Components**:
```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-lg shadow-elevation">
      {children}
    </div>
  );
}

export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-primary text-white px-md py-sm rounded transition-all duration-DEFAULT hover:opacity-90">
      {children}
    </button>
  );
}
```

**Benefits**:
- ✅ All colors/fonts/spacing automatically adapt to brand preset
- ✅ No hardcoded values in components
- ✅ Changing `NEXT_PUBLIC_BRAND_PRESET` updates entire UI
- ✅ Type-safe with Tailwind IntelliSense

---

### Layer 5: Component Library (Brand-Aware UI) 🧩

**Purpose**: Shadcn/ui components that automatically adapt to brand configuration

**Example**: `components/ui/button.tsx`

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Uses CSS custom properties - automatically inherits brand colors
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        success: 'bg-success text-white hover:bg-success/90',
        warning: 'bg-warning text-white hover:bg-warning/90',
        error: 'bg-error text-white hover:bg-error/90',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10',
        ghost: 'hover:bg-surface hover:text-primary',
      },
      size: {
        sm: 'h-9 px-md text-sm',
        md: 'h-10 px-lg',
        lg: 'h-11 px-xl text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Trust Signal Component** (maintains credibility across white-labels):
```tsx
// components/ui/verification-badge.tsx
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeType = 'verified' | 'audited' | 'transparent';

interface VerificationBadgeProps {
  type: BadgeType;
  className?: string;
}

const badgeConfig = {
  verified: {
    icon: CheckCircle,
    label: 'Verified Business',
    description: 'Identity confirmed via business registry',
  },
  audited: {
    icon: ShieldCheck,
    label: 'Audited Data',
    description: 'Third-party data verification',
  },
  transparent: {
    icon: ShieldCheck,
    label: 'Policy Transparency',
    description: 'Published governance documentation',
  },
};

export function VerificationBadge({ type, className }: VerificationBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-secondary/10 border border-secondary/20',
        'transition-all duration-DEFAULT hover:bg-secondary/20',
        className
      )}
      title={config.description}
    >
      <Icon className="w-4 h-4 text-secondary" />
      <span className="text-sm font-medium text-secondary">
        {config.label}
      </span>
    </div>
  );
}

// ✅ TRUST SIGNAL MAINTAINED:
// - Badge visual adapts to brand colors (bg-secondary, text-secondary)
// - Icon and messaging remain consistent ("Verified Business")
// - Functionality unchanged across white-label deployments
```

**Dynamic Logo Component**:
```tsx
// components/brand/dynamic-logo.tsx
'use client';

import Image from 'next/image';
import { useTheme } from '@/app/providers/theme-provider';

export function DynamicLogo() {
  const { brandConfig, theme } = useTheme();

  // Use dark logo in dark mode, light logo in light mode
  const logoUrl = theme === 'dark'
    ? brandConfig.assets.logo.dark
    : brandConfig.assets.logo.light;

  return (
    <Image
      src={logoUrl}
      alt={`${brandConfig.name} Logo`}
      width={140}
      height={32}
      priority
      className="object-contain"
    />
  );
}
```

---

## White-Label Deployment Workflow

### Step 1: Create New Brand Preset (5 minutes)

```typescript
// config/brand-presets.ts
export const BRAND_PRESETS = {
  // ... existing presets

  'client-xyz': {
    id: 'client-xyz',
    name: 'Client XYZ Analytics',
    tagline: 'AI Visibility Platform',
    description: 'Custom white-label instance for Client XYZ',
    colors: {
      primary: '#EA580C',          // Client brand color
      secondary: '#0891B2',
      // ... rest of color palette
    },
    fonts: {
      heading: 'Montserrat',       // Client custom font
      body: 'Open Sans',
      mono: 'JetBrains Mono',
    },
    spacing: {
      borderRadius: '8px',
      scale: 4,
    },
    effects: {
      transitionSpeed: '200ms',
      shadowElevation: 'medium',
    },
    assets: {
      logo: {
        light: '/brands/client-xyz/logo.svg',
        dark: '/brands/client-xyz/logo-dark.svg',
      },
      favicon: '/brands/client-xyz/favicon.ico',
      ogImage: '/brands/client-xyz/og-image.png',
    },
  },
};
```

### Step 2: Add Brand Assets (2 minutes)

```bash
# Create brand directory
mkdir -p public/brands/client-xyz

# Add logo files (provided by client)
# - logo.svg (light mode logo)
# - logo-dark.svg (dark mode logo)
# - favicon.ico (browser favicon)
# - og-image.png (social media preview, 1200x630)
```

### Step 3: Create Environment Configuration (1 minute)

```env
# .env.client-xyz
NEXT_PUBLIC_BRAND_PRESET=client-xyz
NEXT_PUBLIC_APP_URL=https://clientxyz-analytics.com

# Optional: Override specific colors without changing preset
# NEXT_PUBLIC_PRIMARY_COLOR="#EA580C"
```

### Step 4: Build and Deploy (2 minutes)

```bash
# Local testing
NEXT_PUBLIC_BRAND_PRESET=client-xyz npm run dev

# Production build
NEXT_PUBLIC_BRAND_PRESET=client-xyz npm run build

# Deploy to Vercel
vercel --prod \
  --name clientxyz-analytics \
  --env NEXT_PUBLIC_BRAND_PRESET=client-xyz
```

**Total setup time**: ~10 minutes from brand assets to deployed white-label instance

---

## White-Label Quality Checklist

Before deploying a new white-label instance:

### Brand Identity ✅
- [ ] Logo files uploaded to `/public/brands/{client}/`
  - [ ] `logo.svg` (light mode, SVG format)
  - [ ] `logo-dark.svg` (dark mode, SVG format)
  - [ ] `favicon.ico` (16x16, 32x32, 48x48)
  - [ ] `og-image.png` (1200x630, <300KB)
- [ ] Brand colors defined in preset configuration
- [ ] Font licenses verified (if using custom fonts beyond Google Fonts)
- [ ] Color contrast ratios verified (WCAG AA compliance: 4.5:1 text, 3:1 UI components)

### Configuration ✅
- [ ] `.env.production` created with all brand tokens
- [ ] `NEXT_PUBLIC_BRAND_PRESET` set to correct preset ID
- [ ] Typography scales tested on all viewports (mobile, tablet, desktop)
- [ ] Border radius values consistent with brand guidelines
- [ ] Spacing scale appropriate for content density

### Trust Signals (Must Maintain) ✅
- [ ] Verification badges visible with branded colors
- [ ] Source transparency indicators functioning
- [ ] Methodology explainers accessible ("How it works" modals)
- [ ] Audit icons displaying correctly
- [ ] Data refresh timestamps showing
- [ ] Citation tooltips working on hover

### Functionality ✅
- [ ] All features working with branded theme
- [ ] Dark/light mode toggle functioning correctly
- [ ] Responsive design tested (320px mobile → 1920px desktop)
- [ ] No hardcoded "Apex" text in UI (use `brandConfig.brandName`)
- [ ] Analytics tracking updated with client domain
- [ ] Email templates updated with client branding
- [ ] Error pages (404, 500) showing branded logo

### Performance ✅
- [ ] Bundle size <500kB per chunk
- [ ] Lighthouse score >90 (performance, accessibility, SEO)
- [ ] Font loading optimized (no FOUT - Flash of Unstyled Text)
- [ ] Images optimized for client brand assets (WebP, lazy loading)
- [ ] CSS custom properties applied without layout shift

### Brand Values Preservation ✅
- [ ] Trust signals (verification badges) visible and functioning
- [ ] Impact Index calculations displaying correctly
- [ ] Innovation metrics (AI insights) prominently featured
- [ ] Transparency modals (methodology) accessible
- [ ] Community/partnership networks visualizing with branded colors
- [ ] Authority signals (rankings/leaderboards) operational

---

## Technical Architecture Diagrams

### Environment Variables → CSS Variables Flow

```
┌─────────────────────────────────────────┐
│   .env / .env.production                │
│   NEXT_PUBLIC_BRAND_PRESET=apex         │
│   NEXT_PUBLIC_PRIMARY_COLOR=#4926FA     │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   config/brand-presets.ts               │
│   export const BRAND_PRESETS = {        │
│     apex: { colors: {...}, fonts: {...} }│
│   }                                      │
│   export const ACTIVE_BRAND = BRAND_... │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   app/providers/theme-provider.tsx      │
│   useEffect(() => {                      │
│     root.style.setProperty('--primary', │
│       brandConfig.colors.primary)       │
│   })                                     │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   tailwind.config.ts                    │
│   colors: {                              │
│     primary: 'var(--primary)',          │
│     secondary: 'var(--secondary)',      │
│   }                                      │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   components/ui/button.tsx              │
│   className="bg-primary text-white"     │
│                                          │
│   ✅ Automatically inherits brand color │
└─────────────────────────────────────────┘
```

### Component Theming Hierarchy

```
ThemeProvider (app/providers/theme-provider.tsx)
│
├─ Applies CSS variables from ACTIVE_BRAND
│  ├─ --primary: #4926FA
│  ├─ --secondary: #3B82F6
│  ├─ --success: #17CA29
│  └─ ... (all brand tokens)
│
└─ Components use Tailwind classes
   │
   ├─ Button (bg-primary) → var(--primary)
   ├─ Card (bg-surface) → var(--surface)
   ├─ Badge (text-secondary) → var(--secondary)
   └─ Logo (DynamicLogo) → brandConfig.assets.logo
```

---

## White-Label Best Practices

### DO ✅

1. **Use CSS custom properties for all colors/fonts/spacing**
   ```tsx
   // ✅ GOOD - Uses theme token
   <div className="bg-primary text-white">...</div>

   // ❌ BAD - Hardcoded color
   <div className="bg-[#4926FA] text-white">...</div>
   ```

2. **Reference brand name from config**
   ```tsx
   // ✅ GOOD
   const { brandConfig } = useTheme();
   <h1>{brandConfig.name}</h1>

   // ❌ BAD
   <h1>Apex</h1>
   ```

3. **Use DynamicLogo component for brand logo**
   ```tsx
   // ✅ GOOD
   import { DynamicLogo } from '@/components/brand/dynamic-logo';
   <DynamicLogo />

   // ❌ BAD
   <img src="/logo.svg" alt="Logo" />
   ```

4. **Maintain trust signals across all white-label instances**
   ```tsx
   // ✅ GOOD - Trust signal preserved
   <VerificationBadge type="verified" />
   // Badge color adapts, but messaging stays consistent

   // ❌ BAD - Removing trust signal
   {/* Verification badge removed for cleaner look */}
   ```

5. **Test with multiple brand presets locally**
   ```bash
   # ✅ GOOD - Test all presets before deploying
   NEXT_PUBLIC_BRAND_PRESET=apex npm run dev
   NEXT_PUBLIC_BRAND_PRESET=enterprise npm run dev
   NEXT_PUBLIC_BRAND_PRESET=african-markets npm run dev
   ```

### DON'T ❌

1. **Don't hardcode brand-specific values in components**
   ```tsx
   // ❌ BAD - Hardcoded brand name
   <title>Apex - The Credibility Engine</title>

   // ✅ GOOD - Dynamic brand name
   <title>{brandConfig.name} - {brandConfig.tagline}</title>
   ```

2. **Don't bypass theme tokens for "quick fixes"**
   ```tsx
   // ❌ BAD - Inline style bypassing theme
   <div style={{ color: '#4926FA' }}>...</div>

   // ✅ GOOD - Uses theme token
   <div className="text-primary">...</div>
   ```

3. **Don't remove trust signals to "simplify" UI**
   ```tsx
   // ❌ BAD - Removing verification badge
   // {showVerificationBadge && <VerificationBadge />}

   // ✅ GOOD - Always show trust signals
   <VerificationBadge type="verified" />
   ```

4. **Don't assume font availability**
   ```tsx
   // ❌ BAD - No fallback fonts
   font-family: 'Custom Brand Font';

   // ✅ GOOD - Fallback chain
   font-family: var(--font-heading), 'Inter Display', sans-serif;
   ```

---

## Future Enhancements

### Phase 1 (Completed) ✅
- Environment variable system
- CSS custom properties architecture
- ThemeProvider with dynamic config
- Tailwind integration
- Brand preset system

### Phase 2 (Planned)
- [ ] Visual preset editor (admin UI to create presets)
- [ ] Real-time theme preview (see changes before deploying)
- [ ] Brand asset validation (check logo dimensions, contrast ratios)
- [ ] Automated white-label testing (Playwright tests per preset)

### Phase 3 (Future)
- [ ] Multi-tenant database architecture (single DB, multiple white-labels)
- [ ] Client-specific feature flags (enable/disable features per client)
- [ ] Advanced branding (animations, custom illustrations)
- [ ] White-label marketplace (pre-built industry-specific themes)

---

## Support & Documentation

### Creating a New White-Label Client

**Quick Start Guide** (5 minutes):

1. Add brand preset to `config/brand-presets.ts`
2. Upload logo files to `public/brands/{client}/`
3. Create `.env.{client}` with brand preset ID
4. Test locally: `NEXT_PUBLIC_BRAND_PRESET={client} npm run dev`
5. Deploy: `vercel deploy --prod --env NEXT_PUBLIC_BRAND_PRESET={client}`

### Troubleshooting

**Issue**: Colors not updating after changing brand preset
- **Solution**: Check that CSS variables are applied in ThemeProvider
- **Debug**: Inspect `<html>` element → Styles → Custom properties

**Issue**: Logo not showing
- **Solution**: Verify logo path matches `brandConfig.assets.logo.light/dark`
- **Debug**: Check browser console for 404 errors on logo path

**Issue**: Font not loading
- **Solution**: Ensure font is available (Google Fonts or self-hosted in `/public/fonts/`)
- **Debug**: Check Network tab for font file requests

---

## Conclusion

The Apex white-label architecture enables:

✅ **Rapid customization** (<1 hour setup per client)
✅ **Brand consistency** (maintain trust signals across deployments)
✅ **Single codebase** (no code duplication per client)
✅ **Type-safe theming** (TypeScript + Tailwind IntelliSense)
✅ **Performance** (CSS variables, no runtime overhead)
✅ **Scalability** (unlimited white-label instances from one codebase)

**White-label mantra**: *"Change the colors, keep the credibility."*

Every white-label deployment maintains the core value proposition (Forbes+Gartner+BlackRock positioning) while adapting visual identity to client brand guidelines.
