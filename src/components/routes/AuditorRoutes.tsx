import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const EnhancedAuditorDashboard = lazy(() => import('@/pages/auditor/EnhancedAuditorDashboard'));
const AssessmentManagement = lazy(() => import('@/pages/auditor/AssessmentManagement'));
const AssessmentCalendar = lazy(() => import('@/pages/auditor/AssessmentCalendar'));
const OnlineAssessment = lazy(() => import('@/pages/auditor/OnlineAssessment'));
const AssessmentReport = lazy(() => import('@/pages/auditor/AssessmentReport'));
const AccountSettings = lazy(() => import('@/pages/applicant/AccountSettings'));
const ModuleDashboard = lazy(() => import('@/pages/modules/ModuleDashboard'));

// Module Components
const ELearningModule = lazy(() => import('@/components/modules/elearning/ELearningModule').then(module => ({ default: module.ELearningModule })));
const EnhancedDocumentManager = lazy(() => import('@/components/modules/documents/EnhancedDocumentManager').then(module => ({ default: module.EnhancedDocumentManager })));
const NotificationCenter = lazy(() => import('@/components/modules/notifications/NotificationCenter').then(module => ({ default: module.NotificationCenter })));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));

const AuditorRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<EnhancedAuditorDashboard />} />
        <Route path="modules" element={<ModuleDashboard />} />
        <Route path="assessments" element={<AssessmentManagement />} />
        <Route path="assessment-calendar" element={<AssessmentCalendar />} />
        <Route path="online-assessment" element={<OnlineAssessment />} />
        <Route path="assessment-report" element={<AssessmentReport />} />
        <Route path="settings" element={<AccountSettings />} />
        
        {/* Module Routes */}
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
            <AIChatbot userRole="auditor" />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
};

export default AuditorRoutes;