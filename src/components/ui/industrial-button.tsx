import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const industrialButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-mechanical focus:outline-none focus:ring-3 focus:ring-focus disabled:pointer-events-none disabled:opacity-50 text-precision",
  {
    variants: {
      variant: {
        primary: "bg-gradient-primary text-primary-foreground shadow-control hover:shadow-medium active:shadow-pressed",
        secondary: "gradient-machine border border-border text-card-foreground shadow-control hover:shadow-medium active:shadow-pressed",
        steel: "gradient-steel text-white shadow-control hover:shadow-medium active:shadow-pressed",
        precision: "gradient-precision text-white shadow-control hover:shadow-medium active:shadow-pressed",
        safety: "bg-safety text-safety-foreground shadow-control hover:opacity-90 active:shadow-pressed",
        machine: "bg-machine text-foreground shadow-control hover:opacity-90 active:shadow-pressed",
        outline: "border-2 border-primary text-primary hover:bg-primary/5 transition-quick",
        ghost: "text-foreground hover:bg-muted/50 transition-quick",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        default: "h-10 px-4 py-2 rounded-lg",
        lg: "h-12 px-6 text-lg rounded-lg",
        xl: "h-14 px-8 text-xl rounded-xl",
        icon: "h-10 w-10 rounded-lg",
      },
      industrial: {
        true: "font-mono-industrial tracking-wide",
        false: "",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      industrial: false,
    },
  }
)

export interface IndustrialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof industrialButtonVariants> {
  asChild?: boolean
}

const IndustrialButton = React.forwardRef<HTMLButtonElement, IndustrialButtonProps>(
  ({ className, variant, size, industrial, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(industrialButtonVariants({ variant, size, industrial, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
IndustrialButton.displayName = "IndustrialButton"

export { IndustrialButton, industrialButtonVariants }