import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const NewAdminDashboard = lazy(() => import('@/pages/admin/NewAdminDashboard'));
const ProductManagement = lazy(() => import('@/pages/admin/ProductManagement'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const AdminApplicationsHistoryPage = lazy(() => import('@/pages/admin/AdminApplicationsHistoryPage'));
const PlatformAnalytics = lazy(() => import('@/pages/admin/PlatformAnalytics'));
const CertificateManagement = lazy(() => import('@/pages/admin/CertificateManagement'));
const SystemSettings = lazy(() => import('@/pages/admin/SystemSettings'));

const AdminRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<NewAdminDashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="applications" element={<AdminApplicationsHistoryPage />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="settings" element={<SystemSettings />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;