import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from '@/components/optimized/LazyComponents';
import { useAuth } from '@/providers/AuthProvider';

// Lazy load all modules
const CMSModule = lazy(() => import('@/components/modules/cms/CMSModule'));
const ELearningModule = lazy(() => import('@/components/modules/elearning/ELearningModule'));
const KnowledgeTestModule = lazy(() => import('@/components/modules/knowledge-test/KnowledgeTestModule'));
const EnhancedDocumentManager = lazy(() => import('@/components/modules/documents/EnhancedDocumentManager'));
const NotificationCenter = lazy(() => import('@/components/modules/notifications/NotificationCenter'));
const PaymentModule = lazy(() => import('@/components/modules/payment/PaymentModule'));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));

// System modules
const SecurityMonitor = lazy(() => import('@/components/security/SecurityMonitor'));
const SystemTestDashboard = lazy(() => import('@/components/testing/SystemTestDashboard'));

interface ModuleRouterProps {
  basePath?: string;
}

const ModuleRouter: React.FC<ModuleRouterProps> = ({ basePath = '' }) => {
  const { user } = useAuth();
  const userRole = user?.profile?.role || 'applicant';

  const hasRole = (allowedRoles: string[]) => {
    return allowedRoles.includes(userRole);
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Learning Modules */}
        {hasRole(['applicant']) && (
          <Route 
            path={`${basePath}/knowledge-test`} 
            element={<KnowledgeTestModule />} 
          />
        )}
        
        {hasRole(['applicant', 'reviewer', 'auditor', 'admin']) && (
          <Route 
            path={`${basePath}/elearning/*`} 
            element={<ELearningModule />} 
          />
        )}

        {/* Content Management */}
        {hasRole(['admin']) && (
          <Route 
            path={`${basePath}/cms/*`} 
            element={<CMSModule />} 
          />
        )}

        {/* Document Management */}
        {hasRole(['applicant', 'reviewer', 'auditor', 'admin']) && (
          <Route 
            path={`${basePath}/documents/*`} 
            element={<EnhancedDocumentManager />} 
          />
        )}

        {/* Notifications */}
        {hasRole(['applicant', 'reviewer', 'auditor', 'admin']) && (
          <Route 
            path={`${basePath}/notifications/*`} 
            element={<NotificationCenter />} 
          />
        )}

        {/* Payment Module */}
        {hasRole(['applicant']) && (
          <Route 
            path={`${basePath}/payment-module/*`} 
            element={<PaymentModule applicationId="default" />} 
          />
        )}

        {/* AI Chatbot */}
        {hasRole(['applicant', 'reviewer', 'auditor', 'admin']) && (
          <Route 
            path={`${basePath}/chatbot`} 
            element={<AIChatbot />} 
          />
        )}

        {/* System Modules (Admin only) */}
        {hasRole(['admin']) && (
          <>
            <Route 
              path={`${basePath}/security-monitor`} 
              element={<SecurityMonitor />} 
            />
            <Route 
              path={`${basePath}/system-test`} 
              element={<SystemTestDashboard />} 
            />
          </>
        )}
      </Routes>
    </Suspense>
  );
};

export default ModuleRouter;