import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ==================== Action Interfaces ====================

/**
 * Base interface for action buttons in empty states
 *
 * Provides a consistent structure for action buttons throughout the application.
 * All action buttons support icons, loading states, and disabled states.
 *
 * @example
 * ```tsx
 * const action: EmptyStateAction = {
 *   label: "Create Item",
 *   icon: Plus,
 *   onClick: handleCreate,
 *   disabled: false,
 *   loading: isCreating
 * }
 * ```
 */
interface EmptyStateAction {
  /**
   * Button label text displayed to the user
   * @example "Add Competitor" | "Try Again" | "Go Back"
   */
  label: string

  /**
   * Optional icon component from lucide-react
   * Displayed before the label text
   * @example Plus | RefreshCw | ArrowLeft
   */
  icon?: LucideIcon

  /**
   * Click handler function invoked when the button is clicked
   * Should handle the action logic (e.g., open modal, navigate, submit)
   */
  onClick: () => void

  /**
   * Disable the button, preventing user interaction
   * Useful for form validation or permission-based restrictions
   * @default false
   */
  disabled?: boolean

  /**
   * Loading state for async actions
   * Shows a loading spinner and disables the button
   * @default false
   */
  loading?: boolean
}

/**
 * Primary action button configuration
 *
 * The main call-to-action in an empty state. Supports all button variants
 * for maximum flexibility, allowing emphasis control (default, destructive, etc.).
 *
 * Visual hierarchy: Primary actions are more prominent than secondary actions.
 *
 * @example
 * ```tsx
 * primaryAction={{
 *   label: "Add Competitor",
 *   icon: Plus,
 *   onClick: () => setModalOpen(true),
 *   variant: "default" // Emphasized
 * }}
 * ```
 *
 * @example
 * ```tsx
 * // Destructive primary action
 * primaryAction={{
 *   label: "Delete All",
 *   icon: Trash2,
 *   onClick: handleDeleteAll,
 *   variant: "destructive"
 * }}
 * ```
 */
interface EmptyStatePrimaryAction extends EmptyStateAction {
  /**
   * Button visual variant
   * - `default`: Primary blue button (recommended for most actions)
   * - `destructive`: Red button for dangerous actions
   * - `outline`: Bordered button for less emphasis
   * - `secondary`: Muted button for alternative actions
   * @default "default"
   */
  variant?: "default" | "destructive" | "outline" | "secondary"
}

/**
 * Secondary action button configuration
 *
 * An alternative or supporting action in an empty state. Limited to subtle
 * variants (outline, ghost) to maintain proper visual hierarchy with the
 * primary action.
 *
 * @example
 * ```tsx
 * secondaryAction={{
 *   label: "Learn More",
 *   icon: ExternalLink,
 *   onClick: () => window.open('/docs'),
 *   variant: "ghost"
 * }}
 * ```
 *
 * @example
 * ```tsx
 * // Cancel/dismiss action
 * secondaryAction={{
 *   label: "Dismiss",
 *   onClick: handleDismiss,
 *   variant: "ghost"
 * }}
 * ```
 */
interface EmptyStateSecondaryAction extends EmptyStateAction {
  /**
   * Button visual variant (limited to subtle variants)
   * - `outline`: Bordered button with transparent background
   * - `ghost`: Minimal button with no border or background
   * @default "outline"
   */
  variant?: "outline" | "ghost"
}

// ==================== CVA Variants ====================

/**
 * Container variants for the empty state component
 *
 * Defines the layout, spacing, and minimum height based on size and variant.
 * Uses class-variance-authority (CVA) for type-safe variant management.
 *
 * Variants:
 * - `default`: Centered layout with vertical stacking (most common)
 * - `compact`: Centered but no minimum height (for tight spaces)
 * - `inline`: Horizontal layout with left-aligned text (for sidebars)
 * - `card`: Centered with card background and padding (for emphasis)
 *
 * Sizes:
 * - `sm`: 150px minimum height, smaller text and spacing
 * - `md`: 200px minimum height, medium text and spacing (default)
 * - `lg`: 300px minimum height, larger text and spacing
 */
