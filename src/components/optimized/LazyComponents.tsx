import { lazy, Suspense, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Lazy-loaded components for better performance
 * Implements code splitting and reduces initial bundle size
 */

// Loading fallback component
export const LoadingFallback = memo(() => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    </CardContent>
  </Card>
));

LoadingFallback.displayName = 'LoadingFallback';

// Error boundary fallback
export const ErrorFallback = memo(({ error }: { error: Error }) => (
  <Card className="border-destructive">
    <CardContent className="p-6">
      <div className="text-center text-destructive">
        <h3 className="font-semibold mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    </CardContent>
  </Card>
));

ErrorFallback.displayName = 'ErrorFallback';

// Lazy-loaded dashboard components
export const LazyApplicantDashboard = lazy(() => 
  import('@/pages/applicant/ApplicantDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyApplicationWizard = lazy(() => 
  import('@/pages/applicant/ApplicationWizard').then(module => ({
    default: module.default
  }))
);

export const LazyPaymentsPage = lazy(() => 
  import('@/pages/applicant/PaymentsPage').then(module => ({
    default: module.default
  }))
);

export const LazyCertificatesPage = lazy(() => 
  import('@/pages/applicant/CertificatesPage').then(module => ({
    default: module.default
  }))
);

export const LazyReviewerDashboard = lazy(() => 
  import('@/pages/reviewer/ReviewerDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyAuditorDashboard = lazy(() => 
  import('@/pages/auditor/AuditorDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyAdminDashboard = lazy(() => 
  import('@/pages/admin/NewAdminDashboard').then(module => ({
    default: module.default
  }))
);

// HOC for wrapping components with Suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};