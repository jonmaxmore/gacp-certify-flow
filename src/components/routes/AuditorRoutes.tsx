import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const AuditorDashboard = lazy(() => import('@/pages/auditor/AuditorDashboard'));
const AssessmentManagement = lazy(() => import('@/pages/auditor/AssessmentManagement'));
const AssessmentCalendar = lazy(() => import('@/pages/auditor/AssessmentCalendar'));
const OnlineAssessment = lazy(() => import('@/pages/auditor/OnlineAssessment'));
const AssessmentReport = lazy(() => import('@/pages/auditor/AssessmentReport'));

const AuditorRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<AuditorDashboard />} />
        <Route path="assessment-management" element={<AssessmentManagement />} />
        <Route path="assessments" element={<AssessmentManagement />} />
        <Route path="calendar" element={<AssessmentCalendar />} />
        <Route path="assessment/:id" element={<OnlineAssessment />} />
        <Route path="report/:id" element={<AssessmentReport />} />
      </Routes>
    </Suspense>
  );
};

export default AuditorRoutes;