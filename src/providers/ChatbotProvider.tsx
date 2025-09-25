import React from 'react';
import AIChatbot from '@/components/ai/AIChatbot';
import { useAuth } from '@/providers/AuthProvider';

interface ChatbotProviderProps {
  children: React.ReactNode;
  context?: {
    currentStep?: string;
    applicationId?: string;
    rejectionCount?: number;
    paymentStatus?: string;
    currentPage?: string;
  };
}

const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ 
  children, 
  context 
}) => {
  const { user } = useAuth();
  
  const handleChatbotAction = (action: string, data?: any) => {
    console.log('Chatbot action:', action, data);
    
    // Handle different actions based on user role and current context
    switch (action) {
      case 'show_documents':
        // Navigate to documents page or show modal
        if (context?.currentPage !== 'documents') {
          window.location.href = '/applicant/applications';
        }
        break;
        
      case 'make_payment':
        // Navigate to payment page
        window.location.href = '/applicant/payments';
        break;
        
      case 'upload_documents':
        // Navigate to upload page
        window.location.href = '/applicant/application/new';
        break;
        
      case 'review_queue':
        // Navigate to review queue
        window.location.href = '/reviewer/queue';
        break;
        
      case 'assessment_schedule':
        // Navigate to assessment calendar
        window.location.href = '/auditor/calendar';
        break;
        
      case 'system_status':
        // Navigate to admin dashboard
        window.location.href = '/admin/dashboard';
        break;
        
      case 'user_management':
        // Navigate to user management
        window.location.href = '/admin/users';
        break;
        
      case 'contact_support':
        // Open support contact
        window.open('mailto:support@gacp.example.com', '_blank');
        break;
        
      default:
        console.log('Unhandled action:', action);
    }
  };

  const getUserRole = (): 'applicant' | 'reviewer' | 'auditor' | 'admin' => {
    return (user?.profile?.role as any) || 'applicant';
  };

  return (
    <>
      {children}
      {user && (
        <AIChatbot
          userRole={getUserRole()}
          context={context}
          onAction={handleChatbotAction}
        />
      )}
    </>
  );
};

export default ChatbotProvider;