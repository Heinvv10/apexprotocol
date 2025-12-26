import * as React from "react"

import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  /**
   * Makes the card interactive with focus indicators and hover effects
   * Automatically detected if onClick is provided
   */
  interactive?: boolean;
  /**
   * Optional onClick handler - automatically makes card interactive
   */
  onClick?: () => void;
  /**
   * ARIA label for interactive cards
   */
  "aria-label"?: string;
  /**
   * Custom element type or component to render as (e.g., Link)
   * Defaults to "div" for non-interactive, "button" for interactive with onClick
   */
  as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, onClick, as, ...props }, ref) => {
    // Determine if card is interactive
    const isInteractive = interactive || Boolean(onClick);

    // Determine the component to render
    const Component = as || (onClick ? "button" : "div");

    // Interactive styling - add focus indicators and hover effects
    const interactiveClass = isInteractive
      ? "cursor-pointer hover:bg-card-hover transition-colors focus-ring-primary"
      : "";

    // Add proper role for interactive cards when using div or custom component
    const role = isInteractive && Component === "div" ? "button" : undefined;
    const tabIndex = isInteractive && Component === "div" ? 0 : undefined;

    return (
      <Component
        ref={ref}
        data-slot="card"
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
          interactiveClass,
          onClick && "text-left w-full", // Ensure button cards are left-aligned and full-width
          className
        )}
        onClick={onClick}
        role={role}
        tabIndex={tabIndex}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
