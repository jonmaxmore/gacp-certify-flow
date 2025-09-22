import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        pending: "border-transparent bg-pending text-warning-foreground",
        approved: "border-transparent bg-approved text-success-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        draft: "border-muted-foreground/20 bg-background text-muted-foreground",
        review: "border-secondary/20 bg-secondary/10 text-secondary-foreground",
        revision: "border-warning/20 bg-warning/10 text-warning-foreground",
        online: "border-primary/20 bg-primary/10 text-primary-foreground",
        onsite: "border-primary/20 bg-primary/20 text-primary-foreground",
        certified: "border-success/20 bg-success text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  );
}

export { StatusBadge, statusBadgeVariants };