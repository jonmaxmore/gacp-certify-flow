import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingFallback, ErrorFallback } from '@/components/optimized/LazyComponents';

// Lazy load route components
const PublicRoutes = lazy(() => import('@/components/routes/PublicRoutes'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Lazy load dashboard routes
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Auth routes (standalone layout) - no lazy loading for now */}
                <Route path="/login" element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/register" element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                    <RegisterPage />
                  </Suspense>
                } />
                
                {/* Public routes with public layout */}
                <Route
                  path="/*"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                      <PublicLayout>
                        <PublicRoutes />
                      </PublicLayout>
                    </Suspense>
                  }
                />
                
                {/* Protected dashboard routes */}
                <Route
                  path="/applicant/*"
                  element={
                    <ProtectedRoute requiredRole="applicant">
                      <DashboardLayout>
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
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
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
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
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
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
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                          <LazyAdminRoutes />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              
              <Toaster />
              <SecurityMonitor />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;