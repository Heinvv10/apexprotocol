# EmptyState Component System

A unified, accessible component system for displaying empty states, loading states, and error states with consistent messaging, illustrations, and call-to-action patterns.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Components](#components)
  - [EmptyState](#emptystate)
  - [LoadingState](#loadingstate)
  - [ErrorState](#errorstate)
  - [Pre-configured Examples](#pre-configured-examples)
- [Component API](#component-api)
- [Usage Examples](#usage-examples)
- [Variants & Themes](#variants--themes)
- [Accessibility](#accessibility)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

---

## Overview

The EmptyState component system provides a consistent, accessible way to handle empty data states, loading scenarios, and errors throughout the application. It replaces multiple inconsistent implementations with a unified design system component.

### Key Features

- 🎨 **Multiple Variants**: Default, compact, inline, and card layouts
- 📏 **Size Options**: Small, medium, and large (affects spacing, typography, icons)
- 🎯 **Theme System**: 6 semantic themes (default, primary, success, warning, error, muted)
- ✨ **Animated Glow**: Optional pulsing gradient effect on icons
- ♿ **Accessibility**: Full WCAG 2.1 AA compliance with ARIA support
- 🔘 **Action Buttons**: Primary and secondary actions with icons and loading states
- 🎭 **Flexible Icons**: Any lucide-react icon with size and color variants
- 📱 **Responsive**: Adapts to mobile and desktop with breakpoint-aware layouts

### Why Use This System?

**Before:** 3+ different empty state implementations with ~200 lines of duplicated code
**After:** Single unified system with consistent UX, better accessibility, and 60% less code

---

## Installation

The components are already installed in your project. Import them from the centralized export:

```tsx
import { EmptyState, LoadingState, ErrorState } from '@/components/ui/empty-states'

// Or import pre-configured examples
import { NoCompetitorsState, SearchNoResultsState } from '@/components/ui/empty-states/examples'
```

---

## Components

### EmptyState

The base component for all empty state scenarios. Highly customizable with props for content, styling, actions, and accessibility.

**When to use:**
- No data available (empty lists, tables, dashboards)
- Search returned no results
- User hasn't created any items yet
- Filters resulted in no matches
- Permission-based empty states

```tsx
<EmptyState
  icon={Users}
  title="No competitors added"
  description="Add competitors to start tracking their performance"
  theme="primary"
  primaryAction={{
    label: "Add Competitor",
    icon: Plus,
    onClick: handleAdd
  }}
/>
```

### LoadingState

A specialized component for loading scenarios with animated spinner and proper ARIA attributes.

**When to use:**
- Initial page/component load (data fetching)
- Async operations (form submissions, API calls)
- Content transitions (navigating between views)
- Search/filter operations with noticeable delay

**When NOT to use:**
- Very quick operations (<200ms) - may cause flashing
- Background updates - use a subtle indicator instead

```tsx
<LoadingState
  title="Loading competitors"
  description="Fetching the latest data..."
  size="md"
/>
```

### ErrorState

A specialized component for error scenarios with retry functionality and assertive ARIA announcements.

**When to use:**
- Failed API requests or network errors
- Form submission failures
- File upload/download errors
- Permission or authentication errors
- Resource not found (404-like scenarios)

**When NOT to use:**
- Inline form validation (use field-level errors instead)
- Non-critical warnings (use warning theme or toast instead)

```tsx
<ErrorState
  title="Failed to load data"
  error={error}
  onRetry={refetch}
  onDismiss={handleDismiss}
/>
```

### Pre-configured Examples

Ready-to-use components for common scenarios:

- **NoCompetitorsState** - Empty competitor tracking
- **NoRecommendationsState** - No insights/recommendations available
- **NoDataState** - Generic no data scenario
- **SearchNoResultsState** - Search returned no results
- **PermissionDeniedState** - Access restriction
- **OfflineState** - Network connectivity issues

```tsx
import { NoCompetitorsState } from '@/components/ui/empty-states/examples'

<NoCompetitorsState onAddCompetitor={handleAdd} size="lg" />
```

---

## Component API

### EmptyState Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **Required** | Main heading text shown to the user |
| `description` | `string` | `undefined` | Supporting description text with context or instructions |
| `icon` | `LucideIcon` | `undefined` | Icon component from lucide-react |
| `variant` | `"default" \| "compact" \| "inline" \| "card"` | `"default"` | Layout variant (see [Variants](#variants--themes)) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant affecting spacing, typography, and icons |
| `theme` | `"default" \| "primary" \| "success" \| "warning" \| "error" \| "muted"` | `"default"` | Color theme for icon and visual accents |
| `primaryAction` | `EmptyStatePrimaryAction` | `undefined` | Primary call-to-action button |
| `secondaryAction` | `EmptyStateSecondaryAction` | `undefined` | Secondary/alternative action button |
| `minHeight` | `string` | `undefined` | Custom minimum height (CSS value) |
| `maxWidth` | `string` | `undefined` | Custom maximum width (CSS class) |
| `className` | `string` | `undefined` | Additional CSS classes for container |
| `withGlow` | `boolean` | Auto | Enable/disable animated glow effect |
| `glowColor` | `string` | Auto | Custom glow color (RGBA value) |
| `ariaLabel` | `string` | `title` | ARIA label for screen readers |
| `role` | `"region" \| "status" \| "alert"` | `"region"` | ARIA role for the container |
| `ariaLive` | `"polite" \| "assertive" \| "off"` | `"polite"` | ARIA live region politeness |
| `id` | `string` | `undefined` | ID for the container element |
| `iconContainerClassName` | `string` | `undefined` | Custom classes for icon container |
| `titleClassName` | `string` | `undefined` | Custom classes for title element |
| `descriptionClassName` | `string` | `undefined` | Custom classes for description element |
| `actionsClassName` | `string` | `undefined` | Custom classes for actions container |

### Action Props

**EmptyStatePrimaryAction:**
```typescript
{
  label: string                    // Button label text
  icon?: LucideIcon                // Optional icon before label
  onClick: () => void              // Click handler
  disabled?: boolean               // Disable button
  loading?: boolean                // Show loading spinner
  variant?: "default" | "destructive" | "outline" | "secondary"
}
```

**EmptyStateSecondaryAction:**
```typescript
{
  label: string                    // Button label text
  icon?: LucideIcon                // Optional icon before label
  onClick: () => void              // Click handler
  disabled?: boolean               // Disable button
  loading?: boolean                // Show loading spinner
  variant?: "outline" | "ghost"    // Limited to subtle variants
}
```

### LoadingState Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Loading"` | Loading message title |
| `description` | `string` | `undefined` | Additional context about loading |
| `animated` | `boolean` | `true` | Show spinning animation |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant |
| *All EmptyState props except `icon` and `theme`* | | | Inherited from EmptyState |

### ErrorState Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Something went wrong"` | Error message title |
| `description` | `string` | `undefined` | Additional context about the error |
| `error` | `Error \| string` | `undefined` | Error object or message (auto-extracted) |
| `onRetry` | `() => void` | `undefined` | Retry action handler |
| `retryLabel` | `string` | `"Try Again"` | Retry button label |
| `onDismiss` | `() => void` | `undefined` | Dismiss action handler |
| `dismissLabel` | `string` | `"Dismiss"` | Dismiss button label |
| *All EmptyState props except `icon`, `theme`, and `primaryAction`* | | | Inherited from EmptyState |

---

## Usage Examples

### Basic Empty State

```tsx
// Minimal usage - just title
<EmptyState title="No data available" />

// With icon and description
<EmptyState
  icon={Inbox}
  title="No messages"
  description="Your inbox is empty"
/>
```

### With Actions

```tsx
// Primary action only
<EmptyState
  icon={Users}
  title="No competitors added"
  description="Add competitors to start tracking their performance"
  primaryAction={{
    label: "Add Competitor",
    icon: Plus,
    onClick: () => setModalOpen(true)
  }}
/>

// Both primary and secondary actions
<EmptyState
  icon={FileText}
  title="No documents"
  description="Upload documents to start organizing"
  primaryAction={{
    label: "Upload Document",
    icon: Upload,
    onClick: handleUpload,
    variant: "default"
  }}
  secondaryAction={{
    label: "Browse Templates",
    icon: Grid,
    onClick: handleBrowse,
    variant: "ghost"
  }}
/>
```

### Different Sizes

```tsx
// Small - for sidebars, cards, tight spaces
<EmptyState
  size="sm"
  icon={Search}
  title="No results"
  description="Try different keywords"
/>

// Medium (default) - most common use case
<EmptyState
  size="md"
  icon={Users}
  title="No users found"
/>

// Large - for main content areas
<EmptyState
  size="lg"
  icon={Database}
  title="Database is empty"
  description="Import data to get started"
/>
```

### Loading States

```tsx
// Basic loading
<LoadingState />

// Custom message
<LoadingState
  title="Loading competitors"
  description="This may take a few moments"
/>

// Different sizes
<LoadingState size="sm" title="Loading..." />
<LoadingState size="lg" title="Loading dashboard" />

// Delay to prevent flashing
const [showLoading, setShowLoading] = useState(false)

useEffect(() => {
  const timer = setTimeout(() => setShowLoading(true), 300)
  return () => clearTimeout(timer)
}, [])

{isLoading && showLoading && <LoadingState title="Loading..." />}
```

### Error States

```tsx
// Basic error with retry
<ErrorState
  title="Failed to load"
  onRetry={refetch}
/>

// With Error object (auto-extracts message)
<ErrorState
  error={error}
  onRetry={handleRetry}
/>

// Custom error message
<ErrorState
  title="Upload failed"
  description="The file size exceeds the maximum limit of 10MB."
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>

// Custom labels
<ErrorState
  title="Payment failed"
  error="Payment gateway timeout"
  onRetry={handleRetry}
  retryLabel="Retry Payment"
  onDismiss={handleDismiss}
  dismissLabel="Cancel"
/>
```

### React Query Integration

```tsx
// With React Query
function CompetitorsList() {
  const { data, isLoading, error, refetch } = useQuery(
    'competitors',
    fetchCompetitors
  )

  if (isLoading) {
    return <LoadingState title="Loading competitors" />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load competitors"
        error={error}
        onRetry={() => refetch()}
      />
    )
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={Users}
        title="No competitors added"
        description="Add competitors to start tracking"
        primaryAction={{
          label: "Add Competitor",
          onClick: () => setModalOpen(true)
        }}
      />
    )
  }

  return <CompetitorsTable data={data} />
}
```

### Async Actions with Loading State

```tsx
const [loading, setLoading] = useState(false)

<EmptyState
  icon={Cloud}
  title="Not synced"
  description="Sync your data with the cloud"
  primaryAction={{
    label: "Sync Now",
    icon: RefreshCw,
    onClick: async () => {
      setLoading(true)
      await syncData()
      setLoading(false)
    },
    loading
  }}
/>
```

### Pre-configured Examples

```tsx
import {
  NoCompetitorsState,
  SearchNoResultsState,
  PermissionDeniedState
} from '@/components/ui/empty-states/examples'

// No competitors
<NoCompetitorsState
  onAddCompetitor={() => setModalOpen(true)}
  size="lg"
/>

// Search no results
<SearchNoResultsState
  searchQuery={query}
  onClearSearch={() => setQuery('')}
/>

// Permission denied
<PermissionDeniedState
  title="Premium Feature"
  description="Upgrade to access advanced analytics"
  onNavigateAway={() => navigate('/dashboard')}
  onRequestAccess={() => navigate('/pricing')}
  requestLabel="View Plans"
/>
```

---

## Variants & Themes

### Layout Variants

**Default** (`variant="default"`)
- Centered vertical layout
- Text alignment: center
- Min height based on size
- Use for: Most empty states

```tsx
<EmptyState variant="default" title="No data" />
```

**Compact** (`variant="compact"`)
- Centered vertical layout
- No minimum height
- Reduced spacing
- Use for: Tight spaces, modals, sidebars

```tsx
<EmptyState variant="compact" size="sm" title="No results" />
```

**Inline** (`variant="inline"`)
- Horizontal layout
- Text alignment: left
- Icon on left, content on right
- Use for: Sidebars, narrow spaces, inline messages

```tsx
<EmptyState variant="inline" icon={Filter} title="No filters applied" />
```

**Card** (`variant="card"`)
- Centered vertical layout
- Card background with padding
- Border and background color
- Use for: Visual separation, emphasis

```tsx
<EmptyState variant="card" title="Premium feature" />
```

### Size Variants

| Size | Icon Container | Title | Description | Min Height | Use Case |
|------|---------------|-------|-------------|------------|----------|
| `sm` | 48px (w-12 h-12) | text-base | text-xs | 150px | Sidebars, cards, compact spaces |
| `md` | 64px (w-16 h-16) | text-lg | text-sm | 200px | Default, most common |
| `lg` | 80px (w-20 h-20) | text-xl | text-base | 300px | Main content, full-page empty states |

### Theme Variants

| Theme | Color | Icon/Border | Glow Color | Use Case |
|-------|-------|-------------|------------|----------|
| `default` | Muted gray | `bg-muted/10` | None | Generic empty states |
| `primary` | Teal/cyan | `bg-primary/10` | Teal glow | Branded actions, positive CTAs |
| `success` | Green | `bg-success/10` | Green glow | Completed states, positive outcomes |
| `warning` | Yellow/amber | `bg-warning/10` | Yellow glow | Warnings, caution needed |
| `error` | Red | `bg-error/10` | Red glow | Errors, failures, destructive actions |
| `muted` | Subtle gray | `bg-muted/5` | None | Low-priority, background states |

**Theme Selection Guidelines:**
- Use `primary` for new item creation and branded actions
- Use `success` for completed or positive states
- Use `warning` for permission issues or cautionary states
- Use `error` for errors and failures (automatically used by ErrorState)
- Use `default` for general empty states
- Use `muted` for low-emphasis empty states

### Glow Effect

The animated glow effect is automatically enabled for certain theme + variant combinations:

**Auto-enabled:**
- `variant="default"` + `theme="primary" | "success" | "warning" | "error"`

**Manual control:**
```tsx
// Force enable
<EmptyState theme="default" withGlow={true} />

// Force disable
<EmptyState theme="primary" withGlow={false} />

// Custom glow color
<EmptyState
  theme="primary"
  withGlow={true}
  glowColor="rgba(255, 0, 0, 0.4)"
/>
```

---

## Accessibility

The EmptyState component system is fully accessible and meets **WCAG 2.1 Level AA** standards.

### Key Accessibility Features

✅ **ARIA Attributes**
- Configurable roles: `region` (default), `status`, `alert`
- ARIA labels derived from title or customizable
- ARIA live regions for dynamic announcements
- Icons marked as `aria-hidden` to avoid redundancy

✅ **Keyboard Navigation**
- Full Tab/Shift+Tab support
- Enter/Space to activate buttons
- Logical tab order (primary → secondary action)
- Visible focus indicators

✅ **Screen Reader Support**
- Compatible with NVDA, JAWS, VoiceOver, Narrator
- Proper semantic HTML (`<section>`, `<h3>`, `<p>`, `<button>`)
- Clear announcements for all states

✅ **Color Contrast**
- All themes meet WCAG 2.1 AA (4.5:1 minimum)
- Most achieve AAA level (7:1+)
- Tested in light and dark modes

✅ **Reduced Motion**
- Respects `prefers-reduced-motion` preference
- Animations become static when user requests reduced motion

### Accessibility Examples

```tsx
// Default - uses title as ARIA label
<EmptyState
  title="No competitors added"
  description="Add competitors to start tracking"
/>
// Announces: "Region landmark, No competitors added, Add competitors to start tracking"

// Custom ARIA label for more context
<EmptyState
  icon={Search}
  title="No results"
  description="Try different keywords"
  ariaLabel="Search results: No items found for 'React'"
/>

// Loading state - status role with polite announcement
<LoadingState title="Loading data" />
// Announces: "Status, Loading: Loading data"

// Error state - alert role with assertive announcement
<ErrorState title="Failed to load" error={error} />
// Announces immediately: "Alert, Error: Failed to load, Network error"
```

For detailed accessibility information, see [empty-state-accessibility.md](./empty-state-accessibility.md).

---

## Migration Guide

### From Old Pattern to Unified System

**Before (Old Pattern):**
```tsx
// Custom empty state component (25-64 lines)
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center min-h-[200px]">
    <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center">
      <Users className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mt-4">No competitors added</h3>
    <p className="text-sm text-muted-foreground mt-2">
      Add competitors to start tracking
    </p>
    <Button onClick={handleAdd} className="mt-4">
      <Plus className="w-4 h-4" />
      Add Competitor
    </Button>
  </div>
)
```

**After (Unified System):**
```tsx
import { EmptyState } from '@/components/ui/empty-states'

<EmptyState
  icon={Users}
  title="No competitors added"
  description="Add competitors to start tracking"
  theme="primary"
  primaryAction={{
    label: "Add Competitor",
    icon: Plus,
    onClick: handleAdd
  }}
/>
```

### Migration Steps

1. **Import the new component**
   ```tsx
   import { EmptyState, LoadingState, ErrorState } from '@/components/ui/empty-states'
   ```

2. **Identify your current pattern**
   - Loading state? → Use `LoadingState`
   - Error state? → Use `ErrorState`
   - Empty data? → Use `EmptyState`

3. **Map props from old to new**
   ```tsx
   // Old custom props
   const CustomEmpty = ({ message, buttonLabel, onAction }) => { ... }

   // New unified props
   <EmptyState
     title={message}
     primaryAction={{ label: buttonLabel, onClick: onAction }}
   />
   ```

4. **Remove old code**
   - Delete custom empty state components
   - Remove unused imports
   - Clean up styling classes

5. **Test thoroughly**
   - Visual appearance matches design system
   - Accessibility (keyboard, screen reader)
   - Responsive behavior

### Component Migration Map

| Old Component | New Component | Notes |
|--------------|---------------|-------|
| Custom `EmptyState` | `EmptyState` | Add `theme="primary"` for branded look |
| Custom `LoadingState` | `LoadingState` | Includes spinner animation by default |
| Custom `CompetitorEmptyState` | `EmptyState` or `NoCompetitorsState` | Use pre-configured example |
| Custom `DiscoveryEmptyState` | `EmptyState` | Add `withGlow={true}` for emphasis |
| Custom error displays | `ErrorState` | Includes retry functionality |
| Simple empty divs | `EmptyState` | Add proper accessibility |

### Before & After Examples

**CompetitorManager Migration:**

Before (64 lines):
```tsx
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
    {/* ... 60+ lines of custom JSX ... */}
  </div>
)

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    {/* ... custom loading spinner ... */}
  </div>
)
```

After (10 lines):
```tsx
import { EmptyState, LoadingState } from '@/components/ui/empty-states'

{isLoading && <LoadingState title="Loading competitors" />}
{!isLoading && !competitors.length && (
  <EmptyState
    icon={Users}
    title="Track Your Competitors"
    description="Add competitors to monitor performance"
    theme="primary"
    primaryAction={{
      label: "Add Competitor",
      icon: Plus,
      onClick: () => setModalOpen(true)
    }}
  />
)}
```

**Code Reduction:** 64 lines → 10 lines (84% reduction)

---

## Best Practices

### DO ✅

**Content:**
- Provide clear, descriptive titles (avoid "Empty" or "Nothing here")
- Include helpful descriptions explaining why it's empty
- Suggest next steps or actions in description
- Use user-friendly language (not technical jargon)

**Visual Design:**
- Choose themes that match semantic meaning (error=red, success=green)
- Use appropriate icons that represent the empty state
- Enable glow effect for emphasis on key empty states
- Match size to context (sm for cards, lg for main content)

**Actions:**
- Always provide primary action when users can take action
- Use clear action labels ("Add Competitor" not just "Add")
- Include icons in action buttons for visual clarity
- Show loading states for async actions

**Accessibility:**
- Test with keyboard navigation (Tab, Enter, Space)
- Test with screen readers (NVDA, VoiceOver, JAWS)
- Use appropriate ARIA roles (region, status, alert)
- Provide clear ARIA labels for context

**Performance:**
- Delay loading states by 200-300ms to prevent flashing
- Use React Query's built-in states (isLoading, error)
- Memoize action handlers to prevent unnecessary re-renders

### DON'T ❌

**Content:**
- Use vague titles like "Empty" or "No data"
- Omit descriptions when context isn't obvious
- Use overly technical error messages
- Write excessively long descriptions (2-3 sentences max)

**Visual Design:**
- Use `role="alert"` for non-critical states
- Rely solely on color to convey meaning
- Override default spacing without good reason
- Use custom styling when variants can achieve the goal

**Actions:**
- Create multiple primary actions (use secondary instead)
- Use div elements with onClick instead of buttons
- Forget to handle loading states on async actions
- Use button labels without icons for common actions

**Accessibility:**
- Skip ARIA attributes for custom implementations
- Create keyboard traps or unexpected focus changes
- Ignore reduced motion preferences
- Use non-semantic HTML for actions

**Code Quality:**
- Duplicate empty state code across components
- Create custom empty states when unified system can handle it
- Forget to clean up old code after migration
- Skip testing after migration

### Common Patterns

**Search/Filter Results:**
```tsx
<EmptyState
  icon={Search}
  title="No results found"
  description="Try adjusting your search terms or filters"
  theme="default"
  primaryAction={{
    label: "Clear Filters",
    onClick: handleClear,
    variant: "outline"
  }}
/>
```

**First-Time User Experience:**
```tsx
<EmptyState
  icon={Sparkles}
  title="Welcome to Competitors"
  description="Track your competitors' performance and AI mentions"
  theme="primary"
  withGlow={true}
  size="lg"
  primaryAction={{
    label: "Get Started",
    icon: Plus,
    onClick: handleOnboard
  }}
/>
```

**Permission/Upgrade Prompt:**
```tsx
<PermissionDeniedState
  title="Premium Feature"
  description="Upgrade to Pro to access advanced analytics and unlimited tracking"
  onNavigateAway={() => navigate('/dashboard')}
  navigateLabel="Back to Dashboard"
  onRequestAccess={() => navigate('/pricing')}
  requestLabel="View Plans"
/>
```

**Contextual Help:**
```tsx
<EmptyState
  icon={Info}
  title="No recommendations available"
  description="Recommendations will appear here after we analyze your data. This usually takes 24-48 hours."
  theme="default"
  variant="card"
  secondaryAction={{
    label: "Learn More",
    icon: ExternalLink,
    onClick: () => window.open('/docs/recommendations'),
    variant: "ghost"
  }}
/>
```

---

## Related Documentation

- [Accessibility Guide](./empty-state-accessibility.md) - Detailed accessibility audit and testing
- [Design System](../APEX_DESIGN_SYSTEM.md) - Overall design system documentation
- [Button Component](../../src/components/ui/button.tsx) - Used for actions
- [Icon Library](https://lucide.dev) - lucide-react icons reference

## Component Files

- [EmptyState](../../src/components/ui/empty-state.tsx) - Base component
- [LoadingState](../../src/components/ui/loading-state.tsx) - Loading component
- [ErrorState](../../src/components/ui/error-state.tsx) - Error component
- [Examples](../../src/components/ui/empty-states/examples.tsx) - Pre-configured examples
- [Index](../../src/components/ui/empty-states/index.ts) - Central exports

---

## Support

For questions, issues, or feature requests related to the EmptyState component system:

1. Check existing JSDoc comments in component files
2. Review usage examples in this documentation
3. Check the accessibility guide for ARIA/keyboard questions
4. Review test files for edge cases and integration patterns

**Last Updated:** December 26, 2025
**Component Version:** 1.0.0
**Status:** ✅ Production Ready