const emptyStateVariants = cva(
  "flex flex-col items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-center",
        compact: "text-center",
        inline: "flex-row items-center text-left",
        card: "text-center card-secondary p-8",
      },
      size: {
        sm: "min-h-[150px]",
        md: "min-h-[200px]",
        lg: "min-h-[300px]",
      },
    },
    compoundVariants: [
      {
        variant: "inline",
        className: "min-h-0",
      },
      {
        variant: "compact",
        className: "min-h-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

/**
 * Icon container variants
 *
 * Defines the visual styling for the icon container, including size,
 * theme colors, borders, and background colors. Each theme has carefully
 * chosen color combinations for optimal visual hierarchy and accessibility.
 *
 * Themes:
 * - `default`: Muted gray background with subtle border
 * - `primary`: Teal/cyan background matching primary brand color
 * - `success`: Green background for positive actions/states
 * - `warning`: Yellow/amber background for warnings
 * - `error`: Red background for errors and destructive actions
 * - `muted`: Very subtle gray background for low-emphasis states
 *
 * All themes use semi-transparent backgrounds with matching border colors
 * to maintain consistency across light and dark modes.
 */
const iconContainerVariants = cva(
  "relative rounded-2xl flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "w-12 h-12",
        md: "w-16 h-16",
        lg: "w-20 h-20",
      },
      theme: {
        default: "bg-muted/10 border border-border",
        primary: "bg-primary/10 border border-primary/30",
        success: "bg-success/10 border border-success/20",
        warning: "bg-warning/10 border border-warning/20",
        error: "bg-error/10 border border-error/30",
        muted: "bg-muted/5 border border-muted/20",
      },
    },
    defaultVariants: {
      size: "md",
      theme: "default",
    },
  }
)

/**
 * Icon color variants
 *
 * Defines the icon color based on theme. Icons use foreground colors
 * that match their container backgrounds for a cohesive visual design.
 */
const iconVariants = cva("", {
  variants: {
    theme: {
      default: "text-muted-foreground",
      primary: "text-primary",
      success: "text-success",
      warning: "text-warning",
      error: "text-error",
      muted: "text-muted-foreground/50",
    },
  },
  defaultVariants: {
    theme: "default",
  },
})

/**
 * Title typography variants
 *
 * Defines the heading text size and weight based on the component size.
 * Always uses font-semibold for proper visual hierarchy.
 */
