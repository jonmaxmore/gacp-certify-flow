import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusIndicatorVariants = cva(
  "status-indicator transition-smooth",
  {
    variants: {
      status: {
        active: "bg-success shadow-[0_0_8px_theme(colors.success.DEFAULT)]",
        inactive: "bg-steel-light",
        warning: "bg-warning shadow-[0_0_8px_theme(colors.warning.DEFAULT)]",
        error: "bg-industrial shadow-[0_0_8px_theme(colors.industrial.DEFAULT)]",
        processing: "bg-precision shadow-[0_0_8px_theme(colors.precision.DEFAULT)] animate-machine-pulse",
        pending: "bg-machine animate-machine-pulse",
      },
      size: {
        sm: "w-2 h-2",
        default: "w-3 h-3",
        lg: "w-4 h-4",
        xl: "w-5 h-5",
      },
    },
    defaultVariants: {
      status: "inactive",
      size: "default",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, label, ...props }, ref) => {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={cn(statusIndicatorVariants({ status, size, className }))}
          ref={ref}
          {...props}
        />
        {label && (
          <span className="text-sm text-muted-foreground font-industrial">
            {label}
          </span>
        )}
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, statusIndicatorVariants }