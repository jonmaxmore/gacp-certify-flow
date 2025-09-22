import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const factoryCardVariants = cva(
  "factory-card ma-md",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-large",
        inset: "shadow-pressed bg-muted/30",
        glass: "glass-panel",
        steel: "gradient-steel text-white",
        precision: "border-2 border-precision/20 shadow-[0_0_20px_theme(colors.precision.DEFAULT/0.1)]",
      },
      size: {
        sm: "ma-sm",
        default: "ma-md",
        lg: "ma-lg",
        xl: "ma-xl",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-large hover:scale-[1.02] transition-spring",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

export interface FactoryCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof factoryCardVariants> {
  header?: React.ReactNode
  footer?: React.ReactNode
}

const FactoryCard = React.forwardRef<HTMLDivElement, FactoryCardProps>(
  ({ className, variant, size, interactive, header, footer, children, ...props }, ref) => {
    return (
      <div
        className={cn(factoryCardVariants({ variant, size, interactive, className }))}
        ref={ref}
        {...props}
      >
        {header && (
          <div className="mb-4 pb-4 border-b border-border/50">
            {header}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
        {footer && (
          <div className="mt-4 pt-4 border-t border-border/50">
            {footer}
          </div>
        )}
      </div>
    )
  }
)
FactoryCard.displayName = "FactoryCard"

export { FactoryCard, factoryCardVariants }