import * as React from "react"
import { Loader2 } from "lucide-react"

import { EmptyState, EmptyStateProps } from "./empty-state"
import { cn } from "@/lib/utils"

// ==================== LoadingState Props ====================

/**
 * Props for LoadingState component
 * Extends EmptyState but omits icon and theme which are preset
 */
interface LoadingStateProps extends Omit<EmptyStateProps, 'icon' | 'theme'> {
  /** Loading message title (default: "Loading") */
  title?: string

  /** Loading description (optional) */
  description?: string

  /** Show spinning animation (default: true) */
  animated?: boolean

  /** Spinner size - inherits from size prop */
  size?: "sm" | "md" | "lg"
}

// ==================== Main Component ====================

/**
 * LoadingState Component
 *
 * A specialized empty state component for loading scenarios.
 * Extends EmptyState with loading-specific defaults and animations.
 *
 * Features:
 * - Animated Loader2 spinner icon
 * - Pulsing container animation
 * - Primary theme by default
 * - Proper ARIA attributes for loading states
 * - Size variants (sm, md, lg)
 *
 * @example
 * ```tsx
 * <LoadingState
 *   title="Loading recommendations"
 *   description="Analyzing your data..."
 *   size="md"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Minimal usage
 * <LoadingState />
 * ```
 *
 * @example
 * ```tsx
 * // Custom title
 * <LoadingState title="Loading competitors..." />
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
