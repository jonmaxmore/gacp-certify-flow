import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import CertificateVerificationPage from '@/pages/public/CertificateVerificationPage';
import ApplicantDashboard from '@/pages/applicant/ApplicantDashboard';
import ApplicationWizard from '@/pages/applicant/ApplicationWizard';
import PaymentsPage from '@/pages/applicant/PaymentsPage';
import CertificatesPage from '@/pages/applicant/CertificatesPage';
import CertificateManagement from '@/pages/admin/CertificateManagement';
import ApplicationsListPage from '@/pages/applicant/ApplicationsListPage';
import AdminApplicationsHistoryPage from '@/pages/admin/AdminApplicationsHistoryPage';
import SchedulePage from '@/pages/applicant/SchedulePage';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import ReviewQueue from '@/pages/reviewer/ReviewQueue';
import ReviewDetail from '@/pages/reviewer/ReviewDetail';
import AuditorDashboard from '@/pages/auditor/AuditorDashboard';
import AssessmentManagement from '@/pages/auditor/AssessmentManagement';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import NewAdminDashboard from '@/pages/admin/NewAdminDashboard';
import ProductManagement from '@/pages/admin/ProductManagement';
import PlatformAnalytics from '@/pages/admin/PlatformAnalytics';
import UserManagement from '@/pages/admin/UserManagement';
import SystemSettings from '@/pages/admin/SystemSettings';
import AssessmentCalendar from '@/pages/auditor/AssessmentCalendar';
import OnlineAssessment from '@/pages/auditor/OnlineAssessment';
import AssessmentReport from '@/pages/auditor/AssessmentReport';
import AssessmentScheduling from '@/pages/reviewer/AssessmentScheduling';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-certificate" element={<CertificateVerificationPage />} />
            
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
                      <Route path="applications" element={<ApplicationsListPage />} />
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="certificates" element={<CertificatesPage />} />
                      <Route path="schedule" element={<SchedulePage />} />
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
                      <Route path="queue" element={<ReviewQueue />} />
                      <Route path="review/:id" element={<ReviewDetail />} />
                      <Route path="assessments" element={<AssessmentScheduling />} />
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
                      <Route path="assessments" element={<AssessmentManagement />} />
                      <Route path="calendar" element={<AssessmentCalendar />} />
                      <Route path="assessment/:id" element={<OnlineAssessment />} />
                      <Route path="report/:id" element={<AssessmentReport />} />
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
                      <Route path="dashboard" element={<NewAdminDashboard />} />
                      <Route path="products" element={<ProductManagement />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="applications" element={<AdminApplicationsHistoryPage />} />
                      <Route path="analytics" element={<PlatformAnalytics />} />
                      <Route path="certificates" element={<CertificateManagement />} />
                      <Route path="settings" element={<SystemSettings />} />
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