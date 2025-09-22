import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ApplicantDashboard from '@/pages/applicant/ApplicantDashboard';
import ApplicationWizard from '@/pages/applicant/ApplicationWizard';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import AuditorDashboard from '@/pages/auditor/AuditorDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route
              path="/applicant/*"
              element={
                <ProtectedRoute allowedRoles={['applicant']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<ApplicantDashboard />} />
                      <Route path="application/new" element={<ApplicationWizard />} />
                      <Route path="application/:id/edit" element={<ApplicationWizard />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reviewer/*"
              element={
                <ProtectedRoute allowedRoles={['reviewer', 'admin']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<ReviewerDashboard />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/auditor/*"
              element={
                <ProtectedRoute allowedRoles={['auditor', 'admin']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<AuditorDashboard />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Root redirect based on user role */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;