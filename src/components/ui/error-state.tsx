import * as React from "react"
import { AlertCircle, RotateCw } from "lucide-react"

import { EmptyState, EmptyStateProps } from "./empty-state"

// ==================== ErrorState Props ====================

/**
 * Props for ErrorState component
 * Extends EmptyState but omits icon, theme, and primaryAction which are preset
 */
interface ErrorStateProps extends Omit<EmptyStateProps, 'icon' | 'theme' | 'primaryAction'> {
  /** Error message title (default: "Something went wrong") */
  title?: string

  /** Error description (can include error.message) */
  description?: string

  /** Retry action handler */
  onRetry?: () => void

  /** Retry button label (default: "Try Again") */
  retryLabel?: string

  /** Show error details in description */
  error?: Error | string

  /** Dismiss action handler */
  onDismiss?: () => void

  /** Dismiss button label (default: "Dismiss") */
  dismissLabel?: string
}

// ==================== Main Component ====================

/**
 * ErrorState Component
 *
 * A specialized empty state component for error scenarios.
 * Extends EmptyState with error-specific defaults and retry functionality.
 *
 * Features:
 * - AlertCircle icon
 * - Error theme (red color scheme)
 * - Retry action support with RotateCw icon
 * - Dismiss action support
 * - Proper ARIA attributes for error states (role="alert", aria-live="assertive")
 * - Error message display (supports Error objects or strings)
 * - No glow effect
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load data"
 *   error={error}
 *   onRetry={refetch}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom error message
 * <ErrorState
 *   title="Upload failed"
 *   description="The file size exceeds the maximum limit."
 *   onRetry={handleRetry}
 *   onDismiss={handleDismiss}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With Error object
 * <ErrorState
 *   error={new Error("Network connection failed")}
 *   onRetry={handleRetry}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Custom labels
 * <ErrorState
 *   title="Payment failed"
 *   error="Payment gateway timeout"
 *   onRetry={handleRetry}
 *   retryLabel="Retry Payment"
 *   onDismiss={handleDismiss}
 *   dismissLabel="Cancel"
 * />
 * ```
 */
function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  retryLabel = "Try Again",
  onDismiss,
  dismissLabel = "Dismiss",
  ...props
}: ErrorStateProps) {
  // Derive error message from error prop or use description
  const errorMessage = React.useMemo(() => {
    if (error) {
      return typeof error === "string" ? error : error.message
    }
    return description
  }, [error, description])

  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={errorMessage}
      theme="error"
      withGlow={false}
      role="alert"
      ariaLive="assertive"
      ariaLabel={`Error: ${title}`}
      primaryAction={onRetry ? {
        label: retryLabel,
        onClick: onRetry,
        icon: RotateCw,
      } : undefined}
      secondaryAction={onDismiss ? {
        label: dismissLabel,
        onClick: onDismiss,
        variant: "ghost",
      } : undefined}
      {...props}
    />
  )
}

// ==================== Exports ====================

export { ErrorState }
export type { ErrorStateProps }
