import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ==================== Action Interfaces ====================

/**
 * Base interface for action buttons in empty states
 */
interface EmptyStateAction {
  /** Button label text */
  label: string
  /** Optional icon (lucide-react component) */
  icon?: LucideIcon
  /** Click handler */
  onClick: () => void
  /** Disable the button */
  disabled?: boolean
  /** Loading state for async actions */
  loading?: boolean
}

/**
 * Primary action button configuration
 * Supports all button variants for maximum flexibility
 */
interface EmptyStatePrimaryAction extends EmptyStateAction {
  /** Button variant (default: 'default') */
  variant?: "default" | "destructive" | "outline" | "secondary"
}

/**
 * Secondary action button configuration
 * Limited to subtle variants to maintain visual hierarchy
 */
interface EmptyStateSecondaryAction extends EmptyStateAction {
  /** Button variant (default: 'outline') */
  variant?: "outline" | "ghost"
}

// ==================== CVA Variants ====================

/**
 * Container variants for the empty state component
 * Handles layout, spacing, and minimum height based on size and variant
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
 * Handles size, theme colors, borders, and backgrounds
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
 */
const iconSizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
} as const

/**
 * Spacing mapping for each size variant
 */
const spacingMap = {
  sm: {
    container: "space-y-2",
    content: "space-y-1",
    actions: "gap-2",
  },
  md: {
    container: "space-y-4",
    content: "space-y-2",
    actions: "gap-3",
  },
  lg: {
    container: "space-y-6",
    content: "space-y-3",
    actions: "gap-4",
  },
} as const

/**
 * Button size mapping for each size variant
 */
const buttonSizeMap = {
  sm: "sm" as const,
  md: "default" as const,
  lg: "lg" as const,
}

/**
 * Maximum width mapping for each size variant
 */
const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const

/**
 * Glow color mapping for each theme
 */
const glowColorMap: Record<string, string> = {
  primary: "rgba(0, 229, 204, 0.4)",
  success: "rgba(34, 197, 94, 0.4)",
  warning: "rgba(251, 191, 36, 0.4)",
  error: "rgba(239, 68, 68, 0.4)",
}

// ==================== Component Props ====================

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  // ==================== Content ====================
  /** Main heading text (required) */
  title: string

  /** Supporting description text (optional) */
  description?: string

  /** Icon to display (lucide-react component) */
  icon?: LucideIcon

  // ==================== Variants ====================
  /** Color theme (default: 'default') */
  theme?: "default" | "primary" | "success" | "warning" | "error" | "muted"

  // ==================== Actions ====================
  /** Primary call-to-action button */
  primaryAction?: EmptyStatePrimaryAction

  /** Secondary/alternative action button */
  secondaryAction?: EmptyStateSecondaryAction

  // ==================== Layout ====================
  /** Minimum height (default: varies by size) */
  minHeight?: string

  /** Maximum content width (default: varies by size) */
  maxWidth?: string

  /** Additional CSS classes */
  className?: string

  // ==================== Animation ====================
  /** Enable animated glow effect on icon (default: auto based on variant/theme) */
  withGlow?: boolean

  /** Custom glow color (CSS color value) */
  glowColor?: string

  // ==================== Accessibility ====================
  /** ARIA label for the container (default: derived from title) */
  ariaLabel?: string

  /** ARIA role (default: 'region') */
  role?: "status" | "alert" | "region"

  /** ARIA live region politeness (default: 'polite') */
  ariaLive?: "polite" | "assertive" | "off"

  /** ID for the container element */
  id?: string

  // ==================== Advanced ====================
  /** Custom icon container class */
  iconContainerClassName?: string

  /** Custom title class */
  titleClassName?: string

  /** Custom description class */
  descriptionClassName?: string

  /** Custom actions container class */
  actionsClassName?: string
}

// ==================== Main Component ====================

/**
 * EmptyState Component
 *
 * A unified, accessible component for displaying empty states, no-data scenarios,
 * and placeholder content with consistent messaging, illustrations, and actions.
 *
 * @example
 * ```tsx
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
