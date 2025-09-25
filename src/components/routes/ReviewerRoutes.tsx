import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';

const EnhancedReviewerDashboard = lazy(() => import('@/pages/reviewer/EnhancedReviewerDashboard'));
const ReviewQueue = lazy(() => import('@/pages/reviewer/ReviewQueue'));
const ReviewDetail = lazy(() => import('@/pages/reviewer/ReviewDetail'));
const AssessmentScheduling = lazy(() => import('@/pages/reviewer/AssessmentScheduling'));

const ReviewerRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<EnhancedReviewerDashboard />} />
        <Route path="queue" element={<ReviewQueue />} />
        <Route path="review/:id" element={<ReviewDetail />} />
        <Route path="assessments" element={<AssessmentScheduling />} />
      </Routes>
    </Suspense>
  );
};

export default ReviewerRoutes;