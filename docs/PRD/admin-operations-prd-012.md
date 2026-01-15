# APEX MOBILE & RESPONSIVE DESIGN PRD v1.0
## PRD-ADMIN-012: Mobile-First Responsive Architecture

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Cross-Cutting Concern (All Phases)
**Scope**: Mobile-first responsive design, touch interactions, progressive web app features

---

## 1. EXECUTIVE SUMMARY

The Apex platform implements a comprehensive mobile-first responsive design strategy to ensure optimal user experience across all devices (320px mobile to 1920px+ desktop). This PRD documents the mobile-specific components, touch interactions, responsive patterns, and PWA features implemented throughout both admin and customer-facing systems.

**Implemented Features**:
- Mobile navigation components (bottom nav, hamburger menu, sidebar drawer)
- Touch-optimized interactions (swipeable cards, bottom sheets)
- Responsive breakpoint system (mobile-first approach)
- Safe area handling for notched devices
- Accessibility features for mobile (44px touch targets, ARIA labels)

**Key Differentiator**: Not a native mobile app, but a mobile-optimized web platform that works seamlessly across all devices without separate codebases.

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Users need to access Apex on mobile devices (phones, tablets)
- Touch interactions require different UX patterns than desktop mouse/keyboard
- Mobile screens require optimized layouts and navigation
- Users expect native app-like experience on mobile web
- Must work on all device sizes without requiring separate native apps

### 2.2 Business Goals
1. Provide seamless mobile experience without native app development
2. Ensure 100% feature parity between desktop and mobile
3. Optimize touch interactions for mobile-first users
4. Support offline capabilities (PWA)
5. Reduce bounce rate on mobile devices (target <30%)

### 2.3 Key Metrics
- **Mobile Traffic**: 40-60% of total users (typical for B2B SaaS)
- **Mobile Bounce Rate**: Target <30% (industry avg: 45%)
- **Mobile Task Completion**: Target 85%+ (vs desktop)
- **Touch Target Compliance**: 100% (44px minimum)
- **Responsive Breakpoints**: 320px, 768px, 1024px, 1280px, 1920px

---

## 3. TARGET USERS

| Role | Primary Mobile Use Case |
|------|-------------------------|
| **Marketing Manager** | Check campaign metrics on-the-go, respond to alerts |
| **Content Creator** | Review recommendations while brainstorming |
| **Brand Owner** | Monitor GEO score and platform mentions during meetings |
| **Sales Rep** | Access lead information and pipeline on mobile during calls |
| **Executive** | Review executive dashboard during travel |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Mobile-first responsive design (320px+)
- Touch-optimized interactions (swipe, tap, long-press)
- Mobile navigation components (bottom nav, hamburger menu)
- Safe area handling (notched devices like iPhone X+)
- PWA features (manifest, service worker, offline support)
- Accessibility (WCAG 2.1 AA touch target sizing)
- Mobile-specific UI patterns (bottom sheets, swipeable cards)

### 4.2 Out of Scope
- Native iOS/Android apps (separate development)
- Mobile-specific features not available on desktop
- Device-specific features (camera, GPS, push notifications via native APIs)
- App store distribution
- Native mobile gestures (3D Touch, haptic feedback)

### 4.3 Constraints
- Must use responsive web design (not separate mobile site)
- Must maintain single codebase (Next.js)
- Performance: Mobile page load <3s on 3G
- Touch targets: Minimum 44px x 44px (WCAG 2.1 AA)
- Viewport support: 320px (iPhone SE) to 1920px+ (desktop)

---

## 5. DETAILED REQUIREMENTS

### 5.1 Responsive Breakpoint System

**Tailwind CSS Configuration**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',   // Small tablets, large phones (landscape)
      'md': '768px',   // Tablets
      'lg': '1024px',  // Laptops, small desktops
      'xl': '1280px',  // Desktop
      '2xl': '1920px', // Large desktop
    },
  },
}
```

**Mobile-First Approach**:
- Base styles: Mobile (320px+)
- `sm:` prefix: Small tablets (640px+)
- `md:` prefix: Tablets (768px+)
- `lg:` prefix: Desktop (1024px+)

**Example Usage**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 columns tablet, 3 columns desktop */}
</div>
```

