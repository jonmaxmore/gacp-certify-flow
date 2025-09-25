import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

// Lazy load applicant pages
const EnhancedApplicantDashboard = lazy(() => import('@/pages/applicant/EnhancedApplicantDashboard'));
const ApplicationWizard = lazy(() => import('@/pages/applicant/ApplicationWizard'));
const ApplicationsListPage = lazy(() => import('@/pages/applicant/ApplicationsListPage'));
const PaymentsPage = lazy(() => import('@/pages/applicant/PaymentsPage'));
const CertificatesPage = lazy(() => import('@/pages/applicant/CertificatesPage'));
const SchedulePage = lazy(() => import('@/pages/applicant/SchedulePage'));
const AccountSettings = lazy(() => import('@/pages/applicant/AccountSettings'));

const ApplicantRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<EnhancedApplicantDashboard />} />
        <Route path="application/new" element={<ApplicationWizard />} />
        <Route path="application/:id/edit" element={<ApplicationWizard />} />
        <Route path="applications" element={<ApplicationsListPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="settings" element={<AccountSettings />} />
      </Routes>
    </Suspense>
  );
};

export default ApplicantRoutes;