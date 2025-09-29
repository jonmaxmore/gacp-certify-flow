import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground',
  };

  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  );
};

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 1,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-muted rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
          }}
        />
      ))}
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  description = 'Please wait while we fetch your data.',
  className,
}) => {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center space-x-4">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};

interface LoadingPageProps {
  title?: string;
  description?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = 'Loading Application',
  description = 'Please wait while we prepare your experience.',
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

interface LoadingTableRowProps {
  columns: number;
  rows?: number;
}

export const LoadingTableRow: React.FC<LoadingTableRowProps> = ({
  columns,
  rows = 3,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <LoadingSkeleton />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Industrial-themed loading component
export const IndustrialLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="w-8 h-8 border-4 border-steel border-t-precision rounded-full animate-factory-spin" />
      <span className="text-sm font-medium text-muted-foreground">
        Processing...
      </span>
    </div>
  );
};

// Precision scanner loading animation
export const PrecisionScanner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('relative w-full h-1 bg-muted rounded overflow-hidden', className)}>
      <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-precision to-transparent animate-precision-scan" />
    </div>
  );
};