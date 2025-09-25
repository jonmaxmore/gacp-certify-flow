import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { removeDebugLogs, collectPerformanceMetrics } from '@/utils/codeCleanup';
import { LoadingFallback, ErrorFallback } from '@/components/optimized/LazyComponents';

// Lazy load only the essential public and auth components immediately
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const CertificateVerificationPage = lazy(() => import('@/pages/public/CertificateVerificationPage'));

// Lazy load dashboard pages with chunking
const LazyApplicantRoutes = lazy(() => import('@/components/routes/ApplicantRoutes'));
const LazyReviewerRoutes = lazy(() => import('@/components/routes/ReviewerRoutes'));
const LazyAuditorRoutes = lazy(() => import('@/components/routes/AuditorRoutes'));
const LazyAdminRoutes = lazy(() => import('@/components/routes/AdminRoutes'));

// Error boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error || new Error('Unknown error')} />;
    }

    return this.props.children;
  }
}

function OptimizedApp() {
  useEffect(() => {
    // Remove debug logs in production
    removeDebugLogs();
    
    // Collect performance metrics
    const metrics = collectPerformanceMetrics();
    if (metrics && process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metrics:', metrics);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-certificate" element={<CertificateVerificationPage />} />
                  
                  {/* Protected routes with lazy loading */}
                  <Route
                    path="/applicant/*"
                    element={
                      <ProtectedRoute requiredRole="applicant">
                        <DashboardLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <LazyApplicantRoutes />
                          </Suspense>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/reviewer/*"
                    element={
                      <ProtectedRoute requiredRole="reviewer">
                        <DashboardLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <LazyReviewerRoutes />
                          </Suspense>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/auditor/*"
                    element={
                      <ProtectedRoute requiredRole="auditor">
                        <DashboardLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <LazyAuditorRoutes />
                          </Suspense>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <DashboardLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <LazyAdminRoutes />
                          </Suspense>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  
                  
                  {/* Root redirect removed - now shows homepage */}
                </Routes>
              </Suspense>
              
              <Toaster />
              <SecurityMonitor />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default OptimizedApp;