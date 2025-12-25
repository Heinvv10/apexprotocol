import * as React from "react"
import { Loader2 } from "lucide-react"

import { EmptyState, EmptyStateProps } from "./empty-state"
import { cn } from "@/lib/utils"

// ==================== LoadingState Props ====================

/**
 * Props for LoadingState component
 *
 * Extends EmptyState but omits `icon` and `theme` which are preset to
 * Loader2 and "primary" respectively. All other EmptyState props are available
 * (variant, className, etc.) for customization.
 *
 * @example
 * ```tsx
 * // Basic loading state
 * <LoadingState />
 * ```
 *
 * @example
 * ```tsx
 * // With custom message
 * <LoadingState
 *   title="Loading competitors..."
 *   description="This may take a few moments"
 * />
 * ```
 */
interface LoadingStateProps extends Omit<EmptyStateProps, 'icon' | 'theme'> {
  /**
   * Loading message title
   *
   * The main text displayed while loading. Should be descriptive of
   * what is being loaded to provide context to users and assistive technologies.
   *
   * @default "Loading"
   * @example "Loading competitors..." | "Fetching data..." | "Processing request..."
   */
  title?: string

  /**
   * Loading description (optional)
   *
   * Additional context about the loading process. Can inform users
   * about expected wait time, what's happening, or provide tips.
   *
   * @example "This may take a few moments"
   * @example "Analyzing your data..."
   * @example "Please wait while we process your request"
   */
  description?: string

  /**
   * Show spinning animation
   *
   * Controls whether the spinner icon rotates and container pulses.
   * When true, applies `animate-spin` to icon and `animate-pulse` to container.
   * Disable for a static loading indicator (not recommended for UX).
   *
   * @default true
   */
  animated?: boolean

  /**
   * Spinner size
   *
   * Controls the overall size of the loading state including icon,
   * text size, and spacing. Inherits from EmptyState size variants.
   *
   * - `sm`: Compact (48px icon container, text-base title) - for sidebars, cards, tight spaces
   * - `md`: Medium (64px icon container, text-lg title) - default, most common
   * - `lg`: Large (80px icon container, text-xl title) - for main content, full-page loading
   *
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
}

// ==================== Main Component ====================

/**
 * LoadingState Component
 *
 * A specialized empty state component for loading scenarios. Extends EmptyState
 * with loading-specific defaults, animations, and accessibility features.
 *
 * ## Features
 * - 🔄 **Animated Spinner**: Rotating Loader2 icon with pulsing container
 * - 🎨 **Primary Theme**: Uses primary brand color (teal/cyan) by default
 * - ♿ **Accessibility**: Proper ARIA attributes (`role="status"`, `aria-live="polite"`)
 * - 📏 **Size Variants**: Small, medium, and large options
 * - 🎯 **Auto-Configuration**: Sensible defaults for instant use
 * - 🔧 **Customizable**: All EmptyState props available for override
 *
 * ## Accessibility Features
 * - **ARIA role="status"**: Identifies as a status update for screen readers
 * - **ARIA live region (polite)**: Announces loading state changes without interruption
 * - **ARIA label**: Combines "Loading: " prefix with title for clear context
 * - **Semantic HTML**: Uses proper section and heading elements
 * - **Visual indication**: Spinning animation provides visual feedback
 * - **No glow effect**: Disabled to reduce visual distraction during loading
 *
 * ## When to Use
 * - ✅ Initial page/component load (data fetching)
 * - ✅ Async operations (form submissions, API calls)
 * - ✅ Content transitions (navigating between views)
 * - ✅ Search/filter operations with noticeable delay
 * - ❌ Very quick operations (<200ms) - may cause flashing
 * - ❌ Background updates - use a subtle indicator instead
 *
 * ## Usage Guidelines
 * - Provide descriptive titles that indicate what's loading
 * - Use descriptions to set expectations (e.g., "This may take a minute")
 * - Choose size based on context (sm for cards, lg for full pages)
 * - Keep animated=true for better UX (default)
 * - Consider showing LoadingState only after a brief delay to avoid flashing
 *
 * @example
 * ```tsx
 * // Basic usage - default "Loading" message
 * {isLoading && <LoadingState />}
 * ```
 *
 * @example
 * ```tsx
 * // With custom message
 * <LoadingState
 *   title="Loading recommendations"
 *   description="Analyzing your data..."
 *   size="md"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Different sizes for different contexts
 * // Small - for cards or sidebars
 * <LoadingState
 *   size="sm"
 *   title="Loading..."
 * />
 *
 * // Large - for main content areas
 * <LoadingState
 *   size="lg"
 *   title="Loading dashboard"
 *   description="Fetching your latest data..."
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Conditional rendering with delay to prevent flashing
 * const [showLoading, setShowLoading] = useState(false)
 *
 * useEffect(() => {
 *   const timer = setTimeout(() => setShowLoading(true), 300)
 *   return () => clearTimeout(timer)
 * }, [])
 *
 * {isLoading && showLoading && (
 *   <LoadingState title="Loading competitors..." />
 * )}
 * ```
 *
 * @example
 * ```tsx
 * // Different variants
 * <LoadingState
 *   variant="compact"  // No minimum height
 *   title="Loading..."
 * />
 *
 * <LoadingState
 *   variant="inline"  // Horizontal layout
 *   title="Saving..."
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom styling
 * <LoadingState
 *   title="Processing upload"
 *   description="Please don't close this window"
 *   className="min-h-screen"
 *   iconContainerClassName="scale-125"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Static (non-animated) - not recommended but available
 * <LoadingState
 *   title="Loading..."
 *   animated={false}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // In a React Query component
 * function CompetitorsList() {
 *   const { data, isLoading } = useQuery('competitors', fetchCompetitors)
 *
 *   if (isLoading) {
 *     return (
 *       <LoadingState
 *         title="Loading competitors"
 *         description="Fetching the latest data..."
 *       />
 *     )
 *   }
 *
 *   return <CompetitorsTable data={data} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a Suspense boundary fallback
 * <Suspense
 *   fallback={
 *     <LoadingState
 *       title="Loading component"
 *       size="lg"
 *     />
 *   }
 * >
 *   <LazyComponent />
 * </Suspense>
 * ```
 */
function LoadingState({
  title = "Loading",
  description,
  animated = true,
  size = "md",
  iconContainerClassName,
  ...props
}: LoadingStateProps) {
  return (
    <EmptyState
      icon={Loader2}
      title={title}
      description={description}
      size={size}
      theme="primary"
      withGlow={false}
      role="status"
      ariaLive="polite"
      ariaLabel={`Loading: ${title}`}
      iconContainerClassName={cn(
        animated && "animate-pulse [&_svg]:animate-spin",
        iconContainerClassName
      )}
      {...props}
    />
  )
}

// ==================== Exports ====================

export { LoadingState }
export type { LoadingStateProps }
