import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const appleCardVariants = cva(
  "bg-card text-card-foreground shadow-soft rounded-xl transition-all duration-300 ease-smooth",
  {
    variants: {
      variant: {
        default: "hover:shadow-medium",
        elevated: "shadow-large",
        interactive: "hover:shadow-large hover:scale-[1.02] cursor-pointer",
        glass: "glass-panel backdrop-blur-xl",
        gradient: "bg-gradient-card",
        hero: "bg-gradient-hero text-white shadow-large",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      animation: {
        none: "",
        slide: "animate-slide-up",
        fade: "animate-fade-in",
        scale: "animate-scale-in",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface AppleCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof appleCardVariants> {}

const AppleCard = React.forwardRef<HTMLDivElement, AppleCardProps>(
  ({ className, variant, size, animation, ...props }, ref) => {
    return (
      <div
        className={cn(appleCardVariants({ variant, size, animation, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
AppleCard.displayName = "AppleCard"

export { AppleCard, appleCardVariants }