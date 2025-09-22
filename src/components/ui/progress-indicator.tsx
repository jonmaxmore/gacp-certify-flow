import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressIndicatorVariants = cva(
  "relative overflow-hidden rounded-full bg-muted shadow-control",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-6",
      },
      variant: {
        default: "",
        precision: "bg-steel-light",
        industrial: "bg-steel-dark/20",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const progressFillVariants = cva(
  "h-full transition-factory rounded-full shadow-[inset_0_1px_0_hsla(0,0%,100%,0.3)]",
  {
    variants: {
      status: {
        progress: "bg-gradient-precision",
        success: "bg-gradient-to-r from-success to-success/80",
        warning: "bg-gradient-to-r from-warning to-warning/80",
        error: "bg-gradient-to-r from-industrial to-industrial/80",
      },
      animated: {
        true: "animate-precision-scan",
        false: "",
      },
    },
    defaultVariants: {
      status: "progress",
      animated: false,
    },
  }
)

export interface ProgressIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressIndicatorVariants> {
  value: number
  max?: number
  status?: "progress" | "success" | "warning" | "error"
  animated?: boolean
  showLabel?: boolean
  label?: string
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ 
    className, 
    size, 
    variant, 
    value, 
    max = 100, 
    status = "progress",
    animated = false,
    showLabel = false,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div className="space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-industrial text-muted-foreground">
              {label || "Progress"}
            </span>
            <span className="text-sm font-mono-industrial text-precision text-precision">
              {percentage.toFixed(1)}%
            </span>
          </div>
        )}
        <div
          className={cn(progressIndicatorVariants({ size, variant, className }))}
          ref={ref}
          {...props}
        >
          <div
            className={cn(progressFillVariants({ status, animated }))}
            style={{ width: `${percentage}%` }}
          />
          {animated && (
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-2 bg-white/50 animate-precision-scan" />
            </div>
          )}
        </div>
      </div>
    )
  }
)
ProgressIndicator.displayName = "ProgressIndicator"

export { ProgressIndicator, progressIndicatorVariants }