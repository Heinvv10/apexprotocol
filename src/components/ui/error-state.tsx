import * as React from "react"
import { AlertCircle, RotateCw } from "lucide-react"

import { EmptyState, EmptyStateProps } from "./empty-state"

// ==================== ErrorState Props ====================

/**
 * Props for ErrorState component
 *
 * Extends EmptyState but omits `icon`, `theme`, and `primaryAction` which are
 * preset to AlertCircle, "error", and the retry action respectively.
 * All other EmptyState props are available (variant, size, className, etc.).
 *
 * @example
 * ```tsx
 * // Basic error state
 * <ErrorState
 *   title="Failed to load"
 *   onRetry={refetch}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With Error object
 * <ErrorState
 *   error={error}
 *   onRetry={handleRetry}
 * />
 * ```
 */
interface ErrorStateProps extends Omit<EmptyStateProps, 'icon' | 'theme' | 'primaryAction' | 'title'> {
  /**
   * Error message title
   *
   * The main error heading shown to the user. Should be concise and
   * describe what went wrong. This is also used in the ARIA label.
   *
   * @default "Something went wrong"
   * @example "Failed to load data" | "Upload failed" | "Network error"
   */
  title?: string

  /**
   * Error description
   *
   * Additional context about the error. Manually set description takes
   * precedence over the `error` prop. Can provide troubleshooting hints
   * or explain the error in user-friendly terms.
   *
   * @example "Please check your internet connection"
   * @example "The file size exceeds the 10MB limit"
   * @example "This action requires admin permissions"
   */
  description?: string

  /**
   * Retry action handler
   *
   * Function called when the user clicks the retry button. When provided,
   * displays a primary action button with RotateCw icon and the retry label.
   * Typically used to re-attempt the failed operation.
   *
   * @example () => refetch()
   * @example async () => { await retry(); toast.success('Retried!') }
   */
  onRetry?: () => void

  /**
   * Retry button label
   *
   * Custom text for the retry button. Only shown if `onRetry` is provided.
   *
   * @default "Try Again"
   * @example "Retry" | "Retry Upload" | "Reload" | "Try Again"
   */
  retryLabel?: string

  /**
   * Error object or message
   *
   * Can be an Error object or a string. If provided, the error message
   * is automatically extracted and displayed in the description.
   * The `description` prop takes precedence if both are set.
   *
   * Useful for displaying caught errors directly without manual extraction.
   *
   * @example new Error("Network request failed")
   * @example "Invalid API key"
   * @example error // From catch block
   */
  error?: Error | string

  /**
   * Dismiss action handler
   *
   * Function called when the user clicks the dismiss button. When provided,
   * displays a secondary action button with ghost variant and the dismiss label.
   * Typically used to close/hide the error state.
   *
   * @example () => setShowError(false)
   * @example () => navigate('/dashboard')
   */
  onDismiss?: () => void

  /**
   * Dismiss button label
   *
   * Custom text for the dismiss button. Only shown if `onDismiss` is provided.
   *
   * @default "Dismiss"
   * @example "Close" | "Cancel" | "Go Back" | "Dismiss"
   */
  dismissLabel?: string
}

// ==================== Main Component ====================

