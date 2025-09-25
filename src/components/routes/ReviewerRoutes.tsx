import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const EnhancedReviewerDashboard = lazy(() => import('@/pages/reviewer/EnhancedReviewerDashboard'));
const ReviewQueue = lazy(() => import('@/pages/reviewer/ReviewQueue'));
const ReviewDetail = lazy(() => import('@/pages/reviewer/ReviewDetail'));
const AssessmentScheduling = lazy(() => import('@/pages/reviewer/AssessmentScheduling'));
const AccountSettings = lazy(() => import('@/pages/applicant/AccountSettings'));
const ModuleDashboard = lazy(() => import('@/pages/modules/ModuleDashboard'));

// Module Components
const ELearningModule = lazy(() => import('@/components/modules/elearning/ELearningModule').then(module => ({ default: module.ELearningModule })));
const EnhancedDocumentManager = lazy(() => import('@/components/modules/documents/EnhancedDocumentManager').then(module => ({ default: module.EnhancedDocumentManager })));
const NotificationCenter = lazy(() => import('@/components/modules/notifications/NotificationCenter').then(module => ({ default: module.NotificationCenter })));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));

const ReviewerRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<EnhancedReviewerDashboard />} />
        <Route path="modules" element={<ModuleDashboard />} />
        <Route path="queue" element={<ReviewQueue />} />
        <Route path="review/:id" element={<ReviewDetail />} />
        <Route path="assessments" element={<AssessmentScheduling />} />
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
            <AIChatbot userRole="reviewer" />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
};

export default ReviewerRoutes;