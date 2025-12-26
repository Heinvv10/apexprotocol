/**
 * Empty States Component Library
 *
 * A unified, accessible component system for displaying empty states, loading states,
 * and error states with consistent messaging, illustrations, and call-to-action patterns.
 *
 * @example
 * ```tsx
 * import { EmptyState, LoadingState, ErrorState } from '@/components/ui/empty-states'
 *
 * // Empty state with action
 * <EmptyState
 *   icon={Users}
 *   title="No competitors added"
 *   description="Add competitors to start tracking"
 *   primaryAction={{ label: "Add Competitor", onClick: handleAdd }}
 * />
 *
 * // Loading state
 * <LoadingState title="Loading data..." />
 *
 * // Error state with retry
 * <ErrorState
 *   title="Failed to load"
 *   error={error}
 *   onRetry={refetch}
 * />
 * ```
 */

// ==================== Core Component ====================
export { EmptyState, emptyStateVariants } from "../empty-state"
export type {
  EmptyStateProps,
  EmptyStateAction,
  EmptyStatePrimaryAction,
  EmptyStateSecondaryAction,
} from "../empty-state"

// ==================== Specialized Components ====================
export { LoadingState } from "../loading-state"
export type { LoadingStateProps } from "../loading-state"

export { ErrorState } from "../error-state"
export type { ErrorStateProps } from "../error-state"