/**
 * ErrorState Component
 *
 * A specialized empty state component for error scenarios. Extends EmptyState
 * with error-specific defaults, retry functionality, and accessibility features.
 *
 * ## Features
 * - 🚨 **AlertCircle Icon**: Red alert icon for clear error indication
 * - 🎨 **Error Theme**: Red color scheme (error background and border)
 * - 🔄 **Retry Action**: Built-in retry button with RotateCw icon
 * - ❌ **Dismiss Action**: Optional dismiss/cancel button
 * - ♿ **Accessibility**: ARIA alert role with assertive live region
 * - 🐛 **Error Handling**: Accepts Error objects or string messages
 * - 🎯 **Auto-Configuration**: Sensible defaults for instant use
 * - 🔧 **Customizable**: All EmptyState props available for override
 *
 * ## Accessibility Features
 * - **ARIA role="alert"**: Identifies as an error alert for screen readers
 * - **ARIA live region (assertive)**: Interrupts to announce error immediately
 * - **ARIA label**: Prefixes title with "Error: " for clear context
 * - **Semantic HTML**: Uses proper section and heading elements
 * - **Clear visual indication**: Red theme provides clear error signaling
 * - **No glow effect**: Disabled to avoid unnecessary visual distraction
 * - **Keyboard accessible**: All action buttons are focusable and operable
 *
 * ## When to Use
 * - ✅ Failed API requests or network errors
 * - ✅ Form submission failures
 * - ✅ File upload/download errors
 * - ✅ Permission or authentication errors
 * - ✅ Data validation errors (after submission)
 * - ✅ Resource not found (404-like scenarios)
 * - ❌ Inline form validation (use field-level errors instead)
 * - ❌ Non-critical warnings (use warning theme or toast instead)
 *
 * ## Usage Guidelines
 * - Provide clear, user-friendly error titles (avoid technical jargon)
 * - Use descriptions to explain what went wrong and suggest solutions
 * - Always provide a retry button when the operation can be re-attempted
 * - Use dismiss button to allow users to close/navigate away from the error
 * - Leverage the `error` prop to display caught errors automatically
 * - Choose size based on context (sm for inline, lg for full-page errors)
 * - Consider logging errors to a monitoring service (e.g., Sentry)
 *
 * @example
 * ```tsx
 * // Basic usage - minimal props
 * <ErrorState
 *   title="Failed to load"
 *   onRetry={refetch}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With Error object (automatic message extraction)
 * <ErrorState
 *   error={error}
 *   onRetry={handleRetry}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom error message
 * <ErrorState
 *   title="Upload failed"
 *   description="The file size exceeds the maximum limit of 10MB."
 *   onRetry={handleRetry}
 *   onDismiss={handleDismiss}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Custom labels for domain-specific actions
 * <ErrorState
 *   title="Payment failed"
 *   error="Payment gateway timeout"
 *   onRetry={handleRetry}
 *   retryLabel="Retry Payment"
 *   onDismiss={handleDismiss}
 *   dismissLabel="Cancel"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // In a React Query error boundary
 * function CompetitorsList() {
 *   const { data, error, isError, refetch } = useQuery(
 *     'competitors',
 *     fetchCompetitors
 *   )
 *
 *   if (isError) {
 *     return (
 *       <ErrorState
 *         title="Failed to load competitors"
 *         error={error}
 *         onRetry={() => refetch()}
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
 * // With both actions
 * <ErrorState
 *   title="Connection lost"
 *   description="Unable to reach the server. Please check your internet connection."
 *   onRetry={handleReconnect}
 *   retryLabel="Reconnect"
 *   onDismiss={() => navigate('/offline')}
 *   dismissLabel="Go Offline"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Different sizes for different contexts
 * // Small - for cards or inline errors
 * <ErrorState
 *   size="sm"
 *   title="Failed to save"
 *   error="Network error"
 *   onRetry={handleSave}
 * />
 *
 * // Large - for full-page errors
 * <ErrorState
 *   size="lg"
 *   title="Page failed to load"
 *   description="We couldn't load this page. Please try again."
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Try-catch pattern
 * try {
 *   await uploadFile(file)
 * } catch (error) {
 *   return (
 *     <ErrorState
 *       title="Upload failed"
 *       error={error}
 *       onRetry={() => uploadFile(file)}
 *       onDismiss={() => setFile(null)}
 *     />
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Custom variant (compact for modals)
 * <ErrorState
 *   variant="compact"
 *   title="Failed to delete"
 *   description="This item cannot be deleted because it's in use."
 *   onDismiss={closeModal}
 *   dismissLabel="Close"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // 404 / Resource not found
 * <ErrorState
 *   title="Competitor not found"
 *   description="This competitor may have been deleted or you don't have access."
 *   onDismiss={() => navigate('/competitors')}
 *   dismissLabel="Back to List"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Permission error
 * <ErrorState
 *   title="Access denied"
 *   description="You don't have permission to perform this action."
 *   onDismiss={() => navigate('/dashboard')}
 *   dismissLabel="Go to Dashboard"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom styling
 * <ErrorState
 *   title="Critical error"
 *   error={criticalError}
 *   onRetry={handleRetry}
 *   className="min-h-screen"
 *   size="lg"
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
