import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import NotificationProvider from '@/providers/NotificationProvider';
import ChatbotProvider from '@/providers/ChatbotProvider';
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
          <NotificationProvider>
            <Router>
              <ChatbotProvider>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Protected dashboard routes - MUST come before public routes */}
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

                {/* Auth routes (standalone layout) */}
                <Route path="/login" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/register" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <RegisterPage />
                  </Suspense>
                } />
                
                {/* Public routes with public layout - MUST be last */}
                <Route
                  path="*"
                  element={
                    <PublicLayout>
                      <Suspense fallback={<LoadingFallback />}>
                        <PublicRoutes />
                      </Suspense>
                    </PublicLayout>
                  }
                />
                  </Routes>
                  
                  <Toaster />
                  <SecurityMonitor />
                </div>
              </ChatbotProvider>
            </Router>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;