const titleVariants = cva("font-semibold", {
  variants: {
    size: {
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

/**
 * Description typography variants
 *
 * Defines the description text size and opacity based on the component size.
 * Uses muted-foreground color with varying opacity for proper content hierarchy.
 */
const descriptionVariants = cva("", {
  variants: {
    size: {
      sm: "text-xs text-muted-foreground/70",
      md: "text-sm text-muted-foreground/80",
      lg: "text-base text-muted-foreground/90",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

// ==================== Size Mappings ====================

/**
 * Icon size mapping for each size variant
 *
 * Maps component size to the actual icon dimensions (width x height).
 * Ensures icons are proportional to the overall component size.
 */
const iconSizeMap = {
  sm: "w-6 h-6",   // 24px x 24px
  md: "w-8 h-8",   // 32px x 32px
  lg: "w-10 h-10", // 40px x 40px
} as const

/**
 * Spacing mapping for each size variant
 *
 * Defines the gap between elements (container, content, actions) for each size.
 * Maintains consistent rhythm and visual hierarchy across different sizes.
 */
const spacingMap = {
  sm: {
    container: "space-y-2", // 8px vertical spacing
    content: "space-y-1",   // 4px between title and description
    actions: "gap-2",       // 8px between buttons
  },
  md: {
    container: "space-y-4", // 16px vertical spacing
    content: "space-y-2",   // 8px between title and description
    actions: "gap-3",       // 12px between buttons
  },
  lg: {
    container: "space-y-6", // 24px vertical spacing
    content: "space-y-3",   // 12px between title and description
    actions: "gap-4",       // 16px between buttons
  },
} as const

/**
 * Button size mapping for each size variant
 *
 * Maps component size to the corresponding Button component size.
 * Ensures action buttons are proportional to the empty state size.
 */
const buttonSizeMap = {
  sm: "sm" as const,      // Small button
  md: "default" as const, // Default/medium button
  lg: "lg" as const,      // Large button
}

/**
 * Maximum width mapping for each size variant
 *
 * Constrains the content width for better readability.
 * Prevents overly wide text lines that are hard to read.
 */
const maxWidthMap = {
  sm: "max-w-sm", // 384px max width
  md: "max-w-md", // 448px max width
  lg: "max-w-lg", // 512px max width
} as const

/**
 * Glow color mapping for each theme
 *
 * Defines the radial gradient glow colors for the animated effect.
 * Only used when `withGlow` is true or auto-enabled for certain themes.
 * Uses RGBA for opacity control in the gradient.
 */
const glowColorMap: Record<string, string> = {
  primary: "rgba(0, 229, 204, 0.4)",  // Teal/cyan glow
  success: "rgba(34, 197, 94, 0.4)",  // Green glow
  warning: "rgba(251, 191, 36, 0.4)", // Yellow/amber glow
  error: "rgba(239, 68, 68, 0.4)",    // Red glow
}

// ==================== Component Props ====================

/**
 * Props for the EmptyState component
 *
 * Extends CVA variants for type-safe variant props (variant, size).
 * Provides comprehensive configuration for content, styling, actions, and accessibility.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EmptyState
 *   title="No data available"
 *   description="Start by adding your first item"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With icon and action
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="Your inbox is empty"
 *   primaryAction={{
 *     label: "Compose",
 *     icon: Plus,
 *     onClick: handleCompose
 *   }}
 * />
 * ```
 */
interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  // ==================== Content ====================

  /**
   * Main heading text (required)
   *
   * The primary message shown to the user. Should be concise and descriptive.
   * This text is also used for accessibility (aria-label) if not overridden.
   *
   * @example "No competitors added" | "Search returned no results" | "Upload failed"
   */
  title: string

  /**
   * Supporting description text (optional)
   *
   * Additional context or instructions for the user. Can explain why the
   * empty state occurred or suggest next steps.
   *
   * @example "Add competitors to start tracking their performance"
   * @example "Try adjusting your filters or search terms"
   */
  description?: string

  /**
   * Icon to display (lucide-react component)
   *
   * Visual element displayed above the title. Use icons that clearly
   * represent the empty state (e.g., Inbox, Users, Search, AlertCircle).
   *
   * @example Inbox | Users | Search | Database | FolderOpen
   */
  icon?: LucideIcon

  // ==================== Variants ====================

  /**
   * Color theme for icon and visual accents
   *
   * Controls the color scheme of the icon container and optional glow effect.
   * Choose themes that match the semantic meaning of the empty state.
   *
   * - `default`: Neutral gray (most common, general purpose)
   * - `primary`: Teal/cyan (branded, positive actions)
   * - `success`: Green (completed, positive states)
   * - `warning`: Yellow/amber (caution, attention needed)
   * - `error`: Red (errors, failures, destructive states)
   * - `muted`: Very subtle gray (low-priority states)
   *
   * @default "default"
   * @example "primary" // For "Add new item" states
   * @example "error" // For error messages
   */
  theme?: "default" | "primary" | "success" | "warning" | "error" | "muted"

  // ==================== Actions ====================

  /**
   * Primary call-to-action button
   *
   * The main action the user should take. Visually prominent.
   * Typically used for creation, retry, or navigation actions.
   *
   * @example
   * ```tsx
   * primaryAction={{
   *   label: "Add Competitor",
   *   icon: Plus,
   *   onClick: () => setModalOpen(true),
   *   variant: "default"
   * }}
   * ```
   */
  primaryAction?: EmptyStatePrimaryAction

  /**
   * Secondary/alternative action button
   *
   * An optional supporting action. Visually less prominent than primary.
   * Typically used for "Learn more", "Dismiss", or alternative paths.
   *
   * @example
   * ```tsx
   * secondaryAction={{
   *   label: "Learn More",
   *   icon: ExternalLink,
   *   onClick: () => window.open('/docs'),
   *   variant: "ghost"
   * }}
   * ```
   */
  secondaryAction?: EmptyStateSecondaryAction

  // ==================== Layout ====================

  /**
   * Minimum height override
   *
   * Custom minimum height as a CSS value. Overrides the default size-based
   * minimum height. Useful for matching specific layout requirements.
   *
   * @example "400px" | "50vh" | "100%"
   */
  minHeight?: string

  /**
   * Maximum content width override
   *
   * Custom maximum width as a CSS value. Overrides the default size-based
   * max width. Use to control text line length for readability.
   *
   * @example "max-w-xl" | "max-w-2xl"
   */
  maxWidth?: string

  /**
   * Additional CSS classes for the container
   *
   * Merge custom Tailwind classes with the component's default classes.
   * Useful for margin, padding, or responsive adjustments.
   *
   * @example "mt-8 px-4" | "lg:min-h-[500px]"
   */
  className?: string

  // ==================== Animation ====================

  /**
   * Enable animated glow effect on icon
   *
   * Controls the pulsing radial gradient glow around the icon.
   * Auto-enabled for primary, success, warning, and error themes
   * when using the default variant.
   *
   * @default undefined (auto-determined based on variant and theme)
   * @example true // Force enable glow
   * @example false // Force disable glow
   */
  withGlow?: boolean

  /**
   * Custom glow color (CSS color value)
   *
   * Override the default theme-based glow color with a custom RGBA value.
   * Only applies when `withGlow` is enabled.
   *
   * @example "rgba(255, 0, 0, 0.4)" // Custom red glow
   */
  glowColor?: string

  // ==================== Accessibility ====================

  /**
   * ARIA label for the container
   *
   * Accessible label read by screen readers. If not provided, falls back
   * to the `title` prop. Override to provide more context for assistive tech.
   *
   * @default title prop value
   * @example "No search results found for 'React'"
   * @example "Empty shopping cart"
   */
  ariaLabel?: string

  /**
   * ARIA role for the container
   *
   * Semantic role that describes the empty state to assistive technologies.
   * - `region`: Generic landmark (default, most common)
   * - `status`: Live region for status updates (e.g., loading states)
   * - `alert`: Important, time-sensitive information (e.g., errors)
   *
   * @default "region"
   * @example "status" // For LoadingState
   * @example "alert" // For ErrorState
   */
  role?: "status" | "alert" | "region"

  /**
   * ARIA live region politeness
   *
   * Controls how assertively screen readers announce changes.
   * - `polite`: Announce when convenient (default, least disruptive)
   * - `assertive`: Interrupt to announce immediately (for errors)
   * - `off`: Don't announce changes
   *
   * @default "polite"
   * @example "assertive" // For critical errors
   * @example "off" // For static empty states
   */
  ariaLive?: "polite" | "assertive" | "off"

  /**
   * ID for the container element
   *
   * Unique identifier for the root element. Useful for linking labels,
   * scroll targets, or testing selectors.
   *
   * @example "competitors-empty-state" | "search-no-results"
   */
  id?: string

  // ==================== Advanced ====================

  /**
   * Custom icon container class
   *
   * Additional classes for the icon container wrapper.
   * Useful for custom sizing, animations, or positioning.
   *
   * @example "animate-bounce" | "scale-110"
   */
  iconContainerClassName?: string

  /**
   * Custom title class
   *
   * Additional classes for the title/heading element.
   * Useful for custom typography or colors.
   *
   * @example "text-2xl tracking-tight" | "text-red-600"
   */
  titleClassName?: string

  /**
   * Custom description class
   *
   * Additional classes for the description paragraph.
   * Useful for custom typography or colors.
   *
   * @example "text-base" | "max-w-xs"
   */
  descriptionClassName?: string

  /**
   * Custom actions container class
   *
   * Additional classes for the actions button container.
   * Useful for custom layouts or spacing.
   *
   * @example "flex-col" | "gap-4 w-full"
   */
  actionsClassName?: string
}

// ==================== Main Component ====================

/**
 * EmptyState Component
 *
 * A unified, accessible component for displaying empty states, no-data scenarios,
 * and placeholder content with consistent messaging, illustrations, and actions.
 *
 * ## Features
 * - 🎨 **Multiple Variants**: Default, compact, inline, and card layouts
 * - 📏 **Size Options**: Small, medium, and large (affects spacing, typography, icons)
 * - 🎯 **Theme System**: 6 semantic themes (default, primary, success, warning, error, muted)
 * - ✨ **Animated Glow**: Optional pulsing gradient effect on icon
 * - ♿ **Accessibility**: Full ARIA support with roles, labels, and live regions
 * - 🔘 **Action Buttons**: Primary and secondary actions with icons and loading states
 * - 🎭 **Flexible Icons**: Any lucide-react icon with size and color variants
 * - 📱 **Responsive**: Adapts to mobile and desktop with breakpoint-aware layouts
 *
 * ## Accessibility Features
 * - Semantic HTML with proper heading hierarchy (`<section>`, `<h3>`, `<p>`)
 * - Configurable ARIA roles (region, status, alert) for different contexts
 * - ARIA live regions (polite, assertive) for dynamic content announcements
 * - ARIA labels derived from title or customizable for screen readers
 * - Icon containers marked as `aria-hidden` to avoid redundant announcements
 * - Button labels for all action elements
 * - Keyboard accessible - all actions are focusable and operable via keyboard
 *
 * ## Usage Guidelines
 * - Use `default` variant for most empty states (centered, vertical layout)
 * - Use `inline` variant for horizontal layouts in sidebars or narrow spaces
 * - Use `compact` variant when vertical space is limited
 * - Use `card` variant to visually separate the empty state from content
 * - Choose themes that match semantic meaning (error = red, success = green)
 * - Enable glow effect for emphasis on key empty states (auto-enabled for certain themes)
 * - Always provide a clear title - this is the primary message users see
 * - Use description to provide context or suggest next actions
 * - Include primary action for empty states where users can take action
 * - Use secondary action sparingly for alternative paths or dismissals
 *
 * @example
 * ```tsx
 * // Basic usage - minimal props
 * <EmptyState
 *   title="No data available"
 *   description="Start by adding your first item"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Standard empty state with icon and action
 * <EmptyState
 *   icon={Users}
 *   title="No competitors added"
 *   description="Add competitors to start tracking their performance"
 *   primaryAction={{
 *     label: "Add Competitor",
 *     icon: Plus,
 *     onClick: handleAdd,
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Multiple sizes
 * <EmptyState
 *   size="sm"  // Compact for sidebars
 *   icon={Search}
 *   title="No results"
 *   description="Try different keywords"
 * />
 *
 * <EmptyState
 *   size="lg"  // Large for main content areas
 *   icon={Database}
 *   title="Database is empty"
 *   description="Import data to get started"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Different variants
 * <EmptyState
 *   variant="inline"  // Horizontal layout
 *   icon={Filter}
 *   title="No filters applied"
 *   description="Add filters to refine results"
 * />
 *
 * <EmptyState
 *   variant="card"  // Card with background
 *   icon={Shield}
 *   title="Premium feature"
 *   description="Upgrade to unlock this feature"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Theme variations
 * <EmptyState
 *   theme="success"
 *   icon={CheckCircle}
 *   title="All caught up!"
 *   description="You've completed all tasks"
 * />
 *
 * <EmptyState
 *   theme="error"
 *   icon={AlertCircle}
 *   title="Failed to load"
 *   description="An error occurred while fetching data"
 *   primaryAction={{
 *     label: "Retry",
 *     icon: RotateCw,
 *     onClick: handleRetry
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With both actions
 * <EmptyState
 *   icon={FileText}
 *   title="No documents"
 *   description="Upload documents to start organizing"
 *   primaryAction={{
 *     label: "Upload Document",
 *     icon: Upload,
 *     onClick: handleUpload,
 *     variant: "default"
 *   }}
 *   secondaryAction={{
 *     label: "Browse Templates",
 *     icon: Grid,
 *     onClick: handleBrowse,
 *     variant: "ghost"
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Async action with loading state
 * const [loading, setLoading] = useState(false)
 *
 * <EmptyState
 *   icon={Cloud}
 *   title="Not synced"
 *   description="Sync your data with the cloud"
 *   primaryAction={{
 *     label: "Sync Now",
 *     icon: RefreshCw,
 *     onClick: async () => {
 *       setLoading(true)
 *       await syncData()
 *       setLoading(false)
 *     },
 *     loading
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Custom styling and glow
 * <EmptyState
 *   icon={Star}
 *   title="No favorites"
 *   description="Star items to save them here"
 *   theme="primary"
 *   withGlow={true}  // Enable animated glow
 *   size="lg"
 *   className="my-8"  // Custom spacing
 *   iconContainerClassName="animate-pulse"  // Custom animation
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Accessibility customization for error
 * <EmptyState
 *   icon={XCircle}
 *   title="Upload failed"
 *   description="The file could not be uploaded"
 *   theme="error"
 *   role="alert"  // Screen reader announces immediately
 *   ariaLive="assertive"  // High priority announcement
 *   ariaLabel="Upload failed: The file could not be uploaded"
 *   primaryAction={{
 *     label: "Try Again",
 *     onClick: handleRetry
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Loading state (consider using LoadingState component instead)
 * <EmptyState
 *   icon={Loader2}
 *   title="Loading..."
 *   theme="primary"
 *   role="status"
 *   ariaLive="polite"
 *   iconContainerClassName="animate-spin"
 * />
 * ```
 */
function EmptyState({
  // Content
  title,
  description,
  icon: Icon,

  // Variants
  variant = "default",
  size = "md",
  theme = "default",

  // Actions
  primaryAction,
  secondaryAction,

  // Layout
  minHeight,
  maxWidth,
  className,

  // Animation
  withGlow,
  glowColor,

  // Accessibility
  ariaLabel,
  role = "region",
  ariaLive = "polite",
  id,

  // Advanced
  iconContainerClassName,
  titleClassName,
  descriptionClassName,
  actionsClassName,
}: EmptyStateProps) {
  // Determine if glow should be shown
  const shouldShowGlow = React.useMemo(() => {
    if (withGlow !== undefined) return withGlow

    // Auto-enable glow for default variant with certain themes
    if (variant === "default" && theme && ["primary", "success", "warning", "error"].includes(theme)) {
      return true
    }

    return false
  }, [withGlow, variant, theme])

  // Get glow color
  const effectiveGlowColor = glowColor || (theme ? glowColorMap[theme] : undefined)

  // Get spacing for current size
  const spacing = spacingMap[size || "md"]

  // Determine container spacing based on variant
  const containerSpacing = variant === "inline" ? "gap-4" : spacing.container

  return (
    <section
      role={role}
      aria-label={ariaLabel || title}
      aria-live={ariaLive}
      id={id}
      className={cn(
        emptyStateVariants({ variant, size }),
        containerSpacing,
        className
      )}
      style={{ minHeight }}
    >
      {/* Content wrapper for max-width */}
      <div
        className={cn(
          variant !== "inline" && (maxWidth || maxWidthMap[size || "md"]),
          variant === "inline" && "flex items-center gap-4 flex-1"
        )}
      >
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              variant === "inline" ? "flex-shrink-0" : "mx-auto",
              !shouldShowGlow && "relative"
            )}
            aria-hidden="true"
          >
            {shouldShowGlow ? (
              <div className="relative" style={{ width: "fit-content", height: "fit-content" }}>
                {/* Glow layer */}
                <div
                  className="absolute inset-0 rounded-full opacity-20"
                  style={{
                    background: effectiveGlowColor
                      ? `radial-gradient(circle, ${effectiveGlowColor} 0%, transparent 70%)`
                      : undefined,
                    filter: "blur(20px)",
                    animation: "empty-state-glow-pulse 3s ease-in-out infinite",
                  }}
                />

                {/* Icon container */}
                <div
                  className={cn(
                    iconContainerVariants({ size, theme }),
                    iconContainerClassName
                  )}
                >
                  <Icon className={cn(iconSizeMap[size || "md"], iconVariants({ theme }))} />
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  iconContainerVariants({ size, theme }),
                  iconContainerClassName
                )}
              >
                <Icon className={cn(iconSizeMap[size || "md"], iconVariants({ theme }))} />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            variant === "inline" ? "flex-1" : "",
            spacing.content
          )}
        >
          <h3 className={cn(titleVariants({ size }), titleClassName)}>{title}</h3>
          {description && (
            <p className={cn(descriptionVariants({ size }), descriptionClassName)}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center",
              spacing.actions,
              variant === "inline" ? "flex-shrink-0" : "",
              actionsClassName
            )}
          >
            {primaryAction && (
              <Button
                variant={primaryAction.variant || "default"}
                size={buttonSizeMap[size || "md"]}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                aria-label={primaryAction.label}
              >
                {primaryAction.icon && <primaryAction.icon />}
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || "outline"}
                size={buttonSizeMap[size || "md"]}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled || secondaryAction.loading}
                aria-label={secondaryAction.label}
              >
                {secondaryAction.icon && <secondaryAction.icon />}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ==================== Exports ====================

export { EmptyState, emptyStateVariants }
export type {
  EmptyStateProps,
  EmptyStateAction,
  EmptyStatePrimaryAction,
  EmptyStateSecondaryAction,
}
