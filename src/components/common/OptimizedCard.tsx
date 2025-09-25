import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OptimizedCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * Optimized card component with memoization and loading states
 * Reduces unnecessary re-renders for better performance
 */
export const OptimizedCard = memo(({ 
  title, 
  description, 
  children, 
  className, 
  loading = false, 
  error = null 
}: OptimizedCardProps) => {
  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>เกิดข้อผิดพลาด: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

OptimizedCard.displayName = 'OptimizedCard';