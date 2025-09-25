import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const EnhancedApplicantDashboard = lazy(() => import('@/pages/applicant/EnhancedApplicantDashboard'));
const ApplicationWizard = lazy(() => import('@/pages/applicant/ApplicationWizard'));
const ApplicationsListPage = lazy(() => import('@/pages/applicant/ApplicationsListPage'));
const ApplicationStatusPage = lazy(() => import('@/pages/applicant/ApplicationStatusPage'));
const PaymentsPage = lazy(() => import('@/pages/applicant/PaymentsPage'));
const CertificatesPage = lazy(() => import('@/pages/applicant/CertificatesPage'));
const SchedulePage = lazy(() => import('@/pages/applicant/SchedulePage'));
const AccountSettings = lazy(() => import('@/pages/applicant/AccountSettings'));
const ModuleDashboard = lazy(() => import('@/pages/modules/ModuleDashboard'));

// Module Components
const KnowledgeTestModule = lazy(() => import('@/components/modules/knowledge-test/KnowledgeTestModule').then(module => ({ default: module.KnowledgeTestModule })));
const ELearningModule = lazy(() => import('@/components/modules/elearning/ELearningModule').then(module => ({ default: module.ELearningModule })));
const EnhancedDocumentManager = lazy(() => import('@/components/modules/documents/EnhancedDocumentManager').then(module => ({ default: module.EnhancedDocumentManager })));
const NotificationCenter = lazy(() => import('@/components/modules/notifications/NotificationCenter').then(module => ({ default: module.NotificationCenter })));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));

const ApplicantRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<EnhancedApplicantDashboard />} />
        <Route path="modules" element={<ModuleDashboard />} />
        <Route path="application/new" element={<ApplicationWizard />} />
        <Route path="application/:id/edit" element={<ApplicationWizard />} />
        <Route path="applications" element={<ApplicationsListPage />} />
        <Route path="application/:id/status" element={<ApplicationStatusPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="settings" element={<AccountSettings />} />
        
        {/* Module Routes */}
        <Route path="knowledge-test" element={
          <Suspense fallback={<LoadingFallback />}>
            <KnowledgeTestModule userId="default" onTestCompleted={() => {}} />
          </Suspense>
        } />
        <Route path="elearning/*" element={
          <Suspense fallback={<LoadingFallback />}>
            <ELearningModule />
          </Suspense>
        } />
        <Route path="documents/*" element={
          <Suspense fallback={<LoadingFallback />}>
            <EnhancedDocumentManager applicationId="default" />
          </Suspense>
        } />
        <Route path="notifications/*" element={
          <Suspense fallback={<LoadingFallback />}>
            <NotificationCenter userId="default" />
          </Suspense>
        } />
        <Route path="chatbot" element={
          <Suspense fallback={<LoadingFallback />}>
            <AIChatbot userRole="applicant" />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
};

export default ApplicantRoutes;