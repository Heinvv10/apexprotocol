/**
 * UI Components Library
 *
 * Central export file for all UI components.
 * Each component is re-exported from its source file to maintain tree-shaking support.
 *
 * @example
 * ```tsx
 * // Import from index (all components)
 * import { Button, Input, EmptyState } from '@/components/ui'
 *
 * // Or import directly from component file (recommended for tree-shaking)
 * import { Button } from '@/components/ui/button'
 * import { EmptyState } from '@/components/ui/empty-states'
 * ```
 */

// ==================== Form Components ====================
export { Button, buttonVariants } from "./button"

export { Input } from "./input"

export { Label } from "./label"

export { Textarea } from "./textarea"

export { Switch } from "./switch"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select"

// ==================== Layout Components ====================
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu"

export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

export { Separator } from "./separator"

export { ScrollArea, ScrollBar } from "./scroll-area"

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip"

// ==================== Feedback Components ====================
export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"

export { Progress } from "./progress"

export { Skeleton, skeletonVariants, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList } from "./skeleton"
export type { SkeletonProps, SkeletonTextProps, SkeletonCardProps, SkeletonTableProps, SkeletonListProps } from "./skeleton"

// ==================== Empty State Components ====================
export { EmptyState, emptyStateVariants } from "./empty-states"
export type {
  EmptyStateProps,
  EmptyStateAction,
  EmptyStatePrimaryAction,
  EmptyStateSecondaryAction,
} from "./empty-states"

export { LoadingState } from "./empty-states"
export type { LoadingStateProps } from "./empty-states"

export { ErrorState } from "./empty-states"
export type { ErrorStateProps } from "./empty-states"