---

### 5.2 Mobile Navigation Components

#### 5.2.1 Mobile Bottom Navigation Bar

**Component**: `MobileBottomNav`
**File**: `src/components/mobile-navigation.tsx`

**Layout** (iPhone/Android):
```
┌─────────────────────────────────────────┐
│                                         │
│            Page Content                 │
│                                         │
├─────────────────────────────────────────┤ ← Bottom Navigation
│  [🏠]   [💡]   [📊]   [⚙️]   [👤]      │
│  Home   Recs   Score  Settings Profile  │
└─────────────────────────────────────────┘
```

**Features**:
- Fixed bottom position (always visible)
- 5 navigation items (Home, Recommendations, Score, Settings, Profile)
- Active state indicator (colored icon + top border)
- Safe area padding for notched devices (`safe-area-pb`)
- Touch target: 64px x 64px (44px minimum + padding)
- Hidden on desktop (`lg:hidden`)

**Navigation Items**:
```typescript
const bottomNavItems = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "recommendations", label: "Recs", icon: Lightbulb, href: "/dashboard/recommendations" },
  { id: "score", label: "Score", icon: BarChart2, href: "/dashboard/monitor" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  { id: "profile", label: "Profile", icon: User, href: "/dashboard/profile" },
];
```

**Accessibility**:
- ARIA labels for screen readers
- Keyboard navigation support
- Active state announced to screen readers
- Focus ring visible on keyboard navigation

---

#### 5.2.2 Mobile Hamburger Menu

**Component**: `MobileMenuTrigger`
**File**: `src/components/mobile-navigation.tsx`

**Layout**:
```
┌─────────────────────────────────────────┐
│ [☰]  APEX          AI Active 🟢         │ ← Mobile Header
├─────────────────────────────────────────┤
│                                         │
│            Page Content                 │
```

**Features**:
- Hamburger icon (☰) in top-left corner
- Opens full-screen sidebar drawer
- Transforms to X icon when open
- 44px x 44px touch target
- Hidden on desktop (`lg:hidden`)

---

#### 5.2.3 Mobile Sidebar Drawer

**Component**: `MobileSidebarDrawer`
**File**: `src/components/mobile-navigation.tsx`

**Layout** (Open State):
```
┌──────────────────────┐  ┌─────────────┐
│ [X]  APEX            │  │   Backdrop  │
├──────────────────────┤  │  (dimmed)   │
│                      │  │             │
│ 🏠 Dashboard         │  │             │
│ 📁 Portfolios        │  │             │
│ 📡 Monitor           │  │             │
│ 🎯 Competitive       │  │             │
│ ✏️  Create           │  │             │
│ ⚡ Engine Room       │  │             │
│ 💡 Recommendations   │  │             │
│ 🧠 Insights          │  │             │
│ ⚙️  Settings         │  │             │
│                      │  │             │
├──────────────────────┤  │             │
│ 👤 User Name         │  │             │
│ user@email.com       │  │             │
└──────────────────────┘  └─────────────┘
```

**Features**:
- Slide-in from left (300ms animation)
- Full-height drawer (100vh)
- Backdrop overlay (60% black with blur)
- 9 navigation items with icons
- User profile footer (Clerk integration)
- Auto-closes on route change
- Prevents body scroll when open

**Navigation Items**:
```typescript
const sidebarMenuItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Portfolios", icon: FolderKanban, href: "/dashboard/portfolios" },
  { label: "Monitor", icon: Monitor, href: "/dashboard/monitor" },
  { label: "Competitive", icon: Target, href: "/dashboard/competitive" },
  { label: "Create", icon: FileText, href: "/dashboard/create" },
  { label: "Engine Room", icon: Zap, href: "/dashboard/engine-room" },
  { label: "Recommendations", icon: Lightbulb, href: "/dashboard/recommendations" },
  { label: "Insights", icon: Brain, href: "/dashboard/insights" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];
```

---

