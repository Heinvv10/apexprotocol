/**
 * Empty State Examples
 *
 * Pre-configured empty state components for common use cases throughout the application.
 * These examples demonstrate best practices and provide ready-to-use implementations
 * that can be directly imported or used as reference for custom empty states.
 *
 * @example
 * ```tsx
 * import { NoCompetitorsState } from '@/components/ui/empty-states/examples'
 *
 * // Use directly
 * <NoCompetitorsState onAddCompetitor={handleAdd} />
 *
 * // Or customize with additional props
 * <NoCompetitorsState
 *   onAddCompetitor={handleAdd}
 *   size="lg"
 *   className="my-8"
 * />
 * ```
 */

import * as React from "react"
import {
  Users,
  Lightbulb,
  Database,
  Search,
  ShieldAlert,
  WifiOff,
  Plus,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"

import { EmptyState, EmptyStateProps } from "../empty-state"

// ==================== No Competitors ====================

/**
 * Props for NoCompetitorsState component
 */
export interface NoCompetitorsStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description' | 'theme' | 'primaryAction'> {
  /**
   * Callback when user clicks "Add Competitor" button
   */
  onAddCompetitor?: () => void

  /**
   * Custom title override
   * @default "Track Your Competitors"
   */
  title?: string

  /**
   * Custom description override
   * @default "Add competitors to monitor their GEO scores, AI mentions, and market positioning over time."
   */
  description?: string

  /**
   * Custom action label
   * @default "Add Competitor"
   */
  actionLabel?: string
}

/**
 * NoCompetitorsState Component
 *
 * Empty state for when a brand has no competitors being tracked.
 * Encourages users to add their first competitor with a clear call-to-action.
 *
 * @example
 * ```tsx
 * <NoCompetitorsState
 *   onAddCompetitor={() => setModalOpen(true)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Large variant for main content area
 * <NoCompetitorsState
 *   onAddCompetitor={handleAdd}
 *   size="lg"
 * />
 * ```
 */
export function NoCompetitorsState({
  onAddCompetitor,
  title = "Track Your Competitors",
  description = "Add competitors to monitor their GEO scores, AI mentions, and market positioning over time.",
  actionLabel = "Add Competitor",
  ...props
}: NoCompetitorsStateProps) {
  return (
    <EmptyState
      icon={Users}
      title={title}
      description={description}
      theme="primary"
      primaryAction={onAddCompetitor ? {
        label: actionLabel,
        icon: Plus,
        onClick: onAddCompetitor,
      } : undefined}
      {...props}
    />
  )
}

// ==================== No Recommendations ====================

/**
 * Props for NoRecommendationsState component
 */
export interface NoRecommendationsStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description' | 'theme'> {
  /**
   * Custom title override
   * @default "No Recommendations Yet"
   */
  title?: string

  /**
   * Custom description override
   * @default "We're analyzing your data. Check back soon for personalized insights and recommendations."
   */
  description?: string

  /**
   * Optional callback when user clicks "Refresh" button
   */
  onRefresh?: () => void

  /**
   * Custom refresh button label
   * @default "Refresh"
   */
  refreshLabel?: string
}

/**
 * NoRecommendationsState Component
 *
 * Empty state for when no recommendations are available yet.
 * Informs users that analysis is in progress or no insights are available.
 *
 * @example
 * ```tsx
 * <NoRecommendationsState />
 * ```
 *
 * @example
 * ```tsx
 * // With refresh action
 * <NoRecommendationsState
 *   onRefresh={handleRefresh}
 * />
 * ```
 */
export function NoRecommendationsState({
  title = "No Recommendations Yet",
  description = "We're analyzing your data. Check back soon for personalized insights and recommendations.",
  onRefresh,
  refreshLabel = "Refresh",
  ...props
}: NoRecommendationsStateProps) {
  return (
    <EmptyState
      icon={Lightbulb}
      title={title}
      description={description}
      theme="default"
      primaryAction={onRefresh ? {
        label: refreshLabel,
        icon: RefreshCw,
        onClick: onRefresh,
      } : undefined}
      {...props}
    />
  )
}

// ==================== No Data ====================

/**
 * Props for NoDataState component
 */
export interface NoDataStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description' | 'theme'> {
  /**
   * Custom title override
   * @default "No Data Available"
   */
  title?: string

  /**
   * Custom description override
   * @default "There is no data to display at this time."
   */
  description?: string

  /**
   * Optional primary action callback (e.g., "Import Data", "Get Started")
   */
  onPrimaryAction?: () => void

  /**
   * Label for primary action button
   * @default "Get Started"
   */
  primaryActionLabel?: string
}

/**
 * NoDataState Component
 *
 * Generic empty state for when no data is available.
 * Versatile component that can be used across different contexts.
 *
 * @example
 * ```tsx
 * <NoDataState />
 * ```
 *
 * @example
 * ```tsx
 * // With custom action
 * <NoDataState
 *   title="No reports generated"
 *   description="Create your first report to see analytics"
 *   onPrimaryAction={handleCreateReport}
 *   primaryActionLabel="Create Report"
 * />
 * ```
 */
export function NoDataState({
  title = "No Data Available",
  description = "There is no data to display at this time.",
  onPrimaryAction,
  primaryActionLabel = "Get Started",
  ...props
}: NoDataStateProps) {
  return (
    <EmptyState
      icon={Database}
      title={title}
      description={description}
      theme="muted"
      primaryAction={onPrimaryAction ? {
        label: primaryActionLabel,
        onClick: onPrimaryAction,
      } : undefined}
      {...props}
    />
  )
}

