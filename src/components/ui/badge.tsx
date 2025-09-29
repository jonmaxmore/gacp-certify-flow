import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        success: "status-success",
        warning: "status-warning", 
        info: "status-info",
        // GACP specific status variants
        pending: "bg-pending/10 text-pending border-pending/20",
        approved: "bg-approved/10 text-approved border-approved/20",
        certified: "bg-certified/10 text-certified border-certified/20",
        // Industrial variants
        steel: "bg-steel/10 text-steel border-steel/20",
        precision: "bg-precision/10 text-precision border-precision/20",
        safety: "bg-safety/10 text-safety border-safety/20",
        machine: "bg-machine/10 text-machine border-machine/20",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ComponentType<{ className?: string }>;
}

function Badge({ className, variant, size, icon: Icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {children}
    </div>
  );
}

// Status indicator component for visual status display
interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4',
  };

  const statusClasses = {
    active: 'bg-success',
    inactive: 'bg-muted-foreground',
    pending: 'bg-pending',
    error: 'bg-destructive',
    success: 'bg-success',
  };

  return (
    <div 
      className={cn(
        'status-indicator rounded-full',
        sizeClasses[size],
        statusClasses[status],
        status === 'pending' && 'animate-machine-pulse',
        className
      )}
    />
  );
};

export { Badge, badgeVariants, StatusIndicator };