import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const controlPanelVariants = cva(
  "control-panel transition-smooth",
  {
    variants: {
      variant: {
        default: "shadow-panel",
        elevated: "shadow-medium",
        inset: "shadow-pressed bg-muted/50",
        glass: "glass-panel",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ControlPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof controlPanelVariants> {
  title?: string
  subtitle?: string
}

const ControlPanel = React.forwardRef<HTMLDivElement, ControlPanelProps>(
  ({ className, variant, size, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        className={cn(controlPanelVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {(title || subtitle) && (
          <div className="mb-4 pb-3 border-b border-border/50">
            {title && (
              <h3 className="font-industrial font-semibold text-foreground text-precision">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    )
  }
)
ControlPanel.displayName = "ControlPanel"

export { ControlPanel, controlPanelVariants }