// ==================== Search No Results ====================

/**
 * Props for SearchNoResultsState component
 */
export interface SearchNoResultsStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description' | 'theme'> {
  /**
   * The search query that returned no results
   * Used to provide context in the description
   */
  searchQuery?: string

  /**
   * Custom title override
   * @default "No Results Found"
   */
  title?: string

  /**
   * Custom description override
   * Falls back to a contextual message with searchQuery if provided
   */
  description?: string

  /**
   * Optional callback to clear/reset search
   */
  onClearSearch?: () => void

  /**
   * Label for clear search button
   * @default "Clear Search"
   */
  clearLabel?: string
}

/**
 * SearchNoResultsState Component
 *
 * Empty state for when a search query returns no results.
 * Provides helpful guidance and option to clear the search.
 *
 * @example
 * ```tsx
 * <SearchNoResultsState
 *   searchQuery="acme corp"
 *   onClearSearch={() => setQuery('')}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Simple usage without search context
 * <SearchNoResultsState
 *   title="No matches"
 *   description="Try different keywords or filters"
 * />
 * ```
 */
export function SearchNoResultsState({
  searchQuery,
  title = "No Results Found",
  description,
  onClearSearch,
  clearLabel = "Clear Search",
  ...props
}: SearchNoResultsStateProps) {
  // Auto-generate contextual description if searchQuery is provided
  const autoDescription = searchQuery
    ? `No results found for "${searchQuery}". Try adjusting your search terms or filters.`
    : "Try adjusting your search terms or filters to find what you're looking for."

  return (
    <EmptyState
      icon={Search}
      title={title}
      description={description || autoDescription}
      theme="default"
      primaryAction={onClearSearch ? {
        label: clearLabel,
        onClick: onClearSearch,
        variant: "outline",
      } : undefined}
      {...props}
    />
  )
}

// ==================== Permission Denied ====================

/**
 * Props for PermissionDeniedState component
 */
export interface PermissionDeniedStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description' | 'theme'> {
  /**
   * Custom title override
   * @default "Access Denied"
   */
  title?: string

  /**
   * Custom description override
   * @default "You don't have permission to access this content. Contact your administrator if you need access."
   */
  description?: string

  /**
   * Optional callback to navigate away (e.g., "Go Back", "Go to Dashboard")
   */
  onNavigateAway?: () => void

  /**
   * Label for navigate away button
   * @default "Go Back"
   */
  navigateLabel?: string

  /**
   * Optional callback for "Request Access" action
   */
  onRequestAccess?: () => void

  /**
   * Label for request access button
   * @default "Request Access"
   */
  requestLabel?: string
}

/**
 * PermissionDeniedState Component
 *
 * Empty state for permission errors and access restrictions.
 * Clearly communicates access limitations and provides navigation options.
 *
 * @example
 * ```tsx
 * <PermissionDeniedState
 *   onNavigateAway={() => navigate('/dashboard')}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With request access action
 * <PermissionDeniedState
 *   title="Premium Feature"
 *   description="Upgrade to access advanced analytics and insights."
 *   onNavigateAway={() => navigate('/dashboard')}
 *   navigateLabel="Go to Dashboard"
 *   onRequestAccess={() => navigate('/pricing')}
 *   requestLabel="View Plans"
 * />
 * ```
 */
export function PermissionDeniedState({
  title = "Access Denied",
  description = "You don't have permission to access this content. Contact your administrator if you need access.",
  onNavigateAway,
  navigateLabel = "Go Back",
  onRequestAccess,
  requestLabel = "Request Access",
  ...props
}: PermissionDeniedStateProps) {
  return (
    <EmptyState
      icon={ShieldAlert}
      title={title}
      description={description}
      theme="warning"
      primaryAction={onNavigateAway ? {
        label: navigateLabel,
        icon: ArrowLeft,
        onClick: onNavigateAway,
        variant: "outline",
      } : undefined}
      secondaryAction={onRequestAccess ? {
        label: requestLabel,
        icon: ExternalLink,
        onClick: onRequestAccess,
        variant: "ghost",
      } : undefined}
      {...props}
    />
  )
}

// ==================== Offline State ====================

/**
 * Props for OfflineState component
 */
export interface OfflineStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description' | 'theme'> {
  /**
   * Custom title override
   * @default "You're Offline"
   */
  title?: string

  /**
   * Custom description override
   * @default "Check your internet connection and try again."
   */
  description?: string

  /**
   * Optional callback to retry connection
   */
  onRetry?: () => void

  /**
   * Label for retry button
   * @default "Retry"
   */
  retryLabel?: string
}

/**
 * OfflineState Component
 *
 * Empty state for offline/network connection issues.
 * Informs users about connectivity problems and provides retry option.
 *
 * @example
 * ```tsx
 * <OfflineState
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom messaging for specific feature
 * <OfflineState
 *   title="Connection Lost"
 *   description="Unable to sync your data. Please check your internet connection."
 *   onRetry={handleReconnect}
 *   retryLabel="Reconnect"
 * />
 * ```
 */
export function OfflineState({
  title = "You're Offline",
  description = "Check your internet connection and try again.",
  onRetry,
  retryLabel = "Retry",
  ...props
}: OfflineStateProps) {
  return (
    <EmptyState
      icon={WifiOff}
      title={title}
      description={description}
      theme="error"
      primaryAction={onRetry ? {
        label: retryLabel,
        icon: RefreshCw,
        onClick: onRetry,
      } : undefined}
      {...props}
    />
  )
}
