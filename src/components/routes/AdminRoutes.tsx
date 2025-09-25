import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const EnhancedAdminDashboard = lazy(() => import('@/pages/admin/EnhancedAdminDashboard'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ProductManagement = lazy(() => import('@/pages/admin/ProductManagement'));
const CertificateManagement = lazy(() => import('@/pages/admin/CertificateManagement'));
const SystemSettings = lazy(() => import('@/pages/admin/SystemSettings'));
const PlatformAnalytics = lazy(() => import('@/pages/admin/PlatformAnalytics'));
const AdminApplicationsHistoryPage = lazy(() => import('@/pages/admin/AdminApplicationsHistoryPage'));
const AccountSettings = lazy(() => import('@/pages/applicant/AccountSettings'));
const ModuleDashboard = lazy(() => import('@/pages/modules/ModuleDashboard'));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));

const AdminRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<EnhancedAdminDashboard />} />
        <Route path="modules" element={<ModuleDashboard />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="product-management" element={<ProductManagement />} />
        <Route path="certificate-management" element={<CertificateManagement />} />
        <Route path="system-settings" element={<SystemSettings />} />
        <Route path="platform-analytics" element={<PlatformAnalytics />} />
        <Route path="applications-history" element={<AdminApplicationsHistoryPage />} />
        <Route path="settings" element={<AccountSettings />} />
        
        {/* Module Routes */}
        <Route path="chatbot" element={
          <Suspense fallback={<LoadingFallback />}>
            <AIChatbot userRole="admin" />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;