### 5.3 Touch-Optimized Interactions

#### 5.3.1 Swipeable Card Component

**Component**: `SwipeableCard`
**File**: `src/components/mobile-navigation.tsx`

**Usage** (Recommendations Page):
```
┌─────────────────────────────────────────┐
│  Add FAQ Schema for Product Pages      │
│  💡 +15% visibility  ⏱️ 2hrs            │
│                                         │
│  ← Swipe Left (Dismiss)                │
│  → Swipe Right (Accept)                 │
└─────────────────────────────────────────┘
```

**Swipe Interactions**:
- **Swipe Right** (threshold: 80px) → Accept/Implement recommendation
- **Swipe Left** (threshold: 80px) → Dismiss recommendation
- Visual feedback during swipe (colored backgrounds)
- Snap-back animation if threshold not met
- Maximum swipe distance: 150px

**Visual Feedback**:
- Swipe Right → Green background (✓ icon) appears on left
- Swipe Left → Red background (✕ icon) appears on right
- Card follows finger during swipe (translateX)

**Keyboard Support** (Accessibility):
- Arrow Right / Enter → Accept
- Arrow Left / Delete → Dismiss
- Visual feedback for keyboard actions (200ms animation)
- ARIA live region announces action to screen readers

**Code Example**:
```typescript
<SwipeableCard
  onSwipeRight={() => handleAccept(recommendation)}
  onSwipeLeft={() => handleDismiss(recommendation)}
  ariaLabel={`Recommendation: ${recommendation.title}`}
>
  <RecommendationCard data={recommendation} />
</SwipeableCard>
```

---

#### 5.3.2 Bottom Sheet Component

**Component**: `BottomSheet`
**File**: `src/components/mobile-navigation.tsx`

**Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│       Page Content (dimmed)             │
│                                         │
├─────────────────────────────────────────┤
│ ╭───╮                                   │ ← Handle
│ │   │                                   │
│ ├───┤                                   │
│ │ Bottom Sheet Title                   │
│ │                                       │
│ │ [Action 1]                            │
│ │ [Action 2]                            │
│ │ [Action 3]                            │
│ │                                       │
│ │ [Cancel]                              │
└─────────────────────────────────────────┘
```

**Features**:
- Slides up from bottom (300ms animation)
- Backdrop overlay (60% black with blur)
- Drag handle at top (visual affordance)
- Maximum height: 80vh (scrollable if content overflows)
- Rounded top corners (border-radius: 16px)
- Prevents body scroll when open
- Click backdrop or swipe down to close

**Use Cases**:
- Action menus (Share, Export, Delete)
- Filters and sorting options
- Quick actions for list items
- Confirmation dialogs

**Code Example**:
```typescript
<BottomSheet
  isOpen={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  title="Filter Recommendations"
>
  <FilterOptions />
</BottomSheet>
```

---

### 5.4 Safe Area Handling

**Problem**: Notched devices (iPhone X+) have screen cutouts that overlap content.

**Solution**: Tailwind CSS custom utilities for safe area padding.

**CSS Implementation**:
```css
/* globals.css */
.safe-area-pt {
  padding-top: env(safe-area-inset-top);
}

.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-pl {
  padding-left: env(safe-area-inset-left);
}

.safe-area-pr {
  padding-right: env(safe-area-inset-right);
}
```

**Usage**:
```tsx
<header className="sticky top-0 safe-area-pt">
  {/* Header content - avoids notch */}
</header>

<nav className="fixed bottom-0 safe-area-pb">
  {/* Bottom nav - avoids home indicator */}
</nav>
```

**Affected Components**:
- `MobileHeader` → `safe-area-pt`
- `MobileBottomNav` → `safe-area-pb`
- Full-screen modals → All safe area classes

---

### 5.5 Responsive Grid System

**Desktop (3-column layout)**:
```
┌──────────┬──────────┬──────────┐
│  Card 1  │  Card 2  │  Card 3  │
├──────────┼──────────┼──────────┤
│  Card 4  │  Card 5  │  Card 6  │
└──────────┴──────────┴──────────┘
```

**Tablet (2-column layout)**:
```
┌──────────┬──────────┐
│  Card 1  │  Card 2  │
├──────────┼──────────┤
│  Card 3  │  Card 4  │
├──────────┼──────────┤
│  Card 5  │  Card 6  │
└──────────┴──────────┘
```

**Mobile (1-column layout)**:
```
┌──────────┐
│  Card 1  │
├──────────┤
│  Card 2  │
├──────────┤
│  Card 3  │
├──────────┤
│  Card 4  │
├──────────┤
│  Card 5  │
├──────────┤
│  Card 6  │
└──────────┘
```

**Code Implementation**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map((card) => (
    <Card key={card.id}>{card.content}</Card>
  ))}
</div>
```

---

### 5.6 Touch Target Sizing (WCAG 2.1 AA)

**Requirement**: All interactive elements must be at least 44px x 44px.

**Implementation**:
```tsx
// Button with minimum touch target
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon className="w-5 h-5" />
</button>

// Link with minimum touch target
<Link href="/dashboard" className="min-h-[44px] flex items-center">
  Dashboard
</Link>
```

**Components with Touch Targets**:
- Bottom navigation icons: 64px x 64px (44px + padding)
- Hamburger menu button: 44px x 44px
- Sidebar menu items: 48px height (44px + padding)
- Card action buttons: 44px x 44px
- Form inputs: 48px height

---

### 5.7 Mobile Header Component

**Component**: `MobileHeader`
**File**: `src/components/mobile-navigation.tsx`

**Layout**:
```
┌─────────────────────────────────────────┐
│ [☰]        APEX        AI Active 🟢     │
└─────────────────────────────────────────┘
```

**Features**:
- Sticky positioning (always visible on scroll)
- 56px height (standard mobile header)
- Hamburger menu trigger (left)
- APEX logo (center)
- AI status indicator (right)
- Safe area padding for notched devices
- Glassmorphism background (blur + opacity)

---

### 5.8 Responsive Typography

**Mobile-First Type Scale**:
```css
/* Mobile (base) */
.text-xs    { font-size: 0.75rem; }  /* 12px */
.text-sm    { font-size: 0.875rem; } /* 14px */
.text-base  { font-size: 1rem; }     /* 16px */
.text-lg    { font-size: 1.125rem; } /* 18px */
.text-xl    { font-size: 1.25rem; }  /* 20px */
.text-2xl   { font-size: 1.5rem; }   /* 24px */

/* Desktop (lg: breakpoint) */
lg:text-3xl { font-size: 1.875rem; } /* 30px */
lg:text-4xl { font-size: 2.25rem; }  /* 36px */
```

**Usage**:
```tsx
<h1 className="text-2xl lg:text-4xl font-bold">
  {/* 24px mobile, 36px desktop */}
  Dashboard
</h1>

<p className="text-sm lg:text-base">
  {/* 14px mobile, 16px desktop */}
  Description text
</p>
```

---

### 5.9 Mobile Card Layouts

**Desktop Card (3-tier hierarchy)**:
```tsx
<div className="card-primary p-6">
  <h2 className="text-xl">GEO Score</h2>
  <div className="text-4xl">72</div>
</div>
```

**Mobile Card (compact)**:
```tsx
<div className="card-primary p-4 lg:p-6">
  <h2 className="text-lg lg:text-xl">GEO Score</h2>
  <div className="text-3xl lg:text-4xl">72</div>
</div>
```

**Pattern**: Reduce padding and font sizes on mobile, restore on desktop.

---

### 5.10 Progressive Web App (PWA) Features

**Manifest File** (`public/manifest.json`):
```json
{
  "name": "Apex GEO/AEO Platform",
  "short_name": "Apex",
  "description": "AI-powered brand monitoring and optimization",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0A0F1A",
  "theme_color": "#00E5CC",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker** (Next.js built-in):
- Static asset caching
- Offline fallback page
- Background sync for form submissions

**Install Prompt**:
- Show "Add to Home Screen" banner on mobile
- Native app-like experience when installed
- Full-screen mode (no browser chrome)

---

## 6. API REQUIREMENTS

**Mobile-Specific APIs**: None (same API endpoints as desktop)

**Optimization**:
- Response compression (gzip/brotli)
- Image optimization (WebP with JPEG fallback)
- Lazy loading for images and charts
- Pagination for long lists (50 items per page)

**Network Handling**:
```typescript
// Detect slow network
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (connection && connection.effectiveType === '2g') {
  // Load low-res images
  // Disable auto-refresh
  // Show offline banner
}
```

---

## 7. DATABASE SCHEMA

**No mobile-specific schema changes** - same database as desktop.

**Optimization**:
- Mobile session tracking (device type, screen size)
- Touch interaction analytics (swipes, taps)
- Mobile performance metrics (page load time, FCP, LCP)

---

## 8. IMPLEMENTATION STATUS

### 8.1 Components Implemented
✅ `MobileBottomNav` - Bottom navigation bar (5 items)
✅ `MobileMenuTrigger` - Hamburger menu button
✅ `MobileSidebarDrawer` - Full-screen sidebar drawer (9 items)
✅ `MobileHeader` - Sticky mobile header with branding
✅ `SwipeableCard` - Touch-optimized swipeable component
✅ `BottomSheet` - Modal bottom sheet for actions

### 8.2 Features Implemented
✅ Responsive breakpoint system (Tailwind CSS)
✅ Touch target sizing (44px minimum)
✅ Safe area handling (notched devices)
✅ Keyboard navigation support (accessibility)
✅ Swipe interactions (left/right with visual feedback)
✅ ARIA labels and live regions (screen readers)
✅ Mobile-first typography scale
✅ Responsive grid system (1/2/3 columns)

### 8.3 Pages with Mobile Support
✅ All 46 customer dashboard pages (mobile-responsive)
✅ All 55+ admin operations pages (mobile-responsive)
✅ Authentication pages (sign-in, sign-up)
✅ Onboarding wizard (mobile-optimized)
✅ Settings and profile pages

---

## 9. SECURITY & COMPLIANCE

**Mobile-Specific Security**:
- HTTPS enforced (no HTTP)
- Secure cookies (HttpOnly, SameSite)
- Content Security Policy (CSP)
- No sensitive data in localStorage
- Session timeout on mobile (30 minutes)

**WCAG 2.1 AA Compliance**:
- Touch target sizing: 44px minimum ✅
- Color contrast: 4.5:1 minimum ✅
- Screen reader support: ARIA labels ✅
- Keyboard navigation: Full support ✅

---

## 10. TESTING STRATEGY

### 10.1 Device Testing
- iPhone SE (320px width) - Smallest supported
- iPhone 14 Pro (notched device)
- Samsung Galaxy S23 (Android)
- iPad Pro (tablet)
- Desktop browsers (Chrome, Safari, Firefox)

### 10.2 Touch Interaction Testing
- Swipe gestures (left/right with varying speeds)
- Pinch-to-zoom (disabled for UI elements)
- Long-press actions
- Multi-touch gestures
- Tap vs long-press differentiation

### 10.3 Network Testing
- 3G throttling (simulate slow networks)
- Offline mode (PWA functionality)
- Airplane mode (service worker fallback)
- Network switching (WiFi → 4G transition)

### 10.4 Accessibility Testing
- VoiceOver (iOS screen reader)
- TalkBack (Android screen reader)
- Keyboard navigation (external keyboard on mobile)
- Switch control (assistive technology)
- Color contrast analyzer

---

## 11. ACCEPTANCE CRITERIA

**Mobile Navigation**:
- [x] Bottom nav visible on mobile (<1024px)
- [x] Bottom nav hidden on desktop (≥1024px)
- [x] Hamburger menu opens/closes smoothly (300ms)
- [x] Sidebar drawer auto-closes on route change
- [x] Active state visible on current page
- [x] Touch targets ≥44px x 44px

**Responsive Layout**:
- [x] All pages work on 320px width (iPhone SE)
- [x] Grid system adapts: 1 column (mobile), 2 (tablet), 3 (desktop)
- [x] Typography scales appropriately per breakpoint
- [x] Images optimize for mobile (WebP with JPEG fallback)
- [x] Charts render correctly on mobile (touch-friendly)

**Touch Interactions**:
- [x] SwipeableCard responds to swipe gestures
- [x] Swipe threshold: 80px minimum
- [x] Visual feedback during swipe
- [x] Snap-back animation if threshold not met
- [x] Keyboard support for accessibility

**PWA Features**:
- [x] Manifest file present and valid
- [x] Service worker registers successfully
- [x] "Add to Home Screen" prompt appears
- [x] Offline fallback page displays
- [x] Icons render correctly on home screen

**Performance**:
- [x] Mobile page load <3s on 3G
- [x] First Contentful Paint (FCP) <1.8s
- [x] Largest Contentful Paint (LCP) <2.5s
- [x] Cumulative Layout Shift (CLS) <0.1
- [x] Time to Interactive (TTI) <3.5s

**Accessibility**:
- [x] All touch targets ≥44px
- [x] Screen reader announces actions
- [x] Keyboard navigation works on mobile (external keyboard)
- [x] Color contrast ≥4.5:1
- [x] Focus indicators visible

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: Cross-cutting (implemented during all phases)

**Dependencies**:
- Tailwind CSS configuration ✅
- Next.js App Router ✅
- Lucide icons ✅
- Clerk authentication (mobile-optimized) ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Native App Development**: Should we build native iOS/Android apps for advanced features (push notifications, camera)?
   - **Recommendation**: Defer until web platform proves product-market fit

2. **Offline Capabilities**: How much functionality should work offline?
   - **Recommendation**: Read-only access to cached data, queue writes for later

3. **Touch Gestures**: Should we support additional gestures (pinch-to-zoom on charts)?
   - **Recommendation**: Add for charts only, not for UI navigation

4. **PWA Install Prompt**: When should we show "Add to Home Screen"?
   - **Recommendation**: After 3rd visit or when user completes onboarding

---

## 14. APPENDIX

### 14.1 Mobile Component Integration Example

**Customer Dashboard Page** (`src/app/dashboard/page.tsx`):
```tsx
import { MobileHeader, MobileBottomNav } from "@/components/mobile-navigation";

export default function DashboardLayout({ children }) {
  return (
    <>
      {/* Mobile header (hidden on desktop) */}
      <MobileHeader />

      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="hidden lg:block">
        <DesktopSidebar />
      </aside>

      {/* Main content */}
      <main className="pb-16 lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav (hidden on desktop) */}
      <MobileBottomNav />
    </>
  );
}
```

### 14.2 Responsive Card Example

```tsx
<div className="card-primary p-4 lg:p-6">
  <h2 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-4">
    GEO Score
  </h2>
  <div className="text-3xl lg:text-5xl font-bold text-primary">
    72
  </div>
  <p className="text-sm lg:text-base text-muted-foreground mt-2">
    +12 points this month
  </p>
</div>
```

**Pattern**:
- Smaller padding on mobile (`p-4` → `lg:p-6`)
- Smaller text on mobile (`text-lg` → `lg:text-xl`)
- Smaller spacing on mobile (`mb-2` → `lg:mb-4`)

### 14.3 Mobile Optimization Checklist

**Before Deployment**:
- [ ] Test on real devices (iPhone, Android)
- [ ] Verify touch targets ≥44px
- [ ] Check safe area padding on notched devices
- [ ] Test swipe gestures on recommendations
- [ ] Verify PWA install prompt appears
- [ ] Check offline functionality
- [ ] Test on slow 3G network
- [ ] Verify keyboard navigation works
- [ ] Test with VoiceOver/TalkBack screen readers
- [ ] Check Lighthouse mobile score (target: ≥90)

---

**Next PRD**: None (PRD-012 is final - covers cross-cutting mobile concerns)

**Related PRDs**:
- PRD-011 (Customer Dashboard) - All pages mobile-responsive
- PRD-001 to PRD-010 (Admin Operations) - All pages mobile-responsive
